import React, { useState, useEffect } from 'react';
import '../../assets/processos.css';

const ListaProcessosSalvos = () => {
  const [processos, setProcessos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProcessos = async () => {
      try {
        const response = await fetch('/api/processos');
        const data = await response.json();
        
        if (data.processos) {
          setProcessos(data.processos);
        } else {
          setProcessos([]);
        }
        
        setLoading(false);
      } catch (err) {
        setError('Erro ao carregar processos');
        setLoading(false);
      }
    };

    fetchProcessos();
  }, []);

  if (loading) {
    return <div className="loading">Carregando processos...</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  if (processos.length === 0) {
    return <div className="no-data">Nenhum processo encontrado</div>;
  }

  return (
    <div className="processos-salvos">
      <h2>Processos Salvos</h2>
      <div className="processos-grid">
        {processos.map((processo) => (
          <div key={processo.processId} className="processo-card">
            <div className="processo-header">
              <h3>Processo #{processo.processId.slice(0, 8)}</h3>
            </div>
            
            <div className="processo-dados">
              <h4>Dados Extraídos:</h4>
              <ul>
                {Object.entries(processo.dadosExtraidos).map(([chave, valor]) => (
                  <li key={chave}>
                    <strong>{chave}:</strong> {valor}
                  </li>
                ))}
              </ul>
            </div>
            
            <div className="processo-documentos">
              <h4>Documentos:</h4>
              <ul>
                {Object.entries(processo.documentos).map(([tipo, caminho]) => (
                  caminho && (
                    <li key={tipo}>
                      <strong>{tipo}:</strong>{' '}
                      <a href={caminho} target="_blank" rel="noopener noreferrer">
                        Ver documento
                      </a>
                    </li>
                  )
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ListaProcessosSalvos; 