/**
 * Funções utilitárias para processar dados dos processos
 */

/**
 * Obtém valor aninhado de um objeto usando uma string de caminho com pontos
 * Ex: getNestedValue(obj, "pessoaReagrupada.nomeCompleto")
 * 
 * @param {Object} obj Objeto que contém os dados
 * @param {String} path Caminho para o valor desejado, usando pontos para níveis
 * @returns {*} Valor encontrado ou string vazia se não encontrado
 */
export const getNestedValue = (obj, path) => {
  if (!obj || !path) return '';
  
  const keys = path.split('.');
  let result = obj.campos || obj;
  
  for (const key of keys) {
    if (result && typeof result === 'object' && key in result) {
      result = result[key];
    } else {
      return '';
    }
  }
  
  return result || '';
};

/**
 * Processa um template substituindo variáveis no formato {{caminho.para.valor}}
 * pelos valores correspondentes no objeto de dados
 * 
 * @param {String} template String de template com variáveis no formato {{variavel}}
 * @param {Object} dados Objeto com os dados para substituir as variáveis
 * @returns {String} Template processado com as variáveis substituídas
 */
export const processTemplate = (template, dados) => {
  if (!template) return '';
  if (!dados) return template;
  
  return template.replace(/\{\{([^}]+)\}\}/g, (match, path) => {
    const valor = getNestedValue(dados, path);
    return valor || match;
  });
};

/**
 * Extrai o tipo de processo da ID do processo
 * Ex: "ReagrupamentoConjuge-m8lsy5qo-ee239e8a" -> "ReagrupamentoConjuge"
 * 
 * @param {String} processId ID do processo
 * @returns {String} Tipo do processo
 */
export const extrairTipoProcesso = (processId) => {
  if (!processId) return '';
  
  const parts = processId.split('-');
  return parts[0] || '';
};

export default {
  getNestedValue,
  processTemplate,
  extrairTipoProcesso
}; 