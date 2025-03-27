import React, { useState, useEffect } from 'react';
import { 
  Button, 
  Box, 
  Typography, 
  Paper, 
  CircularProgress 
} from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import VisibilityIcon from '@mui/icons-material/Visibility';
import SaveIcon from '@mui/icons-material/Save';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useNavigate } from 'react-router-dom';

/**
 * Componente para exportar os dados do processo para JSON
 * @param {Object} props Propriedades do componente
 * @param {string} props.processId ID do processo
 * @param {Object} props.data Dados a serem exportados (opcional)
 * @param {function} props.onBack Função chamada ao clicar em Voltar
 */
const ProcessoJsonExporter = ({ processId, data, onBack }) => {
  const [processoData, setProcessoData] = useState(data || null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  
  useEffect(() => {
    if (window._processData && window._processData[processId]) {
      setProcessoData(window._processData[processId]);
    }
  }, [processId]);
  
  const handleExportJson = () => {
    try {
      if (!processoData) {
        setError('Não há dados para exportar');
        return;
      }
      
      // Formatar para visualização mais clara
      const exportData = {
        processId,
        timestamp: new Date().toISOString(),
        ocr: {
          documentos: processoData.ocrResults ? Object.keys(processoData.ocrResults).length : 0,
          resultados: processoData.ocrResults || {}
        },
        gpt: {
          prompt: processoData.gptPrompt || {},
          resultado: processoData.gptResults || {}
        },
        dadosExtraidos: processoData.gptResults?.extractedData || null
      };
      
      // Criar arquivo para download
      const dataStr = JSON.stringify(exportData, null, 2);
      const blob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = `processo_${processId}_${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      
      // Limpar
      setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }, 100);
      
      console.log(`Dados do processo ${processId} exportados para JSON`);
    } catch (error) {
      setError(`Erro ao exportar: ${error.message}`);
      console.error('Erro ao exportar dados para JSON:', error);
    }
  };
  
  const handleViewData = () => {
    localStorage.setItem(`_debug_processo_${processId}`, JSON.stringify(processoData));
    window.open(`/debug/view/${processId}`, '_blank');
  };
  
  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      navigate(-1);
    }
  };

  return (
    <Paper elevation={3} sx={{ p: 3, mb: 3, borderRadius: 2, backgroundColor: 'white' }}>
      <Typography variant="h6" gutterBottom>
        Exportar Dados do Processo
      </Typography>
      
      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}>
          <CircularProgress size={30} />
        </Box>
      )}
      
      {error && (
        <Typography color="error" sx={{ mb: 2 }}>
          {error}
        </Typography>
      )}
      
      <Box sx={{ mt: 2, mb: 1 }}>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          ID do Processo: <strong>{processId}</strong>
        </Typography>
        
        <Typography variant="body2" color="text.secondary">
          Status dos Dados: {processoData ? (
            <span style={{ color: 'green' }}>Disponíveis para exportação</span>
          ) : (
            <span style={{ color: 'red' }}>Não disponíveis</span>
          )}
        </Typography>
      </Box>
      
      <Box sx={{ display: 'flex', gap: 2, mt: 3 }}>
        <Button
          variant="outlined"
          startIcon={<ArrowBackIcon />}
          onClick={handleBack}
        >
          Voltar
        </Button>
        
        <Button
          variant="contained"
          color="primary"
          startIcon={<DownloadIcon />}
          onClick={handleExportJson}
          disabled={!processoData}
        >
          Exportar JSON
        </Button>
        
        <Button
          variant="outlined"
          color="info"
          startIcon={<VisibilityIcon />}
          onClick={handleViewData}
          disabled={!processoData}
        >
          Visualizar Dados
        </Button>
      </Box>
    </Paper>
  );
};

export default ProcessoJsonExporter; 