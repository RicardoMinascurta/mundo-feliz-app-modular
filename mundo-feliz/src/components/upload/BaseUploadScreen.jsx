import React, { useState, useEffect } from 'react';
import { 
  Container, 
  Typography, 
  Paper, 
  Button, 
  Grid, 
  Box, 
  Stepper, 
  Step, 
  StepLabel,
  CircularProgress,
  Alert,
  Divider,
  useMediaQuery
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import DocumentUploader from './DocumentUploader';
import SignaturePad from './SignaturePad';
import useUpload from '../../hooks/useUpload';
import { uploadService } from '../../services/uploadService';
import { jsonData } from '../../services';
import { logger } from '../../services/LoggerService';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import SendIcon from '@mui/icons-material/Send';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

const BaseUploadScreen = ({
  title,
  processType,
  processId,
  documentFields = [],
  requireSignature = true,
  maxStepDocuments = 3,
  onComplete,
  onBack,
  selectedPerson
}) => {
  const [activeStep, setActiveStep] = useState(0);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  const {
    uploadState,
    updateDocument,
    updateSignature,
    setDocumentError,
    submitDocuments,
    resetUploadState
  } = useUpload(uploadService, processType, processId);

  // Efeito para vincular a pessoa do Notion quando o componente é montado
  useEffect(() => {
    const linkNotionPerson = async () => {
      if (selectedPerson && processId) {
        logger.info('Iniciando vinculação de pessoa do Notion ao processo:', {
          processId,
          personId: selectedPerson.id,
          personName: selectedPerson.name,
          databaseId: selectedPerson.databaseId
        });

        try {
          logger.debug('Dados da pessoa do Notion:', {
            id: selectedPerson.id,
            name: selectedPerson.name,
            databaseId: selectedPerson.databaseId,
            path: selectedPerson.path,
            properties: selectedPerson.properties
          });

          const result = await jsonData.linkNotionPerson(processId, selectedPerson.id, {
            name: selectedPerson.name,
            databaseId: selectedPerson.databaseId,
            path: selectedPerson.path,
            properties: selectedPerson.properties
          });

          logger.info('Pessoa do Notion vinculada com sucesso:', {
            processId,
            personId: selectedPerson.id,
            result
          });
        } catch (error) {
          logger.error('Erro ao vincular pessoa do Notion:', {
            processId,
            personId: selectedPerson.id,
            error: error.message,
            stack: error.stack
          });
          console.error('Erro ao vincular pessoa do Notion:', error);
        }
      } else {
        logger.warn('Tentativa de vincular pessoa do Notion sem dados necessários:', {
          hasSelectedPerson: !!selectedPerson,
          processId
        });
      }
    };

    linkNotionPerson();
  }, [selectedPerson, processId]);

  // Dividir os documentos em etapas para melhorar a experiência do usuário
  const documentSteps = [];
  for (let i = 0; i < documentFields.length; i += maxStepDocuments) {
    documentSteps.push(documentFields.slice(i, i + maxStepDocuments));
  }

  // Total de etapas (documentos + assinatura + conclusão)
  const totalSteps = documentSteps.length + (requireSignature ? 1 : 0) + 1;

  // Determinar se todos os documentos na etapa atual estão preenchidos
  const areCurrentDocumentsComplete = () => {
    if (activeStep < documentSteps.length) {
      const currentStepDocs = documentSteps[activeStep];
      
      return currentStepDocs.every(field => {
        if (!field.required) return true;
        return uploadState.documents[field.name]?.uploaded;
      });
    }
    
    if (activeStep === documentSteps.length && requireSignature) {
      return !!uploadState.signature;
    }
    
    return true;
  };

  const handleNext = () => {
    if (activeStep < totalSteps - 1) {
      setActiveStep(prevStep => prevStep + 1);
    }
  };

  const handleBack = () => {
    if (activeStep > 0) {
      setActiveStep(prevStep => prevStep - 1);
    } else if (onBack) {
      onBack();
    }
  };

  const handleSubmit = async () => {
    const success = await submitDocuments();
    if (success && onComplete) {
      onComplete();
    }
  };

  const handleFileSelected = async (fieldName, file) => {
    try {
      // Verificar tamanho do arquivo (max 10MB)
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

  // Renderizar o conteúdo da etapa atual
  const renderStepContent = () => {
    // Etapas de documentos
    if (activeStep < documentSteps.length) {
      const currentStepDocs = documentSteps[activeStep];
      
      return (
        <Grid container spacing={3}>
          {currentStepDocs.map((field) => (
            <Grid item xs={12} md={field.fullWidth ? 12 : 6} key={field.name}>
              <DocumentUploader
                label={field.label}
                required={field.required}
                acceptedTypes={field.acceptedTypes || "application/pdf,image/jpeg,image/png"}
                onFileSelected={(file) => handleFileSelected(field.name, file)}
                fileUploaded={uploadState.documents[field.name]?.uploaded}
                error={uploadState.documents[field.name]?.error}
                errorMessage={uploadState.documents[field.name]?.errorMessage || "Erro ao carregar o ficheiro"}
              />
            </Grid>
          ))}
        </Grid>
      );
    }
    
    // Etapa de assinatura
    if (activeStep === documentSteps.length && requireSignature) {
      return (
        <Box width="100%">
          <Typography variant="h6" gutterBottom>
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
    }
    
    // Etapa de revisão e envio
    if (activeStep === totalSteps - 1) {
      return (
        <Box width="100%">
          <Typography variant="h6" gutterBottom>
            Revisão e Envio
          </Typography>
          
          <Alert severity="info" sx={{ mb: 3 }}>
            Verifique se todos os documentos foram carregados corretamente antes de enviar.
          </Alert>
          
          <Typography variant="subtitle1" gutterBottom>
            Documentos:
          </Typography>
          
          <Box sx={{ mb: 3 }}>
            {documentFields.map((field) => (
              <Box 
                key={field.name} 
                sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  mb: 1 
                }}
              >
                <CheckCircleIcon 
                  color={uploadState.documents[field.name]?.uploaded ? "success" : "disabled"} 
                  sx={{ mr: 1 }} 
                />
                <Typography>
                  {field.label} {field.required && <span style={{ color: '#f44336' }}>*</span>}
                </Typography>
              </Box>
            ))}
          </Box>
          
          {requireSignature && (
            <>
              <Typography variant="subtitle1" gutterBottom>
                Assinatura:
              </Typography>
              <Box 
                sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  mb: 3 
                }}
              >
                <CheckCircleIcon 
                  color={uploadState.signature ? "success" : "disabled"} 
                  sx={{ mr: 1 }} 
                />
                <Typography>
                  Assinatura {requireSignature && <span style={{ color: '#f44336' }}>*</span>}
                </Typography>
              </Box>
            </>
          )}
          
          <Button
            variant="contained"
            color="primary"
            startIcon={<SendIcon />}
            size="large"
            fullWidth
            onClick={handleSubmit}
            disabled={uploadState.isUploading || !areCurrentDocumentsComplete()}
          >
            {uploadState.isUploading ? (
              <>
                <CircularProgress size={24} sx={{ mr: 1, color: 'white' }} />
                Enviando...
              </>
            ) : 'Enviar Documentos'}
          </Button>
          
          {uploadState.uploadError && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {uploadState.errorMessage}
            </Alert>
          )}
        </Box>
      );
    }
    
    return null;
  };

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Paper elevation={3} sx={{ p: 3, borderRadius: 2 }}>
        <Typography variant="h4" gutterBottom align="center" sx={{ mb: 3 }}>
          {title}
        </Typography>
        
        <Stepper activeStep={activeStep} alternativeLabel sx={{ mb: 4 }}>
          {documentSteps.map((_, index) => (
            <Step key={`doc-step-${index}`}>
              <StepLabel>Documentos {index + 1}</StepLabel>
            </Step>
          ))}
          
          {requireSignature && (
            <Step key="signature-step">
              <StepLabel>Assinatura</StepLabel>
            </Step>
          )}
          
          <Step key="review-step">
            <StepLabel>Revisão</StepLabel>
          </Step>
        </Stepper>
        
        <Divider sx={{ mb: 3 }} />
        
        {renderStepContent()}
        
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
          <Button
            variant="outlined"
            startIcon={<ArrowBackIcon />}
            onClick={handleBack}
          >
            {activeStep === 0 ? 'Voltar' : 'Anterior'}
          </Button>
          
          {activeStep < totalSteps - 1 ? (
            <Button
              variant="contained"
              endIcon={<ArrowForwardIcon />}
              onClick={handleNext}
              disabled={!areCurrentDocumentsComplete()}
            >
              Próximo
            </Button>
          ) : null}
        </Box>
      </Paper>
    </Container>
  );
};

export default BaseUploadScreen; 