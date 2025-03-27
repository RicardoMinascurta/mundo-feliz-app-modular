import React, { useState } from 'react';
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
import InfoIcon from '@mui/icons-material/Info';
import DocumentUploader from './DocumentUploader';
import SignaturePad from './SignaturePad';
import useUpload from '../../hooks/useUpload';
import { uploadService } from '../../services/uploadService';
import { useNavigate, useParams } from 'react-router-dom';

const InformacaoUpload = ({ selectedPerson, onBack, onSuccess, tipoInformacao = 'portal' }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const navigate = useNavigate();
  const { personId, processId } = useParams();
  
  const {
    uploadState,
    updateDocument,
    updateSignature,
    setDocumentError,
    submitDocuments,
    processDocuments,
    ensureValidProcessId
  } = useUpload(
    uploadService, 
    tipoInformacao === 'portal' ? 'InfoPortal' : 'InfoPresencial', 
    processId
  );

  const [isProcessing, setIsProcessing] = useState(false);
  const [processResult, setProcessResult] = useState(null);
  const [processError, setProcessError] = useState(null);

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
    setIsProcessing(true);
    setProcessError(null);
    
    try {
      const validProcessId = await ensureValidProcessId();
      
      console.log("📝 INFO-UPLOAD: Iniciando submissão de documentos", {
        processId: validProcessId,
        personId: personId || selectedPerson?.id,
        tipoInformacao
      });
      
      const processResult = await processDocuments();
      
      if (!processResult || !processResult.success) {
        throw new Error(processResult?.error || 'Falha ao processar documentos');
      }
      
      const uploadResult = await submitDocuments({
        tipoProcesso: tipoInformacao === 'portal' ? 'InfoPortal' : 'InfoPresencial',
        tipoDocumento: tipoInformacao === 'portal' ? 'InformacaoPortal' : 'InformacaoPresencial',
        processId: validProcessId,
        extractedData: processResult.extractedData,
        personId: personId || selectedPerson?.id
      });
      
      console.log("✅ INFO-UPLOAD: Documentos submetidos com sucesso", {
        processId: validProcessId,
        personId: personId || selectedPerson?.id,
        uploadResult
      });
      
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
        dataNascimento: personData?.dataNascimento || 'N/A',
        sexo: personData?.sexo || 'N/A'
      };
      
      setProcessResult({
        success: true,
        extractedData: finalData
      });
      
      setTimeout(() => {
        if (onSuccess) {
          onSuccess({ success: true, extractedData: finalData });
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
    return uploadState.documents.documento?.uploaded && 
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
            Solicitação processada com sucesso!
          </Typography>
          
          {processResult.extractedData && (
            <Box sx={{ mt: 3, p: 2, border: '1px solid #e0e0e0', borderRadius: 1 }}>
              <Typography variant="h6" gutterBottom>
                Dados do solicitante:
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
            <InfoIcon sx={{ mr: 1, verticalAlign: 'middle', color: '#1976d2' }} />
            PEDIDO DE TÍTULO DE RESIDÊNCIA - (INFORMAÇÃO DE PROCESSO)
          </Typography>
        </Box>
        
        {processError && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {processError}
          </Alert>
        )}
        
        <Typography variant="body1" paragraph sx={{ color: 'text.secondary' }}>
          Por favor, envie os documentos necessários para sua solicitação de informação.
        </Typography>
        
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <DocumentUploader
              label="DOCUMENTO DA PESSOA (OBRIGATÓRIO)"
              required={true}
              onFileSelected={(file) => handleFileSelected('documento', file)}
              fileUploaded={uploadState.documents.documento?.uploaded}
              error={uploadState.documents.documento?.error}
              errorMessage={uploadState.documents.documento?.errorMessage}
              multipleFiles={false}
            />
          </Grid>

          <Grid item xs={12}>
            <DocumentUploader
              label="Comprovativo AIMA (OPCIONAL)"
              required={false}
              onFileSelected={(file) => handleFileSelected('aima', file)}
              fileUploaded={uploadState.documents.aima?.uploaded}
              error={uploadState.documents.aima?.error}
              errorMessage={uploadState.documents.aima?.errorMessage}
              multipleFiles={false}
            />
          </Grid>
          
          <Grid item xs={12}>
            <Divider sx={{ my: 2 }} />
            <Typography variant="h6" gutterBottom>
              ASSINATURA (OBRIGATÓRIO)
            </Typography>
            
            <SignaturePad
              onSignatureChange={updateSignature}
              initialSignature={uploadState.signature}
              title="Assinatura"
              description="Por favor, assine dentro da área abaixo"
              height={250}
            />
          </Grid>

          <Grid item xs={12}>
            <DocumentUploader
              label="DOCUMENTO EXTRA (OPCIONAL)"
              required={false}
              onFileSelected={(file) => handleFileSelected('extras', file)}
              fileUploaded={uploadState.documents.extras?.length > 0}
              error={uploadState.documents.extras?.error}
              errorMessage={uploadState.documents.extras?.errorMessage}
              multipleFiles={true}
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
            {isProcessing ? 'Processando...' : 'Enviar Solicitação'}
          </Button>
        </Box>
      </Paper>
    </Container>
  );
};

export default InformacaoUpload; 