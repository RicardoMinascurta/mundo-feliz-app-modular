import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { Client } from '@notionhq/client';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { idGeneratorService } from './src/services/IdGeneratorService.js';
import { databaseIds } from './src/config/notionConfig.js';
import { getPeriodoFromDatabaseId } from './src/config/notionDatabasesInfo.js';
import logger from './src/services/LoggerService.js';
import signatureRoutes from './src/routes/signatureRoutes.js';
import fileRoutes from './src/api/fileRoutes.js';
import emailRoutes from './src/routes/emailRoutes.js';
import emailService from './src/services/server/emailService.js';
import apiRoutes from './src/api/index.js';
import dotenv from 'dotenv';
import { NOTION_API_URL, NOTION_API_VERSION } from './src/config/serverConfig.js';
import { categoriasMap, processToTemplateCategory, processoParaCategoriaTemplate } from './src/config/categoriasConfig.js';
import { getProcessPath, ensureProcessFolders } from './src/utils/pathUtils.js';
import { fetchWithRetry, consultarBaseNotion } from './src/utils/fetchUtils.js';
import { saveBase64FileToUploads } from './src/utils/fileUtils.js';
import { 
  TIPOS_PROCESSO, 
  TIPOS_DOCUMENTO, 
  MINOR_PROCESS_TYPES, 
  validarTipoProcessoEDocumento,
  normalizeString,
  isMinorProcess
} from './src/config/processConfig.js';
import { promptService } from './src/services/PromptService.js';
import { execSync } from 'child_process';
import sharp from 'sharp';

// Carregar variáveis de ambiente
dotenv.config();

// Log para verificar configuração de email (remover dados sensíveis)
console.log('Configuração de email carregada:', {
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: process.env.EMAIL_SECURE,
  user: process.env.EMAIL_USER,
  from: process.env.EMAIL_FROM,
  hasPassword: !!process.env.EMAIL_PASS
});

// Definir a constante para a chave da API Notion
const NOTION_API_KEY = process.env.NOTION_API_KEY;

// Configurar variáveis de ambiente para OpenAI se não estiverem definidas
if (!process.env.OPENAI_API_KEY) {
  process.env.OPENAI_API_KEY = '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';
  console.log('⚠️ API key da OpenAI não encontrada no .env, usando valor padrão');
}

if (!process.env.OPENAI_MODEL) {
  process.env.OPENAI_MODEL = 'gpt-4o-mini';
  console.log('⚠️ Modelo OpenAI não encontrado no .env, usando gpt-4o-mini como padrão');
}

// Obter o diretório atual em ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configurações do servidor Express
const app = express();
const PORT = 3001;
const DATA_DIR = path.join(__dirname, 'data');
const DATA_FILE = path.join(DATA_DIR, 'processos.json');
const UPLOADS_DIR = path.join(__dirname, 'uploads');

// Configurar CORS
app.use(cors());

// Servir arquivos estáticos da pasta uploads - Adicionado para resolver problema de acesso às imagens
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
// Servir arquivos estáticos públicos
app.use(express.static(path.join(__dirname, 'public')));

// Middlewares
app.use(express.json({ limit: '50mb' })); // Para requisições JSON
app.use(express.urlencoded({ extended: true, limit: '50mb' })); // Para formulários

// Rotas da API
app.use('/api', apiRoutes);

// Usar as rotas específicas
app.use('/api', fileRoutes);
app.use('/api', signatureRoutes);
app.use('/api/email', emailRoutes);

// Garantir que os diretórios de dados e uploads existam
if (!fs.existsSync(DATA_DIR)) {
  console.log(`Criando diretório de dados: ${DATA_DIR}`);
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

if (!fs.existsSync(UPLOADS_DIR)) {
  console.log(`Criando diretório de uploads: ${UPLOADS_DIR}`);
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// Verificar se o arquivo processos.json existe, se não, criá-lo com um array vazio
if (!fs.existsSync(DATA_FILE)) {
  fs.writeFileSync(DATA_FILE, JSON.stringify([], null, 2), 'utf8');
  console.log(`Arquivo ${DATA_FILE} criado.`);
}

// Função para obter o template de prompt correto
async function getPromptTemplate(processType, documentType) {
  if (!processType || !documentType) {
    return null;
  }

  try {
    // Sempre carregar a versão mais recente do arquivo de templates usando dynamic import
    // Adicionando timestamp como query param para evitar cache
    const { promptTemplates } = await import(`./src/config/promptTemplates.js?t=${Date.now()}`);
    
    // Verificar se existe template para o tipo de processo
    const processTemplates = promptTemplates[processType];
    if (!processTemplates) {
      console.warn(`Template não encontrado para o tipo de processo: ${processType}`);
      return null;
    }

    // Verificar se existe template para o tipo de documento
    const documentTemplate = processTemplates[documentType];
    if (!documentTemplate) {
      console.warn(`Template não encontrado para o tipo de documento: ${documentType} no processo: ${processType}`);
      return null;
    }

    return documentTemplate;
  } catch (error) {
    console.error(`Erro ao carregar template: ${error.message}`);
    return null;
  }
}

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

// Configuração unificada do multer
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 20 * 1024 * 1024 // 20MB limite
  }
});

// Rotas modularizadas
app.use('/api', signatureRoutes);
app.use('/api', fileRoutes);

// Endpoint para obter todos os processos
app.get('/api/processos/all', (req, res) => {
  try {
    const processosPath = path.join(DATA_DIR, 'processos.json');
    
    // Verificar se o arquivo existe
    if (!fs.existsSync(processosPath)) {
      console.log('Arquivo de processos não encontrado. Criando novo arquivo vazio.');
      fs.writeFileSync(processosPath, '[]', 'utf8');
      return res.json([]);
    }
    
    // Ler o arquivo de processos
    const processosData = fs.readFileSync(processosPath, 'utf8');
    const processos = JSON.parse(processosData || '[]');
    
    console.log(`Retornando ${processos.length} processos do arquivo JSON`);
    res.json(processos);
  } catch (error) {
    console.error('Erro ao obter processos:', error);
    res.status(500).json({ error: `Erro ao obter processos: ${error.message}` });
  }
});

// Endpoint para sobrepor texto em um PDF
app.get('/api/pdf/com-nome/:processId', async (req, res) => {
  try {
    const processId = req.params.processId;
    const nome = req.query.nome || 'Nome do Beneficiário'; // Valor padrão para o nome
    const responsibleName = req.query.responsibleName || '';
    
    logger.info(`Gerando PDF com nome para processo ${processId}`);
    
    // Obter informações do processo para decidir qual PDF base usar
    const processos = JSON.parse(fs.readFileSync(path.join(__dirname, 'data/processos.json'), 'utf8'));
    const processo = processos.find(p => p.processId === processId);
    
    if (!processo) {
      logger.error(`Processo não encontrado: ${processId}`);
      return res.status(404).json({ error: 'Processo não encontrado' });
    }
    
    // Identificar o tipo de processo para escolher o PDF base correto
    const processType = processId.split('-')[0];
    logger.info(`Tipo de processo identificado: ${processType}`);
    
    // Verificar se é um processo de menor usando a função do módulo
    const isMinor = isMinorProcess(processType);
    
    logger.info(`Verificação de processo de menor: ${isMinor ? 'SIM' : 'NÃO'}`);
    
    // Definir o caminho do PDF base de acordo com o tipo de processo
    let basePdfPath;
    if (isMinor) {
      basePdfPath = path.join(__dirname, 'public/pdf-menores.pdf');
      logger.info('Usando declaração de consentimento para MENOR: /pdf-menores.pdf');
    } else {
      // Verificar se há um PDF específico para o processo, senão usar o padrão
      const uploadedPdfPath = path.join(__dirname, `uploads/${processId}/documentos/pdf_completo.pdf`);
      
      if (fs.existsSync(uploadedPdfPath)) {
        basePdfPath = uploadedPdfPath;
        logger.info(`Usando PDF completo já enviado: ${uploadedPdfPath}`);
      } else {
        basePdfPath = path.join(__dirname, 'public/consent.pdf');
        logger.info('Usando declaração de consentimento padrão: /consent.pdf');
      }
    }
    
    // Verificar se o arquivo existe
    if (!fs.existsSync(basePdfPath)) {
      logger.error(`PDF base não encontrado: ${basePdfPath}`);
      return res.status(404).json({ error: 'PDF base não encontrado' });
    }
    
    logger.info(`Carregando PDF base: ${basePdfPath}`);
    
    // Ler o arquivo PDF
    const existingPdfBytes = fs.readFileSync(basePdfPath);
    const pdfDoc = await PDFDocument.load(existingPdfBytes);
    
    // Obter a primeira página
    const pages = pdfDoc.getPages();
    const firstPage = pages[0];
    
    // Adicionar o texto com o nome
    const fontSize = 12;
    firstPage.drawText(nome, {
      x: 150,
      y: isMinor ? 415 : 370, // Posição diferente para menor/adulto
      size: fontSize,
      color: rgb(0, 0, 0),
    });
    
    // Se for processo de menor, adicionar também o nome do responsável
    if (isMinor && responsibleName) {
      firstPage.drawText(responsibleName, {
        x: 150,
        y: 508, // Posição para o nome do responsável no PDF de menores
        size: fontSize,
        color: rgb(0, 0, 0),
      });
    }
    
    // Salvar o PDF modificado
    const pdfBytes = await pdfDoc.save();
    
    // Enviar o PDF como resposta
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="pdf-com-nome-${processId}.pdf"`);
    res.send(Buffer.from(pdfBytes));
    
    logger.info(`PDF gerado com sucesso para ${processId}`);
  } catch (error) {
    logger.error('Erro ao gerar PDF com nome:', error);
    res.status(500).json({ error: error.message });
  }
});

// Endpoint de pesquisa do Notion
app.post('/api/notion/search', async (req, res) => {
  try {
    const { query, databaseIds } = req.body;
    
    if (!query || query.trim() === '') {
      return res.json({ results: [] });
    }

    logger.info(`Pesquisando por "${query}" em ${databaseIds.length} bases de dados em paralelo`);

    // Criar um array de promessas para todas as consultas
    const searchPromises = databaseIds.map(databaseId => 
      consultarBaseNotion(databaseId, query, NOTION_API_KEY, NOTION_API_URL, NOTION_API_VERSION)
        .then(data => {
          if (data && data.results && data.results.length > 0) {
            return data.results.map(page => ({
              id: page.id,
              name: page.properties.Nome?.title?.[0]?.plain_text || 'Nome não encontrado',
              databaseId: databaseId,
              path: getPeriodoFromDatabaseId(databaseId), // Adicionar o período
              url: page.url,
              properties: page.properties
            }));
          }
          return [];
        })
        .catch(error => {
          logger.error(`Erro ao processar base ${databaseId}:`, error);
          return [];
        })
    );
    
    // Executar todas as consultas em paralelo
    const results = await Promise.all(searchPromises);
    
    // Combinar todos os resultados em um único array
    const allResults = results.flat();
    
    logger.info(`Encontrados ${allResults.length} resultados para "${query}"`);
    
    res.json({ results: allResults });
  } catch (error) {
    logger.error('Erro ao pesquisar pessoas:', error);
    res.status(500).json({ error: 'Erro ao pesquisar pessoas' });
  }
});

// Endpoint de detalhes da página
app.get('/api/notion/page/:pageId', async (req, res) => {
  try {
    const { pageId } = req.params;
    
    const response = await fetchWithRetry(
      `${NOTION_API_URL}/pages/${pageId}`,
      {
        headers: {
          'Authorization': `Bearer ${NOTION_API_KEY}`,
          'Notion-Version': NOTION_API_VERSION
        }
      }
    );
    
    if (!response.ok) {
      throw new Error(`Erro na requisição: ${response.status}`);
    }
    
    const pageData = await response.json();
    
    // Formatar propriedades para objeto simples
    const formattedPage = {
      id: pageData.id,
      url: pageData.url,
      properties: {}
    };

    // Percorrer propriedades
    Object.entries(pageData.properties).forEach(([key, value]) => {
      switch (value.type) {
        case 'title':
          formattedPage.properties[key] = value.title.map(t => t.plain_text).join('');
          break;
        case 'rich_text':
          formattedPage.properties[key] = value.rich_text.map(t => t.plain_text).join('');
          break;
        case 'select':
          formattedPage.properties[key] = value.select?.name || null;
          break;
        case 'multi_select':
          formattedPage.properties[key] = value.multi_select.map(s => s.name);
          break;
        case 'date':
          formattedPage.properties[key] = value.date?.start || null;
          break;
        case 'number':
          formattedPage.properties[key] = value.number;
          break;
        case 'checkbox':
          formattedPage.properties[key] = value.checkbox;
          break;
        default:
          formattedPage.properties[key] = null;
      }
    });

    res.json(formattedPage);
  } catch (error) {
    logger.error(`Erro ao obter página ${req.params.pageId}:`, error);
    res.status(500).json({ error: 'Erro ao obter detalhes da página' });
  }
});

// Iniciar o servidor
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
  console.log(`Dados serão salvos em: ${DATA_FILE}`);
  
  // Verificar se a chave da API Notion está definida
  if (process.env.NOTION_API_KEY) {
    console.log(`Conectado à API Notion com chave: ${process.env.NOTION_API_KEY.substring(0, 5)}...`);
  } else {
    console.log(`⚠️ Aviso: Chave da API Notion não definida. Funcionalidades do Notion não estarão disponíveis.`);
  }
}); 

// Função para criar a estrutura de pastas do processo
async function createProcessStructure(processId, processType) {
  try {
    // Usar a função getProcessPath para garantir consistência
    const processPath = getProcessPath(processId, UPLOADS_DIR);
    const documentsPath = path.join(processPath, 'documentos');
    const assinaturasPath = path.join(processPath, 'assinaturas');
    const pdfsPath = path.join(processPath, 'pdfs');
    
    console.log(`🔍 Tentando criar estrutura para: ${processPath}`);
    
    // Extrair os componentes do caminho
    const pathParts = processPath.split(path.sep);
    let currentPath = '';
    
    // Criar cada nível do caminho separadamente
    for (const part of pathParts) {
      if (!part) continue; // Ignorar partes vazias
      
      currentPath = currentPath ? path.join(currentPath, part) : part;
      
      if (!fs.existsSync(currentPath)) {
        console.log(`📁 Criando diretório: ${currentPath}`);
        fs.mkdirSync(currentPath);
      }
    }
    
    // Agora criar as subpastas
    if (!fs.existsSync(documentsPath)) {
      console.log(`📁 Criando pasta de documentos: ${documentsPath}`);
      fs.mkdirSync(documentsPath);
    }
    
    if (!fs.existsSync(assinaturasPath)) {
      console.log(`📁 Criando pasta de assinaturas: ${assinaturasPath}`);
      fs.mkdirSync(assinaturasPath);
    }
    
    if (!fs.existsSync(pdfsPath)) {
      console.log(`📁 Criando pasta de PDFs: ${pdfsPath}`);
      fs.mkdirSync(pdfsPath);
    }
    
    const structure = {
      basePath: processPath,
      documentsPath,
      assinaturasPath,
      pdfsPath
    };
    
    logger.info(`Estrutura de pastas criada para processo ${processId}:`, structure);
    
    return structure;
  } catch (error) {
    logger.error(`Erro ao criar estrutura de pastas para processo ${processId}:`, error);
    throw error;
  }
}

// Endpoint para criar estrutura de pastas do processo
app.post('/api/create-process-structure', async (req, res) => {
  try {
    const { processId, processType } = req.body;
    
    if (!processId || !processType) {
      return res.status(400).json({
        success: false,
        message: 'processId e processType são obrigatórios'
      });
    }
    
    const structure = await createProcessStructure(processId, processType);
    
    res.json({
      success: true,
      data: structure
    });
  } catch (error) {
    logger.error('Erro ao criar estrutura do processo:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao criar estrutura do processo',
      error: error.message
    });
  }
}); 

// Endpoint para upload de assinatura usando multer
app.post('/api/upload-assinatura-file', upload.single('file'), async (req, res) => {
  console.log('[DEBUG] Recebido upload-assinatura-file:', {
    file: req.file ? {
      originalname: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
      path: req.file.path
    } : 'AUSENTE',
    body: req.body
  });
  
  try {
    // Verificar se o arquivo foi recebido via multer
    if (!req.file) {
      console.error('[ERROR] Upload-assinatura - Arquivo não encontrado na requisição');
      return res.status(400).json({ 
        success: false, 
        error: 'Arquivo não encontrado' 
      });
    }
    
    // Forçar o tipo de documento como assinatura
    req.body.documentType = 'assinatura';
    
    // Verificar se o processId foi fornecido
    if (!req.body.processId) {
      console.error('[ERROR] Upload-assinatura - ProcessId não fornecido');
      return res.status(400).json({ 
        success: false, 
        error: 'ID do processo não fornecido' 
      });
    }
    
    const processId = req.body.processId;
    const file = req.file;
    
    console.log(`📤 API - Upload de assinatura: processId=${processId}, arquivo=${file.originalname}`);

    // Usar a função padronizada para obter caminho do processo
    const processPath = getProcessPath(processId, UPLOADS_DIR);
    const assinaturasPath = path.join(processPath, 'assinaturas');
    
    // Garantir que a pasta existe
    if (!fs.existsSync(assinaturasPath)) {
      fs.mkdirSync(assinaturasPath, { recursive: true });
      console.log(`📁 API - Pasta criada para upload de assinatura: ${assinaturasPath}`);
    }
    
    // Gerar o nome do arquivo com timestamp
    const timestamp = Date.now();
    const ext = path.extname(file.originalname) || '.png';
    const filename = `assinatura_${timestamp}${ext}`;
    const filePath = path.join(assinaturasPath, filename);
    
    // Copiar o arquivo temporário para o destino final
    fs.copyFileSync(file.path, filePath);
    console.log(`📄 API - Assinatura salva em: ${filePath}`);
    
    // Extrair categoria para o caminho relativo no JSON
    const categoria = processId.split('-')[0] || 'desconhecido';
    const categoriaPasta = categoriasMap[categoria] || categoria;
    
    // Criar objeto com informações do arquivo
    const fileInfo = {
      path: `uploads/${categoriaPasta}/${processId}/assinaturas/${filename}`,
      type: file.mimetype,
      size: file.size,
      originalName: file.originalname
    };
    
    // Atualizar ou criar o processo com o caminho do arquivo
    let processos = [];
    let processoEncontrado = false;
    
    if (fs.existsSync(DATA_FILE)) {
      try {
        const fileContent = fs.readFileSync(DATA_FILE, 'utf8');
        processos = JSON.parse(fileContent);
        
        // Encontrar o processo pelo ID exato
        const index = processos.findIndex(p => p.processId === processId);
        
        if (index !== -1) {
          processoEncontrado = true;
          // Inicializar arquivosUpload se não existir
          if (!processos[index].arquivosUpload) {
            processos[index].arquivosUpload = [];
          }
          
          // Adicionar informações do arquivo ao processo
          processos[index].arquivosUpload.push({
            path: fileInfo.path,
            type: fileInfo.type,
            size: fileInfo.size,
            name: file.originalname,
            documentType: 'assinatura',
            uploadedAt: new Date().toISOString()
          });
          
          // Atualizar o timestamp de última atualização
          if (processos[index].timestamps) {
            processos[index].timestamps.ultimaAtualizacao = new Date().toISOString();
          }
          
          console.log(`📝 API - Processo atualizado com nova assinatura: ${processId}`);
        }
      } catch (error) {
        console.error(`❌ API - Erro ao processar arquivo JSON:`, error);
      }
    }
    
    // Se o processo não foi encontrado, criá-lo
    if (!processoEncontrado) {
      console.log(`🆕 API - Criando novo processo para a assinatura: ${processId}`);
      
      // Extrair categoria do processId
      const categoria = idGeneratorService.extrairCategoria(processId) || processId.split('-')[0];
      
      // Criar um novo processo com informações básicas
      const novoProcesso = {
        processId: processId,
        tipo: {
          principal: categoria,
          subtipo: categoria
        },
        timestamps: {
          criacao: new Date().toISOString(),
          ultimaAtualizacao: new Date().toISOString()
        },
        campos: {},
        arquivosUpload: [{
          path: fileInfo.path,
          type: fileInfo.type,
          size: fileInfo.size,
          name: file.originalname,
          documentType: 'assinatura',
          uploadedAt: new Date().toISOString()
        }]
      };
      
      // Adicionar o novo processo à lista
      processos.push(novoProcesso);
      console.log(`➕ API - Novo processo criado com ID: ${processId}`);
    }
    
    // Salvar as alterações
    fs.writeFileSync(DATA_FILE, JSON.stringify(processos, null, 2), 'utf8');
    
    // Retornar informações do arquivo
    res.json({
      success: true,
      file: fileInfo
    });
    
  } catch (error) {
    console.error('❌ Erro ao fazer upload de assinatura:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Endpoint alternativo para upload de arquivos
app.post('/api/file-upload', upload.single('file'), async (req, res) => {
  console.log('[DEBUG] Recebido file-upload (endpoint alternativo):');
  console.log('- req.file:', req.file ? {
    originalname: req.file.originalname,
    mimetype: req.file.mimetype,
    size: req.file.size,
    path: req.file.path
  } : 'AUSENTE');
  console.log('- req.body:', req.body);
  console.log('- Content-Type:', req.get('Content-Type'));
  
  try {
    // Verificar se o arquivo foi recebido via multer
    if (!req.file) {
      console.error('[ERROR] file-upload - Arquivo não encontrado na requisição');
      return res.status(400).json({ 
        success: false, 
        error: 'Arquivo não encontrado' 
      });
    }
    
    // Verificar se processId foi enviado
    if (!req.body.processId) {
      console.error('[ERROR] file-upload - ProcessId não fornecido');
      return res.status(400).json({ 
        success: false, 
        error: 'ProcessId é obrigatório' 
      });
    }
    
    // Usar fieldName ou documentType para identificar o tipo de documento
    const documentType = req.body.documentType || req.body.fieldName;
    if (!documentType) {
      console.error('[ERROR] file-upload - Tipo de documento não fornecido');
      return res.status(400).json({ 
        success: false, 
        error: 'DocumentType ou fieldName é obrigatório' 
      });
    }
    
    const processId = req.body.processId;
    const file = req.file;
    
    console.log(`📤 API - Upload alternativo: tipo=${documentType}, processId=${processId}, arquivo=${file.originalname}`);

    // Seguir o mesmo processo do endpoint principal
    try {
      // Usar a função padronizada para obter caminho do processo
      const processPath = getProcessPath(processId, UPLOADS_DIR);
      
      // Melhor detecção de uploads de assinatura:
      const isSignature = 
        (documentType && documentType.toLowerCase().includes('assinatura')) || 
        (file.originalname && file.originalname.toLowerCase().includes('assinatura'));
      
      // Determinar pasta correta baseada no tipo
      const tipoDocumentoPasta = isSignature ? 'assinaturas' : 'documentos';
      
      console.log(`📂 Tipo de documento: ${documentType}, Nome: ${file.originalname}`);
      console.log(`📂 Determinado como: ${isSignature ? 'ASSINATURA' : 'DOCUMENTO'}`);
      console.log(`📂 Salvando em pasta: ${tipoDocumentoPasta}`);
      
      const documentosPath = path.join(processPath, tipoDocumentoPasta);
      
      // Garantir que a pasta existe
      if (!fs.existsSync(documentosPath)) {
        fs.mkdirSync(documentosPath, { recursive: true });
        console.log(`📁 API - Pasta criada para upload alternativo: ${documentosPath}`);
      }
      
      // Gerar nome de arquivo com timestamp
      const timestamp = Date.now();
      const ext = path.extname(file.originalname);
      const filename = `${documentType}_${timestamp}${ext}`;
      const filePath = path.join(documentosPath, filename);
      
      // Copiar o arquivo temporário para o destino final
      fs.copyFileSync(file.path, filePath);
      console.log(`📄 API - Arquivo salvo em: ${filePath}`);
      
      // Extrair categoria para o caminho relativo no JSON
      const categoria = processId.split('-')[0] || 'desconhecido';
      const categoriaPasta = categoriasMap[categoria] || categoria;
      
      // Criar objeto com informações do arquivo
      const fileInfo = {
        path: `uploads/${categoriaPasta}/${processId}/${tipoDocumentoPasta}/${filename}`,
        type: file.mimetype,
        size: file.size,
        originalName: file.originalname
      };
      
      // Atualizar ou criar o processo com o caminho do arquivo
      let processos = [];
      let processoEncontrado = false;
      
      if (fs.existsSync(DATA_FILE)) {
        try {
          const fileContent = fs.readFileSync(DATA_FILE, 'utf8');
          processos = JSON.parse(fileContent);
          
          // Encontrar o processo pelo ID exato
          const index = processos.findIndex(p => p.processId === processId);
          
          if (index !== -1) {
            processoEncontrado = true;
            // Inicializar arquivosUpload se não existir
            if (!processos[index].arquivosUpload) {
              processos[index].arquivosUpload = [];
            }
            
            // Adicionar informações do arquivo ao processo
            processos[index].arquivosUpload.push({
              path: fileInfo.path,
              type: fileInfo.type,
              size: fileInfo.size,
              name: file.originalname,
              documentType: documentType,
              uploadedAt: new Date().toISOString()
            });
            
            // Atualizar o timestamp de última atualização
            if (processos[index].timestamps) {
              processos[index].timestamps.ultimaAtualizacao = new Date().toISOString();
            }
            
            console.log(`📝 API - Processo atualizado com novo arquivo (via upload alternativo): ${processId}`);
          }
        } catch (error) {
          console.error(`❌ API - Erro ao processar arquivo JSON:`, error);
          throw new Error(`Erro ao processar metadados do processo: ${error.message}`);
        }
      }
      
      // Se o processo não foi encontrado, criá-lo
      if (!processoEncontrado) {
        console.log(`🆕 API - Criando novo processo para o arquivo (via upload alternativo): ${processId}`);
        
        // Extrair categoria do processId
        const categoria = idGeneratorService.extrairCategoria(processId) || processId.split('-')[0];
        
        // Criar um novo processo com informações básicas
        const novoProcesso = {
          processId: processId,
          tipo: {
            principal: categoria,
            subtipo: categoria
          },
          timestamps: {
            criacao: new Date().toISOString(),
            ultimaAtualizacao: new Date().toISOString()
          },
          campos: {},
          arquivosUpload: [{
            path: fileInfo.path,
            type: fileInfo.type,
            size: fileInfo.size,
            name: file.originalname,
            documentType: documentType,
            uploadedAt: new Date().toISOString()
          }]
        };
        
        // Adicionar o novo processo à lista
        processos.push(novoProcesso);
        console.log(`➕ API - Novo processo criado com ID: ${processId}`);
      }
      
      // Salvar as alterações
      fs.writeFileSync(DATA_FILE, JSON.stringify(processos, null, 2), 'utf8');
      
      // Retornar informações do arquivo
      res.json({
        success: true,
        file: fileInfo
      });
    } catch (processingError) {
      console.error(`❌ API - Erro ao processar upload alternativo: ${processingError.message}`, processingError);
      res.status(500).json({
        success: false,
        error: `Erro ao processar upload alternativo: ${processingError.message}`
      });
    }
  } catch (error) {
    console.error('❌ Erro no endpoint de upload alternativo:', error);
    res.status(500).json({
      success: false,
      error: `Erro no processamento do upload alternativo: ${error.message}`
    });
  }
}); 

// Endpoint para processar assinatura
app.post('/api/process-signature', async (req, res) => {
  try {
    console.log('[DEBUG] Processando assinatura...');
    
    // Validar se recebemos base64Data
    if (!req.body.base64Data) {
      console.error('[ERROR] Dados da assinatura não fornecidos');
      return res.status(400).json({ 
        success: false, 
        error: 'Dados da assinatura não fornecidos' 
      });
    }
    
    // Extrair dados
    const { processId, base64Data, source = 'api' } = req.body;
    console.log(`📝 Processando assinatura para: ${processId || 'processo não especificado'}, fonte: ${source}`);
    
    // Se não foi fornecido processId, apenas retornar o base64 processado
    if (!processId) {
      console.log('❗ Nenhum processId fornecido, retornando apenas o base64 processado');
      return res.json({
        success: true,
        message: 'Assinatura processada com sucesso',
        data: base64Data,
        source
      });
    }

    // Processar e salvar assinatura
    try {
      // Extrair a parte base64 real (remover o prefixo data:image/png;base64,)
      let cleanBase64 = base64Data;
      if (cleanBase64.includes(',')) {
        cleanBase64 = cleanBase64.split(',')[1];
      } else if (!cleanBase64.startsWith('data:')) {
        // Temos um base64 puro, precisamos adicionar prefixo apropriado
        cleanBase64 = `data:image/png;base64,${cleanBase64}`;
      }
      
      // Usar a função padronizada para obter caminho do processo
      const processPath = getProcessPath(processId, UPLOADS_DIR);
      const assinaturaDir = path.join(processPath, 'assinaturas');
      
      // Garantir que a pasta existe
      if (!fs.existsSync(assinaturaDir)) {
        fs.mkdirSync(assinaturaDir, { recursive: true });
        console.log(`📁 API - Pasta de assinaturas criada: ${assinaturaDir}`);
      }
      
      // Gerar nome da assinatura com timestamp
      const timestamp = Date.now();
      const assinaturaPath = path.join(assinaturaDir, `assinatura_${timestamp}.png`);
      
      // Extrair dados base64 e salvar como arquivo PNG
      const imageData = base64Data.replace(/^data:image\/png;base64,/, '');
      fs.writeFileSync(assinaturaPath, Buffer.from(imageData, 'base64'));
      
      console.log(`✅ Assinatura salva em: ${assinaturaPath}`);
      
      // Extrair categoria para o caminho relativo no JSON
      const categoria = processId.split('-')[0] || 'desconhecido';
      const categoriaPasta = categoriasMap[categoria] || categoria;
      
      // Registrar a assinatura nos dados do processo
      try {
        // Verificar se já temos o processo no JSON
        let processos = [];
        let processoEncontrado = false;
        
        if (fs.existsSync(DATA_FILE)) {
          try {
            const fileContent = fs.readFileSync(DATA_FILE, 'utf8');
            processos = JSON.parse(fileContent);
            
            // Encontrar processo pelo ID
            const index = processos.findIndex(p => p.processId === processId);
            
            if (index !== -1) {
              processoEncontrado = true;
              // Inicializar arquivosUpload se não existir
              if (!processos[index].arquivosUpload) {
                processos[index].arquivosUpload = [];
              }
              
              // Adicionar informações da assinatura com caminho padronizado
              processos[index].arquivosUpload.push({
                path: `uploads/${categoriaPasta}/${processId}/assinaturas/assinatura_${timestamp}.png`,
                type: 'image/png',
                size: Buffer.from(imageData, 'base64').length,
                name: `assinatura_${timestamp}.png`,
                documentType: 'assinatura',
                uploadedAt: new Date().toISOString()
              });
              
              // Atualizar o timestamp de última atualização
              if (processos[index].timestamps) {
                processos[index].timestamps.ultimaAtualizacao = new Date().toISOString();
              }
              
              console.log(`📝 Processo atualizado com nova assinatura: ${processId}`);
            } else {
              console.log(`❓ Processo ${processId} não encontrado no JSON, será criado`);
            }
          } catch (jsonError) {
            console.error(`❌ API - Erro ao processar JSON:`, jsonError);
            // Continuar mesmo com erro no JSON
            console.log(`⚠️ Continuando mesmo com erro no JSON`);
          }
        }
        
        // Se o processo não foi encontrado, criar um novo
        if (!processoEncontrado) {
          console.log(`🆕 API - Criando novo processo para assinatura: ${processId}`);
          
          // Extrair categoria do processId
          const categoria = processId.split('-')[0] || 'desconhecido';
          
          const novoProcesso = {
            processId: processId,
            tipo: {
              principal: categoria,
              subtipo: categoria
            },
            timestamps: {
              criacao: new Date().toISOString(),
              ultimaAtualizacao: new Date().toISOString()
            },
            campos: {},
            arquivosUpload: [{
              path: `uploads/${categoriaPasta}/${processId}/assinaturas/assinatura_${timestamp}.png`,
              type: 'image/png',
              size: Buffer.from(imageData, 'base64').length,
              name: `assinatura_${timestamp}.png`,
              documentType: 'assinatura',
              uploadedAt: new Date().toISOString()
            }]
          };
          
          processos.push(novoProcesso);
        }
        
        // Salvar alterações no JSON
        fs.writeFileSync(DATA_FILE, JSON.stringify(processos, null, 2), 'utf8');
        console.log(`💾 JSON atualizado com assinatura para: ${processId}`);
      } catch (processError) {
        console.error(`❌ API - Erro ao processar assinatura no JSON:`, processError);
        // Continuar mesmo com erro (a assinatura foi salva como arquivo)
        console.log(`⚠️ Assinatura salva como arquivo, mas erro ao atualizar JSON`);
      }
      
      // Responder com sucesso
      res.json({
        success: true,
        message: 'Assinatura processada e salva com sucesso',
        assinaturaPath: `uploads/${categoriaPasta}/${processId}/assinaturas/assinatura_${timestamp}.png`
      });
    } catch (processingError) {
      console.error(`❌ API - Erro ao processar assinatura:`, processingError);
      res.status(500).json({
        success: false,
        error: `Erro ao processar assinatura: ${processingError.message}`
      });
    }
  } catch (error) {
    console.error(`❌ API - Erro no endpoint de assinatura:`, error);
    res.status(500).json({
      success: false,
      error: `Erro no processamento: ${error.message}`
    });
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

// Função para gerar PDF único para um processo
app.get('/api/pdf/generate/:processId', async (req, res) => {
  try {
    const { processId } = req.params;
    
    if (!processId) {
      return res.status(400).json({ error: 'ID do processo é obrigatório' });
    }
    
    // Obter dados do processo
    const processos = getProcessos();
    const processo = processos.find(p => p.processId === processId);
    
    if (!processo) {
      return res.status(404).json({ error: 'Processo não encontrado' });
    }
    
    // Extrair categoria para o caminho relativo no JSON
    const categoria = processId.split('-')[0] || 'desconhecido';
    const categoriaPasta = categoriasMap[categoria] || categoria;
    
    // Verificar se existem arquivos de upload
    if (!processo.arquivosUpload || processo.arquivosUpload.length === 0) {
      return res.status(400).json({ error: 'Não há arquivos para gerar PDF' });
    }
    
    // Caminho base do processo
    const processPath = getProcessPath(processId, UPLOADS_DIR);
    
    // Determinar se deve ir para pasta de assinaturas ou documentos
    const documentType = 'pdf_completo';
    
    // Melhor detecção para assinaturas:
    const isSignature = 
      (documentType && documentType.toLowerCase().includes('assinatura'));
    
    // Pasta para o tipo de documento (documentos ou assinaturas)
    const tipoDocumentoPasta = isSignature ? 'assinaturas' : 'documentos';
    
    // Nome do arquivo
    const fileName = `PDF_Completo_${processId}.pdf`;
    
    // Caminho completo para o PDF
    const pdfPath = path.join(processPath, tipoDocumentoPasta, fileName);
    
    // Implementação a completar
    res.status(501).json({ 
      error: 'Funcionalidade em desenvolvimento',
      processId,
      pdfPath
    });
  } catch (error) {
    console.error('Erro ao gerar PDF:', error);
    res.status(500).json({ error: error.message });
  }
}); 

// Endpoint para listar arquivos de um processo pelo ID
app.get('/api/process-files/:processId', (req, res) => {
  try {
    const processId = req.params.processId;
    
    if (!processId) {
      return res.status(400).json({
        success: false,
        error: 'ID do processo é obrigatório'
      });
    }
    
    console.log(`🔍 API - Listando arquivos para o processo: ${processId}`);
    
    // Extrair a categoria do processId para obter o caminho correto
    const categoria = processId.split('-')[0];
    
    // Usar o mapa de categorias para obter o caminho padronizado
    const categoriasMap = {
      // CPLP
      'CPLP': 'CPLP',
      'CPLPMaiores': 'CPLP/Maiores',
      'CPLPMenor': 'CPLP/Menores',
      
      // Concessão TR
      'ConcessaoTR': 'Concessao/TR',
      'ConcessaoTREstudante': 'Concessao/TREstudante', 
      'ConcessaoTREstudanteMenor': 'Concessao/TREstudanteMenor',
      
      // Reagrupamento
      'Reagrupamento': 'Reagrupamento',
      'ReagrupamentoFilho': 'Reagrupamento/Filho',
      'ReagrupamentoConjuge': 'Reagrupamento/Conjuge',
      'ReagrupamentoPaiIdoso': 'Reagrupamento/PaiIdoso',
      'ReagrupamentoPaiMaeFora': 'Reagrupamento/PaiMaeFora',
      'ReagrupamentoTutor': 'Reagrupamento/Tutor',
      
      // Renovação
      'RenovacaoEstudanteSuperior': 'Renovacao/EstudanteSuperior',
      'RenovacaoEstudanteSecundario': 'Renovacao/EstudanteSecundario',
      'RenovacaoTratamentoMedico': 'Renovacao/TratamentoMedico',
      'RenovacaoNaoTemEstatuto': 'Renovacao/NaoTemEstatuto',
      'RenovacaoUniaoEuropeia': 'Renovacao/UniaoEuropeia',
      
      // Informação
      'InformacaoPortal': 'Informacao/Portal',
      'InformacaoPresencial': 'Informacao/Presencial',
      
      // Contagem
      'ContagemTempo': 'Contagem/Tempo'
    };
    
    const categoriaPasta = categoriasMap[categoria] || categoria;
    console.log(`📂 API - Categoria identificada: "${categoria}", usando pasta: "${categoriaPasta}"`);
    
    // Obter o caminho base do processo
    const processPath = path.join('uploads', categoriaPasta, processId);
    const documentsPath = path.join(processPath, 'documentos');
    
    console.log(`📂 API - Buscando documentos em: ${documentsPath}`);
    
    // Verificar se a pasta de documentos existe
    if (!fs.existsSync(documentsPath)) {
      console.log(`⚠️ API - Pasta de documentos não encontrada: ${documentsPath}`);
      
      // Tentar olhar diretamente o diretório de uploads para buscar os arquivos
      console.log(`🔎 API - Tentando buscar no diretório de uploads...`);
      
      const uploadsDir = path.join(__dirname, 'uploads');
      const allFiles = [];
      
      // Função recursiva para buscar arquivos
      function findFiles(directory) {
        if (!fs.existsSync(directory)) return;
        
        const items = fs.readdirSync(directory);
        
        for (const item of items) {
          const fullPath = path.join(directory, item);
          const stats = fs.statSync(fullPath);
          
          if (stats.isDirectory()) {
            findFiles(fullPath);
          } else if (stats.isFile() && item.includes(processId)) {
            // Encontrou um arquivo relacionado ao processId
            const relativePath = fullPath.replace(__dirname, '').replace(/\\/g, '/');
            
            // Determinar o tipo MIME com base na extensão
            const ext = path.extname(item).toLowerCase();
            let mimeType = 'application/octet-stream';
            
            if (ext === '.pdf') mimeType = 'application/pdf';
            else if (ext === '.png') mimeType = 'image/png';
            else if (ext === '.jpg' || ext === '.jpeg') mimeType = 'image/jpeg';
            else if (ext === '.gif') mimeType = 'image/gif';
            
            allFiles.push({
              path: relativePath,
              name: item,
              mimeType: mimeType,
              size: stats.size,
              createdAt: stats.mtime.toISOString()
            });
          }
        }
      }
      
      findFiles(uploadsDir);
      
      console.log(`🔍 API - Encontrados ${allFiles.length} arquivos relacionados ao processo ${processId}`);
      return res.json(allFiles);
    }
    
    // Obter a lista de arquivos na pasta
    const files = fs.readdirSync(documentsPath);
    
    console.log(`📄 API - Encontrados ${files.length} arquivos para o processo ${processId}`);
    
    // Mapear os arquivos para o formato esperado
    const filesList = files.map(fileName => {
      const filePath = path.join(documentsPath, fileName);
      const stats = fs.statSync(filePath);
      
      // Determinar o tipo MIME com base na extensão
      const ext = path.extname(fileName).toLowerCase();
      let mimeType = 'application/octet-stream';
      
      if (ext === '.pdf') mimeType = 'application/pdf';
      else if (ext === '.png') mimeType = 'image/png';
      else if (ext === '.jpg' || ext === '.jpeg') mimeType = 'image/jpeg';
      else if (ext === '.gif') mimeType = 'image/gif';
      
      // Construir o caminho relativo correto
      const relativePath = path.join('uploads', categoriaPasta, processId, 'documentos', fileName).replace(/\\/g, '/');
      
      return {
        path: relativePath,
        name: fileName,
        mimeType: mimeType,
        size: stats.size,
        createdAt: stats.mtime.toISOString()
      };
    });
    
    res.json(filesList);
  } catch (error) {
    console.error(`❌ API - Erro ao listar arquivos: ${error.message}`);
    res.status(500).json({
      success: false,
      error: `Erro ao listar arquivos: ${error.message}`
    });
  }
});

// Endpoint para obter um processo específico pelo ID
app.get('/api/processos/:processId', (req, res) => {
  try {
    const processId = req.params.processId;
    
    if (!processId) {
      return res.status(400).json({
        success: false,
        error: 'ID do processo é obrigatório'
      });
    }
    
    console.log(`🔍 API - Buscando processo: ${processId}`);
    
    // Carregar dados do arquivo JSON
    const processos = getProcessos();
    
    // Encontrar o processo pelo ID
    const processo = processos.find(p => p.processId === processId);
    
    if (!processo) {
      console.log(`⚠️ API - Processo não encontrado: ${processId}`);
      return res.status(404).json({
        success: false,
        error: 'Processo não encontrado'
      });
    }
    
    console.log(`✅ API - Processo encontrado: ${processId}`);
    res.json(processo);
  } catch (error) {
    console.error(`❌ API - Erro ao obter processo: ${error.message}`);
    res.status(500).json({
      success: false,
      error: `Erro ao obter processo: ${error.message}`
    });
  }
});

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

// Endpoint para mesclar PDF com declaração de consentimento
app.post('/api/merge-pdf-with-consent', async (req, res) => {
  try {
    const { pdfBase64, isMinor } = req.body;
    
    if (!pdfBase64) {
      return res.status(400).json({
        success: false,
        error: 'PDF em base64 não fornecido'
      });
    }
    
    console.log(`📄 API - Iniciando mesclagem de PDF com declaração de consentimento (${isMinor ? 'menor' : 'adulto'})`);
    
    // Definir qual formulário usar
    const consentFormPath = isMinor 
      ? path.join(__dirname, 'public', 'pdf-menores.pdf')
      : path.join(__dirname, 'public', 'consent.pdf');
    
    // Verificar se o arquivo existe
    if (!fs.existsSync(consentFormPath)) {
      console.error(`❌ API - Formulário de consentimento não encontrado: ${consentFormPath}`);
      return res.status(404).json({
        success: false,
        error: `Formulário de consentimento não encontrado: ${consentFormPath}`
      });
    }
    
    // Continuar com o processamento
    // ... existing code ...
  } catch (error) {
    console.error(`❌ API - Erro no endpoint de mesclagem:`, error);
    res.status(500).json({
      success: false,
      error: `Erro no processamento: ${error.message}`
    });
  }
});

