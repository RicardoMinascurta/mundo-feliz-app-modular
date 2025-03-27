/**
 * Serviço para gerenciamento de arquivos
 */

import logger from './LoggerService.js';
import { jsonData } from './JsonDataService.js';

// Mapa de categorias para nomes de pastas, deve ser idêntico ao do servidor
const categoriasMap = {
  // CPLP
  'CPLP': 'CPLP',
  'CPLPMaiores': 'CPLP/Maiores',
  'CPLPMenor': 'CPLP/Menores',  // Corrigindo para CPLPMenor conforme usado no ListaDeProcessos
  
  // Concessão TR
  'ConcessaoTR': 'Concessao/TR',
  'ConcessaoTREstudante': 'Concessao/TREstudante', 
  'ConcessaoTREstudanteMenor': 'Concessao/TREstudanteMenor',
  
  // Reagrupamento
  'Reagrupamento': 'Reagrupamento',
  'ReagrupamentoFilho': 'Reagrupamento/Filho',
  'ReagrupamentoConjuge': 'Reagrupamento/Conjuge',
  'ReagrupamentoPaiIdoso': 'Reagrupamento/PaiIdoso',
  'ReagrupamentoPaiMaeFora': 'Reagrupamento/PaiMaeFora',
  'ReagrupamentoTutor': 'Reagrupamento/Tutor',
  
  // Renovação
  'RenovacaoEstudanteSuperior': 'Renovacao/EstudanteSuperior',
  'RenovacaoEstudanteSecundario': 'Renovacao/EstudanteSecundario',
  'RenovacaoTratamentoMedico': 'Renovacao/TratamentoMedico',
  'RenovacaoNaoTemEstatuto': 'Renovacao/NaoTemEstatuto',
  'RenovacaoUniaoEuropeia': 'Renovacao/UniaoEuropeia',
  
  // Informação
  'InformacaoPortal': 'Informacao/Portal',
  'InformacaoPresencial': 'Informacao/Presencial',
  
  // Contagem
  'ContagemTempo': 'Contagem/Tempo'
};

class FileStorage {
  constructor() {
    this.fileStoreName = 'files';
    this.metaStoreName = 'metadata';
  }

  /**
   * Executa uma transação no banco de dados
   * @param {string} storeName - Nome do store
   * @param {string} mode - Modo de acesso (readonly ou readwrite)
   * @param {function} callback - Função a ser executada
   * @returns {Promise<any>} - Resultado da transação
   * @private
   */
  async _executeTransaction(storeName, mode, callback) {
    // Implementação futura para indexedDB ou outra solução de armazenamento
    return callback();
  }

  /**
   * Cria a estrutura de pastas para um processo
   * @param {string} processId - ID do processo
   * @param {string} processType - Tipo do processo
   * @returns {Promise<Object>} - Estrutura criada
   */
  async createProcessStructure(processId, processType) {
    try {
      // Extrair categoria do processId
      const categoria = processId.split('-')[0];
      
      // Usar o mapa de categorias para obter o caminho padronizado
      const categoriaPasta = categoriasMap[categoria] || categoria;
      
      logger.info(`🔄 Criando estrutura para processId="${processId}", categoria="${categoria}", pasta="${categoriaPasta}"`);
      
      // Criar caminho base padronizado
      const basePath = `uploads/${categoriaPasta}/${processId}`;
      
      // Criar estrutura de pastas
      const structure = {
        basePath,
        documentsPath: `${basePath}/documentos`,
        assinaturasPath: `${basePath}/assinaturas`,
        pdfsPath: `${basePath}/pdfs`
      };

      logger.info(`Criando estrutura de pastas para processo ${processId}:`, structure);
      
      // Em produção, isso seria substituído por uma implementação real de criação de diretórios
      // Por enquanto, apenas logamos a estrutura
      return structure;
    } catch (error) {
      logger.error(`Erro ao criar estrutura de pastas para processo ${processId}:`, error);
      throw error;
    }
  }

  /**
   * Lista todos os arquivos de um processo
   * @param {string} processId - ID do processo
   * @returns {Promise<Array>} - Lista de arquivos
   */
  async listProcessFiles(processId) {
    try {
      // Buscar o processo do processos.json
      const processo = await jsonData.getProcessoById(processId);
      
      if (!processo || !processo.arquivosUpload) {
        logger.info(`Nenhum arquivo encontrado para o processo ${processId}`);
        return [];
      }
      
      logger.info(`Encontrados ${processo.arquivosUpload.length} arquivos para o processo ${processId}`);
      
      // Mapear os arquivos para o formato esperado
      return processo.arquivosUpload.map(file => ({
        path: file.path,
        mimeType: file.type,
        size: file.size,
        createdAt: file.uploadedAt,
        type: file.documentType === 'pdf_completo' ? 'pdf' : 'document',
        name: file.name
      }));
      
    } catch (error) {
      logger.error(`Erro ao listar arquivos do processo ${processId}:`, error);
      return [];
    }
  }

  /**
   * Obtém a URL de um arquivo
   * @param {string} filePath - Caminho do arquivo
   * @returns {Promise<string>} - URL do arquivo
   */
  async getFileUrl(filePath) {
    try {
      // Verificar se o caminho começa com 'http' para URLs externos
      if (filePath.startsWith('http')) {
        logger.info(`Usando URL externa diretamente: ${filePath}`);
        return filePath;
      }
      
      // Para arquivos locais, como public/consent.pdf ou caminhos relativos
      if (filePath.startsWith('./public/')) {
        const publicPath = filePath.replace('./public/', '/');
        logger.info(`Gerando URL para arquivo público: ${publicPath}`);
        return publicPath;
      }
      
      // Para arquivos no diretório de uploads, mapear para a API de arquivos
      const url = `http://localhost:3001/uploads/${filePath.replace(/^uploads\//, '')}`;
      logger.info(`Gerando URL para arquivo: ${url}`);
      return url;
    } catch (error) {
      logger.error(`Erro ao gerar URL para arquivo ${filePath}:`, error);
      throw error;
    }
  }

  /**
   * Obtém um arquivo
   * @param {string} filePath - Caminho do arquivo
   * @returns {Promise<Blob>} - Blob do arquivo
   */
  async getFile(filePath) {
    try {
      const url = await this.getFileUrl(filePath);
      logger.info(`Buscando arquivo: ${url}`);
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Erro ao buscar arquivo: ${response.status}`);
      }
      
      const blob = await response.blob();
      logger.info(`Arquivo obtido com sucesso: ${filePath}`);
      return blob;
    } catch (error) {
      logger.error(`Erro ao obter arquivo ${filePath}:`, error);
      throw error;
    }
  }
}

// Criar e exportar uma instância do serviço
const fileStorage = new FileStorage();
export { fileStorage }; 