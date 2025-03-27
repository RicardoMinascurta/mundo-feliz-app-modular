import { useState, useEffect } from 'react';
import useUpload from './useUpload';
import { uploadService } from '../services/uploadService';
import { logger } from '../services/LoggerService';

/**
 * Hook especializado para processos TR Estudante 2
 * Garante persistência e consistência do ID entre diferentes etapas do processo
 * @param {string} initialProcessId - ID inicial do processo (opcional)
 * @returns {Object} - Objeto com funções e estados para gerenciar uploads com persistência de ID
 */
export default function useTREstudante2(initialProcessId = null) {
  // Recuperar ID persistente do sessionStorage ou usar o fornecido
  const [processId, setProcessId] = useState(() => {
    const storedId = sessionStorage.getItem('currentTREstudante2ProcessId');
    return initialProcessId || storedId || null;
  });
  
  // Usar o hook useUpload com o tipo fixo 'ConcessaoTREstudante2'
  const uploadHook = useUpload(
    uploadService, 
    'ConcessaoTREstudante2',  
    processId
  );
  
  // Sincronizar quando o ID mudar no hook subjacente
  useEffect(() => {
    if (uploadHook.processId && uploadHook.processId !== processId) {
      logger.info(`TR Estudante 2 - Sincronizando ID: ${uploadHook.processId}`);
      setProcessId(uploadHook.processId);
      sessionStorage.setItem('currentTREstudante2ProcessId', uploadHook.processId);
    }
  }, [uploadHook.processId, processId]);
  
  // Função para finalizar o processo e limpar o ID
  const finishProcess = () => {
    logger.info(`TR Estudante 2 - Finalizando processo: ${processId}`);
    sessionStorage.removeItem('currentTREstudante2ProcessId');
  };
  
  // Função para forçar a geração de um novo ID
  const resetProcessId = async () => {
    logger.info(`TR Estudante 2 - Resetando ID de processo`);
    sessionStorage.removeItem('currentTREstudante2ProcessId');
    
    // Solicitar novo ID
    try {
      const newId = await uploadHook.ensureValidProcessId();
      logger.info(`TR Estudante 2 - Novo ID gerado: ${newId}`);
      setProcessId(newId);
      sessionStorage.setItem('currentTREstudante2ProcessId', newId);
      return newId;
    } catch (error) {
      logger.error(`TR Estudante 2 - Erro ao gerar novo ID:`, error);
      throw error;
    }
  };
  
  // Sobrescrever a função submitDocuments para garantir tipo correto
  const submitDocuments = async (dadosProcesso = {}) => {
    // Garantir que estamos usando o tipo correto
    dadosProcesso.tipoProcesso = 'ConcessaoTREstudante2';
    dadosProcesso.tipoDocumento = 'TREstudante2';
    
    // Verificar se existem dados extraídos e garantir que sejam copiados para 'campos'
    if (!dadosProcesso.campos || Object.keys(dadosProcesso.campos).length === 0) {
      logger.info('TR Estudante 2 - Dados de campos não encontrados, tentando extrair de outras fontes');
      
      // Tentar extrair de várias fontes em ordem de prioridade
      if (dadosProcesso.dadosExtraidos?.gpt) {
        logger.info('TR Estudante 2 - Usando dados de dadosExtraidos.gpt');
        dadosProcesso.campos = dadosProcesso.dadosExtraidos.gpt;
      } else if (dadosProcesso.dadosExtraidos?.campos) {
        logger.info('TR Estudante 2 - Usando dados de dadosExtraidos.campos');
        dadosProcesso.campos = dadosProcesso.dadosExtraidos.campos;
      } else if (dadosProcesso.extractedData?.gpt) {
        logger.info('TR Estudante 2 - Usando dados de extractedData.gpt');
        dadosProcesso.campos = dadosProcesso.extractedData.gpt;
      }
    } else {
      logger.info(`TR Estudante 2 - Enviando campos: ${Object.keys(dadosProcesso.campos).join(', ')}`);
    }
    
    // Chamar a função original do hook
    return uploadHook.submitDocuments(dadosProcesso);
  };
  
  return {
    ...uploadHook,
    processId,
    finishProcess,
    resetProcessId,
    submitDocuments
  };
} 