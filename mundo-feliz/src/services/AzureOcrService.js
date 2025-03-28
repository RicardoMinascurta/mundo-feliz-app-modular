import { AzureKeyCredential, DocumentAnalysisClient } from '@azure/ai-form-recognizer';
import fs from 'fs';
import path from 'path';
import logger from './LoggerService.js';

/**
 * Serviço para integração com Azure Form Recognizer para OCR
 */
class AzureOcrService {
  constructor() {
    // Configurar cliente do Azure Form Recognizer
    this.azureEndpoint = 'https://api-key-tempo.cognitiveservices.azure.com';
    this.azureKey = 'DEv2YRQ4kyteAM6xa69nkY7re4VfMGpgZ3ptDk0I20qKCwQHaRw5JQQJ99BBAC5RqLJXJ3w3AAALACOGwRgV';
    
    this.client = new DocumentAnalysisClient(
      this.azureEndpoint,
      new AzureKeyCredential(this.azureKey)
    );
    
    this.logger = logger.createComponentLogger('AzureOCR');
    this.logger.info('Serviço Azure OCR inicializado');
  }
  
  /**
   * Extrai texto de um documento usando o Azure Form Recognizer
   * @param {Buffer} imageBuffer - Buffer da imagem a ser processada
   * @returns {Promise<string>} - Texto extraído do documento
   */
  async extractTextFromImage(imageBuffer) {
    try {
      this.logger.info('Enviando documento para o Azure Form Recognizer');
      
      // Analisar documento
      const poller = await this.client.beginAnalyzeDocument('prebuilt-read', imageBuffer);
      const result = await poller.pollUntilDone();
      
      // Extrair texto do resultado
      let extractedText = '';
      
      if (result.pages) {
        for (const page of result.pages) {
          for (const line of page.lines || []) {
            extractedText += line.content + '\n';
          }
        }
      }
      
      this.logger.info(`Texto extraído com sucesso (${extractedText.length} caracteres)`);
      return extractedText;
    } catch (error) {
      this.logger.error(`Erro na extração OCR com Azure: ${error.message}`, error);
      throw error;
    }
  }
  
  /**
   * Salva os dados OCR para um processo
   * @param {string} processId - ID do processo
   * @param {string} documentType - Tipo de documento
   * @param {string} extractedText - Texto extraído
   * @param {string} uploadsDir - Diretório de uploads
   * @returns {Object} - Objeto com todos os documentos OCR do processo
   */
  async saveOcrData(processId, documentType, extractedText, uploadsDir) {
    try {
      // Verificar se há documentos anteriores extraídos para este processo
      let allDocumentsText = {};
      const processDataFile = path.join(uploadsDir, 'ocr_data', `${processId}.json`);
      
      // Criar pasta para armazenar dados OCR se não existir
      const ocrDataDir = path.join(uploadsDir, 'ocr_data');
      if (!fs.existsSync(ocrDataDir)) {
        fs.mkdirSync(ocrDataDir, { recursive: true });
      }
      
      // Verificar se já temos dados OCR anteriores para este processo
      if (fs.existsSync(processDataFile)) {
        try {
          const existingData = JSON.parse(fs.readFileSync(processDataFile, 'utf8'));
          allDocumentsText = existingData;
          this.logger.info(`Carregados dados OCR existentes para processo ${processId}`);
        } catch (err) {
          this.logger.error(`Erro ao carregar dados OCR existentes: ${err.message}`);
          // Continuar com objeto vazio se houver erro
        }
      }
      
      // Adicionar o novo texto extraído ao objeto de documentos
      allDocumentsText[documentType] = extractedText;
      
      // Salvar os dados OCR atualizados
      fs.writeFileSync(processDataFile, JSON.stringify(allDocumentsText, null, 2), 'utf8');
      this.logger.info(`Dados OCR salvos para processo ${processId}`);
      
      // Formatar o texto combinado no formato solicitado
      let combinedText = '';
      for (const [docType, docText] of Object.entries(allDocumentsText)) {
        combinedText += `${docType}\n${docText}\n\n`;
      }
      
      // Adicionar texto combinado formatado ao objeto de resposta
      allDocumentsText._combinedText = combinedText;
      
      this.logger.info(`Documentos processados: ${Object.keys(allDocumentsText).length - 1}`);
      this.logger.info(`Tipos de documentos: ${Object.keys(allDocumentsText).filter(key => key !== '_combinedText').join(', ')}`);
      this.logger.info(`Tamanho total do texto combinado: ${combinedText.length} caracteres`);
      
      return allDocumentsText;
    } catch (error) {
      this.logger.error(`Erro ao salvar dados OCR: ${error.message}`, error);
      throw error;
    }
  }
}

// Exporta uma instância única do serviço
const azureOcrService = new AzureOcrService();
export default azureOcrService; 