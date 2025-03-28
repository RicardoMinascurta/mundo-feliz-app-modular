/**
 * Serviço de Email do Servidor
 * Responsável por enviar emails usando nodemailer
 */

import nodemailer from 'nodemailer';
import { logger } from '../LoggerService.js';
import * as dotenv from 'dotenv';

// Garantir que o dotenv seja carregado
dotenv.config();

// Log para debug
console.log('EmailService - Variáveis de ambiente:', {
  EMAIL_HOST: process.env.EMAIL_HOST,
  EMAIL_PORT: process.env.EMAIL_PORT,
  EMAIL_USER: process.env.EMAIL_USER,
  EMAIL_FROM: process.env.EMAIL_FROM,
  EMAIL_PASS_SET: !!process.env.EMAIL_PASS
});

// Configurações do serviço de email
const EMAIL_CONFIG = {
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.EMAIL_PORT || '587', 10),
  secure: process.env.EMAIL_SECURE === 'true',
  auth: {
    user: process.env.EMAIL_USER || '',
    // Senha sem espaços - senhas de aplicação do Google não devem ter espaços
    pass: process.env.EMAIL_PASS ? process.env.EMAIL_PASS.replace(/\s+/g, '') : ''
  }
};

// Log para diagnóstico com detalhes limitados da senha
console.log('Configuração Email Final:', {
  host: EMAIL_CONFIG.host,
  port: EMAIL_CONFIG.port,
  secure: EMAIL_CONFIG.secure,
  user: EMAIL_CONFIG.auth.user,
  hasPassword: !!EMAIL_CONFIG.auth.pass,
  passDetails: EMAIL_CONFIG.auth.pass ? 
    `Primeiros 4 caracteres: ${EMAIL_CONFIG.auth.pass.substring(0, 4)}..., Tamanho: ${EMAIL_CONFIG.auth.pass.length}` : 
    'Senha não definida'
});

// Testar conexão com o servidor SMTP
async function testSmtpConnection() {
  try {
    const transporter = nodemailer.createTransport(EMAIL_CONFIG);
    const verification = await transporter.verify();
    console.log('Conexão SMTP verificada com sucesso:', verification);
    return true;
  } catch (error) {
    console.error('Erro ao verificar conexão SMTP:', error.message);
    return false;
  }
}

// Testar a conexão SMTP quando o serviço iniciar
testSmtpConnection();

// Criar o transporter do nodemailer
const createTransporter = () => {
  try {
    logger.info(`Criando transporter de email com host ${EMAIL_CONFIG.host}:${EMAIL_CONFIG.port}`);
    return nodemailer.createTransport(EMAIL_CONFIG);
  } catch (error) {
    logger.error(`Erro ao criar transporter de email: ${error.message}`);
    throw new Error(`Falha ao criar transporter de email: ${error.message}`);
  }
};

/**
 * Envia um email usando nodemailer
 * @param {Object} emailData - Dados do email
 * @param {string} emailData.to - Destinatário
 * @param {string} emailData.subject - Assunto
 * @param {string} emailData.html - Conteúdo HTML do email
 * @param {string} [emailData.cc] - Cópia para (opcional)
 * @param {string} [emailData.bcc] - Cópia oculta (opcional)
 * @param {Array} [emailData.attachments] - Anexos do email (opcional)
 * @returns {Promise<Object>} - Resultado do envio
 */
export const enviarEmail = async (emailData) => {
  const { to, subject, html, cc, bcc, attachments } = emailData;
  
  try {
    logger.info(`Iniciando envio de email para: ${to}, assunto: ${subject}, anexos: ${attachments?.length || 0}`);
    
    if (!to || !subject || !html) {
      logger.error('Dados de email incompletos');
      return { 
        success: false, 
        message: 'Os campos "to", "subject" e "html" são obrigatórios' 
      };
    }
    
    // Verificar configurações
    if (!EMAIL_CONFIG.auth.user || !EMAIL_CONFIG.auth.pass) {
      const errorMsg = 'Credenciais de email não configuradas';
      logger.error(errorMsg);
      console.error('⚠️ EMAIL_USER ou EMAIL_PASS não configurados. Verifique o arquivo .env');
      return {
        success: false,
        error: errorMsg,
        message: 'Configuração de email incompleta no servidor'
      };
    }

    // Processar o HTML do e-mail para garantir formatação correta nas tabelas
    let processedHtml = html;
    
    // Garantir largura fixa nas tabelas do e-mail (processar apenas se necessário)
    if (html.includes('<table') && (html.includes('width="100%"') || html.includes('width: 100%'))) {
      console.log('Processando tabela do e-mail para corrigir largura...');
      
      // Usar expressões regulares para substituir a largura das tabelas
      // 1. Substituir larguras de tabela 100% por 480px
      processedHtml = processedHtml.replace(/<table[^>]*?width\s*=\s*["']100%["'][^>]*?>/gi, function(match) {
        return match.replace(/width\s*=\s*["']100%["']/gi, 'width="480"');
      });
      
      processedHtml = processedHtml.replace(/<table[^>]*?style\s*=\s*["'][^"']*?width\s*:\s*100%[^"']*?["'][^>]*?>/gi, function(match) {
        return match.replace(/width\s*:\s*100%/gi, 'width: 480px');
      });
      
      // 2. Substituir larguras de células de 30% por 160px
      processedHtml = processedHtml.replace(/<td[^>]*?width\s*=\s*["']30%["'][^>]*?>/gi, function(match) {
        return match.replace(/width\s*=\s*["']30%["']/gi, 'width="160"');
      });
      
      processedHtml = processedHtml.replace(/<td[^>]*?style\s*=\s*["'][^"']*?width\s*:\s*30%[^"']*?["'][^>]*?>/gi, function(match) {
        return match.replace(/width\s*:\s*30%/gi, 'width: 160px');
      });
      
      // 3. Substituir larguras de células de 70% por 320px
      processedHtml = processedHtml.replace(/<td[^>]*?width\s*=\s*["']70%["'][^>]*?>/gi, function(match) {
        return match.replace(/width\s*=\s*["']70%["']/gi, 'width="320"');
      });
      
      processedHtml = processedHtml.replace(/<td[^>]*?style\s*=\s*["'][^"']*?width\s*:\s*70%[^"']*?["'][^>]*?>/gi, function(match) {
        return match.replace(/width\s*:\s*70%/gi, 'width: 320px');
      });
      
      // 4. Garantir que as tabelas não têm margin: auto
      processedHtml = processedHtml.replace(/margin\s*:\s*0\s+auto/gi, 'margin: 0');
      
      // 5. Remover atributos float que poderiam afetar o layout
      processedHtml = processedHtml.replace(/float\s*:\s*left/gi, '');
      
      console.log('Tabelas processadas com sucesso!');
    } else {
      console.log('Nenhuma tabela para processar no e-mail.');
    }
    
    // Usar o transporter existente ou criar um novo
    const transporter = nodemailer.createTransport({
      host: EMAIL_CONFIG.host,
      port: EMAIL_CONFIG.port,
      secure: EMAIL_CONFIG.secure,
      auth: {
        user: EMAIL_CONFIG.auth.user,
        pass: EMAIL_CONFIG.auth.pass
      },
      // Adicionar isso para logs detalhados, apenas em desenvolvimento
      debug: true,
      logger: true
    });
    
    console.log('Transporter criado, enviando email para:', to);
    
    // Verificar se há anexos
    if (attachments && attachments.length > 0) {
      logger.info(`Anexando ${attachments.length} arquivos ao email`);
      console.log('Anexos para o email:', attachments.map(a => ({ 
        filename: a.filename,
        path: a.path ? a.path.substring(0, 50) + '...' : 'buffer',
        contentType: a.contentType
      })));
    }
    
    // Configurar opções do email
    const mailOptions = {
      from: process.env.EMAIL_FROM || EMAIL_CONFIG.auth.user,
      to,
      subject,
      html: processedHtml, // Usando o HTML processado
      cc,
      bcc,
      attachments // Incluir anexos se existirem
    };
    
    // Enviar o email
    console.log('Iniciando envio do email...');
    const info = await transporter.sendMail(mailOptions);
    console.log('Email enviado com sucesso, resposta:', info);
    
    logger.info(`Email enviado com sucesso: ${info.messageId}`);
    
    return {
      success: true,
      messageId: info.messageId,
      message: 'Email enviado com sucesso'
    };
  } catch (error) {
    console.error('Erro detalhado ao enviar email:', error);
    logger.error(`Erro ao enviar email: ${error.message}`);
    return {
      success: false,
      error: error.message,
      stack: error.stack,
      message: 'Falha ao enviar email'
    };
  }
};

// Exportar o serviço
export default { enviarEmail }; 