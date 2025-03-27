/**
 * Serviço para gerenciar os processos
 */

import { jsonData, logger } from './';

class ProcessoService {
  /**
   * Busca um processo específico pelo ID
   * @param {string} processId - ID do processo
   * @returns {Promise<Object|null>} - Processo encontrado ou null
   */
  async getProcessById(processId) {
    try {
      if (!processId) {
        logger.error('ProcessoService: ID do processo não fornecido');
        return null;
      }
      
      const processos = await jsonData.getAllProcesses();
      const processo = processos.find(p => p.processId === processId);
      
      if (!processo) {
        logger.warn(`ProcessoService: Processo não encontrado: ${processId}`);
        return null;
      }
      
      return processo;
    } catch (error) {
      logger.error(`ProcessoService: Erro ao buscar processo: ${processId}`, error);
      throw error;
    }
  }
}

// Criação e exportação do serviço
const processoServiceInstance = new ProcessoService();

// Exportar como um objeto nomeado
export const processoService = processoServiceInstance;

// Garantir que também exista uma exportação padrão
export default processoServiceInstance; 