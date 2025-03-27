import React, { useState, useMemo } from 'react';
import { Box, Typography } from '@mui/material';
import { PdfDisplay } from '../pdf';

/**
 * Componente para visualizar PDFs, utilizando os novos processadores de PDF
 */
const PdfViewer = ({ pdfPath, nomePessoa, processId, processo }) => {
  const [serverFallback, setServerFallback] = useState(false);
  const [pdfVersion, setPdfVersion] = useState(1);
  
  // URL base para acessar arquivos
  const baseUrl = 'http://localhost:3001';
  
  // Gerar um ID único para esta instância do visualizador, regenerando quando nomePessoa mudar
  const instanceId = useMemo(() => 
    `pdf-viewer-${processId || ''}-${nomePessoa || ''}-${Date.now()}-${pdfVersion}`, 
    [processId, nomePessoa, pdfVersion] // Adicionar pdfVersion como dependência para reprocessar quando mudar
  );
  
  // Usar o servidor como fallback se o processamento no cliente falhar
  const handleClientError = () => {
    console.log('Processamento de PDF no cliente falhou, usando servidor como fallback');
    setServerFallback(true);
  };
  
  // Resetar o fallback quando o nome mudar
  useMemo(() => {
    if (nomePessoa) {
      setServerFallback(false);
    }
  }, [nomePessoa]);

  // Escutar eventos de atualização de PDF
  React.useEffect(() => {
    const handleRegeneratePdf = () => {
      setPdfVersion(prev => prev + 1);
    };
    
    window.addEventListener('regeneratePdf', handleRegeneratePdf);
    
    return () => {
      window.removeEventListener('regeneratePdf', handleRegeneratePdf);
    };
  }, []);
  
  // Se for usar o processamento do cliente
  if (processId && nomePessoa && !serverFallback) {
    return (
      <Box className="pdf-viewer-container" sx={{ height: '100%', minHeight: '500px' }}>
        <PdfDisplay 
          key={`${instanceId}-${nomePessoa}-${pdfVersion}`} // Usar o nome e versão como parte da key
          processId={processId}
          personName={nomePessoa}
          completePdfPath={pdfPath ? `${baseUrl}/${pdfPath}` : null} // Passar o PDF completo se disponível
          onError={handleClientError}
          pdfVersion={pdfVersion}
          processo={processo} // Passar o objeto processo completo
        />
      </Box>
    );
  }
  
  // Fallback: usar o endpoint do servidor se o processamento no cliente falhar
  // ou se não tivermos o nome da pessoa
  let serverPdfUrl;
  
  if (processId) {
    // Certificar-se de que o nome não seja vazio
    const nomeSeguro = nomePessoa || 'Nome do Beneficiário';
    console.log(`Usando nome para PDF: "${nomeSeguro}"`);
    
    // Usar o endpoint que aplica o nome sobre o PDF
    serverPdfUrl = `${baseUrl}/api/pdf/com-nome/${encodeURIComponent(processId)}?nome=${encodeURIComponent(nomeSeguro)}&t=${Date.now()}`;
  } else if (pdfPath) {
    // Usar o PDF original sem modificações
    serverPdfUrl = `${baseUrl}/${pdfPath}`;
  } else {
    serverPdfUrl = '';
  }
  
  if (!serverPdfUrl) {
    return (
      <Box className="pdf-no-document" sx={{ p: 3, textAlign: 'center' }}>
        <Typography>Nenhum PDF disponível para este processo.</Typography>
      </Box>
    );
  }
  
  return (
    <Box className="pdf-viewer-container" sx={{ height: '100%', minHeight: '500px' }}>
      <iframe
        src={serverPdfUrl}
        style={{
          width: '100%',
          height: '100%',
          minHeight: '500px',
          border: 'none',
          borderRadius: '8px',
        }}
        title="Documento do Processo"
        key={serverPdfUrl}
      />
    </Box>
  );
};

export default PdfViewer; 