import { useState, useCallback } from 'react';
import { idGeneratorService } from '../services';

/**
 * Hook para gerenciamento de IDs de processo
 * @param {string} tipoProcesso - Tipo de processo padrão
 * @param {string} initialProcessId - ID de processo inicial (opcional)
 * @returns {Object} - Objeto com funções e estados para gerenciar IDs de processo
 */
const useProcessId = (tipoProcesso, initialProcessId = null) => {
  const [processId, setProcessId] = useState(initialProcessId);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Gera um novo ID de processo
   * @param {string} tipo - Tipo de processo a ser usado
   * @returns {Promise<string>} - Promise com o novo ID ou null em caso de erro
   */
  const generateProcessId = useCallback(async (tipo = tipoProcesso) => {
    setLoading(true);
    setError(null);

    try {
      // Verifica se o ID atual é válido
      if (processId && idGeneratorService.validarFormatoId(processId)) {
        console.log(`Usando ID de processo existente: ${processId}`);
        setLoading(false);
        return processId;
      }

      // Gera um novo ID via API
      console.log(`Gerando novo ID de processo para: ${tipo}`);
      const response = await fetch('/api/gerar-processid', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ tipoProcesso: tipo }),
      });

      if (!response.ok) {
        throw new Error(`Erro ao gerar ID (${response.status}): ${await response.text()}`);
      }

      const data = await response.json();
      console.log(`Novo ID gerado: ${data.processId}`);
      
      setProcessId(data.processId);
      setLoading(false);
      return data.processId;
    } catch (err) {
      console.error('Erro ao gerar processId:', err);
      setError(err.message || 'Erro ao gerar ID de processo');
      setLoading(false);
      return null;
    }
  }, [processId, tipoProcesso]);

  /**
   * Verifica se o formato do ID é válido
   * @param {string} id - ID a ser verificado
   * @returns {boolean} - true se for válido
   */
  const isValidFormat = useCallback((id = processId) => {
    return idGeneratorService.validarFormatoId(id);
  }, [processId]);

  /**
   * Extrai a categoria do ID de processo
   * @param {string} id - ID a ser analisado
   * @returns {string} - Categoria do processo ou null
   */
  const getCategory = useCallback((id = processId) => {
    return idGeneratorService.extrairCategoria(id);
  }, [processId]);

  /**
   * Define o ID do processo
   * @param {string} id - Novo ID
   * @returns {boolean} - true se o ID for válido e definido
   */
  const setId = useCallback((id) => {
    if (id && idGeneratorService.validarFormatoId(id)) {
      setProcessId(id);
      return true;
    }
    console.warn(`Tentativa de definir ID inválido: ${id}`);
    return false;
  }, []);

  return {
    processId,
    loading,
    error,
    generateProcessId,
    isValidFormat,
    getCategory,
    setProcessId: setId
  };
};

export default useProcessId; 