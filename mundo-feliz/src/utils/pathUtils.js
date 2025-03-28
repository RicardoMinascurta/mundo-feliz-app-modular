import path from 'path';
import fs from 'fs';
import { categoriasMap } from '../config/categoriasConfig.js';

/**
 * Obtém o caminho padronizado para um processo baseado no seu ID
 * @param {string} processId - ID do processo
 * @param {string} uploadsDir - Diretório base de uploads
 * @returns {string} Caminho completo para a pasta do processo
 */
export function getProcessPath(processId, uploadsDir) {
  // Extrair categoria do processId
  const categoria = processId.split('-')[0] || 'desconhecido';
  
  // Mapear para a estrutura de pastas padronizada
  const categoriaPasta = categoriasMap[categoria] || categoria;
  console.log(`🔄 Geração de caminho para processId="${processId}", categoria="${categoria}", pasta="${categoriaPasta}"`);
  
  // Usar o mapa de categorias para criar caminho padronizado
  return path.join(uploadsDir, categoriaPasta, processId);
}

/**
 * Garante que a estrutura de pastas do processo existe, criando-a se necessário
 * @param {string} processId - ID do processo
 * @param {string} uploadsDir - Diretório base de uploads
 * @returns {object} Objeto contendo os caminhos criados
 */
export function ensureProcessFolders(processId, uploadsDir) {
  const processBasePath = getProcessPath(processId, uploadsDir);
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
} 