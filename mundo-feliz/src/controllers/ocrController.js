import azureOcrService from '../services/AzureOcrService.js';
import logger from '../services/LoggerService.js';

const ocrLogger = logger.createComponentLogger('OCR-Controller');

/**
 * Processa um documento para extração de texto via OCR
 * @param {Object} req - Objeto de requisição Express
 * @param {Object} res - Objeto de resposta Express
 */
export const extractText = async (req, res) => {
  try {
    const { base64Data, documentType, processId } = req.body;
    
    if (!base64Data) {
      ocrLogger.error('Faltando dados base64');
      return res.status(400).json({
        success: false,
        error: 'Dados base64 são obrigatórios'
      });
    }
    
    ocrLogger.info(`Processando documento tipo ${documentType} para processo ${processId}`);
    
    // Remover cabeçalho do base64 se presente
    const base64Image = base64Data.includes('base64,') 
      ? base64Data.split('base64,')[1] 
      : base64Data;
    
    // Converter base64 para buffer
    const imageBuffer = Buffer.from(base64Image, 'base64');
    
    // Extrair texto usando o serviço Azure OCR
    const extractedText = await azureOcrService.extractTextFromImage(imageBuffer);
    
    // Salvar os dados OCR
    const uploadsDir = process.env.UPLOADS_DIR || 'uploads';
    const allDocumentsText = await azureOcrService.saveOcrData(processId, documentType, extractedText, uploadsDir);
    
    // Se for apenas um documento, retornar apenas o texto extraído
    // Se forem múltiplos documentos, retornar o objeto completo
    const responseData = Object.keys(allDocumentsText).length <= 2 
      ? extractedText 
      : allDocumentsText;
    
    // Retornar o texto extraído
    res.json({
      success: true,
      text: responseData,
      processId,
      documentType,
      stats: {
        documentCount: Object.keys(allDocumentsText).filter(key => key !== '_combinedText').length,
        textLength: extractedText.length,
        combinedTextLength: allDocumentsText._combinedText?.length || 0
      }
    });
  } catch (error) {
    ocrLogger.error(`Erro na extração OCR: ${error.message}`, error);
    res.status(500).json({
      success: false,
      error: 'Erro na extração OCR: ' + error.message
    });
  }
};

export default {
  extractText
}; 