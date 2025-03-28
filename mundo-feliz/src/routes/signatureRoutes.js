import express from 'express';
import { signatureService } from '../services/SignatureService.js';
import { pdfService } from '../services/pdfService.js';
import { fileStorage } from '../services/fileStorage.js';
import { saveBase64FileToUploads } from '../services/fileService.js';
import fs from 'fs';
import path from 'path';

// Importar funções necessárias para o updateProcessoComArquivo
const DATA_DIR = process.env.DATA_DIR || 'data';
const DATA_FILE = path.join(DATA_DIR, 'processos.json');

// Função para obter processos do arquivo JSON (copiada de fileRoutes.js)
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

// Função para atualizar os dados do processo com informações de um novo arquivo (copiada de fileRoutes.js)
function updateProcessoComArquivo(processId, fileInfo) {
  try {
    console.log(`📝 API - Atualizando processo ${processId} com nova assinatura: ${JSON.stringify(fileInfo)}`);
    
    // Obter todos os processos
    const processos = getProcessos();
    
    // Encontrar o processo pelo ID
    const processoIndex = processos.findIndex(p => p.processId === processId);
    
    // Para assinaturas, sempre consideramos que é uma assinatura
    const isSignature = true;
    
    if (processoIndex === -1) {
      console.warn(`⚠️ API - Processo não encontrado para atualização: ${processId}`);
      // Criar um novo processo se não existir
      const novoProcesso = {
        processId,
        documentos: [],
        assinaturas: [fileInfo],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      processos.push(novoProcesso);
      console.log(`✅ API - Novo processo criado com ID: ${processId}`);
    } else {
      // Processo encontrado, atualizar
      // É uma assinatura, adicionar ao array de assinaturas
      if (!processos[processoIndex].assinaturas) {
        processos[processoIndex].assinaturas = [];
      }
      processos[processoIndex].assinaturas.push(fileInfo);
      processos[processoIndex].updatedAt = new Date().toISOString();
      
      console.log(`✅ API - Assinatura adicionada ao processo ${processId}`);
    }
    
    // Salvar de volta no arquivo
    fs.writeFileSync(DATA_FILE, JSON.stringify(processos, null, 2));
    return true;
  } catch (error) {
    console.error(`❌ API - Erro ao atualizar processo com assinatura: ${error.message}`);
    return false;
  }
}

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
    
    console.log(`📤 API - Upload de assinatura para processo: ${processId}`);
    
    // Salvar a assinatura na pasta uploads
    const fileInfo = await saveBase64FileToUploads(
      base64Data,
      processId,
      'assinaturas',
      `assinatura_${Date.now()}.png`
    );
    
    console.log(`✅ API - Assinatura salva com sucesso: ${fileInfo.path}`);
    
    // Adicionar ao JSON de processos usando a mesma função que os documentos
    updateProcessoComArquivo(processId, {
      path: fileInfo.path,
      type: fileInfo.type || 'image/png',
      size: fileInfo.size,
      name: `assinatura_${Date.now()}.png`,
      documentType: 'assinatura',
      uploadedAt: new Date().toISOString()
    });
    
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