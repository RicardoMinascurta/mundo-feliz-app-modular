// src/api/index.js
import express from 'express';
import fileRoutes from './fileRoutes.js';
import ocrRoutes from '../routes/ocrRoutes.js';

const router = express.Router();

// Montar as rotas na API
router.use('/files', fileRoutes);
router.use('/ocr', ocrRoutes);

export default router; 