import React, { useRef, useState, useEffect } from 'react';
import { 
  Box, 
  Button, 
  Paper, 
  Typography, 
  Stack, 
  useMediaQuery,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  TextField,
  Grid
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import DeleteIcon from '@mui/icons-material/Delete';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CloseIcon from '@mui/icons-material/Close';
import EditIcon from '@mui/icons-material/Edit';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import CameraAltIcon from '@mui/icons-material/CameraAlt';
import { styled } from '@mui/material/styles';
import {
  CloudUpload as UploadIcon,
  PhotoCamera as CameraIcon,
  Save as SaveIcon,
  Edit as PenIcon,
  X as XIcon
} from '@mui/icons-material';

const SignatureContainer = styled(Paper)(({ theme, isSigned }) => ({
  padding: theme.spacing(3),
  borderRadius: theme.shape.borderRadius,
  border: isSigned ? '2px solid #4caf50' : '2px dashed #ccc',
  backgroundColor: 'white',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  position: 'relative',
  marginTop: theme.spacing(2),
  marginBottom: theme.spacing(3),
  width: '100%'
}));

// Função para processar assinaturas no momento do envio do formulário
export const processSignatureBeforeSubmit = async (signatureData, source) => {
  if (!signatureData) {
    console.error('❌ Dados da assinatura não fornecidos');
    return signatureData;
  }
  
  // Análise mais detalhada do tipo de imagem
  const isPhoto = source === 'photo' || 
                  signatureData.includes('JFIF') || 
                  signatureData.includes('/9j/');
  
  const isUpload = source === 'upload' || 
                  (signatureData.includes('data:image/') && 
                   !signatureData.includes('data:image/png;base64,iVBOR'));
  
  // Se for uma assinatura desenhada, não precisa de processamento rembg
  if (source === 'drawn' && !isPhoto && !isUpload) {
    console.log('✅ Assinatura desenhada já foi processada anteriormente');
    return signatureData;
  }

  console.log(`🔄 Processando assinatura (tipo: ${isPhoto ? 'foto' : isUpload ? 'upload' : source}) com rembg antes de enviar...`);
  
  try {
    // Selecionar o endpoint para rembg
    const endpoint = '/api/process-signature-rembg';
    
    console.log(`🌐 Usando endpoint rembg: ${endpoint}`);
    
    // Enviar a assinatura para o servidor para processamento
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        base64Data: signatureData
      })
    });
    
    if (!response.ok) {
      throw new Error(`Erro no processamento rembg: ${response.status}`);
    }
    
    const result = await response.json();
    
    if (result.success) {
      console.log('✅ Assinatura processada com sucesso antes do envio (rembg + trim)');
      return result.processedSignature;
    } else {
      throw new Error(result.error || 'Falha no processamento da assinatura com rembg');
    }
  } catch (error) {
    console.error('❌ Erro ao processar assinatura antes do envio:', error);
    // Em caso de erro, retornar a imagem original
    return signatureData;
  }
};

const SignaturePad = ({ 
  onSignatureChange, 
  initialSignature = null,
  title = "Assinatura",
  description = "Assine dentro da área abaixo",
  height = 200,
  width = '100%',
  penColor = "#0047AB", // Azul escuro como no exemplo
  backgroundColor = "#ffffff"
}) => {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);
  const [isSigned, setIsSigned] = useState(false);
  const [openModal, setOpenModal] = useState(false);
  const [tempSignature, setTempSignature] = useState(null);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  // Estado para sistema de desenho tipo Paint
  const [isDrawing, setIsDrawing] = useState(false);
  const [lines, setLines] = useState([]);
  const [currentLine, setCurrentLine] = useState([]);
  
  // Novos estados para controlar o processamento adiado
  const [originalSignatureData, setOriginalSignatureData] = useState(null);
  const [signatureSource, setSignatureSource] = useState(null); // 'drawn', 'upload', ou 'photo'
  
  useEffect(() => {
    if (initialSignature) {
      setIsSigned(true);
      setTempSignature(initialSignature);
    }
  }, [initialSignature]);

  // Efeito para lidar com a abertura/fechamento do modal de assinatura
  useEffect(() => {
    if (openModal && canvasRef.current) {
      console.log('🖋️ Modal de assinatura aberto, inicializando canvas...');
      const cleanup = initializeCanvas();
      
      return () => {
        if (cleanup) cleanup();
      };
    }
  }, [openModal]);
  
  // Efeito para redesenhar o canvas quando as linhas ou linha atual mudam
  useEffect(() => {
    if (openModal && canvasRef.current) {
      redrawCanvas();
    }
  }, [lines, currentLine, openModal]);

  // Inicializar o canvas com o tamanho correto
  const initializeCanvas = () => {
    console.log('🔄 Iniciando inicialização do canvas');
    const canvas = canvasRef.current;
    
    if (!canvas) {
      console.error('❌ Canvas não encontrado!');
      return () => {};
    }
    
    // Ajustar tamanho do canvas baseado no container
    const updateCanvasSize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
      console.log(`📐 Canvas redimensionado: ${canvas.width}x${canvas.height}`);
      
      // Redesenhar após redimensionar
      redrawCanvas();
    };

    // Atualizar tamanho quando a orientação mudar
    window.addEventListener('resize', updateCanvasSize);
    
    // Usar setTimeout para garantir que o DOM esteja pronto
    setTimeout(updateCanvasSize, 100);

    console.log('✅ Canvas inicializado com sucesso!');
    
    return () => {
      console.log('🔄 Removendo event listeners do canvas');
      window.removeEventListener('resize', updateCanvasSize);
    };
  };
  
  // Função para redesenhar todas as linhas
  const redrawCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    
    // Limpar canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Configurar estilo de desenho
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = penColor;
    
    // Função para desenhar uma única linha
    const drawLine = (line) => {
      if (line.length < 2) return;
      
      ctx.beginPath();
      ctx.moveTo(line[0].x, line[0].y);
      
      for (let i = 1; i < line.length; i++) {
        ctx.lineTo(line[i].x, line[i].y);
      }
      
      ctx.stroke();
    };
    
    // Desenhar todas as linhas salvas
    lines.forEach(drawLine);
    
    // Desenhar linha atual se existir
    if (currentLine.length > 0) {
      drawLine(currentLine);
    }
  };

  // Função para iniciar o desenho
  const startDrawing = (e) => {
    e.preventDefault();
    
    // Verificar se o canvas está com o tamanho correto
    const canvas = canvasRef.current;
    if (canvas) {
      // Verificar se as dimensões do canvas correspondem ao tamanho de exibição
      if (canvas.width !== canvas.offsetWidth || canvas.height !== canvas.offsetHeight) {
        canvas.width = canvas.offsetWidth;
        canvas.height = canvas.offsetHeight;
      }
    }
    
    setIsDrawing(true);
    
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX || e.touches?.[0]?.clientX) - rect.left;
    const y = (e.clientY || e.touches?.[0]?.clientY) - rect.top;
    
    // Verificar se temos coordenadas válidas
    if (x === undefined || y === undefined) return;
    
    // Iniciar uma nova linha
    setCurrentLine([{x, y}]);
    console.log(`🖊️ Início do desenho em (${x}, ${y})`);
  };

  // Função para desenhar
  const draw = (e) => {
    if (!isDrawing) return;
    e.preventDefault();
    
    const canvas = canvasRef.current;
    // Verificação de segurança para canvas e evento
    if (!canvas || (!e.clientX && !e.touches?.[0])) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX || e.touches?.[0]?.clientX) - rect.left;
    const y = (e.clientY || e.touches?.[0]?.clientY) - rect.top;
    
    // Verificar se temos coordenadas válidas
    if (x === undefined || y === undefined) return;
    
    // Adicionar ponto à linha atual
    setCurrentLine(prev => [...prev, {x, y}]);
  };

  // Função para finalizar o desenho
  const finishDrawing = () => {
    if (!isDrawing) return;
    
    if (currentLine.length > 1) {
      // Somente salvar se a linha tiver pelo menos 2 pontos
      setLines(prev => [...prev, [...currentLine]]);
      console.log('✏️ Linha salva com', currentLine.length, 'pontos');
    }
    
    setCurrentLine([]);
    setIsDrawing(false);
    console.log('✏️ Desenho finalizado');
  };

  // Converter DataURL para File
  const dataURLtoFile = (dataurl, filename) => {
    console.log('🔄 Convertendo DataURL para File...');
    try {
      let arr = dataurl.split(','),
          mime = arr[0].match(/:(.*?);/)[1],
          bstr = atob(arr[1]),
          n = bstr.length,
          u8arr = new Uint8Array(n);
      
      while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
      }
      
      return new File([u8arr], filename, { type: mime });
    } catch (error) {
      console.error('❌ Erro ao converter DataURL para File:', error);
      return null;
    }
  };

  // Funções para gerenciamento do modal
  const handleOpenModal = () => {
    setOpenModal(true);
  };
  
  const handleCloseModal = () => {
    setOpenModal(false);
  };
  
  const handleClear = () => {
    setLines([]);
    setCurrentLine([]);
    console.log('🧹 Canvas limpo');
    
    // Redesenhar o canvas para aplicar a limpeza
    redrawCanvas();
  };

  // Função para processar a imagem de assinatura
  const processSignatureImage = async (imageData, source = 'drawn') => {
    console.log(`🔍 Processando imagem de assinatura (fonte: ${source})`);
    
    try {
      // Se for uma assinatura desenhada, processar com endpoint normal
      // Se for upload ou foto, usar o endpoint rembg
      const endpoint = source === 'drawn' 
        ? '/api/process-signature' 
        : '/api/process-signature-rembg';
      
      console.log(`🌐 Usando endpoint: ${endpoint}`);
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          base64Data: imageData
        })
      });
      
      if (!response.ok) {
        throw new Error(`Erro no processamento: ${response.status}`);
      }
      
      const result = await response.json();
      
      if (result.success) {
        console.log('✅ Assinatura processada com sucesso');
        return result.processedSignature;
      } else {
        throw new Error(result.error || 'Falha no processamento da assinatura');
      }
    } catch (error) {
      console.error('❌ Erro ao processar assinatura:', error);
      // Em caso de erro, retornar a imagem original
      return imageData;
    }
  };

  // Função para salvar a assinatura do canvas
  const handleSave = async () => {
    console.log('💾 Salvando assinatura...');
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    try {
      // Salvar o canvas como uma imagem
      const dataUrl = canvas.toDataURL('image/png');
      console.log('📷 Imagem capturada do canvas');
      
      // Processar a imagem da assinatura
      const processedSignature = await processSignatureImage(dataUrl, 'drawn');
      console.log('✅ Assinatura processada com sucesso');
      
      // Atualizar estados
      setIsSigned(true);
      setTempSignature(processedSignature);
      
      // Salvar no estado pai
      if (onSignatureChange) {
        console.log('📤 Enviando assinatura para componente pai');
        onSignatureChange(processedSignature);
      }
      
      // Fechar o modal
      handleCloseModal();
      console.log('✅ Assinatura salva com sucesso');
    } catch (error) {
      console.error('❌ Erro ao salvar assinatura:', error);
      alert('Ocorreu um erro ao salvar a assinatura. Por favor, tente novamente.');
    }
  };

  // Função para processar upload de arquivo
  const handleFileUpload = async (event) => {
    console.log('📤 Processando upload de arquivo...');
    const file = event.target.files[0];
    if (!file) {
      console.log('⚠️ Nenhum arquivo selecionado');
      return;
    }
    
    if (file.size > 5 * 1024 * 1024) {
      console.error('❌ Arquivo muito grande');
      alert('O arquivo é muito grande. Por favor, selecione um arquivo de até 5MB.');
      return;
    }
    
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        console.log('📷 Arquivo lido com sucesso');
        const uploadedImage = e.target.result;
        
        // Processar a imagem com rembg
        const processedSignature = await processSignatureImage(uploadedImage, 'upload');
        
        // Atualizar estados
        setIsSigned(true);
        setTempSignature(processedSignature);
        
        // Salvar no estado pai
        if (onSignatureChange) {
          console.log('📤 Enviando assinatura para componente pai');
          onSignatureChange(processedSignature);
        }
        
        console.log('✅ Assinatura carregada com sucesso');
      } catch (error) {
        console.error('❌ Erro ao processar a imagem:', error);
        alert('Ocorreu um erro ao processar a imagem. Por favor, tente novamente.');
      }
    };
    reader.onerror = () => {
      console.error('❌ Erro ao ler o arquivo');
      alert('Ocorreu um erro ao ler o arquivo. Por favor, tente novamente.');
    };
    reader.readAsDataURL(file);
  };

  const triggerFileUpload = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };
  
  const handleClearSaved = () => {
    console.log('🧹 Limpando assinatura salva');
    setIsSigned(false);
    setTempSignature(null);
    setLines([]);
    setCurrentLine([]);
    
    // Informar o componente pai que a assinatura foi removida
    if (onSignatureChange) {
      onSignatureChange(null);
    }
  };

  // Função para processar captura de câmera
  const handleCameraCapture = async (event) => {
    console.log('📸 Processando captura de câmera...');
    const file = event.target.files[0];
    if (!file) {
      console.log('⚠️ Nenhuma imagem capturada');
      return;
    }
    
    // Limitar tamanho do arquivo
    if (file.size > 10 * 1024 * 1024) {
      console.error('❌ Arquivo muito grande');
      alert('A imagem é muito grande. Por favor, tente novamente com uma resolução menor.');
      return;
    }
    
    // Ler a imagem capturada
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        console.log('📷 Imagem capturada lida com sucesso');
        const capturedImage = e.target.result;
        
        // Processar a imagem com rembg para remover o fundo
        const processedSignature = await processSignatureImage(capturedImage, 'photo');
        
        // Atualizar estados
        setIsSigned(true);
        setTempSignature(processedSignature);
        
        // Salvar no estado pai
        if (onSignatureChange) {
          console.log('📤 Enviando assinatura para componente pai');
          onSignatureChange(processedSignature);
        }
        
        console.log('✅ Imagem de assinatura carregada com sucesso');
      } catch (error) {
        console.error('❌ Erro ao processar a imagem capturada:', error);
        alert('Ocorreu um erro ao processar a imagem. Por favor, tente novamente.');
      }
    };
    reader.onerror = () => {
      console.error('❌ Erro ao ler a imagem capturada');
      alert('Ocorreu um erro ao processar a imagem. Por favor, tente novamente.');
    };
    reader.readAsDataURL(file);
  };

  const triggerCamera = () => {
    if (cameraInputRef.current) {
      cameraInputRef.current.click();
    }
  };

  // Componente que mostra a assinatura salva ou o botão para assinar
  const SignatureDisplay = () => (
    <Box
      sx={{
        border: '1px dashed #ccc',
        p: 2,
        borderRadius: 1,
        position: 'relative',
        backgroundColor: '#f9f9f9'
      }}
    >
      {isSigned ? (
        <Box sx={{ textAlign: 'center' }}>
          <img
            src={tempSignature}
            alt="Assinatura"
            style={{
              maxWidth: '100%',
              maxHeight: '150px',
              margin: '0 auto',
              display: 'block'
            }}
          />
          <Box sx={{ mt: 1, display: 'flex', justifyContent: 'center' }}>
            <Button
              startIcon={<EditIcon />}
              onClick={handleOpenModal}
              size="small"
              sx={{ mr: 1 }}
            >
              Editar
            </Button>
            <Button
              startIcon={<DeleteIcon />}
              onClick={handleClearSaved}
              size="small"
              color="error"
            >
              Limpar
            </Button>
          </Box>
        </Box>
      ) : (
        <Box sx={{ textAlign: 'center' }}>
          <Typography variant="subtitle2" gutterBottom>
            {description}
          </Typography>
          
          {/* Novos botões de estilo moderno */}
          <Box sx={{ p: 2, display: 'flex', justifyContent: 'center', gap: 2 }}>
            <Box 
              onClick={triggerCamera}
              sx={{ 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center', 
                p: 2, 
                bgcolor: '#ebf5ff', 
                borderRadius: 2,
                cursor: 'pointer',
                '&:hover': { bgcolor: '#dcedff' }
              }}
            >
              <CameraIcon sx={{ color: '#1976d2', mb: 1, fontSize: 24 }} />
              <Typography variant="caption" sx={{ color: '#1976d2' }}>
                {isMobile ? 'Câmara' : 'Capturar'}
              </Typography>
              <input
                ref={cameraInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                style={{ display: 'none' }}
                onChange={handleCameraCapture}
              />
            </Box>
            
            <Box 
              onClick={triggerFileUpload}
              sx={{ 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center', 
                p: 2, 
                bgcolor: '#ebf5ff', 
                borderRadius: 2,
                cursor: 'pointer',
                '&:hover': { bgcolor: '#dcedff' }
              }}
            >
              <UploadIcon sx={{ color: '#1976d2', mb: 1, fontSize: 24 }} />
              <Typography variant="caption" sx={{ color: '#1976d2' }}>
                {isMobile ? 'Galeria' : 'Selecionar'}
              </Typography>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={handleFileUpload}
              />
            </Box>
            
            <Box 
              onClick={handleOpenModal}
              sx={{ 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center', 
                p: 2, 
                bgcolor: '#ebf5ff', 
                borderRadius: 2,
                cursor: 'pointer',
                '&:hover': { bgcolor: '#dcedff' }
              }}
            >
              <PenIcon sx={{ color: '#1976d2', mb: 1, fontSize: 24 }} />
              <Typography variant="caption" sx={{ color: '#1976d2' }}>
                Desenhar
              </Typography>
            </Box>
          </Box>
        </Box>
      )}
    </Box>
  );

  return (
    <Box sx={{ width: width }}>
      <Typography variant="subtitle1" gutterBottom fontWeight="bold">
        {title} {isSigned && <span style={{ color: 'green' }}>✓</span>}
      </Typography>

      <SignatureDisplay />

      {/* Modal para desenhar a assinatura - Novo estilo */}
      <Dialog
        open={openModal}
        onClose={handleCloseModal}
        fullWidth
        maxWidth="md"
        PaperProps={{
          sx: {
            borderRadius: 2,
            boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
            maxWidth: '95vw',
            m: 2
          }
        }}
      >
        {/* Cabeçalho do modal */}
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          p: 2,
          borderBottom: '1px solid #eee'
        }}>
          <Typography variant="h6" fontWeight="medium">Desenhe sua assinatura</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mx: 2 }}>
            Como no Paint - desenhe livremente
          </Typography>
          <IconButton 
            onClick={handleCloseModal} 
            sx={{ color: 'text.secondary' }}
          >
            <CloseIcon />
          </IconButton>
        </Box>
        
        {/* Área de desenho */}
        <Box 
          sx={{ 
            position: 'relative',
            bgcolor: 'white',
            height: { xs: 'calc(100vh - 250px)', sm: 'calc(80vh - 200px)' }
          }}
        >
          <canvas
            ref={canvasRef}
            style={{ 
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              border: '1px solid #e0e0e0',
              borderRadius: '8px',
              margin: '16px 0',
              touchAction: 'none',
              cursor: 'crosshair'
            }}
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={finishDrawing}
            onMouseOut={finishDrawing}
            onTouchStart={startDrawing}
            onTouchMove={draw}
            onTouchEnd={finishDrawing}
          />
        </Box>
        
        {/* Botões de ação */}
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'flex-end', 
          gap: 2, 
          p: 2,
          borderTop: '1px solid #eee'
        }}>
          <Button
            onClick={handleClear}
            variant="contained"
            sx={{ 
              bgcolor: '#f44336', 
              color: 'white',
              '&:hover': { bgcolor: '#d32f2f' },
              '&.Mui-disabled': { bgcolor: '#ffcdd2', color: '#ffebee' },
              px: 3
            }}
            disabled={lines.length === 0 && currentLine.length === 0}
          >
            Limpar
          </Button>
          
          <Button
            onClick={handleSave}
            variant="contained"
            sx={{ 
              bgcolor: '#1976d2', 
              color: 'white',
              '&:hover': { bgcolor: '#1565c0' },
              '&.Mui-disabled': { bgcolor: '#bbdefb', color: '#e3f2fd' },
              px: 3
            }}
            disabled={lines.length === 0 && currentLine.length === 0}
          >
            Salvar
          </Button>
        </Box>
      </Dialog>
    </Box>
  );
};

export default SignaturePad; 