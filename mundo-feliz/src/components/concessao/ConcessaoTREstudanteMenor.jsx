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
import ChildCareIcon from '@mui/icons-material/ChildCare';
import DocumentUploader from '../upload/DocumentUploader';
import SignaturePad from '../upload/SignaturePad';
import useUpload from '../../hooks/useUpload';
import { uploadService } from '../../services/uploadService';
import { useNavigate, useParams } from 'react-router-dom';

const ConcessaoTREstudanteMenor = ({ selectedPerson, onBack, onSuccess }) => {
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
    'Concessão TR Estudante Menor', 
    processId || selectedPerson?.id || personId || 'unknown'
  );

  const [isProcessing, setIsProcessing] = useState(false);
  const [processResult, setProcessResult] = useState(null);
  const [processError, setProcessError] = useState(null);

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
      const novoId = `ConcessaoTREstudanteMenor-${timestamp}-${randomHex}`;
      
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
    
    // Log para debug
    console.log("Iniciando processamento do TR Estudante Menor com processId:", validProcessId);
    
    setIsProcessing(true);
    setProcessError(null);
    
    try {
      // Primeiro, processar os documentos com OCR e GPT
      const processResult = await processDocuments();
      
      if (!processResult || !processResult.success) {
        throw new Error(processResult?.error || 'Falha ao processar documentos');
      }
      
      // Obter dados da pessoa
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
      
      // Preparar os dados completos para envio
      const dadosProcesso = {
        tipoProcesso: 'ConcessaoTREstudanteMenor',
        tipoDocumento: 'TREstudanteMenor',
        processId: validProcessId,
        documentos: uploadState.documents,
        assinatura: uploadState.signature ? true : false,
        dadosExtraidos: processResult.extractedData || {
          nomeCompleto: personName,
          nacionalidade: personData?.nacionalidade || 'N/A',
          dataNascimento: personData?.dataNascimento || 'N/A',
          numeroDocumento: personData?.documento || 'N/A',
          dataValidade: 'N/A',
          sexo: 'N/A',
          nomeResponsavelLegal: 'N/A',
          numeroDocumentoResponsavel: 'N/A',
          dataValidadeResponsavel: 'N/A'
        },
        arquivosUpload: processResult.uploadedFiles || [],
        prompt: processResult.prompt
      };
      
      // Log para debugging antes de enviar
      console.log("Enviando dados do processo TR Estudante Menor:", {
        processId: dadosProcesso.processId,
        tipoProcesso: dadosProcesso.tipoProcesso,
        temAssinatura: dadosProcesso.assinatura
      });
      
      // Em seguida, enviar os documentos para o servidor
      const uploadResult = await submitDocuments(dadosProcesso);
      
      if (!uploadResult || !uploadResult.success) {
        throw new Error(uploadResult?.error || 'Falha ao enviar documentos');
      }
      
      // Incluir os dados extraídos do GPT
      const resultado = {
        success: true,
        extractedData: dadosProcesso.dadosExtraidos
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
    // Log para debugging
    console.log("Estado dos documentos para TR Estudante Menor:", {
      passport: uploadState.documents.passport?.uploaded,
      parentDocument: uploadState.documents.parentDocument?.uploaded,
      schoolDocument: uploadState.documents.schoolDocument?.uploaded,
      signature: !!uploadState.signature,
      isProcessing
    });
    
    // Verificar requisitos mínimos (passaporte, documento do responsável, documento escolar e assinatura)
    return uploadState.documents.passport?.uploaded && 
           uploadState.documents.parentDocument?.uploaded &&
           uploadState.documents.schoolDocument?.uploaded &&
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
                Dados do Menor:
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2">
                    <strong>Nome:</strong> {processResult.extractedData.nomeCompleto || 'N/A'}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2">
                    <strong>Número do Documento:</strong> {processResult.extractedData.numeroDocumento || 'N/A'}
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
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2">
                    <strong>Data de Validade:</strong> {processResult.extractedData.dataValidade || 'N/A'}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2">
                    <strong>Sexo:</strong> {processResult.extractedData.sexo || 'N/A'}
                  </Typography>
                </Grid>
              </Grid>
              
              <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
                Dados do Responsável:
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2">
                    <strong>Nome:</strong> {processResult.extractedData.nomeResponsavelLegal || 'N/A'}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2">
                    <strong>Número do Documento:</strong> {processResult.extractedData.numeroDocumentoResponsavel || 'N/A'}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2">
                    <strong>Data de Validade:</strong> {processResult.extractedData.dataValidadeResponsavel || 'N/A'}
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
            <ChildCareIcon sx={{ mr: 1, verticalAlign: 'middle', color: '#1976d2' }} />
            Concessão de TR para Estudante Menor
          </Typography>
        </Box>
        
        {processError && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {processError}
          </Alert>
        )}
        
        <Typography variant="body1" paragraph sx={{ color: 'text.secondary' }}>
          Por favor, carregue os documentos necessários para a concessão de Título de Residência para Estudante Menor.
        </Typography>
        
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <DocumentUploader
              label="Passaporte do Menor"
              required={true}
              onFileSelected={(file) => handleFileSelected('passport', file)}
              fileUploaded={uploadState.documents.passport?.uploaded}
              error={uploadState.documents.passport?.error}
              errorMessage={uploadState.documents.passport?.errorMessage}
            />
          </Grid>
          
          <Grid item xs={12}>
            <DocumentUploader
              label="Documento do Responsável"
              required={true}
              onFileSelected={(file) => handleFileSelected('parentDocument', file)}
              fileUploaded={uploadState.documents.parentDocument?.uploaded}
              error={uploadState.documents.parentDocument?.error}
              errorMessage={uploadState.documents.parentDocument?.errorMessage}
            />
          </Grid>
          
          <Grid item xs={12}>
            <DocumentUploader
              label="Documento Escolar (obrigatório)"
              required={true}
              onFileSelected={(file) => handleFileSelected('schoolDocument', file)}
              fileUploaded={uploadState.documents.schoolDocument?.uploaded}
              error={uploadState.documents.schoolDocument?.error}
              errorMessage={uploadState.documents.schoolDocument?.errorMessage}
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

export default ConcessaoTREstudanteMenor; 