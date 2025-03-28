import fs from 'fs';
import path from 'path';
import { idGeneratorService } from './IdGeneratorService.js';

// Função para salvar arquivo base64 no disco
export async function saveBase64FileToUploads(base64Data, processId, documentType, filename) {
  try {
    // Logs claros para debugar o caminho
    console.log(`📄 Salvando arquivo para processId=${processId}, tipo=${documentType}, nome=${filename}`);
    
    // Extrair categoria principal do ID do processo usando o serviço
    let categoria = idGeneratorService.extrairCategoria(processId);
    
    if (!categoria) {
      console.warn(`⚠️ Formato de ID inválido ou categoria não encontrada: ${processId}`);
      // Tenta extrair manualmente como fallback
      categoria = processId.split('-')[0];
      console.log(`Tentativa de extração manual de categoria: ${categoria}`);
      
      if (!categoria) {
        throw new Error(`Não foi possível determinar a categoria para o ID: ${processId}`);
      }
    }
    
    // Log para identificar a categoria extraída
    console.log(`🏷️ Categoria extraída do ID: ${categoria}`);
    
    // Mapear categorias para nomes de pasta mais amigáveis
    const categoriasMap = {
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
      'ConcessaoTR2': 'Concessao',
      'ConcessaoTREstudante': 'Concessao',
      'ConcessaoTREstudante2': 'Concessao',
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
    
    // Obter categoria normalizada ou usar a original se não estiver mapeada
    let categoriaNormalizada = categoriasMap[categoria] || categoria;
    
    // Forçar 'Concessao' para qualquer categoria que comece com 'Reagrupamento'
    if (categoria.startsWith('Reagrupamento')) {
      categoriaNormalizada = 'Concessao';
      console.log(`🔄 Forçando categoria normalizada para Reagrupamento: ${categoriaNormalizada}`);
    }
    
    // Log da categoria normalizada
    console.log(`📁 Categoria normalizada: ${categoriaNormalizada}`);
    
    // Extrair subcategoria baseada no tipo de processo
    let subcategoria = '';
    let basePath = '';
    
    if (categoria.startsWith('Renovacao')) {
      subcategoria = categoria.replace('Renovacao', '');
      basePath = path.join(categoriaNormalizada, subcategoria, processId);
      console.log(`Tipo Renovacao: subcategoria=${subcategoria}`);
    } else if (categoria.startsWith('Concessao')) {
      subcategoria = categoria.replace('Concessao', '');
      basePath = path.join(categoriaNormalizada, subcategoria, processId);
      console.log(`Tipo Concessao: subcategoria=${subcategoria}`);
    } else if (categoria.startsWith('Reagrupamento')) {
      subcategoria = categoria;
      basePath = path.join('Concessao', subcategoria, processId);
      console.log(`🔍 Para Reagrupamento: categoria=${categoria}, basePath=${basePath}`);
    } else if (categoria === 'CPLPMenor') {
      // Tratamento especial para CPLPMenor para garantir o caminho correto
      basePath = path.join('CPLP', 'Menores', processId);
      console.log(`🔄 Tipo CPLP Menor: usando caminho fixo CPLP/Menores/${processId}`);
    } else if (categoria.startsWith('CPLP')) {
      subcategoria = categoria.replace('CPLP', '');
      basePath = path.join(categoriaNormalizada, subcategoria, processId);
      console.log(`Tipo CPLP: subcategoria=${subcategoria}`);
    } else if (categoria.startsWith('ContagemTempo') || categoria === 'Contagem') {
      // Forçar subcategoria 'Tempo' para manter consistência com a estrutura
      subcategoria = 'Tempo';
      basePath = path.join('Contagem', subcategoria, processId);
      console.log(`Tipo Contagem: categoria=${categoria}, usando subcategoria=${subcategoria}`);
    } else {
      basePath = path.join(categoriaNormalizada, processId);
      console.log(`Outro tipo: categoria=${categoria}`);
    }
    
    console.log(`📁 Criando estrutura de pasta: ${basePath}`);
    
    // Melhor detecção de assinaturas:
    // 1. Verifica o document type (qualquer variante de 'assinatura')
    // 2. Verifica o nome do arquivo (se contém 'assinatura')
    const isSignature = 
      (documentType && documentType.toLowerCase().includes('assinatura')) || 
      (filename && filename.toLowerCase().includes('assinatura'));
    
    // Definir tipo de pasta baseado no tipo de documento
    const tipoDocumentoPasta = isSignature ? 'assinaturas' : 'documentos';
    
    console.log(`📂 Tipo de documento: ${documentType}, Nome: ${filename}`);
    console.log(`📂 Determinado como: ${isSignature ? 'ASSINATURA' : 'DOCUMENTO'}`);
    
    // Criar caminho completo da pasta para o processo
    const processDir = path.join(
      'uploads', 
      basePath,
      tipoDocumentoPasta
    );
    
    console.log(`📂 Caminho completo da pasta: ${processDir} (Tipo: ${isSignature ? 'Assinatura' : 'Documento'})`);
    
    // Garantir que toda a hierarquia de pastas existe
    if (!fs.existsSync(processDir)) {
      fs.mkdirSync(processDir, { recursive: true });
      console.log(`📁 Pasta criada: ${processDir}`);
    }
    
    // Extrair os dados da string base64
    const matches = base64Data.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    
    if (!matches || matches.length !== 3) {
      throw new Error('Formato base64 inválido');
    }
    
    const tipo = matches[1];
    const dados = Buffer.from(matches[2], 'base64');
    
    // Gerar nome de arquivo com timestamp
    const timestamp = Date.now();
    const ext = filename.split('.').pop() || 'dat';
    const nomeArquivo = `${documentType}_${timestamp}.${ext}`;
    const caminhoCompleto = path.join(processDir, nomeArquivo);
    
    // Salvar arquivo
    fs.writeFileSync(caminhoCompleto, dados);
    console.log(`📄 Arquivo salvo: ${caminhoCompleto}`);
    
    // Retornar o caminho relativo (para armazenar no JSON)
    return {
      path: `uploads/${basePath}/${tipoDocumentoPasta}/${nomeArquivo}`,
      type: tipo,
      size: dados.length
    };
  } catch (error) {
    console.error('❌ Erro ao salvar arquivo:', error);
    throw error;
  }
}

// Função auxiliar para determinar o tipo MIME a partir da extensão
export function getMimeTypeFromExtension(filename) {
  const ext = filename.split('.').pop().toLowerCase();
  const mimeTypes = {
    'pdf': 'application/pdf',
    'png': 'image/png',
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'gif': 'image/gif',
    'svg': 'image/svg+xml',
    'webp': 'image/webp',
    'tiff': 'image/tiff',
    'tif': 'image/tiff'
  };
  
  return mimeTypes[ext] || 'application/octet-stream';
} 