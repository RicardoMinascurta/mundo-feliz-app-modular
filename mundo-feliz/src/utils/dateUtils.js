/**
 * Funções utilitárias para manipulação de datas
 */

/**
 * Formata uma data para o formato DD/MM/YYYY
 * 
 * @param {Date|String} data Data a ser formatada
 * @param {String} formato Formato desejado (padrão: DD/MM/YYYY)
 * @returns {String} Data formatada
 */
export const formatDate = (data, formato = 'DD/MM/YYYY') => {
  if (!data) return '';
  
  try {
    const date = data instanceof Date ? data : new Date(data);
    
    // Verificar se a data é válida
    if (isNaN(date.getTime())) {
      return '';
    }
    
    const dia = date.getDate().toString().padStart(2, '0');
    const mes = (date.getMonth() + 1).toString().padStart(2, '0');
    const ano = date.getFullYear();
    const horas = date.getHours().toString().padStart(2, '0');
    const minutos = date.getMinutes().toString().padStart(2, '0');
    
    switch (formato) {
      case 'DD/MM/YYYY':
        return `${dia}/${mes}/${ano}`;
      case 'YYYY-MM-DD':
        return `${ano}-${mes}-${dia}`;
      case 'DD/MM/YYYY HH:mm':
        return `${dia}/${mes}/${ano} ${horas}:${minutos}`;
      case 'HH:mm DD/MM/YYYY':
        return `${horas}:${minutos} ${dia}/${mes}/${ano}`;
      default:
        return `${dia}/${mes}/${ano}`;
    }
  } catch (error) {
    console.error('Erro ao formatar data:', error);
    return '';
  }
};

/**
 * Converte uma string de data no formato DD/MM/YYYY para um objeto Date
 * 
 * @param {String} dataString String de data no formato DD/MM/YYYY
 * @returns {Date} Objeto Date
 */
export const parseDate = (dataString) => {
  if (!dataString) return null;
  
  try {
    // Se já for um objeto Date, retorna diretamente
    if (dataString instanceof Date) return dataString;
    
    // Verifica se é uma string de data no formato ISO (YYYY-MM-DD)
    if (dataString.includes('-') && dataString.length === 10) {
      return new Date(dataString);
    }
    
    // Assumindo formato DD/MM/YYYY
    const [dia, mes, ano] = dataString.split('/');
    
    if (!dia || !mes || !ano) return null;
    
    return new Date(ano, parseInt(mes) - 1, dia);
  } catch (error) {
    console.error('Erro ao converter string de data:', error);
    return null;
  }
};

/**
 * Calcula a diferença em dias entre duas datas
 * 
 * @param {Date|String} dataInicial Data inicial
 * @param {Date|String} dataFinal Data final (se não fornecida, usa a data atual)
 * @returns {Number} Diferença em dias
 */
export const calcularDiferencaDias = (dataInicial, dataFinal = new Date()) => {
  if (!dataInicial) return null;
  
  try {
    const data1 = dataInicial instanceof Date ? dataInicial : parseDate(dataInicial);
    const data2 = dataFinal instanceof Date ? dataFinal : parseDate(dataFinal);
    
    if (!data1 || !data2) return null;
    
    // Resetar horas para comparar apenas as datas
    const d1 = new Date(data1.getFullYear(), data1.getMonth(), data1.getDate());
    const d2 = new Date(data2.getFullYear(), data2.getMonth(), data2.getDate());
    
    // Calcular a diferença em milissegundos e converter para dias
    const diffMs = d2 - d1;
    return Math.floor(diffMs / (1000 * 60 * 60 * 24));
  } catch (error) {
    console.error('Erro ao calcular diferença de dias:', error);
    return null;
  }
};

export default {
  formatDate,
  parseDate,
  calcularDiferencaDias
}; 