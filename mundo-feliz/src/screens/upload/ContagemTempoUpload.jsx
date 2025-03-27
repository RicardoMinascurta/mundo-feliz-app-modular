import React, { useState } from 'react';
import { 
  Container, 
  Typography, 
  Paper, 
  Button, 
  Grid, 
  Box, 
  Alert,
  useMediaQuery 
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { useNavigate, useParams } from 'react-router-dom';
import DocumentUploader from '../../components/upload/DocumentUploader';
import SignaturePad from '../../components/upload/SignaturePad';
import useUpload from '../../hooks/useUpload';
import { uploadService } from '../../services/uploadService';
import HelpIcon from '@mui/icons-material/Help';

const ContagemTempoUpload = () => {
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
  } = useUpload('contagem_ContagemTempo', processId, uploadService);

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
        tipoProcesso: 'ContagemTempo',
        tipoDocumento: 'ContagemTempo',
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
    // Verificar se os documentos obrigatórios foram carregados
    const requiredDocs = ['passportAll', 'residence', 'fotoTipo'];
    const allRequired = requiredDocs.every(doc => uploadState.documents[doc]?.uploaded);
    return allRequired && uploadState.signature && !isProcessing;
  };

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Paper elevation={3} sx={{ p: 3, borderRadius: 2, backgroundColor: 'white' }}>
        <Typography variant="h4" gutterBottom align="center" sx={{ mb: 3, color: '#1976d2' }}>
          Upload de Documentos - Contagem de Tempo
        </Typography>
        
        <Alert severity="info" sx={{ mb: 4 }}>
          <Typography variant="body1">
            Para processos de Contagem de Tempo para Residência Permanente, são necessários:
          </Typography>
          <ul>
            <li>Passaporte (todas as páginas com carimbos de entrada/saída)</li>
            <li>Autorização de Residência atual</li>
            <li>Foto tipo passe recente</li>
          </ul>
        </Alert>
        
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
            
            <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
              <HelpIcon fontSize="small" sx={{ mr: 0.5 }} />
              Inclua todas as páginas do passaporte com carimbos de entrada e saída de Portugal.
            </Typography>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <DocumentUploader
              label="Autorização de Residência Atual"
              required={true}
              onFileSelected={(file) => handleFileSelected('residence', file)}
              fileUploaded={uploadState.documents['residence']?.uploaded}
              error={uploadState.documents['residence']?.error}
              errorMessage={uploadState.documents['residence']?.errorMessage}
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

export default ContagemTempoUpload; 