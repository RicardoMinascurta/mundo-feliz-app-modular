import React from 'react';
import { Box, Typography, Paper, Chip } from '@mui/material';
import { Assignment, DateRange, Person } from '@mui/icons-material';
import { formatDate } from '../../utils/dateUtils';
import { getNestedValue, processTemplate, extrairTipoProcesso } from '../../utils/processUtils';
import processoConfig from '../../config/processoConfig';

const InfoProcesso = ({ processo }) => {
  if (!processo) {
    return (
      <Paper elevation={2} sx={{ p: 2, mb: 2 }}>
        <Typography variant="body1">Nenhum processo selecionado</Typography>
      </Paper>
    );
  }
  
  // Extrair o tipo de processo e obter a configuração correspondente
  const tipoProcesso = extrairTipoProcesso(processo.processId);
  const config = processoConfig[tipoProcesso] || processoConfig.default;
  
  // Processar templates para exibição
  const resumo = processTemplate(config.templates.resumo, processo);
  const detalhes = processTemplate(config.templates.detalhes, processo);
  
  return (
    <Paper elevation={2} sx={{ p: 2, mb: 2 }}>
      <Box mb={2}>
        <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
          <Assignment sx={{ mr: 1 }} color="primary" />
          {config.titulo}
        </Typography>
        
        <Chip 
          label={tipoProcesso || 'Desconhecido'} 
          size="small" 
          color="primary" 
          variant="outlined" 
          sx={{ mr: 1 }} 
        />
        
        <Chip 
          label={`Status: ${processo.status || 'Em Processamento'}`} 
          size="small" 
          color={processo.status === 'Concluído' ? 'success' : 'warning'} 
          sx={{ mr: 1 }} 
        />
        
        {processo.dataCriacao && (
          <Chip 
            icon={<DateRange fontSize="small" />} 
            label={`Criado em: ${formatDate(processo.dataCriacao)}`} 
            size="small" 
            variant="outlined" 
          />
        )}
      </Box>
      
      <Box mb={2}>
        <Typography variant="body1" gutterBottom>
          {resumo}
        </Typography>
        
        <Typography variant="body2" color="text.secondary">
          {detalhes}
        </Typography>
      </Box>
      
      <Box sx={{ 
        backgroundColor: 'background.default', 
        p: 1.5, 
        borderRadius: 1, 
        mb: 2,
        display: 'flex',
        alignItems: 'center'
      }}>
        <Person fontSize="small" color="action" sx={{ mr: 1 }} />
        <Typography variant="body2" color="text.secondary">
          Responsável: {processo.responsavel || 'Não atribuído'}
        </Typography>
      </Box>
      
      {processo.observacoes && (
        <Box>
          <Typography variant="subtitle2" gutterBottom>
            Observações
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {processo.observacoes}
          </Typography>
        </Box>
      )}
    </Paper>
  );
};

export default InfoProcesso; 