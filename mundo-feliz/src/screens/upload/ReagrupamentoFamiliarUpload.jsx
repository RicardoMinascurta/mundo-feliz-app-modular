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
  Tabs,
  Tab,
  useMediaQuery 
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { useNavigate, useParams } from 'react-router-dom';
import DocumentUploader from '../../components/upload/DocumentUploader';
import SignaturePad from '../../components/upload/SignaturePad';
import useUpload from '../../hooks/useUpload';
import { uploadService } from '../../services/uploadService';
import FamilyRestroomIcon from '@mui/icons-material/FamilyRestroom';

const ReagrupamentoFamiliarUpload = () => {
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
  } = useUpload('concessao_ReagrupamentoFamiliar', processId, uploadService);

  const [tabValue, setTabValue] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processError, setProcessError] = useState(null);
  const [selectedFamilyMember, setSelectedFamilyMember] = useState('conjuge');
  const [uploadError, setUploadError] = useState(null);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

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
        tipoProcesso: 'ReagrupamentoFamiliar',
        tipoDocumento: 'Reagrupamento',
        documentos: uploadState.documents,
        assinatura: uploadState.signature ? true : false,
        dadosExtraidos: processResult.extractedData || {},
        arquivosUpload: processResult.uploadedFiles || [],
        prompt: processResult.prompt
      };
      
      // Submeter documentos
      const response = await submitDocuments(dadosProcesso);
      
      if (response.success) {
        console.log("➡️ UPLOAD-SUBMIT: Navegando para página de detalhes do processo");
        navigate(`/processo/${response.processId}`);
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
    // Verificar documentos requeridos do requerente
    const requiredRequerente = ['trRequerente', 'passportRequerente', 'fotoRequerente'];
    const requerenteComplete = requiredRequerente.every(doc => uploadState.documents[doc]?.uploaded);
    
    // Verificar documentos requeridos do familiar
    const requiredFamiliar = ['passportFamiliar', 'fotoFamiliar', 'comprovativoParentesco'];
    const familiarComplete = requiredFamiliar.every(doc => uploadState.documents[doc]?.uploaded);
    
    return requerenteComplete && familiarComplete && uploadState.signature && !isProcessing;
  };

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Paper elevation={3} sx={{ p: 3, borderRadius: 2, backgroundColor: 'white' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 3 }}>
          <FamilyRestroomIcon sx={{ fontSize: 36, color: '#1976d2', mr: 1 }} />
          <Typography variant="h4" align="center" sx={{ color: '#1976d2' }}>
            Upload de Documentos - Reagrupamento Familiar
          </Typography>
        </Box>
        
        <Alert severity="info" sx={{ mb: 4 }}>
          <Typography variant="body1">
            Para processos de Reagrupamento Familiar, são necessários documentos do requerente e do familiar a reagrupar:
          </Typography>
          <ul>
            <li>Documentos de identificação de ambos (passaporte, título de residência)</li>
            <li>Comprovativo do vínculo familiar (certidão de casamento, nascimento, etc.)</li>
            <li>Comprovativo de morada e meios de subsistência do requerente</li>
          </ul>
        </Alert>
        
        <Box sx={{ width: '100%', mb: 3 }}>
          <Tabs
            value={tabValue}
            onChange={handleTabChange}
            variant="fullWidth"
            indicatorColor="primary"
            textColor="primary"
            sx={{
              '& .MuiTab-root': {
                fontSize: isMobile ? '0.8rem' : '1rem',
                backgroundColor: 'rgba(25, 118, 210, 0.05)',
                borderRadius: '4px 4px 0 0',
                '&.Mui-selected': {
                  backgroundColor: 'white',
                  fontWeight: 'bold'
                }
              }
            }}
          >
            <Tab label="Requerente" />
            <Tab label="Familiar a Reagrupar" />
            <Tab label="Documentos Adicionais" />
            <Tab label="Assinatura" />
          </Tabs>
        </Box>
        
        <Box role="tabpanel" hidden={tabValue !== 0}>
          {tabValue === 0 && (
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <DocumentUploader
                  label="Título de Residência do Requerente"
                  required={true}
                  onFileSelected={(file) => handleFileSelected('trRequerente', file)}
                  fileUploaded={uploadState.documents['trRequerente']?.uploaded}
                  error={uploadState.documents['trRequerente']?.error}
                  errorMessage={uploadState.documents['trRequerente']?.errorMessage}
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <DocumentUploader
                  label="Passaporte do Requerente"
                  required={true}
                  onFileSelected={(file) => handleFileSelected('passportRequerente', file)}
                  fileUploaded={uploadState.documents['passportRequerente']?.uploaded}
                  error={uploadState.documents['passportRequerente']?.error}
                  errorMessage={uploadState.documents['passportRequerente']?.errorMessage}
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <DocumentUploader
                  label="Foto do Requerente"
                  required={true}
                  acceptedTypes="image/jpeg,image/png"
                  onFileSelected={(file) => handleFileSelected('fotoRequerente', file)}
                  fileUploaded={uploadState.documents['fotoRequerente']?.uploaded}
                  error={uploadState.documents['fotoRequerente']?.error}
                  errorMessage={uploadState.documents['fotoRequerente']?.errorMessage}
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <DocumentUploader
                  label="Comprovativo de Morada"
                  required={true}
                  onFileSelected={(file) => handleFileSelected('comprovativoMorada', file)}
                  fileUploaded={uploadState.documents['comprovativoMorada']?.uploaded}
                  error={uploadState.documents['comprovativoMorada']?.error}
                  errorMessage={uploadState.documents['comprovativoMorada']?.errorMessage}
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
          )}
        </Box>
        
        <Box role="tabpanel" hidden={tabValue !== 1}>
          {tabValue === 1 && (
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <DocumentUploader
                  label="Passaporte do Familiar"
                  required={true}
                  onFileSelected={(file) => handleFileSelected('passportFamiliar', file)}
                  fileUploaded={uploadState.documents['passportFamiliar']?.uploaded}
                  error={uploadState.documents['passportFamiliar']?.error}
                  errorMessage={uploadState.documents['passportFamiliar']?.errorMessage}
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <DocumentUploader
                  label="Foto do Familiar"
                  required={true}
                  acceptedTypes="image/jpeg,image/png"
                  onFileSelected={(file) => handleFileSelected('fotoFamiliar', file)}
                  fileUploaded={uploadState.documents['fotoFamiliar']?.uploaded}
                  error={uploadState.documents['fotoFamiliar']?.error}
                  errorMessage={uploadState.documents['fotoFamiliar']?.errorMessage}
                />
              </Grid>
              
              <Grid item xs={12}>
                <DocumentUploader
                  label="Comprovativo de Parentesco"
                  required={true}
                  onFileSelected={(file) => handleFileSelected('comprovativoParentesco', file)}
                  fileUploaded={uploadState.documents['comprovativoParentesco']?.uploaded}
                  error={uploadState.documents['comprovativoParentesco']?.error}
                  errorMessage={uploadState.documents['comprovativoParentesco']?.errorMessage}
                />
                <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', mt: 1 }}>
                  Exemplos: certidão de casamento, certidão de nascimento, declaração de união de facto, etc.
                </Typography>
              </Grid>
            </Grid>
          )}
        </Box>
        
        <Box role="tabpanel" hidden={tabValue !== 2}>
          {tabValue === 2 && (
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Alert severity="info" sx={{ mb: 2 }}>
                  <Typography variant="body2">
                    Adicione documentos complementares conforme o seu caso específico:
                  </Typography>
                </Alert>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <DocumentUploader
                  label="Autorização de Residência anterior (se aplicável)"
                  required={false}
                  onFileSelected={(file) => handleFileSelected('arAnterior', file)}
                  fileUploaded={uploadState.documents['arAnterior']?.uploaded}
                  error={uploadState.documents['arAnterior']?.error}
                  errorMessage={uploadState.documents['arAnterior']?.errorMessage}
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <DocumentUploader
                  label="Seguro de Saúde do Familiar"
                  required={false}
                  onFileSelected={(file) => handleFileSelected('seguroSaude', file)}
                  fileUploaded={uploadState.documents['seguroSaude']?.uploaded}
                  error={uploadState.documents['seguroSaude']?.error}
                  errorMessage={uploadState.documents['seguroSaude']?.errorMessage}
                />
              </Grid>
              
              <Grid item xs={12}>
                <DocumentUploader
                  label="Outros Documentos Relevantes"
                  required={false}
                  onFileSelected={(file) => handleFileSelected('outrosDocumentos', file)}
                  fileUploaded={uploadState.documents['outrosDocumentos']?.uploaded}
                  error={uploadState.documents['outrosDocumentos']?.error}
                  errorMessage={uploadState.documents['outrosDocumentos']?.errorMessage}
                />
              </Grid>
            </Grid>
          )}
        </Box>
        
        <Box role="tabpanel" hidden={tabValue !== 3}>
          {tabValue === 3 && (
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
          )}
        </Box>
        
        <Divider sx={{ my: 3 }} />
        
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          mt: 2,
          flexDirection: isMobile ? 'column' : 'row',
          gap: isMobile ? 2 : 0
        }}>
          <Button
            variant="outlined"
            color="primary"
            onClick={tabValue === 0 ? handleBack : () => setTabValue(tabValue - 1)}
            sx={{ 
              width: isMobile ? '100%' : 'auto',
              borderColor: '#1976d2', 
              color: '#1976d2'
            }}
          >
            {tabValue === 0 ? 'Voltar' : 'Anterior'}
          </Button>
          
          {tabValue === 3 ? (
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
          ) : (
            <Button
              variant="contained"
              color="primary"
              onClick={() => setTabValue(tabValue + 1)}
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

export default ReagrupamentoFamiliarUpload; 