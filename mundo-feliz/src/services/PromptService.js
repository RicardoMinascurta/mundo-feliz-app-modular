import { logger } from './LoggerService.js';
import promptTemplates from '../config/promptTemplates.js';

/**
 * Serviço simplificado para obtenção de templates de prompt
 */
export class PromptService {
  /**
   * Cria uma instância do serviço de prompts
   */
  constructor() {
    this.logger = logger.createComponentLogger('Prompt');
    this.logger.info('Serviço de prompts inicializado');
    this.promptAliases = this.buildPromptAliases();
  }
  
  /**
   * Constrói mapeamento de aliases para prompts
   * @returns {Object} Mapeamento de aliases para identificadores de prompts
   */
  buildPromptAliases() {
    const aliases = {};
    
    // Aliases para Concessão
    aliases['concessaotr'] = { category: 'concessao', subType: 'TR' };
    aliases['concessao tr'] = { category: 'concessao', subType: 'TR' };
    aliases['concessao tr2'] = { category: 'concessao', subType: 'TR2' };
    aliases['concessaotr2'] = { category: 'concessao', subType: 'TR2' };
    aliases['concessao trestudante'] = { category: 'concessao', subType: 'TREstudante' };
    aliases['concessaotrestudante'] = { category: 'concessao', subType: 'TREstudante' };
    aliases['concessao trestudante2'] = { category: 'concessao', subType: 'TREstudante2' };
    aliases['concessaotrestudante2'] = { category: 'concessao', subType: 'TREstudante2' };
    aliases['concessao trestudantemenor'] = { category: 'concessao', subType: 'TREstudanteMenor' };
    aliases['concessaotrestudantemenor'] = { category: 'concessao', subType: 'TREstudanteMenor' };
    
    // Aliases para Reagrupamento
    aliases['reagrupamentoconjuge'] = { category: 'concessao', subType: 'ReagrupamentoConjuge' };
    aliases['reagrupamento conjuge'] = { category: 'concessao', subType: 'ReagrupamentoConjuge' };
    aliases['reagrupamentofilho'] = { category: 'concessao', subType: 'ReagrupamentoFilho' };
    aliases['reagrupamento filho'] = { category: 'concessao', subType: 'ReagrupamentoFilho' };
    aliases['reagrupamentotutor'] = { category: 'concessao', subType: 'ReagrupamentoTutor' };
    aliases['reagrupamento tutor'] = { category: 'concessao', subType: 'ReagrupamentoTutor' };
    aliases['reagrupamentopaimaeifora'] = { category: 'concessao', subType: 'ReagrupamentoPaiMaeFora' };
    aliases['reagrupamentopaiidoso'] = { category: 'concessao', subType: 'ReagrupamentoPaiIdoso' };
    
    // Aliases para CPLP
    aliases['cplpmaiores'] = { category: 'concessao', subType: 'CPLPMaiores' };
    aliases['cplp maiores'] = { category: 'concessao', subType: 'CPLPMaiores' };
    aliases['cplpmenor'] = { category: 'concessao', subType: 'CPLPMenor' };
    aliases['cplp menor'] = { category: 'concessao', subType: 'CPLPMenor' };
    
    // Aliases para Contagem
    aliases['contagemtempo'] = { category: 'contagem', subType: 'ContagemTempo' };
    aliases['contagem tempo'] = { category: 'contagem', subType: 'ContagemTempo' };
    
    return aliases;
  }
  
  /**
   * Obtém o template de prompt para um determinado tipo de processo
   * @param {string} category Categoria do processo (ex: "contagem", "renovacao")
   * @param {string} subType Subtipo do processo (ex: "ContagemTempo", "EstudanteSuperior")
   * @returns {Promise<Object>} Template do prompt
   */
  async getPromptForProcess(category, subType) {
    try {
      this.logger.info(`Buscando template para ${category}/${subType}`);
      
      // Caminho 1: Verificar diretamente nos templates
      if (promptTemplates && 
          promptTemplates[category] && 
          promptTemplates[category][subType]) {
        this.logger.info(`✅ Template encontrado diretamente para ${category}/${subType}`);
        return promptTemplates[category][subType];
      }
      
      // Caminho 2: Verificar com subtipo normalizado
      const normalizedSubType = this.normalizeSubType(subType);
      if (promptTemplates && 
          promptTemplates[category] && 
          promptTemplates[category][normalizedSubType]) {
        this.logger.info(`✅ Template encontrado com normalização para ${category}/${normalizedSubType}`);
        return promptTemplates[category][normalizedSubType];
      }
      
      // Caminho 3: Verificar através de aliases
      const aliasKey = `${category}${subType}`.toLowerCase().replace(/[^a-z0-9]/g, '');
      if (this.promptAliases[aliasKey]) {
        const aliasMapping = this.promptAliases[aliasKey];
        if (promptTemplates && 
            promptTemplates[aliasMapping.category] && 
            promptTemplates[aliasMapping.category][aliasMapping.subType]) {
          this.logger.info(`✅ Template encontrado via alias para ${aliasMapping.category}/${aliasMapping.subType}`);
          return promptTemplates[aliasMapping.category][aliasMapping.subType];
        }
      }
      
      // Caminho 4: Verificar categoria combinada
      // Ex: Se receber "CPLPMaiores" como subType e categoria vazia, tentar encontrar no mapa de aliases
      if (!category || category.trim() === '') {
        const combinedKey = subType.toLowerCase().replace(/[^a-z0-9]/g, '');
        if (this.promptAliases[combinedKey]) {
          const aliasMapping = this.promptAliases[combinedKey];
          if (promptTemplates && 
              promptTemplates[aliasMapping.category] && 
              promptTemplates[aliasMapping.category][aliasMapping.subType]) {
            this.logger.info(`✅ Template encontrado via categoria combinada para ${aliasMapping.category}/${aliasMapping.subType}`);
            return promptTemplates[aliasMapping.category][aliasMapping.subType];
          }
        }
      }
      
      // Caminho 5: Verificar mapeamentos específicos (processos onde o padrão de nome não segue a regra)
      if (category === 'concessao') {
        // Verificação específica para subtipo com prefixo Concessao
        if (subType.startsWith('Concessao')) {
          const withoutPrefix = subType.replace('Concessao', '');
          if (promptTemplates.concessao[withoutPrefix]) {
            this.logger.info(`✅ Template encontrado removendo prefixo para concessao/${withoutPrefix}`);
            return promptTemplates.concessao[withoutPrefix];
          }
        }
      }
      
      // Registrar todas as chaves de templates disponíveis para diagnóstico
      let availableTemplates = [];
      if (promptTemplates) {
        for (const cat in promptTemplates) {
          for (const sub in promptTemplates[cat]) {
            availableTemplates.push(`${cat}/${sub}`);
          }
        }
      }
      
      this.logger.warn(`❌ Template não encontrado para ${category}/${subType}. Templates disponíveis: ${availableTemplates.join(', ')}`);
      return null;
    } catch (error) {
      this.logger.error(`Erro ao obter template: ${error.message}`, error);
      return null;
    }
  }
  
  /**
   * Normaliza o subtipo para busca
   * @param {string} subTipo Subtipo do processo
   * @returns {string} Subtipo normalizado
   */
  normalizeSubType(subTipo) {
    if (!subTipo) return '';
    
    // Remover acentos, espaços e caracteres especiais
    let normalized = subTipo
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-zA-Z0-9]/g, '');
    
    // Verificar e ajustar casos especiais
    // Se começa com "Concessao" e é seguido de "TR", normalizar para "TR"
    if (normalized.startsWith('Concessao') && normalized.includes('TR')) {
      if (normalized === 'ConcessaoTR') return 'TR';
      if (normalized === 'ConcessaoTR2') return 'TR2';
      if (normalized === 'ConcessaoTREstudante') return 'TREstudante';
      if (normalized === 'ConcessaoTREstudante2') return 'TREstudante2';
      if (normalized === 'ConcessaoTREstudanteMenor') return 'TREstudanteMenor';
    }
    
    // Se começa com "Reagrupamento", manter como está
    if (normalized.startsWith('Reagrupamento')) {
      return normalized;
    }
    
    // Se começa com "CPLP", manter como está
    if (normalized.startsWith('CPLP')) {
      return normalized;
    }
    
    return normalized;
  }
  
  /**
   * Valida se os dados extraídos contêm todos os campos obrigatórios
   * @param {Object} extractedData Dados extraídos
   * @param {Object} prompt Prompt usado
   * @returns {Object} Resultado da validação
   */
  validateExtractedData(extractedData, prompt) {
    const requiredFields = prompt.requiredFields || [];
    
    if (requiredFields.length === 0) {
      return { valid: true, missingFields: [] };
    }
    
    const missingFields = [];
    
    for (const field of requiredFields) {
      // Verificar campos aninhados (com ponto)
      if (field.includes('.')) {
        const [parent, child] = field.split('.');
        if (!extractedData[parent] || extractedData[parent][child] === undefined) {
          missingFields.push(field);
        }
      } else if (extractedData[field] === undefined) {
        missingFields.push(field);
      }
    }
    
    return {
      valid: missingFields.length === 0,
      missingFields
    };
  }
}

// Exportar instância única
export const promptService = new PromptService();
export default promptService; 