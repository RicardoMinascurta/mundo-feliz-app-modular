import { TIPOS_PROCESSO, TIPOS_DOCUMENTO } from '../config/processTypes.js';

/**
 * Valida se o tipo de processo e documento são compatíveis
 * @param {string} tipoProcesso - O tipo do processo
 * @param {string} tipoDocumento - O tipo do documento
 * @returns {Object} - Objeto com resultado da validação
 */
export function validarTipoProcessoEDocumento(tipoProcesso, tipoDocumento) {
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