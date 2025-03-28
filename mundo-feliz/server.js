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
import logger from './src/services/LoggerService.js';
import signatureRoutes from './src/routes/signatureRoutes.js';
import fileRoutes from './src/api/fileRoutes.js';
import { promptService } from './src/services/PromptService.js';
import { execSync } from 'child_process';
import sharp from 'sharp';
import emailService from './src/services/emailService.js';
import apiRoutes from './src/api/index.js';
import dotenv from 'dotenv';

// Carregar variáveis de ambiente
dotenv.config();

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

// Definir um mapa de categorias para nomes de pastas
const categoriasMap = {
  'CPLP': 'CPLP',
  'CPLPMaiores': 'CPLP/Maiores',
  'CPLPMenor': 'CPLP/Menores',
  'ConcessaoTR': 'Concessao/TR',
  'ConcessaoTREstudante': 'Concessao/TREstudante',
  'ConcessaoTREstudanteMenor': 'Concessao/TREstudanteMenor',
  'Reagrupamento': 'Reagrupamento',
  'ReagrupamentoFilho': 'Reagrupamento/Filho',
  'ReagrupamentoConjuge': 'Reagrupamento/Conjuge',
  'ReagrupamentoPaiIdoso': 'Reagrupamento/PaiIdoso',
  'ReagrupamentoPaiMaeFora': 'Reagrupamento/PaiMaeFora',
  'ReagrupamentoTutor': 'Reagrupamento/Tutor',
  'RenovacaoEstudanteSuperior': 'Renovacao/EstudanteSuperior',
  'RenovacaoEstudanteSecundario': 'Renovacao/EstudanteSecundario',
  'RenovacaoTratamentoMedico': 'Renovacao/TratamentoMedico',
  'RenovacaoNaoTemEstatuto': 'Renovacao/NaoTemEstatuto',
  'RenovacaoUniaoEuropeia': 'Renovacao/UniaoEuropeia',
  'InformacaoPortal': 'Informacao/Portal',
  'InformacaoPresencial': 'Informacao/Presencial',
  'ContagemTempo': 'Contagem/Tempo'
};


// Mapeamento de tipos de processo para categorias de template
const processToTemplateCategory = {
  // Concessão
  'TR': 'concessao',
  'TRNovo': 'concessao',
  'TREstudante': 'concessao',
  'TREstudante2': 'concessao',
  'TREstudanteMenor': 'concessao',
  'ConcessaoTR': 'concessao',
  'ConcessaoTRNovo': 'concessao',
  'ConcessaoTREstudante': 'concessao',
  'ConcessaoTREstudante2': 'concessao',
  'ConcessaoTREstudanteMenor': 'concessao',
  
  // Reagrupamento (usa templates de concessão)
  'ReagrupamentoConjuge': 'concessao',
  'ReagrupamentoFilho': 'concessao',
  'ReagrupamentoPaiIdoso': 'concessao',
  'ReagrupamentoTutor': 'concessao',
  'ReagrupamentoPaiMaeFora': 'concessao',
  
  // CPLP
  'CPLPMaiores': 'cplp',
  'CPLPMenor': 'cplp',
  
  // Renovação
  'RenovacaoEstudanteSuperior': 'renovacao',
  'RenovacaoEstudanteSecundario': 'renovacao',
  'RenovacaoTratamentoMedico': 'renovacao',
  'RenovacaoNaoTemEstatuto': 'renovacao',
  'RenovacaoUniaoEuropeia': 'renovacao',
  'RenovacaoTitulo': 'renovacao',
  'RenovacaoEstatuto': 'renovacao',
  
  // Contagem de tempo
  'ContagemTempo': 'contagem',
  
  // Informação
  'InformacaoPortal': 'infoportal',
  'InfoPortal': 'infoportal',
  'InformacaoPresencial': 'informacao',
  'InfoPresencial': 'informacao',
  
  // Manifestação de interesse
  'ManifestacaoInteresse': 'manifestacao',
  
  // Alias para corrigir problemas específicos
  'c': 'cplp'
};

// Mapeamento explícito de tipo de processo para categoria do template de prompt
const processoParaCategoriaTemplate = {
  // Concessão
  'TR': 'concessao',
  'TRNovo': 'concessao',
  'TREstudante': 'concessao',
  'TREstudante2': 'concessao',
  'TREstudanteMenor': 'concessao',
  'ConcessaoTR': 'concessao',
  'ConcessaoTRNovo': 'concessao',
  'ConcessaoTREstudante': 'concessao'
};

// Função para obter o caminho padronizado do processo
const getProcessPath = (processId) => {
  // Extrair categoria do processId
  const categoria = processId.split('-')[0] || 'desconhecido';
  
  // Mapear para a estrutura de pastas padronizada
  const categoriaPasta = categoriasMap[categoria] || categoria;
  console.log(`🔄 Geração de caminho para processId="${processId}", categoria="${categoria}", pasta="${categoriaPasta}"`);
  
  // Usar o mapa de categorias para criar caminho padronizado
  return path.join(UPLOADS_DIR, categoriaPasta, processId);
};

// Função para garantir que a estrutura de pastas do processo existe
const ensureProcessFolders = (processId) => {
  const processBasePath = getProcessPath(processId);
  const documentosPath = path.join(processBasePath, 'documentos');
  const assinaturasPath = path.join(processBasePath, 'assinaturas');
  const pdfsPath = path.join(processBasePath, 'pdfs');
  
  // Criar pastas se não existirem
  if (!fs.existsSync(processBasePath)) {
    fs.mkdirSync(processBasePath, { recursive: true });
    console.log(`📁 Pasta base do processo criada: ${processBasePath}`);
  }
  
  if (!fs.existsSync(documentosPath)) {
    fs.mkdirSync(documentosPath, { recursive: true });
    console.log(`📁 Pasta de documentos criada: ${documentosPath}`);
  }
  
  if (!fs.existsSync(assinaturasPath)) {
    fs.mkdirSync(assinaturasPath, { recursive: true });
    console.log(`📁 Pasta de assinaturas criada: ${assinaturasPath}`);
  }

  if (!fs.existsSync(pdfsPath)) {
    fs.mkdirSync(pdfsPath, { recursive: true });
    console.log(`📁 Pasta de PDFs criada: ${pdfsPath}`);
  }
  
  return {
    basePath: processBasePath,
    documentosPath,
    assinaturasPath,
    pdfsPath
  };
};

// Função para mapear ID da base de dados para período (ano e mês)
function getPeriodoFromDatabaseId(databaseId) {
  if (!databaseId) return "Base de dados Notion";

  // Remover traços do ID recebido para comparação
  const cleanId = databaseId.replace(/-/g, "");
  
  // Mapeamento de IDs para meses e anos
  const databasesInfo = [
    // 2021
    { id: "8b6d712de5da407fb204f5034d05d3cf", period: "Janeiro-Março 2021" },
    { id: "f4aac6cf0061440aa8a15d171f35481d", period: "Abril 2021" },
    { id: "ffe86444262143ebb5327dadb6c6e422", period: "Maio 2021" },
    { id: "a93ce7a1f828451d93ce6298ab7f601a", period: "Junho 2021" },
    { id: "6be267fb2d7f4fdc8b61f46eb2a0ebba", period: "Julho 2021" },
    { id: "eed67eb3b69a442c9b4d8f86a4a6a4c9", period: "Agosto 2021" },
    { id: "b9d7c317a930479ea80235c9828d73a2", period: "Setembro 2021" },
    { id: "a2114ae7333d4067ba85b8a08bd0f583", period: "Outubro 2021" },
    { id: "49cb2679a9cc4d25a632ed0a618b0fad", period: "Novembro 2021" },
    { id: "cd874e807cf54a37ad8d61c8709e7256", period: "Dezembro 2021" },
    
    // 2022
    { id: "0795f6df3b5f44ad8052ad2602874b70", period: "Janeiro 2022" },
    { id: "2ce3a079d7204d00bf8ab575a8a01a4f", period: "Fevereiro 2022" },
    { id: "86bcab16d040480ea078d279611b095e", period: "Março 2022" },
    { id: "4d4c4b39978247cca674f6a28a0a06c3", period: "Abril 2022" },
    { id: "d7f83bbaeb9e46f6aceacd13bad9842f", period: "Maio 2022" },
    { id: "ae82827ab29c4a01aae60e74a746945b", period: "Junho 2022" },
    { id: "9e3c3a49369541fa9d6cb815a1e9fcc5", period: "Julho 2022" },
    { id: "42dcb22c5a8840e2b2941347f524d8d4", period: "Agosto 2022" },
    { id: "611ee01166684638813037a78b8c4208", period: "Setembro 2022" },
    { id: "ba7ca6a9a2e24a8392fee611a3b0dc40", period: "Outubro 2022" },
    { id: "3b6c5e6ec5c54944b9fef3a1d801d57f", period: "Novembro 2022" },
    { id: "d9fd1ab111a94993953c94f9afc41898", period: "Dezembro 2022" },
    
    // 2023
    { id: "ad156a243eb94ad9a30044b90811d461", period: "Janeiro 2023" },
    { id: "a6f8660748314e0dbbb3e71dfe11f906", period: "Fevereiro 2023" },
    { id: "cf19ff4bccc7489a8aaddf4514c56c87", period: "Março 2023" },
    { id: "8ae3d0e73979400dbe9016f5db2254e9", period: "Abril 2023" },
    { id: "9d0cdb718788413cadcd77a3413572a7", period: "Maio 2023" },
    { id: "92c675a9d97a47f1aa2772c91c6a1203", period: "Junho 2023" },
    { id: "63a0957e6d2b4d1ba651997fea813a83", period: "Julho 2023" },
    { id: "b5606e0bda6a40f08475dc2df03ab1d9", period: "Agosto 2023" },
    { id: "93978b6147f047d89dff6ce0dd462afa", period: "Setembro 2023" },
    { id: "2ecb741f56514dc58114a5a286809b3a", period: "Outubro 2023" },
    { id: "9b684bf4ed324e5d9809d00128eb1455", period: "Novembro 2023" },
    { id: "c4cf150b70db4f4f9238910ee9715e76", period: "Dezembro 2023" },
    
    // 2024
    { id: "6329fa2e0a434d7091e59053fe560e7a", period: "Janeiro 2024" },
    { id: "fd2cefc0a5f84c708076470071f6f17a", period: "Fevereiro 2024" },
    { id: "0b37d324adde4f5e86d8efc0736f531e", period: "Março 2024" },
    { id: "7ebba12b5dda4458af4732987429109e", period: "Abril 2024" },
    { id: "461318efc57841b2892aa36f2e0a3a02", period: "Maio 2024" },
    { id: "1582d34a36d54e9b96b115274bf7b1c8", period: "Junho 2024" },
    { id: "ff297d66a67240a3b32587df8880eee0", period: "Julho 2024" },
    { id: "55507a6e7d17441586b1d9ae2d3e736a", period: "Agosto 2024" },
    { id: "3a8d43aa5d5c4380887f4be733375afc", period: "Setembro 2024" },
    { id: "c95a892531e84370b9d08561b4505c04", period: "Outubro 2024" },
    { id: "6c38a8cf8ba045bca17737c32b153332", period: "Novembro 2024" },
    { id: "a1f3004dc4954440a0edccd977745323", period: "Dezembro 2024" }
  ];
  
  // Procurar pelo ID sem traços
  const dbInfo = databasesInfo.find(db => 
    db.id.replace(/-/g, "") === cleanId
  );
  
  console.log(`Buscando período para ID: ${databaseId}, ID limpo: ${cleanId}, Encontrado: ${dbInfo?.period || 'não encontrado'}`);
  
  return dbInfo ? dbInfo.period : "Base de dados Notion";
}

// Configurações do servidor Express
const app = express();
const PORT = 3001;

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
    const processPath = getProcessPath(processId);
    
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

// Endpoint para enviar emails
app.post('/api/email/send', async (req, res) => {
  try {
    console.log('Recebida requisição de email:', {
      to: req.body.to,
      subject: req.body.subject,
      hasHtml: !!req.body.html,
      cc: req.body.cc,
      bcc: req.body.bcc
    });

    const { to, subject, html, cc, bcc } = req.body;
    
    // Validação básica dos campos obrigatórios
    if (!to || !subject || !html) {
      console.log('Campos em falta:', { to, subject, hasHtml: !!html });
      logger.warn('Tentativa de envio de email sem campos obrigatórios');
      return res.status(400).json({ 
        success: false, 
        message: 'Os campos "to", "subject" e "html" são obrigatórios' 
      });
    }
    
    logger.info(`Recebida requisição de envio de email para: ${to}, assunto: ${subject}`);
    
    // Enviar email usando o serviço de email
    console.log('Tentando enviar email...');
    const resultado = await emailService.enviarEmail({ to, subject, html, cc, bcc });
    console.log('Resultado do envio:', resultado);
    
    if (resultado.success) {
      logger.info('Email enviado com sucesso');
      return res.status(200).json(resultado);
    } else {
      console.error('Falha no envio:', resultado.error);
      logger.error(`Falha no envio do email: ${resultado.error}`);
      return res.status(500).json(resultado);
    }
  } catch (error) {
    console.error('Erro detalhado:', error);
    logger.error(`Erro no endpoint de envio de email: ${error.message}`);
    res.status(500).json({ 
      success: false, 
      message: 'Erro interno ao processar o envio do email',
      error: error.message,
      stack: error.stack
    });
  }
});

// Diretórios para dados e uploads
const DATA_DIR = path.join(__dirname, 'data');
const DATA_FILE = path.join(DATA_DIR, 'processos.json');
const UPLOADS_DIR = path.join(__dirname, 'uploads');

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

// Constantes para tipos de processo e documento
const TIPOS_PROCESSO = {
  CONCESSAO: 'concessao',
  CONTAGEM: 'contagem'
};

const TIPOS_DOCUMENTO = {
  CONCESSAO: ['TR', 'TR2', 'TREstudante', 'TREstudante2', 'TREstudanteMenor', 'ReagrupamentoConjuge', 'ReagrupamentoFilho', 'ReagrupamentoTutor'],
  CONTAGEM: ['ContagemTempo', 'AnaliseDocumentos']
};

// Função para validar tipo de processo e documento
function validarTipoProcessoEDocumento(tipoProcesso, tipoDocumento) {
  // Verificar se o tipo de processo é válido
  if (!Object.values(TIPOS_PROCESSO).includes(tipoProcesso)) {
    return {
      valido: false,
      erro: `Tipo de processo inválido: ${tipoProcesso}. Tipos válidos: ${Object.values(TIPOS_PROCESSO).join(', ')}`
    };
  }

  // Obter lista de tipos de documento válidos para o processo
  const tiposDocumentoValidos = tipoProcesso === TIPOS_PROCESSO.CONCESSAO 
    ? TIPOS_DOCUMENTO.CONCESSAO 
    : TIPOS_DOCUMENTO.CONTAGEM;

  // Verificar se o tipo de documento é válido para o processo
  if (!tiposDocumentoValidos.includes(tipoDocumento)) {
    return {
      valido: false,
      erro: `Tipo de documento inválido: ${tipoDocumento} para processo ${tipoProcesso}. Tipos válidos: ${tiposDocumentoValidos.join(', ')}`
    };
  }

  return { valido: true };
}

// Função para salvar arquivo base64 no disco
async function saveBase64FileToUploads(base64Data, processId, documentType, filename) {
  try {
    // Logs claros para debugar o caminho
    console.log(`📄 Salvando arquivo para processId=${processId}, tipo=${documentType}, nome=${filename}`);
    
    // Usar a função padronizada para obter o caminho do processo
    const processPath = getProcessPath(processId);
    
    // Melhor detecção de tipos de arquivo:
    const isSignature = 
      (documentType && documentType.toLowerCase().includes('assinatura')) || 
      (filename && filename.toLowerCase().includes('assinatura'));
    
    const isPdf = 
      (documentType && (documentType.toLowerCase().includes('pdf') || documentType === 'pdf_completo')) || 
      (filename && filename.toLowerCase().endsWith('.pdf'));
    
    // Determinar a pasta para o tipo de documento
    let tipoDocumentoPasta = 'documentos';
    
    if (isSignature) {
      tipoDocumentoPasta = 'assinaturas';
    } else if (isPdf) {
      tipoDocumentoPasta = 'pdfs';
    }
    
    console.log(`📂 Tipo do documento: ${documentType}, Nome: ${filename}`);
    console.log(`📂 Determinado como: ${isSignature ? 'ASSINATURA' : (isPdf ? 'PDF' : 'DOCUMENTO')}`);
    console.log(`📂 Salvando em pasta: ${tipoDocumentoPasta}`);
    
    const pastaDestino = path.join(processPath, tipoDocumentoPasta);
    
    // Garantir que a pasta existe
    if (!fs.existsSync(pastaDestino)) {
      fs.mkdirSync(pastaDestino, { recursive: true });
      console.log(`📁 Pasta criada para arquivo: ${pastaDestino}`);
    }
    
    // Extrair os dados da string base64
    const matches = base64Data.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    
    let tipo = 'application/octet-stream';
    let dados;
    
    if (!matches || matches.length !== 3) {
      console.log('⚠️ Formato base64 sem cabeçalho MIME, tentando processar apenas o conteúdo');
      dados = Buffer.from(base64Data, 'base64');
      
      // Tentar determinar o tipo pela extensão
      if (filename) {
        const ext = filename.split('.').pop().toLowerCase();
        if (ext === 'pdf') tipo = 'application/pdf';
        else if (['png', 'jpg', 'jpeg', 'gif'].includes(ext)) {
          tipo = `image/${ext === 'jpg' ? 'jpeg' : ext}`;
        }
      }
    } else {
      tipo = matches[1];
      dados = Buffer.from(matches[2], 'base64');
    }
    
    // Gerar nome de arquivo com timestamp
    const timestamp = Date.now();
    let ext = 'dat';
    
    if (filename) {
      ext = filename.split('.').pop() || 'dat';
    } else if (tipo === 'application/pdf') {
      ext = 'pdf';
    } else if (tipo.startsWith('image/')) {
      ext = tipo.split('/')[1] === 'jpeg' ? 'jpg' : tipo.split('/')[1];
    }
    
    const nomeArquivo = `${documentType}_${timestamp}.${ext}`;
    const caminhoCompleto = path.join(pastaDestino, nomeArquivo);
    
    // Salvar arquivo
    fs.writeFileSync(caminhoCompleto, dados);
    console.log(`📄 Arquivo salvo em: ${caminhoCompleto}`);
    
    // Extrair categoria para o caminho relativo no JSON
    const categoria = processId.split('-')[0] || 'desconhecido';
    const categoriaPasta = categoriasMap[categoria] || categoria;
    
    // Retornar o caminho relativo (para armazenar no JSON)
    return {
      path: `uploads/${categoriaPasta}/${processId}/${tipoDocumentoPasta}/${nomeArquivo}`,
      type: tipo,
      size: dados.length
    };
  } catch (error) {
    console.error('❌ Erro ao salvar arquivo:', error);
    throw error;
  }
}

// Endpoint para upload de documento via base64
app.post('/api/upload-documento-base64', async (req, res) => {
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
    console.log(`📄 Salvando arquivo para processId=${processId}, tipo=${documentType}, nome=${filename}`);
    
    // Determinar a categoria e subcategoria
    const categoria = processId.split('-')[0];
    
    // Obter a pasta correta para a categoria/tipo
    const categoriaPasta = categoriasMap[categoria] || categoria;
    
    // Determinar se é um PDF, assinatura ou documento regular
    let tipoPasta = 'documentos';
    if (documentType.toLowerCase().includes('pdf') || (filename && filename.toLowerCase().endsWith('.pdf'))) {
      tipoPasta = 'pdfs';
      console.log(`📂 Determinado como: PDF`);
    } else if (documentType.toLowerCase().includes('assinatura')) {
      tipoPasta = 'assinaturas';
      console.log(`📂 Determinado como: ASSINATURA`);
    } else {
      console.log(`📂 Determinado como: DOCUMENTO`);
    }
    
    console.log(`📂 Tipo do documento: ${documentType}, Nome: ${filename}`);
    console.log(`📂 Salvando em pasta: ${tipoPasta}`);
    
    // Criar a estrutura de pastas
    await createProcessStructure(processId);
    
    // Gerar nome de arquivo único
    const timestamp = Date.now();
    const fileExt = filename ? path.extname(filename) : (documentType.toLowerCase().includes('pdf') ? '.pdf' : '.png');
    const newFilename = `${documentType.replace(/\s+/g, '_')}_${timestamp}${fileExt}`;
    
    // Extrair dados base64
    let base64Content = base64Data;
    if (base64Data.includes(';base64,')) {
      base64Content = base64Data.split(';base64,').pop();
    }
    
    // Caminho completo do arquivo
    const processPath = getProcessPath(processId);
    const filePath = path.join(processPath, tipoPasta, newFilename);
    
    // Assegurar que o diretório existe
    const dirPath = path.dirname(filePath);
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
    
    // Salvar o arquivo
    fs.writeFileSync(filePath, base64Content, { encoding: 'base64' });
    
    // Determinar o tipo MIME baseado na extensão
    let mimeType = 'application/octet-stream';
    if (fileExt.toLowerCase() === '.pdf') {
      mimeType = 'application/pdf';
    } else if (['.png', '.jpg', '.jpeg', '.gif'].includes(fileExt.toLowerCase())) {
      mimeType = `image/${fileExt.toLowerCase().replace('.', '')}`;
      if (fileExt.toLowerCase() === '.jpg') mimeType = 'image/jpeg';
    }
    
    // Obter tamanho do arquivo
    const fileStats = fs.statSync(filePath);
    const fileSize = fileStats.size;
    
    // Construir o caminho relativo para armazenamento no JSON
    const relativePath = path.relative(path.resolve('.'), filePath).replace(/\\/g, '/');
    
    console.log(`✅ API - Upload concluído: ${filename || newFilename} para ${processId}`);
    console.log(`📄 API - Informações do arquivo: ${JSON.stringify({
      path: relativePath,
      type: mimeType,
      size: fileSize
    })}`);
    
    // Adicionar ao JSON de processos
    updateProcessoComArquivo(processId, {
      path: relativePath,
      type: mimeType,
      size: fileSize,
      name: filename || newFilename,
      documentType,
          uploadedAt: new Date().toISOString()
    });
    
    // Resposta de sucesso
    res.json({
      success: true,
      filePath: relativePath,
      fileName: newFilename,
      documentType,
      type: mimeType,
      size: fileSize
    });
  } catch (error) {
    console.error(`❌ API - Erro ao processar upload base64: ${error.message}`, error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Endpoint para upload de PDF
app.post('/api/upload-pdf', async (req, res) => {
  try {
    const { processId, base64Data, filename } = req.body;

    // Validar parâmetros obrigatórios
    if (!processId || !base64Data || !filename) {
      return res.status(400).json({
        success: false,
        error: 'Parâmetros incompletos. Necessário: processId, base64Data, filename'
      });
    }

    console.log(`📤 API - Upload de PDF: ${filename}, processId=${processId}`);

    // Salvar o arquivo no disco (usamos "pdf_completo" como tipo de documento)
    const fileInfo = await saveBase64FileToUploads(base64Data, processId, 'pdf_completo', filename);
    
    console.log(`✅ API - Upload de PDF concluído: ${filename} para ${processId}`);
    console.log(`📄 API - Informações do PDF: ${JSON.stringify(fileInfo)}`);

    // Atualizar o processo com o caminho do PDF
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
          
          // Adicionar informações do PDF ao processo
          processos[index].arquivosUpload.push({
            path: fileInfo.path,
            type: fileInfo.type,
            size: fileInfo.size,
            name: filename,
            documentType: 'pdf_completo',
            uploadedAt: new Date().toISOString()
          });
          
          // Atualizar o timestamp de última atualização
          if (processos[index].timestamps) {
            processos[index].timestamps.ultimaAtualizacao = new Date().toISOString();
          }
          
          console.log(`📝 API - Processo atualizado com PDF: ${processId}`);
          
          // Salvar as alterações
          fs.writeFileSync(DATA_FILE, JSON.stringify(processos, null, 2), 'utf8');
        } else {
          console.warn(`⚠️ API - Processo não encontrado para adicionar PDF: ${processId}`);
        }
      } catch (error) {
        console.error(`❌ API - Erro ao processar arquivo JSON para PDF:`, error);
      }
    }
    
    // Retornar informações do arquivo
    res.json({
      success: true,
      fileInfo: fileInfo
    });
    
  } catch (error) {
    console.error('❌ Erro ao fazer upload de PDF:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

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
    
    // Verificar se é um processo de menor
    const MINOR_PROCESS_TYPES = [
      'RenovacaoEstudanteSecundario',
      'ConcessaoTREstudanteMenor',
      'ReagrupamentoTutor',
      'CPLPMenor',
      'Reagrupamento Familiar - Tutor',
      'CPLP - Menor'
    ];
    
    // Normalizar o tipo para comparação
    const normalizeString = (str) => {
      return str
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "") // Remove acentos
        .replace(/[\s\-_]+/g, ""); // Remove espaços, traços e sublinhados
    };
    
    const normalizedType = normalizeString(processType);
    const normalizedTypes = MINOR_PROCESS_TYPES.map(normalizeString);
    
    const isMinor = normalizedTypes.some(type => 
      normalizedType.includes(type) || type.includes(normalizedType)
    );
    
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

// Função para fazer requisição com retry
async function fetchWithRetry(url, options = {}, maxRetries = 3) {
  const timeout = 30000; // 30 segundos de timeout
  const backoff = 1000; // 1 segundo de backoff inicial

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      const response = await fetch(url, {
        ...options,
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      if (attempt === maxRetries) throw error;
      
      // Espera com backoff exponencial
      await new Promise(resolve => setTimeout(resolve, backoff * Math.pow(2, attempt - 1)));
    }
  }
}

// Função para consultar uma base do Notion
async function consultarBaseNotion(databaseId, query) {
  try {
    const response = await fetchWithRetry(
      `${NOTION_API_URL}/databases/${databaseId}/query`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${NOTION_API_KEY}`,
          'Notion-Version': NOTION_API_VERSION,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          filter: {
            property: 'Nome',
            rich_text: {
              contains: query
            }
          }
        })
      }
    );

    if (!response.ok) {
      throw new Error(`Erro na resposta do Notion: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    logger.error(`Erro ao consultar base ${databaseId}:`, error);
    return null;
  }
}

// Modificar o endpoint de pesquisa do Notion
app.post('/api/notion/search', async (req, res) => {
  try {
    const { query, databaseIds } = req.body;
    
    if (!query || query.trim() === '') {
      return res.json({ results: [] });
    }

    logger.info(`Pesquisando por "${query}" em ${databaseIds.length} bases de dados em paralelo`);

    // Criar um array de promessas para todas as consultas
    const searchPromises = databaseIds.map(databaseId => 
      consultarBaseNotion(databaseId, query)
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

// Modificar o endpoint de detalhes da página
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
    const processPath = getProcessPath(processId);
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


app.post('/api/gpt/extract', async (req, res) => {
  try {
    const { text, category, processType, processId, prompt } = req.body;
    
    if (!text || !processType) {
      console.error('❌ API GPT - Parâmetros incompletos');
      return res.status(400).json({
        success: false,
        error: 'Texto e tipo de processo são obrigatórios'
      });
    }
    
    // Usar o mapeamento explícito de categoria ou o valor fornecido
    // Se category estiver vazio ou for inválido, usar o mapeamento
    let normalizedCategory = category;
    
    if (!category || category.trim() === '' || category === 'c' || category === 'unknown') {
      normalizedCategory = processToTemplateCategory[processType] || category || 'default';
      console.log(`🔄 API GPT - Categoria não fornecida ou inválida, usando mapeamento: ${normalizedCategory}`);
    }
    
    console.log(`🧠 API GPT - Processando texto para ${normalizedCategory}/${processType}, processo ${processId}`);
    
    // Analisar a estrutura do texto para log
    let textSummary = '';
    if (typeof text === 'string') {
      textSummary = `String com ${text.length} caracteres`;
    } else if (typeof text === 'object' && text !== null) {
      if (text._combinedText) {
        textSummary = `Objeto com texto combinado (${text._combinedText.length} caracteres) e ${Object.keys(text).length - 1} documentos`;
      } else {
        textSummary = `Objeto com ${Object.keys(text).length} documentos`;
      }
    }
    console.log(`📄 API GPT - Tipo de texto recebido: ${textSummary}`);
    
    // Verificar e formatar o texto adequadamente
    let textToProcess = '';
    
    if (typeof text === 'object' && text !== null) {
      // Se temos um texto combinado preparado, usar
      if (text._combinedText) {
        textToProcess = text._combinedText;
      } else {
        // Criar formato correto manualmente
        textToProcess = Object.entries(text)
          .filter(([key]) => !key.startsWith('_')) // Ignorar campos com prefixo _
          .map(([docType, docText]) => `${docType}\n${docText}`).join('\n\n');
      }
    } else if (typeof text === 'string') {
      textToProcess = text;
    } else {
      return res.status(400).json({
        success: false,
        error: 'Formato de texto inválido'
      });
    }

    // Obter o template de prompt adequado
    let promptTemplate = null;
    if (prompt) {
      // Se um prompt personalizado foi fornecido, usar ele
      promptTemplate = prompt;
      console.log(`📝 API GPT - Usando prompt personalizado fornecido`);
    } else {
      // Caso contrário, tentar obter do sistema de templates
      try {
        promptTemplate = await getPromptTemplate(normalizedCategory, processType);
        if (promptTemplate) {
          console.log(`📝 API GPT - Template de prompt encontrado para ${normalizedCategory}/${processType}`);
        } else {
          console.log(`⚠️ API GPT - Nenhum template de prompt encontrado para ${normalizedCategory}/${processType}`);
          // Usar um prompt genérico
          promptTemplate = "Extraia as informações mais importantes deste documento.";
        }
      } catch (templateError) {
        console.error(`❌ API GPT - Erro ao obter template:`, templateError);
        promptTemplate = "Extraia as informações mais importantes deste documento.";
      }
    }

    // Configurar a chamada para a API da OpenAI
    console.log(`🔄 API GPT - Enviando para processamento usando OpenAI...`);
    
    // Verificar se temos uma chave API configurada
    const OPENAI_API_KEY = process.env.OPENAI_API_KEY || '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';
    const MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini';
    
    if (!OPENAI_API_KEY) {
      throw new Error('API key da OpenAI não configurada');
    }
    
    // Preparar prompt e contexto
    const systemPrompt = promptTemplate.system || promptTemplate;
    const userPrompt = textToProcess;
    
    // LOG DETALHADO DO PROMPT E TEXTO EXTRAÍDO
    console.log('=== DETALHES COMPLETOS DO ENVIO PARA GPT ===');
    console.log('== PROMPT SYSTEM ==');
    console.log(systemPrompt);
    console.log('== TEXTO EXTRAÍDO PELO AZURE (ENVIADO COMO USER PROMPT) ==');
    console.log(userPrompt);
    console.log('=== FIM DOS DETALHES ===');
    
    // Fazer a chamada para a API da OpenAI
    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.2
      })
    });
    
    if (!openaiResponse.ok) {
      const errorData = await openaiResponse.json();
      console.error(`❌ API GPT - Erro na API OpenAI:`, errorData);
      throw new Error(`Erro na API OpenAI: ${errorData.error?.message || 'Erro desconhecido'}`);
    }
    
    const openaiData = await openaiResponse.json();
    
    // Extrair e analisar a resposta
    let responseContent = openaiData.choices[0]?.message?.content;
    let gptResponseData = null;
    
    // Tentar extrair JSON da resposta
    try {
      // Verificar se a resposta é um objeto JSON diretamente
      gptResponseData = JSON.parse(responseContent);
      console.log(`✅ API GPT - Resposta JSON válida recebida`);
    } catch (jsonError) {
      // Tentar extrair JSON da string usando regex
      console.warn(`⚠️ API GPT - Erro ao analisar JSON direto, tentando extrair bloco JSON...`);
      
      const jsonMatch = responseContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          gptResponseData = JSON.parse(jsonMatch[0]);
          console.log(`✅ API GPT - JSON extraído com sucesso da resposta`);
        } catch (innerJsonError) {
          console.error(`❌ API GPT - Erro ao analisar JSON extraído:`, innerJsonError);
          throw new Error('Formato de resposta inválido da OpenAI');
        }
      } else {
        console.error(`❌ API GPT - Nenhum JSON encontrado na resposta`);
        throw new Error('Formato de resposta inválido da OpenAI');
      }
    }
    
    // Criar objeto de resposta no formato esperado
    const gptResponse = {
      success: true,
      data: gptResponseData,
      rawResponse: openaiData,
      promptUsed: systemPrompt
    };
    
    // Função auxiliar para validar resposta do GPT
    function validateGptResponse(data, requiredFields) {
      if (!data || typeof data !== 'object') {
        return { valid: false, reason: 'Dados inválidos', missingFields: [] };
      }
      
      if (requiredFields.length === 0) {
        return { valid: true, reason: 'Sem validação', missingFields: [] };
      }
      
      const missingFields = [];
      
      for (const field of requiredFields) {
        if (field.includes('.')) {
          // Campo aninhado
          const [parent, child] = field.split('.');
          if (!data[parent] || data[parent][child] === undefined) {
            missingFields.push(field);
          }
        } else if (data[field] === undefined) {
          missingFields.push(field);
        }
      }
      
      return {
        valid: missingFields.length === 0,
        reason: missingFields.length > 0 ? 'Campos obrigatórios faltando' : 'OK',
        missingFields
      };
    }

    // Validar a resposta do GPT usando os campos obrigatórios do template
    const requiredFields = promptTemplate.requiredFields || [];
    const validationResult = validateGptResponse(gptResponse.data, requiredFields);
    gptResponse.validation = validationResult;
    
    if (!validationResult.valid) {
      console.warn(`⚠️ API GPT - Resposta inválida: ${validationResult.reason}`);
      console.warn(`⚠️ API GPT - Campos faltantes: ${validationResult.missingFields.join(', ')}`);
    }
    
    // Salvar os dados extraídos no registro do processo
    if (processId && gptResponse.success) {
      try {
        let processos = [];
        let processoEncontrado = false;
        
        if (fs.existsSync(DATA_FILE)) {
          const fileContent = fs.readFileSync(DATA_FILE, 'utf8');
          processos = JSON.parse(fileContent);
          
          // Encontrar o processo pelo ID
          const index = processos.findIndex(p => p.processId === processId);
          
          if (index !== -1) {
            processoEncontrado = true;
            
            // Inicializar campos.documentos se não existir
            if (!processos[index].campos) {
              processos[index].campos = {};
            }
            
            if (!processos[index].campos.documentos) {
              processos[index].campos.documentos = {};
            }
            
            // Adicionar ou atualizar as informações extraídas
            processos[index].campos.documentos = {
              ...processos[index].campos.documentos,
              ...gptResponse.data
            };
            
            // Atualizar o timestamp de última atualização
            if (processos[index].timestamps) {
              processos[index].timestamps.ultimaAtualizacao = new Date().toISOString();
            }
            
            console.log(`✅ API GPT - Processo ${processId} atualizado com dados extraídos`);
            
            // Salvar as alterações
            fs.writeFileSync(DATA_FILE, JSON.stringify(processos, null, 2), 'utf8');
          } else {
            console.warn(`⚠️ API GPT - Processo ${processId} não encontrado no JSON`);
          }
        }
      } catch (error) {
        console.error(`❌ API GPT - Erro ao salvar dados extraídos:`, error);
      }
    }
    
    // Retornar a resposta
    console.log(`✅ API GPT - Processamento concluído com sucesso`);
    res.json({
      success: true,
      data: gptResponse.data,
      validation: validationResult,
      promptUsed: systemPrompt
    });
    
  } catch (error) {
    console.error('❌ API GPT - Erro na extração:', error);
    res.status(500).json({
      success: false,
      error: 'Erro na extração: ' + error.message
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
    const processPath = getProcessPath(processId);
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
      const processPath = getProcessPath(processId);
      
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
      const processPath = getProcessPath(processId);
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

// Endpoint para listar estrutura de pastas de um processo
app.get('/api/structure/:processId', (req, res) => {
  try {
    const { processId } = req.params;
    
    if (!processId) {
      return res.status(400).json({
        success: false,
        error: 'ID do processo é necessário'
      });
    }
    
    // Usar a função padronizada para obter o caminho do processo
    const processPath = getProcessPath(processId);
    console.log(`🔍 Verificando estrutura para processo ${processId}`);
    
    // Verificar se a pasta existe
    if (!fs.existsSync(processPath)) {
      console.log(`⚠️ Estrutura de pastas não encontrada para ${processId}`);
      
      // Criar a estrutura quando solicitada (opcional, pode remover ou manter)
      const { basePath, documentosPath, assinaturasPath } = ensureProcessFolders(processId);
      
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
    const processPath = getProcessPath(processId);
    
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

// Endpoint para receber e salvar PDF enviado pelo cliente
app.post('/api/upload-pdf', (req, res) => {
  try {
    const { processId, base64Data, filename, path } = req.body;
    
    if (!processId || !base64Data) {
      return res.status(400).json({
        success: false,
        error: 'processId e base64Data são obrigatórios'
      });
    }
    
    console.log(`📄 API - Recebendo PDF para o processo: ${processId}`);
    
    // Obter o caminho base do processo
    const processPath = getProcessPath(processId);
    const pdfsFolderPath = `${processPath}/pdfs`;
    
    // Garantir que a pasta de PDFs existe
    if (!fs.existsSync(pdfsFolderPath)) {
      fs.mkdirSync(pdfsFolderPath, { recursive: true });
      console.log(`📁 API - Pasta de PDFs criada: ${pdfsFolderPath}`);
    }
    
    // Definir o caminho completo do arquivo
    const pdfFileName = filename || `documentos_${processId}_${Date.now()}.pdf`;
    const pdfFilePath = `${pdfsFolderPath}/${pdfFileName}`;
    
    console.log(`💾 API - Salvando PDF em: ${pdfFilePath}`);
    
    // Extrair os dados do base64
    let base64Content = base64Data;
    if (base64Content.includes(';base64,')) {
      base64Content = base64Content.split(';base64,').pop();
    }
    
    // Escrever o arquivo
    fs.writeFileSync(pdfFilePath, base64Content, { encoding: 'base64' });
    
    console.log(`✅ API - PDF salvo com sucesso em pdfs: ${pdfFilePath}`);
    
    // Agora, atualizar os dados do processo
    const processos = getProcessos();
    const processoIndex = processos.findIndex(p => p.processId === processId);
    
    if (processoIndex >= 0) {
      // Processo existe, atualizar
      if (!processos[processoIndex].pdfGerados) {
        processos[processoIndex].pdfGerados = [];
      }
      
      // Adicionar informações do novo PDF
      processos[processoIndex].pdfGerados.push({
        path: pdfFilePath,
        type: 'application/pdf',
        size: fs.statSync(pdfFilePath).size,
        name: pdfFileName,
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
      fileInfo: {
        path: pdfFilePath,
        size: fs.statSync(pdfFilePath).size
      }
    });
  } catch (error) {
    console.error(`❌ API - Erro ao salvar PDF: ${error.message}`);
    res.status(500).json({
      success: false,
      error: `Erro ao salvar PDF: ${error.message}`
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

// Endpoint para upload de documento via formulário comum
app.post('/api/upload-documento', upload.single('documento'), (req, res) => {
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