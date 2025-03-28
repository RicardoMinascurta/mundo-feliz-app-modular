/**
 * Serviço para geração de PDFs a partir das imagens de documentos
 */

import { jsPDF } from 'jspdf';
import { PDFDocument, rgb } from 'pdf-lib';
import { fileStorage } from './fileStorage.js';
import { logger } from './LoggerService.js';
import { jsonData } from './JsonDataService.js';
import fs from 'fs';

// Caminhos para as declarações de consentimento
const CONSENT_FORMS = {
  ADULT: 'consent.pdf', // Declaração para maiores de idade (URL relativa ao servidor)
  MINOR: 'pdf-menores.pdf' // Declaração para menores de idade (URL relativa ao servidor)
};

// Lista de processos que são para menores
const MINOR_PROCESS_TYPES = [
  'concessaotr2estudantemenor',
  'reagrupamentofilho',
  'reagrupamentofilhomenor',
  'renovacaoestudantesecundario',
  'cplpmenor'
];

// Expressões regulares para detectar processos de menor
const MINOR_PROCESS_REGEX = [
  /menor/i,
  /secundario/i,
  /crianca/i,
  /infantil/i,
  /filho/i
];

// Lista de processos de estudante que devem usar PDF de ADULTO
// (apenas para referência - usamos uma verificação específica na função isMinorProcess)
const STUDENT_ADULT_PROCESS_TYPES = [
  'ConcessaoTREstudante',        // Concessão TR para Estudante (ADULTO/Superior)
  'ConcessaoTREstudante2',       // Concessão TR para Estudante Versão 2 (ADULTO/Superior)
  'RenovacaoEstudante',          // Renovação para Estudante (ADULTO/Superior)
  'RenovacaoTREstudante'         // Renovação TR para Estudante (ADULTO/Superior)
];

class PdfService {
  constructor() {
    this.pageWidth = 210; // A4 width in mm
    this.pageHeight = 297; // A4 height in mm
    this.margin = 10; // Margin in mm
  }

  /**
   * Verifica se um processo é para menor de idade
   * @param {string} processType - Tipo do processo
   * @returns {boolean} - Verdadeiro se for para menor de idade
   */
  isMinorProcess(processType) {
    if (!processType) return false;
    
    console.log(`PDFService: Analisando tipo de processo: "${processType}"`);
    
    // Normalizar o tipo de processo para comparação (remover espaços e converter para minúsculas)
    const normalizeString = (str) => {
      return str
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "") // Remove acentos
        .replace(/[\s\-_]+/g, ""); // Remove espaços, traços e sublinhados
    };
    
    const normalizedInput = normalizeString(processType);
    console.log(`PDFService: Tipo normalizado: "${normalizedInput}"`);
    
    // REGRA 1: Verificações específicas para processos de Estudante (Adulto vs Menor)
    // Apenas "ConcessaoTREstudanteMenor" e "RenovacaoEstudanteSecundario" são para menor
    // Os outros processos de estudante são para ADULTO
    
    // Verificar processos de Estudante para ADULTO (ensino superior)
    if (normalizedInput.includes("estudante") || normalizedInput.includes("trestudante")) {
      if (!normalizedInput.includes("menor") && !normalizedInput.includes("secundario")) {
        console.log(`PDFService: Processo de ESTUDANTE identificado como ADULTO: "${processType}"`);
        return false; // É estudante mas NÃO é menor de idade
      }
    }
    
    // REGRA 2: Verificações específicas para outros processos que NÃO são de menor
    if (normalizedInput === "concessaotr" || 
        normalizedInput === "concessaotr2" ||
        normalizedInput === "renovacaotr" ||
        normalizedInput === "cplpmaiores" ||
        normalizedInput === "reagrupamentopaimae") {
      console.log(`PDFService: Processo NÃO é de menor: "${processType}"`);
      return false;
    }
    
    // REGRA 3: Verificação baseada na lista de processos conhecidos para menor
    // Lista de processos normalizada
    const normalizedProcessTypes = MINOR_PROCESS_TYPES.map(normalizeString);
    
    // Verificar correspondência exata com a lista de processos para menor
    const isExactMatch = normalizedProcessTypes.includes(normalizedInput);
    if (isExactMatch) {
      console.log(`PDFService: Correspondência EXATA com processo de MENOR: "${processType}"`);
      return true;
    }
    
    // REGRA 4: Última verificação - procurar por palavras-chave que indicam menor
    const containsMenorKeyword = normalizedInput.includes("menor") || 
                                normalizedInput.includes("secundario") ||
                                normalizedInput.includes("tutor");
    
    console.log(`PDFService: Verificação final - contém palavras-chave de menor: ${containsMenorKeyword}`);
    return containsMenorKeyword;
  }

  /**
   * Gera um PDF a partir de todos os documentos de um processo
   * @param {string} processId - ID do processo
   * @param {string} processType - Tipo do processo
   * @returns {Promise<string>} - Caminho do arquivo PDF gerado
   */
  async generatePdfFromDocuments(processId, processType) {
    try {
      logger.info(`Gerando PDF para processo ${processId}`);
      
      // Criar estrutura de pastas para o processo
      await fileStorage.createProcessStructure(processId);
      
      // Obter os documentos do processo
      const documents = await this.getDocumentsForProcess(processId);
      
      if (!documents || documents.length === 0) {
        logger.warn(`Nenhum documento encontrado para gerar o PDF do processo ${processId}`);
        return null;
      }
      
      // Criar um novo documento PDF
      const doc = new jsPDF();
      
      // ABORDAGEM SIMPLIFICADA: Usar renderização direta para evitar problemas com URLs
      let hasAddedAtLeastOneImage = false;
      
      for (let i = 0; i < documents.length; i++) {
        const document = documents[i];
        logger.info(`Processando documento: ${document.path}`);
        
        if (i > 0 && hasAddedAtLeastOneImage) {
          doc.addPage();
        }
        
        try {
          // Obter o arquivo do servidor diretamente
          const directUrl = `http://localhost:3001/${document.path}`;
          logger.info(`Tentando carregar documento diretamente de: ${directUrl}`);
          
          // Adicionar a imagem ao PDF de forma simplificada
          try {
            // Tentar obter as dimensões da imagem
            const img = new Image();
            await new Promise((resolve, reject) => {
              img.onload = resolve;
              img.onerror = reject;
              img.src = directUrl;
            });
            
            // Calcular as dimensões mantendo a proporção
            const pageWidth = doc.internal.pageSize.getWidth();
            const pageHeight = doc.internal.pageSize.getHeight();
            const margin = 10;
            
            const maxWidth = pageWidth - 2 * margin;
            const maxHeight = pageHeight - 2 * margin;
            
            let width = img.width;
            let height = img.height;
            
            // Calcular proporção
            const ratio = width / height;
            
            // Ajustar dimensões para caber na página
            if (width > maxWidth) {
              width = maxWidth;
              height = width / ratio;
            }
            
            if (height > maxHeight) {
              height = maxHeight;
              width = height * ratio;
            }
            
            // Adicionar a imagem ao PDF, centralizada na página
            doc.addImage(
              img,
              'JPEG',
              margin + (pageWidth - 2 * margin - width) / 2,
              margin + (pageHeight - 2 * margin - height) / 2,
              width,
              height
            );
            
            hasAddedAtLeastOneImage = true;
            logger.info(`Imagem adicionada com sucesso: ${document.path}`);
          } catch (imgError) {
            logger.error(`Erro ao processar imagem ${document.path}: ${imgError.message}`);
            // Adicionar uma página com mensagem de erro
            doc.setFontSize(16);
            doc.text('Erro ao processar imagem', doc.internal.pageSize.getWidth() / 2, doc.internal.pageSize.getHeight() / 2, { align: 'center' });
          }
        } catch (docError) {
          logger.error(`Erro ao obter documento ${document.path}: ${docError.message}`);
        }
      }
      
      // Gerar nomes de arquivos únicos com timestamp
      const timestamp = new Date().toISOString().replace(/:/g, '-');
      const tempFilename = `temp_documentos_${processId}_${timestamp}.pdf`;
      const outputFilename = `documentos_${processId}_${timestamp}.pdf`;
      
      // Obter a pasta para salvar os PDFs
      const structure = await fileStorage.createProcessStructure(processId);
      const pdfFolder = structure.pdfsPath;
      logger.info(`Pasta para salvar PDFs: ${pdfFolder}`);
      
      // Salvar o PDF no disco
      const pdfBlob = doc.output('blob');
      
      logger.info(`PDF temporário gerado. Enviando diretamente para o servidor.`);
      
      // Determinar qual declaração de consentimento usar baseado no tipo de processo
      const isMinor = this.isMinorProcess(processType);
      const consentFormPath = isMinor ? CONSENT_FORMS.MINOR : CONSENT_FORMS.ADULT;
      
      logger.info(`Usando declaração de consentimento para ${isMinor ? 'MENOR' : 'ADULTO'}: ${consentFormPath}`);
      
      let finalPdfBlob;
      
      try {
        // Mesclar o PDF temporário com a declaração de consentimento
        finalPdfBlob = await this.mergePdfWithConsent(pdfBlob, consentFormPath);
        logger.info(`PDF mesclado com declaração de consentimento`);
      } catch (mergeError) {
        logger.error(`Erro ao mesclar com consentimento: ${mergeError.message}. Usando PDF sem consentimento.`);
        finalPdfBlob = pdfBlob;
      }
      
      // Em vez de salvar no IndexedDB, vamos enviar para o servidor diretamente
      const outputFilePath = `${pdfFolder}/${outputFilename}`;
      
      try {
        // Usando o método de upload para o servidor
        const base64Pdf = await this.blobToBase64(finalPdfBlob);
        
        // Enviar para o servidor
        const response = await fetch('http://localhost:3001/api/upload-pdf', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            processId,
            base64Data: base64Pdf,
            filename: outputFilename,
            path: outputFilePath
          }),
        });
        
        if (!response.ok) {
          throw new Error(`Erro ${response.status}: ${response.statusText}`);
        }
        
        const result = await response.json();
        logger.info(`PDF enviado para o servidor com sucesso: ${JSON.stringify(result)}`);
        
        // Atualizar o JSON do processo com o caminho do PDF
        try {
          await jsonData.updateProcesso(processId, {
            pdfPath: result.fileInfo.path,
          });
        } catch (jsonError) {
          logger.error(`Erro ao atualizar processo: ${jsonError.message}`);
        }
        
        logger.info(`JSON do processo atualizado com o caminho do PDF: ${result.fileInfo.path}`);
        
        // Retornar o caminho do arquivo PDF
        return outputFilePath;
      } catch (uploadError) {
        logger.error(`Erro ao enviar PDF para o servidor: ${uploadError.message}`);
        throw uploadError;
      }
    } catch (error) {
      logger.error(`Erro ao gerar PDF: ${error.message}`, error);
      throw error;
    }
  }

  /**
   * Calcula as dimensões da imagem para manter a proporção
   * @param {string} imageUrl - URL da imagem
   * @returns {Promise<{width: number, height: number}>} - Dimensões calculadas
   */
  async calculateImageDimensions(imageUrl) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const maxWidth = this.pageWidth - 2 * this.margin;
        const maxHeight = this.pageHeight - 2 * this.margin;
        
        let width = img.width;
        let height = img.height;
        
        // Calcular proporção
        const ratio = width / height;
        
        // Ajustar dimensões para caber na página
        if (width > maxWidth) {
          width = maxWidth;
          height = width / ratio;
        }
        
        if (height > maxHeight) {
          height = maxHeight;
          width = height * ratio;
        }
        
        resolve({ width, height });
      };
      
      img.onerror = reject;
      img.src = imageUrl;
    });
  }

  /**
   * Mescla o PDF dos documentos com a declaração de consentimento
   * @param {Blob} documentsPdfBlob - PDF dos documentos
   * @param {string} consentFormPath - Caminho do formulário de consentimento
   * @returns {Promise<Blob>} - PDF final mesclado
   */
  async mergePdfWithConsent(documentsPdfBlob, consentFormPath) {
    try {
      // Carregar o PDF dos documentos
      const documentsPdfBytes = await documentsPdfBlob.arrayBuffer();
      const documentsPdfDoc = await PDFDocument.load(documentsPdfBytes);
      
      // Carregar o formulário de consentimento usando fileStorage
      logger.info(`Tentando carregar o formulário de consentimento: ${consentFormPath}`);
      
      try {
        // Obter URL do arquivo - ajuste específico para arquivos na raiz
        let consentFormUrl;
        
        // Abordagem específica para arquivos de consentimento
        if (consentFormPath === 'consent.pdf' || consentFormPath === 'pdf-menores.pdf') {
          consentFormUrl = `http://localhost:3001/${consentFormPath}`;
          logger.info(`URL direta para formulário de consentimento: ${consentFormUrl}`);
        } else {
          consentFormUrl = await fileStorage.getFileUrl(consentFormPath);
          logger.info(`URL do formulário de consentimento via fileStorage: ${consentFormUrl}`);
        }
        
        // Buscar o arquivo usando fetch (compatível com navegador)
        logger.info(`Fazendo fetch para: ${consentFormUrl}`);
        const response = await fetch(consentFormUrl);
        
        if (!response.ok) {
          logger.error(`Erro HTTP ao buscar formulário: ${response.status} ${response.statusText}`);
          throw new Error(`Erro ao buscar formulário de consentimento: ${response.status}`);
        }
        
        const consentFormBlob = await response.blob();
        logger.info(`Formulário de consentimento carregado: ${consentFormBlob.size} bytes`);
        
        // Converter o Blob para ArrayBuffer
        const consentFormBytes = await consentFormBlob.arrayBuffer();
        
        if (!consentFormBytes || consentFormBytes.byteLength === 0) {
          throw new Error(`Arquivo de consentimento vazio ou inválido: ${consentFormPath}`);
        }
        
        logger.info(`Bytes do formulário de consentimento: ${consentFormBytes.byteLength}`);
        
        // Carregar o PDF de consentimento
        const consentFormDoc = await PDFDocument.load(consentFormBytes);
        logger.info(`PDF de consentimento carregado com ${consentFormDoc.getPageCount()} páginas`);
        
        // MODIFICAÇÃO: Criando um novo documento com o consentimento PRIMEIRO
        const finalPdfDoc = await PDFDocument.create();
        
        // 1. Copiar e adicionar as páginas de consentimento PRIMEIRO
        const consentPages = await finalPdfDoc.copyPages(consentFormDoc, consentFormDoc.getPageIndices());
        consentPages.forEach(page => finalPdfDoc.addPage(page));
        logger.info(`Adicionado consentimento como primeiras ${consentPages.length} páginas`);
        
        // 2. Depois adicionar as páginas do documento original
        const documentPages = await finalPdfDoc.copyPages(documentsPdfDoc, documentsPdfDoc.getPageIndices());
        documentPages.forEach(page => finalPdfDoc.addPage(page));
        logger.info(`Adicionados ${documentPages.length} documentos após o consentimento`);
        
        // Salvar o PDF final com a nova ordem
        const finalPdfBytes = await finalPdfDoc.save();
        logger.info(`PDF mesclado gerado com sucesso: ${finalPdfBytes.length} bytes`);
        
        return new Blob([finalPdfBytes], { type: 'application/pdf' });
      } catch (consentError) {
        logger.error(`Erro ao carregar o formulário de consentimento: ${consentError.message}`, consentError);
        throw new Error(`Falha ao carregar o formulário de consentimento: ${consentError.message}`);
      }
    } catch (error) {
      logger.error(`Erro ao mesclar PDFs: ${error.message}`, error);
      throw error;
    }
  }

  /**
   * Envia o PDF para o servidor
   * @param {string} pdfPath - Caminho do PDF gerado
   * @param {string} processId - ID do processo
   * @returns {Promise<boolean>} - Sucesso do envio
   */
  async uploadPdfToServer(pdfPath, processId) {
    try {
      logger.info(`Enviando PDF ${pdfPath} para o servidor`);
      
      // Obter o arquivo como blob
      const pdfBlob = await fileStorage.getFile(pdfPath);
      
      // Converter para base64
      const base64Pdf = await this.blobToBase64(pdfBlob);
      
      // Enviar para o servidor
      const response = await fetch('/api/upload-pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          processId,
          base64Data: base64Pdf,
          filename: pdfPath.split('/').pop()
        })
      });
      
      if (!response.ok) {
        throw new Error(`Erro na resposta do servidor: ${response.status}`);
      }
      
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Erro desconhecido ao enviar PDF');
      }
      
      logger.info(`PDF enviado com sucesso para o servidor: ${result.fileInfo?.path || 'caminho não informado'}`);
      return true;
    } catch (error) {
      logger.error(`Erro ao enviar PDF para o servidor`, error);
      return false;
    }
  }

  /**
   * Converte Blob para Base64
   * @param {Blob} blob - Blob a ser convertido
   * @returns {Promise<string>} - String base64
   */
  blobToBase64(blob) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  /**
   * Adiciona uma assinatura a um PDF
   * @param {string} pdfPath - Caminho do PDF
   * @param {string} signatureBase64 - Assinatura em base64
   * @param {Object} position - Posição da assinatura {x, y}
   * @returns {Promise<Blob>} - PDF com assinatura
   */
  async addSignatureToPdf(pdfPath, signatureBase64, position) {
    try {
      // Converter base64 para blob
      const signatureBlob = await this.base64ToBlob(signatureBase64, 'image/png');
      
      // Carregar o PDF
      const pdfBytes = await this.blobToArrayBuffer(await fileStorage.getFile(pdfPath));
      const pdfDoc = await PDFDocument.load(pdfBytes);
      
      // Carregar a imagem da assinatura
      const signatureImageBytes = await this.blobToArrayBuffer(signatureBlob);
      const signatureImage = await pdfDoc.embedPng(signatureImageBytes);
      
      // Obter a primeira página
      const page = pdfDoc.getPages()[0];
      
      // Calcular dimensões da assinatura
      const { width, height } = signatureImage.scale(0.5); // Ajustar escala conforme necessário
      
      // Adicionar a assinatura à página
      page.drawImage(signatureImage, {
        x: position.x,
        y: position.y,
        width,
        height
      });
      
      // Salvar o PDF modificado
      const modifiedPdfBytes = await pdfDoc.save();
      return new Blob([modifiedPdfBytes], { type: 'application/pdf' });
    } catch (error) {
      logger.error('Erro ao adicionar assinatura ao PDF:', error);
      throw error;
    }
  }

  /**
   * Converte uma string base64 para Blob
   * @param {string} base64 - String em base64
   * @param {string} mimeType - Tipo MIME do arquivo
   * @returns {Promise<Blob>} - Blob resultante
   */
  async base64ToBlob(base64, mimeType) {
    const byteString = atob(base64.split(',')[1]);
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);
    
    for (let i = 0; i < byteString.length; i++) {
      ia[i] = byteString.charCodeAt(i);
    }
    
    return new Blob([ab], { type: mimeType });
  }

  /**
   * Gera um PDF com uma imagem
   * @param {string} imagePath - Caminho da imagem
   * @returns {Promise<Blob>} - PDF gerado
   */
  async generatePdfFromImage(imagePath) {
    try {
      const imageBlob = await fileStorage.getFile(imagePath);
      const imageBytes = await this.blobToArrayBuffer(imageBlob);
      
      const pdfDoc = await PDFDocument.create();
      const page = pdfDoc.addPage();
      
      const image = await pdfDoc.embedJpg(imageBytes);
      const { width, height } = image.scale(0.5);
      
      page.drawImage(image, {
        x: 50,
        y: 50,
        width,
        height
      });
      
      const pdfBytes = await pdfDoc.save();
      return new Blob([pdfBytes], { type: 'application/pdf' });
    } catch (error) {
      logger.error('Erro ao gerar PDF da imagem:', error);
      throw error;
    }
  }

  /**
   * Gera um PDF com nome do beneficiário
   * @param {string} processId - ID do processo
   * @param {string} nome - Nome do beneficiário
   * @param {string} responsibleName - Nome do responsável (opcional)
   * @returns {Promise<Buffer>} - Buffer do PDF gerado
   */
  async generatePdfWithName(processId, nome = 'Nome do Beneficiário', responsibleName = '') {
    try {
      logger.info(`Gerando PDF com nome para processo ${processId}`);
      
      // Verificar se é um processo de menor
      const isMinor = this.isMinorProcess(processId.split('-')[0]);
      logger.info(`Verificação de processo de menor: ${isMinor ? 'SIM' : 'NÃO'}`);
      
      // Definir o caminho do PDF base de acordo com o tipo de processo
      let basePdfPath;
      if (isMinor) {
        basePdfPath = '/pdf-menores.pdf'; // Caminho relativo para o cliente web
        logger.info('Usando declaração de consentimento para MENOR: /pdf-menores.pdf');
      } else {
        // Verificar se há um PDF específico para o processo, senão usar o padrão
        const uploadedPdfPath = `uploads/${processId}/documentos/pdf_completo.pdf`;

        // No ambiente do navegador, precisamos verificar de outra forma
        try {
          await fileStorage.getFileUrl(uploadedPdfPath);
          basePdfPath = uploadedPdfPath;
          logger.info(`Usando PDF completo já enviado: ${uploadedPdfPath}`);
        } catch (fileError) {
          basePdfPath = '/consent.pdf'; // Caminho relativo para o cliente web
          logger.info('Usando declaração de consentimento padrão: /consent.pdf');
        }
      }
      
      logger.info(`Carregando PDF base: ${basePdfPath}`);
      
      // Obter o arquivo como blob usando fileStorage
      let existingPdfBlob;
      try {
        existingPdfBlob = await fileStorage.getFile(basePdfPath);
      } catch (error) {
        logger.error(`Erro ao carregar PDF base: ${error.message}`);
        throw new Error(`PDF base não encontrado: ${basePdfPath}`);
      }
      
      // Converter blob para bytes
      const existingPdfBytes = await existingPdfBlob.arrayBuffer();
      const pdfDoc = await PDFDocument.load(existingPdfBytes);
      
      // Obter a primeira página
      const pages = pdfDoc.getPages();
      const firstPage = pages[0];
      
      // Adicionar o texto com o nome
      const fontSize = 12;
      firstPage.drawText(nome, {
        x: 150,
        y: isMinor ? 415 : 370, // Posição diferente para menor/adulto
        size: fontSize,
        color: rgb(0, 0, 0),
      });
      
      // Se for processo de menor, adicionar também o nome do responsável
      if (isMinor && responsibleName) {
        firstPage.drawText(responsibleName, {
          x: 150,
          y: 508, // Posição para o nome do responsável no PDF de menores
          size: fontSize,
          color: rgb(0, 0, 0),
        });
      }
      
      // Salvar o PDF modificado
      const pdfBytes = await pdfDoc.save();
      
      logger.info(`PDF gerado com sucesso para ${processId}`);
      // Retornar como um Blob em vez de Buffer (que é específico do Node.js)
      return new Blob([pdfBytes], { type: 'application/pdf' });
    } catch (error) {
      logger.error('Erro ao gerar PDF com nome:', error);
      throw error;
    }
  }

  /**
   * Obtém os documentos para um processo
   * @param {string} processId - ID do processo
   * @returns {Promise<Array>} - Lista de documentos
   */
  async getDocumentsForProcess(processId) {
    try {
      logger.info(`Buscando documentos do processo ${processId}...`);
      
      // Tentar buscar do servidor via API diretamente
      try {
        const response = await fetch(`http://localhost:3001/api/process-files/${processId}`);
        if (response.ok) {
          const serverFiles = await response.json();
          logger.info(`Arquivos encontrados no servidor: ${JSON.stringify(serverFiles)}`);
          
          if (serverFiles && serverFiles.length > 0) {
            // Filtrar apenas documentos na pasta 'documentos'
            const documentFiles = serverFiles.filter(file => 
              file.path.includes('/documentos/') && 
              (file.mimeType?.startsWith('image/') || file.mimeType === 'application/pdf')
            );
            
            if (documentFiles.length > 0) {
              logger.info(`Usando arquivos do servidor: ${documentFiles.length} encontrados`);
              return documentFiles;
            }
          }
        } else {
          logger.warn(`Não foi possível obter arquivos do servidor: ${response.status}`);
        }
      } catch (serverError) {
        logger.warn(`Erro ao buscar arquivos do servidor: ${serverError.message}`);
      }
      
      // Se falhar a busca direta, tentar o método antigo
      const allFiles = await fileStorage.listProcessFiles(processId);
      logger.info(`Arquivos encontrados pelo método antigo: ${JSON.stringify(allFiles)}`);
      
      if (!allFiles || allFiles.length === 0) {
        logger.warn(`Nenhum arquivo encontrado para o processo ${processId}`);
        return [];
      }
      
      // Filtrar apenas documentos (imagens e PDFs)
      const documentFiles = allFiles.filter(file => 
        file.path.includes('/documentos/') && 
        (file.mimeType?.startsWith('image/') || file.mimeType === 'application/pdf')
      );
      
      return documentFiles;
    } catch (error) {
      logger.error(`Erro ao obter documentos do processo: ${error.message}`, error);
      return [];
    }
  }

  /**
   * Adiciona uma imagem ao PDF
   * @param {jsPDF} doc - Documento PDF
   * @param {string} imageUrl - URL da imagem
   * @returns {Promise<void>} - Promise vazia quando concluído
   */
  async addImageToPdf(doc, imageUrl) {
    try {
      // Calcular dimensões para manter a proporção da imagem
      const imgProps = await this.calculateImageDimensions(imageUrl);
      
      // Adicionar a imagem ao PDF, centralizada na página
      doc.addImage(
        imageUrl,
        'JPEG',
        this.margin + (this.pageWidth - 2 * this.margin - imgProps.width) / 2,
        this.margin + (this.pageHeight - 2 * this.margin - imgProps.height) / 2,
        imgProps.width,
        imgProps.height
      );
      
      return;
    } catch (imgError) {
      logger.error(`Erro ao processar imagem ${imageUrl}: ${imgError.message}`);
      // Adicionar uma página com mensagem de erro para não interromper o fluxo
      doc.setFontSize(16);
      doc.text('Erro ao processar imagem', this.pageWidth / 2, this.pageHeight / 2, { align: 'center' });
      doc.setFontSize(12);
      doc.text(`Erro: ${imgError.message}`, this.pageWidth / 2, this.pageHeight / 2 + 10, { align: 'center' });
    }
  }

  /**
   * Converte um Blob para ArrayBuffer
   * @param {Blob} blob - Blob a ser convertido
   * @returns {Promise<ArrayBuffer>} - ArrayBuffer resultante
   */
  async blobToArrayBuffer(blob) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsArrayBuffer(blob);
    });
  }
}

// Criação e exportação do serviço
const pdfServiceInstance = new PdfService();

// Exportar como um objeto nomeado
export const pdfService = pdfServiceInstance;

// Garantir que também exista uma exportação padrão
const moduleExports = pdfServiceInstance;
export default moduleExports; 