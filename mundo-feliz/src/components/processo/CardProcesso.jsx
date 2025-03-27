import React from 'react';
import { Card, CardContent, Typography, Box, Chip, IconButton } from '@mui/material';
import { Visibility, Edit, DeleteOutline, PersonOutline } from '@mui/icons-material';
import { formatDate } from '../../utils/dateUtils';
import { processTemplate, extrairTipoProcesso } from '../../utils/processUtils';
import processoConfig from '../../config/processoConfig';

const CardProcesso = ({ processo, onView, onEdit, onDelete }) => {
  if (!processo) return null;
  
  // Extrair o tipo de processo e obter a configuração correspondente
  const tipoProcesso = extrairTipoProcesso(processo.processId);
  const config = processoConfig[tipoProcesso] || processoConfig.default;
  
  // Processar o template do cartão
  const tituloCard = processTemplate(config.templates.cartao, processo);
  
  // Extrair informações básicas do processo
  const { processId, status, dataCriacao } = processo;
  
  return (
    <Card 
      elevation={1} 
      sx={{ 
        mb: 2, 
        borderLeft: '4px solid', 
        borderLeftColor: 'primary.main',
        transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: 3
        }
      }}
    >
      <CardContent sx={{ pb: 1 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
          <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
            {tituloCard}
          </Typography>
          
          <Chip 
            label={status || 'Em Processamento'} 
            size="small" 
            color={status === 'Concluído' ? 'success' : 'warning'} 
          />
        </Box>
        
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
          ID: {processId}
        </Typography>
        
        {processo.responsavel && (
          <Box display="flex" alignItems="center" mb={1}>
            <PersonOutline fontSize="small" color="action" sx={{ mr: 0.5 }} />
            <Typography variant="body2" color="text.secondary">
              {processo.responsavel}
            </Typography>
          </Box>
        )}
        
        <Box display="flex" justifyContent="space-between" alignItems="center" mt={2}>
          <Typography variant="caption" color="text.secondary">
            {dataCriacao ? formatDate(dataCriacao) : 'Data não disponível'}
          </Typography>
          
          <Box>
            <IconButton size="small" onClick={() => onView && onView(processo)} sx={{ color: 'info.main' }}>
              <Visibility fontSize="small" />
            </IconButton>
            
            <IconButton size="small" onClick={() => onEdit && onEdit(processo)} sx={{ color: 'warning.main' }}>
              <Edit fontSize="small" />
            </IconButton>
            
            <IconButton size="small" onClick={() => onDelete && onDelete(processo)} sx={{ color: 'error.main' }}>
              <DeleteOutline fontSize="small" />
            </IconButton>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

export default CardProcesso; 