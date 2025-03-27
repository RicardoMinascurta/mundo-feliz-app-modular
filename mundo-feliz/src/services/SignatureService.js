import path from 'path';
import fs from 'fs';
import sharp from 'sharp';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

// Obter o diretório atual em ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const TEMP_DIR = path.join(path.dirname(path.dirname(__dirname)), 'tempo');

/**
 * Serviço para processamento de assinaturas
 */
export class SignatureService {
  /**
   * Processa uma assinatura para remover espaços em branco
   * @param {string} base64Data - Assinatura em formato base64
   * @returns {Promise<string>} - Assinatura processada em formato base64
   */
  async processSignature(base64Data) {
    if (!base64Data) {
      throw new Error('Assinatura não fornecida');
    }
    
    console.log('📝 Processando assinatura para remover espaços em branco...');
    
    // Extrair dados base64 da string
    const base64Image = base64Data.split(';base64,').pop();
    const inputBuffer = Buffer.from(base64Image, 'base64');
    
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
    
    // Converter o buffer de volta para base64
    const processedBase64 = `data:image/png;base64,${finalBuffer.toString('base64')}`;
    
    console.log('✅ Processamento da assinatura concluído com sucesso');
    return processedBase64;
  }

  /**
   * Processa uma assinatura com rembg para remover o fundo
   * @param {string} base64Data - Assinatura em formato base64
   * @returns {Promise<string>} - Assinatura processada em formato base64
   */
  async processSignatureWithRembg(base64Data) {
    if (!base64Data) {
      throw new Error('Assinatura não fornecida');
    }
    
    console.log('📝 Processando assinatura com rembg para remover o fundo...');
    
    // Extrair dados base64 da string
    const base64Image = base64Data.split(';base64,').pop();
    const inputBuffer = Buffer.from(base64Image, 'base64');
    
    // Obter metadados antes do processamento
    const metadata = await sharp(inputBuffer).metadata();
    console.log(`📊 Dimensões originais: ${metadata.width}x${metadata.height}`);
    
    // Aplicar binarização na imagem
    console.log('🔄 Aplicando aumento de contraste e binarização na imagem...');
    const binarizedBuffer = await sharp(inputBuffer)
      .normalize() // Normalizar para melhorar o contraste
      .modulate({ brightness: 1.5, contrast: 2.0 }) // Aumentar mais o brilho e contraste
      .threshold(100) // Diminuir o threshold para capturar mais detalhes
      .toBuffer();
    
    // Redimensionar a imagem para 800x800
    console.log('🔄 Redimensionando imagem...');
    const resizedBuffer = await sharp(binarizedBuffer)
      .resize(800, 800, {  // 800x800 para preservar detalhes
        fit: 'inside',
        withoutEnlargement: true
      })
      .png({ quality: 100 }) // Máxima qualidade
      .toBuffer();
    
    // Criar diretório temporário se não existir
    if (!fs.existsSync(TEMP_DIR)) {
      fs.mkdirSync(TEMP_DIR, { recursive: true });
      console.log(`📁 Diretório temporário criado: ${TEMP_DIR}`);
    }
    
    // Gerar nomes de arquivos temporários
    const timestamp = Date.now();
    const inputPath = path.join(TEMP_DIR, `temp-assinatura-${timestamp}.png`);
    const outputPath = path.join(TEMP_DIR, `temp-assinatura-processada-${timestamp}.png`);
    
    // Salvar imagem redimensionada
    fs.writeFileSync(inputPath, resizedBuffer);
    
    // Usar rembg via Python
    console.log('🔄 Executando rembg para remover o fundo...');
    
    // Criar script Python para usar rembg com as configurações específicas
    const pythonCode = this._createPythonScript(inputPath, outputPath);
    
    // Salvar o código Python em um arquivo temporário
    const tempPyFile = path.join(TEMP_DIR, `temp_rembg_${timestamp}.py`);
    fs.writeFileSync(tempPyFile, pythonCode);
    
    try {
      // Executar o script Python usando o ambiente virtual específico
      const rootDir = path.dirname(path.dirname(__dirname));
      const pythonPath = path.join(rootDir, 'venv', 'Scripts', 'python.exe');
      console.log(`🐍 Usando Python do ambiente virtual: ${pythonPath}`);
      
      execSync(`"${pythonPath}" "${tempPyFile}"`, { stdio: 'inherit' });
      console.log('✅ Processamento rembg concluído');
      
      // Ler a imagem processada
      const processedBuffer = fs.readFileSync(outputPath);
      console.log(`📏 Tamanho após remover fundo: ${(processedBuffer.length / 1024).toFixed(1)} KB`);
      
      // Aplicar trim para remover todas as margens transparentes
      console.log('🔄 Aplicando trim para remover margens...');
      
      // Mais detalhes sobre a imagem antes do trim
      console.log(`📊 Propriedades da imagem antes do trim: ${JSON.stringify({
        format: metadata.format,
        width: metadata.width,
        height: metadata.height,
        channels: metadata.channels,
        premultiplied: metadata.premultiplied,
        size: (processedBuffer.length / 1024).toFixed(1) + ' KB'
      })}`);
      
      // Verifica se a imagem tem canal alpha (transparência)
      const hasTransparency = metadata.channels === 4;
      console.log(`🧪 Imagem ${hasTransparency ? 'tem' : 'não tem'} canal alpha (transparência)`);
      
      // Primeiro criar um buffer com o trim aplicado
      // Usar threshold mais baixo para melhor detecção
      const trimmedBuffer = await sharp(processedBuffer)
        .trim({ threshold: 1 }) // Valor muito baixo para ser extremamente agressivo no recorte
        .toBuffer();
      
      // Obter metadados após o trim para verificar se as dimensões mudaram
      const trimmedMetadata = await sharp(trimmedBuffer).metadata();
      console.log(`📊 Dimensões após trim: ${trimmedMetadata.width}x${trimmedMetadata.height}`);
      
      // Verificar a redução percentual do tamanho após o trim
      const areaAntes = metadata.width * metadata.height;
      const areaDepois = trimmedMetadata.width * trimmedMetadata.height;
      const reducaoPercentual = ((areaAntes - areaDepois) / areaAntes * 100).toFixed(2);
      console.log(`📏 Redução após trim: ${reducaoPercentual}% da área original`);
      
      // Adicionar uma pequena margem ao redor da assinatura para melhor visualização
      const finalBuffer = await sharp(trimmedBuffer)
        .extend({
          top: 10,
          bottom: 10,
          left: 10,
          right: 10,
          background: { r: 0, g: 0, b: 0, alpha: 0 } // Fundo totalmente transparente
        })
        .png({
          quality: 100,
          compressionLevel: 0 // Sem compressão para máxima qualidade
        })
        .toBuffer();
      
      // Converter o buffer de volta para base64
      const processedBase64 = `data:image/png;base64,${finalBuffer.toString('base64')}`;
      
      // Limpar arquivos temporários
      try {
        fs.unlinkSync(inputPath);
        fs.unlinkSync(outputPath);
        fs.unlinkSync(tempPyFile);
        console.log('🧹 Arquivos temporários removidos');
      } catch (cleanupError) {
        console.warn('⚠️ Aviso ao limpar arquivos temporários:', cleanupError);
      }
      
      console.log('✅ Processamento completo da assinatura concluído com sucesso');
      return processedBase64;
      
    } catch (error) {
      console.error('❌ Erro ao executar rembg:', error);
      
      // Em caso de erro com rembg, tentar processar apenas com Sharp como fallback
      console.log('⚠️ Tentando fallback com processamento simples...');
      
      // Limpar arquivos temporários se possível
      try {
        fs.unlinkSync(inputPath);
        fs.unlinkSync(tempPyFile);
      } catch (e) {}
      
      // Aplicar trim apenas como fallback
      const fallbackBuffer = await sharp(inputBuffer)
        .normalize()
        .modulate({ brightness: 1.2, contrast: 1.5 })
        .trim({ threshold: 10 })
        .extend({
          top: 10,
          bottom: 10,
          left: 10,
          right: 10,
          background: { r: 255, g: 255, b: 255, alpha: 0 }
        })
        .png({ quality: 100 })
        .toBuffer();
      
      const fallbackBase64 = `data:image/png;base64,${fallbackBuffer.toString('base64')}`;
      
      return {
        processedSignature: fallbackBase64,
        fallback: true
      };
    }
  }

  /**
   * Cria o script Python para processamento com rembg
   * @private
   * @param {string} inputPath - Caminho do arquivo de entrada
   * @param {string} outputPath - Caminho do arquivo de saída
   * @returns {string} - Script Python
   */
  _createPythonScript(inputPath, outputPath) {
    return `
import rembg
from PIL import Image, ImageOps, ImageEnhance
import sys
import numpy as np

input_path = "${inputPath.replace(/\\/g, '\\\\')}"
output_path = "${outputPath.replace(/\\/g, '\\\\')}"

print(f"Processando imagem: {input_path}")
print(f"Salvando resultado em: {output_path}")

# Carregar a imagem
input_image = Image.open(input_path)

# Verificar e converter para um modo compatível com ImageEnhance
print(f"Modo original da imagem: {input_image.mode}")
if input_image.mode != 'RGB':
    print(f"Convertendo imagem do modo {input_image.mode} para RGB")
    input_image = input_image.convert('RGB')

try:
    # Pré-processamento para melhorar a detecção da assinatura
    # Aumentar o contraste
    print("Aplicando melhoria de contraste...")
    enhancer = ImageEnhance.Contrast(input_image)
    enhanced_image = enhancer.enhance(2.0)  # Aumentar contraste
    
    # Aumentar a nitidez
    print("Aplicando melhoria de nitidez...")
    enhancer = ImageEnhance.Sharpness(enhanced_image)
    enhanced_image = enhancer.enhance(2.0)  # Aumentar nitidez
except Exception as e:
    print(f"Erro durante o pré-processamento: {e}")
    print("Continuando com a imagem original...")
    enhanced_image = input_image

# Configurações específicas para rembg
print("Aplicando rembg para remover fundo...")
session = rembg.new_session("isnet-general-use")
output_image = rembg.remove(
    enhanced_image,
    session=session,
    alpha_matting=True,
    alpha_matting_foreground_threshold=240,
    alpha_matting_background_threshold=10,
    alpha_matting_erode_size=0
)

# Pós-processamento para garantir que a assinatura fique bem definida
# Converter para RGBA se ainda não estiver
print(f"Modo da imagem após rembg: {output_image.mode}")
if output_image.mode != 'RGBA':
    print("Convertendo para RGBA para processamento final")
    output_image = output_image.convert('RGBA')

# Processar canais alpha para melhorar a limpeza do fundo
data = np.array(output_image)
# Tornar pixels quase transparentes totalmente transparentes
r, g, b, a = data.T
# Onde o alpha é muito baixo, torná-lo zero
low_alpha_mask = a < 50
a[low_alpha_mask] = 0
data.T[3] = a

# Criar nova imagem a partir dos dados processados
output_image = Image.fromarray(data)

# Salvar a imagem sem fundo
output_image.save(output_path)
print("Processamento concluído com sucesso!")
`;
  }
}

export const signatureService = new SignatureService();
export default signatureService; 