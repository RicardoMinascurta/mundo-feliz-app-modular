// src/api/index.js
import express from 'express';
import fileRoutes from './fileRoutes.js';
import ocrRoutes from '../routes/ocrRoutes.js';
import gptRoutes from '../routes/gptRoutes.js';
import fs from 'fs';
import path from 'path';
import { saveBase64FileToUploads } from '../utils/fileUtils.js';

const router = express.Router();
const UPLOADS_DIR = process.env.UPLOADS_DIR || 'uploads';
const DATA_DIR = process.env.DATA_DIR || 'data';
const DATA_FILE = path.join(DATA_DIR, 'processos.json');

// Montar as rotas na API
router.use('/files', fileRoutes);
router.use('/ocr', ocrRoutes);
router.use('/gpt', gptRoutes);

// Função auxiliar para obter processos do arquivo JSON
function getProcessos() {
  try {
    const processosPath = path.join(DATA_DIR, 'processos.json');
    
    // Verificar se o arquivo existe
    if (!fs.existsSync(processosPath)) {
      console.log('Arquivo de processos não encontrado. Criando novo arquivo vazio.');
      fs.writeFileSync(processosPath, '[]', 'utf8');
      return [];
    }
    
    // Ler o arquivo de processos
    const processosData = fs.readFileSync(processosPath, 'utf8');
    const processos = JSON.parse(processosData || '[]');
    
    return processos;
  } catch (error) {
    console.error('Erro ao obter processos:', error);
    return [];
  }
}

// Função para atualizar os dados do processo com informações de um novo arquivo
function updateProcessoComArquivo(processId, fileInfo) {
  try {
    console.log(`📝 API - Atualizando processo ${processId} com novo arquivo: ${JSON.stringify(fileInfo)}`);
    
    // Obter todos os processos
    const processos = getProcessos();
    
    // Encontrar o processo pelo ID
    const processoIndex = processos.findIndex(p => p.processId === processId);
    
    // Verificar se o arquivo é uma assinatura baseado no caminho ou tipo
    const isSignature = fileInfo.path.includes('/assinaturas/') || 
                        (fileInfo.documentType && fileInfo.documentType.toLowerCase().includes('assinatura'));
    
    if (processoIndex === -1) {
      console.warn(`⚠️ API - Processo não encontrado para atualização: ${processId}`);
      // Criar um novo processo se não existir
      const novoProcesso = {
        processId,
        documentos: isSignature ? [] : [fileInfo],
        assinaturas: isSignature ? [fileInfo] : [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      processos.push(novoProcesso);
      console.log(`✅ API - Novo processo criado com ID: ${processId}`);
    } else {
      // Processo encontrado, atualizar
      if (isSignature) {
        // É uma assinatura, adicionar ao array de assinaturas
        if (!processos[processoIndex].assinaturas) {
          processos[processoIndex].assinaturas = [];
        }
        processos[processoIndex].assinaturas.push(fileInfo);
        console.log(`✅ API - Assinatura adicionada ao processo ${processId}`);
      } else {
        // É um documento normal, adicionar ao array de documentos
        if (!processos[processoIndex].documentos) {
          processos[processoIndex].documentos = [];
        }
        processos[processoIndex].documentos.push(fileInfo);
        console.log(`✅ API - Documento adicionado ao processo ${processId}`);
      }
      
      processos[processoIndex].updatedAt = new Date().toISOString();
    }
    
    // Salvar de volta no arquivo
    fs.writeFileSync(DATA_FILE, JSON.stringify(processos, null, 2));
    return true;
  } catch (error) {
    console.error(`❌ API - Erro ao atualizar processo com arquivo: ${error.message}`);
    return false;
  }
}

// Endpoint para upload de PDF em base64
router.post('/upload-pdf', async (req, res) => {
  try {
    const { processId, base64Data, filename } = req.body;
    
    if (!processId || !base64Data) {
      return res.status(400).json({
        success: false,
        error: 'processId e base64Data são obrigatórios'
      });
    }
    
    console.log(`📄 API - Recebendo PDF para o processo: ${processId}`);
    
    // Salvar o arquivo no disco usando a função importada do módulo de utilidades
    const fileInfo = await saveBase64FileToUploads(base64Data, processId, 'pdf_completo', filename || `documentos_${processId}_${Date.now()}.pdf`, UPLOADS_DIR);
    
    console.log(`✅ API - PDF salvo com sucesso: ${fileInfo.path}`);
    
    // Agora, atualizar os dados do processo
    const processos = getProcessos();
    const processoIndex = processos.findIndex(p => p.processId === processId);
    
    if (processoIndex >= 0) {
      // Processo existe, atualizar
      if (!processos[processoIndex].pdfGerados) {
        processos[processoIndex].pdfGerados = [];
      }
      
      // Adicionar informações do novo PDF ao processo
      processos[processoIndex].pdfGerados.push({
        path: fileInfo.path,
        type: fileInfo.type,
        size: fileInfo.size,
        name: filename || `documentos_${processId}_${Date.now()}.pdf`,
        documentType: 'pdf_completo',
        uploadedAt: new Date().toISOString()
      });
      
      // Salvar de volta no arquivo
      fs.writeFileSync(DATA_FILE, JSON.stringify(processos, null, 2));
      console.log(`🔄 API - Dados do processo atualizados com o novo PDF`);
    } else {
      console.log(`⚠️ API - Processo não encontrado para atualização: ${processId}`);
    }
    
    // Responder com sucesso
    res.json({
      success: true,
      fileInfo: fileInfo
    });
  } catch (error) {
    console.error(`❌ API - Erro ao salvar PDF: ${error.message}`);
    res.status(500).json({
      success: false,
      error: `Erro ao salvar PDF: ${error.message}`
    });
  }
});

// Endpoint para upload de documento via base64
router.post('/upload-documento-base64', async (req, res) => {
  try {
    const { processId, documentType, base64Data, filename } = req.body;
    
    // Logging para depuração
    console.log('[DEBUG] Recebido upload-documento-base64:');
    console.log('- req.body:', {
      temProcessId: !!processId,
      temDocumentType: !!documentType,
      temBase64Data: !!base64Data,
      temFilename: !!filename
    });
    console.log('- Content-Type:', req.get('Content-Type'));
      
    if (!processId || !documentType || !base64Data) {
      return res.status(400).json({
        success: false,
        error: 'processId, documentType e base64Data são obrigatórios'
      });
    }
    
    console.log(`📤 API - Upload de documento base64: tipo=${documentType}, processId=${processId}`);
    
    // Usar a função importada do módulo de utilidades
    const fileInfo = await saveBase64FileToUploads(base64Data, processId, documentType, filename, UPLOADS_DIR);
    
    console.log(`✅ API - Upload concluído: ${filename || documentType} para ${processId}`);
    console.log(`📄 API - Informações do arquivo: ${JSON.stringify(fileInfo)}`);
    
    // Adicionar ao JSON de processos
    updateProcessoComArquivo(processId, {
      path: fileInfo.path,
      type: fileInfo.type,
      size: fileInfo.size,
      name: filename || `${documentType}_${Date.now()}`,
      documentType,
      uploadedAt: new Date().toISOString()
    });
    
    // Resposta de sucesso
    res.json({
      success: true,
      filePath: fileInfo.path,
      fileName: filename || `${documentType}_${Date.now()}`,
      documentType,
      type: fileInfo.type,
      size: fileInfo.size
    });
  } catch (error) {
    console.error(`❌ API - Erro ao processar upload base64: ${error.message}`, error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router; 