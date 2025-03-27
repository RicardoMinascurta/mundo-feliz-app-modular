/**
 * Serviço para extração de dados estruturados usando a API
 */

import { logger } from './LoggerService.js';
import { promptService } from './PromptService.js';

class GptService {
  constructor() {
    this.logger = logger.createComponentLogger('GPT');
    this.logger.info('Serviço GPT inicializado');
    
    // Mapeamento de categorias para normalização
    this.categoryMap = {
      'concessão': 'concessao',
      'renovação': 'renovacao',
      'contagem': 'contagem',
      'cplp': 'cplp',    // CPLP usa templates de cplp agora
      'reagrupamento': 'concessao',  // Reagrupamento usa templates de concessão
      'c': 'cplp'        // Adicionar alias para corrigir o problema com c_CPLPMaiores
    };
  }
  
  /**
   * Normaliza a categoria para compatibilidade com os templates
   * @param {string} category Categoria a ser normalizada
   * @returns {string} Categoria normalizada
   */
  normalizeCategory(category) {
    if (!category) return '';
    
    // Converter para minúsculas e remover acentos
    const normalizedKey = category.toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]/g, '');
    
    // Verificar se existe no mapa de categorias
    return this.categoryMap[normalizedKey] || normalizedKey;
  }
  
  /**
   * Extrai dados estruturados de texto usando API
   * @param {string|Object} text Texto a ser processado (string ou objeto com textos extraídos)
   * @param {string} category Categoria principal do processo (concessao, cplp, etc)
   * @param {string} processType Tipo específico do processo
   * @param {Object} options Opções adicionais
   * @returns {Promise<Object>} Dados estruturados extraídos
   */
  async extractStructuredData(text, category, processType, options = {}) {
    try {
      // Verificar se o texto é um objeto ou uma string
      let textToProcess = '';
      
      if (typeof text === 'object' && text !== null) {
        // Verificar se temos um texto combinado preparado pelo OCR
        if (text._combinedText) {
          textToProcess = text._combinedText;
          this.logger.info(`Usando texto combinado formatado (${textToProcess.length} caracteres)`);
        } else {
          // Criar formato manualmente se não tivermos _combinedText
          textToProcess = Object.entries(text)
            .filter(([key]) => !key.startsWith('_')) // Ignorar campos com prefixo _
            .map(([docType, docText]) => `${docType}\n${docText}`).join('\n\n');
          
          this.logger.info(`Texto formatado manualmente (${textToProcess.length} caracteres)`);
        }
      } else if (typeof text === 'string') {
        textToProcess = text;
        this.logger.info(`Usando texto direto (${textToProcess.length} caracteres)`);
      } else {
        this.logger.warn('Texto vazio ou inválido fornecido para extração de dados');
        return { data: null, validation: { valid: false, reason: 'Texto inválido' }, promptUsed: null };
      }
      
      if (!textToProcess || textToProcess.trim().length === 0) {
        this.logger.warn('Texto vazio fornecido para extração de dados');
        return { data: null, validation: { valid: false, reason: 'Texto vazio' }, promptUsed: null };
      }
      
      // Normalizar categoria para garantir compatibilidade
      const normalizedCategory = this.normalizeCategory(category);
      
      this.logger.info(`Iniciando extração de dados para processo ${normalizedCategory}_${processType}`);
      
      // Obter template de prompt
      const prompt = await promptService.getPromptForProcess(normalizedCategory, processType);
      if (!prompt) {
        this.logger.warn(`Template de prompt não encontrado para ${normalizedCategory}_${processType}. Tentando abordagens alternativas...`);
        
        // Tentativa 1: Verificar se é um processo CPLP que pode estar errado
        if (processType.includes('CPLP')) {
          this.logger.info(`Processo contém CPLP, tentando categoria 'cplp'`);
          const cplpPrompt = await promptService.getPromptForProcess('cplp', processType);
          
          if (cplpPrompt) {
            this.logger.info(`Template encontrado na categoria 'cplp' para ${processType}`);
            return this.processExtraction(textToProcess, 'cplp', processType, cplpPrompt, options);
          }
        }
        
        // Tentativa 2: Tentar com categoria 'concessao' para casos especiais
        if (normalizedCategory !== 'concessao' && processType.includes('TR')) {
          this.logger.info(`Tentando usar categoria 'concessao' para tipo ${processType}`);
          const alternativePrompt = await promptService.getPromptForProcess('concessao', processType);
          
          if (alternativePrompt) {
            this.logger.info(`Template encontrado com categoria alternativa para concessao/${processType}`);
            return this.processExtraction(textToProcess, 'concessao', processType, alternativePrompt, options);
          }
        }
        
        // Tentativa 3: Tentar com prefixo removido para tipos que começam com nome da categoria
        if (processType.startsWith(normalizedCategory.charAt(0).toUpperCase() + normalizedCategory.slice(1))) {
          const typeWithoutPrefix = processType.substring(normalizedCategory.length);
          this.logger.info(`Tentando usar tipo sem prefixo: ${typeWithoutPrefix}`);
          const alternativePrompt = await promptService.getPromptForProcess(normalizedCategory, typeWithoutPrefix);
          
          if (alternativePrompt) {
            this.logger.info(`Template encontrado removendo prefixo para ${normalizedCategory}/${typeWithoutPrefix}`);
            return this.processExtraction(textToProcess, normalizedCategory, typeWithoutPrefix, alternativePrompt, options);
          }
        }
        
        // Última tentativa: usar o template padrão
        this.logger.warn(`Todas as tentativas falharam. Usando template padrão.`);
        const defaultPrompt = await promptService.getPromptForProcess('default', 'system');
        
        if (defaultPrompt) {
          this.logger.info(`Usando template padrão como fallback`);
          return this.processExtraction(textToProcess, 'default', 'system', defaultPrompt, options);
        }
        
        return { data: null, validation: { valid: false, reason: 'Template não encontrado' }, promptUsed: null };
      }
      
      // Proceder com a extração usando o template encontrado
      return this.processExtraction(textToProcess, normalizedCategory, processType, prompt, options);
    } catch (error) {
      this.logger.error(`Erro ao extrair dados estruturados: ${error.message}`, error);
      return { 
        data: null, 
        validation: { valid: false, reason: error.message },
        promptUsed: null
      };
    }
  }
  
  /**
   * Processa a extração de dados usando API
   * @param {string} text Texto para processar
   * @param {string} category Categoria normalizada
   * @param {string} processType Tipo de processo
   * @param {Object} prompt Template de prompt
   * @param {Object} options Opções adicionais
   * @returns {Promise<Object>} Resultado da extração
   */
  async processExtraction(text, category, processType, prompt, options) {
    try {
      // Chamar a API para processar os dados
      const response = await fetch('/api/gpt/extract', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          text,
          category,
          processType,
          processId: options.processId || 'unknown',
          prompt: prompt
        })
      });
      
      if (!response.ok) {
        throw new Error(`Erro na API: ${response.status}`);
      }
      
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Falha na extração de dados');
      }
      
      // Registrar em variável global se estiver disponível no ambiente
      if (typeof window !== 'undefined') {
        const processId = options.processId || 'unknown';
        
        if (!window._processData) {
          window._processData = {};
        }
        
        if (!window._processData[processId]) {
          window._processData[processId] = {
            ocrResults: {},
            gptResults: {},
            timestamp: new Date().toISOString()
          };
        }
        
        window._processData[processId].gptResults = {
          timestamp: new Date().toISOString(),
          data: result.data,
          validation: result.validation,
          rawResponse: result.rawResponse
        };
      }
      
      this.logger.info('Dados extraídos via API', { success: result.success });
      
      return {
        data: result.data,
        validation: result.validation,
        promptUsed: result.promptUsed
      };
    } catch (error) {
      this.logger.error(`Erro na chamada da API: ${error.message}`, error);
      throw error;
    }
  }
  
  /**
   * Validação simples dos dados extraídos
   * @param {Object} data Dados extraídos
   * @param {Array} requiredFields Campos obrigatórios
   * @returns {Object} Resultado da validação
   */
  validateExtractedData(data, requiredFields = []) {
    try {
      if (!data || typeof data !== 'object') {
        return { valid: false, reason: 'Dados inválidos', missingFields: [] };
      }
      
      if (requiredFields.length === 0) {
        return { valid: true, reason: 'Sem validação', missingFields: [] };
      }
      
      const missingFields = [];
      
      for (const field of requiredFields) {
        if (field.includes('.')) {
          // Campo aninhado
          const [parent, child] = field.split('.');
          if (!data[parent] || data[parent][child] === undefined) {
            missingFields.push(field);
          }
        } else if (data[field] === undefined) {
          missingFields.push(field);
        }
      }
      
        return {
        valid: missingFields.length === 0,
        reason: missingFields.length > 0 ? 'Campos obrigatórios faltando' : 'OK',
        missingFields
      };
    } catch (error) {
      this.logger.error('Erro ao validar dados', error);
      return { valid: false, reason: 'Erro na validação', missingFields: [] };
    }
  }
}

// Exporta uma instância única
export const gptService = new GptService();
export default gptService;