import React, { useState, useEffect } from 'react';
import { 
  Container, 
  Typography, 
  Paper, 
  Box, 
  Button, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  CircularProgress
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import DownloadIcon from '@mui/icons-material/Download';
import { jsonData } from '../../services';

const DataViewer = () => {
  const [processos, setProcessos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    const fetchProcessos = async () => {
      try {
        setLoading(true);
        const data = await jsonData.listProcessos();
        setProcessos(data || []);
      } catch (err) {
        console.error('Erro ao carregar processos:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    
    fetchProcessos();
  }, []);
  
  const formatDate = (dateString) => {
    try {
      if (!dateString) return 'N/A';
      const date = new Date(dateString);
      return date.toLocaleString('pt-PT');
    } catch (e) {
      return dateString || 'N/A';
    }
  };
  
  const exportToJson = (processo) => {
    const dataStr = JSON.stringify(processo, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `processo_${processo.id}_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    
    URL.revokeObjectURL(url);
  };
  
  const exportAllToJson = () => {
    const dataStr = JSON.stringify(processos, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `todos_processos_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    
    URL.revokeObjectURL(url);
  };
  
  const renderJSONData = (data) => {
    if (!data) return <Typography color="text.secondary">Sem dados</Typography>;
    
    if (typeof data === 'object') {
      return (
        <Box sx={{ ml: 2 }}>
          {Object.entries(data).map(([key, value]) => (
            <Box key={key} sx={{ mb: 1 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                {key}:
              </Typography>
              {typeof value === 'object' && value !== null 
                ? renderJSONData(value)
                : <Typography variant="body2">{String(value)}</Typography>}
            </Box>
          ))}
        </Box>
      );
    }
    
    return <Typography variant="body2">{String(data)}</Typography>;
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4, textAlign: 'center' }}>
        <CircularProgress />
        <Typography variant="h6" sx={{ mt: 2 }}>
          Carregando dados...
        </Typography>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Typography variant="h5" color="error" gutterBottom>
          Erro ao carregar dados
        </Typography>
        <Typography color="error">{error}</Typography>
      </Container>
    );
  }

  if (processos.length === 0) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Typography variant="h5" gutterBottom>
          Visualizador de Dados
        </Typography>
        <Paper sx={{ p: 3, borderRadius: 2, backgroundColor: 'white' }}>
          <Typography variant="body1">
            Nenhum processo encontrado no IndexedDB.
          </Typography>
        </Paper>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h5" gutterBottom>
        Visualizador de Dados do IndexedDB
      </Typography>
      
      <Paper sx={{ p: 3, borderRadius: 2, backgroundColor: 'white', mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h6">
            Processos Armazenados: {processos.length}
          </Typography>
          <Button 
            variant="contained" 
            color="primary" 
            startIcon={<DownloadIcon />}
            onClick={exportAllToJson}
          >
            Exportar Todos para JSON
          </Button>
        </Box>
        
        {processos.map((processo) => (
          <Accordion key={processo.id} sx={{ mb: 2 }}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                <Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                    {processo.type} - {processo.id}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Status: <strong>{processo.status}</strong> | 
                    Criado em: {formatDate(processo.createdAt)} | 
                    Atualizado em: {formatDate(processo.updatedAt)}
                  </Typography>
                </Box>
                <Button 
                  variant="outlined" 
                  size="small" 
                  startIcon={<DownloadIcon />}
                  onClick={(e) => {
                    e.stopPropagation();
                    exportToJson(processo);
                  }}
                  sx={{ ml: 2 }}
                >
                  Exportar
                </Button>
              </Box>
            </AccordionSummary>
            <AccordionDetails>
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle1" gutterBottom>
                  Dados Extraídos:
                </Typography>
                {processo.dadosExtraidos ? (
                  renderJSONData(processo.dadosExtraidos)
                ) : (
                  <Typography color="text.secondary">
                    Nenhum dado extraído disponível
                  </Typography>
                )}
              </Box>
              
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle1" gutterBottom>
                  Documentos:
                </Typography>
                {processo.documents ? (
                  <TableContainer component={Paper} variant="outlined" sx={{ mb: 2 }}>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Tipo</TableCell>
                          <TableCell>Caminho</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {Object.entries(processo.documents).map(([key, path]) => (
                          <TableRow key={key}>
                            <TableCell>{key}</TableCell>
                            <TableCell>{path}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                ) : (
                  <Typography color="text.secondary">
                    Nenhum documento disponível
                  </Typography>
                )}
              </Box>
              
              <Box>
                <Typography variant="subtitle1" gutterBottom>
                  Histórico:
                </Typography>
                {processo.history && processo.history.length > 0 ? (
                  <TableContainer component={Paper} variant="outlined">
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Data/Hora</TableCell>
                          <TableCell>Ação</TableCell>
                          <TableCell>Detalhes</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {processo.history.map((item, index) => (
                          <TableRow key={index}>
                            <TableCell>{formatDate(item.timestamp)}</TableCell>
                            <TableCell>{item.action}</TableCell>
                            <TableCell>
                              {item.changes ? (
                                Array.isArray(item.changes) 
                                  ? item.changes.join(', ') 
                                  : String(item.changes)
                              ) : 'N/A'}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                ) : (
                  <Typography color="text.secondary">
                    Nenhum histórico disponível
                  </Typography>
                )}
              </Box>
            </AccordionDetails>
          </Accordion>
        ))}
      </Paper>
    </Container>
  );
};

export default DataViewer; 