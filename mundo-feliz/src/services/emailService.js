/**
 * Serviço cliente para envio de emails através da API
 */

import { logger } from './LoggerService.js';
import { JSDOM } from 'jsdom';

/**
 * Processa o HTML do email para garantir formatação correta
 * @param {string} html - HTML original do email
 * @returns {string} - HTML processado com estilos corretos
 */
function processarHTMLParaEmail(html) {
  // Remover qualquer DOCTYPE, <html>, <head> existentes no conteúdo
  // para evitar documentos HTML aninhados
  let conteudoLimpo = html;
  
  // Remove doctype, html, head e body existentes no conteúdo original
  conteudoLimpo = conteudoLimpo.replace(/<!DOCTYPE[^>]*>/i, '')
    .replace(/<html[^>]*>|<\/html>/gi, '')
    .replace(/<head>[\s\S]*?<\/head>/gi, '')
    .replace(/<body[^>]*>|<\/body>/gi, '');
  
  // Criar um DOM temporário para manipular o HTML limpo
  const dom = new JSDOM(conteudoLimpo);
  const document = dom.window.document;
  const tempDiv = document.body;
  
  // Processar parágrafos fora de tabelas
  const paragrafos = tempDiv.querySelectorAll('p');
  paragrafos.forEach(p => {
    if (!p.closest('table')) {
      p.setAttribute('style', 
        'width: auto !important; ' +
        'max-width: none !important; ' +
        'display: block !important; ' +
        'word-wrap: break-word !important; ' +
        'white-space: normal !important; ' +
        'font-family: Arial, sans-serif !important; ' +
        'font-size: 14px !important; ' +
        'line-height: 1.5 !important; ' +
        'color: #000000 !important; ' +
        'margin: 0 0 10px 0 !important; ' +
        'padding: 0 !important; ' +
        'text-align: left !important;'
      );
    }
  });
  
  // Processar divs que não estão em tabelas
  const divs = tempDiv.querySelectorAll('div');
  divs.forEach(div => {
    if (!div.closest('table') && !div.querySelector('table')) {
      const estiloAtual = div.getAttribute('style') || '';
      div.setAttribute('style', estiloAtual + 
        '; width: auto !important; ' +
        'max-width: none !important; ' +
        'display: block !important; ' +
        'word-wrap: break-word !important; ' +
        'white-space: normal !important; ' +
        'font-family: Arial, sans-serif !important; ' +
        'font-size: 14px !important; ' +
        'line-height: 1.5 !important; ' +
        'color: #000000 !important; ' +
        'margin: 0 !important; ' +
        'padding: 0 !important; ' +
        'text-align: left !important;'
      );
    }
  });
  
  // Agora construa o documento HTML completo sem aninhamento
  const htmlCompleto = `
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Email</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; font-size: 14px; line-height: 1.5; color: #000000; background-color: #ffffff;">
  <div style="width: 100% !important; max-width: none !important; margin: 0 auto;">
    ${tempDiv.innerHTML}
  </div>
</body>
</html>`;

  return htmlCompleto;
}

/**
 * Envia um email utilizando a API
 * @param {Object} emailData - Dados do email
 * @param {string} emailData.to - Destinatário
 * @param {string} emailData.subject - Assunto
 * @param {string} emailData.html - Conteúdo HTML do email
 * @param {string} [emailData.cc] - Cópia para (opcional)
 * @param {string} [emailData.bcc] - Cópia oculta (opcional)
 * @returns {Promise} - Promessa resolvida com o resultado do envio
 */
export const enviarEmail = async (emailData) => {
  try {
    const { to, subject, html, cc, bcc } = emailData;
    
    logger.info(`Preparando para enviar email para: ${to}, assunto: ${subject}`);
    
    // Processar o HTML antes de enviar
    const htmlProcessado = processarHTMLParaEmail(html);
    
    // Enviar via API do servidor
    const response = await fetch('/api/email/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        to, 
        subject, 
        html: htmlProcessado,
        cc,
        bcc
      })
    });
    
    if (!response.ok) {
      throw new Error(`Erro ao enviar email: ${response.status}`);
    }
    
    const resultado = await response.json();
    logger.info(`Email enviado com sucesso: ${resultado.messageId || 'ID não disponível'}`);
    
    return resultado;
  } catch (error) {
    logger.error(`Erro ao enviar email: ${error.message}`);
    
    return {
      success: false,
      error: error.message,
      message: 'Falha ao enviar email'
    };
  }
};

// Exportar a função enviarEmail diretamente
export default { enviarEmail }; 