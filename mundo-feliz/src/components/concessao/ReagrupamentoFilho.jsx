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
import ChildFriendlyIcon from '@mui/icons-material/ChildFriendly';
import DocumentUploader from '../upload/DocumentUploader';
import SignaturePad from '../upload/SignaturePad';
import useUpload from '../../hooks/useUpload';
import { uploadService } from '../../services/uploadService';
import { useNavigate, useParams } from 'react-router-dom';

const ReagrupamentoFilho = ({ selectedPerson, onBack, onSuccess }) => {
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
    resetUploadState,
    processDocuments,
    ensureValidProcessId
  } = useUpload(
    uploadService, 
    'ReagrupamentoFilho', 
    processId || selectedPerson?.id || personId || 'unknown'
  );

  const [isProcessing, setIsProcessing] = useState(false);
  const [processResult, setProcessResult] = useState(null);
  const [processError, setProcessError] = useState(null);

  useEffect(() => {
    const initializeProcess = async () => {
      try {
        // Garantir um ID de processo válido ao inicializar
        const validProcessId = await ensureValidProcessId();
        if (validProcessId) {
          console.log(`ProcessId válido inicializado: ${validProcessId}`);
          setProcessId(validProcessId);
        }
      } catch (error) {
        console.error('Erro ao inicializar processo:', error);
        setProcessError('Erro ao inicializar processo. Tente recarregar a página.');
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
    // Garantir que temos um ID de processo válido antes de submeter
    const validProcessId = await ensureValidProcessId();
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
        tipoProcesso: 'Reagrupamento Familiar - Através do Filho',
        tipoDocumento: 'ReagrupamentoFilho',
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
      
      const resultado = {
        success: true,
        extractedData: {
          ...processResult.extractedData,
          nomeCompleto: personName,
          numeroDocumento: personData?.documento || 'N/A',
          nacionalidade: personData?.nacionalidade || 'N/A',
          dataNascimento: personData?.dataNascimento || 'N/A'
        }
      };
      
      setProcessResult(resultado);
      
      setTimeout(() => {
        if (onSuccess) {
          onSuccess(resultado);
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
    return uploadState.documents.childTRFront?.uploaded && 
           uploadState.documents.childTRBack?.uploaded && 
           uploadState.documents.parentPassport?.uploaded && 
           uploadState.signature && 
           !isProcessing;
  };

  const handleBackToListing = () => {
    if (onBack) {
      onBack();
    } else {
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
            <ChildFriendlyIcon sx={{ mr: 1, verticalAlign: 'middle', color: '#1976d2' }} />
            Reagrupamento Familiar - Através do Filho
          </Typography>
        </Box>
        
        {processError && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {processError}
          </Alert>
        )}
        
        <Typography variant="body1" paragraph sx={{ color: 'text.secondary' }}>
          Por favor, carregue os documentos necessários para o reagrupamento familiar através do filho.
        </Typography>
        
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <DocumentUploader
              label="TR ou CC do Filho (frente)"
              required={true}
              onFileSelected={(file) => handleFileSelected('childTRFront', file)}
              fileUploaded={uploadState.documents.childTRFront?.uploaded}
              error={uploadState.documents.childTRFront?.error}
              errorMessage={uploadState.documents.childTRFront?.errorMessage}
            />
          </Grid>
          
          <Grid item xs={12} md={6}>
            <DocumentUploader
              label="TR ou CC do Filho (verso)"
              required={true}
              onFileSelected={(file) => handleFileSelected('childTRBack', file)}
              fileUploaded={uploadState.documents.childTRBack?.uploaded}
              error={uploadState.documents.childTRBack?.error}
              errorMessage={uploadState.documents.childTRBack?.errorMessage}
            />
          </Grid>
          
          <Grid item xs={12}>
            <DocumentUploader
              label="Passaporte do Pai ou Mãe"
              required={true}
              onFileSelected={(file) => handleFileSelected('parentPassport', file)}
              fileUploaded={uploadState.documents.parentPassport?.uploaded}
              error={uploadState.documents.parentPassport?.error}
              errorMessage={uploadState.documents.parentPassport?.errorMessage}
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
            {isProcessing ? 'Processando...' : 'Processar Documentos'}
          </Button>
        </Box>
      </Paper>
    </Container>
  );
};

export default ReagrupamentoFilho; 