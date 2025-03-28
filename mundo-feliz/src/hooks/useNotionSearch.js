import { useState, useCallback, useEffect } from 'react';
import { logger } from '../services/LoggerService';
import { databaseIds } from '../config/notionConfig';

export function useNotionSearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [debounceTimeout, setDebounceTimeout] = useState(null);

  // Função de pesquisa
  const searchPeople = useCallback(async (searchQuery = query) => {
    if (!searchQuery || searchQuery.trim().length < 3) {
      setResults([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Usar a API diretamente
      const response = await fetch('/api/notion/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          query: searchQuery,
          databaseIds: databaseIds // Usar databaseIds importado em vez de window.databaseIds
        })
      });

      if (!response.ok) {
        throw new Error(`Erro na API: ${response.status}`);
      }

      const data = await response.json();
      console.log('Resultados recebidos:', data.results);
      setResults(data.results || []);
    } catch (err) {
      console.error('Erro na pesquisa:', err);
      setError('Falha ao pesquisar: ' + err.message);
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, [query]);

  // Efeito para debounce
  useEffect(() => {
    if (debounceTimeout) {
      clearTimeout(debounceTimeout);
    }

    if (query.trim().length >= 3) {
      const timeout = setTimeout(() => {
        searchPeople();
      }, 500);

      setDebounceTimeout(timeout);
    } else {
      setResults([]);
    }

    return () => {
      if (debounceTimeout) {
        clearTimeout(debounceTimeout);
      }
    };
  }, [query, searchPeople]);

  // Limpar pesquisa
  const clearSearch = useCallback(() => {
    setQuery('');
    setResults([]);
  }, []);

  return {
    query,
    setQuery,
    results,
    loading,
    error,
    searchPeople,
    clearSearch
  };
}