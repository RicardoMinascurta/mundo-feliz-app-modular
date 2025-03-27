// Utilitário para remover o fundo de uma imagem de assinatura usando rembg
import fs from 'fs/promises';
import { existsSync, accessSync, constants } from 'fs';
import { execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';

// Obter o diretório atual
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuração de diretórios
const TEMP_DIR = path.join(__dirname, 'tempo');

// Caminho para o Python no ambiente virtual
const PYTHON_PATH = 'C:\\Users\\cecil\\Documents\\mundo-feliz-app-modular\\mundo-feliz\\venv\\Scripts\\python.exe';

/**
 * Processa uma imagem de assinatura removendo o fundo
 * @param {Buffer} assinaturaBuffer - Buffer da imagem da assinatura
 * @returns {Promise<Buffer>} - Buffer da imagem processada com fundo removido
 */
export async function removerFundoAssinatura(assinaturaBuffer) {
    const tempoInicio = Date.now();
    console.log('\n🕒 INÍCIO DO PROCESSAMENTO DA ASSINATURA');
    console.log('📏 Tamanho original do arquivo:', (assinaturaBuffer.length / 1024).toFixed(1), 'KB');
    
    try {
        // Criar diretório temporário se não existir
        const tempoDirInicio = Date.now();
        await fs.mkdir(TEMP_DIR, { recursive: true });
        console.log(`⏱️ Criação do diretório: ${((Date.now() - tempoDirInicio)/1000).toFixed(1)}s`);
        
        // Aplicar binarização na imagem
        const tempoBinarizacaoInicio = Date.now();
        console.log('🔄 Aplicando aumento de contraste e binarização na imagem...');
        const binarizedBuffer = await sharp(assinaturaBuffer)
            .normalize() // Normalizar para melhorar o contraste
            .modulate({ brightness: 1.3, contrast: 1.5 }) // Aumentar brilho para realçar traços claros
            .threshold(105) // Valor ainda mais baixo para capturar traços leves
            .toBuffer();
        console.log(`⏱️ Binarização: ${((Date.now() - tempoBinarizacaoInicio)/1000).toFixed(1)}s`);
        console.log(`📏 Tamanho após binarização: ${(binarizedBuffer.length / 1024).toFixed(1)} KB`);
        
        // Redimensionar a imagem para 400x400
        const tempoResizeInicio = Date.now();
        console.log('🔄 Redimensionando imagem para 400x400...');
        const resizedBuffer = await sharp(binarizedBuffer)
            .resize(400, 400, {
                fit: 'inside',
                withoutEnlargement: true
            })
            .png({ quality: 100 }) // Máxima qualidade
            .toBuffer();
        console.log(`⏱️ Redimensionamento: ${((Date.now() - tempoResizeInicio)/1000).toFixed(1)}s`);
        console.log(`📏 Tamanho após redimensionar: ${(resizedBuffer.length / 1024).toFixed(1)} KB`);
        
        // Gerar nomes de arquivos temporários
        const timestamp = Date.now();
        const inputPath = path.join(TEMP_DIR, `temp-assinatura-${timestamp}.png`);
        const outputPath = path.join(TEMP_DIR, `temp-assinatura-processada-${timestamp}.png`);
        
        // Salvar imagem redimensionada
        const tempoSaveInicio = Date.now();
        await fs.writeFile(inputPath, resizedBuffer);
        console.log(`⏱️ Salvamento da imagem: ${((Date.now() - tempoSaveInicio)/1000).toFixed(1)}s`);
        
        // Usar rembg via Python
        const tempoRembgInicio = Date.now();
        console.log('🔄 Executando rembg para remover o fundo...');
        
        // Criar script Python para usar rembg com as configurações específicas
        const pythonCode = `
import rembg
from PIL import Image
import sys

input_path = "${inputPath.replace(/\\/g, '\\\\')}"
output_path = "${outputPath.replace(/\\/g, '\\\\')}"

print(f"Processando imagem: {input_path}")
print(f"Salvando resultado em: {output_path}")

# Carregar a imagem
input_image = Image.open(input_path)

# Configurações específicas para rembg
session = rembg.new_session("isnet-general-use")
output_image = rembg.remove(
    input_image,
    session=session,
    alpha_matting=True,
    alpha_matting_foreground_threshold=240,
    alpha_matting_background_threshold=8,
    alpha_matting_erode_size=0
)

# Salvar a imagem sem fundo
output_image.save(output_path)
print("Processamento concluído com sucesso!")
`;
        
        // Salvar o código Python em um arquivo temporário
        const tempPyFile = path.join(TEMP_DIR, `temp_rembg_${timestamp}.py`);
        await fs.writeFile(tempPyFile, pythonCode);
        
        try {
            // Executar o script Python usando o ambiente virtual específico
            console.log(`🐍 Usando Python do ambiente virtual: ${PYTHON_PATH}`);
            execSync(`"${PYTHON_PATH}" "${tempPyFile}"`, { stdio: 'inherit' });
            console.log(`⏱️ Processamento rembg: ${((Date.now() - tempoRembgInicio)/1000).toFixed(1)}s`);
        } catch (error) {
            console.error('❌ Erro ao executar rembg:', error);
            throw error;
        } finally {
            // Limpar o arquivo temporário do script Python
            await fs.unlink(tempPyFile).catch(() => {});
        }
        
        // Ler a imagem processada
        const tempoReadInicio = Date.now();
        const processedBuffer = await fs.readFile(outputPath);
        console.log(`⏱️ Leitura do resultado: ${((Date.now() - tempoReadInicio)/1000).toFixed(1)}s`);
        console.log(`📏 Tamanho após remover fundo: ${(processedBuffer.length / 1024).toFixed(1)} KB`);
        
        // Limpar arquivos temporários
        const tempoCleanupInicio = Date.now();
        await Promise.all([
            fs.unlink(inputPath).catch(() => {}),
            fs.unlink(outputPath).catch(() => {})
        ]);
        console.log(`⏱️ Limpeza de arquivos: ${((Date.now() - tempoCleanupInicio)/1000).toFixed(1)}s`);
        
        // Tempo total e resumo
        const tempoTotal = Date.now() - tempoInicio;
        console.log('\n📊 RESUMO DO PROCESSAMENTO:');
        console.log(`⏱️ Tempo total: ${(tempoTotal/1000).toFixed(1)} segundos`);
        console.log('📏 Tamanhos:');
        console.log(`   Original: ${(assinaturaBuffer.length/1024).toFixed(1)} KB`);
        console.log(`   Binarizado: ${(binarizedBuffer.length/1024).toFixed(1)} KB`);
        console.log(`   Redimensionado: ${(resizedBuffer.length/1024).toFixed(1)} KB`);
        console.log(`   Final: ${(processedBuffer.length/1024).toFixed(1)} KB`);
        console.log('🏁 FIM DO PROCESSAMENTO\n');
        
        return processedBuffer;
    } catch (error) {
        console.error('❌ Erro ao processar assinatura:', error);
        throw error;
    }
}

/**
 * Remove o fundo de uma assinatura a partir de um arquivo de imagem
 * @param {string} inputPath - Caminho da imagem de entrada
 * @param {string} outputPath - Caminho onde a imagem sem fundo será salva
 * @returns {Promise<boolean>} - Retorna true se o processamento foi bem-sucedido
 */
export async function removerFundoAssinaturaArquivo(inputPath, outputPath) {
    try {
        console.log('\n🔄 Iniciando processamento simplificado da assinatura...');
        console.log(`📄 Imagem de entrada: ${inputPath}`);
        console.log(`📄 Imagem de saída: ${outputPath}`);
        
        // Criar diretório temporário se não existir
        const tempDir = path.join(path.dirname(outputPath), 'temp');
        try {
            await fs.mkdir(tempDir, { recursive: true });
        } catch (error) {
            console.log('Diretório temporário já existe ou não pode ser criado');
        }
        
        // Etapa 1: Ler a imagem de entrada
        console.log('🔍 Etapa 1: Lendo a imagem de entrada...');
        const inputBuffer = await fs.readFile(inputPath);
        
        // Etapa 2: Remover o fundo usando rembg
        console.log('🔍 Etapa 2: Removendo o fundo com rembg...');
        const outputBuffer = await removerFundoAssinatura(inputBuffer);
        
        // Etapa 3: Usar trim() para remover margens
        console.log('🔍 Etapa 3: Removendo margens com trim()...');
        
        // Arquivo temporário após remoção de fundo
        const tempPath = path.join(tempDir, `rembg-output-${Date.now()}.png`);
        await fs.writeFile(tempPath, outputBuffer);
        
        // Obter metadados antes do trim
        const metadataAntes = await sharp(tempPath).metadata();
        console.log(`📊 Dimensões antes do trim: ${metadataAntes.width}x${metadataAntes.height}`);
        
        // Aplicar trim para remover todas as margens transparentes
        const finalBuffer = await sharp(tempPath)
            .trim() // Remove todas as margens transparentes
            .extend({
                top: 0,
                bottom: 0,
                left: 0,
                right: 0,
                background: { r: 0, g: 0, b: 0, alpha: 0 } // Fundo totalmente transparente
            })
            .png({
                quality: 100,
                compressionLevel: 0 // Sem compressão para máxima qualidade
            })
            .toBuffer();
        
        // Obter metadados após o trim
        const metadataDepois = await sharp(finalBuffer).metadata();
        console.log(`📊 Dimensões após trim: ${metadataDepois.width}x${metadataDepois.height}`);
        
        // Salvar o resultado final
        await fs.writeFile(outputPath, finalBuffer);
        
        // Limpar arquivos temporários
        try {
            await fs.unlink(tempPath).catch(() => {});
            console.log('🧹 Arquivos temporários removidos.');
        } catch (error) {
            console.log('Aviso: Não foi possível remover alguns arquivos temporários.');
        }
        
        console.log('✅ Processamento concluído com sucesso!');
        return true;
    } catch (error) {
        console.error('❌ Erro ao processar a imagem:', error);
        throw error;
    }
}

/**
 * Rotaciona uma imagem de assinatura em 90 graus para a esquerda ou direita
 * @param {string} inputPath - Caminho do arquivo de entrada
 * @param {string} outputPath - Caminho do arquivo de saída
 * @param {string} direction - Direção da rotação ('left' ou 'right')
 * @returns {Promise<boolean>} - Retorna true se a rotação foi bem-sucedida
 */
export async function rotacionarAssinatura(inputPath, outputPath, direction) {
    try {
        console.log(`\n🔄 Iniciando rotação da assinatura para ${direction === 'left' ? 'esquerda' : 'direita'}...`);
        console.log(`📄 Imagem de entrada: ${inputPath}`);
        console.log(`📄 Imagem de saída: ${outputPath}`);
        
        // Verificar se o arquivo de entrada existe
        if (!existsSync(inputPath)) {
            console.error(`❌ Arquivo de entrada não encontrado: ${inputPath}`);
            throw new Error(`Arquivo de entrada não encontrado: ${inputPath}`);
        }
        
        // Verificar permissões do arquivo de entrada
        try {
            accessSync(inputPath, constants.R_OK);
            console.log(`✅ Permissão de leitura confirmada para: ${inputPath}`);
        } catch (permError) {
            console.error(`❌ Sem permissão de leitura para o arquivo: ${inputPath}`, permError);
            throw new Error(`Sem permissão de leitura para o arquivo: ${inputPath}`);
        }
        
        // Verificar permissões do diretório de saída
        const outputDir = path.dirname(outputPath);
        try {
            if (!existsSync(outputDir)) {
                console.log(`📁 Criando diretório de saída: ${outputDir}`);
                await fs.mkdir(outputDir, { recursive: true });
            }
            accessSync(outputDir, constants.W_OK);
            console.log(`✅ Permissão de escrita confirmada para o diretório: ${outputDir}`);
        } catch (permError) {
            console.error(`❌ Sem permissão de escrita para o diretório: ${outputDir}`, permError);
            throw new Error(`Sem permissão de escrita para o diretório: ${outputDir}`);
        }
        
        // Ler o arquivo de entrada
        console.log(`📄 Lendo arquivo de entrada...`);
        const inputBuffer = await fs.readFile(inputPath);
        console.log(`✅ Arquivo lido com sucesso: ${(inputBuffer.length / 1024).toFixed(2)} KB`);
        
        // Determinar o ângulo de rotação
        // Para a esquerda: 270 graus (ou -90)
        // Para a direita: 90 graus
        const angle = direction === 'left' ? 270 : 90;
        console.log(`🔄 Ângulo de rotação: ${angle} graus`);
        
        // Obter metadados da imagem antes da rotação
        console.log(`🔍 Obtendo metadados da imagem original...`);
        const metadataAntes = await sharp(inputBuffer).metadata();
        console.log(`📊 Dimensões antes da rotação: ${metadataAntes.width}x${metadataAntes.height}`);
        console.log(`📊 Formato da imagem: ${metadataAntes.format}`);
        
        // Rotacionar a imagem
        console.log(`🔄 Aplicando rotação com sharp...`);
        const rotatedBuffer = await sharp(inputBuffer)
            .rotate(angle, { background: { r: 0, g: 0, b: 0, alpha: 0 } }) // Fundo transparente
            .toBuffer();
        console.log(`✅ Rotação aplicada com sucesso: ${(rotatedBuffer.length / 1024).toFixed(2)} KB`);
        
        // Obter metadados da imagem após a rotação
        const metadataDepois = await sharp(rotatedBuffer).metadata();
        console.log(`📊 Dimensões após a rotação: ${metadataDepois.width}x${metadataDepois.height}`);
        
        // Salvar o resultado
        console.log(`💾 Salvando imagem rotacionada em: ${outputPath}`);
        await fs.writeFile(outputPath, rotatedBuffer);
        console.log(`✅ Imagem rotacionada salva com sucesso!`);
        
        // Verificar se o arquivo foi salvo corretamente
        if (existsSync(outputPath)) {
            const stats = await fs.stat(outputPath);
            console.log(`📊 Tamanho do arquivo salvo: ${(stats.size / 1024).toFixed(2)} KB`);
            
            if (stats.size === 0) {
                console.error(`❌ Arquivo salvo com tamanho zero!`);
                throw new Error('Arquivo salvo com tamanho zero');
            }
        } else {
            console.error(`❌ Arquivo não foi salvo corretamente!`);
            throw new Error('Arquivo não foi salvo corretamente');
        }
        
        console.log(`✅ Rotação da assinatura para ${direction === 'left' ? 'esquerda' : 'direita'} concluída com sucesso!`);
        return true;
    } catch (error) {
        console.error(`❌ Erro ao rotacionar assinatura para ${direction}:`, error);
        console.error(`❌ Stack trace:`, error.stack);
        throw error;
    }
} 