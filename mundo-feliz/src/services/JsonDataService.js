/**
 * Serviço para acesso a dados dos processos através da API
 */

import { logger } from './LoggerService.js';

// Definir a URL base do servidor
const baseUrl = 'http://localhost:3001';

/**
 * Obtém um processo pelo ID
 * @param {string} processId ID do processo
 * @returns {Promise<Object>} Dados do processo
 */
async function getProcessoById(processId) {
  try {
    const response = await fetch(`${baseUrl}/api/processos/${processId}`);
    if (!response.ok) {
      logger.error(`Erro ao obter processo ${processId}: ${response.status}`);
      return null;
    }
    return await response.json();
  } catch (error) {
    logger.error(`Erro ao obter processo ${processId}`, error);
    return null;
  }
}

/**
 * Lista todos os processos
 * @returns {Promise<Array>} Lista de processos
 */
async function listProcessos() {
  try {
    const response = await fetch(`${baseUrl}/api/processos/all`);
    if (!response.ok) {
      logger.error(`Erro ao listar processos: ${response.status}`);
      return [];
    }
    return await response.json();
  } catch (error) {
    logger.error('Erro ao listar processos', error);
    return [];
  }
}

/**
 * Atualiza um processo
 * @param {string} processId ID do processo
 * @param {Object} dadosProcesso Dados do processo
 * @returns {Promise<Object>} Resultado da operação
 */
async function updateProcesso(processId, dadosProcesso) {
  try {
    // Garantir que o processId esteja incluído nos dados
    if (typeof dadosProcesso === 'object') {
      dadosProcesso.processId = processId;
    } else {
      // Se dadosProcesso não for um objeto, estamos recebendo apenas o objeto de processo inteiro
      dadosProcesso = { processId };
      logger.warn(`updateProcesso: Formato inesperado de dados, usando apenas processId=${processId}`);
    }
    
    logger.info(`Enviando atualização para processo ${processId}`);
    
    const response = await fetch(`${baseUrl}/api/save-processo`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(dadosProcesso)
    });
    
    if (!response.ok) {
      logger.error(`Erro ao atualizar processo: ${response.status}`);
      return { success: false, error: 'Erro ao salvar processo' };
    }
    
    return await response.json();
  } catch (error) {
    logger.error(`Erro ao atualizar processo ${processId}`, error);
    return { success: false, error: error.message };
  }
}

// Criar objeto para exportação
const jsonData = {
  getProcessoById,
  listProcessos,
  updateProcesso
};

// Exportação nomeada para compatibilidade
export { jsonData };

// Exportação padrão
export default jsonData; 