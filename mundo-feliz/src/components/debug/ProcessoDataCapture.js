/**
 * Serviço para capturar dados do processo durante o OCR e GPT
 */

// Armazenamento global para dados de processo
if (typeof window !== 'undefined' && !window._processData) {
  window._processData = {};
}

/**
 * Captura dados enviados para o OCR
 * @param {string} processId ID do processo
 * @param {string} documentType Tipo do documento
 * @param {File} file Arquivo enviado
 */
export const captureOcrRequest = (processId, documentType, file) => {
  if (!processId || !documentType) return;
  
  initializeProcessData(processId);
  
  window._processData[processId].ocrRequests = window._processData[processId].ocrRequests || {};
  window._processData[processId].ocrRequests[documentType] = {
    timestamp: new Date().toISOString(),
    fileName: file.name,
    fileType: file.type,
    fileSize: file.size
  };
};

/**
 * Captura resposta do OCR
 * @param {string} processId ID do processo
 * @param {string} documentType Tipo do documento
 * @param {string} extractedText Texto extraído
 */
export const captureOcrResponse = (processId, documentType, extractedText) => {
  if (!processId || !documentType) return;
  
  initializeProcessData(processId);
  
  window._processData[processId].ocrResults = window._processData[processId].ocrResults || {};
  window._processData[processId].ocrResults[documentType] = {
    timestamp: new Date().toISOString(),
    textLength: extractedText.length,
    extractedText
  };
};

/**
 * Captura prompt enviado para o GPT
 * @param {string} processId ID do processo
 * @param {string} category Categoria do processo
 * @param {string} processType Tipo do processo
 * @param {Object} prompt Prompt enviado
 */
export const captureGptPrompt = (processId, category, processType, prompt, text) => {
  if (!processId) return;
  
  initializeProcessData(processId);
  
  // Obter o prompt completo que será enviado ao GPT (system + prefix + text + suffix)
  const fullPrompt = `${prompt.system || ''}\n\n${prompt.prefix || ''}\n\n${text}\n\n${prompt.suffix || ''}`;
  
  window._processData[processId].gptPrompt = {
    timestamp: new Date().toISOString(),
    category,
    processType,
    system: prompt.system,
    prefix: prompt.prefix,
    suffix: prompt.suffix,
    fullPrompt: fullPrompt,
    textLength: text.length,
    mappedCategory: category, // Útil para debug
    mappedType: processType     // Útil para debug
  };
  
  // Registrar detalhes do prompt no console para facilitar debug
  console.log(`[Capture] Prompt para ${processId}:`, {
    category, 
    processType,
    promptLength: prompt.system?.length || 0,
    textLength: text.length
  });
};

/**
 * Captura resposta do GPT
 * @param {string} processId ID do processo
 * @param {Object} extractedData Dados extraídos
 * @param {Object} validation Resultado da validação
 * @param {string} rawResponse Resposta bruta
 */
export const captureGptResponse = (processId, extractedData, validation, rawResponse) => {
  if (!processId) return;
  
  initializeProcessData(processId);
  
  window._processData[processId].gptResults = {
    timestamp: new Date().toISOString(),
    extractedData,
    validation,
    rawResponse
  };
  
  // Exportar dados automaticamente
  exportProcessData(processId);
};

/**
 * Inicializa estrutura de dados para um processo
 * @param {string} processId ID do processo
 */
const initializeProcessData = (processId) => {
  if (!window._processData) {
    window._processData = {};
  }
  
  if (!window._processData[processId]) {
    window._processData[processId] = {
      processId,
      timestamp: new Date().toISOString(),
      ocrRequests: {},
      ocrResults: {},
      gptPrompt: null,
      gptResults: null
    };
  }
};

/**
 * Exporta dados do processo para JSON
 * @param {string} processId ID do processo
 */
export const exportProcessData = (processId) => {
  try {
    if (!window._processData || !window._processData[processId]) {
      console.warn(`Sem dados para exportar para o processo ${processId}`);
      return;
    }
    
    const data = window._processData[processId];
    
    // Formatar para visualização mais clara
    const exportData = {
      processId,
      timestamp: new Date().toISOString(),
      dadosExtraidos: {
        ocr: {
          documentos: Object.keys(data.ocrResults).length,
          resultados: data.ocrResults
        },
        gpt: {
          prompt: data.gptPrompt,
          resultado: data.gptResults
        },
        campos: data.gptResults?.extractedData || {}
      }
    };
    
    // Salvar em localStorage para debug
    localStorage.setItem(`processo_${processId}`, JSON.stringify(exportData));
    
    // Enviar dados para o servidor
    fetch('http://localhost:3001/api/save-processo', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(exportData)
    })
    .then(response => response.json())
    .then(result => {
      console.log(`Dados do processo ${processId} salvos no servidor: ${result.message || 'Sucesso'}`);
    })
    .catch(error => {
      console.error(`Erro ao salvar dados no servidor: ${error.message}`);
      
      // Fallback para download local se o servidor falhar
      const dataStr = JSON.stringify(exportData, null, 2);
      const blob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = `processo_${processId}_${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      
      setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }, 100);
    });
    
    console.log(`Dados do processo ${processId} exportados para JSON`);
  } catch (error) {
    console.error(`Erro ao exportar dados para JSON: ${error.message}`, error);
  }
};

export default {
  captureOcrRequest,
  captureOcrResponse,
  captureGptPrompt,
  captureGptResponse,
  exportProcessData
}; 