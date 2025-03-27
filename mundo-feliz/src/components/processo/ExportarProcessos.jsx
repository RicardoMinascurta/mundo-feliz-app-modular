import React, { useState } from 'react';
import { 
  Button, 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions, 
  FormControl, 
  FormLabel, 
  RadioGroup, 
  FormControlLabel, 
  Radio, 
  Checkbox, 
  Typography, 
  Box,
  Alert,
  TextField,
  Divider
} from '@mui/material';
import { DownloadOutlined, FileDownload } from '@mui/icons-material';
import { exportarProcessos } from '../../utils/exportUtils';
import { extrairTipoProcesso } from '../../utils/processUtils';
import processoConfig from '../../config/processoConfig';

const ExportarProcessos = ({ processos = [], open, onClose }) => {
  const [formato, setFormato] = useState('csv');
  const [nomeArquivo, setNomeArquivo] = useState('processos');
  const [camposSelecionados, setCamposSelecionados] = useState({});
  const [tipoProcessoSelecionado, setTipoProcessoSelecionado] = useState('todos');
  const [mensagem, setMensagem] = useState({ tipo: '', texto: '' });
  
  // Determinar quais tipos de processo existem nos dados
  const tiposProcesso = React.useMemo(() => {
    const tipos = new Set();
    processos.forEach(processo => {
      const tipo = extrairTipoProcesso(processo.processId);
      if (tipo) tipos.add(tipo);
    });
    return ['todos', ...Array.from(tipos)];
  }, [processos]);
  
  // Obter todos os campos disponíveis baseado no tipo de processo selecionado
  const camposDisponiveis = React.useMemo(() => {
    // Se for "todos", pegar campos de todos os tipos de processo
    if (tipoProcessoSelecionado === 'todos') {
      const todosCampos = [];
      const camposUnicos = new Set();
      
      tiposProcesso.forEach(tipo => {
        if (tipo === 'todos') return;
        
        const config = processoConfig[tipo] || processoConfig.default;
        config.painelCampos.forEach(grupo => {
          grupo.campos.forEach(campo => {
            // Evitar campos duplicados
            const id = `${campo.id}`;
            if (!camposUnicos.has(id)) {
              todosCampos.push(campo);
              camposUnicos.add(id);
            }
          });
        });
      });
      
      return todosCampos;
    }
    
    // Se for um tipo específico, pegar apenas os campos desse tipo
    const config = processoConfig[tipoProcessoSelecionado] || processoConfig.default;
    return config.painelCampos.flatMap(grupo => grupo.campos);
  }, [tipoProcessoSelecionado, tiposProcesso]);
  
  // Inicializar camposSelecionados quando camposDisponiveis mudar
  React.useEffect(() => {
    const novosValores = {};
    camposDisponiveis.forEach(campo => {
      novosValores[campo.id] = camposSelecionados[campo.id] !== undefined 
        ? camposSelecionados[campo.id] 
        : true;
    });
    setCamposSelecionados(novosValores);
  }, [camposDisponiveis]);
  
  const handleFormatoChange = (e) => {
    setFormato(e.target.value);
  };
  
  const handleTipoProcessoChange = (e) => {
    setTipoProcessoSelecionado(e.target.value);
  };
  
  const handleCampoChange = (e) => {
    const { name, checked } = e.target;
    setCamposSelecionados(prev => ({
      ...prev,
      [name]: checked
    }));
  };
  
  const handleSelecionarTodos = (selecionar) => {
    const novosValores = {};
    camposDisponiveis.forEach(campo => {
      novosValores[campo.id] = selecionar;
    });
    setCamposSelecionados(novosValores);
  };
  
  const handleExportar = () => {
    try {
      // Filtrar processos pelo tipo selecionado
      const processosFiltrados = tipoProcessoSelecionado === 'todos'
        ? processos
        : processos.filter(p => extrairTipoProcesso(p.processId) === tipoProcessoSelecionado);
      
      // Filtrar campos selecionados
      const camposExportar = camposDisponiveis
        .filter(campo => camposSelecionados[campo.id])
        .map(campo => ({
          id: campo.id,
          label: campo.label
        }));
      
      if (camposExportar.length === 0) {
        setMensagem({
          tipo: 'error',
          texto: 'Selecione pelo menos um campo para exportar.'
        });
        return;
      }
      
      if (processosFiltrados.length === 0) {
        setMensagem({
          tipo: 'error',
          texto: 'Não há processos para exportar com o filtro selecionado.'
        });
        return;
      }
      
      // Realizar a exportação
      exportarProcessos(
        processosFiltrados,
        camposExportar,
        formato,
        nomeArquivo
      );
      
      setMensagem({
        tipo: 'success',
        texto: `${processosFiltrados.length} processos exportados com sucesso!`
      });
      
      // Fechar após 2 segundos
      setTimeout(() => {
        onClose();
        setMensagem({ tipo: '', texto: '' });
      }, 2000);
    } catch (error) {
      console.error('Erro ao exportar processos:', error);
      setMensagem({
        tipo: 'error',
        texto: 'Ocorreu um erro ao exportar. Tente novamente.'
      });
    }
  };
  
  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Exportar Processos</DialogTitle>
      
      <DialogContent>
        {mensagem.tipo && (
          <Alert 
            severity={mensagem.tipo}
            sx={{ mb: 2 }}
            onClose={() => setMensagem({ tipo: '', texto: '' })}
          >
            {mensagem.texto}
          </Alert>
        )}
        
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <TextField
            label="Nome do arquivo"
            value={nomeArquivo}
            onChange={(e) => setNomeArquivo(e.target.value)}
            fullWidth
            margin="normal"
            size="small"
          />
          
          <FormControl component="fieldset">
            <FormLabel component="legend">Formato de exportação</FormLabel>
            <RadioGroup 
              name="formato" 
              value={formato} 
              onChange={handleFormatoChange}
              row
            >
              <FormControlLabel 
                value="csv" 
                control={<Radio size="small" />} 
                label="CSV (Excel)" 
              />
              <FormControlLabel 
                value="json" 
                control={<Radio size="small" />} 
                label="JSON" 
              />
            </RadioGroup>
          </FormControl>
          
          <FormControl component="fieldset">
            <FormLabel component="legend">Tipo de Processo</FormLabel>
            <RadioGroup 
              name="tipoProcesso" 
              value={tipoProcessoSelecionado} 
              onChange={handleTipoProcessoChange}
              row
            >
              {tiposProcesso.map(tipo => (
                <FormControlLabel 
                  key={tipo} 
                  value={tipo} 
                  control={<Radio size="small" />} 
                  label={tipo === 'todos' ? 'Todos os tipos' : tipo} 
                />
              ))}
            </RadioGroup>
          </FormControl>
          
          <Divider />
          
          <Box>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
              <Typography variant="subtitle1">Campos a Exportar</Typography>
              <Box>
                <Button 
                  size="small" 
                  onClick={() => handleSelecionarTodos(true)} 
                  sx={{ mr: 1 }}
                >
                  Selecionar Todos
                </Button>
                <Button 
                  size="small" 
                  onClick={() => handleSelecionarTodos(false)}
                >
                  Limpar Todos
                </Button>
              </Box>
            </Box>
            
            <Box 
              display="flex" 
              flexWrap="wrap" 
              gap={1}
              maxHeight="200px"
              overflow="auto"
              p={1}
              border="1px solid"
              borderColor="divider"
              borderRadius={1}
            >
              {camposDisponiveis.map(campo => (
                <FormControlLabel
                  key={campo.id}
                  control={
                    <Checkbox
                      checked={!!camposSelecionados[campo.id]}
                      onChange={handleCampoChange}
                      name={campo.id}
                      size="small"
                    />
                  }
                  label={campo.label}
                  sx={{ 
                    width: 'calc(33% - 8px)', 
                    m: 0, 
                    '& .MuiTypography-root': { fontSize: '0.9rem' } 
                  }}
                />
              ))}
            </Box>
          </Box>
        </Box>
      </DialogContent>
      
      <DialogActions>
        <Button onClick={onClose} variant="outlined">
          Cancelar
        </Button>
        <Button 
          onClick={handleExportar} 
          variant="contained" 
          color="primary"
          startIcon={<FileDownload />}
        >
          Exportar
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ExportarProcessos; 