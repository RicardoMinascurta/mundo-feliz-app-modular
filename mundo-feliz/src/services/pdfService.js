/**
 * Serviço para geração de PDFs a partir das imagens de documentos
 */

import { jsPDF } from 'jspdf';
import { PDFDocument } from 'pdf-lib';
import { fileStorage } from './fileStorage.js';
import { logger } from './LoggerService.js';
import { jsonData } from './JsonDataService.js';
import path from 'path';
import fs from 'fs';
import { rgb } from 'pdf-lib';

// Caminhos para as declarações de consentimento
const CONSENT_FORMS = {
  ADULT: './public/consent.pdf', // Declaração para maiores de idade - caminho corrigido
  MINOR: './public/pdf-menores.pdf' // Declaração para menores de idade - caminho corrigido
};

// Lista de processos que são para menores
const MINOR_PROCESS_TYPES = [
  'RenovacaoEstudanteSecundario', // Renovação - Estudante Ensino Secundário (menor)
  'ConcessaoTREstudanteMenor',    // Concessão de TR para Estudante Menor (APENAS este é para menor)
  'ReagrupamentoTutor',           // Reagrupamento Familiar - Através do Tutor (menor)
  'CPLPMenor',                    // CPLP - Menor
  'Reagrupamento Familiar - Tutor', // Nome completo (menor)
  'CPLP - Menor'                  // Nome completo (menor)
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

      // Criar estrutura de pasta para PDFs se não existir
      const structure = await fileStorage.createProcessStructure(processId, processType);
      logger.info(`Estrutura de pastas criada: ${JSON.stringify(structure)}`);
      
      const pdfsFolderPath = structure.pdfsPath;
      logger.info(`Pasta para salvar PDFs: ${pdfsFolderPath}`);

      // Listar todos os documentos do processo
      logger.info(`Buscando documentos do processo ${processId}...`);
      const allFiles = await fileStorage.listProcessFiles(processId);
      logger.info(`Arquivos encontrados: ${JSON.stringify(allFiles)}`);
      
      // Se não houver arquivos, tentar buscar do servidor diretamente
      if (!allFiles || allFiles.length === 0) {
        logger.warn(`Nenhum arquivo encontrado pelo método normal. Tentando buscar diretamente do servidor...`);
        
        try {
          // Tentar buscar do servidor via API
          const response = await fetch(`http://localhost:3001/api/process-files/${processId}`);
          if (response.ok) {
            const serverFiles = await response.json();
            logger.info(`Arquivos encontrados no servidor: ${JSON.stringify(serverFiles)}`);
            
            if (serverFiles && serverFiles.length > 0) {
              logger.info(`Usando arquivos do servidor: ${serverFiles.length} encontrados`);
              allFiles.push(...serverFiles);
            }
          } else {
            logger.warn(`Não foi possível obter arquivos do servidor: ${response.status}`);
          }
        } catch (serverError) {
          logger.warn(`Erro ao buscar arquivos do servidor: ${serverError.message}`);
        }
      }
      
      const documentFiles = allFiles.filter(file => 
        file.path.includes('/documentos/') && 
        (file.mimeType?.startsWith('image/') || file.mimeType === 'application/pdf')
      );

      if (documentFiles.length === 0) {
        logger.warn(`Nenhum documento encontrado para o processo ${processId}`);
        return null;
      }

      logger.info(`Encontrados ${documentFiles.length} documentos para processamento em PDF`);

      // Ordenar os arquivos: Front primeiro, Back depois
      // Abordagem simples e direta - separar em dois grupos e depois juntar
      const frontFiles = documentFiles.filter(file => file.path.toLowerCase().includes('front'));
      const backFiles = documentFiles.filter(file => file.path.toLowerCase().includes('back'));
      const otherFiles = documentFiles.filter(file => 
        !file.path.toLowerCase().includes('front') && 
        !file.path.toLowerCase().includes('back')
      );
      
      // Combinar na ordem correta: primeiro Front, depois outros, por último Back
      const sortedFiles = [...frontFiles, ...otherFiles, ...backFiles];

      // Log cada arquivo na ordem que será processado
      sortedFiles.forEach((file, index) => {
        logger.info(`Documento ${index + 1} na ordem de processamento: ${file.path}`);
      });

      logger.info(`Documentos ordenados: Front primeiro, Back depois`);

      // Criar um novo documento PDF
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });
      
      // Para cada documento, adicionar uma página com a imagem
      for (let i = 0; i < sortedFiles.length; i++) {
        const file = sortedFiles[i];
        
        // Adicionar uma nova página, exceto para a primeira
        if (i > 0) {
          doc.addPage();
        }

        // Obter o arquivo como URL
        logger.info(`Obtendo URL para arquivo: ${file.path}`);
        const fileUrl = await fileStorage.getFileUrl(file.path);
        logger.info(`Processando arquivo: ${file.path} -> URL: ${fileUrl}`);
        
        // Calcular dimensões para manter a proporção da imagem
        try {
          const imgProps = await this.calculateImageDimensions(fileUrl);
          
          // Adicionar a imagem ao PDF, centralizada na página
          doc.addImage(
            fileUrl,
            'JPEG',
            this.margin + (this.pageWidth - 2 * this.margin - imgProps.width) / 2,
            this.margin + (this.pageHeight - 2 * this.margin - imgProps.height) / 2,
            imgProps.width,
            imgProps.height
          );

          logger.info(`Adicionada página ${i+1} ao PDF: ${file.path.split('/').pop()}`);
        } catch (imgError) {
          logger.error(`Erro ao processar imagem ${fileUrl}: ${imgError.message}`);
          // Adicionar uma página com mensagem de erro para não interromper o fluxo
          doc.setFontSize(16);
          doc.text('Erro ao processar imagem', this.pageWidth / 2, this.pageHeight / 2, { align: 'center' });
          doc.setFontSize(12);
          doc.text(`Arquivo: ${file.path.split('/').pop()}`, this.pageWidth / 2, this.pageHeight / 2 + 10, { align: 'center' });
        }
      }

      // Gerar nome do arquivo com timestamp
      const timestamp = new Date().toISOString().replace(/:/g, '-');
      const tempPdfFilename = `temp_documentos_${processId}_${timestamp}.pdf`;
      const finalPdfFilename = `documentos_${processId}_${timestamp}.pdf`;
      const tempPdfPath = `${pdfsFolderPath}/${tempPdfFilename}`;
      const finalPdfPath = `${pdfsFolderPath}/${finalPdfFilename}`;
      
      logger.info(`Salvando PDF temporário: ${tempPdfPath}`);
      
      // Converter PDF para blob
      const pdfBlob = doc.output('blob');
      
      // Não usar mais IndexedDB, vamos apenas gerar o PDF e salvar no servidor
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
      logger.info(`Enviando PDF para o servidor: ${finalPdfPath}`);
      
      try {
        // Usando o método de upload para o servidor
        const base64Pdf = await this.blobToBase64(finalPdfBlob);
        
        // Enviar para o servidor
        const response = await fetch('http://localhost:3001/api/upload-pdf', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            processId,
            base64Data: base64Pdf,
            filename: finalPdfFilename,
            documentType: 'pdf'
          })
        });
        
        if (!response.ok) {
          throw new Error(`Erro na resposta do servidor: ${response.status}`);
        }
        
        const result = await response.json();
        logger.info(`PDF enviado para o servidor com sucesso: ${JSON.stringify(result)}`);
        
        // Atualizar o JSON do processo para incluir o caminho do PDF
        try {
          const processo = await jsonData.getProcessoById(processId);
          if (processo) {
            // Verificar se já existe uma lista de PDFs
            if (!processo.pdfGerados) {
              processo.pdfGerados = [];
            }
            
            // Adicionar informações do novo PDF - com o caminho na pasta pdfs
            processo.pdfGerados.push({
              path: result.fileInfo.path, // usar o caminho retornado pelo servidor
              type: 'pdf_completo',
              mimeType: 'application/pdf',
              size: result.fileInfo.size,
              createdAt: new Date().toISOString()
            });
            
            // Atualizar o processo no JSON
            await jsonData.updateProcesso(processId, processo);
            logger.info(`JSON do processo atualizado com o caminho do PDF: ${result.fileInfo.path}`);
          }
        } catch (error) {
          logger.error(`Erro ao atualizar JSON do processo com caminho do PDF: ${error.message}`);
          // Não interromper o fluxo principal em caso de erro na atualização do JSON
        }
        
        return finalPdfPath;
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
      
      // Carregar o formulário de consentimento
      const consentFormBytes = await fileStorage.getFile(consentFormPath);
      const consentFormDoc = await PDFDocument.load(consentFormBytes);
      
      // Copiar todas as páginas do formulário de consentimento
      const consentPages = await documentsPdfDoc.copyPages(consentFormDoc, consentFormDoc.getPageIndices());
      consentPages.forEach(page => documentsPdfDoc.addPage(page));
      
      // Salvar o PDF final
      const finalPdfBytes = await documentsPdfDoc.save();
      return new Blob([finalPdfBytes], { type: 'application/pdf' });
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
        basePdfPath = path.join(__dirname, '../../public/pdf-menores.pdf');
        logger.info('Usando declaração de consentimento para MENOR: /pdf-menores.pdf');
      } else {
        // Verificar se há um PDF específico para o processo, senão usar o padrão
        const uploadedPdfPath = path.join(__dirname, `../../uploads/${processId}/documentos/pdf_completo.pdf`);
        
        if (fs.existsSync(uploadedPdfPath)) {
          basePdfPath = uploadedPdfPath;
          logger.info(`Usando PDF completo já enviado: ${uploadedPdfPath}`);
        } else {
          basePdfPath = path.join(__dirname, '../../public/consent.pdf');
          logger.info('Usando declaração de consentimento padrão: /consent.pdf');
        }
      }
      
      // Verificar se o arquivo existe
      if (!fs.existsSync(basePdfPath)) {
        logger.error(`PDF base não encontrado: ${basePdfPath}`);
        throw new Error('PDF base não encontrado');
      }
      
      logger.info(`Carregando PDF base: ${basePdfPath}`);
      
      // Ler o arquivo PDF
      const existingPdfBytes = fs.readFileSync(basePdfPath);
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
      return Buffer.from(pdfBytes);
    } catch (error) {
      logger.error('Erro ao gerar PDF com nome:', error);
      throw error;
    }
  }
}

// Criação e exportação do serviço
const pdfServiceInstance = new PdfService();

// Exportar como um objeto nomeado
export const pdfService = pdfServiceInstance;

// Garantir que também exista uma exportação padrão
const moduleExports = pdfServiceInstance;
export default moduleExports; 