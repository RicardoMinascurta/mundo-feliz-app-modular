import React, { useState, useEffect, useMemo, useRef } from 'react';
import PropTypes from 'prop-types';
import PdfProcessor from './PdfProcessor';
import './PdfDisplay.css';

/**
 * Componente para exibir um PDF com o nome sobreposto
 */
const PdfDisplay = ({ processId, personName, completePdfPath, pdfVersion = 1, processo, onError }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pdfUrl, setPdfUrl] = useState(null);
  const previousNameRef = useRef('');
  const previousVersionRef = useRef(pdfVersion);
  
  // Gerar um ID único para este processamento específico, atualizado quando o nome mudar
  const instanceId = useMemo(() => 
    `pdf-${processId}-${personName.replace(/\s+/g, '')}-v${pdfVersion}-${Date.now()}`, 
    [processId, personName, pdfVersion]
  );

  // Verificar se o nome ou a versão mudou para reprocessar o PDF
  useEffect(() => {
    const nameChanged = previousNameRef.current !== '' && previousNameRef.current !== personName;
    const versionChanged = previousVersionRef.current !== pdfVersion;
    
    if (nameChanged || versionChanged) {
      console.log(`Reprocessando PDF: ${nameChanged ? 'Nome mudou' : ''}${nameChanged && versionChanged ? ' e ' : ''}${versionChanged ? 'Versão mudou' : ''}`);
      
      // Limpar PDF anterior
      if (pdfUrl) {
        URL.revokeObjectURL(pdfUrl);
      }
      
      // Resetar estados
      setPdfUrl(null);
      setLoading(true);
      setError(null);
    }
    
    previousNameRef.current = personName;
    previousVersionRef.current = pdfVersion;
  }, [personName, pdfVersion, pdfUrl]);

  const handlePdfProcessed = (url) => {
    setPdfUrl(url);
    setLoading(false);
  };

  const handleError = (errorMessage) => {
    setError(errorMessage);
    setLoading(false);
    if (onError) onError(errorMessage);
  };

  // Limpar URL quando o componente for desmontado 
  useEffect(() => {
    return () => {
      if (pdfUrl) {
        URL.revokeObjectURL(pdfUrl);
      }
    };
  }, []);

  return (
    <div className="pdf-display-container">
      {/* Componente invisível que processa o PDF */}
      <PdfProcessor
        key={instanceId}
        processId={processId}
        personName={personName}
        completePdfPath={completePdfPath}
        onPdfProcessed={handlePdfProcessed}
        onError={handleError}
        pdfVersion={pdfVersion}
        processo={processo}
      />
      
      {loading && (
        <div className="pdf-loading">
          <p>Carregando PDF...</p>
        </div>
      )}
      
      {error && (
        <div className="pdf-error">
          <p>Erro ao processar PDF: {error}</p>
        </div>
      )}
      
      {pdfUrl && !loading && !error && (
        <iframe 
          src={pdfUrl}
          className="pdf-iframe"
          title="Documento processado"
          style={{width: '100%', height: '100%', minHeight: '500px', border: 'none'}}
        />
      )}
    </div>
  );
};

PdfDisplay.propTypes = {
  processId: PropTypes.string.isRequired,
  personName: PropTypes.string.isRequired,
  completePdfPath: PropTypes.string,
  pdfVersion: PropTypes.number,
  processo: PropTypes.object,
  onError: PropTypes.func
};

export default PdfDisplay; 