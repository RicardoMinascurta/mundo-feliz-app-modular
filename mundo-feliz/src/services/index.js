/**
 * Exportações centralizadas dos serviços
 */

// Serviços de infraestrutura
export { default as logger } from './LoggerService.js';
export { default as jsonData } from './JsonDataService.js';

// Serviços de processamento
export { default as ocrService } from './OcrService.js';
export { default as gptService } from './GptService.js';

// Serviços existentes
import { uploadService } from './uploadService.js';
import { fileStorage } from './fileStorage.js';

// Serviço Notion
const notionService = {
  async getPageDetails(pageId) {
    try {
      const response = await fetch(`/api/notion/page/${pageId}`);
      if (!response.ok) {
        throw new Error(`Erro ao obter detalhes da página: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Erro ao obter detalhes da página Notion:', error);
      throw error;
    }
  },
  
  async searchPeople(query, databaseIds = []) {
    try {
      const response = await fetch('/api/notion/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ query, databaseIds })
      });
      
      if (!response.ok) {
        throw new Error(`Erro na pesquisa: ${response.status}`);
      }
      
      const data = await response.json();
      return data.results || [];
    } catch (error) {
      console.error('Erro ao pesquisar pessoas:', error);
      return [];
    }
  }
};

// Novos serviços
import { promptService } from './PromptService.js';
import pdfService from './pdfService.js';
import { idGeneratorService } from './IdGeneratorService.js';
import { processoService } from './processoService.js';

// Exportar todos os serviços
export {
  // Serviços existentes
  uploadService,
  notionService,
  fileStorage,
  
  // Novos serviços
  promptService,
  pdfService,
  idGeneratorService,
  processoService
}; 