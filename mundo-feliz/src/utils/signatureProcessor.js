/**
 * Utilitário para processar imagens de assinatura
 * Remove o espaço em branco desnecessário e recorta apenas a área com a assinatura
 */
import sharp from 'sharp';

/**
 * Processa uma imagem de assinatura para remover espaços em branco
 * @param {string|Buffer} imageData - Imagem de entrada em formato base64 ou buffer
 * @returns {Promise<Buffer>} - Buffer da imagem processada
 */
export async function trimSignature(imageData) {
  console.log('🔄 Iniciando processamento da assinatura...');
  
  try {
    let inputBuffer;
    
    // Converter base64 para buffer se necessário
    if (typeof imageData === 'string' && imageData.startsWith('data:image')) {
      const base64Data = imageData.split(',')[1];
      inputBuffer = Buffer.from(base64Data, 'base64');
      console.log('✅ Convertido base64 para buffer');
    } else {
      inputBuffer = imageData;
    }
    
    // Obter metadados antes do processamento
    const metadata = await sharp(inputBuffer).metadata();
    console.log(`📊 Dimensões originais: ${metadata.width}x${metadata.height}`);
    
    // Aplicar um aumento de contraste para melhorar a detecção dos traços
    const enhancedBuffer = await sharp(inputBuffer)
      .normalize() // Normaliza o contraste
      .modulate({ brightness: 1.2, contrast: 1.5 }) // Aumenta o brilho e contraste
      .toBuffer();
    
    // Aplicar trim para remover todas as margens brancas/transparentes
    const trimmedBuffer = await sharp(enhancedBuffer)
      .trim({ threshold: 10 }) // Valor baixo para detectar traços claros
      .toBuffer();
    
    // Obter metadados após o trim
    const trimmedMetadata = await sharp(trimmedBuffer).metadata();
    console.log(`📊 Dimensões após trim: ${trimmedMetadata.width}x${trimmedMetadata.height}`);
    
    // Adicionar uma pequena margem ao redor da assinatura para melhor visualização
    const margin = 10; // pixels de margem
    const finalBuffer = await sharp(trimmedBuffer)
      .extend({
        top: margin,
        bottom: margin,
        left: margin,
        right: margin,
        background: { r: 255, g: 255, b: 255, alpha: 0 } // Fundo branco transparente
      })
      .png({ quality: 100 }) // Máxima qualidade
      .toBuffer();
    
    console.log('✅ Processamento da assinatura concluído com sucesso');
    return finalBuffer;
  } catch (error) {
    console.error('❌ Erro ao processar assinatura:', error);
    throw error;
  }
}

/**
 * Converte uma imagem base64 em buffer
 * @param {string} base64Data - String base64 da imagem
 * @returns {Buffer} - Buffer da imagem
 */
export function base64ToBuffer(base64Data) {
  // Remover o prefixo data:image/png;base64, se existir
  const base64Image = base64Data.split(';base64,').pop();
  return Buffer.from(base64Image, 'base64');
}

/**
 * Converte um buffer de imagem para base64
 * @param {Buffer} buffer - Buffer da imagem
 * @param {string} mimeType - Tipo MIME da imagem (ex: 'image/png')
 * @returns {string} - String base64 da imagem
 */
export function bufferToBase64(buffer, mimeType = 'image/png') {
  return `data:${mimeType};base64,${buffer.toString('base64')}`;
} 