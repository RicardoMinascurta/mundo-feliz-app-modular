import nodemailer from 'nodemailer';

// Configuração do transportador de email
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'geral.mundofeliz@gmail.com',
    pass: 'jrzq afsc jycc pqld' // Senha de aplicação do Gmail
  }
});

/**
 * Envia um email com o conteúdo especificado
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
    
    const mailOptions = {
      from: 'Associação Mundo Feliz <geral.mundofeliz@gmail.com>',
      to,
      subject,
      html,
    };
    
    // Adicionar cc e bcc se fornecidos
    if (cc) mailOptions.cc = cc;
    if (bcc) mailOptions.bcc = bcc;
    
    // Enviar o email
    const info = await transporter.sendMail(mailOptions);
    console.log('Email enviado com sucesso:', info.messageId);
    
    return {
      success: true,
      messageId: info.messageId,
      message: 'Email enviado com sucesso'
    };
  } catch (error) {
    console.error('Erro ao enviar email:', error);
    
    return {
      success: false,
      error: error.message,
      message: 'Falha ao enviar email'
    };
  }
};

export default {
  enviarEmail
}; 