/**
 * Configurações de tipos de processo e documentos
 * Este ficheiro define os tipos de processo e documentos válidos para a aplicação
 */

// Constantes para tipos de processo
export const TIPOS_PROCESSO = {
  CONCESSAO: 'concessao',
  CONTAGEM: 'contagem'
};

// Constantes para tipos de documento
export const TIPOS_DOCUMENTO = {
  CONCESSAO: ['TR', 'TR2', 'TREstudante', 'TREstudante2', 'TREstudanteMenor', 'ReagrupamentoConjuge', 'ReagrupamentoFilho', 'ReagrupamentoTutor'],
  CONTAGEM: ['ContagemTempo', 'AnaliseDocumentos']
};

// Verificar se é um processo de menor
export const MINOR_PROCESS_TYPES = [
  'RenovacaoEstudanteSecundario',
  'ConcessaoTREstudanteMenor',
  'ReagrupamentoTutor',
  'CPLPMenor',
  'Reagrupamento Familiar - Tutor',
  'CPLP - Menor'
];

/**
 * Função para validar tipo de processo e documento
 * @param {string} tipoProcesso - Tipo de processo
 * @param {string} tipoDocumento - Tipo de documento
 * @returns {object} Resultado da validação
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

/**
 * Normaliza uma string para comparação
 * Remove acentos, espaços, traços e converte para minúsculas
 * @param {string} str - String a ser normalizada
 * @returns {string} String normalizada
 */
export function normalizeString(str) {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Remove acentos
    .replace(/[\s\-_]+/g, ""); // Remove espaços, traços e sublinhados
}

/**
 * Verifica se um tipo de processo é para menor de idade
 * @param {string} processType - Tipo de processo
 * @returns {boolean} True se for processo para menor
 */
export function isMinorProcess(processType) {
  const normalizedType = normalizeString(processType);
  const normalizedTypes = MINOR_PROCESS_TYPES.map(normalizeString);
  
  return normalizedTypes.some(type => 
    normalizedType.includes(type) || type.includes(normalizedType)
  );
} 