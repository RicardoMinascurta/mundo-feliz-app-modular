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
import { useNavigate, useParams } from 'react-router-dom';
import DocumentUploader from '../../components/upload/DocumentUploader';
import SignaturePad from '../../components/upload/SignaturePad';
import useUpload from '../../hooks/useUpload';
import { uploadService } from '../../services/uploadService';
import SchoolIcon from '@mui/icons-material/School';

const TREstudanteUpload = () => {
  const { processId } = useParams();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  const {
    uploadState,
    updateDocument,
    updateSignature,
    setDocumentError,
    submitDocuments,
    processDocuments
  } = useUpload('concessao_TR_Estudante', processId, uploadService);

  const [isProcessing, setIsProcessing] = useState(false);
  const [processError, setProcessError] = useState(null);
  const [uploadError, setUploadError] = useState(null);

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
    try {
      setIsProcessing(true);
      setProcessError('');
      
      // Primeiro, processar documentos com OCR e GPT
      const processResult = await processDocuments();
      
      if (!processResult.success) {
        setProcessError(processResult.error || 'Erro ao processar documentos');
        setIsProcessing(false);
        return;
      }
      
      // Depois de processar, enviar os dados para o servidor
      const dadosProcesso = {
        tipoProcesso: 'TREstudante',
        tipoDocumento: 'Estudante',
        documentos: uploadState.documents,
        assinatura: uploadState.signature ? true : false,
        dadosExtraidos: processResult.extractedData || {},
        arquivosUpload: processResult.uploadedFiles || [],
        prompt: processResult.prompt
      };
      
      // Submeter documentos
      const response = await submitDocuments(dadosProcesso);
      
      if (response.success) {
        if (response.processId) {
          console.log("➡️ UPLOAD-SUBMIT: Navegando para página de detalhes do processo");
          navigate(`/processo/${response.processId}`);
        }
      } else {
        setUploadError(response.error || 'Erro ao submeter documentos');
      }
    } catch (error) {
      console.error('Erro ao enviar:', error);
      setUploadError(error.message || 'Erro ao processar solicitação');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBack = () => {
    navigate(-1);
  };

  const canSubmit = () => {
    const requiredDocs = ['passport', 'visa', 'fotoTipo', 'matricula', 'seguroSaude', 'meiosSubsistencia'];
    const allRequired = requiredDocs.every(doc => uploadState.documents[doc]?.uploaded);
    return allRequired && uploadState.signature && !isProcessing;
  };

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Paper elevation={3} sx={{ p: 3, borderRadius: 2, backgroundColor: 'white' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 3 }}>
          <SchoolIcon sx={{ fontSize: 36, color: '#1976d2', mr: 1 }} />
          <Typography variant="h4" align="center" sx={{ color: '#1976d2' }}>
            Upload de Documentos - TR Estudante
          </Typography>
        </Box>
        
        <Alert severity="info" sx={{ mb: 4 }}>
          <Typography variant="body1">
            Para Título de Residência de Estudante, são necessários:
          </Typography>
          <ul>
            <li>Passaporte válido</li>
            <li>Visto de estudo válido</li>
            <li>Foto tipo passe recente</li>
            <li>Comprovativo de matrícula</li>
            <li>Seguro de saúde</li>
            <li>Comprovativo de meios de subsistência</li>
          </ul>
        </Alert>
        
        <Typography variant="h5" gutterBottom sx={{ color: '#1976d2' }}>
          Documentos Pessoais
        </Typography>
        
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <DocumentUploader
              label="Passaporte"
              required={true}
              onFileSelected={(file) => handleFileSelected('passport', file)}
              fileUploaded={uploadState.documents['passport']?.uploaded}
              error={uploadState.documents['passport']?.error}
              errorMessage={uploadState.documents['passport']?.errorMessage}
            />
          </Grid>
          
          <Grid item xs={12} md={6}>
            <DocumentUploader
              label="Visto de Estudo"
              required={true}
              onFileSelected={(file) => handleFileSelected('visa', file)}
              fileUploaded={uploadState.documents['visa']?.uploaded}
              error={uploadState.documents['visa']?.error}
              errorMessage={uploadState.documents['visa']?.errorMessage}
            />
          </Grid>
          
          <Grid item xs={12} md={6}>
            <DocumentUploader
              label="Foto Tipo Passe"
              required={true}
              acceptedTypes="image/jpeg,image/png"
              onFileSelected={(file) => handleFileSelected('fotoTipo', file)}
              fileUploaded={uploadState.documents['fotoTipo']?.uploaded}
              error={uploadState.documents['fotoTipo']?.error}
              errorMessage={uploadState.documents['fotoTipo']?.errorMessage}
            />
          </Grid>
        </Grid>
        
        <Divider sx={{ my: 4 }} />
        
        <Typography variant="h5" gutterBottom sx={{ color: '#1976d2' }}>
          Documentos Académicos e Financeiros
        </Typography>
        
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <DocumentUploader
              label="Comprovativo de Matrícula"
              required={true}
              onFileSelected={(file) => handleFileSelected('matricula', file)}
              fileUploaded={uploadState.documents['matricula']?.uploaded}
              error={uploadState.documents['matricula']?.error}
              errorMessage={uploadState.documents['matricula']?.errorMessage}
            />
          </Grid>
          
          <Grid item xs={12} md={6}>
            <DocumentUploader
              label="Seguro de Saúde"
              required={true}
              onFileSelected={(file) => handleFileSelected('seguroSaude', file)}
              fileUploaded={uploadState.documents['seguroSaude']?.uploaded}
              error={uploadState.documents['seguroSaude']?.error}
              errorMessage={uploadState.documents['seguroSaude']?.errorMessage}
            />
          </Grid>
          
          <Grid item xs={12}>
            <DocumentUploader
              label="Comprovativo de Meios de Subsistência"
              required={true}
              onFileSelected={(file) => handleFileSelected('meiosSubsistencia', file)}
              fileUploaded={uploadState.documents['meiosSubsistencia']?.uploaded}
              error={uploadState.documents['meiosSubsistencia']?.error}
              errorMessage={uploadState.documents['meiosSubsistencia']?.errorMessage}
            />
          </Grid>
        </Grid>
        
        <Box sx={{ my: 4 }}>
          <Typography variant="h5" gutterBottom sx={{ color: '#1976d2' }}>
            Assinatura
          </Typography>
          
          <Typography variant="body2" color="text.secondary" paragraph>
            Por favor, assine abaixo para confirmar os dados e documentos fornecidos.
          </Typography>
          
          <SignaturePad
            onSignatureChange={updateSignature}
            initialSignature={uploadState.signature}
            height={250}
          />
        </Box>
        
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          mt: 4,
          flexDirection: isMobile ? 'column' : 'row',
          gap: isMobile ? 2 : 0
        }}>
          <Button
            variant="outlined"
            color="primary"
            onClick={handleBack}
            sx={{ 
              width: isMobile ? '100%' : 'auto',
              borderColor: '#1976d2', 
              color: '#1976d2'
            }}
          >
            Voltar
          </Button>
          
          <Button
            variant="contained"
            color="primary"
            onClick={handleSubmit}
            disabled={!canSubmit()}
            sx={{ 
              width: isMobile ? '100%' : 'auto',
              backgroundColor: '#1976d2'
            }}
          >
            {isProcessing ? 'Processando...' : 'Enviar Documentos'}
          </Button>
        </Box>
        
        {processError && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {processError}
          </Alert>
        )}
        
        {uploadError && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {uploadError}
          </Alert>
        )}
      </Paper>
    </Container>
  );
};

export default TREstudanteUpload; 