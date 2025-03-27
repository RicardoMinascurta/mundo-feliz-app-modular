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
import SchoolIcon from '@mui/icons-material/School';
import DocumentUploader from '../upload/DocumentUploader';
import SignaturePad from '../upload/SignaturePad';
import useUpload from '../../hooks/useUpload';
import { uploadService } from '../../services/uploadService';
import { useNavigate, useParams } from 'react-router-dom';

const ConcessaoTREstudante2 = ({ selectedPerson, onBack, onSuccess }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const navigate = useNavigate();
  const params = useParams();
  const personId = params.personId;
  
  // Estados para dados da pessoa
  const [personData, setPersonData] = useState(null);
  const [personName, setPersonName] = useState('Nome não disponível');
  
  // Usar um único estado para o ID do processo
  const [processId, setProcessId] = useState(() => {
    // Verificar se há ID persistido no sessionStorage
    const savedId = sessionStorage.getItem('currentTREstudante2ProcessId');
    return params.processId || savedId || null;
  });
  
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
    'Concessão TR Estudante 2', 
    processId || selectedPerson?.id || personId || 'unknown'
  );

  const [isProcessing, setIsProcessing] = useState(false);
  const [processResult, setProcessResult] = useState(null);
  const [processError, setProcessError] = useState(null);

  // Inicializar dados da pessoa
  useEffect(() => {
    if (selectedPerson) {
      setPersonName(selectedPerson.name || selectedPerson.nome || 'Nome não disponível');
      setPersonData(selectedPerson);
    } else if (personId) {
      try {
        const storedPerson = localStorage.getItem(`person_${personId}`);
        if (storedPerson) {
          const parsedData = JSON.parse(storedPerson);
          setPersonData(parsedData);
          setPersonName(parsedData.name || parsedData.nome || 'Nome não disponível');
        }
      } catch (e) {
        console.error('Erro ao recuperar dados da pessoa:', e);
      }
    }
  }, [selectedPerson, personId]);

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
          body: JSON.stringify({ tipoProcesso: 'ConcessaoTREstudante2' }),
        });
        
        if (!response.ok) {
          throw new Error('Falha ao gerar ID de processo');
        }
        
        const result = await response.json();
        console.log(`Novo processo ID gerado com sucesso: ${result.processId}`);
        setProcessId(result.processId);
        // Persistir o ID gerado
        sessionStorage.setItem('currentTREstudante2ProcessId', result.processId);
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
    
    setIsProcessing(true);
    setProcessError(null);
    
    try {
      console.log("Iniciando processamento de documentos...");
      
      // Primeiro, processar os documentos com OCR e GPT
      const processResponse = await processDocuments();
      
      console.log("Resposta do processamento:", processResponse);
      
      if (!processResponse || !processResponse.success) {
        throw new Error(processResponse?.error || 'Falha ao processar documentos');
      }
      
      // Construir objeto de dados para salvamento
      const dadosCompletos = {
        processId: validProcessId,
        tipoProcesso: 'ConcessaoTREstudante2',
        tipoDocumento: 'TREstudante2',
        
        // Dados DIRETAMENTE no nível principal (diferente do anterior)
        campos: {
          numeroDocumento: processResponse.extractedData?.gpt?.numeroDocumento || 'N/A',
          nomeCompleto: personName || processResponse.extractedData?.gpt?.nomeCompleto || 'N/A',
          nacionalidade: personData?.nacionalidade || processResponse.extractedData?.gpt?.nacionalidade || 'N/A',
          dataNascimento: personData?.dataNascimento || processResponse.extractedData?.gpt?.dataNascimento || 'N/A',
          dataValidade: processResponse.extractedData?.gpt?.dataValidade || 'N/A',
          sexo: processResponse.extractedData?.gpt?.sexo || 'N/A'
        },
        
        // Manter a estrutura dadosExtraidos completa também
        dadosExtraidos: processResponse.extractedData || {}
      };
      
      console.log("Enviando dados para salvamento:", JSON.stringify(dadosCompletos, null, 2));
      
      // Enviar para o servidor
      const uploadResponse = await submitDocuments(dadosCompletos);
      
      console.log("Resposta do servidor:", uploadResponse);
      
      if (!uploadResponse || !uploadResponse.success) {
        throw new Error('Falha ao enviar documentos: ' + (uploadResponse?.error || 'Erro desconhecido'));
      }
      
      // Incluir os dados extraídos do GPT
      const resultado = {
        success: true,
        extractedData: dadosCompletos.campos
      };
      
      // Definir o resultado
      setProcessResult(resultado);
      
      // Limpar o ID do sessionStorage ao concluir com sucesso
      sessionStorage.removeItem('currentTREstudante2ProcessId');
      console.log('Processo concluído com sucesso. ID removido do sessionStorage.');
      
      // Somente chamar onSuccess depois de tudo concluído
      setTimeout(() => {
        if (onSuccess) {
          onSuccess(resultado);
        }
      }, 1000);
    } catch (error) {
      console.error('Erro no processamento:', error);
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
        sx={{ mb: 2, color: '#1976d2' }}
      >
        Voltar
      </Button>
      
      <Paper elevation={3} sx={{ p: 3, borderRadius: 2, backgroundColor: 'white' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <Typography variant="h5" sx={{ flexGrow: 1 }}>
            <SchoolIcon sx={{ mr: 1, verticalAlign: 'middle', color: '#1976d2' }} />
            Concessão de TR para Estudante 2
          </Typography>
        </Box>
        
        {processError && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {processError}
          </Alert>
        )}
        
        <Typography variant="body1" paragraph sx={{ color: 'text.secondary' }}>
          Por favor, carregue os documentos necessários para a concessão de Título de Residência para Estudante.
        </Typography>
        
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <DocumentUploader
              label="Passaporte"
              required={true}
              onFileSelected={(file) => handleFileSelected('passport', file)}
              fileUploaded={uploadState.documents.passport?.uploaded}
              error={uploadState.documents.passport?.error}
              errorMessage={uploadState.documents.passport?.errorMessage}
            />
          </Grid>
          
          <Grid item xs={12} md={6}>
            <DocumentUploader
              label="Visto (opcional)"
              required={false}
              onFileSelected={(file) => handleFileSelected('visa', file)}
              fileUploaded={uploadState.documents.visa?.uploaded}
              error={uploadState.documents.visa?.error}
              errorMessage={uploadState.documents.visa?.errorMessage}
            />
          </Grid>
          
          <Grid item xs={12} md={6}>
            <DocumentUploader
              label="Comprovativo de Estudo (opcional)"
              required={false}
              onFileSelected={(file) => handleFileSelected('studyProof', file)}
              fileUploaded={uploadState.documents.studyProof?.uploaded}
              error={uploadState.documents.studyProof?.error}
              errorMessage={uploadState.documents.studyProof?.errorMessage}
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

export default ConcessaoTREstudante2; 