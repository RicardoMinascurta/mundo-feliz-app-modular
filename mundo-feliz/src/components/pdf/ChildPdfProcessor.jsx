import React, { useState, useEffect, useRef } from 'react';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import PropTypes from 'prop-types';
import { childPdfCoordinates, formatarDataPorExtenso, formatarDataNumerica, mesesPorExtenso } from './pdfCoordinates';
import { API_URL } from '../../config/api.js';

// Função auxiliar para adicionar assinatura ao PDF de menores
const addSignatureToPdf = async (firstPage, pdfDoc, processo, font) => {
  try {
    console.log('ChildPdfProcessor: Verificando assinatura para adicionar ao PDF...');
    
    // Verificar se existem arquivos de assinatura no processo
    if (!processo?.arquivosUpload || !Array.isArray(processo.arquivosUpload) || processo.arquivosUpload.length === 0) {
      console.log('ChildPdfProcessor: Nenhum arquivo de upload encontrado no processo');
      return;
    }
    
    // Encontrar o arquivo de assinatura
    const assinaturaFile = processo.arquivosUpload.find(file => 
      (file.documentType === 'assinatura') || 
      (file.path && file.path.replace(/\\/g, '/').includes('/assinaturas/')) || 
      (file.name && file.name.startsWith('assinatura_'))
    );
    
    if (!assinaturaFile || !assinaturaFile.path) {
      console.log('ChildPdfProcessor: Nenhum arquivo de assinatura válido encontrado');
      return;
    }
    
    // Normalizar o caminho da assinatura aqui para uso em todas as estratégias
    const nomalizadoPath = assinaturaFile.path.replace(/\\/g, '/');
    console.log('ChildPdfProcessor: Assinatura encontrada, caminho normalizado:', nomalizadoPath);
    
    // Usar o caminho normalizado em todas as estratégias subsequentes
    const assinaturaPath = nomalizadoPath;
    
    // ESTRATÉGIA 1: Tentar acessar via endpoint da API
    try {
      // Construir URL relativa para o servidor
      const apiPath = `/api/files/${encodeURIComponent(assinaturaPath)}`;
      console.log('ChildPdfProcessor: Tentando acessar assinatura via API:', apiPath);
      
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
        
        // Coordenadas específicas para assinatura em PDFs de menor
        const posX = 302; // Posição X fixa para assinatura
        const posY = 101; // Posição Y fixa para assinatura em PDF de menor
        
        console.log(`ChildPdfProcessor: Adicionando assinatura em (${posX}, ${posY}) com dimensões ${larguraProporcional}x${alturaDesejada}`);
        
        // Adicionar a imagem da assinatura ao PDF
        firstPage.drawImage(pdfImage, {
          x: posX,
          y: posY,
          width: larguraProporcional,
          height: alturaDesejada
        });
        
        console.log('ChildPdfProcessor: ✅ Assinatura adicionada com sucesso via API');
        return;
      }
    } catch (apiError) {
      console.log('ChildPdfProcessor: Falha ao acessar assinatura via API:', apiError.message);
    }
    
    // ESTRATÉGIA 2: Verificar se a assinatura já existe no processo como base64
    try {
      if (processo.assinatura && processo.assinatura.startsWith('data:image')) {
        console.log('ChildPdfProcessor: Assinatura encontrada como base64 no objeto do processo');
        
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
        
        // Coordenadas específicas para assinatura em PDFs de menor
        const posX = 302; // Posição X fixa para assinatura
        const posY = 101; // Posição Y fixa para assinatura em PDF de menor
        
        // Adicionar a imagem da assinatura ao PDF
        firstPage.drawImage(processo.assinatura, {
          x: posX,
          y: posY,
          width: larguraProporcional,
          height: alturaDesejada
        });
        
        console.log('ChildPdfProcessor: ✅ Assinatura adicionada com sucesso a partir do objeto do processo');
        return;
      }
    } catch (processObjectError) {
      console.log('ChildPdfProcessor: Falha ao obter assinatura do objeto do processo:', processObjectError.message);
    }
    
    // ESTRATÉGIA 3: Tentar usar o window.fs se disponível (em ambientes específicos)
    if (typeof window !== 'undefined' && window.fs) {
      try {
        // Remover "uploads/" do início do caminho se existir, pois o window.fs já aponta para essa pasta
        const fsPath = assinaturaPath.replace(/^uploads\//, '');
        console.log('ChildPdfProcessor: Tentando acessar assinatura via window.fs:', fsPath);
        
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
          
          // Coordenadas específicas para assinatura em PDFs de menor
          const posX = 302; // Posição X fixa para assinatura
          const posY = 101; // Posição Y fixa para assinatura em PDF de menor
          
          console.log(`ChildPdfProcessor: Adicionando assinatura em (${posX}, ${posY}) com dimensões ${larguraProporcional}x${alturaDesejada}`);
          
          // Adicionar a imagem da assinatura ao PDF
          firstPage.drawImage(base64Data, {
            x: posX,
            y: posY,
            width: larguraProporcional,
            height: alturaDesejada
          });
          
          console.log('ChildPdfProcessor: ✅ Assinatura adicionada com sucesso via window.fs');
          return;
        }
      } catch (fsError) {
        console.log('ChildPdfProcessor: Falha ao acessar assinatura via window.fs:', fsError.message);
      }
    }
    
    // ESTRATÉGIA 4: Verificar se há uma versão de demonstração da assinatura no processo
    try {
      // Às vezes os sistemas armazenam uma versão de demonstração da assinatura
      const demoSignature = processo.signaturePreview || 
                          processo.assinaturaDemo || 
                          processo.previewAssinatura;
      
      if (demoSignature && typeof demoSignature === 'string' && demoSignature.startsWith('data:image')) {
        console.log('ChildPdfProcessor: Usando versão de demonstração da assinatura');
        
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
        
        // Coordenadas específicas para assinatura em PDFs de menor
        const posX = 302; // Posição X fixa para assinatura
        const posY = 101; // Posição Y fixa para assinatura em PDF de menor
        
        // Adicionar a imagem da assinatura ao PDF
        firstPage.drawImage(demoSignature, {
          x: posX,
          y: posY,
          width: larguraProporcional,
          height: alturaDesejada
        });
        
        console.log('ChildPdfProcessor: ✅ Assinatura de demonstração adicionada com sucesso');
        return;
      }
    } catch (demoError) {
      console.log('ChildPdfProcessor: Falha ao usar assinatura de demonstração:', demoError.message);
    }
    
    // ESTRATÉGIA 5: Tentar usar a API como fallback (método original)
    try {
      // Remover "uploads/" do início do caminho se existir
      const fsPath = assinaturaPath.replace(/^uploads\//, '');
      console.log('ChildPdfProcessor: Caminho ajustado para API:', fsPath);

      const response = await fetch(`${API_URL}/api/get-file?path=${encodeURIComponent(fsPath)}`);
      if (!response.ok) {
        throw new Error('Falha ao obter ficheiro da API');
      }
      const assinaturaUrl = await response.blob();
      console.log('ChildPdfProcessor: Assinatura obtida com sucesso via API:', assinaturaUrl);
      
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
        x: 302, // Posição X fixa para assinatura de criança
        y: 142, // Posição Y fixa para assinatura de criança
        width: larguraProporcional,
        height: alturaDesejada
      });
      
      console.log('ChildPdfProcessor: ✅ Assinatura adicionada com sucesso via API');
      return;
    } catch (apiError) {
      console.error('ChildPdfProcessor: ❌ Erro ao obter assinatura via API:', apiError);
      // ESTRATÉGIA 6: Tentar diretamente sem a API
      try {
        // Tentar reparar o caminho substituindo barras invertidas
        const caminhoDireto = assinaturaPath.replace(/\\/g, '/').replace(/^uploads\//, '');
        console.log('ChildPdfProcessor: Tentando acesso direto:', `/uploads/${caminhoDireto}`);
        
        const urlDireta = `${window.location.origin}/uploads/${caminhoDireto}`;
        console.log('ChildPdfProcessor: URL direta:', urlDireta);
        
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
          x: 302, // Posição X fixa para assinatura de criança
          y: 142, // Posição Y fixa para assinatura de criança
          width: larguraProporcional,
          height: alturaDesejada
        });
        
        console.log('ChildPdfProcessor: ✅ Assinatura adicionada com sucesso via acesso direto');
        return;
      } catch (directError) {
        console.error('ChildPdfProcessor: ❌ Erro ao acessar assinatura diretamente:', directError.message);
      }
    }
    
    console.log('ChildPdfProcessor: ❌ Não foi possível adicionar assinatura por nenhum dos métodos disponíveis');
    
  } catch (error) {
    console.error('ChildPdfProcessor: ❌ Erro geral ao processar assinatura:', error);
  }
};

// Lista generalizada de campos onde procurar o nome do menor
const camposNomeMenor = [
  // CPLPMenor
  "dados_do_menor.nome_completo",
  "dados_do_menor.nome_completo_do_menor",
  "campos.dados_do_menor.nome_completo",
  "campos.dados_do_menor.nome_completo_do_menor",
  "dadosExtraidos.campos.dados_do_menor.nome_completo",
  "dadosExtraidos.campos.dados_do_menor.nome_completo_do_menor",
  "dadosExtraidos.gpt.dados_do_menor.nome_completo",
  "dadosExtraidos.gpt.dados_do_menor.nome_completo_do_menor",
  
  // ReagrupamentoTutor e similares
  "pessoaReagrupada.nomeCompleto",
  "campos.pessoaReagrupada.nomeCompleto",
  "dadosExtraidos.campos.pessoaReagrupada.nomeCompleto",
  "dadosExtraidos.gpt.pessoaReagrupada.nomeCompleto",
  
  // RenovacaoEstudanteSecundario e ConcessaoTREstudanteMenor
  "nomeCompleto",
  "campos.nomeCompleto",
  "dadosExtraidos.campos.nomeCompleto",
  "dadosExtraidos.gpt.nomeCompleto",
  
  // Campos específicos de processos de menor
  "nomeMenor",
  "campos.nomeMenor",
  "dadosExtraidos.campos.nomeMenor",
  "dadosExtraidos.gpt.nomeMenor",
  
  // Nome direto
  "nome",
  "campos.nome"
];

// Lista generalizada de campos onde procurar o nome do responsável (adulto)
const camposNomeResponsavel = [
  // CPLPMenor
  "dados_do_responsavel.nome_do_responsavel",
  "campos.dados_do_responsavel.nome_do_responsavel",
  "dadosExtraidos.campos.dados_do_responsavel.nome_do_responsavel",
  "dadosExtraidos.gpt.dados_do_responsavel.nome_do_responsavel",
  
  // ReagrupamentoTutor e similares
  "pessoaQueRegrupa.nomeCompleto",
  "campos.pessoaQueRegrupa.nomeCompleto",
  "dadosExtraidos.campos.pessoaQueRegrupa.nomeCompleto",
  "dadosExtraidos.gpt.pessoaQueRegrupa.nomeCompleto",
  
  // RenovacaoEstudanteSecundario
  "nomeResponsavelLegal",
  "campos.nomeResponsavelLegal",
  "dadosExtraidos.campos.nomeResponsavelLegal",
  "dadosExtraidos.gpt.nomeResponsavelLegal",
  
  // Campos genéricos para tutor/responsável/guardião
  "nomeTutor",
  "nomeGuardiao",
  "nomeResponsavel",
  "campos.nomeTutor",
  "campos.nomeGuardiao",
  "campos.nomeResponsavel",
  "dadosExtraidos.campos.nomeTutor",
  "dadosExtraidos.campos.nomeGuardiao",
  "dadosExtraidos.campos.nomeResponsavel"
];

// Lista de campos para número do documento do menor
const camposNumeroDocumentoMenor = [
  // Campos diretos
  "numeroDocumento",
  "numeroPassaporte",
  "campos.numeroDocumento",
  "campos.numeroPassaporte",
  
  // CPLPMenor
  "dados_do_menor.numero_do_passaporte",
  "campos.dados_do_menor.numero_do_passaporte",
  "dadosExtraidos.campos.dados_do_menor.numero_do_passaporte",
  "dadosExtraidos.gpt.dados_do_menor.numero_do_passaporte",
  
  // ReagrupamentoTutor
  "pessoaReagrupada.numeroPassaporte",
  "campos.pessoaReagrupada.numeroPassaporte",
  "dadosExtraidos.campos.pessoaReagrupada.numeroPassaporte",
  "dadosExtraidos.gpt.pessoaReagrupada.numeroPassaporte"
];

// Lista de campos para número do documento do responsável
const camposNumeroDocumentoResponsavel = [
  // Campos diretos
  "numeroDocumentoResponsavel",
  "campos.numeroDocumentoResponsavel",
  
  // CPLPMenor
  "dados_do_responsavel.numero_do_documento",
  "campos.dados_do_responsavel.numero_do_documento",
  "dadosExtraidos.campos.dados_do_responsavel.numero_do_documento",
  "dadosExtraidos.gpt.dados_do_responsavel.numero_do_documento",
  
  // ReagrupamentoTutor
  "pessoaQueRegrupa.numeroDocumento",
  "campos.pessoaQueRegrupa.numeroDocumento",
  "dadosExtraidos.campos.pessoaQueRegrupa.numeroDocumento",
  "dadosExtraidos.gpt.pessoaQueRegrupa.numeroDocumento"
];

// Lista de campos para nacionalidade do menor
const camposNacionalidadeMenor = [
  // Campos diretos
  "nacionalidade",
  "campos.nacionalidade",
  "dadosExtraidos.campos.nacionalidade",
  "dadosExtraidos.gpt.nacionalidade",
  
  // CPLPMenor
  "dados_do_menor.nacionalidade",
  "campos.dados_do_menor.nacionalidade",
  "dadosExtraidos.campos.dados_do_menor.nacionalidade",
  "dadosExtraidos.gpt.dados_do_menor.nacionalidade",
  
  // ReagrupamentoTutor
  "pessoaReagrupada.nacionalidade",
  "campos.pessoaReagrupada.nacionalidade",
  "dadosExtraidos.campos.pessoaReagrupada.nacionalidade",
  "dadosExtraidos.gpt.pessoaReagrupada.nacionalidade"
];

// Lista de campos para data de validade do documento do menor
const camposDataValidadeMenor = [
  // Campos diretos
  "dataValidade",
  "dataValidadePassaporte",
  "campos.dataValidade",
  "campos.dataValidadePassaporte",
  "dadosExtraidos.campos.dataValidade",
  "dadosExtraidos.gpt.dataValidade",
  
  // CPLPMenor
  "dados_do_menor.data_de_validade_do_documento",
  "campos.dados_do_menor.data_de_validade_do_documento",
  "dadosExtraidos.campos.dados_do_menor.data_de_validade_do_documento",
  "dadosExtraidos.gpt.dados_do_menor.data_de_validade_do_documento",
  
  // ReagrupamentoTutor
  "pessoaReagrupada.dataValidadePassaporte",
  "pessoaReagrupada.dataValidade",
  "campos.pessoaReagrupada.dataValidadePassaporte",
  "campos.pessoaReagrupada.dataValidade",
  "dadosExtraidos.campos.pessoaReagrupada.dataValidadePassaporte",
  "dadosExtraidos.gpt.pessoaReagrupada.dataValidadePassaporte"
];

// Lista de campos para data de validade do documento do responsável
const camposDataValidadeResponsavel = [
  // Campos diretos
  "dataValidadeResponsavel",
  "campos.dataValidadeResponsavel",
  "dadosExtraidos.campos.dataValidadeResponsavel",
  "dadosExtraidos.gpt.dataValidadeResponsavel",
  
  // CPLPMenor
  "dados_do_responsavel.data_de_validade_do_documento",
  "campos.dados_do_responsavel.data_de_validade_do_documento",
  "dadosExtraidos.campos.dados_do_responsavel.data_de_validade_do_documento",
  "dadosExtraidos.gpt.dados_do_responsavel.data_de_validade_do_documento",
  
  // ReagrupamentoTutor
  "pessoaQueRegrupa.dataValidade",
  "pessoaQueRegrupa.dataValidadePassaporte",
  "campos.pessoaQueRegrupa.dataValidade",
  "campos.pessoaQueRegrupa.dataValidadePassaporte",
  "dadosExtraidos.campos.pessoaQueRegrupa.dataValidade",
  "dadosExtraidos.gpt.pessoaQueRegrupa.dataValidade"
];

// Função genérica para extrair valores de campos
function extrairValorDoCampo(objeto, listaCampos) {
  console.log(`ChildPdfProcessor: Buscando valor em ${listaCampos.length} caminhos possíveis`);
  
  for (const caminho of listaCampos) {
    try {
      // Navegação pelo objeto
      const valor = caminho.split('.').reduce(
        (obj, key) => obj && obj[key] !== undefined ? obj[key] : undefined, 
        objeto
      );
      
      if (valor) {
        console.log(`ChildPdfProcessor: Valor encontrado em ${caminho}: ${valor}`);
        return valor;
      }
    } catch (e) {
      // Ignora erro se o caminho não existir
      continue;
    }
  }
  
  console.log(`ChildPdfProcessor: Valor não encontrado`);
  return "";
}

/**
 * Componente para processar PDFs de menores com o nome sobreposto
 */
const ChildPdfProcessor = ({ 
  processId, 
  personName, 
  responsibleName, // Nome do responsável (adulto)
  dataValidade, // Data de validade do documento do menor
  dataValidadeResponsavel, // Data de validade do documento do responsável
  completePdfPath, 
  onPdfProcessed, 
  onError,
  processData, // Dados completos do processo
  processo // Dados completos do processo (alternativo)
}) => {
  const [isProcessing, setIsProcessing] = useState(true);
  const [pdfUrl, setPdfUrl] = useState(null);
  const processedRef = useRef(false);
  const isMountedRef = useRef(true);
  const previousNameRef = useRef('');
  const previousResponsibleRef = useRef('');

  // Função para carregar o PDF base para menores
  const loadBasePdf = async () => {
    console.log('ChildPdfProcessor: Carregando PDF base para menores');
    const basePdfUrl = '/pdf-menores.pdf';
    
    try {
      const response = await fetch(basePdfUrl);
      if (!response.ok) {
        throw new Error(`Falha ao obter PDF base para menores: ${response.status} ${response.statusText}`);
      }
      const arrayBuffer = await response.arrayBuffer();
      const pdfSize = arrayBuffer.byteLength;
      console.log(`ChildPdfProcessor: PDF base para menores carregado com sucesso (${pdfSize} bytes)`);
      console.log('ChildPdfProcessor: ✅ CONFIRMADO: USANDO PDF-MENORES.PDF');
      return new Uint8Array(arrayBuffer);
    } catch (error) {
      console.error('ChildPdfProcessor: Erro ao carregar PDF base para menores:', error);
      throw new Error('Não foi possível carregar o PDF base para menores. Verifique se o arquivo existe na pasta public.');
    }
  };

  // Função para verificar se existe um PDF completo nos arquivos do processo
  const findUploadedCompletePdf = () => {
    // Se o completePdfPath foi fornecido, usamos ele diretamente
    if (completePdfPath) {
      console.log('ChildPdfProcessor: Usando caminho completo do PDF fornecido:', completePdfPath);
      return { path: completePdfPath };
    }
    
    console.log('ChildPdfProcessor: Nenhum caminho completo do PDF encontrado');
    return null;
  };

  useEffect(() => {
    isMountedRef.current = true;
    
    // Verificar se algum nome mudou para reprocessar o PDF
    if (previousNameRef.current !== personName || previousResponsibleRef.current !== responsibleName) {
      processedRef.current = false;
      // Limpar URL anterior se existir
      if (pdfUrl) {
        URL.revokeObjectURL(pdfUrl);
        setPdfUrl(null);
      }
      previousNameRef.current = personName;
      previousResponsibleRef.current = responsibleName;
    }
    
    const processChildPdf = async () => {
      if (processedRef.current) return;
      
      try {
        setIsProcessing(true);
        console.log('ChildPdfProcessor: Iniciando processamento do PDF para menor');
        
        // Coletar os dados do processo
        const dadosComProcessId = { 
          ...processData,
          ...processo,
          processId: processId || processData?.processId || processo?.processId
        };
        
        // Extrair os valores dos campos usando as funções genéricas
        const nomeMenor = personName || extrairValorDoCampo(dadosComProcessId, camposNomeMenor);
        console.log(`ChildPdfProcessor: Nome do menor extraído: ${nomeMenor}`);
        
        // Priorizar a prop responsibleName para o nome do responsável
        let nomeResponsavel;
        if (responsibleName && responsibleName.trim() !== '') {
          // Usar diretamente o nome do responsável passado como prop
          nomeResponsavel = responsibleName;
          console.log(`ChildPdfProcessor: Usando nome do responsável da prop: ${nomeResponsavel}`);
        } else {
          // Usar a função genérica para extrair
          nomeResponsavel = extrairValorDoCampo(dadosComProcessId, camposNomeResponsavel);
          console.log(`ChildPdfProcessor: Extraído nome do responsável com função genérica: ${nomeResponsavel}`);
        }
        console.log(`ChildPdfProcessor: Nome do responsável final: ${nomeResponsavel}`);
        
        const numeroDocumentoMenor = extrairValorDoCampo(dadosComProcessId, camposNumeroDocumentoMenor);
        console.log(`ChildPdfProcessor: Número do documento do menor extraído: ${numeroDocumentoMenor}`);
        
        const numeroDocumentoResponsavel = extrairValorDoCampo(dadosComProcessId, camposNumeroDocumentoResponsavel);
        console.log(`ChildPdfProcessor: Número do documento do responsável extraído: ${numeroDocumentoResponsavel}`);
        
        const nacionalidadeMenor = extrairValorDoCampo(dadosComProcessId, camposNacionalidadeMenor);
        console.log(`ChildPdfProcessor: Nacionalidade do menor extraída: ${nacionalidadeMenor}`);
        
        const dataValidadeMenorExtraida = dataValidade || extrairValorDoCampo(dadosComProcessId, camposDataValidadeMenor);
        console.log(`ChildPdfProcessor: Data de validade do documento do menor extraída: ${dataValidadeMenorExtraida}`);
        
        const dataValidadeResponsavelExtraida = dataValidadeResponsavel || extrairValorDoCampo(dadosComProcessId, camposDataValidadeResponsavel);
        console.log(`ChildPdfProcessor: Data de validade do documento do responsável extraída: ${dataValidadeResponsavelExtraida}`);
        
        // Buscar o PDF completo primeiro, se existir
        let pdfBytes;
        const completePdfFile = findUploadedCompletePdf();
        let pdfDoc;
        let usandoPdfCompleto = false;
        
        if (completePdfFile) {
          try {
            console.log('ChildPdfProcessor: Usando PDF completo:', completePdfFile.path);
            
            // Processar os URLs corretamente
            let fetchUrl = completePdfFile.path;
            
            // Verificar se é um URL completo (contém http:// ou https://)
            if (fetchUrl.includes('http://') || fetchUrl.includes('https://')) {
              // Extrair apenas o caminho relativo do URL
              const pathMatch = fetchUrl.match(/uploads\/.*$/);
              if (pathMatch) {
                // Usar apenas o caminho relativo com a API
                fetchUrl = `/api/files/${pathMatch[0]}`;
              } else {
                // Fallback para usar o caminho completo via API
                fetchUrl = `/api/files/${encodeURIComponent(fetchUrl)}`;
              }
            } else if (!fetchUrl.startsWith('/api/')) {
              // Se é um caminho relativo (não começa com /api/)
              fetchUrl = `/api/files/${fetchUrl}`;
            }
            
            console.log('ChildPdfProcessor: Buscando PDF em:', fetchUrl);
            
            const response = await fetch(fetchUrl);
            if (response.ok) {
              const completePdfArrayBuffer = await response.arrayBuffer();
              pdfBytes = new Uint8Array(completePdfArrayBuffer);
              console.log('ChildPdfProcessor: PDF completo carregado com sucesso');
              
              // Carregar o PDF completo
              pdfDoc = await PDFDocument.load(pdfBytes);
              const numPages = pdfDoc.getPageCount();
              console.log('ChildPdfProcessor: PDF carregado com sucesso', numPages, 'páginas');
              
              // Verificar se tem mais de uma página
              usandoPdfCompleto = numPages > 1;
              console.log(`ChildPdfProcessor: Usando PDF completo? ${usandoPdfCompleto ? 'SIM ✅' : 'NÃO ❌'} (${numPages} páginas)`);
              
              if (!usandoPdfCompleto) {
                console.log('ChildPdfProcessor: PDF completo tem apenas uma página, usando como base');
                // Já temos o PDF carregado, não precisamos carregar o base
              }
            } else {
              throw new Error(`Erro ao carregar PDF completo: ${response.status} ${response.statusText}`);
            }
          } catch (error) {
            console.error('ChildPdfProcessor: Erro ao carregar PDF completo:', error);
            // Fallback para o PDF base
            console.log('ChildPdfProcessor: Usando PDF base como fallback...');
            pdfBytes = await loadBasePdf();
            pdfDoc = await PDFDocument.load(pdfBytes);
            console.log('ChildPdfProcessor: PDF base carregado com sucesso', pdfDoc.getPageCount(), 'páginas');
          }
        } else {
          console.log('ChildPdfProcessor: PDF completo não encontrado, usando PDF base');
          pdfBytes = await loadBasePdf();
          pdfDoc = await PDFDocument.load(pdfBytes);
          console.log('ChildPdfProcessor: PDF base carregado com sucesso', pdfDoc.getPageCount(), 'páginas');
        }
        
        // Variáveis para processar o PDF
        let pdfCompletoDoc;
        let pdfCompletoPages = [];
        let pdfBaseMenores;
        
        // Se estamos usando o PDF completo com múltiplas páginas
        if (usandoPdfCompleto) {
          // Guardar o PDF completo para uso posterior
          pdfCompletoDoc = pdfDoc;
          pdfCompletoPages = pdfDoc.getPages();
          
          // Carregar o PDF base de menores para obter a primeira página para preenchimento
          pdfBaseMenores = await loadBasePdf();
          pdfDoc = await PDFDocument.load(pdfBaseMenores);
        }
        
        // Modificar o PDF
        const pages = pdfDoc.getPages();
        const firstPage = pages[0];
        
        // Adicionar fonte padrão
        const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
        const helveticaBoldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
        const fontSize = 12;
        
        // Adicionar o nome do menor
        if (nomeMenor) {
          console.log('ChildPdfProcessor: Adicionando nome do menor ao PDF:', nomeMenor);
          firstPage.drawText(nomeMenor, {
            x: childPdfCoordinates.nomeMenor.x,
            y: childPdfCoordinates.nomeMenor.y,
            size: fontSize,
            font: helveticaBoldFont,
            color: rgb(0, 0, 0),
          });
        }
        
        // Adicionar o nome do responsável
        if (nomeResponsavel) {
          console.log('ChildPdfProcessor: Adicionando nome do responsável ao PDF:', nomeResponsavel);
          firstPage.drawText(nomeResponsavel, {
            x: childPdfCoordinates.nomeResponsavel.x,
            y: childPdfCoordinates.nomeResponsavel.y,
            size: fontSize,
            font: helveticaBoldFont,
            color: rgb(0, 0, 0),
          });
        }
        
        // Adicionar número do documento do menor
        if (numeroDocumentoMenor) {
          console.log('ChildPdfProcessor: Adicionando número do documento do menor ao PDF:', numeroDocumentoMenor);
          firstPage.drawText(numeroDocumentoMenor, {
            x: childPdfCoordinates.numeroDocumentoMenor.x,
            y: childPdfCoordinates.numeroDocumentoMenor.y,
            size: fontSize,
            font: helveticaFont,
            color: rgb(0, 0, 0)
          });
        }
        
        // Adicionar nacionalidade do menor
        if (nacionalidadeMenor) {
          console.log('ChildPdfProcessor: Adicionando nacionalidade do menor ao PDF:', nacionalidadeMenor);
          firstPage.drawText(nacionalidadeMenor, {
            x: childPdfCoordinates.nacionalidadeMenor.x,
            y: childPdfCoordinates.nacionalidadeMenor.y,
            size: fontSize,
            font: helveticaFont,
            color: rgb(0, 0, 0)
          });
        }
        
        // Adicionar número do documento do responsável
        if (numeroDocumentoResponsavel) {
          console.log('ChildPdfProcessor: Adicionando número do documento do responsável ao PDF:', numeroDocumentoResponsavel);
          firstPage.drawText(numeroDocumentoResponsavel, {
            x: childPdfCoordinates.numeroDocumentoResponsavel.x,
            y: childPdfCoordinates.numeroDocumentoResponsavel.y,
            size: fontSize,
            font: helveticaFont,
            color: rgb(0, 0, 0)
          });
        }

        // Adicionar a data de validade do documento do menor, se disponível
        if (dataValidadeMenorExtraida) {
          console.log('ChildPdfProcessor: Adicionando data de validade do documento do menor:', dataValidadeMenorExtraida);
          
          // Obter a data no formato numérico em vez de mês por extenso
          const { dia, mes, ano } = formatarDataNumerica(dataValidadeMenorExtraida);
          
          if (dia && mes && ano) {
            // Adicionar o dia
            firstPage.drawText(dia, {
              x: childPdfCoordinates.dataValidadeMenor.dia.x,
              y: childPdfCoordinates.dataValidadeMenor.dia.y,
              size: fontSize,
              font: helveticaBoldFont,
              color: rgb(0, 0, 0)
            });
            
            // Adicionar o mês em formato numérico
            firstPage.drawText(mes, {
              x: childPdfCoordinates.dataValidadeMenor.mes.x,
              y: childPdfCoordinates.dataValidadeMenor.mes.y,
              size: fontSize,
              font: helveticaBoldFont,
              color: rgb(0, 0, 0)
            });
            
            // Adicionar o ano
            firstPage.drawText(ano, {
              x: childPdfCoordinates.dataValidadeMenor.ano.x,
              y: childPdfCoordinates.dataValidadeMenor.ano.y,
              size: fontSize,
              font: helveticaBoldFont,
              color: rgb(0, 0, 0)
            });
            
            console.log(`ChildPdfProcessor: Data de validade do menor formatada adicionada: ${dia}/${mes}/${ano}`);
          }
        }
        
        // Adicionar a data de validade do documento do responsável, se disponível
        if (dataValidadeResponsavelExtraida) {
          console.log('ChildPdfProcessor: Adicionando data de validade do documento do responsável:', dataValidadeResponsavelExtraida);
          
          // Obter a data no formato numérico em vez de mês por extenso
          const { dia, mes, ano } = formatarDataNumerica(dataValidadeResponsavelExtraida);
          
          if (dia && mes && ano) {
            // Adicionar o dia
            firstPage.drawText(dia, {
              x: childPdfCoordinates.dataValidadeResponsavel.dia.x,
              y: childPdfCoordinates.dataValidadeResponsavel.dia.y,
              size: fontSize,
              font: helveticaBoldFont,
              color: rgb(0, 0, 0)
            });
            
            // Adicionar o mês em formato numérico
            firstPage.drawText(mes, {
              x: childPdfCoordinates.dataValidadeResponsavel.mes.x,
              y: childPdfCoordinates.dataValidadeResponsavel.mes.y,
              size: fontSize,
              font: helveticaBoldFont,
              color: rgb(0, 0, 0)
            });
            
            // Adicionar o ano
            firstPage.drawText(ano, {
              x: childPdfCoordinates.dataValidadeResponsavel.ano.x,
              y: childPdfCoordinates.dataValidadeResponsavel.ano.y,
              size: fontSize,
              font: helveticaBoldFont,
              color: rgb(0, 0, 0)
            });
            
            console.log(`ChildPdfProcessor: Data de validade do responsável formatada adicionada: ${dia}/${mes}/${ano}`);
          }
        }
        
        // Adicionar a data atual ao PDF (sem assinatura)
        const dataAtual = new Date();
        const diaAtual = dataAtual.getDate().toString().padStart(2, '0');
        const mesAtualPorExtenso = mesesPorExtenso[dataAtual.getMonth()];
        
        // Adicionar dia da DATA ATUAL
        firstPage.drawText(diaAtual, {
          x: childPdfCoordinates.dataAtual.dia.x,
          y: childPdfCoordinates.dataAtual.dia.y,
          size: fontSize,
          font: helveticaFont,
          color: rgb(0, 0, 0)
        });
        
        // Adicionar mês da DATA ATUAL (por extenso)
        firstPage.drawText(mesAtualPorExtenso, {
          x: childPdfCoordinates.dataAtual.mes.x,
          y: childPdfCoordinates.dataAtual.dia.y,
          size: fontSize,
          font: helveticaFont,
          color: rgb(0, 0, 0)
        });
        
        console.log(`ChildPdfProcessor: DATA ATUAL adicionada: ${diaAtual} de ${mesAtualPorExtenso} (sem ano)`);
        
        // Mapeamento entre IDs das checkboxes no sistema e IDs no PDF
        // Usando apenas as opções padronizadas conforme processoConfig.js
        const checkboxMapping = {
          "consentimentoDados": 'tratamentoDados',
          "cplp": 'trocaCredenciaisCPLP',
          "sapa": 'trocaCredenciaisSAPA',
          "renovacao": 'trocaCredenciaisRenovacao',
          "outros": 'outros'
        };

        // Obter dados das checkboxes selecionadas
        const selectedFields = dadosComProcessId?.campos?.selectedFields || 
                              dadosComProcessId?.selectedFields || 
                              {};

        console.log('ChildPdfProcessor: Campos selecionados:', selectedFields);

        // Adicionar X em todas as checkboxes marcadas (sem marcar nenhuma por padrão)
        Object.keys(checkboxMapping).forEach(checkboxId => {
          if (selectedFields[checkboxId]) {
            const pdfCheckboxId = checkboxMapping[checkboxId];
            const coords = childPdfCoordinates.checkboxes[pdfCheckboxId];
            
            if (coords) {
              console.log(`ChildPdfProcessor: Marcando checkbox ${checkboxId} em (${coords.x}, ${coords.y})`);
              
              // Desenhar um X grande e bem visível
              firstPage.drawText('X', {
                x: coords.x,
                y: coords.y,
                size: fontSize + 4, // Tamanho maior que o texto normal
                font: helveticaBoldFont,
                color: rgb(0, 0, 0), // Preto
                opacity: 1.0 // Totalmente opaco
              });
              
              // Se for a opção "outros", adicionar o texto especificado
              if (checkboxId === 'outros') {
                const outrosDetalhes = dadosComProcessId?.outrosDetalhes || 
                                    dadosComProcessId?.campos?.outrosDetalhes || 
                                    '';
                                    
                if (outrosDetalhes) {
                  console.log(`ChildPdfProcessor: Adicionando detalhes de "outros": ${outrosDetalhes}`);
                  firstPage.drawText(outrosDetalhes, {
                    x: childPdfCoordinates.checkboxes.outrosTexto.x, // Usar coordenada específica do texto
                    y: childPdfCoordinates.checkboxes.outrosTexto.y,
                    size: fontSize,
                    font: helveticaFont,
                    color: rgb(0, 0, 0)
                  });
                }
              }
            }
          }
        });
        
        // Adicionar assinatura ao PDF
        await addSignatureToPdf(firstPage, pdfDoc, processo, helveticaFont);
        
        // Se estamos a usar o PDF completo, precisamos juntar ambos os PDFs
        if (usandoPdfCompleto) {
          // Criar um novo PDF para mesclar a página de consentimento editada com o PDF completo original
          const mergedPdf = await PDFDocument.create();
          
          // Primeiro, copiar a página de consentimento editada
          const [editedConsentPage] = await mergedPdf.copyPages(pdfDoc, [0]);
          mergedPdf.addPage(editedConsentPage);
          
          // Depois, copiar todas as páginas do PDF completo original, exceto a primeira (que é a página de consentimento não editada)
          for (let i = 1; i < pdfCompletoPages.length; i++) {
            const [copiedPage] = await mergedPdf.copyPages(pdfCompletoDoc, [i]);
            mergedPdf.addPage(copiedPage);
          }
          
          console.log(`ChildPdfProcessor: PDF mesclado com sucesso: 1 página editada + ${pdfCompletoPages.length - 1} páginas de documentos`);
          
          // Usar o PDF mesclado como resultado final
          pdfDoc = mergedPdf;
        }
        
        // Salvar o PDF modificado
        const modifiedPdfBytes = await pdfDoc.save();
        console.log('ChildPdfProcessor: PDF modificado salvo com sucesso');
        
        // Criar uma URL para o PDF modificado
        const pdfBlob = new Blob([modifiedPdfBytes], { type: 'application/pdf' });
        const pdfUrl = URL.createObjectURL(pdfBlob);
        console.log('ChildPdfProcessor: URL do PDF criada:', pdfUrl);
        
        if (isMountedRef.current) {
          setPdfUrl(pdfUrl);
          setIsProcessing(false);
          processedRef.current = true;
          if (onPdfProcessed) onPdfProcessed(pdfUrl);
          console.log('ChildPdfProcessor: Processamento concluído com sucesso');
        }
      } catch (error) {
        console.error('ChildPdfProcessor: Erro ao processar PDF de menor:', error);
        if (isMountedRef.current) {
          setIsProcessing(false);
          processedRef.current = true;
          if (onError) onError(error.message);
        }
      }
    };
    
    if (processId && (personName || responsibleName) && !processedRef.current) {
      processChildPdf();
    }
    
    return () => {
      isMountedRef.current = false;
      // Limpar URL se existir
      if (pdfUrl) URL.revokeObjectURL(pdfUrl);
    };
  }, [processId, personName, responsibleName, dataValidade, dataValidadeResponsavel, onPdfProcessed, onError, completePdfPath, processData, processo]);
  
  // Este componente não renderiza nada visualmente, apenas processa o PDF
  return null;
};

ChildPdfProcessor.propTypes = {
  processId: PropTypes.string.isRequired,
  personName: PropTypes.string,
  responsibleName: PropTypes.string,
  dataValidade: PropTypes.string,
  dataValidadeResponsavel: PropTypes.string,
  completePdfPath: PropTypes.string,
  onPdfProcessed: PropTypes.func,
  onError: PropTypes.func,
  processData: PropTypes.object,
  processo: PropTypes.object
};

export default ChildPdfProcessor;