// src/routes/uploadRoutes.js
import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const uploadDir = path.join(__dirname, '../../uploads');

if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        cb(null, file.originalname);
    }
});

const upload = multer({ storage: storage });

const router = express.Router();

// Rota para upload de documentos
router.post('/upload-documento', upload.single('documento'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'Nenhum ficheiro enviado' });
    }
    res.json({ message: 'Documento enviado com sucesso' });
});

// Rota para upload de PDFs
router.post('/upload-pdf', upload.single('pdf'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'Nenhum ficheiro enviado' });
    }
    res.json({ message: 'PDF enviado com sucesso' });
});

export default router; 