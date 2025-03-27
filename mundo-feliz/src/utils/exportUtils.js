/**
 * Utilitários para exportação de dados
 */

import { getNestedValue } from './processUtils';

/**
 * Converte um objeto processo para dados planificados para exportação
 * 
 * @param {Object} processo Objeto do processo
 * @param {Array} campos Array de definições de campos a serem extraídos
 * @returns {Object} Objeto com os campos extraídos planificados
 */
export const processoParaDadosExportacao = (processo, campos) => {
  if (!processo || !campos) return {};
  
  const resultado = {};
  
  campos.forEach(campo => {
    const valor = getNestedValue(processo, campo.id);
    resultado[campo.label] = valor;
  });
  
  return resultado;
};

/**
 * Exporta dados para formato CSV
 * 
 * @param {Array} dados Array de objetos a serem exportados
 * @param {String} nomeArquivo Nome do arquivo de exportação
 * @returns {void}
 */
export const exportarParaCSV = (dados, nomeArquivo) => {
  if (!dados || !dados.length) return;
  
  // Obter cabeçalhos a partir do primeiro objeto
  const cabecalhos = Object.keys(dados[0]);
  
  // Criar linhas de dados
  const linhasCabecalho = cabecalhos.join(',');
  const linhasConteudo = dados.map(item => {
    return cabecalhos.map(cabecalho => {
      // Garantir que valores com vírgulas sejam colocados entre aspas
      const valor = item[cabecalho] || '';
      return valor.toString().includes(',') ? `"${valor}"` : valor;
    }).join(',');
  }).join('\n');
  
  // Combinar cabeçalhos e conteúdo
  const csvConteudo = `${linhasCabecalho}\n${linhasConteudo}`;
  
  // Criar blob e link para download
  const blob = new Blob([csvConteudo], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  
  // Configurar o link de download
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `${nomeArquivo || 'exportacao'}.csv`);
  
  // Adicionar ao documento, clicar e remover
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

/**
 * Exporta dados para formato JSON
 * 
 * @param {Array|Object} dados Dados a serem exportados
 * @param {String} nomeArquivo Nome do arquivo de exportação
 * @returns {void}
 */
export const exportarParaJSON = (dados, nomeArquivo) => {
  if (!dados) return;
  
  // Criar blob e link para download
  const jsonString = JSON.stringify(dados, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json' });
  const link = document.createElement('a');
  
  // Configurar o link de download
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `${nomeArquivo || 'exportacao'}.json`);
  
  // Adicionar ao documento, clicar e remover
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

/**
 * Exporta múltiplos processos para um formato especificado
 * 
 * @param {Array} processos Array de objetos de processo
 * @param {Array} campos Array de definições de campos a serem exportados
 * @param {String} formato Formato de exportação: 'csv' ou 'json'
 * @param {String} nomeArquivo Nome do arquivo de exportação
 */
export const exportarProcessos = (processos, campos, formato = 'csv', nomeArquivo = 'processos') => {
  if (!processos || !processos.length || !campos) return;
  
  // Converter processos para o formato de exportação
  const dadosExportacao = processos.map(processo => 
    processoParaDadosExportacao(processo, campos)
  );
  
  // Exportar no formato solicitado
  if (formato === 'csv') {
    exportarParaCSV(dadosExportacao, nomeArquivo);
  } else if (formato === 'json') {
    exportarParaJSON(dadosExportacao, nomeArquivo);
  }
};

export default {
  processoParaDadosExportacao,
  exportarParaCSV,
  exportarParaJSON,
  exportarProcessos
}; 