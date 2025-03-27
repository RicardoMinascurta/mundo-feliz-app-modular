import express from 'express';
import { signatureService } from '../services/SignatureService.js';
import { pdfService } from '../services/pdfService.js';
import { fileStorage } from '../services/fileStorage.js';
import { saveBase64FileToUploads } from '../services/fileService.js';

const router = express.Router();

/**
 * Endpoint para processar uma assinatura e remover espaços em branco
 */
router.post('/process-signature', async (req, res) => {
  try {
    const { base64Data } = req.body;
    
    if (!base64Data) {
      return res.status(400).json({
        success: false,
        error: 'Assinatura não fornecida'
      });
    }
    
    const processedSignature = await signatureService.processSignature(base64Data);
    
    res.json({
      success: true,
      processedSignature
    });
    
  } catch (error) {
    console.error('❌ Erro ao processar assinatura:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Endpoint para fazer upload de uma assinatura processada
 */
router.post('/upload-assinatura', async (req, res) => {
  try {
    const { processId, base64Data } = req.body;
    
    if (!processId || !base64Data) {
      return res.status(400).json({
        success: false,
        error: 'ProcessId e base64Data são obrigatórios'
      });
    }
    
    // Salvar a assinatura na pasta uploads
    const fileInfo = await saveBase64FileToUploads(
      base64Data,
      processId,
      'assinaturas',
      `assinatura_${Date.now()}.png`
    );
    
    res.json({
      success: true,
      file: fileInfo
    });
    
  } catch (error) {
    console.error('❌ Erro ao fazer upload da assinatura:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Endpoint para processar assinatura com rembg para remover o fundo
 * Este endpoint é específico para assinaturas de fotos ou uploads
 */
router.post('/process-signature-rembg', async (req, res) => {
  try {
    const { base64Data } = req.body;
    
    if (!base64Data) {
      return res.status(400).json({
        success: false,
        error: 'Assinatura não fornecida'
      });
    }
    
    const result = await signatureService.processSignatureWithRembg(base64Data);
    
    if (result.fallback) {
      res.json({
        success: true,
        processedSignature: result.processedSignature,
        fallback: true
      });
    } else {
      res.json({
        success: true,
        processedSignature: result
      });
    }
    
  } catch (error) {
    console.error('❌ Erro ao processar assinatura com rembg:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

router.post('/add-signature', async (req, res) => {
  try {
    const { pdfPath, signatureBase64, position } = req.body;
    
    const modifiedPdfBlob = await pdfService.addSignatureToPdf(pdfPath, signatureBase64, position);
    
    // Salvar o PDF modificado
    const timestamp = new Date().toISOString().replace(/:/g, '-');
    const newPdfPath = pdfPath.replace('.pdf', `_assinado_${timestamp}.pdf`);
    
    await fileStorage._executeTransaction(fileStorage.fileStoreName, 'readwrite', (store) => {
      store.put({
        path: newPdfPath,
        data: modifiedPdfBlob
      });
    });
    
    res.json({ success: true, newPdfPath });
  } catch (error) {
    console.error('Erro ao adicionar assinatura:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router; 