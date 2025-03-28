import express from 'express';
import fs from 'fs';
import path from 'path';
import multer from 'multer';
import { pdfService } from '../services/pdfService.js';
import { fileStorage } from '../services/fileStorage.js';
import logger from '../services/LoggerService.js';
import { saveBase64FileToUploads } from '../utils/fileUtils.js';
import { getProcessPath, ensureProcessFolders } from '../utils/pathUtils.js';

const router = express.Router();
const UPLOADS_DIR = process.env.UPLOADS_DIR || 'uploads';
const DATA_DIR = process.env.DATA_DIR || 'data';
const DATA_FILE = path.join(DATA_DIR, 'processos.json');

// Configurar multer para uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const processId = req.body?.processId;
    const documentType = req.body?.documentType || req.body?.fieldName || 'outros';
    
    // Verificar se temos um processId válido
    if (!processId) {
      console.error('❌ Upload sem processId não é permitido');
      return cb(new Error('Upload sem processId não é permitido'));
    }
    
    // Usar a função centralizada para criar o caminho padronizado
    const processPath = getProcessPath(processId, UPLOADS_DIR);
    
    // Melhor detecção de uploads de assinatura:
    // 1. Verifica o document type (qualquer variante de 'assinatura')
    // 2. Verifica o nome do campo do formulário
    // 3. Verifica a URL da solicitação (se contém 'assinatura')
    const isSignature = 
      documentType?.toLowerCase().includes('assinatura') || 
      file.fieldname?.toLowerCase().includes('assinatura') ||
      req.originalUrl?.toLowerCase().includes('assinatura');
    
    // Verificar se é um PDF
    const isPdf = 
      documentType?.toLowerCase().includes('pdf') ||
      file.mimetype === 'application/pdf' ||
      file.originalname?.toLowerCase().endsWith('.pdf');
    
    // Pasta para o tipo de documento (documentos, assinaturas ou pdfs)
    let tipoDocumentoPasta = 'documentos';
    
    if (isSignature) {
      tipoDocumentoPasta = 'assinaturas';
    } else if (isPdf) {
      tipoDocumentoPasta = 'pdfs';
    }
    
    console.log(`📂 Tipo do documento: ${documentType}, Campo: ${file.fieldname}, Tipo MIME: ${file.mimetype}`);
    console.log(`📂 Determinado como: ${isSignature ? 'ASSINATURA' : (isPdf ? 'PDF' : 'DOCUMENTO')}`);
    console.log(`📂 Salvando em pasta: ${tipoDocumentoPasta}`);
    
    // Caminho completo usando a estrutura padronizada
    const uploadPath = path.join(processPath, tipoDocumentoPasta);
    
    // Criar a pasta se não existir
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
      console.log(`📁 Pasta criada para upload: ${uploadPath}`);
    }
    
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    const now = Date.now();
    const documentType = req.body.documentType || req.body.fieldName || 'doc';
    
    // Nome do arquivo: tipo_timestamp_nomearquivo.extensao
    // Usar regex para limpar caracteres problemáticos no nome original
    const originalName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
    const filename = `${documentType}_${now}_${originalName}`;
    
    cb(null, filename);
  }
});

// Filtro para tipos de arquivo aceites
const fileFilter = (req, file, cb) => {
  // Aceitar PDFs, imagens e arquivos comuns
  const allowedMimeTypes = [
    'application/pdf',
    'image/jpeg',
    'image/png',
    'image/gif',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ];
  
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`Tipo de arquivo não suportado: ${file.mimetype}`), false);
  }
};

// Configuração do multer para upload de documentos
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 20 * 1024 * 1024 // 20MB limite
  }
});

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
    
    if (processoIndex === -1) {
      console.warn(`⚠️ API - Processo não encontrado para atualização: ${processId}`);
      // Criar um novo processo se não existir
      const novoProcesso = {
        processId,
        documentos: [fileInfo],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      processos.push(novoProcesso);
      console.log(`✅ API - Novo processo criado com ID: ${processId}`);
    } else {
      // Processo encontrado, atualizar
      if (!processos[processoIndex].documentos) {
        processos[processoIndex].documentos = [];
      }
      
      // Adicionar o novo arquivo à lista de documentos
      processos[processoIndex].documentos.push(fileInfo);
      processos[processoIndex].updatedAt = new Date().toISOString();
      
      console.log(`✅ API - Processo ${processId} atualizado com novo arquivo`);
    }
    
    // Salvar de volta no arquivo
    fs.writeFileSync(DATA_FILE, JSON.stringify(processos, null, 2));
    return true;
  } catch (error) {
    console.error(`❌ API - Erro ao atualizar processo com arquivo: ${error.message}`);
    return false;
  }
}

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

/**
 * Endpoint para upload de documento via formulário comum
 */
router.post('/upload-documento', upload.single('documento'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'Nenhum arquivo enviado'
      });
    }
    
    // Obter informações do arquivo e processId
    const { processId, documentType } = req.body;
    const file = req.file;
    
    // Verificar se temos um processId
    if (!processId) {
      return res.status(400).json({
        success: false,
        error: 'processId é obrigatório'
      });
    }
    
    console.log(`📤 API - Upload de documento: tipo=${documentType || 'não especificado'}, processId=${processId}`);
    console.log(`📄 API - Arquivo recebido: ${file.originalname}, tamanho: ${file.size} bytes`);
    
    // Obter o caminho relativo do arquivo (para armazenar no JSON)
    const relativePath = path.relative(path.resolve('.'), file.path).replace(/\\/g, '/');
    
    // Determinar o tipo MIME baseado na extensão
    let mimeType = file.mimetype || 'application/octet-stream';
    
    // Registrar o arquivo no processo
    const fileInfo = {
      path: relativePath,
      type: mimeType,
      size: file.size,
      name: file.originalname,
      documentType: documentType || path.basename(file.originalname, path.extname(file.originalname)),
      uploadedAt: new Date().toISOString()
    };
    
    // Atualizar o JSON do processo
    updateProcessoComArquivo(processId, fileInfo);
    
    // Resposta de sucesso
    res.json({
      success: true,
      file: fileInfo
    });
  } catch (error) {
    console.error(`❌ API - Erro ao processar upload de documento: ${error.message}`, error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Endpoint para listar estrutura de pastas de um processo
 */
router.get('/structure/:processId', (req, res) => {
  try {
    const { processId } = req.params;
    
    if (!processId) {
      return res.status(400).json({
        success: false,
        error: 'ID do processo é necessário'
      });
    }
    
    // Usar a função padronizada para obter o caminho do processo
    const processPath = getProcessPath(processId, UPLOADS_DIR);
    console.log(`🔍 Verificando estrutura para processo ${processId}`);
    
    // Verificar se a pasta existe
    if (!fs.existsSync(processPath)) {
      console.log(`⚠️ Estrutura de pastas não encontrada para ${processId}`);
      
      // Criar a estrutura quando solicitada (opcional, pode remover ou manter)
      const { basePath, documentosPath, assinaturasPath } = ensureProcessFolders(processId, UPLOADS_DIR);
      
      return res.json({
        success: true,
        message: 'Estrutura de pastas criada',
        processId,
        paths: {
          basePath,
          documentosPath,
          assinaturasPath
        },
        exists: false,
        created: true
      });
    }
    
    // Verificar existência das pastas principais
    const documentosPath = path.join(processPath, 'documentos');
    const assinaturasPath = path.join(processPath, 'assinaturas');
    
    const documentosExists = fs.existsSync(documentosPath);
    const assinaturasExists = fs.existsSync(assinaturasPath);
    
    // Se alguma pasta não existe, criá-la
    if (!documentosExists) {
      fs.mkdirSync(documentosPath, { recursive: true });
    }
    
    if (!assinaturasExists) {
      fs.mkdirSync(assinaturasPath, { recursive: true });
    }
    
    // Obter lista de arquivos em cada pasta
    let documentos = [];
    let assinaturas = [];
    
    if (documentosExists || !documentosExists) {
      try {
        documentos = fs.readdirSync(documentosPath);
      } catch (error) {
        console.error(`Erro ao ler pasta de documentos: ${error.message}`);
      }
    }
    
    if (assinaturasExists || !assinaturasExists) {
      try {
        assinaturas = fs.readdirSync(assinaturasPath);
      } catch (error) {
        console.error(`Erro ao ler pasta de assinaturas: ${error.message}`);
      }
    }
    
    // Retornar a estrutura de pastas do processo
    res.json({
      success: true,
      processId,
      paths: {
        basePath: processPath,
        documentosPath,
        assinaturasPath
      },
      exists: true,
      documentosExists: documentosExists || !documentosExists, // Agora deve ser sempre true
      assinaturasExists: assinaturasExists || !assinaturasExists, // Agora deve ser sempre true
      files: {
        documentos,
        assinaturas
      }
    });
  } catch (error) {
    console.error(`❌ Erro ao verificar estrutura: ${error.message}`);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Endpoint para salvar PDF enviado pelo cliente
 */
router.post('/save-pdf', async (req, res) => {
  try {
    const { pdfData, processId, tipo } = req.body;
    
    if (!pdfData || !processId) {
      return res.status(400).json({
        success: false,
        error: 'Dados do PDF e ID do processo são obrigatórios'
      });
    }
    
    // Decodificar o base64 do PDF
    const pdfBinary = Buffer.from(pdfData.replace(/^data:application\/pdf;base64,/, ''), 'base64');
    
    // Criar pastas se necessário
    const { basePath, pdfsPath } = ensureProcessFolders(processId, UPLOADS_DIR);
    
    // Definir nome do arquivo
    const filename = `${processId}-${tipo || 'documento'}.pdf`;
    const pdfPath = path.join(pdfsPath, filename);
    
    // Salvar o arquivo
    fs.writeFileSync(pdfPath, pdfBinary);
    
    console.log(`✅ PDF salvo com sucesso: ${pdfPath}`);
    
    // Atualizar registro do processo com info do PDF
    if (fs.existsSync(DATA_FILE)) {
      try {
        const fileContent = fs.readFileSync(DATA_FILE, 'utf8');
        const processos = JSON.parse(fileContent);
        
        // Encontrar o processo pelo ID
        const index = processos.findIndex(p => p.processId === processId);
        
        if (index !== -1) {
          // Inicializar documentos se não existir
          if (!processos[index].documentos) {
            processos[index].documentos = {};
          }
          
          // Adicionar o PDF à lista de documentos
          processos[index].documentos[tipo || 'documento'] = {
            path: pdfPath,
            filename,
            dateCreated: new Date().toISOString(),
            fileType: 'application/pdf',
            fileSize: pdfBinary.length
          };
          
          // Atualizar data de modificação
          if (processos[index].timestamps) {
            processos[index].timestamps.ultimaAtualizacao = new Date().toISOString();
          }
          
          // Salvar as alterações
          fs.writeFileSync(DATA_FILE, JSON.stringify(processos, null, 2));
          console.log(`✅ Registro do processo atualizado com informação do PDF`);
        }
      } catch (error) {
        console.error(`❌ Erro ao atualizar registro do processo: ${error.message}`);
        // Continuar mesmo com erro no registro
      }
    }
    
    // Enviar resposta positiva
    res.json({
      success: true,
      filename,
      path: pdfPath,
      message: 'PDF salvo com sucesso'
    });
  } catch (error) {
    console.error('❌ Erro ao salvar PDF:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router; 