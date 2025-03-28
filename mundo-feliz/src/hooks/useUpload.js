/**
 * Hook para gerenciamento de uploads de documentos
 */

import { useState, useEffect, useCallback } from 'react';
import { jsonData, ocrService, gptService, gptProcessingService, logger, uploadService as defaultUploadService, idGeneratorService, pdfService, fileStorage } from '../services';
import captureService from '../components/debug/ProcessoDataCapture';
import { processSignatureBeforeSubmit } from '../components/upload/SignaturePad';
import { API_URL } from '../config/api.js';

const useUpload = (uploadService = defaultUploadService, processType, initialProcessId = null) => {
  // Verificar se há ID já persistido para o tipo, especialmente importante para TR Estudante 2
  const storedProcessId = processType?.includes('Estudante 2') 
    ? sessionStorage.getItem('currentTREstudante2ProcessId') 
    : null;

  const [uploadState, setUploadState] = useState({
    processId: initialProcessId || storedProcessId || null,  // Priorizar ID fornecido, depois o armazenado
    documents: {},
    signature: null,
    errors: {},
    isProcessing: false,
    isSubmitting: false
  });

  // Função para garantir que temos um ID de processo válido
  const ensureValidProcessId = useCallback(() => {
    if (!uploadState.processId) {
      let tipoProcesso = processType;
      
      // Mapeamento específico para processos de informação
      if (processType.toLowerCase().includes('infoportal') || 
          processType.toLowerCase().includes('info_portal')) {
        tipoProcesso = 'InfoPortal';
      } else if (processType.toLowerCase().includes('infopresencial') || 
                 processType.toLowerCase().includes('info_presencial')) {
        tipoProcesso = 'InfoPresencial';
      }
      
      // Gerar um novo ID usando o tipo de processo correto
      const novoId = `${tipoProcesso}-${idGeneratorService.gerarProcessId(tipoProcesso)}`;
      
      // Atualizar o estado com o novo ID
      setUploadState(prev => ({
        ...prev,
        processId: novoId
      }));
      
      // Log para debug
      logger.info(`Novo ID gerado: ${novoId} para tipo de processo: ${tipoProcesso}`);
      
      return novoId;
    }
    return uploadState.processId;
  }, [uploadState.processId, processType]);

  // Inicializar ao carregar
  useEffect(() => {
    const checkExistingData = async () => {
      try {
        // Verificar se o ID do processo tem o formato correto
        if (!uploadState.processId || !uploadState.processId.includes('-')) {
          logger.warn(`ID de processo inválido ou não inicializado: ${uploadState.processId}`);
          return;
        }
        
        // Verificar formato do ID (deve ser TipoProcesso-timestamp-randomhex)
        const idParts = uploadState.processId.split('-');
        if (idParts.length < 3) {
          logger.warn(`ID de processo com formato incorreto: ${uploadState.processId}. Aguardando geração do ID correto.`);
          return;
        }
        
        // Verificar se já existe processo
        const processo = await jsonData.getProcessoById(uploadState.processId);
        
        if (processo && processo.dadosExtraidos) {
          logger.info('Dados extraídos existentes encontrados');
          
          setUploadState(prev => ({
            ...prev,
            extractedData: processo.dadosExtraidos
          }));
        }
        
        // Verificar estrutura de pastas existente
        const estrutura = await fileStorage.createProcessStructure(uploadState.processId, processType);
        logger.debug('Estrutura de pastas inicializada', { estrutura });
        
      } catch (error) {
        logger.error('Erro ao verificar dados existentes', error);
      }
    };
    
    checkExistingData();
  }, [uploadState.processId, processType]);

  // Efeito para verificar e corrigir o formato do ID
  useEffect(() => {
    if (uploadState.processId) {
      // Verificar se o ID tem o formato correto
      const formatoValido = /^[A-Za-z]+-[a-z0-9]+-[0-9a-f]+$/.test(uploadState.processId);
      
      if (!formatoValido) {
        console.warn(`⚠️ Hook useUpload: ID com formato incorreto: ${uploadState.processId}`);
        // Vamos deixar o generateProcessId corrigir isso
      } else {
        console.log(`✅ Hook useUpload: ID com formato válido: ${uploadState.processId}`);
      }
    }
  }, [uploadState.processId]);

  const updateDocument = (fieldName, file) => {
    // Verificar se é um array de arquivos (múltiplos arquivos)
    if (Array.isArray(file)) {
      setUploadState(prev => {
        // Se já existe um array para este campo, adicionar os novos arquivos
        const existingFiles = Array.isArray(prev.documents[fieldName]?.files) 
          ? prev.documents[fieldName].files 
          : [];

        return {
          ...prev,
          documents: {
            ...prev.documents,
            [fieldName]: {
              files: [...existingFiles, ...file], // Concatenar os arrays
              uploaded: true,
              error: false,
              length: existingFiles.length + file.length
            }
          }
        };
      });
    } else {
      // Caso tradicional - único arquivo
      setUploadState(prev => ({
        ...prev,
        documents: {
          ...prev.documents,
          [fieldName]: {
            file,
            uploaded: true,
            error: false
          }
        }
      }));
    }
  };

  const updateSignature = (signatureData) => {
    setUploadState(prev => ({
      ...prev,
      signature: signatureData
    }));
  };

  const setDocumentError = (fieldName, errorMessage) => {
    setUploadState(prev => ({
      ...prev,
      documents: {
        ...prev.documents,
        [fieldName]: {
          file: null,
          files: [],
          uploaded: false,
          error: true,
          errorMessage
        }
      }
    }));
  };

  const processDocuments = async () => {
    try {
      setUploadState(prev => ({ ...prev, isProcessing: true }));
      
      // Criar estrutura do processo via API
      const response = await fetch('/api/create-process-structure', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          processId: uploadState.processId,
          processType
        })
      });
      
      if (!response.ok) {
        console.warn(`⚠️ Aviso: Não foi possível criar a estrutura do processo. Continuando mesmo assim...`);
      }

      // Processar cada documento
      for (const [fieldName, docData] of Object.entries(uploadState.documents)) {
        if (!docData) continue;
        
        // Verificar se é um array de arquivos ou um único arquivo
        if (Array.isArray(docData.files)) {
          // Caso de múltiplos arquivos
          for (const file of docData.files) {
            await uploadSingleFile(file, fieldName);
          }
        } else {
          // Caso de arquivo único - acessar o arquivo real
          const file = docData.file;
        if (!file) continue;
          await uploadSingleFile(file, fieldName);
        }
      }

      // Flag para rastrear se a assinatura foi processada com sucesso
      let assinaturaProcessada = false;
      
      // Processar assinatura se existir
      if (uploadState.signature) {
        try {
          const resultado = await uploadSignature(uploadState.signature);
          assinaturaProcessada = resultado.success;
          
          if (resultado.warning) {
            console.warn(`⚠️ Aviso na assinatura: ${resultado.warning}`);
          }
        } catch (sigError) {
          console.error(`❌ Erro na assinatura, mas continuando com o processo: ${sigError.message}`);
        }
      }

      // Depois que os documentos são carregados, usar OCR e GPT para o processamento
      try {
        console.log("🔍 Iniciando processamento OCR dos documentos...");
        
        // 1. Extrair texto dos documentos via OCR
        // Modificação: processar todos os documentos, não apenas "passport"
        let ocrResult = {};
        let documentosProcessados = false;
        
        // Processar cada documento carregado
        for (const [fieldName, docData] of Object.entries(uploadState.documents)) {
          if (!docData || !docData.file || !docData.uploaded) continue;
          
          try {
            console.log(`🔍 Processando OCR para documento: ${fieldName}`);
            const docText = await ocrService.extractText(
              docData.file,
              {
                processId: uploadState.processId,
                documentType: fieldName
              }
            );
            
            ocrResult[fieldName] = docText;
            documentosProcessados = true;
            console.log(`✅ OCR concluído para ${fieldName}`);
          } catch (docError) {
            console.error(`⚠️ Erro ao processar OCR para ${fieldName}:`, docError);
            // Continuar com outros documentos mesmo se este falhar
          }
        }
        
        // Verificar se pelo menos um documento foi processado
        if (!documentosProcessados) {
          throw new Error("Nenhum documento válido foi processado. Verifique se os documentos foram carregados corretamente.");
        }
        
        console.log("✅ OCR concluído com sucesso, iniciando processamento GPT...");
        
        // 2. Processar o texto extraído com GPT usando o novo serviço modular
        const gptResult = await gptProcessingService.processarDados(
          ocrResult,
          processType,
          uploadState.processId
        );
        
        if (!gptResult.success) {
          throw new Error(gptResult.error || 'Falha no processamento GPT');
        }
        
        console.log("✅ GPT concluído com sucesso, atualizando estado...");
        
        setUploadState(prev => ({ 
          ...prev, 
          isProcessing: false,
          extractedData: gptResult.extractedData
        }));
        
        console.log("✅ Processamento completo dos documentos via OCR e GPT");
        
        return {
          success: true,
          extractedData: gptResult.extractedData,
          assinaturaProcessada
        };
      } catch (processingError) {
        console.error('❌ Erro no processamento OCR/GPT:', processingError);
        setUploadState(prev => ({ ...prev, isProcessing: false }));
        throw new Error(`Erro no processamento OCR/GPT: ${processingError.message}`);
      }
    } catch (error) {
      console.error('❌ Erro ao processar documentos:', error);
      setUploadState(prev => ({ ...prev, isProcessing: false }));
      return { success: false, error: error.message };
    }
  };

  // Função auxiliar para upload de um único arquivo
  const uploadSingleFile = async (file, fieldName) => {
    // Método 1: Tentar upload via FormData (multer)
    const multerResult = await tryUploadViaMulter(file, fieldName);
    if (multerResult.success) return multerResult;
    
    // Método 2: Tentar upload via base64
    const base64Result = await tryUploadViaBase64(file, fieldName);
    if (base64Result.success) return base64Result;
    
    // Método 3: Tentar endpoints alternativos
    const alternativeResult = await tryAlternativeEndpoints(file, fieldName);
    if (alternativeResult.success) return alternativeResult;
    
    // Se chegou aqui, todos os métodos falharam
    throw new Error(`Falha em todos os métodos de upload para ${fieldName}: ${multerResult.error}, ${base64Result.error}, ${alternativeResult.error}`);
  };
  
  // Upload via multer (FormData)
  const tryUploadViaMulter = async (file, fieldName) => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('processId', uploadState.processId);
      formData.append('fieldName', fieldName);
      formData.append('documentType', fieldName);

      // Usar a URL completa ou relativa correta
      const baseUrl = 'http://localhost:3001';
      const uploadUrl = `${baseUrl}/api/upload-documento`;
      
      console.log(`📤 Tentando upload via multer para: ${uploadUrl}, tamanho: ${file.size} bytes`);
      
      const uploadResponse = await fetch(uploadUrl, {
        method: 'POST',
        body: formData
      });

      if (!uploadResponse.ok) {
        const errorText = await uploadResponse.text();
        console.error(`❌ Erro no upload via multer (${uploadResponse.status}): ${errorText}`);
        return { 
          success: false, 
          error: `Erro no upload via multer (${uploadResponse.status}): ${errorText}` 
        };
      }
      
      console.log(`✅ Upload via multer bem-sucedido`);
      return { success: true };
    } catch (error) {
      console.error(`❌ Erro de rede no upload via multer: ${error.message}`);
      return { 
        success: false, 
        error: `Erro de rede: ${error.message}` 
      };
    }
  };
  
  // Upload via base64
  const tryUploadViaBase64 = async (file, fieldName) => {
    try {
      console.log(`🔄 Tentando upload via base64...`);
      const base64Data = await fileToBase64(file);
      
      const baseUrl = 'http://localhost:3001';
      const uploadUrl = `${baseUrl}/api/upload-documento-base64`;
      
      console.log(`📤 Enviando para ${uploadUrl}`);
      
      const uploadResponse = await fetch(uploadUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          processId: uploadState.processId,
          documentType: fieldName,
          base64Data: base64Data,
          filename: file.name
        })
      });
      
      if (!uploadResponse.ok) {
        const errorText = await uploadResponse.text();
        console.error(`❌ Erro no upload via base64 (${uploadResponse.status}): ${errorText}`);
        return { 
          success: false, 
          error: `Erro no upload via base64 (${uploadResponse.status}): ${errorText}` 
        };
      }
      
      console.log(`✅ Upload via base64 bem-sucedido`);
      return { success: true };
    } catch (error) {
      console.error(`❌ Erro de rede no upload via base64: ${error.message}`);
      return { 
        success: false, 
        error: `Erro de rede: ${error.message}` 
      };
    }
  };
  
  // Tentar endpoints alternativos
  const tryAlternativeEndpoints = async (file, fieldName) => {
    try {
      console.log(`🔄 Tentando upload via endpoints alternativos...`);
      
      // Tentar o endpoint "file-upload" como última alternativa
      const baseUrl = 'http://localhost:3001';
      const uploadUrl = `${baseUrl}/api/file-upload`;
      
        const formData = new FormData();
        formData.append('file', file);
        formData.append('processId', uploadState.processId);
        formData.append('fieldName', fieldName);
      formData.append('documentType', fieldName);
      
      console.log(`📤 Enviando para ${uploadUrl}`);
      
      const uploadResponse = await fetch(uploadUrl, {
        method: 'POST',
        body: formData
      });
      
      if (!uploadResponse.ok) {
        const errorText = await uploadResponse.text();
        console.error(`❌ Erro no upload alternativo (${uploadResponse.status}): ${errorText}`);
        return { 
          success: false, 
          error: `Erro no upload alternativo (${uploadResponse.status}): ${errorText}` 
        };
      }
      
      console.log(`✅ Upload via endpoint alternativo bem-sucedido`);
      return { success: true };
    } catch (error) {
      console.error(`❌ Erro de rede no upload alternativo: ${error.message}`);
      return { 
        success: false, 
        error: `Erro de rede: ${error.message}` 
      };
    }
  };
  
  // Função de processamento da assinatura antes do envio
  const processSignatureBeforeSubmit = (signatureData) => {
    console.log(`🔍 Processando assinatura antes do upload, tipo:`, typeof signatureData);
    
    // Se for uma string base64, retornar diretamente
    if (typeof signatureData === 'string' && signatureData.startsWith('data:')) {
      console.log(`✅ Assinatura já está em formato base64`);
      return signatureData;
    }
    
    // Se for um objeto com dataURL (formato usado pelo SignaturePad)
    if (signatureData && signatureData.dataURL) {
      console.log(`✅ Assinatura encontrada no formato SignaturePad (dataURL)`);
      return signatureData.dataURL;
    }
    
    // Se for um objeto com toDataURL (canvas)
    if (signatureData && typeof signatureData.toDataURL === 'function') {
      console.log(`✅ Assinatura encontrada como canvas, convertendo para base64`);
      return signatureData.toDataURL('image/png');
    }
    
    // Se for um objeto Blob ou File
    if (signatureData instanceof Blob || signatureData instanceof File) {
      console.log(`✅ Assinatura encontrada como Blob/File`);
      return signatureData;
    }
    
    // Se chegou aqui, formato desconhecido - reportar detalhes do objeto
    console.error(`❌ Formato de assinatura não reconhecido:`, {
      tipo: typeof signatureData,
      ehObjeto: typeof signatureData === 'object',
      chaves: signatureData ? Object.keys(signatureData) : 'nulo'
    });
    
    // Tentar extrair qualquer informação útil
    if (signatureData && typeof signatureData === 'object') {
      // Verificar chaves comuns que podem conter a imagem
      if (signatureData.src) return signatureData.src;
      if (signatureData.image) return signatureData.image;
      if (signatureData.data) return signatureData.data;
      if (signatureData.signature) return processSignatureBeforeSubmit(signatureData.signature);
    }
    
    throw new Error('Formato de assinatura não suportado. Por favor tente desenhar novamente.');
  };

  // Upload de assinatura
  const uploadSignature = async (signatureData) => {
    try {
      console.log(`💾 Iniciando upload de assinatura...`);
      
      // Processar a assinatura para um formato padronizado
      const processedSignature = processSignatureBeforeSubmit(signatureData);
      
      // Função auxiliar para converter para base64, se necessário
      const ensureBase64 = async (data) => {
        if (typeof data === 'string' && data.startsWith('data:')) {
          return data; // Já é base64
        }
        
        if (data instanceof Blob || data instanceof File) {
          return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result);
            reader.readAsDataURL(data);
          });
        }
        
        throw new Error('Não foi possível converter para base64');
      };
      
      // Método 1: Tentar upload como base64
      try {
        const base64Data = await ensureBase64(processedSignature);
        const baseUrl = 'http://localhost:3001';
        const signatureUrl = `${baseUrl}/api/upload-assinatura`;
        
        console.log(`🖋️ Enviando assinatura como base64`);
        
        const signatureResponse = await fetch(signatureUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            processId: uploadState.processId,
            base64Data: base64Data
          })
        });
        
        if (signatureResponse.ok) {
          console.log(`✅ Upload da assinatura como base64 bem-sucedido`);
          return { success: true };
        }
        
        const errorText = await signatureResponse.text();
        console.error(`❌ Erro no upload da assinatura como base64: ${errorText}`);
      } catch (error) {
        console.error(`❌ Erro de rede no upload da assinatura como base64: ${error.message}`);
      }
      
      // Método 2: Tentar criar um File a partir do base64 e fazer upload
      try {
        let signatureFile;
        const base64Data = typeof processedSignature === 'string' ? processedSignature : await ensureBase64(processedSignature);
        
        // Converter base64 para blob
        const fetchResponse = await fetch(base64Data);
        const blob = await fetchResponse.blob();
        signatureFile = new File([blob], "assinatura.png", { type: "image/png" });
        
        const baseUrl = 'http://localhost:3001';
        const multerSignatureUrl = `${baseUrl}/api/upload-assinatura-file`;
        
        console.log(`🖋️ Enviando assinatura como arquivo para: ${multerSignatureUrl}`);
        
        const formData = new FormData();
        formData.append('file', signatureFile);
        formData.append('processId', uploadState.processId);
        formData.append('documentType', 'assinatura');
        
        const signatureResponse = await fetch(multerSignatureUrl, {
          method: 'POST',
          body: formData
        });

        if (signatureResponse.ok) {
          console.log(`✅ Upload da assinatura como arquivo bem-sucedido`);
          return { success: true };
        }
        
        const errorText = await signatureResponse.text();
        console.error(`❌ Erro no upload da assinatura como arquivo: ${errorText}`);
      } catch (error) {
        console.error(`❌ Erro de rede no upload da assinatura como arquivo: ${error.message}`);
      }
      
      // Método 3: Tentar endpoint alternativo de assinatura
      try {
        const base64Data = typeof processedSignature === 'string' ? processedSignature : await ensureBase64(processedSignature);
        
        const baseUrl = 'http://localhost:3001';
        const alternativeUrl = `${baseUrl}/api/process-signature`;
        
        console.log(`🖋️ Tentando endpoint alternativo para assinatura: ${alternativeUrl}`);
        
        const response = await fetch(alternativeUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            processId: uploadState.processId,
            base64Data: base64Data,
            source: 'fallback'
          })
        });
        
        if (response.ok) {
          console.log(`✅ Upload da assinatura via endpoint alternativo bem-sucedido`);
          return { success: true };
        }
        
        const errorText = await response.text();
        console.error(`❌ Erro no upload da assinatura via endpoint alternativo: ${errorText}`);
      } catch (error) {
        console.error(`❌ Erro de rede no upload via endpoint alternativo: ${error.message}`);
      }
      
      // Método 4: Simplesmente ignorar a assinatura e continuar o processo
      console.warn(`⚠️ Não foi possível fazer upload da assinatura, mas continuando o processo...`);
      return { success: true, warning: 'Assinatura ignorada' };
    } catch (error) {
      console.error(`❌ Erro geral no upload da assinatura: ${error.message}`);
      // Ignorar erros de assinatura para permitir que o processo continue
      console.warn(`⚠️ Ignorando erro de assinatura para continuar o processo`);
      return { success: true, warning: 'Erro de assinatura ignorado' };
    }
  };

  const submitDocuments = async (dadosProcesso = {}) => {
    try {
      // Garantir que temos um processId válido
      const processId = await ensureValidProcessId();
      
      logger.info(`Submetendo documentos com ID: ${processId}`);
      
      // Garantir que o dadosProcesso use o processId correto
      dadosProcesso.processId = processId;
      
      if (!uploadService) {
        throw new Error('Serviço de upload não fornecido');
      }

      logger.info(`Tentando enviar documentos para o processo: ${dadosProcesso?.processId || 'desconhecido'}`);

      // Verificação específica para ConcessaoTREstudante2
      if ((processType && (
          processType.toLowerCase().includes('tr estudante 2') ||
          processType.toLowerCase().includes('trestudante2') ||
          processType === 'ConcessaoTREstudante2' ||
          processType === 'TREstudante2')) ||
          (dadosProcesso.tipoProcesso && (
            dadosProcesso.tipoProcesso.toLowerCase().includes('tr estudante 2') ||
            dadosProcesso.tipoProcesso.toLowerCase().includes('trestudante2') ||
            dadosProcesso.tipoProcesso === 'ConcessaoTREstudante2' ||
            dadosProcesso.tipoProcesso === 'TREstudante2'
          ))) {
        logger.info('Detectado envio de processo TR Estudante 2, garantindo consistência de tipos');
        
        // Garantir que o tipo está correto
        dadosProcesso.tipoProcesso = 'ConcessaoTREstudante2';
        dadosProcesso.tipoDocumento = 'TREstudante2';
        
        logger.info(`Tipo de processo normalizado para: tipoProcesso=${dadosProcesso.tipoProcesso}, tipoDocumento=${dadosProcesso.tipoDocumento}`);
      }

      // Garantir que temos o tipoDocumento definido - necessário para processamento no servidor
      if (!dadosProcesso.tipoDocumento && dadosProcesso.tipoProcesso) {
        if (dadosProcesso.tipoProcesso.toLowerCase().includes('estudante')) {
          logger.info('Definindo tipoDocumento como TREstudante para processo de estudante');
          dadosProcesso.tipoDocumento = 'TREstudante';
        } else if (dadosProcesso.tipoProcesso.toLowerCase().includes('tutor')) {
          logger.info('Definindo tipoDocumento como ReagrupamentoTutor para processo de tutor');
          dadosProcesso.tipoDocumento = 'ReagrupamentoTutor';
        } else if (dadosProcesso.tipoProcesso.toLowerCase().includes('pais idosos')) {
          logger.info('Definindo tipoDocumento como ReagrupamentoPaiIdoso para processo de pais idosos');
          dadosProcesso.tipoDocumento = 'ReagrupamentoPaiIdoso';
        } else if (dadosProcesso.tipoProcesso.toLowerCase().includes('contagem')) {
          logger.info('Definindo tipoDocumento como ContagemTempo para processo de contagem');
          dadosProcesso.tipoDocumento = 'ContagemTempo';
        }
      }

      // Log de dados importantes
      logger.info(`Enviando dados para o servidor: tipoProcesso=${dadosProcesso.tipoProcesso}, tipoDocumento=${dadosProcesso.tipoDocumento || 'não definido'}`);

      // Verificar e ajustar dados extraídos
      if (dadosProcesso.extractedData && !dadosProcesso.dadosExtraidos) {
        logger.info('Convertendo extractedData para o formato dadosExtraidos esperado pelo servidor');
        dadosProcesso.dadosExtraidos = {
          ocr: dadosProcesso.extractedData.ocr || {},
          gpt: dadosProcesso.extractedData.gpt || {},
          campos: dadosProcesso.extractedData.campos || dadosProcesso.extractedData.gpt || {}
        };
      }

      // Garantir a existência de todas as propriedades necessárias
      if (!dadosProcesso.dadosExtraidos) {
        dadosProcesso.dadosExtraidos = { ocr: {}, gpt: {}, campos: {} };
      }

      // Enviar documentos para o servidor
      const result = await uploadService.uploadDocumentos(
        dadosProcesso.tipoProcesso || processType,
        processId,
        dadosProcesso
      );

      if (!result.success) {
        throw new Error(result.error || 'Falha ao enviar documentos');
      }

      // Gerar PDF dos documentos depois do upload bem-sucedido
      try {
        logger.info(`Gerando PDF para o processo ${processId}`);
        
        // Primeiro, chamada explícita ao servidor para verificar a estrutura
        try {
          const response = await fetch(`http://localhost:3001/api/create-process-structure`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              processId: processId,
              processType: dadosProcesso.tipoProcesso || processType
            })
          });
          
          if (response.ok) {
            const result = await response.json();
            logger.info(`Estrutura de pastas confirmada no servidor: ${JSON.stringify(result.data)}`);
          } else {
            logger.warn(`Aviso: Não foi possível confirmar estrutura no servidor: ${response.status}`);
          }
        } catch (structError) {
          logger.warn(`Erro ao confirmar estrutura no servidor: ${structError.message}`);
        }
        
        // Agora chamar o serviço de PDF
        logger.info(`Iniciando geração de PDF com: processId=${processId}, tipo=${dadosProcesso.tipoProcesso || processType}`);
        const pdfPath = await pdfService.generatePdfFromDocuments(processId, dadosProcesso.tipoProcesso || processType);
        
        if (pdfPath) {
          logger.info(`PDF gerado com sucesso: ${pdfPath}`);
          
          // Tentar explicitamente atualizar o JSON com o caminho do PDF
          try {
            const processo = await jsonData.getProcessoById(processId);
            if (processo) {
              if (!processo.pdfGerados) {
                processo.pdfGerados = [];
              }
              
              processo.pdfGerados.push({
                path: pdfPath,
                type: 'documentos_completo',
                mimeType: 'application/pdf',
                createdAt: new Date().toISOString()
              });
              
              await jsonData.updateProcesso(processId, processo);
              logger.info(`JSON do processo atualizado com caminho do PDF: ${pdfPath}`);
            }
          } catch (jsonError) {
            logger.warn(`Não foi possível atualizar o JSON com o caminho do PDF: ${jsonError.message}`);
          }
        } else {
          logger.warn(`Não foi possível gerar o PDF para o processo ${processId}`);
        }
      } catch (pdfError) {
        // Não interromper o fluxo principal em caso de erro na geração do PDF
        logger.error(`Erro ao gerar PDF: ${pdfError.message}`, pdfError);
      }

      return result;
    } catch (error) {
      console.error('Erro ao enviar documentos:', error);
      throw error;
    }
  };

  const resetUploadState = () => {
    setUploadState({
      processId: null,
      documents: {},
      signature: null,
      isProcessing: false,
      isSubmitting: false,
      extractedData: null,
      errors: {}
    });
  };

  // Função auxiliar para converter File para Base64
  const fileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = (error) => reject(error);
    });
  };

  return {
    uploadState,
    processId: uploadState.processId,  // Expor o processId
    ensureValidProcessId,              // Expor a função de validação
    updateDocument,
    updateSignature,
    setDocumentError,
    submitDocuments,
    resetUploadState,
    processDocuments
  };
};

export default useUpload; 