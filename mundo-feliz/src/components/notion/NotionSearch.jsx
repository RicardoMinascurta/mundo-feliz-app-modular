import React from 'react';
import { useNotionSearch } from '../../hooks/useNotionSearch';
import { logger } from '../../services/LoggerService';
import '../../assets/notion.css';

const NotionSearch = ({ onSelectPerson }) => {
  const {
    query,
    setQuery,
    results,
    loading,
    error,
    clearSearch
  } = useNotionSearch();

  // Função para extrair nome amigável das propriedades
  const extractPropertyValue = (property) => {
    if (!property) return 'N/A';
    
    // Lidar com diferentes tipos de propriedades
    switch (property.type) {
      case 'title':
        return property.title.map(t => t.plain_text).join('');
      case 'rich_text':
        return property.rich_text.map(t => t.plain_text).join('');
      case 'date':
        return property.date?.start || 'N/A';
      case 'select':
        return property.select?.name || 'N/A';
      case 'multi_select':
        return property.multi_select?.map(s => s.name).join(', ') || 'N/A';
      case 'number':
        return property.number?.toString() || 'N/A';
      case 'checkbox':
        return property.checkbox ? 'Sim' : 'Não';
      default:
        return 'N/A';
    }
  };

  // Função para lidar com a seleção de uma pessoa
  const handlePersonSelect = (person) => {
    logger.info('Pessoa selecionada no NotionSearch:', {
      id: person.id,
      name: person.name,
      databaseId: person.databaseId,
      path: person.path,
      properties: person.properties
    });

    // Chamar a função de callback com os dados da pessoa
    onSelectPerson(person);
  };

  return (
    <div className="notion-search-container" style={{ width: '100%', maxWidth: '100%' }}>
      <div className="search-header">
        <h2>Pesquisa no Notion</h2>
      </div>

      <div className="search-input-container">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Digite o nome da pessoa (mínimo 3 caracteres)"
          className="search-input"
        />
        {query && (
          <button 
            className="clear-search-btn"
            onClick={clearSearch}
            aria-label="Limpar pesquisa"
          >
            ×
          </button>
        )}
      </div>

      {loading && (
        <div className="loading-indicator">
          <span>Pesquisando...</span>
        </div>
      )}

      {error && (
        <div className="error-message">
          <p>{error}</p>
        </div>
      )}

      {results.length > 0 && (
        <div className="search-results">
          <h3>Resultados encontrados ({results.length})</h3>
          
          <ul className="results-list">
            {results.map((person) => {
              logger.debug("Renderizando pessoa na lista:", {
                id: person.id,
                name: person.name,
                path: person.path
              });
              
              return (
                <li 
                  key={person.id}
                  className="result-item"
                  onClick={() => handlePersonSelect(person)}
                >
                  <div className="result-name">{person.name || 'Nome não disponível'}</div>
                  <div 
                    className={`result-path ${person.path && person.path !== 'Período não identificado' ? 'valid-period' : 'unknown-period'}`}
                    style={{
                      fontWeight: person.path && person.path !== 'Período não identificado' ? '500' : 'normal',
                      color: person.path && person.path !== 'Período não identificado' ? '#3498db' : '#999'
                    }}
                  >
                    {person.path || 'Período não identificado'}
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
};

export default NotionSearch; 