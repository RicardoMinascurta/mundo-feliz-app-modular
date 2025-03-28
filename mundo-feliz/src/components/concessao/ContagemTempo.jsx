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
import ScheduleIcon from '@mui/icons-material/Schedule';
import DocumentUploader from '../upload/DocumentUploader';
import SignaturePad from '../upload/SignaturePad';
import useUpload from '../../hooks/useUpload';
import { uploadService, notionService, jsonData } from '../../services';
import { useNavigate, useParams } from 'react-router-dom';

const ContagemTempo = ({ selectedPerson, onBack, onSuccess }) => {
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
    processDocuments,
    processId: useUploadProcessId
  } = useUpload(
    uploadService, 
    'Contagem de Tempo para Residência Permanente', 
    processId || selectedPerson?.id || personId || 'unknown'
  );

  const [isProcessing, setIsProcessing] = useState(false);
  const [processResult, setProcessResult] = useState(null);
  const [processError, setProcessError] = useState(null);
  const [uploadError, setUploadError] = useState(null);
  const [personData, setPersonData] = useState(null);
  const [personName, setPersonName] = useState('');

  // Função para verificar o formato do ID e gerar um novo se necessário
  const gerarProcessId = async () => {
    // Verificar se o ID atual existe e se está no formato correto
    const formatoValido = processId && /^[A-Za-z]+-\d+-[0-9a-f]+$/.test(processId);
    
    if (formatoValido) {
      console.log(`Usando ID de processo existente (válido): ${processId}`);
      return processId;
    }
    
    console.log('Tentando gerar novo ID com formato correto...');
      
    try {
      // Em vez de chamar a API, vamos gerar localmente
      const timestamp = new Date().toISOString().replace(/[-:.TZ]/g, "").substring(0, 8);
      const randomHex = Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0');
      const novoId = `ContagemTempo-${timestamp}-${randomHex}`;
      
      console.log(`Novo processo ID gerado localmente: ${novoId}`);
      setProcessId(novoId);
      
      if (navigate && !window.location.pathname.includes(novoId)) {
        const currentPath = window.location.pathname;
        let newPath;
        
        if (currentPath.endsWith('/')) {
          newPath = `${currentPath}${novoId}`;
        } else {
          const parts = currentPath.split('/');
          
          const lastPart = parts[parts.length - 1];
          if (lastPart && lastPart.includes('-')) {
            parts[parts.length - 1] = novoId;
            newPath = parts.join('/');
          } else {
            newPath = `${currentPath}/${novoId}`;
          }
        }
        
        navigate(newPath, { replace: true });
      }
      
      return novoId;
    } catch (error) {
      console.error('Erro ao gerar processId:', error);
      setProcessError('Não foi possível iniciar o processo. Tente novamente.');
      return null;
    }
  };

  useEffect(() => {
    const fetchPersonData = async () => {
      if (selectedPerson && selectedPerson.id) {
        try {
          // Carregar dados da pessoa do Notion
          const data = await notionService.getPageDetails(selectedPerson.id);
          setPersonData(data);
          setPersonName(data.nome || selectedPerson.title || 'Nome não disponível');
          
          // Gerar ou validar o ID do processo usando nossa função personalizada
          const validProcessId = await gerarProcessId();
          console.log(`ProcessId atualizado no componente: ${validProcessId}`);
          
          if (validProcessId) {
            console.log(`Upload habilitado com ID válido: ${validProcessId}`);
          }
        } catch (error) {
          console.error('Erro ao carregar dados da pessoa:', error);
          setProcessError('Erro ao carregar dados. Tente novamente.');
        }
      } else {
        // Mesmo sem dados da pessoa, precisamos de um ID válido
        await gerarProcessId();
      }
    };
    
    fetchPersonData();
  }, [selectedPerson]);

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
    const validProcessId = await gerarProcessId();
    if (!validProcessId) {
      setProcessError('ID do processo não disponível. Tente recarregar a página.');
      return;
    }
    
    try {
      setIsProcessing(true);
      setProcessError('');
      setUploadError(null);
      
      // Primeiro, processar documentos com OCR e GPT
      const processResult = await processDocuments();
      
      if (!processResult.success) {
        setProcessError(processResult.error || 'Erro ao processar documentos');
        setIsProcessing(false);
        return;
      }
      
      // Verificar se temos dados da pessoa do Notion
      if (selectedPerson && selectedPerson.id) {
        try {
          // Associar pessoa do Notion ao processo
          await jsonData.linkNotionPerson(validProcessId, selectedPerson.id, {
            nome: personName,
            notionId: selectedPerson.id
          });
        } catch (e) {
          console.error('Erro ao recuperar dados da pessoa:', e);
        }
      }

      // Depois de processar, enviar os dados para o servidor
      const dadosProcesso = {
        tipoProcesso: 'ContagemTempo',
        tipoDocumento: 'ContagemTempo',
        processId: validProcessId,
        dadosExtraidos: processResult.extractedData || {
          nomeCompleto: personName,
          numeroDocumento: personData?.documento || 'N/A',
          nacionalidade: personData?.nacionalidade || 'N/A',
          dataNascimento: personData?.dataNascimento || 'N/A'
        },
        documentos: uploadState.documents,
        assinatura: uploadState.signature ? true : false,
        arquivosUpload: processResult.uploadedFiles || [],
        prompt: processResult.prompt
      };
      
      // Submeter documentos
      const response = await submitDocuments(dadosProcesso);
      
      if (response.success) {
        // Armazenar o resultado
        setProcessResult({
          success: true,
          extractedData: dadosProcesso.dadosExtraidos
        });
        
        // Chamar a função de sucesso após 1 segundo
        setTimeout(() => {
          if (onSuccess) {
            onSuccess(dadosProcesso.dadosExtraidos);
          }
        }, 1000);
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

  const canSubmit = () => {
    return uploadState.documents.trFront?.uploaded && 
           uploadState.documents.trBack?.uploaded && 
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
            <ScheduleIcon sx={{ mr: 1, verticalAlign: 'middle', color: '#1976d2' }} />
            Contagem de Tempo para Residência Permanente
          </Typography>
        </Box>
        
        {processError && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {processError}
          </Alert>
        )}
        
        <Typography variant="body1" paragraph sx={{ color: 'text.secondary' }}>
          Por favor, carregue os documentos necessários para a contagem de tempo para residência permanente.
        </Typography>
        
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <DocumentUploader
              label="TR (Frente)"
              required={true}
              onFileSelected={(file) => handleFileSelected('trFront', file)}
              fileUploaded={uploadState.documents.trFront?.uploaded}
              error={uploadState.documents.trFront?.error}
              errorMessage={uploadState.documents.trFront?.errorMessage}
            />
          </Grid>
          
          <Grid item xs={12} md={6}>
            <DocumentUploader
              label="TR (Verso)"
              required={true}
              onFileSelected={(file) => handleFileSelected('trBack', file)}
              fileUploaded={uploadState.documents.trBack?.uploaded}
              error={uploadState.documents.trBack?.error}
              errorMessage={uploadState.documents.trBack?.errorMessage}
            />
          </Grid>
          
          <Grid item xs={12} md={6}>
            <DocumentUploader
              label="Passaporte (opcional)"
              required={false}
              onFileSelected={(file) => handleFileSelected('passport', file)}
              fileUploaded={uploadState.documents.passport?.uploaded}
              error={uploadState.documents.passport?.error}
              errorMessage={uploadState.documents.passport?.errorMessage}
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

export default ContagemTempo; 