import express from 'express';
import fs from 'fs';
import path from 'path';
import { pdfService } from '../services/pdfService.js';
import { fileStorage } from '../services/fileStorage.js';
import logger from '../services/LoggerService.js';

const router = express.Router();

/**
 * Endpoint para servir arquivos do servidor
 * Permite acesso controlado a arquivos como assinaturas
 */
router.get('/files/:filePath(*)', async (req, res) => {
  try {
    // Obter o caminho do arquivo da URL
    let filePath = req.params.filePath;
    
    // Normalizar o caminho para evitar problemas de barras
    filePath = filePath.replace(/\\/g, '/');
    
    // Verificar se o caminho começa com uploads/ e adicionar se não estiver
    if (!filePath.startsWith('uploads/') && !filePath.startsWith('/uploads/')) {
      filePath = 'uploads/' + filePath;
    }
    
    // Resolver o caminho completo
    const fullPath = path.resolve(filePath);
    
    // Verificações de segurança
    // 1. Garantir que o arquivo está dentro da pasta uploads
    const uploadsDir = path.resolve('uploads');
    if (!fullPath.startsWith(uploadsDir)) {
      console.warn(`Tentativa de acesso a arquivo fora da pasta uploads: ${filePath}`);
      return res.status(403).send('Acesso negado');
    }
    
    // 2. Verificar se o arquivo existe
    if (!fs.existsSync(fullPath)) {
      console.warn(`Arquivo não encontrado: ${fullPath}`);
      return res.status(404).send('Arquivo não encontrado');
    }
    
    // 3. Verificar se é um arquivo (não uma pasta)
    const stats = fs.statSync(fullPath);
    if (!stats.isFile()) {
      console.warn(`Caminho não é um arquivo: ${fullPath}`);
      return res.status(400).send('Caminho não é um arquivo');
    }
    
    // Determinar o tipo de conteúdo baseado na extensão
    let contentType = 'application/octet-stream'; // Tipo padrão
    const ext = path.extname(fullPath).toLowerCase();
    
    const contentTypes = {
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.gif': 'image/gif',
      '.pdf': 'application/pdf',
      '.json': 'application/json',
      '.txt': 'text/plain'
    };
    
    if (contentTypes[ext]) {
      contentType = contentTypes[ext];
    }
    
    // Definir headers
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `inline; filename="${path.basename(fullPath)}"`);
    
    // Enviar o arquivo
    const fileStream = fs.createReadStream(fullPath);
    fileStream.pipe(res);
    
    console.log(`Arquivo servido com sucesso: ${fullPath}`);
  } catch (error) {
    console.error(`Erro ao servir arquivo: ${error.message}`, error);
    res.status(500).send('Erro interno do servidor');
  }
});

router.post('/generate-pdf', async (req, res) => {
  try {
    const { imagePath } = req.body;
    
    const pdfBlob = await pdfService.generatePdfFromImage(imagePath);
    
    // Salvar o PDF gerado
    const timestamp = new Date().toISOString().replace(/:/g, '-');
    const pdfPath = imagePath.replace(/\.[^/.]+$/, `_${timestamp}.pdf`);
    
    await fileStorage._executeTransaction(fileStorage.fileStoreName, 'readwrite', (store) => {
      store.put({
        path: pdfPath,
        data: pdfBlob
      });
    });
    
    res.json({ success: true, pdfPath });
  } catch (error) {
    console.error('Erro ao gerar PDF:', error);
    res.status(500).json({ error: error.message });
  }
});

router.get('/pdf/com-nome/:processId', async (req, res) => {
  try {
    const processId = req.params.processId;
    const nome = req.query.nome || 'Nome do Beneficiário';
    const responsibleName = req.query.responsibleName || '';
    
    const pdfBuffer = await pdfService.generatePdfWithName(processId, nome, responsibleName);
    
    // Enviar o PDF como resposta
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="pdf-com-nome-${processId}.pdf"`);
    res.send(pdfBuffer);
  } catch (error) {
    console.error('Erro ao gerar PDF com nome:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Endpoint para listar metadados dos arquivos de um processo
 */
router.get('/files/:processId/metadata', async (req, res) => {
  try {
    const processId = req.params.processId;
    
    // Verificar se o processo existe
    const processPath = path.join('uploads', processId);
    if (!fs.existsSync(processPath)) {
      logger.warn(`Processo não encontrado: ${processId}`);
      return res.status(404).json({ error: 'Processo não encontrado' });
    }
    
    // Listar todos os arquivos do processo
    const files = [];
    const processFiles = fs.readdirSync(processPath, { recursive: true });
    
    for (const file of processFiles) {
      const fullPath = path.join(processPath, file);
      const stats = fs.statSync(fullPath);
      
      if (stats.isFile()) {
        const ext = path.extname(file).toLowerCase();
        const mimeType = {
          '.png': 'image/png',
          '.jpg': 'image/jpeg',
          '.jpeg': 'image/jpeg',
          '.gif': 'image/gif',
          '.pdf': 'application/pdf',
          '.json': 'application/json',
          '.txt': 'text/plain'
        }[ext] || 'application/octet-stream';
        
        files.push({
          path: path.join('uploads', processId, file),
          mimeType,
          size: stats.size,
          createdAt: stats.mtime.toISOString()
        });
      }
    }
    
    logger.info(`Encontrados ${files.length} arquivos para o processo ${processId}`);
    res.json(files);
  } catch (error) {
    logger.error(`Erro ao listar arquivos do processo: ${error.message}`, error);
    res.status(500).json({ error: error.message });
  }
});

export default router; 