import { logger, gptService } from './index.js';

/**
 * Serviço para processamento de dados via GPT
 * Separado da lógica de upload para melhor modularização
 */
class GptProcessingService {
  constructor() {
    this.logger = logger.createComponentLogger('GPTProcessing');
    this.logger.info('Serviço de processamento GPT inicializado');
    
    // Mapeamento explícito de tipo de processo para categoria
    this.processoParaCategoria = {
      // Concessão
      'TR': 'concessao',
      'TRNovo': 'concessao',
      'TREstudante': 'concessao',
      'TREstudante2': 'concessao',
      'TREstudanteMenor': 'concessao',
      'ConcessaoTR': 'concessao',
      'ConcessaoTRNovo': 'concessao',
      'ConcessaoTREstudante': 'concessao',
      'ConcessaoTREstudante2': 'concessao',
      'ConcessaoTREstudanteMenor': 'concessao',
      
      // Reagrupamento (usa templates de concessão)
      'ReagrupamentoConjuge': 'concessao',
      'ReagrupamentoFilho': 'concessao',
      'ReagrupamentoPaiIdoso': 'concessao',
      'ReagrupamentoTutor': 'concessao',
      'ReagrupamentoPaiMaeFora': 'concessao',
      
      // CPLP
      'CPLPMaiores': 'cplp',
      'CPLPMenor': 'cplp',
      
      // Renovação
      'RenovacaoEstudanteSuperior': 'renovacao',
      'RenovacaoEstudanteSecundario': 'renovacao',
      'RenovacaoTratamentoMedico': 'renovacao',
      'RenovacaoNaoTemEstatuto': 'renovacao',
      'RenovacaoUniaoEuropeia': 'renovacao',
      'RenovacaoTitulo': 'renovacao',
      'RenovacaoEstatuto': 'renovacao',
      
      // Contagem de tempo
      'ContagemTempo': 'contagem',
      
      // Informação
      'InformacaoPortal': 'infoportal',
      'InfoPortal': 'infoportal',
      'InformacaoPresencial': 'informacao',
      'InfoPresencial': 'informacao',
      
      // Manifestação de interesse
      'ManifestacaoInteresse': 'manifestacao',
      
      // Alias para corrigir problemas específicos
      'c': 'cplp'
    };
    
    // Mapear nomes especiais para seus respectivos tipos normalizados
    this.nomeParaTipoProcesso = {
      // Concessão
      'Título de Residência': 'TR',
      'Novo Título de Residência': 'TRNovo',
      'TR Estudante': 'TREstudante',
      'TR Estudante Versão 2': 'TREstudante2',
      'TR Estudante Menor': 'TREstudanteMenor',
      'Concessão TR': 'TR',
      'Concessão TR Novo': 'TRNovo',
      'Concessão TR Estudante': 'TREstudante',
      'Concessão TR Estudante Versão 2': 'TREstudante2',
      'Concessão TR Estudante Menor': 'TREstudanteMenor',
      
      // Reagrupamento Familiar
      'Reagrupamento Familiar - Cônjuge': 'ReagrupamentoConjuge',
      'Reagrupamento Familiar - Filho': 'ReagrupamentoFilho',
      'Reagrupamento Familiar - Pai Idoso': 'ReagrupamentoPaiIdoso',
      'Reagrupamento Familiar - Tutor': 'ReagrupamentoTutor',
      'Reagrupamento Familiar - Através de Pais Fora': 'ReagrupamentoPaiMaeFora',
      
      // CPLP
      'CPLP Maiores': 'CPLPMaiores',
      'CPLP Menor': 'CPLPMenor',
      
      // Renovação
      'Renovação Estudante Superior': 'EstudanteSuperior',
      'Renovação Estudante Secundário': 'EstudanteSecundario',
      'Renovação Tratamento Médico': 'TratamentoMedico',
      'Renovação Não Tem Estatuto': 'NaoTemEstatuto',
      'Renovação União Europeia': 'UniaoEuropeia',
      'Renovação Título': 'RenovacaoTitulo',
      'Renovação Estatuto': 'RenovacaoEstatuto',
      
      // Contagem de Tempo
      'Contagem de Tempo para Residência Permanente': 'ContagemTempo',
      'Contagem de Tempo': 'ContagemTempo',
      
      // Informação
      'Informação Portal': 'InfoPortal',
      'Informação Presencial': 'InfoPresencial',
      
      // Manifestação de Interesse
      'Manifestação de Interesse': 'ManifestacaoInteresse'
    };
    
    // Mapear nomes especiais para suas respectivas categorias
    this.nomeParaCategoria = {
      // Concessão
      'Título de Residência': 'concessao',
      'Novo Título de Residência': 'concessao',
      'TR Estudante': 'concessao',
      'TR Estudante Versão 2': 'concessao',
      'TR Estudante Menor': 'concessao',
      'Concessão TR': 'concessao',
      'Concessão TR Novo': 'concessao',
      'Concessão TR Estudante': 'concessao',
      'Concessão TR Estudante Versão 2': 'concessao',
      'Concessão TR Estudante Menor': 'concessao',
      
      // Reagrupamento Familiar
      'Reagrupamento Familiar - Cônjuge': 'concessao',
      'Reagrupamento Familiar - Filho': 'concessao',
      'Reagrupamento Familiar - Pai Idoso': 'concessao',
      'Reagrupamento Familiar - Tutor': 'concessao',
      'Reagrupamento Familiar - Através de Pais Fora': 'concessao',
      
      // CPLP
      'CPLP Maiores': 'cplp',
      'CPLP Menor': 'cplp',
      
      // Renovação
      'Renovação Estudante Superior': 'renovacao',
      'Renovação Estudante Secundário': 'renovacao',
      'Renovação Tratamento Médico': 'renovacao',
      'Renovação Não Tem Estatuto': 'renovacao',
      'Renovação União Europeia': 'renovacao',
      'Renovação Título': 'renovacao',
      'Renovação Estatuto': 'renovacao',
      
      // Contagem de Tempo
      'Contagem de Tempo para Residência Permanente': 'contagem',
      'Contagem de Tempo': 'contagem',
      
      // Informação
      'Informação Portal': 'infoportal',
      'Informação Presencial': 'informacao',
      
      // Manifestação de Interesse
      'Manifestação de Interesse': 'manifestacao'
    };
  }
  
  /**
   * Identifica a categoria do processo com base no tipo
   * @param {string} tipoProcesso - Tipo de processo 
   * @returns {string} - Categoria identificada
   */
  identificarCategoria(tipoProcesso) {
    // Usar o mapeamento explícito ou fallback para o método original
    let categoria = this.processoParaCategoria[tipoProcesso] || tipoProcesso.split(/(?=[A-Z])/)[0].toLowerCase();
    
    // Se temos um mapeamento de categoria específico, usar ele
    if (this.nomeParaCategoria[tipoProcesso]) {
      categoria = this.nomeParaCategoria[tipoProcesso];
    }
    
    this.logger.info(`🔍 Tipo de processo original: ${tipoProcesso}, Categoria identificada: ${categoria}`);
    return categoria;
  }
  
  /**
   * Normaliza o tipo de processo para enviar ao GPT
   * @param {string} tipoProcesso - Tipo de processo original
   * @returns {string} - Tipo normalizado
   */
  normalizarTipoProcesso(tipoProcesso) {
    // Normalizar o tipo de processo para enviar ao GPT
    let tipoProcessoNormalizado = tipoProcesso;
    
    // Se temos um nome especial mapeado, usar o tipo normalizado
    if (this.nomeParaTipoProcesso[tipoProcesso]) {
      tipoProcessoNormalizado = this.nomeParaTipoProcesso[tipoProcesso];
      this.logger.info(`🔍 Tipo de processo normalizado: ${tipoProcessoNormalizado}`);
    }
    
    return tipoProcessoNormalizado;
  }
  
  /**
   * Formata o texto do OCR para envio ao GPT
   * @param {object|string} ocrResult - Resultado do OCR 
   * @returns {string} - Texto formatado
   */
  formatarTextoOCR(ocrResult) {
    let textoFormatado = '';
    
    // Verificar se temos o texto combinado disponível e usá-lo diretamente
    if (ocrResult && ocrResult._combinedText) {
      this.logger.info(`📄 Usando texto combinado existente (${ocrResult._combinedText.length} caracteres)`);
      textoFormatado = ocrResult._combinedText;
    } else if (typeof ocrResult === 'string') {
      // Caso simples: apenas um documento
      textoFormatado = `documento\n${ocrResult}`;
      this.logger.info(`📄 Texto único documento (${textoFormatado.length} caracteres)`);
    } else if (typeof ocrResult === 'object') {
      // Caso de múltiplos documentos extraídos - incluir TODOS os documentos
      this.logger.info(`📄 Formatando múltiplos documentos manualmente`);
      for (const [docType, docText] of Object.entries(ocrResult)) {
        // Ignorar apenas propriedades internas começadas com underscore (exceto _combinedText que já tratamos)
        if (docType !== '_combinedText' && !docType.startsWith('_')) {
          // Tratar diferentes tipos de dados
          if (typeof docText === 'string') {
            textoFormatado += `${docType}\n${docText}\n\n`;
          } else if (docText !== null && typeof docText === 'object') {
            // Tentar converter objeto para string JSON
            try {
              const jsonText = JSON.stringify(docText);
              textoFormatado += `${docType}\n${jsonText}\n\n`;
            } catch (e) {
              this.logger.error(`❌ Erro ao converter objeto para JSON: ${e.message}`);
              textoFormatado += `${docType}\n[Objeto complexo não convertível]\n\n`;
            }
          } else if (docText !== null && docText !== undefined) {
            // Converter outros tipos para string
            textoFormatado += `${docType}\n${String(docText)}\n\n`;
          }
          
          // Log para debug - mostrar os primeiros 100 caracteres
          const textoParaLog = typeof docText === 'string' ? docText : JSON.stringify(docText);
          const primeiros100 = textoParaLog ? textoParaLog.substring(0, 100) : '[vazio]';
          this.logger.info(`📄 OCR para ${docType}: ${primeiros100}...`);
        }
      }
    }
    
    // Verificar se temos algum texto para enviar
    if (!textoFormatado || !textoFormatado.trim()) {
      const erro = 'Nenhum texto extraído para enviar ao GPT';
      this.logger.error(`❌ ${erro}`);
      throw new Error(erro);
    }
    
    this.logger.info(`📄 Texto formatado final: ${textoFormatado.length} caracteres`);
    return textoFormatado;
  }
  
  /**
   * Processa os dados extraídos por OCR usando o GPT
   * @param {object|string} ocrResult - Resultado do OCR
   * @param {string} tipoProcesso - Tipo de processo 
   * @param {string} processId - ID do processo
   * @returns {object} - Resultado do processamento
   */
  async processarDados(ocrResult, tipoProcesso, processId) {
    try {
      this.logger.info(`Iniciando processamento GPT para ${tipoProcesso}, processo ${processId}`);
      
      // 1. Identificar categoria
      const categoria = this.identificarCategoria(tipoProcesso);
      
      // 2. Normalizar tipo de processo
      const tipoProcessoNormalizado = this.normalizarTipoProcesso(tipoProcesso);
      
      // 3. Formatar texto para GPT
      const textoFormatado = this.formatarTextoOCR(ocrResult);
      
      // 4. Enviar para processamento GPT
      this.logger.info(`🚀 Enviando dados para processamento GPT. Categoria: ${categoria}, Tipo: ${tipoProcessoNormalizado}`);
      
      const gptResult = await gptService.extractStructuredData(
        textoFormatado,
        categoria,
        tipoProcessoNormalizado || tipoProcesso,
        {
          processId: processId
        }
      );
      
      this.logger.info(`✅ Processamento GPT concluído com sucesso`);
      
      // 5. Retornar dados estruturados
      return {
        success: true,
        extractedData: {
          ocr: ocrResult,
          gpt: gptResult.data,
          campos: gptResult.data
        }
      };
    } catch (error) {
      this.logger.error(`❌ Erro ao processar dados via GPT: ${error.message}`);
      return {
        success: false,
        error: error.message,
        extractedData: null
      };
    }
  }
}

// Exportar uma instância única do serviço
export default new GptProcessingService(); 