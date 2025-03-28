// src/routes/gptRoutes.js
import express from 'express';
import gptController from '../controllers/gptController.js';

const router = express.Router();

/**
 * Rota para extração de dados estruturados via GPT
 * POST /api/gpt/extract
 */
router.post('/extract', gptController.extractStructuredData);

export default router; 