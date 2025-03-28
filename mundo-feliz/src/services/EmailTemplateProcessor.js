// src/services/EmailTemplateProcessor.js
// Serviço para processar templates de e-mail antes do envio

/**
 * Processa o HTML de um template de e-mail para garantir 
 * larguras fixas nas tabelas para melhor compatibilidade com
 * clientes de e-mail.
 * 
 * @param {string} htmlContent - Conteúdo HTML do e-mail
 * @returns {string} - HTML processado
 */
export const processEmailTemplate = (htmlContent) => {
  if (!htmlContent) return htmlContent;
  
  try {
    // Criar um DOM temporário para manipular o HTML
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlContent, 'text/html');
    
    // Encontrar todas as tabelas no HTML
    const tables = doc.querySelectorAll('table');
    
    tables.forEach(table => {
      // Definir largura fixa da tabela em pixels em vez de percentagem
      if (table.style.width === '100%' || !table.style.width) {
        table.style.width = '480px';
      }
      
      // Adicionar outros atributos importantes
      table.style.borderCollapse = 'collapse';
      
      // Largura fixa para a tabela
      table.setAttribute('width', '480');
      
      // Processar todas as células da tabela
      const cells = table.querySelectorAll('td');
      let firstColCells = [];
      let secondColCells = [];
      
      // Separar células da primeira e segunda coluna
      cells.forEach((cell, index) => {
        if (cell.getAttribute('colspan') === '2') {
          return; // Ignorar células que se estendem por duas colunas
        }
        
        // Alternadamente adicionar células à primeira e segunda coluna
        // assumindo uma tabela com 2 colunas
        if (index % 2 === 0) {
          firstColCells.push(cell);
        } else {
          secondColCells.push(cell);
        }
      });
      
      // Definir larguras fixas para as células
      firstColCells.forEach(cell => {
        cell.style.width = '160px';
        cell.setAttribute('width', '160');
      });
      
      secondColCells.forEach(cell => {
        cell.style.width = '320px';
        cell.setAttribute('width', '320');
      });
    });
    
    // Retornar o HTML modificado
    return doc.documentElement.outerHTML;
  } catch (error) {
    console.error('Erro ao processar template de e-mail:', error);
    return htmlContent; // Retornar o HTML original em caso de erro
  }
};

/**
 * Função que envolve o HTML do e-mail num template XHTML básico
 * para melhor compatibilidade com clientes de e-mail.
 * 
 * @param {string} htmlContent - Conteúdo HTML do corpo do e-mail
 * @returns {string} - E-mail XHTML completo
 */
export const wrapEmailInTemplate = (htmlContent) => {
  return `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Email</title>
  <style>
    body { margin: 0; padding: 0; font-family: Arial, sans-serif; font-size: 14px; line-height: 1.5; color: #000000; background-color: #ffffff; }
    p { width: auto !important; max-width: none !important; display: block !important; word-wrap: break-word !important; white-space: normal !important; 
        font-family: Arial, sans-serif !important; font-size: 14px !important; line-height: 1.5 !important; color: #000000 !important; 
        margin: 0 0 10px 0 !important; padding: 0 !important; text-align: left !important; }
    div { width: auto !important; max-width: none !important; display: block !important; word-wrap: break-word !important; white-space: normal !important;
         font-family: Arial, sans-serif !important; font-size: 14px !important; line-height: 1.5 !important; color: #000000 !important;
         margin: 0 !important; padding: 0 !important; text-align: left !important; }
  </style>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; font-size: 14px; line-height: 1.5; color: #000000; background-color: #ffffff;">
  <div style="width: 100% !important; max-width: none !important; margin: 0;">
    <div style="font-family: Arial, sans-serif; color: #000000; line-height: 1.5;">
      ${htmlContent}
    </div>
  </div>
</body>
</html>`;
};

/**
 * Função principal que processa completamente um e-mail antes do envio.
 * Aplica todas as correções necessárias para garantir compatibilidade.
 * 
 * @param {string} htmlContent - Conteúdo HTML original
 * @returns {string} - HTML final pronto para envio
 */
export const prepareEmailForSending = (htmlContent) => {
  // Primeiro, processar o conteúdo para corrigir tabelas
  const processedContent = processEmailTemplate(htmlContent);
  
  // Verificar se o conteúdo já está dentro de um template HTML completo
  if (processedContent.includes('<!DOCTYPE html') || 
      processedContent.includes('<html') || 
      processedContent.includes('<head')) {
    // Se já estiver num template HTML, apenas retornar o conteúdo processado
    return processedContent;
  }
  
  // Caso contrário, envolver o conteúdo num template adequado
  return wrapEmailInTemplate(processedContent);
};

export default {
  processEmailTemplate,
  wrapEmailInTemplate,
  prepareEmailForSending
}; 