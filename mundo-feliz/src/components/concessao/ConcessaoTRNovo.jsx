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
  useMediaQuery
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ArticleIcon from '@mui/icons-material/Article';
import DocumentUploader from '../upload/DocumentUploader';
import SignaturePad from '../upload/SignaturePad';
import useUpload from '../../hooks/useUpload';
import { uploadService } from '../../services/uploadService';
import { useNavigate, useParams } from 'react-router-dom';

const ConcessaoTRNovo = ({ selectedPerson, onBack, onSuccess }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const navigate = useNavigate();
  const { personId } = useParams();
  
  const [processId, setProcessId] = useState(useParams().processId || null);
  
  const {
    uploadState,
    updateDocument,
    updateSignature,
    setDocumentError,
    submitDocuments,
    processDocuments
  } = useUpload(
    uploadService,
    'Concessão TR', 
    processId || selectedPerson?.id || personId || 'unknown'
  );

  const [isProcessing, setIsProcessing] = useState(false);
  const [processResult, setProcessResult] = useState(null);
  const [processError, setProcessError] = useState(null);

  const gerarProcessId = async () => {
    const formatoValido = processId && /^[A-Za-z]+-[a-z0-9]+-[0-9a-f]+$/.test(processId);
    
    if (formatoValido) {
      console.log(`Usando ID de processo existente (válido): ${processId}`);
      return processId;
    }
    
    if (processId) {
      console.log(`ID de processo existente com formato incorreto: ${processId}`);
    }
    console.log('Tentando gerar novo ID com formato correto...');
    
    try {
      // Em vez de chamar a API, vamos gerar localmente
      const timestamp = new Date().toISOString().replace(/[-:.TZ]/g, "").substring(0, 8);
      const randomHex = Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0');
      const novoId = `ConcessaoTRNovo-${timestamp}-${randomHex}`;
      
      console.log(`Novo processo ID gerado localmente: ${novoId}`);
      setProcessId(novoId);
      return novoId;
    } catch (error) {
      console.error('Erro ao gerar processId:', error);
      setProcessError('Não foi possível iniciar o processo. Tente novamente.');
      return null;
    }
  };

  useEffect(() => {
    const initializeProcess = async () => {
      try {
        const validProcessId = await gerarProcessId();
        console.log(`ProcessId atualizado no componente: ${validProcessId}`);
        
        if (validProcessId) {
          console.log(`Upload habilitado com ID válido: ${validProcessId}`);
        }
      } catch (error) {
        console.error('Erro ao inicializar processo:', error);
        setProcessError('Erro ao inicializar processo. Tente novamente.');
      }
    };
    
    initializeProcess();
  }, []);

  const handleFileSelected = async (fieldName, file) => {
    try {
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
    const validProcessId = await gerarProcessId();
    if (!validProcessId) {
      setProcessError('ID do processo não disponível. Tente recarregar a página.');
      return;
    }
    
    setIsProcessing(true);
    setProcessError(null);
    
    try {
      const processResult = await processDocuments();
      
      if (!processResult || !processResult.success) {
        throw new Error(processResult?.error || 'Falha ao processar documentos');
      }
      
      const uploadResult = await submitDocuments({
        tipoProcesso: 'Concessão TR',
        tipoDocumento: 'TR',
        processId: validProcessId,
        extractedData: processResult.extractedData
      });
      
      if (!uploadResult) {
        throw new Error('Falha ao enviar documentos');
      }
      
      let personName = 'Nome não disponível';
      let personData = null;
      
      if (selectedPerson) {
        personName = selectedPerson.name || selectedPerson.nome;
        personData = selectedPerson;
      } else if (personId) {
        try {
          const storedPerson = localStorage.getItem(`person_${personId}`);
          if (storedPerson) {
            personData = JSON.parse(storedPerson);
            personName = personData.name || personData.nome;
          }
        } catch (e) {
          console.error('Erro ao recuperar dados da pessoa:', e);
        }
      }
      
      const finalData = processResult.extractedData || {
        nomeCompleto: personName,
        numeroDocumento: personData?.documento || 'N/A',
        nacionalidade: personData?.nacionalidade || 'N/A',
        dataNascimento: personData?.dataNascimento || 'N/A'
      };
      
      setProcessResult({
        success: true,
        extractedData: finalData
      });
      
      setTimeout(() => {
        if (onSuccess) {
          onSuccess({ success: true, extractedData: finalData });
        } else {
          navigate('/inbox');
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
    // Verificar se tem passaporte e assinatura
    console.log("Estado atual para submissão:", {
      passaporte: !!uploadState.documents.passport?.uploaded,
      assinatura: !!uploadState.signature
    });
    
    return !!uploadState.documents.passport?.uploaded && !!uploadState.signature;
  };

  const handleBackToListing = () => {
    if (onBack) {
      onBack();
    } else {
      navigate(-1);
    }
  };

  if (processResult) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Paper elevation={3} sx={{ p: 3, borderRadius: 2, backgroundColor: 'white' }}>
          <Typography variant="h5" gutterBottom align="center" sx={{ color: '#4caf50' }}>
            Processo de Concessão TR submetido com sucesso!
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
            <ArticleIcon sx={{ mr: 1, verticalAlign: 'middle', color: '#1976d2' }} />
            Concessão TR
          </Typography>
        </Box>
        
        {processError && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {processError}
          </Alert>
        )}
        
        <Typography variant="body1" paragraph sx={{ color: 'text.secondary' }}>
          Por favor, carregue os documentos necessários para o processo de Concessão TR.
        </Typography>
        
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <DocumentUploader
              label="Passaporte"
              required={true}
              onFileSelected={(file) => handleFileSelected('passport', file)}
              fileUploaded={uploadState.documents.passport?.uploaded}
              error={uploadState.documents.passport?.error}
              errorMessage={uploadState.documents.passport?.errorMessage}
            />
          </Grid>
          
          <Grid item xs={12} md={6}>
            <DocumentUploader
              label="Visto (opcional)"
              required={false}
              onFileSelected={(file) => handleFileSelected('visa', file)}
              fileUploaded={uploadState.documents.visa?.uploaded}
              error={uploadState.documents.visa?.error}
              errorMessage={uploadState.documents.visa?.errorMessage}
            />
          </Grid>
          
          <Grid item xs={12}>
            <DocumentUploader
              label="Documentos extras (opcional)"
              required={false}
              onFileSelected={(file) => handleFileSelected('extraDocs', file)}
              fileUploaded={uploadState.documents.extraDocs?.uploaded}
              error={uploadState.documents.extraDocs?.error}
              errorMessage={uploadState.documents.extraDocs?.errorMessage}
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
            {isProcessing ? 'PROCESSANDO...' : 'SUBMETER PROCESSO'}
          </Button>
        </Box>
      </Paper>
    </Container>
  );
};

export default ConcessaoTRNovo; 