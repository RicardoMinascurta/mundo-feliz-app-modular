/**
 * Rotas da API para serviço de email
 */

import express from 'express';
import emailService from '../services/server/emailService.js';
import { logger } from '../services/LoggerService.js';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const router = express.Router();

// Configuração do multer para upload de arquivos
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const processId = req.body.processId || 'temp';
    const dir = path.join('uploads', 'pdfs_preenchidos', processId);
    
    // Criar diretório se não existir
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    cb(null, dir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const fileName = `pdf_preenchido_${uniqueSuffix}${path.extname(file.originalname)}`;
    cb(null, fileName);
  }
});

const upload = multer({ storage: storage });

/**
 * Endpoint para salvar PDF preenchido
 * POST /api/email/save-pdf
 */
router.post('/save-pdf', upload.single('pdfFile'), async (req, res) => {
  try {
    logger.info('Recebido pedido para salvar PDF preenchido');
    
    if (!req.file) {
      logger.warn('Nenhum arquivo PDF recebido');
      return res.status(400).json({
        success: false,
        message: 'Nenhum arquivo PDF recebido'
      });
    }
    
    const processId = req.body.processId || 'temp';
    const personName = req.body.personName || 'documento';
    
    logger.info(`PDF preenchido recebido e salvo com sucesso: ${req.file.path}`);
    
    // Retornar informações sobre o arquivo salvo
    return res.status(200).json({
      success: true,
      filePath: req.file.path,
      fileName: req.file.filename,
      originalName: req.file.originalname,
      processId: processId,
      personName: personName,
      message: 'PDF preenchido salvo com sucesso'
    });
    
  } catch (error) {
    logger.error(`Erro ao salvar PDF preenchido: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: 'Erro ao processar o PDF preenchido',
      error: error.message
    });
  }
});

/**
 * Endpoint para enviar emails
 * POST /api/email/send
 */
router.post('/send', async (req, res) => {
  try {
    // Log das informações básicas da requisição
    logger.info('Recebida requisição de email:', {
      to: req.body.to,
      subject: req.body.subject,
      hasHtml: !!req.body.html,
      cc: req.body.cc,
      bcc: req.body.bcc,
      processId: req.body.processId, // Novo campo para identificar o processo
      pdfFilePath: req.body.pdfFilePath // Caminho do PDF salvo anteriormente
    });

    const { to, subject, html, cc, bcc, processId, pdfFilePath } = req.body;
    
    // Validação básica dos campos obrigatórios
    if (!to || !subject || !html) {
      logger.warn('Tentativa de envio de email sem campos obrigatórios');
      return res.status(400).json({ 
        success: false, 
        message: 'Os campos "to", "subject" e "html" são obrigatórios' 
      });
    }
    
    logger.info(`Processando requisição de envio de email para: ${to}, assunto: ${subject}`);
    
    // Verificar novamente as configurações antes de enviar
    console.log("Verificando configurações antes de enviar:", {
      EMAIL_HOST: process.env.EMAIL_HOST,
      EMAIL_PORT: process.env.EMAIL_PORT,
      EMAIL_USER: process.env.EMAIL_USER,
      EMAIL_FROM: process.env.EMAIL_FROM,
      EMAIL_PASS_SET: !!process.env.EMAIL_PASS
    });
    
    // Verificar se há PDF preenchido para anexar ao email
    let attachments = [];
    
    // Primeiro verificar se recebemos um caminho direto de um PDF salvo recentemente
    if (pdfFilePath && fs.existsSync(pdfFilePath)) {
      logger.info(`PDF preenchido encontrado pelo caminho direto: ${pdfFilePath}`);
      
      attachments.push({
        filename: path.basename(pdfFilePath),
        path: pdfFilePath,
        contentType: 'application/pdf'
      });
      
      logger.info('PDF preenchido anexado ao email (caminho direto)');
    }
    // Se não tiver caminho direto, verificar se processo tem PDF preenchido
    else if (processId) {
      try {
        const processoService = require('../services/processoService.js').default;
        
        // Buscar o processo para verificar se tem PDF preenchido
        const processo = await processoService.getProcessById(processId);
        
        if (processo) {
          const pdfPreenchido = processo.pdfGerados?.find(pdf => pdf.documentType === 'pdf_preenchido');
          
          if (pdfPreenchido && pdfPreenchido.path) {
            const filePath = path.join(process.cwd(), pdfPreenchido.path);
            
            if (fs.existsSync(filePath)) {
              logger.info(`PDF preenchido encontrado no processo: ${filePath}`);
              
              attachments.push({
                filename: pdfPreenchido.name || 'documento_preenchido.pdf',
                path: filePath,
                contentType: 'application/pdf'
              });
              
              logger.info('PDF preenchido anexado ao email (do processo)');
            } else {
              logger.warn(`Arquivo de PDF preenchido não encontrado em: ${filePath}`);
            }
          } else {
            // Verificar em diretório alternativo
            const pdfDir = path.join('uploads', 'pdfs_preenchidos', processId);
            if (fs.existsSync(pdfDir)) {
              const files = fs.readdirSync(pdfDir);
              const pdfFiles = files.filter(file => file.startsWith('pdf_preenchido_'));
              
              if (pdfFiles.length > 0) {
                // Ordenar por data de modificação (mais recente primeiro)
                const pdfFilesWithStats = pdfFiles.map(file => {
                  const filePath = path.join(pdfDir, file);
                  return { 
                    file, 
                    stats: fs.statSync(filePath),
                    path: filePath
                  };
                }).sort((a, b) => b.stats.mtimeMs - a.stats.mtimeMs);
                
                const newestPdf = pdfFilesWithStats[0];
                
                logger.info(`PDF preenchido encontrado em diretório alternativo: ${newestPdf.path}`);
                
                attachments.push({
                  filename: newestPdf.file,
                  path: newestPdf.path,
                  contentType: 'application/pdf'
                });
                
                logger.info('PDF preenchido anexado ao email (de diretório alternativo)');
              } else {
                logger.info('Nenhum PDF preenchido encontrado no diretório alternativo');
              }
            } else {
              logger.info('Processo não possui PDF preenchido em nenhum local conhecido');
            }
          }
        } else {
          logger.warn(`Processo não encontrado: ${processId}`);
        }
      } catch (attachError) {
        logger.error(`Erro ao buscar anexo: ${attachError.message}`);
        console.error('Erro ao buscar anexo:', attachError);
        // Não interromper o envio do email se houver erro ao buscar o anexo
      }
    }
    
    // Enviar email usando o serviço de email
    const resultado = await emailService.enviarEmail({ 
      to, 
      subject, 
      html, 
      cc, 
      bcc,
      attachments // Adicionar anexos se houver
    });
    
    // Log detalhado do resultado
    console.log("Resultado do envio de email:", resultado);
    
    // Log do resultado
    if (resultado.success) {
      logger.info('Email enviado com sucesso');
      return res.status(200).json(resultado);
    } else {
      logger.error(`Falha no envio do email: ${resultado.error}`);
      return res.status(500).json(resultado);
    }
  } catch (error) {
    // Log detalhado do erro
    logger.error(`Erro no endpoint de envio de email: ${error.message}`);
    logger.error(error.stack);
    
    // Retornar resposta de erro
    res.status(500).json({ 
      success: false, 
      message: 'Erro interno ao processar o envio do email',
      error: error.message
    });
  }
});

export default router; 