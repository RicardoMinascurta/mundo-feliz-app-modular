// Configuração de API para o mundo-feliz

// URL base para chamadas à API
export const API_URL = 'http://localhost:3001';

// Configuração de timeouts e tentativas
export const API_CONFIG = {
  timeout: 60000, // 60 segundos
  retries: 3,
  retryDelay: 1000 // 1 segundo de intervalo entre tentativas
};

// Endpoints comuns
export const ENDPOINTS = {
  // Processos
  PROCESS: {
    SAVE: '/api/save-processo',
    LIST: '/api/processos',
    STATUS: '/api/processos/status',
    GERAR_ID: '/api/gerar-processid'
  },
  
  // Uploads
  UPLOAD: {
    DOCUMENTO: '/api/upload-documento',
    ASSINATURA: '/api/upload-assinatura',
    PDF: '/api/upload-pdf',
    PROCESS_SIGNATURE: '/api/process-signature',
    PROCESS_SIGNATURE_REMBG: '/api/process-signature-rembg'
  },
  
  // Notion
  NOTION: {
    SEARCH: '/api/notion/search',
    PAGE: '/api/notion/page'
  },
  
  // Processamento
  PROCESS: {
    CONTAGEM_TEMPO: '/api/processar-contagem-tempo'
  }
};

// Mapeamento de categorias para diretórios
export const CATEGORIAS_MAP = {
  // Renovação - Todas as subcategorias
  'RenovacaoEstudanteSecundario': 'Renovacao',
  'RenovacaoEstudanteSuperior': 'Renovacao',
  'RenovacaoTrabalho': 'Renovacao',
  'RenovacaoFamiliar': 'Renovacao',
  'RenovacaoNaoTemEstatuto': 'Renovacao',
  'RenovacaoUniaoEuropeia': 'Renovacao', 
  'RenovacaoTratamentoMedico': 'Renovacao',
  // Concessão - Todas as subcategorias
  'ConcessaoTR': 'Concessao',
  'ConcessaoTREstudante': 'Concessao',
  'ConcessaoTREstudanteMenor': 'Concessao',
  'ReagrupamentoConjuge': 'Concessao',
  'ReagrupamentoFilhoMenor': 'Concessao',
  'ReagrupamentoFilho': 'Concessao',
  'ReagrupamentoPaiMaeFora': 'Concessao',
  'ReagrupamentoPaiIdoso': 'Concessao',
  'ReagrupamentoPaiMaeIdoso': 'Concessao',
  'ReagrupamentoTutor': 'Concessao',
  // CPLP - Subcategorias
  'CPLPMaiores': 'CPLP',
  'CPLPMenor': 'CPLP',
  'Maiores': 'CPLP',
  'Menores': 'CPLP',
  // Contagem e Informação
  'ContagemTempo': 'Contagem',
  'Informacao': 'Informacao'
};

// Função utilitária para normalizar categoria
export const normalizarCategoria = (categoria) => {
  // Forçar 'Concessao' para qualquer categoria que comece com 'Reagrupamento'
  if (categoria.startsWith('Reagrupamento')) {
    return 'Concessao';
  }
  
  return CATEGORIAS_MAP[categoria] || categoria;
};

export default {
  API_URL,
  API_CONFIG,
  ENDPOINTS,
  CATEGORIAS_MAP,
  normalizarCategoria
}; 