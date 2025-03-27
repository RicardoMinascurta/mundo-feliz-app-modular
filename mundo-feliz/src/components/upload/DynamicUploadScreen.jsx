import React from 'react';
import BaseUploadScreen from './BaseUploadScreen';
import uploadConfigs from '../../config/UploadConfig';
import { useParams, useNavigate } from 'react-router-dom';
import { CircularProgress, Container, Typography, Button, Box } from '@mui/material';

const DynamicUploadScreen = () => {
  const { processType, processId } = useParams();
  const navigate = useNavigate();
  
  // Verificar se o tipo de processo é suportado
  if (!processType || !uploadConfigs[processType]) {
    return (
      <Container maxWidth="sm" sx={{ py: 5, textAlign: 'center' }}>
        <Typography variant="h5" color="error" gutterBottom>
          Tipo de processo não suportado
        </Typography>
        <Typography variant="body1" paragraph>
          O tipo de processo "{processType}" não está configurado para upload de documentos.
        </Typography>
        <Button 
          variant="contained" 
          color="primary"
          onClick={() => navigate('/dashboard')}
        >
          Voltar para o Dashboard
        </Button>
      </Container>
    );
  }
  
  // Verificar se o ID do processo está presente
  if (!processId) {
    return (
      <Container maxWidth="sm" sx={{ py: 5, textAlign: 'center' }}>
        <Typography variant="h5" color="error" gutterBottom>
          ID do processo não fornecido
        </Typography>
        <Typography variant="body1" paragraph>
          É necessário um ID de processo válido para continuar.
        </Typography>
        <Button 
          variant="contained" 
          color="primary"
          onClick={() => navigate('/dashboard')}
        >
          Voltar para o Dashboard
        </Button>
      </Container>
    );
  }
  
  const config = uploadConfigs[processType];
  
  const handleComplete = () => {
    // Navegar para a tela de sucesso
    navigate(`/success/${processType}/${processId}`);
  };
  
  const handleBack = () => {
    // Voltar para a página anterior
    navigate(-1);
  };

  return (
    <BaseUploadScreen
      title={config.title}
      processType={processType}
      processId={processId}
      documentFields={config.documentFields}
      requireSignature={config.requireSignature}
      maxStepDocuments={config.maxStepDocuments || 3}
      onComplete={handleComplete}
      onBack={handleBack}
    />
  );
};

export default DynamicUploadScreen; 