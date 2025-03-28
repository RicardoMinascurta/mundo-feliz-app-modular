import express from 'express';
import ocrController from '../controllers/ocrController.js';

const router = express.Router();

/**
 * Rota para extração de texto via OCR
 * POST /api/ocr/extract
 */
router.post('/extract', ocrController.extractText);

export default router; 