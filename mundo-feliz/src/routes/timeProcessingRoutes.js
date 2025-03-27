/**
 * Rotas para processamento de contagem de tempo
 */

import express from 'express';
import { timeProcessingService } from '../services/timeProcessingService.js';

const router = express.Router();

/**
 * Endpoint para processar contagem de tempo
 */
router.post('/processar-contagem-tempo', async (req, res) => {
  try {
    const { documentos, tipoProcesso } = req.body;
    
    const resultado = await timeProcessingService.processarContagemTempo(documentos, tipoProcesso);
    
    if (!resultado.success) {
      return res.status(400).json(resultado);
    }
    
    res.json(resultado);
  } catch (error) {
    console.error('Erro ao processar contagem de tempo:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

export default router; 