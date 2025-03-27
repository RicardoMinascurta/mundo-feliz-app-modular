import React, { useState, useEffect, useRef } from 'react';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import PropTypes from 'prop-types';
import { API_URL } from '../../config/api.js';

// Função auxiliar para adicionar assinatura ao PDF
const addSignatureToPdf = async (firstPage, pdfDoc, processo, font) => {
  try {
    console.log('Verificando assinatura para adicionar ao PDF...');
    
    // Verificar se existem arquivos de assinatura no processo
    if (!processo?.arquivosUpload || !Array.isArray(processo.arquivosUpload) || processo.arquivosUpload.length === 0) {
      console.log('Nenhum arquivo de upload encontrado no processo');
      return;
    }
    
    // Encontrar o arquivo de assinatura
    const assinaturaFile = processo.arquivosUpload.find(file => 
      (file.documentType === 'assinatura') || 
      (file.path && file.path.replace(/\\/g, '/').includes('/assinaturas/')) || 
      (file.name && file.name.startsWith('assinatura_'))
    );
    
    if (!assinaturaFile || !assinaturaFile.path) {
      console.log('Nenhum arquivo de assinatura válido encontrado');
      return;
    }
    
    // Normalizar o caminho da assinatura aqui para uso em todas as estratégias
    const nomalizadoPath = assinaturaFile.path.replace(/\\/g, '/');
    console.log('Assinatura encontrada, caminho normalizado:', nomalizadoPath);
    
    // Usar o caminho normalizado em todas as estratégias subsequentes
    const assinaturaPath = nomalizadoPath;
    
    // ESTRATÉGIA 1: Tentar acessar via endpoint da API
    try {
      // Construir URL relativa para o servidor
      const apiPath = `/api/files/${encodeURIComponent(assinaturaPath)}`;
      console.log('Tentando acessar assinatura via API:', apiPath);
      
      const response = await fetch(apiPath);
      if (response.ok) {
        const arrayBuffer = await response.arrayBuffer();
        
        // Incorporar a imagem no documento PDF
        let pdfImage;
        if (assinaturaPath.toLowerCase().endsWith('.png') || 
            response.headers.get('content-type')?.includes('png')) {
          pdfImage = await pdfDoc.embedPng(arrayBuffer);
        } else {
          pdfImage = await pdfDoc.embedJpg(arrayBuffer);
        }
        
        // Definir dimensões da imagem
        const { width, height } = pdfImage.scale(1);
        const alturaDesejada = 35;
        const larguraProporcional = (width / height) * alturaDesejada;
        
        // Coordenadas específicas para assinatura de adulto
        const posX = 302; // Posição X fixa para assinatura de adulto
        const posY = 142; // Posição Y fixa para assinatura de adulto
        
        console.log(`Adicionando assinatura em (${posX}, ${posY}) com dimensões ${larguraProporcional}x${alturaDesejada}`);
        
        // Adicionar a imagem da assinatura ao PDF
        firstPage.drawImage(pdfImage, {
          x: posX,
          y: posY,
          width: larguraProporcional,
          height: alturaDesejada
        });
        
        console.log('✅ Assinatura adicionada com sucesso via API');
        return;
      }
    } catch (apiError) {
      console.log('Falha ao acessar assinatura via API:', apiError.message);
    }
    
    // ESTRATÉGIA 2: Verificar se a assinatura já existe no processo como base64
    try {
      if (processo.assinatura && processo.assinatura.startsWith('data:image')) {
        console.log('Assinatura encontrada como base64 no objeto do processo');
        
        // Criar um elemento de imagem para obter dimensões
        const img = new Image();
        await new Promise((resolve, reject) => {
          img.onload = resolve;
          img.onerror = reject;
          img.src = processo.assinatura;
        });
        
        // Calcular dimensões proporcional com altura fixa de 35 pontos
        const alturaDesejada = 35;
        const larguraProporcional = (img.width / img.height) * alturaDesejada;
        
        // Coordenadas específicas para assinatura de adulto
        const posX = 302; // Posição X fixa para assinatura de adulto
        const posY = 142; // Posição Y fixa para assinatura de adulto
        
        // Adicionar a imagem da assinatura ao PDF
        firstPage.drawImage(processo.assinatura, {
          x: posX,
          y: posY,
          width: larguraProporcional,
          height: alturaDesejada
        });
        
        console.log('✅ Assinatura adicionada com sucesso a partir do objeto do processo');
        return;
      }
    } catch (processObjectError) {
      console.log('Falha ao obter assinatura do objeto do processo:', processObjectError.message);
    }
    
    // ESTRATÉGIA 3: Tentar usar o window.fs se disponível (em ambientes específicos)
    if (typeof window !== 'undefined' && window.fs) {
      try {
        // Remover "uploads/" do início do caminho se existir, pois o window.fs já aponta para essa pasta
        const fsPath = assinaturaPath.replace(/^uploads\//, '');
        console.log('Tentando acessar assinatura via window.fs:', fsPath);
        
        // Acessar o arquivo pelo window.fs
        const fileData = await window.fs.readFile(fsPath);
        
        if (fileData) {
          // Converter para base64 se não estiver nesse formato
          let base64Data;
          if (typeof fileData === 'string' && fileData.startsWith('data:image')) {
            base64Data = fileData;
          } else {
            // Converter ArrayBuffer ou Uint8Array para base64
            const arrayBuffer = fileData instanceof Uint8Array ? fileData.buffer : fileData;
            const binary = String.fromCharCode.apply(null, new Uint8Array(arrayBuffer));
            base64Data = 'data:image/png;base64,' + btoa(binary);
          }
          
          // Criar um elemento de imagem para obter dimensões
          const img = new Image();
          await new Promise((resolve, reject) => {
            img.onload = resolve;
            img.onerror = reject;
            img.src = base64Data;
          });
          
          // Calcular dimensões proporcional com altura fixa de 35 pontos
          const alturaDesejada = 35;
          const larguraProporcional = (img.width / img.height) * alturaDesejada;
          
          // Coordenadas específicas para assinatura de adulto
          const posX = 302; // Posição X fixa para assinatura de adulto
          const posY = 142; // Posição Y fixa para assinatura de adulto
          
          console.log(`Adicionando assinatura em (${posX}, ${posY}) com dimensões ${larguraProporcional}x${alturaDesejada}`);
          
          // Adicionar a imagem da assinatura ao PDF
          firstPage.drawImage(base64Data, {
            x: posX,
            y: posY,
            width: larguraProporcional,
            height: alturaDesejada
          });
          
          console.log('✅ Assinatura adicionada com sucesso via window.fs');
          return;
        }
      } catch (fsError) {
        console.log('Falha ao acessar assinatura via window.fs:', fsError.message);
      }
    }
    
    // ESTRATÉGIA 4: Verificar se há uma versão de demonstração da assinatura no processo
    try {
      // Às vezes os sistemas armazenam uma versão de demonstração da assinatura
      const demoSignature = processo.signaturePreview || 
                          processo.assinaturaDemo || 
                          processo.previewAssinatura;
      
      if (demoSignature && typeof demoSignature === 'string' && demoSignature.startsWith('data:image')) {
        console.log('Usando versão de demonstração da assinatura');
        
        // Criar um elemento de imagem para obter dimensões
        const img = new Image();
        await new Promise((resolve, reject) => {
          img.onload = resolve;
          img.onerror = reject;
          img.src = demoSignature;
        });
        
        // Calcular dimensões proporcional com altura fixa de 35 pontos
        const alturaDesejada = 35;
        const larguraProporcional = (img.width / img.height) * alturaDesejada;
        
        // Coordenadas específicas para assinatura de adulto
        const posX = 302; // Posição X fixa para assinatura de adulto
        const posY = 142; // Posição Y fixa para assinatura de adulto
        
        // Adicionar a imagem da assinatura ao PDF
        firstPage.drawImage(demoSignature, {
          x: posX,
          y: posY,
          width: larguraProporcional,
          height: alturaDesejada
        });
        
        console.log('✅ Assinatura de demonstração adicionada com sucesso');
        return;
      }
    } catch (demoError) {
      console.log('Falha ao usar assinatura de demonstração:', demoError.message);
    }
    
    // ESTRATÉGIA 5: Tentar usar a API como fallback (método original)
    try {
      // Remover "uploads/" do início do caminho se existir
      const fsPath = assinaturaPath.replace(/^uploads\//, '');
      console.log('Caminho ajustado para API:', fsPath);

      const response = await fetch(`${API_URL}/api/get-file?path=${encodeURIComponent(fsPath)}`);
      if (!response.ok) {
        throw new Error('Falha ao obter ficheiro da API');
      }
      const assinaturaUrl = await response.blob();
      console.log('Assinatura obtida com sucesso via API:', assinaturaUrl);
      
      // Incorporar a imagem no documento PDF
      let pdfImage;
      if (assinaturaPath.toLowerCase().endsWith('.png') || 
          response.headers.get('content-type')?.includes('png')) {
        pdfImage = await pdfDoc.embedPng(await assinaturaUrl.arrayBuffer());
      } else {
        pdfImage = await pdfDoc.embedJpg(await assinaturaUrl.arrayBuffer());
      }
      
      // Definir dimensões da imagem
      const { width, height } = pdfImage.scale(1);
      const alturaDesejada = 35;
      const larguraProporcional = (width / height) * alturaDesejada;
      
      // Adicionar a imagem ao PDF
      firstPage.drawImage(pdfImage, {
        x: 302, // Posição X fixa para assinatura de adulto
        y: 142, // Posição Y fixa para assinatura de adulto
        width: larguraProporcional,
        height: alturaDesejada
      });
      
      console.log('✅ Assinatura adicionada com sucesso via API');
      return;
    } catch (apiError) {
      console.error('❌ Erro ao obter assinatura via API:', apiError);
      // ESTRATÉGIA 6: Tentar diretamente sem a API
      try {
        // Tentar reparar o caminho substituindo barras invertidas
        const caminhoDireto = assinaturaPath.replace(/\\/g, '/').replace(/^uploads\//, '');
        console.log('Tentando acesso direto:', `/uploads/${caminhoDireto}`);
        
        const urlDireta = `${window.location.origin}/uploads/${caminhoDireto}`;
        console.log('URL direta:', urlDireta);
        
        const response = await fetch(urlDireta);
        if (!response.ok) {
          throw new Error(`Falha ao carregar imagem diretamente: ${response.status}`);
        }
        
        const imageArrayBuffer = await response.arrayBuffer();
        
        // Incorporar a imagem no documento PDF
        let pdfImage;
        if (caminhoDireto.toLowerCase().endsWith('.png') || 
            response.headers.get('content-type')?.includes('png')) {
          pdfImage = await pdfDoc.embedPng(imageArrayBuffer);
        } else {
          pdfImage = await pdfDoc.embedJpg(imageArrayBuffer);
        }
        
        // Definir dimensões da imagem
        const { width, height } = pdfImage.scale(1);
        const alturaDesejada = 35;
        const larguraProporcional = (width / height) * alturaDesejada;
        
        // Adicionar a imagem ao PDF
        firstPage.drawImage(pdfImage, {
          x: 302, // Posição X fixa para assinatura de adulto
          y: 142, // Posição Y fixa para assinatura de adulto
          width: larguraProporcional,
          height: alturaDesejada
        });
        
        console.log('✅ Assinatura adicionada com sucesso via acesso direto');
        return;
      } catch (directError) {
        console.error('❌ Erro ao acessar assinatura diretamente:', directError.message);
      }
    }
    
    console.log('❌ Não foi possível adicionar assinatura por nenhum dos métodos disponíveis');
    
  } catch (error) {
    console.error('❌ Erro geral ao processar assinatura:', error);
  }
};

// Lista generalizada de campos onde procurar o número do documento
const camposNumeroDocumento = [
  // Campos diretos no objeto principal
  "numeroDocumento",
  "numeroPassaporte",
  
  // Campos em estruturas aninhadas
  "campos.numeroDocumento",
  "campos.numeroPassaporte",
  
  // Campos para pessoa reagrupada em processos de reagrupamento
  "pessoaReagrupada.numeroDocumento",
  "pessoaReagrupada.numeroPassaporte",
  "campos.pessoaReagrupada.numeroPassaporte",
  "campos.pessoaReagrupada.numeroDocumento",
  
  // Campos para pessoa que reagrupa
  "pessoaQueRegrupa.numeroDocumento",
  "pessoaQueRegrupa.numeroPassaporte",
  "campos.pessoaQueRegrupa.numeroDocumento",
  "campos.pessoaQueRegrupa.numeroPassaporte",
  
  // Campos específicos para processos CPLP e estudantes
  "dados_do_menor.numero_do_passaporte",
  "dados_do_responsavel.numero_do_documento",
  
  // Campos extraídos via OCR/GPT
  "dadosExtraidos.gpt.numeroDocumento",
  "dadosExtraidos.gpt.numeroPassaporte"
];

// Lista generalizada de campos onde procurar o nome completo
const camposNomeCompleto = [
  // Campos diretos no objeto principal
  "nomeCompleto",
  
  // Campos em estruturas aninhadas
  "campos.nomeCompleto",
  
  // Campos para pessoa reagrupada
  "pessoaReagrupada.nomeCompleto",
  "campos.pessoaReagrupada.nomeCompleto",
  
  // Campos para pessoa que reagrupa
  "pessoaQueRegrupa.nomeCompleto",
  "campos.pessoaQueRegrupa.nomeCompleto",
  
  // Campos específicos para processos CPLP e estudantes
  "dados_do_menor.nome_completo",
  "dados_do_responsavel.nome_do_responsavel",
  
  // Campos extraídos via OCR/GPT
  "dadosExtraidos.gpt.nomeCompleto",
  "dadosExtraidos.campos.nomeCompleto"
];

// Lista generalizada de campos onde procurar a data de validade
const camposDataValidade = [
  // Campos diretos no objeto principal
  "dataValidade",
  "dataValidadePassaporte",
  
  // Campos em estruturas aninhadas
  "campos.dataValidade",
  "campos.dataValidadePassaporte",
  
  // Campos para pessoa reagrupada
  "pessoaReagrupada.dataValidade",
  "pessoaReagrupada.dataValidadePassaporte",
  "campos.pessoaReagrupada.dataValidadePassaporte",
  "campos.pessoaReagrupada.dataValidade",
  
  // Campos para pessoa que reagrupa
  "pessoaQueRegrupa.dataValidade",
  "pessoaQueRegrupa.dataValidadePassaporte",
  "campos.pessoaQueRegrupa.dataValidade",
  "campos.pessoaQueRegrupa.dataValidadePassaporte",
  
  // Campos específicos para responsáveis em processos de estudantes
  "dataValidadeResponsavel",
  "campos.dataValidadeResponsavel",
  
  // Campos específicos para processos CPLP
  "dados_do_responsavel.data_de_validade_do_documento",
  
  // Campos extraídos via OCR/GPT
  "dadosExtraidos.gpt.dataValidade",
  "dadosExtraidos.gpt.dataValidadePassaporte",
  "dadosExtraidos.campos.dataValidade",
  "dadosExtraidos.campos.dataValidadePassaporte"
];

// Função genérica para extrair valores de campos
function extrairValorDoCampo(objeto, listaCampos) {
  console.log(`AdultPdfProcessor: Buscando valor em ${listaCampos.length} caminhos possíveis`);
  
  // Verificação específica para o processo ReagrupamentoPaiMaeFora
  if (objeto && objeto.processId && objeto.processId.startsWith('ReagrupamentoPaiMaeFora')) {
    console.log('AdultPdfProcessor: Detectado processo ReagrupamentoPaiMaeFora');
    
    // Para número do documento
    if (listaCampos === camposNumeroDocumento && objeto.campos && objeto.campos.pessoaReagrupada) {
      const numeroPassaporte = objeto.campos.pessoaReagrupada.numeroPassaporte;
      if (numeroPassaporte) {
        console.log(`AdultPdfProcessor: Encontrado número do passaporte na pessoa reagrupada: ${numeroPassaporte}`);
        return numeroPassaporte;
      }
    }
    
    // Para data de validade
    if (listaCampos === camposDataValidade && objeto.campos && objeto.campos.pessoaReagrupada) {
      const dataValidadePassaporte = objeto.campos.pessoaReagrupada.dataValidadePassaporte;
      if (dataValidadePassaporte) {
        console.log(`AdultPdfProcessor: Encontrada data de validade na pessoa reagrupada: ${dataValidadePassaporte}`);
        return dataValidadePassaporte;
      }
    }
  }
  
  for (const caminho of listaCampos) {
    try {
      // Navegação pelo objeto
      const valor = caminho.split('.').reduce(
        (obj, key) => obj && obj[key] !== undefined ? obj[key] : undefined, 
        objeto
      );
      
      if (valor) {
        console.log(`AdultPdfProcessor: Valor encontrado em ${caminho}: ${valor}`);
        return valor;
      }
    } catch (e) {
      // Ignora erro se o caminho não existir
      continue;
    }
  }
  
  // Última tentativa: verificar se há dados OCR disponíveis
  if (listaCampos === camposNumeroDocumento) {
    console.log("AdultPdfProcessor: Número de documento não encontrado");
    
    // Última tentativa: verificar se há dados OCR disponíveis
    if (objeto && objeto.dadosExtraidos && objeto.dadosExtraidos.ocr) {
      const ocr = objeto.dadosExtraidos.ocr;
      for (const key in ocr) {
        const texto = ocr[key];
        // Procurar números de documento no formato comum (alfanumérico com 6-10 caracteres)
        const matches = texto.match(/[A-Z0-9]{6,10}/g);
        if (matches && matches.length > 0) {
          console.log(`AdultPdfProcessor: Possível número de documento encontrado no OCR: ${matches[0]}`);
          return matches[0];
        }
      }
    }
    
    // Retorna string vazia se nada for encontrado
    console.log("AdultPdfProcessor: Nenhum número de documento encontrado, retornando vazio");
    return "";
  } else if (listaCampos === camposDataValidade) {
    console.log("AdultPdfProcessor: Data de validade não encontrada");
    
    // Última tentativa: verificar se há dados OCR disponíveis
    if (objeto && objeto.dadosExtraidos && objeto.dadosExtraidos.ocr) {
      const ocr = objeto.dadosExtraidos.ocr;
      for (const key in ocr) {
        const texto = ocr[key];
        // Procurar datas no formato DD/MM/AAAA
        const matches = texto.match(/\d{2}\/\d{2}\/\d{4}/g);
        if (matches && matches.length > 0) {
          console.log(`AdultPdfProcessor: Possível data de validade encontrada no OCR: ${matches[matches.length-1]}`);
          return matches[matches.length-1]; // Geralmente a última data é a de validade
        }
      }
    }
    
    // Retorna string vazia se nada for encontrado
    console.log("AdultPdfProcessor: Nenhuma data de validade encontrada, retornando vazio");
    return "";
  }
  
  console.log(`AdultPdfProcessor: Valor não encontrado`);
  return "";
}

/**
 * Componente para processar PDFs de adultos com o nome sobreposto
 */
const AdultPdfProcessor = ({ processId, personName, dataValidade, completePdfPath, onPdfProcessed, onError, processData, processo, pdfVersion }) => {
  const [isProcessing, setIsProcessing] = useState(true);
  const [pdfUrl, setPdfUrl] = useState(null);
  const processedRef = useRef(false);
  const isMountedRef = useRef(true);
  const previousNameRef = useRef('');
  const previousVersionRef = useRef(pdfVersion || 1);

  // Função para formatar a data para o formato "DD/MM/AAAA" (numérico)
  const formatarDataParaPDF = (dataString) => {
    if (!dataString) return { dia: '', mes: '', ano: '' };
    
    console.log(`AdultPdfProcessor: Formatando data original: "${dataString}"`);
    
    // Verificar formato da data (DD/MM/AAAA ou AAAA-MM-DD)
    let dia, mes, ano;
    
    // Remover espaços extras
    const dataTrimmed = dataString.trim();
    
    if (dataTrimmed.includes('/')) {
      // Formato DD/MM/AAAA
      const partes = dataTrimmed.split('/');
      // Verificar se está na ordem correta
      if (partes[0].length <= 2 && parseInt(partes[0]) <= 31) {
        // É dia/mês/ano (formato correto)
        dia = partes[0].padStart(2, '0');
        mes = partes[1].padStart(2, '0');
        ano = partes[2];
        console.log(`AdultPdfProcessor: Identificado formato dia/mês/ano: ${dia}/${mes}/${ano}`);
      } else if (partes[2].length <= 2 && parseInt(partes[2]) <= 31) {
        // É ano/mês/dia (formato invertido)
        dia = partes[2].padStart(2, '0');
        mes = partes[1].padStart(2, '0');
        ano = partes[0];
        console.log(`AdultPdfProcessor: Identificado formato ano/mês/dia (invertido): ${dia}/${mes}/${ano}`);
      } else {
        // Formato desconhecido, assumir que é dia/mês/ano
        dia = partes[0].padStart(2, '0');
        mes = partes[1].padStart(2, '0');
        ano = partes[2];
        console.log(`AdultPdfProcessor: Assumindo formato dia/mês/ano: ${dia}/${mes}/${ano}`);
      }
    } else if (dataTrimmed.includes('-')) {
      // Formato AAAA-MM-DD ou DD-MM-AAAA
      const partes = dataTrimmed.split('-');
      if (partes[0].length === 4) {
        // AAAA-MM-DD (ISO)
        dia = partes[2].padStart(2, '0');
        mes = partes[1].padStart(2, '0');
        ano = partes[0];
        console.log(`AdultPdfProcessor: Identificado formato ISO (AAAA-MM-DD): ${dia}/${mes}/${ano}`);
      } else {
        // DD-MM-AAAA
        dia = partes[0].padStart(2, '0');
        mes = partes[1].padStart(2, '0');
        ano = partes[2];
        console.log(`AdultPdfProcessor: Identificado formato DD-MM-AAAA: ${dia}/${mes}/${ano}`);
      }
    } else if (dataTrimmed.includes(' ')) {
      // Formato DD MM AAAA ou possívelmente com mês por extenso
      const partes = dataTrimmed.split(' ').filter(p => p.trim() !== '');
      
      // Verificar se o segundo elemento é um número ou texto (mês por extenso)
      if (isNaN(parseInt(partes[1]))) {
        // Possível formato com mês por extenso - usar função auxiliar para converter
        const mesesPorExtenso = [
          'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
          'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'
        ];
        
        dia = partes[0].padStart(2, '0');
        const mesPorExtenso = partes[1].toLowerCase();
        const mesIndex = mesesPorExtenso.findIndex(m => 
          mesPorExtenso === m || m.startsWith(mesPorExtenso)
        );
        mes = mesIndex !== -1 ? (mesIndex + 1).toString().padStart(2, '0') : '01';
        ano = partes[2] || new Date().getFullYear().toString();
        
        console.log(`AdultPdfProcessor: Identificado formato com mês por extenso: ${dia}/${mes}/${ano}`);
      } else {
        // Formato numérico normal
        dia = partes[0].padStart(2, '0');
        mes = partes[1].padStart(2, '0');
        ano = partes[2];
        console.log(`AdultPdfProcessor: Identificado formato com espaços: ${dia}/${mes}/${ano}`);
      }
    } else {
      // Tentativa de analisar outros formatos ou usar data atual como fallback
      console.log(`AdultPdfProcessor: Formato de data não reconhecido: "${dataString}"`);
      try {
        // Verificar se é uma data válida para o JavaScript
        const dataObj = new Date(dataString);
        if (!isNaN(dataObj.getTime())) {
          dia = dataObj.getDate().toString().padStart(2, '0');
          mes = (dataObj.getMonth() + 1).toString().padStart(2, '0');
          ano = dataObj.getFullYear().toString();
          console.log(`AdultPdfProcessor: Convertido via objeto Date: ${dia}/${mes}/${ano}`);
        } else {
          throw new Error("Data inválida");
        }
      } catch (e) {
        // Usar data vazia como último recurso
        console.log(`AdultPdfProcessor: Não foi possível converter a data: ${e.message}`);
        return { dia: '', mes: '', ano: '' };
      }
    }
    
    // Verificar valores e fazer ajustes finais
    // Dia deve estar entre 1-31
    if (parseInt(dia) < 1 || parseInt(dia) > 31) {
      console.log(`AdultPdfProcessor: Dia inválido (${dia}), corrigindo para 01`);
      dia = '01';
    }
    
    // Mês deve estar entre 1-12
    if (parseInt(mes) < 1 || parseInt(mes) > 12) {
      console.log(`AdultPdfProcessor: Mês inválido (${mes}), corrigindo para 01`);
      mes = '01';
    }
    
    // Ano deve ter 4 dígitos
    if (ano.length < 4) {
      // Assumir século atual
      ano = (ano.length === 2) ? `20${ano}` : '2024';
      console.log(`AdultPdfProcessor: Ajustando ano para 4 dígitos: ${ano}`);
    }
    
    console.log(`AdultPdfProcessor: Data final formatada: ${dia}/${mes}/${ano}`);
    return { dia, mes, ano };
  };

  useEffect(() => {
    isMountedRef.current = true;
    
    // Verificar se o nome ou versão mudou para reprocessar o PDF
    const nameChanged = previousNameRef.current !== personName;
    const versionChanged = previousVersionRef.current !== pdfVersion;
    
    if (nameChanged || versionChanged) {
      console.log(`AdultPdfProcessor: ${nameChanged ? 'Nome mudou' : ''}${nameChanged && versionChanged ? ' e ' : ''}${versionChanged ? 'Versão mudou' : ''}, reprocessando PDF`);
      processedRef.current = false;
      // Limpar URL anterior se existir
      if (pdfUrl) {
        URL.revokeObjectURL(pdfUrl);
        setPdfUrl(null);
      }
      previousNameRef.current = personName;
      previousVersionRef.current = pdfVersion;
    }
    
    const processAdultPdf = async () => {
      if (processedRef.current) return;
      
      try {
        setIsProcessing(true);
        console.log('AdultPdfProcessor: Iniciando processamento do PDF para adulto');
        console.log('AdultPdfProcessor: Tipo de processo:', processId?.split('-')[0]);
        
        // Determinar qual PDF base usar
        let pdfBytes;
        if (completePdfPath) {
          // Se tivermos um PDF completo, usar ele
          console.log(`AdultPdfProcessor: Usando PDF completo: ${completePdfPath}`);
          try {
            const response = await fetch(completePdfPath);
            if (!response.ok) {
              throw new Error(`Falha ao obter PDF completo: ${response.status} ${response.statusText}`);
            }
            pdfBytes = await response.arrayBuffer();
            console.log('AdultPdfProcessor: PDF completo carregado com sucesso');
          } catch (fetchError) {
            console.error('AdultPdfProcessor: Erro ao carregar PDF completo:', fetchError);
            console.log('AdultPdfProcessor: Tentando usar PDF base para adultos como fallback');
            // Fallback para o PDF base
            const basePdfUrl = '/consent.pdf';
            const baseResponse = await fetch(basePdfUrl);
            if (!baseResponse.ok) {
              throw new Error(`Falha ao obter PDF base: ${baseResponse.status} ${baseResponse.statusText}`);
            }
            pdfBytes = await baseResponse.arrayBuffer();
          }
        } else {
          // Caso contrário, usar o PDF base para adultos
          const basePdfUrl = '/consent.pdf';
          console.log(`AdultPdfProcessor: Usando PDF base para adultos: ${basePdfUrl}`);
          try {
            const response = await fetch(basePdfUrl);
            if (!response.ok) {
              throw new Error(`Falha ao obter PDF base para adultos: ${response.status} ${response.statusText}`);
            }
            pdfBytes = await response.arrayBuffer();
            const pdfSize = pdfBytes.byteLength;
            console.log(`AdultPdfProcessor: PDF base para adultos carregado com sucesso (${pdfSize} bytes)`);
            console.log('AdultPdfProcessor: ✅ CONFIRMADO: USANDO CONSENT.PDF');
          } catch (fetchError) {
            console.error('AdultPdfProcessor: Erro ao carregar PDF base para adultos:', fetchError);
            throw new Error('Não foi possível carregar o PDF base para adultos. Verifique se o arquivo existe na pasta public.');
          }
        }
        
        // Carregar o documento
        console.log('AdultPdfProcessor: Carregando documento PDF...');
        const pdfDoc = await PDFDocument.load(pdfBytes);
        
        // Obter a primeira página
        const pages = pdfDoc.getPages();
        const firstPage = pages[0];
        console.log(`AdultPdfProcessor: PDF carregado com ${pages.length} páginas`);
        
        // Incorporar a fonte
        const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
        const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
        const fontSize = 12;
        
        // Coordenadas exatas para o nome no PDF de adulto
        const x = 112;    // Coordenada X fixa para adultos
        const y = 515;    // Coordenada Y fixa para adultos
        
        console.log(`AdultPdfProcessor: Posicionando nome para ADULTO (${personName}): ${x}x${y} (coordenadas específicas)`);
        
        // Adicionar texto
        firstPage.drawText(personName, {
          x,
          y,
          size: fontSize,
          font,
          color: rgb(0, 0, 0) // Preto
        });
        
        // Usar dados do processo recebidos diretamente como prop ou fallback para window.latestProcessData
        const dadosDoProcesso = processo || processData || window.latestProcessData || {};
        console.log('AdultPdfProcessor: Dados do processo para extração:', dadosDoProcesso);
        
        // Garantir que temos o processId no objeto
        const dadosComProcessId = { 
          ...dadosDoProcesso,
          processId: processId || dadosDoProcesso.processId
        };
        
        // Extrair número do documento usando a função genérica
        const numeroDocumento = extrairValorDoCampo(dadosComProcessId, camposNumeroDocumento);
        console.log(`AdultPdfProcessor: Número do documento extraído: ${numeroDocumento}`);
        
        // Adicionar número do documento ao PDF
        firstPage.drawText(numeroDocumento, {
          x: 210,
          y: 482,
          size: fontSize,
          font: font,
          color: rgb(0, 0, 0)
        });
        
        // Extrair e processar data de validade
        const dataValidadeExtraida = extrairValorDoCampo(dadosComProcessId, camposDataValidade);
        console.log(`AdultPdfProcessor: Data de validade extraída: ${dataValidadeExtraida}`);
        
        // Adicionar a data de validade
        console.log(`AdultPdfProcessor: Data de validade original: ${dataValidadeExtraida}`);
        const { dia, mes, ano } = formatarDataParaPDF(dataValidadeExtraida);
        console.log(`AdultPdfProcessor: Data formatada: dia=${dia}, mes=${mes}, ano=${ano}`);
        
        // CORREÇÃO: Garantir que as posições estão corretas
        // No PDF de adultos, a data deve estar na ordem DD/MM/AAAA
        // Trocar as coordenadas do dia e ano - agora o dia fica à esquerda e o ano à direita
        
        // Adicionar o dia
        firstPage.drawText(dia, {
          x: 424, // Posição mais à esquerda para o dia
          y: 482,
          size: fontSize,
          font: font,
          color: rgb(0, 0, 0)
        });
        
        // Adicionar o mês (mantém a posição do meio)
        firstPage.drawText(mes, {
          x: 456, // Posição do meio para o mês
          y: 482,
          size: fontSize,
          font: font,
          color: rgb(0, 0, 0)
        });
        
        // Adicionar o ano
        firstPage.drawText(ano, {
          x: 488, // Posição mais à direita para o ano
          y: 482,
          size: fontSize,
          font: font,
          color: rgb(0, 0, 0)
        });
        
        console.log(`AdultPdfProcessor: Data formatada adicionada: ${dia}/${mes}/${ano} nas posições x: 424 (dia), 456 (mês), 488 (ano)`);
        
        // Adicionar a data atual
        const dataAtual = new Date();
        const diaAtual = dataAtual.getDate().toString();
        
        // Array com os nomes dos meses por extenso
        const mesesPorExtenso = [
          'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
          'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
        ];
        const mesAtualPorExtenso = mesesPorExtenso[dataAtual.getMonth()];
        
        console.log(`AdultPdfProcessor: Adicionando data atual: ${diaAtual} de ${mesAtualPorExtenso}`);
        
        // Cor do texto (preto)
        const textColor = rgb(0, 0, 0);
        
        // Adicionar dia atual
        firstPage.drawText(diaAtual, {
          x: 117, // Coordenada X para o DIA da DATA ATUAL
          y: 220, // Coordenada Y para o DIA da DATA ATUAL
          size: fontSize,
          font: font,
          color: textColor
        });
        
        // Adicionar mês atual por extenso
        firstPage.drawText(mesAtualPorExtenso, {
          x: 155, // Coordenada X para o MÊS da DATA ATUAL
          y: 220, // Coordenada Y para o MÊS da DATA ATUAL
          size: fontSize,
          font: font,
          color: textColor
        });

        // NOVO CÓDIGO: Adicionar assinatura ao PDF
        try {
          console.log('AdultPdfProcessor: Buscando assinatura para adicionar ao PDF');
          
          // Verificar se temos assinatura no objeto do processo
          if (dadosComProcessId?.arquivosUpload) {
            // Encontrar arquivo de assinatura nos uploads
            const assinaturaFile = dadosComProcessId.arquivosUpload.find(file => 
              file.documentType === 'assinatura' || 
              file.path.includes('/assinaturas/') ||
              file.name.includes('assinatura_')
            );
            
            if (assinaturaFile) {
              console.log('AdultPdfProcessor: Assinatura encontrada:', assinaturaFile.path);
              
              // Usar a função auxiliar para adicionar a assinatura
              await addSignatureToPdf(firstPage, pdfDoc, dadosComProcessId, font);
            } else {
              console.log('AdultPdfProcessor: Nenhuma assinatura encontrada nos uploads');
            }
          } else {
            console.log('AdultPdfProcessor: Não foi possível encontrar arquivosUpload no processo');
          }
        } catch (assinaturaError) {
          console.error('AdultPdfProcessor: Erro ao processar assinatura:', assinaturaError);
          // Continuar sem a assinatura em caso de erro
        }

        // ====== ADICIONANDO CHECKBOXES ======
        // Coordenadas para as checkboxes conforme fornecidas pelo usuário
        const checkboxCoordinates = {
          tratamentoDados: { x: 86, y: 672 },
          trocaCredenciaisCPLP: { x: 88, y: 652 },
          trocaCredenciaisSAPA: { x: 87, y: 624 },
          trocaCredenciaisRenovacao: { x: 88, y: 598 },
          outros: { x: 90, y: 570 }
        };

        // Mapeamento entre IDs dos checkboxes no sistema e IDs no PDF
        const checkboxMapping = {
          consentimentoDados: 'tratamentoDados',
          cplp: 'trocaCredenciaisCPLP',
          sapa: 'trocaCredenciaisSAPA',
          renovacao: 'trocaCredenciaisRenovacao',
          outros: 'outros'
        };

        // Obter dados das checkboxes selecionadas
        const selectedFields = dadosDoProcesso?.campos?.selectedFields || 
                             dadosDoProcesso?.selectedFields || 
                             {};
        
        console.log('AdultPdfProcessor: Campos selecionados:', selectedFields);

        // Adicionar X nas checkboxes marcadas
        Object.keys(checkboxMapping).forEach(checkboxId => {
          if (selectedFields[checkboxId]) {
            const pdfCheckboxId = checkboxMapping[checkboxId];
            const coords = checkboxCoordinates[pdfCheckboxId];
            
            if (coords) {
              console.log(`AdultPdfProcessor: Marcando checkbox ${checkboxId} em (${coords.x}, ${coords.y})`);
              
              // Desenhar um X grande e bem visível
              firstPage.drawText('X', {
                x: coords.x,
                y: coords.y,
                size: fontSize + 4, // Tamanho maior que o texto normal
                font: boldFont,
                color: rgb(0, 0, 0), // Preto
                opacity: 1.0 // Totalmente opaco
              });
              
              // Se for a opção "outros", adicionar o texto especificado
              if (checkboxId === 'outros') {
                const outrosDetalhes = dadosDoProcesso?.outrosDetalhes || 
                                     dadosDoProcesso?.campos?.outrosDetalhes || 
                                     '';
                                     
                if (outrosDetalhes) {
                  console.log(`AdultPdfProcessor: Adicionando detalhes de "outros": ${outrosDetalhes}`);
                  firstPage.drawText(outrosDetalhes, {
                    x: coords.x + 40, // Um pouco à direita do X
                    y: coords.y,
                    size: fontSize,
                    font: font,
                    color: rgb(0, 0, 0)
                  });
                }
              }
            }
          }
        });
        
        // Salvar o documento modificado
        console.log('AdultPdfProcessor: Salvando documento...');
        const modifiedPdfBytes = await pdfDoc.save();
        
        // Converter bytes para URL de dados
        const blob = new Blob([modifiedPdfBytes], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);

        // Expor o blob do PDF processado globalmente
        window.currentProcessedPdfBlob = blob;

        console.log('AdultPdfProcessor: PDF processado com sucesso, URL criada:', url.substring(0, 30) + '...');
        
        if (isMountedRef.current) {
          setPdfUrl(url);
          setIsProcessing(false);
          processedRef.current = true;
          if (onPdfProcessed) onPdfProcessed(url);
          console.log('AdultPdfProcessor: Processamento concluído com sucesso');
        }
      } catch (error) {
        console.error('Erro ao processar PDF de adulto:', error);
        if (isMountedRef.current) {
          setIsProcessing(false);
          processedRef.current = true;
          if (onError) onError(error.message);
        }
      }
    };
    
    if (processId && personName && !processedRef.current) {
      processAdultPdf();
    }
    
    return () => {
      isMountedRef.current = false;
      // Limpar URL se existir
      if (pdfUrl) URL.revokeObjectURL(pdfUrl);
    };
  }, [processId, personName, dataValidade, onPdfProcessed, onError, pdfUrl, completePdfPath, processData, processo, pdfVersion]);
  
  // Este componente não renderiza nada visualmente, apenas processa o PDF
  return null;
};

AdultPdfProcessor.propTypes = {
  processId: PropTypes.string.isRequired,
  personName: PropTypes.string.isRequired,
  dataValidade: PropTypes.string,
  completePdfPath: PropTypes.string,
  onPdfProcessed: PropTypes.func,
  onError: PropTypes.func,
  processData: PropTypes.object,
  processo: PropTypes.object,
  pdfVersion: PropTypes.number
};

export default AdultPdfProcessor; 