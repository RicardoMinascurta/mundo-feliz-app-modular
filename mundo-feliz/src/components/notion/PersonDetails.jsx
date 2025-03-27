import React, { useState, useEffect } from 'react';
import { notionService } from '../../services';
import '../../assets/notion.css';

const PersonDetails = ({ person, onCreateProcess }) => {
  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (person && person.id) {
      setLoading(true);
      setError(null);

      notionService.getPageDetails(person.id)
        .then(pageDetails => {
          setDetails(pageDetails);
        })
        .catch(err => {
          console.error('Erro ao carregar detalhes:', err);
          setError('Não foi possível carregar os detalhes');
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [person]);

  if (!person) {
    return null;
  }

  if (loading) {
    return <div className="loading-details loading-indicator">Carregando detalhes...</div>;
  }

  if (error) {
    return <div className="error-details error-message">{error}</div>;
  }

  return (
    <div className="person-details">
      <div className="details-header">
        <h3>{person.name}</h3>
        <div className="details-path">
          <span>Localização: </span>
          <strong>{person.path}</strong>
        </div>
      </div>

      {details && (
        <div className="details-content">
          {Object.entries(details.properties).map(([key, value]) => (
            <div key={key} className="details-field">
              <div className="field-label">{key}:</div>
              <div className="field-value">
                {Array.isArray(value) 
                  ? value.join(', ') 
                  : String(value || '-')}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="details-actions">
        <button 
          className="create-process-btn"
          onClick={() => onCreateProcess(person, details)}
        >
          Criar Processo
        </button>
        
        <a 
          href={person.url} 
          target="_blank" 
          rel="noopener noreferrer"
          className="view-notion-link"
        >
          Ver no Notion
        </a>
      </div>
    </div>
  );
};

export default PersonDetails; 