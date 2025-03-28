/**
 * Serviço de Email do Cliente
 * Responsável por processar e enviar emails através da API
 */

import { logger } from '../LoggerService.js';

// URL base da API (configurável)
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

/**
 * Processa o HTML do email para garantir formatação correta
 * @param {string} html - HTML original do email
 * @returns {string} - HTML processado com estilos corretos
 */
const processarHTMLParaEmail = (html) => {
  try {
    // Remover qualquer DOCTYPE, <html>, <head> existentes no conteúdo
    // para evitar documentos HTML aninhados
    let conteudoLimpo = html;
    
    // Remove doctype, html, head e body existentes no conteúdo original
    conteudoLimpo = conteudoLimpo.replace(/<!DOCTYPE[^>]*>/i, '')
      .replace(/<html[^>]*>|<\/html>/gi, '')
      .replace(/<head>[\s\S]*?<\/head>/gi, '')
      .replace(/<body[^>]*>|<\/body>/gi, '');
    
    // Adicionamos nossos próprios estilos sem precisar manipular o DOM
    // já que estamos apenas enviando o HTML para o servidor
    
    // Construa o documento HTML completo sem aninhamento
    const htmlCompleto = `
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
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
  <div style="width: 100% !important; max-width: none !important; margin: 0 auto;">
    ${conteudoLimpo}
  </div>
</body>
</html>`;

    return htmlCompleto;
  } catch (error) {
    logger.error(`Erro ao processar HTML para email: ${error.message}`);
    return html; // Retorna o HTML original em caso de erro
  }
};

/**
 * Envia um email utilizando a API
 * @param {Object} emailData - Dados do email
 * @param {string} emailData.to - Destinatário
 * @param {string} emailData.subject - Assunto
 * @param {string} emailData.html - Conteúdo HTML do email
 * @param {string} [emailData.cc] - Cópia para (opcional)
 * @param {string} [emailData.bcc] - Cópia oculta (opcional)
 * @param {string} [emailData.processId] - ID do processo para anexar PDF preenchido (opcional)
 * @param {string} [emailData.pdfFilePath] - Caminho do PDF salvo (opcional)
 * @returns {Promise<Object>} - Promessa resolvida com o resultado do envio
 */
export const enviarEmail = async (emailData) => {
  try {
    const { to, subject, html, cc, bcc, processId, pdfFilePath } = emailData;
    
    logger.info(`Preparando para enviar email para: ${to}, assunto: ${subject}`);
    
    // Validar campos obrigatórios
    if (!to || !subject || !html) {
      throw new Error('Os campos "to", "subject" e "html" são obrigatórios');
    }
    
    // Processar o HTML antes de enviar
    const htmlProcessado = processarHTMLParaEmail(html);
    
    // Verificar se temos informação sobre o PDF preenchido
    const hasPdfAttachment = window.currentProcessedPdfInfo || 
                          (processId && window.localStorage.getItem(`pdf_preenchido_${processId}`));
    
    console.log(`Enviando email... Processo: ${processId || 'N/A'}, PDF preenchido: ${hasPdfAttachment ? 'SIM' : 'NÃO'}, Caminho do PDF: ${pdfFilePath || 'N/A'}`);
    
    // Enviar via API do servidor
    const response = await fetch(`${API_BASE_URL}/api/email/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        to, 
        subject, 
        html: htmlProcessado,
        cc,
        bcc,
        processId,
        pdfFilePath
      })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || `Erro ${response.status} ao enviar email`);
    }
    
    const resultado = await response.json();
    logger.info(`Email enviado com sucesso: ${resultado.messageId || 'ID não disponível'}`);
    
    return {
      ...resultado,
      success: true
    };
  } catch (error) {
    logger.error(`Erro ao enviar email: ${error.message}`);
    
    return {
      success: false,
      error: error.message,
      message: 'Falha ao enviar email'
    };
  }
};

// Exportar as funções
export default { enviarEmail }; 