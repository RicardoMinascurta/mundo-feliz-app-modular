/**
 * Serviço para processamento OCR de documentos
 * Utiliza API para extração de texto
 */

import { logger } from './LoggerService.js';

class OcrService {
  constructor() {
    this.logger = logger.createComponentLogger('OCR');
    this.logger.info('Serviço OCR inicializado');
    this.maxFileSize = 10 * 1024 * 1024; // 10MB por padrão
    this.extractedDocuments = {}; // Armazenará todos os documentos extraídos para o processo atual
  }
  
  /**
   * Extrai texto de documento usando a API de OCR
   * @param {File} file Arquivo a ser processado (imagem ou PDF)
   * @param {Object} options Opções adicionais
   * @returns {Promise<string|Object>} Texto extraído do documento ou objeto com todos os textos extraídos
   */
  async extractText(file, options = {}) {
    try {
      const documentType = options.documentType || 'unknown';
      this.logger.info(`Iniciando extração de texto OCR para documento do tipo: ${documentType}`);
      
      // Verificar limites e tipo de arquivo
      if (file.size > this.maxFileSize) {
        throw new Error(`Arquivo muito grande: ${file.size} bytes (máximo permitido: ${this.maxFileSize} bytes)`);
      }
      
      if (!file.type.startsWith('image/') && file.type !== 'application/pdf') {
        throw new Error(`Tipo de arquivo não suportado: ${file.type}`);
      }
      
      // Converter para base64
      const base64Data = await this._fileToBase64(file);
      
      // Chamar a API de OCR do servidor
      const response = await fetch('/api/ocr/extract', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          base64Data,
          fileName: file.name,
          fileType: file.type,
          processId: options.processId,
          documentType: documentType
        })
      });
      
      if (!response.ok) {
        throw new Error(`Erro na API de OCR: ${response.status}`);
      }
      
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Falha na extração de texto');
      }
      
      const extractedText = result.text || '';
      
      // Registrar no console para debug
      if (typeof extractedText === 'string') {
        this.logger.info(`Extração OCR concluída: ${extractedText.length} caracteres extraídos`);
      } else {
        this.logger.info(`Extração OCR concluída: objeto retornado com múltiplos documentos`);
      }
      
      // Armazenar o texto extraído no objeto de documentos
      if (options.processId) {
        if (!this.extractedDocuments[options.processId]) {
          this.extractedDocuments[options.processId] = {};
        }
        
        this.extractedDocuments[options.processId][documentType] = extractedText;
        
        // Log para depuração
        if (typeof extractedText === 'string') {
          this.logger.debug(`Texto extraído para documento ${documentType}:`, {
            primeiros100Caracteres: extractedText.substring(0, 100)
          });
        } else {
          this.logger.debug(`Objeto extraído para documento ${documentType}:`, {
            tiposDocumentos: extractedText._combinedText ? 'múltiplos documentos' : 'formato desconhecido'
          });
        }
      }
      
      // Registrar em variável global para captura e diagnóstico
      if (typeof window !== 'undefined') {
        if (!window._processData) {
          window._processData = {};
        }
        
        if (!window._processData[options.processId]) {
          window._processData[options.processId] = {
            ocrResults: {},
            gptResults: {},
            timestamp: new Date().toISOString()
          };
        }
        
        window._processData[options.processId].ocrResults[documentType] = {
          timestamp: new Date().toISOString(),
          textLength: extractedText.length,
          extractedText: extractedText
        };
      }
      
      // Se é o único documento ou não há um ID de processo, retornar apenas o texto
      if (!options.processId || Object.keys(this.extractedDocuments[options.processId] || {}).length <= 1) {
        return extractedText;
      }
      
      // Caso contrário, retornar o objeto formatado com todos os documentos para este processo
      return this.formatExtractedTexts(options.processId);
    } catch (error) {
      this.logger.error(`Erro ao extrair texto via OCR: ${error.message}`, error);
      throw new Error(`Falha na extração OCR: ${error.message}`);
    }
  }
  
  /**
   * Formata os textos extraídos para envio ao GPT
   * @param {string} processId ID do processo
   * @returns {Object} Objeto com os textos extraídos por tipo de documento
   */
  formatExtractedTexts(processId) {
    if (!processId || !this.extractedDocuments[processId]) {
      return {};
    }
    
    const documents = this.extractedDocuments[processId];
    
    // Criar objeto formatado com cada tipo de documento e seu texto
    const formattedTexts = {};
    let combinedText = '';
    
    // Primeiro organizar o texto no formato solicitado
    for (const [docType, docText] of Object.entries(documents)) {
      formattedTexts[docType] = docText;
      combinedText += `${docType}\n${docText}\n\n`;
    }
    
    // Log para depuração
    this.logger.info(`Textos extraídos formatados para ${processId}`, {
      numeroDocumentos: Object.keys(documents).length,
      tiposDocumentos: Object.keys(documents).join(', '),
      tamanhoTotal: combinedText.length
    });
    
    // Adicionar a versão combinada ao objeto
    formattedTexts._combinedText = combinedText;
    
    return formattedTexts;
  }
  
  /**
   * Converte File para Base64
   * @param {File} file Arquivo a ser convertido
   * @returns {Promise<string>} String Base64 do arquivo
   */
  async _fileToBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = error => reject(error);
    });
  }
  
  /**
   * Limpa os dados de documentos extraídos para um processo
   * @param {string} processId ID do processo a limpar
   */
  clearProcessData(processId) {
    if (processId && this.extractedDocuments[processId]) {
      delete this.extractedDocuments[processId];
      this.logger.info(`Dados de extração OCR limpos para processo ${processId}`);
    }
  }
}

// Exporta uma instância única
export const ocrService = new OcrService();
export default ocrService; 