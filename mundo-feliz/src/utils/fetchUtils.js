/**
 * Utilitários para chamadas a APIs e fetch com tratamento de erros
 */

import logger from '../services/LoggerService.js';

/**
 * Executa uma requisição fetch com retry automático em caso de falha
 * @param {string} url - URL para a requisição
 * @param {object} options - Opções do fetch 
 * @param {number} maxRetries - Número máximo de tentativas
 * @returns {Promise<Response>} - Resposta da requisição
 */
export async function fetchWithRetry(url, options = {}, maxRetries = 3) {
  const timeout = 30000; // 30 segundos de timeout
  const backoff = 1000; // 1 segundo de backoff inicial
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      // Adicionar timeout para a requisição
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);
      
      const response = await fetch(url, {
        ...options,
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      logger.warn(`Tentativa ${attempt}/${maxRetries} falhou para ${url}: ${error.message}`);
      
      // Se chegou na última tentativa, propagar o erro
      if (attempt === maxRetries) {
        throw error;
      }
      
      // Espera com backoff exponencial
      await new Promise(resolve => setTimeout(resolve, backoff * Math.pow(2, attempt - 1)));
    }
  }
}

/**
 * Consulta uma base de dados do Notion com filtros
 * @param {string} databaseId - ID da base de dados Notion
 * @param {string} query - Termo de pesquisa
 * @param {string} notionApiKey - Chave da API do Notion
 * @param {string} notionApiUrl - URL base da API do Notion
 * @param {string} notionApiVersion - Versão da API do Notion
 * @returns {Promise<object>} - Resultados da pesquisa
 */
export async function consultarBaseNotion(databaseId, query, notionApiKey, notionApiUrl, notionApiVersion) {
  try {
    const response = await fetchWithRetry(
      `${notionApiUrl}/databases/${databaseId}/query`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${notionApiKey}`,
          'Notion-Version': notionApiVersion,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          filter: {
            property: 'Nome',
            rich_text: {
              contains: query
            }
          }
        })
      }
    );

    if (!response.ok) {
      throw new Error(`Erro na resposta do Notion: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    logger.error(`Erro ao consultar base ${databaseId}:`, error);
    return null;
  }
} 