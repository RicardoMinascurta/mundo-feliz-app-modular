/**
 * Serviço para processamento de contagem de tempo
 */

import { logger } from './LoggerService.js';

class TimeProcessingService {
  /**
   * Processa a contagem de tempo de um processo
   * @param {Array} documentos - Lista de documentos
   * @param {string} tipoProcesso - Tipo do processo
   * @returns {Object} - Resultado do processamento
   */
  async processarContagemTempo(documentos, tipoProcesso) {
    try {
      logger.info(`Iniciando processamento de contagem de tempo para tipo: ${tipoProcesso}`);
      
      // Verificar se há documentos para processar
      if (!documentos || documentos.length === 0) {
        logger.warn('Nenhum documento fornecido para processamento');
        return {
          success: false,
          error: 'Nenhum documento fornecido'
        };
      }

      // Processar cada documento
      const resultados = await Promise.all(
        documentos.map(async (doc) => {
          try {
            // Verificar se o documento tem os campos necessários
            if (!doc.tipoDocumento || !doc.dataEmissao) {
              logger.warn(`Documento sem campos necessários: ${JSON.stringify(doc)}`);
              return {
                success: false,
                error: 'Documento sem campos necessários',
                documento: doc
              };
            }

            // Calcular a contagem de tempo
            const resultado = await this.calcularContagemTempo(doc, tipoProcesso);
            
            return {
              success: true,
              documento: doc,
              resultado
            };
          } catch (error) {
            logger.error(`Erro ao processar documento: ${error.message}`, error);
            return {
              success: false,
              error: error.message,
              documento: doc
            };
          }
        })
      );

      // Verificar se todos os documentos foram processados com sucesso
      const todosSucesso = resultados.every(r => r.success);
      
      if (!todosSucesso) {
        logger.warn('Alguns documentos não foram processados com sucesso');
        return {
          success: false,
          error: 'Alguns documentos não foram processados com sucesso',
          resultados
        };
      }

      logger.info('Processamento de contagem de tempo concluído com sucesso');
      return {
        success: true,
        resultados
      };
    } catch (error) {
      logger.error(`Erro ao processar contagem de tempo: ${error.message}`, error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Calcula a contagem de tempo para um documento
   * @param {Object} documento - Documento a ser processado
   * @param {string} tipoProcesso - Tipo do processo
   * @returns {Object} - Resultado do cálculo
   */
  async calcularContagemTempo(documento, tipoProcesso) {
    try {
      const { tipoDocumento, dataEmissao } = documento;
      
      // Validar data de emissão
      if (!this.isValidDate(dataEmissao)) {
        throw new Error('Data de emissão inválida');
      }

      // Calcular contagem de tempo baseado no tipo de documento
      let contagemTempo;
      switch (tipoDocumento) {
        case 'passaporte':
          contagemTempo = this.calcularContagemPassaporte(dataEmissao);
          break;
        case 'visto':
          contagemTempo = this.calcularContagemVisto(dataEmissao);
          break;
        case 'residencia':
          contagemTempo = this.calcularContagemResidencia(dataEmissao);
          break;
        default:
          throw new Error(`Tipo de documento não suportado: ${tipoDocumento}`);
      }

      return {
        tipoDocumento,
        dataEmissao,
        contagemTempo
      };
    } catch (error) {
      logger.error(`Erro ao calcular contagem de tempo: ${error.message}`, error);
      throw error;
    }
  }

  /**
   * Valida se uma data é válida
   * @param {string} date - Data a ser validada
   * @returns {boolean} - True se a data for válida
   */
  isValidDate(date) {
    const parsedDate = new Date(date);
    return parsedDate instanceof Date && !isNaN(parsedDate);
  }

  /**
   * Calcula a contagem de tempo para passaporte
   * @param {string} dataEmissao - Data de emissão do passaporte
   * @returns {Object} - Resultado do cálculo
   */
  calcularContagemPassaporte(dataEmissao) {
    const dataEmissaoObj = new Date(dataEmissao);
    const hoje = new Date();

    // Calcular diferença em anos
    let anos = hoje.getFullYear() - dataEmissaoObj.getFullYear();
    const mesAtual = hoje.getMonth();
    const mesEmissao = dataEmissaoObj.getMonth();

    // Ajustar anos se ainda não completou o ano
    if (mesAtual < mesEmissao || (mesAtual === mesEmissao && hoje.getDate() < dataEmissaoObj.getDate())) {
      anos--;
    }

    return {
      anos,
      meses: anos * 12,
      dias: anos * 365
    };
  }

  /**
   * Calcula a contagem de tempo para visto
   * @param {string} dataEmissao - Data de emissão do visto
   * @returns {Object} - Resultado do cálculo
   */
  calcularContagemVisto(dataEmissao) {
    const dataEmissaoObj = new Date(dataEmissao);
    const hoje = new Date();

    // Calcular diferença em meses
    let meses = (hoje.getFullYear() - dataEmissaoObj.getFullYear()) * 12 +
                (hoje.getMonth() - dataEmissaoObj.getMonth());

    // Ajustar meses se ainda não completou o mês
    if (hoje.getDate() < dataEmissaoObj.getDate()) {
      meses--;
    }

    return {
      anos: Math.floor(meses / 12),
      meses,
      dias: meses * 30
    };
  }

  /**
   * Calcula a contagem de tempo para residência
   * @param {string} dataEmissao - Data de emissão da residência
   * @returns {Object} - Resultado do cálculo
   */
  calcularContagemResidencia(dataEmissao) {
    const dataEmissaoObj = new Date(dataEmissao);
    const hoje = new Date();

    // Calcular diferença em dias
    const diffTime = Math.abs(hoje - dataEmissaoObj);
    const dias = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return {
      anos: Math.floor(dias / 365),
      meses: Math.floor(dias / 30),
      dias
    };
  }
}

// Criar e exportar uma instância do serviço
const timeProcessingService = new TimeProcessingService();
export { timeProcessingService }; 