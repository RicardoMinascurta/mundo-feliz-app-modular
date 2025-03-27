import React, { useState, useEffect, useRef } from 'react';
import { 
  Box, 
  Button, 
  TextField, 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions,
  Typography,
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Alert,
  CircularProgress,
  Paper
} from '@mui/material';
import { Send, AccessTime, CalendarMonth } from '@mui/icons-material';
import { processTemplate, extrairTipoProcesso } from '../../utils/processUtils';
import { formatDate } from '../../utils/dateUtils';
import EditorSimples from './EditorSimples';

// Simulação da função de envio de email (num cenário real, seria uma chamada à API)
const enviarEmailAPI = (destinatario, assunto, corpo) => {
  return new Promise((resolve, reject) => {
    // Simular atraso na resposta da API
    setTimeout(() => {
      // Simular 90% de sucesso e 10% de falha
      if (Math.random() > 0.1) {
        resolve({
          success: true,
          message: 'Email enviado com sucesso para ' + destinatario
        });
      } else {
        reject({
          success: false,
          message: 'Erro ao enviar email para ' + destinatario
        });
      }
    }, 1000);
  });
};

const EnviarEmail = ({ open, onClose, processo, modelos }) => {
  const [assunto, setAssunto] = useState('');
  const [corpo, setCorpo] = useState('');
  const [modeloSelecionado, setModeloSelecionado] = useState('');
  const [destinatario, setDestinatario] = useState('');
  const [cc, setCc] = useState('');
  const [status, setStatus] = useState({ tipo: '', mensagem: '' });
  const [enviando, setEnviando] = useState(false);
  const [dataAgendamento, setDataAgendamento] = useState('');
  const [horaAgendamento, setHoraAgendamento] = useState('');
  const [localAgendamento, setLocalAgendamento] = useState('Centro de Atendimento - Lisboa');
  const [tipoCPLP, setTipoCPLP] = useState('desbloqueio');
  
  const editorRef = useRef(null);
  
  // Determinar o tipo de processo e carregar modelo apropriado
  useEffect(() => {
    if (processo && modelos) {
      // Obter o tipo de processo e selecionar modelo adequado
      const tipoProcesso = extrairTipoProcesso(processo.processId);
      
      // Definir o modelo inicial baseado no tipo de processo
      if (tipoProcesso && modelos[tipoProcesso]) {
        setModeloSelecionado(tipoProcesso);
        setAssunto(modelos[tipoProcesso].assunto || '');
        
        // Processar template e substituir placeholders como [INSERIR DATA]
        let corpoProcessado = processTemplate(modelos[tipoProcesso].corpo, processo);
        setCorpo(corpoProcessado);
      } else if (modelos.default) {
        setModeloSelecionado('default');
        setAssunto(modelos.default.assunto || '');
        
        // Processar template e substituir placeholders como [INSERIR DATA]
        let corpoProcessado = processTemplate(modelos.default.corpo, processo);
        setCorpo(corpoProcessado);
      }
      
      // Obter email do cliente do processo (simulado aqui, num caso real viria do objeto processo)
      // Verificar nomeCompleto para escolher o destinatário
      if (processo.campos) {
        if (processo.campos.email) {
          setDestinatario(processo.campos.email);
        } else if (processo.campos.pessoaReagrupada && processo.campos.pessoaReagrupada.email) {
          setDestinatario(processo.campos.pessoaReagrupada.email);
        } else if (processo.campos.pessoaQueRegrupa && processo.campos.pessoaQueRegrupa.email) {
          setDestinatario(processo.campos.pessoaQueRegrupa.email);
        } else {
          // Email fictício para demonstração
          const nomeCliente = processo.campos.nomeCompleto || 
                             (processo.campos.pessoaReagrupada && processo.campos.pessoaReagrupada.nomeCompleto) ||
                             (processo.campos.pessoaQueRegrupa && processo.campos.pessoaQueRegrupa.nomeCompleto) ||
                             'cliente';
          
          // Criar um email baseado no nome (apenas para demonstração)
          const emailSimulado = nomeCliente
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/\s+/g, '.')
            .replace(/[^a-z0-9\.]/g, '') + '@email.com';
          
          setDestinatario(emailSimulado);
        }
      }
    }
  }, [processo, modelos]);
  
  // Atualizar corpo do email quando mudar data, hora ou local
  useEffect(() => {
    if (corpo) {
      let novoCorpo = corpo;
      
      if (dataAgendamento) {
        novoCorpo = novoCorpo.replace('[INSERIR DATA]', dataAgendamento);
      }
      
      if (horaAgendamento) {
        novoCorpo = novoCorpo.replace('[INSERIR HORA]', horaAgendamento);
      }
      
      if (localAgendamento) {
        novoCorpo = novoCorpo.replace('[INSERIR ENDEREÇO]', localAgendamento);
      }
      
      setCorpo(novoCorpo);
    }
  }, [dataAgendamento, horaAgendamento, localAgendamento]);
  
  // Atualizar conteúdo do email quando o tipo de CPLP for alterado
  useEffect(() => {
    if (processo?.processId?.includes('CPLPMaiores')) {
      // Aqui vamos atualizar o conteúdo do email baseado no tipo de CPLP selecionado
      let novoCorpo = '';
      let novoAssunto = '';

      switch (tipoCPLP) {
        case 'desbloqueio':
          novoAssunto = 'CPLP - Desbloqueio';
          novoCorpo = 'Conteúdo para CPLP Desbloqueio';
          break;
        case 'presencial':
          novoAssunto = 'CPLP - Presencial';
          novoCorpo = 'Conteúdo para CPLP Presencial';
          break;
        case 'agendamento':
          novoAssunto = 'CPLP - Agendamento';
          novoCorpo = 'Conteúdo para CPLP Agendamento';
          break;
        default:
          novoAssunto = 'CPLP';
          novoCorpo = 'Conteúdo padrão CPLP';
      }

      setAssunto(novoAssunto);
      setCorpo(novoCorpo);
    }
  }, [tipoCPLP, processo?.processId]);
  
  const handleMudarModelo = (event) => {
    const novoModelo = event.target.value;
    setModeloSelecionado(novoModelo);
    
    if (modelos[novoModelo]) {
      setAssunto(modelos[novoModelo].assunto || '');
      
      // Processar template com dados do processo
      let corpoProcessado = processTemplate(modelos[novoModelo].corpo, processo);
      setCorpo(corpoProcessado);
    }
  };
  
  const handleEnviarEmail = async () => {
    // Validações básicas
    if (!destinatario || !assunto) {
      setStatus({
        tipo: 'error',
        mensagem: 'Por favor, preencha todos os campos obrigatórios.'
      });
      return;
    }
    
    if (!destinatario.includes('@') || !destinatario.includes('.')) {
      setStatus({
        tipo: 'error',
        mensagem: 'Por favor, informe um endereço de email válido.'
      });
      return;
    }

    try {
      setEnviando(true);

      // Salvar o PDF atual em uma pasta temporária
      const pdfBlob = await window.currentProcessedPdfBlob; // Obtém o blob do PDF atual
      if (pdfBlob) {
        const formData = new FormData();
        formData.append('pdf', pdfBlob, 'renda.pdf');
        
        const response = await fetch('/api/save-temp-pdf', {
          method: 'POST',
          body: formData
        });

        if (!response.ok) {
          throw new Error('Falha ao salvar o PDF temporário');
        }

        const result = await response.json();
        console.log('PDF guardado em:', result.path);
      }
      
      // Obter o conteúdo HTML do editor
      let conteudoHtml = editorRef.current ? editorRef.current.innerHTML : corpo;
      
      // Função melhorada para processar HTML para e-mail
      function processarHTMLParaEmail(html) {
        // Criar um DOM temporário para manipular o HTML
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = html;
        
        // 1. Processar parágrafos de texto normal
        const paragrafos = tempDiv.querySelectorAll('p');
        paragrafos.forEach(p => {
          // Verificar se está dentro de tabela ou lista (nesses casos preservar formato)
          if (p.closest('table') || p.closest('ul') || p.closest('ol')) {
            return;
          }
          
          // Verificar se é um parágrafo de dados de contato (por padrões específicos)
          const texto = p.textContent.trim();
          const padroesDadosContato = [
            /nome.*:|nacionalidade.*:|nac.*:|data.*nasc.*:|nif.*:|contac.*:|passaporte.*:|visto.*:|telefone.*:|tlf.*:|processo.*:/i,
            /tr.*:|cr.*:|area.*residencia.*:|e-mail.*:|posto.*atendimento.*:/i
          ];
          
          const ehDadosContato = padroesDadosContato.some(padrao => padrao.test(texto));
          
          if (ehDadosContato) {
            // Para dados de contato, preservar quebras mas com estilos robustos
            p.setAttribute('style', 
              'white-space: pre-line !important; ' +
              'font-family: Arial, sans-serif !important; ' +
              'font-size: 14px !important; ' +
              'line-height: 1.4 !important; ' +
              'color: #000000 !important; ' +
              'margin: 0 0 10px 0 !important; ' +
              'padding: 0 !important; ' +
              'word-wrap: break-word !important;'
            );
          } else {
            // Para texto normal, remover quebras de linha e aplicar estilos
            const brs = p.querySelectorAll('br');
            brs.forEach(br => {
              br.parentNode.replaceChild(document.createTextNode(' '), br);
            });
            
            // Aplicar estilos explícitos e forçados com !important para sobrescrever
            // qualquer estilo dos clientes de email
            p.setAttribute('style', 
              'white-space: normal !important; ' +
              'word-wrap: break-word !important; ' +
              'font-family: Arial, sans-serif !important; ' +
              'font-size: 14px !important; ' +
              'line-height: 1.5 !important; ' +
              'color: #000000 !important; ' +
              'margin: 0 0 10px 0 !important; ' +
              'padding: 0 !important; ' +
              'text-align: left !important; ' +
              'max-width: none !important; ' +
              'width: auto !important; ' +
              'display: block !important;'
            );
          }
        });
        
        // 2. Processar divs que contêm texto diretamente
        const divTexto = tempDiv.querySelectorAll('div');
        divTexto.forEach(div => {
          // Ignorar divs que contêm elementos estruturais
          if (div.querySelector('p, table, ul, ol')) {
            return;
          }
          
          const texto = div.textContent.trim();
          const padroesDadosContato = [
            /nome.*:|nacionalidade.*:|nac.*:|data.*nasc.*:|nif.*:|contac.*:|passaporte.*:|visto.*:|telefone.*:|tlf.*:|processo.*:/i,
            /tr.*:|cr.*:|area.*residencia.*:|e-mail.*:|posto.*atendimento.*:/i
          ];
          
          const ehDadosContato = padroesDadosContato.some(padrao => padrao.test(texto));
          
          if (!ehDadosContato) {
            // Remover quebras de linha
            const brs = div.querySelectorAll('br');
            brs.forEach(br => {
              br.parentNode.replaceChild(document.createTextNode(' '), br);
            });
            
            // Aplicar estilos forçados
            const estiloAtual = div.getAttribute('style') || '';
            div.setAttribute('style', estiloAtual + 
              'white-space: normal !important; ' +
              'word-wrap: break-word !important; ' +
              'font-family: Arial, sans-serif !important; ' +
              'font-size: 14px !important; ' +
              'line-height: 1.5 !important; ' +
              'margin-bottom: 10px !important; ' +
              'text-align: left !important;'
            );
          }
        });
        
        // 3. Construir HTML completo com DOCTYPE e meta tags necessárias
        const htmlCompleto = `
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Email</title>
  <style type="text/css">
    /* Estilos base */
    body, html { 
      margin: 0; 
      padding: 0; 
      font-family: Arial, Helvetica, sans-serif; 
      font-size: 14px;
      line-height: 1.5;
      color: #000000;
      background-color: #ffffff;
    }
    
    /* Reset para elementos comuns */
    img { border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none; }
    table { border-collapse: collapse !important; }
    body { height: 100% !important; margin: 0 !important; padding: 0 !important; width: 100% !important; }
    
    /* Estilo crítico: garantir que o texto flua adequadamente */
    p, div, span { 
      margin: 0 0 10px 0; 
      padding: 0; 
      color: #000000 !important;
      font-family: Arial, Helvetica, sans-serif !important;
      line-height: 1.5 !important;
      text-align: left !important;
    }
    
    p { 
      display: block !important;
      white-space: normal !important;
      word-wrap: break-word !important;
      margin-bottom: 10px !important;
    }
    
    /* Estilos para dados de contato que devem preservar quebras */
    .preserve-breaks {
      white-space: pre-line !important;
    }
    
    /* Estilos de tabela */
    table { 
      margin: 0 !important;
      width: 100% !important;
      max-width: 600px !important;
    }
    
    table td { 
      border: 1px solid #000000;
      padding: 7px;
      color: #000000 !important;
    }
    
    /* Estilos responsivos */
    @media screen and (max-width: 600px) {
      .responsive-table {
        width: 100% !important;
      }
      .mobile-text {
        font-size: 14px !important;
        line-height: 1.4 !important;
        width: 100% !important;
      }
    }
  </style>
</head>
<body>
  <div style="width:100%; max-width:600px; margin:0 auto; padding:20px; font-family:Arial, sans-serif; line-height:1.5; color:#000000; word-wrap:break-word; white-space:normal;">
    ${tempDiv.innerHTML}
  </div>
</body>
</html>`;

        return htmlCompleto;
      }
      
      // Processar o HTML para garantir compatibilidade com clientes de e-mail
      conteudoHtml = processarHTMLParaEmail(conteudoHtml);
      
      // Configuração do email para envio
      const emailData = {
        to: destinatario,
        cc: cc || undefined,
        subject: assunto,
        html: conteudoHtml,
        // Adicionar cabeçalhos específicos para melhorar compatibilidade
        headers: {
          'Content-Type': 'text/html; charset=UTF-8',
          'Content-Transfer-Encoding': 'quoted-printable',
          'X-Priority': '3'
        }
      };
      
      // Enviar email (simulação) com o conteúdo HTML do editor
      const resultado = await enviarEmailAPI(destinatario, assunto, conteudoHtml);
      
      setStatus({
        tipo: 'success',
        mensagem: resultado.message
      });
      
      // Registrar o email enviado no histórico do processo (num cenário real)
      console.log('Email enviado registrado no histórico:', {
        processo: processo.processId,
        destinatario,
        assunto,
        data: new Date()
      });
      
      // Fechar o modal após 2 segundos
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (error) {
      setStatus({
        tipo: 'error',
        mensagem: error.message || 'Erro ao enviar email. Tente novamente.'
      });
    } finally {
      setEnviando(false);
    }
  };
  
  if (!processo) {
    return null;
  }
  
  return (
    <Dialog 
      open={open} 
      onClose={enviando ? null : onClose}
      maxWidth="md" 
      fullWidth
    >
      <DialogTitle>
        <Typography>Enviar Email</Typography>
      </DialogTitle>
      
      <DialogContent>
        {status.mensagem && (
          <Alert 
            severity={status.tipo} 
            sx={{ mb: 2 }}
            onClose={() => setStatus({ tipo: '', mensagem: '' })}
          >
            {status.mensagem}
          </Alert>
        )}

        {processo?.processId?.startsWith('CPLPMaiores') && (
          <FormControl fullWidth variant="outlined" sx={{ mb: 2 }}>
            <InputLabel>Tipo de Email CPLP</InputLabel>
            <Select
              value={tipoCPLP}
              onChange={(e) => setTipoCPLP(e.target.value)}
              label="Tipo de Email CPLP"
            >
              <MenuItem value="desbloqueio">CPLP Desbloqueio</MenuItem>
              <MenuItem value="presencial">CPLP Presencial</MenuItem>
              <MenuItem value="agendamento">CPLP Agendamento</MenuItem>
            </Select>
          </FormControl>
        )}

        <TextField
          label="Para"
          fullWidth
          value={destinatario}
          onChange={(e) => setDestinatario(e.target.value)}
          disabled={enviando}
          required
          sx={{ mb: 2 }}
        />
        
        <TextField
          label="Com Cópia (CC)"
          fullWidth
          value={cc}
          onChange={(e) => setCc(e.target.value)}
          disabled={enviando}
          helperText="Separe múltiplos emails com vírgula"
          sx={{ mb: 2 }}
        />
        
        <TextField
          label="Assunto"
          fullWidth
          value={assunto}
          onChange={(e) => setAssunto(e.target.value)}
          disabled={enviando}
          required
          sx={{ mb: 2 }}
        />

        <Typography variant="subtitle2" gutterBottom sx={{ mt: 2 }}>
          Mensagem
        </Typography>
        <EditorSimples ref={editorRef} />

        <Paper variant="outlined" sx={{ p: 2, mt: 2 }}>
          <Typography variant="subtitle2" gutterBottom>
            Detalhes do Agendamento
          </Typography>
          
          <Box sx={{ display: 'flex', gap: 2, mt: 1 }}>
            <TextField
              label="Data"
              fullWidth
              value={dataAgendamento}
              onChange={(e) => setDataAgendamento(e.target.value)}
              disabled={enviando}
              placeholder="ex: 15/06/2023"
              InputProps={{
                startAdornment: <CalendarMonth fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
              }}
            />
            
            <TextField
              label="Hora"
              fullWidth
              value={horaAgendamento}
              onChange={(e) => setHoraAgendamento(e.target.value)}
              disabled={enviando}
              placeholder="ex: 14:30"
              InputProps={{
                startAdornment: <AccessTime fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
              }}
            />
          </Box>
          
          <TextField
            label="Local de Atendimento"
            fullWidth
            value={localAgendamento}
            onChange={(e) => setLocalAgendamento(e.target.value)}
            disabled={enviando}
            sx={{ mt: 2 }}
          />
        </Paper>
        
        <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
          <Chip 
            label={`Processo: ${processo.processId}`} 
            size="small" 
            variant="outlined" 
          />
          
          <Chip 
            label={`Data: ${formatDate(new Date())}`} 
            size="small" 
            variant="outlined" 
          />
        </Box>
      </DialogContent>
      
      <DialogActions>
        <Button 
          onClick={onClose} 
          disabled={enviando}
          variant="outlined"
        >
          Cancelar
        </Button>
        
        <Button 
          onClick={handleEnviarEmail} 
          variant="contained" 
          color="primary"
          disabled={enviando}
          startIcon={enviando ? <CircularProgress size={20} /> : <Send />}
        >
          {enviando ? 'Enviando...' : 'Enviar Email'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default EnviarEmail; 