import React from 'react';
import { 
  Box, 
  Paper, 
  Typography, 
  Grid, 
  Divider 
} from '@mui/material';
import InfoIcon from '@mui/icons-material/Info';

const ProcessoInfo = ({ data, title, sx = {} }) => {
  if (!data) return null;

  const isObject = (item) => {
    return item && typeof item === 'object' && !Array.isArray(item);
  };

  const renderValue = (value) => {
    if (value === null || value === undefined) {
      return 'N/A';
    } else if (typeof value === 'boolean') {
      return value ? 'Sim' : 'Não';
    } else if (Array.isArray(value)) {
      return value.join(', ') || 'N/A';
    } else {
      return String(value) || 'N/A';
    }
  };

  const renderDataItem = (label, value, key) => {
    return (
      <Grid item xs={12} sm={6} key={key}>
        <Box sx={{ mb: 1 }}>
          <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 'medium' }}>
            {label}:
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.primary' }}>
            {renderValue(value)}
          </Typography>
        </Box>
      </Grid>
    );
  };

  const renderNestedObject = (obj, prefix = '') => {
    return Object.entries(obj).map(([key, value]) => {
      const label = prefix ? `${prefix} - ${key}` : key;
      
      // Se for um objeto, renderizar recursivamente
      if (isObject(value) && !key.toLowerCase().includes('data') && !key.toLowerCase().includes('date')) {
        return renderNestedObject(value, label);
      }
      
      // Humanizar o nome da chave
      const humanizedKey = key
        .replace(/([A-Z])/g, ' $1')
        .replace(/^./, (str) => str.toUpperCase())
        .replace(/_/g, ' ');
      
      return renderDataItem(humanizedKey, value, `${prefix}-${key}`);
    });
  };

  return (
    <Paper 
      elevation={1} 
      sx={{ 
        p: 2, 
        borderRadius: 1, 
        backgroundColor: '#f5f5f5', 
        ...sx 
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <InfoIcon color="primary" sx={{ mr: 1 }} />
        <Typography variant="h6" sx={{ color: 'text.primary' }}>
          {title || 'Informações do Processo'}
        </Typography>
      </Box>

      <Divider sx={{ mb: 2 }} />
      
      <Grid container spacing={2}>
        {isObject(data) ? (
          renderNestedObject(data)
        ) : (
          <Grid item xs={12}>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              Nenhum dado disponível
            </Typography>
          </Grid>
        )}
      </Grid>
    </Paper>
  );
};

export default ProcessoInfo; 