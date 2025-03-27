import React, { useRef } from 'react';
import { Box, Typography, Paper } from '@mui/material';
import EditorSimples from './EditorSimples';

const TemplateEmail = ({ tipo, nome, processo }) => {
  const editorRef = useRef(null);
  
  // Função para formatar o tipo de processo para exibição
  const formatarTipoProcesso = (tipo) => {
    if (!tipo) return '';
    
    // Substituir CamelCase por espaços
    return tipo
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, (str) => str.toUpperCase());
  };
  
  return (
    <Box className="template-email-container" sx={{ width: '100%' }}>
      <Typography variant="subtitle1" gutterBottom>
        Template de Email para {formatarTipoProcesso(tipo)}
      </Typography>
      
      <Paper elevation={1} sx={{ p: 2, mb: 2 }}>
        <EditorSimples ref={editorRef} />
      </Paper>
      
      <Typography variant="caption" color="textSecondary">
        A tabela acima pode ser editada diretamente. As alterações serão preservadas ao enviar o email.
      </Typography>
    </Box>
  );
};

export default TemplateEmail; 