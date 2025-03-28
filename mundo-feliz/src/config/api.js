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
  // Reagrupamento - Corrigido para usar caminhos consistentes
  'ReagrupamentoConjuge': 'Reagrupamento/Conjuge',
  'ReagrupamentoFilhoMenor': 'Reagrupamento/Filho',
  'ReagrupamentoFilho': 'Reagrupamento/Filho',
  'ReagrupamentoPaiMaeFora': 'Reagrupamento/PaiMaeFora',
  'ReagrupamentoPaiIdoso': 'Reagrupamento/PaiIdoso',
  'ReagrupamentoPaiMaeIdoso': 'Reagrupamento/PaiIdoso',
  'ReagrupamentoTutor': 'Reagrupamento/Tutor',
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
  // Verificar se temos um mapeamento definido para esta categoria
  if (CATEGORIAS_MAP[categoria]) {
    return CATEGORIAS_MAP[categoria];
  }
  
  // Se for um tipo de Reagrupamento, usar o caminho padrão para garantir consistência
  if (categoria.startsWith('Reagrupamento')) {
    // Extrair o subtipo (por exemplo, de "ReagrupamentoFilho" extraímos "Filho")
    const subtipo = categoria.replace('Reagrupamento', '');
    if (subtipo) {
      return `Reagrupamento/${subtipo}`;
    }
    // Se não conseguirmos extrair um subtipo, usar caminho padrão
    return 'Reagrupamento/Outro';
  }
  
  // Em último caso, retornar a própria categoria
  return categoria;
};

export default {
  API_URL,
  API_CONFIG,
  ENDPOINTS,
  CATEGORIAS_MAP,
  normalizarCategoria
}; 