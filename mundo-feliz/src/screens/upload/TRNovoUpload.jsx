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
import ArticleIcon from '@mui/icons-material/Article';

const TRNovoUpload = () => {
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
  } = useUpload('concessao_TR_Novo', processId, uploadService);

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
      
      // Processar documentos com OCR e GPT
      console.log("Iniciando processamento de documentos...");
      const processResult = await processDocuments();
      
      if (!processResult || !processResult.success) {
        console.error("Erro no processamento:", processResult?.error);
        setProcessError(processResult?.error || 'Falha ao processar documentos');
        setIsProcessing(false);
        return;
      }
      
      console.log("Dados extraídos:", processResult.extractedData);
      
      // Preparar dados do processo com os dados reais extraídos
      const dadosProcesso = {
        tipoProcesso: 'TRNovo',
        tipoDocumento: 'TRNovo',
        processId: processId,
        documentos: uploadState.documents,
        assinatura: uploadState.signature ? true : false,
        dadosExtraidos: {
          ocr: processResult.extractedData?.ocr || {},
          gpt: processResult.extractedData?.gpt || {},
          campos: processResult.extractedData?.gpt || {},
          promptUsed: processResult.prompt
        },
        arquivosUpload: processResult.uploadedFiles || []
      };
      
      console.log("Enviando dados do processo:", dadosProcesso);
      
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
    // Simplificar a verificação - apenas verificar se tem documentos e assinatura
    console.log("Estado atual para submissão upload:", {
      passaporte: !!uploadState.documents.passport?.uploaded,
      assinatura: !!uploadState.signature
    });
    
    // Verificação simplificada para ativar o botão
    return !!uploadState.documents.passport?.uploaded && !!uploadState.signature;
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Paper elevation={3} sx={{ p: 3, borderRadius: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <ArticleIcon color="primary" sx={{ fontSize: 28, mr: 1 }} />
          <Typography variant="h5" component="h1" color="primary">
            Upload de Documentos - TR (NOVO)
          </Typography>
        </Box>
        
        <Divider sx={{ mb: 3 }} />
        
        <Typography variant="body1" paragraph>
          Carregue os documentos necessários para o processo de Concessão de TR (NOVO).
        </Typography>
        
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Box sx={{ mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                Documentos Necessários
              </Typography>
              
              <DocumentUploader
                label="Passaporte (obrigatório)"
                required={true}
                onFileSelected={(file) => handleFileSelected('passport', file)}
                fileUploaded={uploadState.documents.passport?.uploaded}
                error={uploadState.documents.passport?.error}
                errorMessage={uploadState.documents.passport?.errorMessage}
              />
            </Box>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Box sx={{ mb: 3 }}>
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
            </Box>
          </Grid>
        </Grid>
        
        {processError && (
          <Alert severity="error" sx={{ mt: 2, mb: 2 }}>
            {processError}
          </Alert>
        )}
        
        {uploadError && (
          <Alert severity="error" sx={{ mt: 2, mb: 2 }}>
            {uploadError}
          </Alert>
        )}
        
        <Box sx={{ mt: 4, display: 'flex', justifyContent: 'space-between' }}>
          <Button
            variant="outlined"
            onClick={handleBack}
            disabled={isProcessing}
          >
            Voltar
          </Button>
          
          <Button
            variant="contained"
            color="primary"
            onClick={handleSubmit}
            disabled={!uploadState.documents.passport?.uploaded || !uploadState.signature}
            sx={{ 
              bgcolor: '#1976d2',
              '&:hover': { bgcolor: '#1565c0' },
              '&.Mui-disabled': { 
                bgcolor: '#e0e0e0', 
                color: '#ababab' 
              }
            }}
          >
            {isProcessing ? 'PROCESSANDO...' : 'ENVIAR DOCUMENTOS'}
          </Button>
        </Box>
      </Paper>
    </Container>
  );
};

export default TRNovoUpload; 