/**
 * Utilitários para manipulação de ficheiros
 */

import fs from 'fs';
import path from 'path';
import { getProcessPath } from './pathUtils.js';

/**
 * Salva um ficheiro base64 na estrutura de pastas do processo
 * @param {string} base64Data - Dados do ficheiro em base64
 * @param {string} processId - ID do processo
 * @param {string} documentType - Tipo de documento
 * @param {string} filename - Nome do ficheiro original (opcional)
 * @param {string} uploadsDir - Diretório base de uploads
 * @returns {object} Informações sobre o ficheiro salvo
 */
export async function saveBase64FileToUploads(base64Data, processId, documentType, filename, uploadsDir) {
  try {
    // Logs claros para debugar o caminho
    console.log(`📄 Salvando arquivo para processId=${processId}, tipo=${documentType}, nome=${filename}`);
    
    // Usar a função padronizada para obter o caminho do processo
    const processPath = getProcessPath(processId, uploadsDir);
    
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
    
    // Calcular o caminho relativo (obtendo a parte apropriada do caminho absoluto)
    const relativePath = path.relative(path.dirname(uploadsDir), caminhoCompleto).replace(/\\/g, '/');
    
    // Retornar o caminho relativo (para armazenar no JSON)
    return {
      path: relativePath,
      type: tipo,
      size: dados.length
    };
  } catch (error) {
    console.error('❌ Erro ao salvar arquivo:', error);
    throw error;
  }
} 