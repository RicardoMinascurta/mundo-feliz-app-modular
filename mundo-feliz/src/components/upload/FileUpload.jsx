import React, { useState, useRef, useEffect } from 'react';
import { 
  Button, 
  Paper, 
  Typography, 
  Box, 
  CircularProgress, 
  IconButton,
  Grid 
} from '@mui/material';
import FileUploadIcon from '@mui/icons-material/FileUpload';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import DeleteIcon from '@mui/icons-material/Delete';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import ImageIcon from '@mui/icons-material/Image';

const FileUpload = ({
  label,
  accept = "application/pdf,image/jpeg,image/png",
  onFileSelect,
  onError,
  fileInfo = {},
  disabled = false,
  required = false,
  multiple = false
}) => {
  const [dragActive, setDragActive] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [filePreview, setFilePreview] = useState(null);
  const fileInputRef = useRef(null);

  // Efeito para gerar preview se tivermos um arquivo
  useEffect(() => {
    if (fileInfo?.file && (fileInfo.file.type.startsWith('image/'))) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setFilePreview(e.target.result);
      };
      reader.readAsDataURL(fileInfo.file);
    } else {
      setFilePreview(null);
    }
  }, [fileInfo?.file]);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (disabled) return;
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      if (multiple) {
        const files = Array.from(e.dataTransfer.files);
        handleFiles(files);
      } else {
        handleFiles(e.dataTransfer.files[0]);
      }
    }
  };

  const handleFileChange = (e) => {
    if (disabled) return;
    
    if (e.target.files && e.target.files.length > 0) {
      if (multiple) {
        const files = Array.from(e.target.files);
        handleFiles(files);
      } else {
        handleFiles(e.target.files[0]);
      }
    }
  };

  const handleFiles = (files) => {
    try {
      setIsLoading(true);
      
      // Verificar os arquivos
      if (Array.isArray(files)) {
        // Para múltiplos arquivos
        const oversized = files.filter(file => file.size > 10 * 1024 * 1024);
        if (oversized.length > 0) {
          throw new Error('Um ou mais arquivos são muito grandes (máximo 10MB)');
        }
      } else {
        // Para arquivo único
        if (files.size > 10 * 1024 * 1024) {
          throw new Error('O arquivo é muito grande (máximo 10MB)');
        }
      }
      
      onFileSelect(files);
    } catch (error) {
      if (onError) {
        onError(error.message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleButtonClick = () => {
    if (disabled) return;
    fileInputRef.current.click();
  };

  const getFileIcon = () => {
    if (fileInfo?.file) {
      if (fileInfo.file.type.startsWith('image/')) {
        return <ImageIcon sx={{ fontSize: 40, color: '#4caf50' }} />;
      } else if (fileInfo.file.type === 'application/pdf') {
        return <PictureAsPdfIcon sx={{ fontSize: 40, color: '#f44336' }} />;
      }
    }
    return <FileUploadIcon sx={{ fontSize: 40, color: '#2196f3' }} />;
  };

  const handleRemoveFile = (e) => {
    e.stopPropagation();
    onFileSelect(null);
    setFilePreview(null);
  };

  return (
    <Paper
      elevation={0}
      variant="outlined"
      sx={{
        p: 2,
        borderRadius: 1,
        borderStyle: 'dashed',
        borderWidth: '1px',
        borderColor: dragActive ? '#2196f3' : fileInfo?.error ? '#f44336' : fileInfo?.uploaded ? '#4caf50' : '#e0e0e0',
        backgroundColor: dragActive ? 'rgba(33, 150, 243, 0.04)' : '#ffffff',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.7 : 1,
        transition: 'all 0.2s'
      }}
      onDragEnter={handleDrag}
      onDragLeave={handleDrag}
      onDragOver={handleDrag}
      onDrop={handleDrop}
      onClick={handleButtonClick}
    >
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        style={{ display: 'none' }}
        accept={accept}
        disabled={disabled}
        multiple={multiple}
      />

      <Box sx={{ 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        justifyContent: 'center',
        minHeight: '120px'
      }}>
        {isLoading ? (
          <CircularProgress size={40} />
        ) : fileInfo?.uploaded && !fileInfo?.error ? (
          <Box sx={{ position: 'relative', width: '100%', textAlign: 'center' }}>
            <CheckCircleIcon color="success" sx={{ fontSize: 40, mb: 1 }} />
            
            {filePreview ? (
              <Box sx={{ mt: 2, position: 'relative', width: '100%', maxWidth: '200px', margin: '0 auto' }}>
                <img 
                  src={filePreview} 
                  alt="Preview" 
                  style={{ 
                    width: '100%', 
                    maxHeight: '120px', 
                    objectFit: 'contain',
                    borderRadius: '4px'
                  }} 
                />
              </Box>
            ) : getFileIcon()}
            
            <Typography variant="body2" sx={{ mt: 1, fontWeight: 'medium', color: 'text.primary' }}>
              {multiple && Array.isArray(fileInfo?.files) 
                ? `${fileInfo.files.length} arquivo(s) selecionado(s)` 
                : fileInfo?.file?.name || 'Arquivo carregado'}
            </Typography>
            
            {!disabled && (
              <IconButton 
                size="small" 
                onClick={handleRemoveFile} 
                sx={{ 
                  position: 'absolute',
                  top: -8,
                  right: -8,
                  backgroundColor: '#f5f5f5',
                  '&:hover': { backgroundColor: '#e0e0e0' }
                }}
              >
                <DeleteIcon fontSize="small" />
              </IconButton>
            )}
          </Box>
        ) : fileInfo?.error ? (
          <>
            <ErrorIcon color="error" sx={{ fontSize: 40, mb: 1 }} />
            <Typography variant="body2" color="error">
              {fileInfo.errorMessage || 'Erro ao carregar o arquivo'}
            </Typography>
          </>
        ) : (
          <>
            <FileUploadIcon sx={{ fontSize: 40, color: '#9e9e9e', mb: 1 }} />
            <Typography variant="body1" sx={{ mb: 0.5, color: 'text.primary' }}>
              {label || 'Adicionar Arquivo'}
              {required && <span style={{ color: '#f44336' }}> *</span>}
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary', textAlign: 'center' }}>
              {multiple 
                ? 'Arraste e solte vários arquivos ou clique para selecionar' 
                : 'Arraste e solte um arquivo ou clique para selecionar'}
            </Typography>
            <Typography variant="caption" sx={{ mt: 1, color: 'text.secondary' }}>
              Formatos aceitos: {accept.split(',').join(', ')}
            </Typography>
          </>
        )}
      </Box>
    </Paper>
  );
};

export default FileUpload; 