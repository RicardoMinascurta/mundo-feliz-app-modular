import React, { useState, useEffect } from 'react';
import { 
  Container, 
  Typography, 
  Paper, 
  Button, 
  Grid, 
  Box, 
  Alert,
  Divider,
  useMediaQuery,
  CircularProgress
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SchoolIcon from '@mui/icons-material/School';
import DocumentUploader from '../upload/DocumentUploader';
import SignaturePad from '../upload/SignaturePad';
import useUpload from '../../hooks/useUpload';
import { uploadService } from '../../services/uploadService';
import { useNavigate, useParams } from 'react-router-dom';

const RenovacaoEstudanteSecundario = ({ selectedPerson, onBack, onSuccess }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const navigate = useNavigate();
  const params = useParams();
  const personId = params.personId;
  
  // Usar um único estado para o ID do processo
  const [processId, setProcessId] = useState(params.processId || null);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [personName, setPersonName] = useState('');
  
  // Estado para controlar quando o processId foi gerado com sucesso
  const [processIdGerado, setProcessIdGerado] = useState(false);
  
  // Função para gerar ou verificar o ID do processo
  const gerarProcessId = async () => {
    if (!processId) {
      console.log('ProcessId não definido, gerando novo...');
      try {
        // Em vez de chamar a API, gerar localmente
        const timestamp = new Date().toISOString().replace(/[-:.TZ]/g, "").substring(0, 8);
        const randomHex = Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0');
        const novoId = `RenovacaoEstudanteSecundario-${timestamp}-${randomHex}`;
        
        console.log(`Novo processo ID gerado localmente: ${novoId}`);
        setProcessId(novoId);
        setProcessIdGerado(true);
        return novoId;
      } catch (error) {
        console.error('Erro ao gerar processId:', error);
        setError('Não foi possível iniciar o processo. Tente novamente.');
        return null;
      }
    } else {
      // Se já existe um processId, verificar se tem o formato correto
      const formatoValido = /^[A-Za-z]+-[a-z0-9]+-[0-9a-f]+$/.test(processId);
      if (!formatoValido) {
        console.warn('ID de processo existente com formato incorreto:', processId);
        
        // Gerar um novo ID com formato correto
        try {
          console.log('Tentando gerar novo ID com formato correto...');
          const timestamp = new Date().toISOString().replace(/[-:.TZ]/g, "").substring(0, 8);
          const randomHex = Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0');
          const novoId = `RenovacaoEstudanteSecundario-${timestamp}-${randomHex}`;
          
          console.log(`Novo processo ID gerado localmente: ${novoId}`);
          setProcessId(novoId);
          setProcessIdGerado(true);
          return novoId;
        } catch (error) {
          console.error('Erro ao gerar novo processId:', error);
          setError('Problema com o formato do ID do processo. Tente recarregar a página.');
          return null;
        }
      } else {
        // ID existente tem formato correto
        setProcessIdGerado(true);
        return processId;
      }
    }
  };

  // Gerar um processId se não existir
  useEffect(() => {
    const inicializarProcesso = async () => {
      const validProcessId = await gerarProcessId();
      console.log(`ProcessId inicializado: ${validProcessId}`);
    };
    
    inicializarProcesso();
  }, []);
  
  // Inicializar o hook useUpload apenas quando tivermos um processId válido
  const {
    uploadState,
    updateDocument,
    updateSignature,
    setDocumentError,
    submitDocuments,
    resetUploadState,
    processDocuments
  } = useUpload(
    uploadService, 
    'Renovação Estudante Secundário', 
    processId // Usar apenas processId, que será undefined se ainda não foi gerado
  );

  // Atualizar o estado quando o processId mudar e o upload estiver pronto
  useEffect(() => {
    if (processId) {
      console.log('ProcessId atualizado no componente:', processId);
      
      // Quando temos um processId válido, podemos habilitar o upload
      if (processIdGerado) {
        console.log('Upload habilitado com ID válido:', processId);
      }
    }
  }, [processId, processIdGerado]);

  const [isProcessing, setIsProcessing] = useState(false);
  const [processResult, setProcessResult] = useState(null);
  const [processError, setProcessError] = useState(null);

  const handleFileSelected = async (fieldName, file) => {
    try {
      // Garantir que temos um ID de processo antes de fazer upload
      if (!processIdGerado) {
        setDocumentError(fieldName, 'Aguarde a geração do ID do processo...');
        return;
      }
      
      if (file.size > 10 * 1024 * 1024) {
        setDocumentError(fieldName, 'O ficheiro é muito grande. Tamanho máximo permitido: 10MB');
        return;
      }
      
      updateDocument(fieldName, file);
    } catch (error) {
      console.error(`Erro ao processar o ficheiro ${fieldName}:`, error);
      setDocumentError(fieldName, 'Erro ao processar o ficheiro. Tente novamente.');
    }
  };

  const handleSubmit = async () => {
    if (!processId) {
      setProcessError('ID do processo não disponível. Tente recarregar a página.');
      return;
    }
    
    setIsProcessing(true);
    setProcessError(null);
    
    try {
      // Primeiro, processar documentos com OCR e GPT
      const processResult = await processDocuments();
      
      if (!processResult.success) {
        setProcessError(processResult.error || 'Erro ao processar documentos');
        setIsProcessing(false);
        return;
      }
      
      // Depois de processar, enviar os dados para o servidor
      const dadosProcesso = {
        tipoProcesso: 'RenovacaoEstudanteSecundario',
        tipoDocumento: 'Renovacao',
        processId: processId, // Usar o processId que foi gerado pela API
        documentos: uploadState.documents,
        assinatura: uploadState.signature ? true : false,
        extractedData: processResult.extractedData || {},
        arquivosUpload: processResult.uploadedFiles || [],
        prompt: processResult.prompt,
        personId: selectedPerson?.id || personId
      };
      
      // Submeter documentos
      const response = await submitDocuments(dadosProcesso);
      
      if (!response || !response.success) {
        throw new Error(response?.error || 'Falha ao enviar documentos');
      }
      
      // Se chegou até aqui, foi bem-sucedido
      setProcessResult({
        success: true,
        extractedData: processResult.extractedData || {}
      });
      
      // Chamar a função de sucesso após 1 segundo
      setTimeout(() => {
        if (onSuccess) {
          onSuccess({
            success: true,
            extractedData: processResult.extractedData || {},
            processId: response.processId || processId
          });
        } else if (response.processId || processId) {
          console.log("➡️ RENOVACAO-SUBMIT: Navegando para página de detalhes do processo");
          navigate(`/processo/${response.processId || processId}`);
        }
      }, 1000);
    } catch (error) {
      console.error('Erro ao processar documentos:', error);
      setProcessError(error.message || 'Erro desconhecido ao processar documentos');
    } finally {
      setIsProcessing(false);
    }
  };

  const canSubmit = () => {
    // Verificar se os documentos obrigatórios foram carregados
    return uploadState.documents.trFrente?.uploaded && 
           uploadState.documents.trVerso?.uploaded && 
           uploadState.documents.documentoResponsavel?.uploaded && 
           uploadState.signature && 
           !isProcessing;
  };

  // Função de navegação para voltar à página de listagem
  const handleBackToListing = () => {
    if (onBack) {
      // Se existe callback onBack, usar ele primeiro
      onBack();
    } else {
      // Navegar para a página de processos desta pessoa específica
      navigate(`/person/${personId}/processes`);
    }
  };

  if (processResult) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Paper elevation={3} sx={{ p: 3, borderRadius: 2, backgroundColor: 'white' }}>
          <Typography variant="h5" gutterBottom align="center" sx={{ color: '#4caf50' }}>
            Documentos processados com sucesso!
          </Typography>
          
          {processResult.extractedData && (
            <Box sx={{ mt: 3, p: 2, border: '1px solid #e0e0e0', borderRadius: 1 }}>
              <Typography variant="h6" gutterBottom>
                Dados extraídos:
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2">
                    <strong>Nome:</strong> {processResult.extractedData.nomeCompleto || 'N/A'}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2">
                    <strong>Documento:</strong> {processResult.extractedData.numeroDocumento || 'N/A'}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2">
                    <strong>Nacionalidade:</strong> {processResult.extractedData.nacionalidade || 'N/A'}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2">
                    <strong>Data de Nascimento:</strong> {processResult.extractedData.dataNascimento || 'N/A'}
                  </Typography>
                </Grid>
                
                <Grid item xs={12}>
                  <Divider sx={{ my: 2 }} />
                  <Typography variant="subtitle1" gutterBottom>
                    Dados do Responsável Legal:
                  </Typography>
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2">
                    <strong>Nome do Responsável:</strong> {processResult.extractedData.nomeResponsavelLegal || 'N/A'}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2">
                    <strong>Documento do Responsável:</strong> {processResult.extractedData.numeroDocumentoResponsavel || 'N/A'}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2">
                    <strong>Validade do Documento:</strong> {processResult.extractedData.dataValidadeResponsavel || 'N/A'}
                  </Typography>
                </Grid>
              </Grid>
            </Box>
          )}
          
          <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center' }}>
            <Button 
              variant="contained" 
              color="primary" 
              onClick={handleBackToListing}
            >
              Voltar para o Dashboard
            </Button>
          </Box>
        </Paper>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Button
        startIcon={<ArrowBackIcon />}
        onClick={handleBackToListing}
        sx={{ mb: 2, color: '#1976d2' }}
      >
        Voltar
      </Button>
      
      <Paper elevation={3} sx={{ p: 3, borderRadius: 2, backgroundColor: 'white' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <Typography variant="h5" sx={{ flexGrow: 1 }}>
            <SchoolIcon sx={{ mr: 1, verticalAlign: 'middle', color: '#1976d2' }} />
            Renovação - Estudante Ensino Secundário
          </Typography>
        </Box>
        
        {processError && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {processError}
          </Alert>
        )}
        
        <Typography variant="body1" paragraph sx={{ color: 'text.secondary' }}>
          Por favor, carregue os documentos necessários para renovação de autorização de residência para estudante do ensino secundário.
        </Typography>
        
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <DocumentUploader
              label="TR FRENTE"
              required={true}
              onFileSelected={(file) => handleFileSelected('trFrente', file)}
              fileUploaded={uploadState.documents.trFrente?.uploaded}
              error={uploadState.documents.trFrente?.error}
              errorMessage={uploadState.documents.trFrente?.errorMessage}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <DocumentUploader
              label="TR VERSO"
              required={true}
              onFileSelected={(file) => handleFileSelected('trVerso', file)}
              fileUploaded={uploadState.documents.trVerso?.uploaded}
              error={uploadState.documents.trVerso?.error}
              errorMessage={uploadState.documents.trVerso?.errorMessage}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <DocumentUploader
              label="DOCUMENTO DA ESCOLA"
              required={false}
              onFileSelected={(file) => handleFileSelected('documentoEscola', file)}
              fileUploaded={uploadState.documents.documentoEscola?.uploaded}
              error={uploadState.documents.documentoEscola?.error}
              errorMessage={uploadState.documents.documentoEscola?.errorMessage}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <DocumentUploader
              label="DOCUMENTO DO RESPONSÁVEL"
              required={true}
              onFileSelected={(file) => handleFileSelected('documentoResponsavel', file)}
              fileUploaded={uploadState.documents.documentoResponsavel?.uploaded}
              error={uploadState.documents.documentoResponsavel?.error}
              errorMessage={uploadState.documents.documentoResponsavel?.errorMessage}
            />
          </Grid>

          <Grid item xs={12}>
            <DocumentUploader
              label="Documentos extras (opcional)"
              required={false}
              onFileSelected={(file) => handleFileSelected('extras', file)}
              fileUploaded={uploadState.documents.extras?.length > 0}
              error={uploadState.documents.extras?.error}
              errorMessage={uploadState.documents.extras?.errorMessage}
              multipleFiles={true}
            />
          </Grid>
          
          <Grid item xs={12}>
            <Divider sx={{ my: 2 }} />
            <Typography variant="h6" gutterBottom>
              Assinatura
            </Typography>
            
            <SignaturePad
              onSignatureChange={updateSignature}
              initialSignature={uploadState.signature}
              title="Assinatura"
              description="Por favor, assine dentro da área abaixo"
              height={250}
            />
          </Grid>
        </Grid>
        
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'flex-end', 
          mt: 4,
          flexDirection: isMobile ? 'column' : 'row',
          gap: isMobile ? 2 : 0
        }}>
          <Button
            variant="contained"
            color="primary"
            onClick={handleSubmit}
            disabled={!canSubmit() || isProcessing}
            sx={{ 
              width: isMobile ? '100%' : 'auto',
              backgroundColor: '#1976d2'
            }}
          >
            {isProcessing ? <CircularProgress size={24} /> : 'Processar Documentos'}
          </Button>
        </Box>
      </Paper>
    </Container>
  );
};

export default RenovacaoEstudanteSecundario; 