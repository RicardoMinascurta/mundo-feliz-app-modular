import React, { useState, useRef, useEffect } from 'react';
import { Button, Grid, Paper, Typography, Box, CircularProgress, Stack, IconButton } from '@mui/material';
import FileUploadIcon from '@mui/icons-material/FileUpload';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import CameraAltIcon from '@mui/icons-material/CameraAlt';
import PhotoLibraryIcon from '@mui/icons-material/PhotoLibrary';
import DeleteIcon from '@mui/icons-material/Delete';

const DocumentUploader = ({ 
  label, 
  onFileSelected, 
  required = false,
  acceptedTypes = "application/pdf,image/jpeg,image/png",
  fileUploaded = false,
  error = false,
  errorMessage = "Erro ao carregar o ficheiro",
  successMessage = "Documento carregado com sucesso",
  multipleFiles = false,
  fieldName
}) => {
  const [dragActive, setDragActive] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [filePreview, setFilePreview] = useState(null);
  const [internalFileUploaded, setInternalFileUploaded] = useState(fileUploaded);
  const [internalError, setInternalError] = useState(error);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);
  
  // Sincronizar estados internos com props externas
  useEffect(() => {
    setInternalFileUploaded(fileUploaded);
    setInternalError(error);
  }, [fileUploaded, error]);
  
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      if (multipleFiles) {
        // Processar todos os arquivos
        Array.from(e.dataTransfer.files).forEach(async (file) => {
          await handleFile(file);
        });
      } else {
        await handleFile(e.dataTransfer.files[0]);
      }
    }
  };

  const handleChange = async (e) => {
    // Limpar o estado de erro ao tentar novamente
    setInternalError(false);
    
    if (e.target.files && e.target.files.length > 0) {
      if (multipleFiles) {
        // Processar todos os arquivos
        Array.from(e.target.files).forEach(async (file) => {
          await handleFile(file);
        });
      } else {
        await handleFile(e.target.files[0]);
      }
    }
  };

  const handleFile = async (file) => {
    setIsLoading(true);
    setInternalError(false); // Resetar erro ao iniciar nova tentativa
    
    try {
      // Verificar tamanho do arquivo (limitado a 10MB)
      if (file.size > 10 * 1024 * 1024) {
        setInternalError(true);
        if (onFileSelected) {
          onFileSelected(null, new Error("O ficheiro é muito grande. Tamanho máximo permitido: 10MB"));
        }
        return;
      }
      
      // Verificar tipo do arquivo
      const fileType = file.type.toLowerCase();
      
      // Verificar se acceptedTypes é uma string
      const typesList = typeof acceptedTypes === 'string' 
        ? acceptedTypes.split(',')
        : (Array.isArray(acceptedTypes) ? acceptedTypes : ['image/*', '.pdf']);
        
      const isAcceptedType = typesList.some(type => {
        const typePattern = String(type).trim().toLowerCase().replace('*', '.*');
        return fileType.match(typePattern);
      });
      
      if (!isAcceptedType) {
        setInternalError(true);
        if (onFileSelected) {
          onFileSelected(null, new Error("Tipo de ficheiro não suportado. Formatos aceites: PDF, JPG, PNG"));
        }
        return;
      }
      
      // Criar preview e controlar arquivos
      if (multipleFiles) {
        // Gerar ID único para o arquivo
        const fileId = Date.now() + '_' + Math.random().toString(36).substring(2, 9);
        
        // Criar preview para o arquivo, se for imagem
        let preview = null;
        if (file.type.startsWith('image/')) {
          const reader = new FileReader();
          preview = await new Promise((resolve) => {
            reader.onload = (e) => resolve(e.target.result);
            reader.readAsDataURL(file);
          });
        }
        
        // Adicionar à lista de arquivos
        const newFile = {
          id: fileId,
          file: file,
          preview: preview,
          name: file.name
        };
        
        setUploadedFiles(prev => [...prev, newFile]);
        
        // Chamar callback com todos os arquivos
        if (onFileSelected) {
          const allFiles = [...uploadedFiles, newFile].map(f => f.file);
          await onFileSelected(allFiles);
        }
        
      } else {
        // Modo único arquivo - comportamento original
        if (file.type.startsWith('image/')) {
          const reader = new FileReader();
          reader.onload = (e) => {
            setFilePreview(e.target.result);
          };
          reader.readAsDataURL(file);
        } else {
          setFilePreview(null);
        }
        
        // Chamar callback com arquivo válido
        if (onFileSelected) {
          await onFileSelected(file);
        }
      }
      
      setInternalFileUploaded(true);
    } catch (error) {
      console.error("Erro ao processar ficheiro:", error);
      setInternalError(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveFile = (e, fileId) => {
    if (e) e.stopPropagation(); // Impedir propagação do evento se for chamado por evento
    
    if (multipleFiles && fileId) {
      // Remover apenas o arquivo específico
      const updatedFiles = uploadedFiles.filter(file => file.id !== fileId);
      setUploadedFiles(updatedFiles);
      
      // Atualizar estado de upload geral
      if (updatedFiles.length === 0) {
        setInternalFileUploaded(false);
      }
      
      // Chamar callback com a lista atualizada
      if (onFileSelected) {
        if (updatedFiles.length > 0) {
          onFileSelected(updatedFiles.map(f => f.file));
        } else {
          onFileSelected(null);
        }
      }
    } else {
      // Remover único arquivo - comportamento original
      setFilePreview(null);
      setInternalFileUploaded(false);
      setInternalError(false);
      
      // Reset dos inputs
      if (fileInputRef.current) fileInputRef.current.value = '';
      if (cameraInputRef.current) cameraInputRef.current.value = '';
      
      if (onFileSelected) {
        onFileSelected(null);
      }
    }
  };

  // Função para tentar novamente após erro
  const handleRetry = () => {
    setInternalError(false);
    
    // Limpar inputs para permitir selecionar o mesmo arquivo novamente
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (cameraInputRef.current) cameraInputRef.current.value = '';
  };

  return (
    <Paper 
      elevation={3}
      sx={{
        backgroundColor: dragActive ? 'rgba(25, 118, 210, 0.08)' : internalError ? 'rgba(244, 67, 54, 0.05)' : 'white',
        border: dragActive ? '2px dashed #1976d2' : internalError ? '2px dashed #f44336' : internalFileUploaded ? '2px dashed #4caf50' : '2px dashed #ccc',
        padding: 3,
        textAlign: 'center',
        marginBottom: 2,
        borderRadius: 2,
        transition: 'all 0.3s ease'
      }}
      onDragEnter={handleDrag}
      onDragLeave={handleDrag}
      onDragOver={handleDrag}
      onDrop={handleDrop}
    >
      <input
        type="file"
        id={`file-upload-${label ? label.replace(/\s+/g, '-').toLowerCase() : fieldName}`}
        accept={acceptedTypes}
        onChange={handleChange}
        style={{ display: 'none' }}
        ref={fileInputRef}
        multiple={multipleFiles}
      />
      
      <input
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleChange}
        style={{ display: 'none' }}
        ref={cameraInputRef}
        multiple={multipleFiles}
      />
      
      <Box sx={{ minHeight: 120, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
        {isLoading ? (
          <CircularProgress size={40} sx={{ marginBottom: 2 }} />
        ) : internalFileUploaded ? (
          <>
            {multipleFiles ? (
              // Exibir múltiplos arquivos
              <Box sx={{ width: '100%', mb: 2 }}>
                {uploadedFiles.length > 0 && (
                  <Grid container spacing={2} justifyContent="center">
                    {uploadedFiles.map(file => (
                      <Grid item key={file.id} xs={12} sm={6} md={4}>
                        <Box sx={{ position: 'relative' }}>
                          {file.preview ? (
                            <img 
                              src={file.preview} 
                              alt={file.name}
                              style={{ 
                                width: '100%', 
                                maxHeight: '120px',
                                objectFit: 'contain',
                                borderRadius: '4px',
                                border: '1px solid #e0e0e0'
                              }}
                            />
                          ) : (
                            <Box 
                              sx={{ 
                                bgcolor: 'grey.100', 
                                p: 2, 
                                borderRadius: 1, 
                                textAlign: 'center',
                                display: 'flex',
                                flexDirection: 'column',
                                justifyContent: 'center',
                                minHeight: '100px',
                                border: '1px solid #e0e0e0'
                              }}
                            >
                              <FileUploadIcon color="action" sx={{ mx: 'auto', mb: 1 }} />
                              <Typography variant="caption" noWrap>
                                {file.name}
                              </Typography>
                            </Box>
                          )}
                          <IconButton 
                            size="small"
                            color="error"
                            onClick={(e) => handleRemoveFile(e, file.id)}
                            sx={{ 
                              position: 'absolute',
                              top: 5,
                              right: 5,
                              bgcolor: 'rgba(255,255,255,0.8)'
                            }}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Box>
                      </Grid>
                    ))}
                  </Grid>
                )}
                <Button 
                  variant="outlined" 
                  color="primary" 
                  size="small" 
                  startIcon={<FileUploadIcon />}
                  onClick={() => fileInputRef.current.click()}
                  sx={{ mt: 2 }}
                >
                  Adicionar mais documentos
                </Button>
              </Box>
            ) : (
              // Exibir único arquivo
              filePreview && filePreview.startsWith('data:image') ? (
                <Box sx={{ position: 'relative', mb: 2, width: '100%', maxWidth: '250px' }}>
                  <img 
                    src={filePreview} 
                    alt="Prévia do documento"
                    style={{ 
                      width: '100%', 
                      maxHeight: '200px',
                      objectFit: 'contain',
                      borderRadius: '4px',
                      border: '1px solid #e0e0e0'
                    }}
                  />
                  <IconButton 
                    size="small"
                    color="error"
                    onClick={handleRemoveFile}
                    sx={{ 
                      position: 'absolute',
                      top: 5,
                      right: 5,
                      bgcolor: 'rgba(255,255,255,0.8)'
                    }}
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Box>
              ) : (
                <Box sx={{ position: 'relative', mb: 2 }}>
                  <CheckCircleIcon color="success" sx={{ fontSize: 40, marginBottom: 2 }} />
                  <IconButton 
                    size="small"
                    color="error"
                    onClick={handleRemoveFile}
                    sx={{ 
                      position: 'absolute',
                      top: -10,
                      right: -25,
                    }}
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Box>
              )
            )}
            <Typography variant="body2" color="success.main">{successMessage}</Typography>
          </>
        ) : internalError ? (
          <>
            <ErrorIcon color="error" sx={{ fontSize: 40, marginBottom: 2 }} />
            <Typography variant="body2" color="error" gutterBottom>{errorMessage}</Typography>
            
            <Grid container spacing={1} justifyContent="center" sx={{ mt: 1 }}>
              <Grid item>
                <Button 
                  component="label" 
                  htmlFor={`file-upload-${label ? label.replace(/\s+/g, '-').toLowerCase() : fieldName}`}
                  variant="contained" 
                  color="primary"
                  size="small"
                  onClick={handleRetry}
                >
                  Tentar novamente
                </Button>
              </Grid>
            </Grid>
          </>
        ) : (
          <FileUploadIcon color="primary" sx={{ fontSize: 40, marginBottom: 2 }} />
        )}
        
        <Typography variant="h6" gutterBottom>
          {label} {required && <span style={{ color: '#f44336' }}>*</span>}
        </Typography>
        
        {internalFileUploaded || internalError ? null : (
          <>
            <Typography variant="body2" color="text.secondary">
              Arraste e solte {multipleFiles ? 'seus ficheiros' : 'o seu ficheiro'} aqui ou
            </Typography>
            
            <Grid container spacing={1} justifyContent="center" sx={{ mt: 1 }}>
              <Grid item>
                <Button 
                  component="label" 
                  htmlFor={`file-upload-${label ? label.replace(/\s+/g, '-').toLowerCase() : fieldName}`}
                  variant="contained" 
                  color="primary"
                  size="small"
                  startIcon={<FileUploadIcon />}
                >
                  Selecionar {multipleFiles ? 'ficheiros' : 'ficheiro'}
                </Button>
              </Grid>
              <Grid item>
                <Button
                  variant="contained"
                  color="secondary"
                  size="small"
                  startIcon={<CameraAltIcon />}
                  onClick={() => cameraInputRef.current.click()}
                >
                  Tirar foto
                </Button>
              </Grid>
              <Grid item>
                <Button
                  variant="contained"
                  color="info"
                  size="small"
                  startIcon={<PhotoLibraryIcon />}
                  onClick={() => fileInputRef.current.click()}
                >
                  Galeria
                </Button>
              </Grid>
            </Grid>
            
            <Typography variant="caption" color="text.secondary" sx={{ marginTop: 1 }}>
              Formatos aceites: PDF, JPG, PNG
            </Typography>
          </>
        )}
      </Box>
    </Paper>
  );
};

export default DocumentUploader; 