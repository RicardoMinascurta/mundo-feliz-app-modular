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
import AssignmentIcon from '@mui/icons-material/Assignment';
import DocumentUploader from '../upload/DocumentUploader';
import SignaturePad from '../upload/SignaturePad';
import useUpload from '../../hooks/useUpload';
import { uploadService } from '../../services/uploadService';
import { useNavigate, useParams } from 'react-router-dom';

const ConcessaoTR2 = ({ selectedPerson, onBack, onSuccess }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const navigate = useNavigate();
  const params = useParams();
  const personId = params.personId;
  
  // Usar um único estado para o ID do processo
  const [processId, setProcessId] = useState(params.processId || null);
  
  const {
    uploadState,
    updateDocument,
    updateSignature,
    setDocumentError,
    submitDocuments,
    resetUploadState,
    processDocuments
  } = useUpload(
    uploadService, 
    'ConcessaoTR2', 
    processId || selectedPerson?.id || personId || 'unknown'
  );

  const [isProcessing, setIsProcessing] = useState(false);
  const [processResult, setProcessResult] = useState(null);
  const [processError, setProcessError] = useState(null);

  // Função para verificar o formato do ID e gerar um novo se necessário
  const gerarProcessId = async () => {
    // Verificar se o ID atual existe e se está no formato correto
    const formatoValido = processId && /^[A-Za-z]+-\d+-[0-9a-f]+$/.test(processId);
    
    if (!formatoValido) {
      if (processId) {
        console.log(`ID de processo existente com formato incorreto: ${processId}`);
      }
      console.log('Tentando gerar novo ID com formato correto...');
      
      try {
        const response = await fetch('/api/gerar-processid', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ tipoProcesso: 'ConcessaoTR2' }),
        });
        
        if (!response.ok) {
          throw new Error('Falha ao gerar ID de processo');
        }
        
        const result = await response.json();
        console.log(`Novo processo ID gerado com sucesso: ${result.processId}`);
        setProcessId(result.processId);
        return result.processId;
      } catch (error) {
        console.error('Erro ao gerar processId:', error);
        setProcessError('Não foi possível iniciar o processo. Tente novamente.');
        return null;
      }
    }
    
    return processId;
  };

  // Inicialização - garantir que temos um processId válido
  useEffect(() => {
    const inicializarProcesso = async () => {
      // Gerar ou validar o ID do processo
      const validProcessId = await gerarProcessId();
      console.log(`ProcessId atualizado no componente: ${validProcessId}`);
      
      if (validProcessId) {
        console.log(`Upload habilitado com ID válido: ${validProcessId}`);
      }
    };
    
    inicializarProcesso();
  }, []);

  const handleFileSelected = async (file) => {
    try {
      if (!file) {
        console.error('Arquivo indefinido');
        return;
      }
      
      const fieldName = 'passport'; // Sabemos que é o único campo de arquivo que temos
      
      if (file.size > 10 * 1024 * 1024) {
        setDocumentError(fieldName, 'O ficheiro é muito grande. Tamanho máximo permitido: 10MB');
        return;
      }
      
      updateDocument(fieldName, file);
    } catch (error) {
      console.error(`Erro ao processar o ficheiro:`, error);
      setDocumentError('passport', 'Erro ao processar o ficheiro. Tente novamente.');
    }
  };

  const handleSubmit = async () => {
    // Garantir que temos um ID de processo válido antes de submeter
    const validProcessId = await gerarProcessId();
    if (!validProcessId) {
      setProcessError('ID do processo não disponível. Tente recarregar a página.');
      return;
    }
    
    setIsProcessing(true);
    setProcessError(null);
    
    try {
      // Primeiro, processar os documentos com OCR e GPT
      const processResult = await processDocuments();
      
      if (!processResult || !processResult.success) {
        throw new Error(processResult?.error || 'Falha ao processar documentos');
      }
      
      // Em seguida, enviar os documentos para o servidor
      const uploadResult = await submitDocuments({
        processId: validProcessId,
        tipoProcesso: 'ConcessaoTR2',
        tipoDocumento: 'TR2',
        // Garantindo a estrutura correta dos dados extraídos para o servidor
        dadosExtraidos: {
          ocr: processResult.extractedData?.ocr || {},
          gpt: processResult.extractedData?.gpt || {},
          campos: {
            ...processResult.extractedData?.gpt || {},
            ...processResult.extractedData?.campos || {}
          }
        }
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
      
      // Incluir os dados extraídos do GPT
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
    return uploadState.documents.passport?.uploaded && 
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
        sx={{ mb: 2 }}
      >
        Voltar
      </Button>

      <Paper elevation={3} sx={{ p: 3, borderRadius: 2, backgroundColor: 'white' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <AssignmentIcon sx={{ fontSize: 32, mr: 2, color: '#1976d2' }} />
          <Typography variant="h5">
            TR2 - Título de Residência
          </Typography>
        </Box>

        <Divider sx={{ mb: 3 }} />

        {processError && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {processError}
          </Alert>
        )}

        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" gutterBottom>
            Passaporte
          </Typography>
          <DocumentUploader
            fieldName="passport"
            label="Passaporte"
            acceptedTypes="image/*,.pdf"
            onFileSelected={handleFileSelected}
            uploadState={uploadState}
            instruction="Envie uma foto clara do passaporte"
          />
        </Box>

        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" gutterBottom>
            Assinatura
          </Typography>
          <SignaturePad 
            onSignatureChange={updateSignature}
            existingSignature={uploadState.signature}
          />
        </Box>

        <Button
          variant="contained"
          color="primary"
          fullWidth
          disabled={!canSubmit()}
          onClick={handleSubmit}
          sx={{ 
            mt: 3, 
            py: 1.5,
            backgroundColor: '#1976d2',
            '&:hover': {
              backgroundColor: '#1565c0',
            },
            '&.Mui-disabled': {
              backgroundColor: '#e0e0e0',
            }
          }}
        >
          {isProcessing ? 'Processando...' : 'Enviar Documentos'}
        </Button>
      </Paper>
    </Container>
  );
};

export default ConcessaoTR2; 