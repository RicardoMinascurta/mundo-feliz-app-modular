import React, { useState, useEffect, useRef } from 'react';
import { Box, Typography, Button, Paper, TextField, FormControlLabel, Switch, Snackbar, Alert, CircularProgress, Grid } from '@mui/material';
import EditorSimples from '../emails/EditorSimples';
import { emailTemplates } from '../../config';

// Obter URL base da API
const API_BASE_URL = window.location.protocol + '//' + window.location.hostname + ':3001';

const TemplateEmail = ({ processo, tipoProcesso, simplified = false, nomePessoa, tipoCPLP }) => {
  const [formData, setFormData] = useState({
    to: '',
    cc: '',
    bcc: '',
    subject: '',
    message: ''
  });
  const [includeAppointment, setIncludeAppointment] = useState(false);
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState({ open: false, message: '', severity: 'info' });
  const [showCcBcc, setShowCcBcc] = useState(false);
  const editorRef = useRef(null);
  
  // Atualizar a mensagem e os dados do e-mail quando o processo mudar
  useEffect(() => {
    if (processo) {
      // Determinar o tipo de processo para encontrar o template correto
      const processType = tipoProcesso || (processo.processId ? processo.processId.split('-')[0] : 'default');
      
      console.log('Process Type:', processType); // Debug log
      
      // Obter o template específico ou usar o padrão
      let template = emailTemplates.default;
      
      if (processType === 'CPLPMaiores' && tipoCPLP) {
        // Mapear o valor do dropdown para o template correto
        switch (tipoCPLP) {
          case 'desbloqueio':
            template = emailTemplates.CPLPDesbloqueio;
            break;
          case 'analise':
            template = emailTemplates.CPLPAnalise;
            break;
          default:
            template = emailTemplates.default;
        }
      } else if (processType === 'CPLPMenor') {
        template = emailTemplates.CPLPMenor;
      } else {
        template = emailTemplates[processType] || emailTemplates.default;
      }
      
      console.log('Selected Template:', processType, tipoCPLP, template);
      
      // Aplicar o destinatário do template
      let emailDestinatario = '';
      if (template.destinatario) {
        emailDestinatario = template.destinatario;
      } else if (template.defaultRecipient) {
        emailDestinatario = template.defaultRecipient;
      }
      
      setFormData(prev => ({
        ...prev,
        to: emailDestinatario
      }));
      
      // Aplicar o assunto do template
      let assunto = '';
      if (template.gerarAssunto) {
        assunto = template.gerarAssunto(processo);
      } else if (template.generateSubject) {
        assunto = template.generateSubject(processo.campos || {});
      } else {
        assunto = `${processType} - Pedido`;
      }
      
      setFormData(prev => ({
        ...prev,
        subject: assunto
      }));
      
      // Se temos um editor de referência, aplicar o conteúdo HTML do template
      if (editorRef.current) {
        const conteudoHtml = template.gerarCorpoEmail(processo);
        editorRef.current.innerHTML = conteudoHtml;
      }
    }
  }, [processo, tipoProcesso, tipoCPLP, nomePessoa]);
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleSwitchChange = () => {
    setIncludeAppointment(!includeAppointment);
  };
  
  const handleSubmit = async () => {
    setLoading(true);
    
    try {
      // Obter o conteúdo HTML do editor (que inclui a tabela do email)
      const editorContent = editorRef.current.innerHTML;
      
      // Encapsular o HTML com um documento completo para garantir que a tabela e o texto sejam exibidos corretamente
      // Isso ajuda a manter as cores e alinhamentos em qualquer cliente de email
      const completeHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${formData.subject}</title>
  <style>
    body { font-family: Arial, sans-serif; color: #000000; background-color: #ffffff; }
    table { border-collapse: collapse; width: 440px; max-width: 440px; margin: 0; }
    td { border: 1px solid #000000; padding: 7px; color: #000000 !important; height: 95%; }
    p { margin: 0; padding: 0; color: #000000 !important; }
    .value-cell { text-align: left; color: #000000 !important; }
    .header-cell { background-color: #d4e5f7; color: #000000 !important; font-weight: bold; }
  </style>
</head>
<body>
  <div style="max-width: 640px; margin: 0; font-family: Arial, sans-serif; color: #000000;">
    ${editorContent}
  </div>
</body>
</html>
      `;
      
      // Preparar os dados para enviar
      const emailData = {
        to: formData.to,
        cc: formData.cc,
        bcc: formData.bcc,
        subject: formData.subject,
        html: completeHtml
      };
      
      // Enviar o email usando o serviço de email
      const response = await fetch(`${API_BASE_URL}/api/email/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(emailData),
      });
      
      const result = await response.json();
      
      if (response.ok) {
        setNotification({
          open: true,
          message: 'Email enviado com sucesso!',
          severity: 'success'
        });
      } else {
        setNotification({
          open: true,
          message: `Erro ao enviar email: ${result.error}`,
          severity: 'error'
        });
      }
    } catch (error) {
      console.error('Erro ao enviar email:', error);
      setNotification({
        open: true,
        message: `Erro ao enviar email: ${error.message}`,
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };
  
  const handleCloseNotification = () => {
    setNotification(prev => ({ ...prev, open: false }));
  };
  
  const toggleCcBcc = () => {
    setShowCcBcc(!showCcBcc);
  };
  
  // Renderizar versão simplificada do email para a visualização de detalhes
  const renderSimplifiedEmail = () => {
    return (
      <Box className="simplified-email-form" sx={{ width: '100%' }}>
        <Box className="email-field" mb={2} sx={{ width: '100%' }}>
          <Typography variant="body2" className="field-label">Para</Typography>
          <TextField
            fullWidth
            variant="outlined"
            placeholder="destinatario@exemplo.com"
            size="small"
            name="to"
            value={formData.to}
            onChange={handleChange}
            className="email-input"
            sx={{ width: '100%' }}
          />
        </Box>
        
        {showCcBcc && (
          <>
            <Box className="email-field" mb={2} sx={{ width: '100%' }}>
              <Typography variant="body2" className="field-label">CC</Typography>
              <TextField
                fullWidth
                variant="outlined"
                placeholder="cc@exemplo.com"
                size="small"
                name="cc"
                value={formData.cc}
                onChange={handleChange}
                className="email-input"
                sx={{ width: '100%' }}
              />
            </Box>
            
            <Box className="email-field" mb={2} sx={{ width: '100%' }}>
              <Typography variant="body2" className="field-label">BCC</Typography>
              <TextField
                fullWidth
                variant="outlined"
                placeholder="bcc@exemplo.com"
                size="small"
                name="bcc"
                value={formData.bcc}
                onChange={handleChange}
                className="email-input"
                sx={{ width: '100%' }}
              />
            </Box>
          </>
        )}
        
        <Box display="flex" justifyContent="flex-end" mb={1}>
          <Button 
            size="small" 
            onClick={toggleCcBcc}
            style={{ textTransform: 'none' }}
          >
            {showCcBcc ? 'Ocultar CC/BCC' : 'Mostrar CC/BCC'}
          </Button>
        </Box>
        
        <Box className="email-field" mb={2} sx={{ width: '100%' }}>
          <Typography variant="body2" className="field-label">Assunto</Typography>
          <TextField
            fullWidth
            variant="outlined"
            placeholder="Assunto do email"
            size="small"
            name="subject"
            value={formData.subject}
            onChange={handleChange}
            className="email-input"
            sx={{ width: '100%' }}
          />
        </Box>
        
        <Box className="email-field" mb={2} sx={{ width: '100%' }}>
          <Typography variant="body2" className="field-label">Mensagem</Typography>
          <EditorSimples ref={editorRef} />
        </Box>
        
        <Box mt={2} display="flex" justifyContent="center" sx={{ width: '100%' }}>
          <Button 
            variant="contained" 
            fullWidth
            onClick={handleSubmit}
            disabled={loading}
            style={{ 
              backgroundColor: '#606F84', 
              color: 'white', 
              textTransform: 'none',
              borderRadius: '4px',
              width: '100%'
            }}
          >
            {loading ? <CircularProgress size={24} color="inherit" /> : 'Enviar E-mail'}
          </Button>
        </Box>
        
        <Snackbar 
          open={notification.open} 
          autoHideDuration={6000} 
          onClose={handleCloseNotification}
          anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        >
          <Alert onClose={handleCloseNotification} severity={notification.severity}>
            {notification.message}
          </Alert>
        </Snackbar>
      </Box>
    );
  };
  
  // O componente tradicional de email (não simplificado)
  const renderTraditionalEmail = () => {
    // Determinar o tipo de processo para encontrar o template correto
    const processType = tipoProcesso || (processo.processId ? processo.processId.split('-')[0] : 'default');
    
    // Obter o template específico ou usar o padrão
    const template = emailTemplates[processType] || emailTemplates.default;
    
    // Gerar o conteúdo HTML do e-mail usando o template
    const emailContent = template.gerarCorpoEmail(processo);
    
    return (
      <Box className="email-template-container">
        <Box className="email-header">
          <Typography variant="subtitle1" className="email-label">
            Modelo de Email para {processType}
          </Typography>
        </Box>
        
        <Paper elevation={0} variant="outlined" className="email-content">
          <div 
            className="email-template-html"
            dangerouslySetInnerHTML={{ __html: emailContent }}
          ></div>
        </Paper>
      </Box>
    );
  };
  
  return simplified ? renderSimplifiedEmail() : renderTraditionalEmail();
};

export default TemplateEmail; 