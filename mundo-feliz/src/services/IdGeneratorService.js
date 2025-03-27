import crypto from 'crypto';

/**
 * Serviço para geração de IDs de processos
 */
class IdGeneratorService {
  /**
   * Gera um ID para um processo
   * @param {string} tipoProcesso - O tipo do processo
   * @returns {string} - ID gerado no formato Tipo-timestamp-random
   */
  gerarProcessId(tipoProcesso) {
    if (!tipoProcesso) {
      console.error('⚠️ Tipo de processo não fornecido para gerarProcessId');
      tipoProcesso = 'Desconhecido';
    }
    
    // Normalizar o tipo de processo para gerar um ID consistente
    const tipoNormalizado = this.normalizarTipoProcesso(tipoProcesso);
    
    console.log(`🔑 Gerando ID para o tipo: ${tipoProcesso} → Usando: ${tipoNormalizado}`);
    
    // Gerar 8 caracteres hexadecimais aleatórios
    const randomHex = crypto.randomBytes(4).toString('hex');
    // Timestamp atual em formato compacto (base36)
    const timestamp = Date.now().toString(36);
    // Combinar: tipo + timestamp + random
    const novoId = `${tipoNormalizado}-${timestamp}-${randomHex}`;
    
    console.log(`Gerado ID de processo: ${novoId}`);
    return novoId;
  }

  /**
   * Verifica se um ID de processo tem formato válido
   * @param {string} processId - O ID a ser verificado
   * @returns {boolean} - True se o formato for válido
   */
  validarFormatoId(processId) {
    if (!processId) return false;
    
    // Verificar formato: Tipo-timestamp-random
    return /^[A-Za-z]+-[a-z0-9]+-[0-9a-f]+$/.test(processId);
  }

  /**
   * Extrair a categoria de um ID de processo
   * @param {string} processId - O ID do processo
   * @returns {string} - A categoria do processo
   */
  extrairCategoria(processId) {
    if (!this.validarFormatoId(processId)) {
      console.warn(`ID de processo com formato inválido: ${processId}`);
      return null;
    }
    
    return processId.split('-')[0];
  }

  // Normalizar o tipo de processo para gerar um ID consistente
  normalizarTipoProcesso(tipoProcesso) {
    if (!tipoProcesso) return '';
    
    // Caso especial para Informação de Processo - Distinção entre Portal e Presencial
    if (tipoProcesso.toLowerCase().includes('informação de processo') ||
        tipoProcesso.toLowerCase().includes('informacao de processo') ||
        tipoProcesso.toLowerCase().includes('pedido de título de residência - (informação de processo)')) {
      
      // Verificar se é portal ou presencial
      if (tipoProcesso.toLowerCase().includes('portal')) {
        console.log(`🔑 Normalizado tipo de processo especial: ${tipoProcesso} → InformacaoPortal`);
        return 'InformacaoPortal';
      } else if (tipoProcesso.toLowerCase().includes('presencial')) {
        console.log(`🔑 Normalizado tipo de processo especial: ${tipoProcesso} → InformacaoPresencial`);
        return 'InformacaoPresencial';
      } else {
        // Se não especificar, usar o tipo padrão
        console.log(`🔑 Normalizado tipo de processo especial: ${tipoProcesso} → Informacao`);
        return 'Informacao';
      }
    }

    // Casos especiais - tratamento direto para tipos específicos
    if (tipoProcesso === 'Concessão TR2' || 
        tipoProcesso.toLowerCase().includes('concessão tr2') || 
        tipoProcesso.toLowerCase().includes('concessão tr 2') ||
        tipoProcesso === 'ConcessaoTR2') {
      return 'ConcessaoTR2';
    }

    // Verificação para o novo tipo TR
    if (tipoProcesso === 'Concessão TR Novo' || 
        tipoProcesso.toLowerCase().includes('concessão tr novo') ||
        tipoProcesso.toLowerCase().includes('concessao tr novo') ||
        tipoProcesso === 'ConcessaoTRNovo' ||
        tipoProcesso === 'TRNovo' ||
        tipoProcesso === 'concessao_TR_Novo' ||
        tipoProcesso === 'Concessão TR') {
      console.log(`🔑 Normalizado tipo de processo especial: ${tipoProcesso} → ConcessaoTR`);
      return 'ConcessaoTR';
    }

    // Verificação prioritária para TREstudante2 (antes de TREstudante genérico)
    if (tipoProcesso === 'Concessão TR Estudante 2' || 
        tipoProcesso.toLowerCase().includes('concessão tr estudante 2') ||
        tipoProcesso.toLowerCase().includes('concessao tr estudante 2') ||
        tipoProcesso === 'ConcessaoTREstudante2' ||
        tipoProcesso === 'TREstudante2' ||
        tipoProcesso === 'concessao_TR_Estudante2') {
      console.log(`🔑 Normalizado tipo de processo especial: ${tipoProcesso} → ConcessaoTREstudante2`);
      return 'ConcessaoTREstudante2';
    }

    if (tipoProcesso === 'Concessão TR Estudante' || 
        tipoProcesso.toLowerCase().includes('concessão tr estudante') ||
        tipoProcesso === 'ConcessaoTREstudante') {
      return 'ConcessaoTREstudante';
    }
    
    // Remover acentos, espaços e caracteres especiais para outros casos
    let tipoNormalizado = tipoProcesso
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-zA-Z0-9]/g, '');
    
    return tipoNormalizado;
  }
}

export const idGeneratorService = new IdGeneratorService();
export default idGeneratorService; 