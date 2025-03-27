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
  Stepper,
  Step,
  StepLabel,
  useMediaQuery 
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { useNavigate, useParams } from 'react-router-dom';
import DocumentUploader from '../../components/upload/DocumentUploader';
import SignaturePad from '../../components/upload/SignaturePad';
import useUpload from '../../hooks/useUpload';
import { uploadService } from '../../services/uploadService';
import AutorenewIcon from '@mui/icons-material/Autorenew';

const RenovacaoTRUpload = () => {
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
  } = useUpload('renovacao_TR', processId, uploadService);

  const [activeStep, setActiveStep] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processError, setProcessError] = useState(null);
  const [uploadError, setUploadError] = useState(null);

  const steps = ['Documentos Pessoais', 'Comprovativo de Morada', 'Outros Documentos', 'Assinatura'];

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

  const handleNext = () => {
    setActiveStep((prevStep) => prevStep + 1);
  };

  const handleBack = () => {
    if (activeStep === 0) {
      navigate(-1);
    } else {
      setActiveStep((prevStep) => prevStep - 1);
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
        tipoProcesso: 'RenovacaoTR',
        tipoDocumento: 'Renovacao',
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

  const canProceedToNextStep = () => {
    switch (activeStep) {
      case 0: // Documentos Pessoais
        return uploadState.documents['passportAll']?.uploaded &&
               uploadState.documents['currentTR']?.uploaded &&
               uploadState.documents['fotoTipo']?.uploaded;
      case 1: // Comprovativo de Morada
        return uploadState.documents['comprovativoMorada']?.uploaded;
      case 2: // Outros Documentos
        return true; // Documentos opcionais neste passo
      case 3: // Assinatura
        return !!uploadState.signature;
      default:
        return false;
    }
  };

  const renderStepContent = () => {
    switch (activeStep) {
      case 0: // Documentos Pessoais
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <DocumentUploader
                label="Passaporte (Todas as Páginas)"
                required={true}
                onFileSelected={(file) => handleFileSelected('passportAll', file)}
                fileUploaded={uploadState.documents['passportAll']?.uploaded}
                error={uploadState.documents['passportAll']?.error}
                errorMessage={uploadState.documents['passportAll']?.errorMessage}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <DocumentUploader
                label="Título de Residência Atual"
                required={true}
                onFileSelected={(file) => handleFileSelected('currentTR', file)}
                fileUploaded={uploadState.documents['currentTR']?.uploaded}
                error={uploadState.documents['currentTR']?.error}
                errorMessage={uploadState.documents['currentTR']?.errorMessage}
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
        );
      case 1: // Comprovativo de Morada
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Alert severity="info" sx={{ mb: 2 }}>
                <Typography variant="body2">
                  O comprovativo de morada deve ser um dos seguintes documentos:
                </Typography>
                <ul>
                  <li>Contrato de arrendamento</li>
                  <li>Fatura de água, luz ou gás</li>
                  <li>Atestado de residência da Junta de Freguesia</li>
                </ul>
              </Alert>
              
              <DocumentUploader
                label="Comprovativo de Morada"
                required={true}
                onFileSelected={(file) => handleFileSelected('comprovativoMorada', file)}
                fileUploaded={uploadState.documents['comprovativoMorada']?.uploaded}
                error={uploadState.documents['comprovativoMorada']?.error}
                errorMessage={uploadState.documents['comprovativoMorada']?.errorMessage}
              />
            </Grid>
          </Grid>
        );
      case 2: // Outros Documentos
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Alert severity="info" sx={{ mb: 2 }}>
                <Typography variant="body2">
                  Carregue documentos adicionais conforme o seu tipo de autorização de residência:
                </Typography>
                <ul>
                  <li>Para trabalho: contrato de trabalho e declaração da Segurança Social</li>
                  <li>Para estudo: comprovativo de matrícula e seguro de saúde</li>
                  <li>Para reagrupamento familiar: documento comprovativo da relação familiar</li>
                </ul>
              </Alert>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <DocumentUploader
                label="Comprovativo de Situação Contributiva"
                required={false}
                onFileSelected={(file) => handleFileSelected('situacaoContributiva', file)}
                fileUploaded={uploadState.documents['situacaoContributiva']?.uploaded}
                error={uploadState.documents['situacaoContributiva']?.error}
                errorMessage={uploadState.documents['situacaoContributiva']?.errorMessage}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <DocumentUploader
                label="Documentos Complementares"
                required={false}
                onFileSelected={(file) => handleFileSelected('documentosComplementares', file)}
                fileUploaded={uploadState.documents['documentosComplementares']?.uploaded}
                error={uploadState.documents['documentosComplementares']?.error}
                errorMessage={uploadState.documents['documentosComplementares']?.errorMessage}
              />
            </Grid>
          </Grid>
        );
      case 3: // Assinatura
        return (
          <Box width="100%">
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
        );
      default:
        return null;
    }
  };

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Paper elevation={3} sx={{ p: 3, borderRadius: 2, backgroundColor: 'white' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 3 }}>
          <AutorenewIcon sx={{ fontSize: 36, color: '#1976d2', mr: 1 }} />
          <Typography variant="h4" align="center" sx={{ color: '#1976d2' }}>
            Upload de Documentos - Renovação TR
          </Typography>
        </Box>
        
        <Stepper activeStep={activeStep} alternativeLabel sx={{ mb: 4 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>
        
        <Divider sx={{ mb: 3 }} />
        
        {renderStepContent()}
        
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
            {activeStep === 0 ? 'Voltar' : 'Anterior'}
          </Button>
          
          {activeStep === steps.length - 1 ? (
            <Button
              variant="contained"
              color="primary"
              onClick={handleSubmit}
              disabled={!canProceedToNextStep() || isProcessing}
              sx={{ 
                width: isMobile ? '100%' : 'auto',
                backgroundColor: '#1976d2'
              }}
            >
              {isProcessing ? 'Processando...' : 'Enviar Documentos'}
            </Button>
          ) : (
            <Button
              variant="contained"
              color="primary"
              onClick={handleNext}
              disabled={!canProceedToNextStep()}
              sx={{ 
                width: isMobile ? '100%' : 'auto',
                backgroundColor: '#1976d2'
              }}
            >
              Próximo
            </Button>
          )}
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

export default RenovacaoTRUpload; 