import React, { useState, useEffect } from 'react';
import NotionSearch from '../components/notion/NotionSearch';
import ListaDeProcessos from '../components/processos/ListaDeProcessos';
import { useNavigate, useParams } from 'react-router-dom';
import '../assets/notion.css';

const NotionSearchScreen = () => {
  const [selectedPerson, setSelectedPerson] = useState(null);
  const navigate = useNavigate();
  const { personId } = useParams();
  
  // Se temos um personId na URL, podemos carregar os dados da pessoa
  useEffect(() => {
    if (personId && !selectedPerson) {
      console.log("🔍 NOTION-SEARCH: Carregando dados da pessoa com ID:", personId);
      
      // Tentar recuperar dados da pessoa do localStorage
      const storedPersonData = localStorage.getItem(`person_${personId}`);
      
      if (storedPersonData) {
        try {
          const personData = JSON.parse(storedPersonData);
          console.log("💾 NOTION-SEARCH: Dados da pessoa recuperados do localStorage:", {
            id: personData.id,
            name: personData.name,
            path: personData.path
          });
          setSelectedPerson(personData);
        } catch (e) {
          console.error("❌ NOTION-SEARCH: Erro ao recuperar dados da pessoa:", e);
          // Fallback para mock em caso de erro
          createMockPerson();
        }
      } else {
        console.log("⚠️ NOTION-SEARCH: Dados da pessoa não encontrados no localStorage");
        // Se não tiver dados salvos, criar mock
        createMockPerson();
      }
    }
  }, [personId, selectedPerson]);
  
  const createMockPerson = () => {
    console.log("🔄 NOTION-SEARCH: Criando pessoa mock com ID:", personId);
    // Criar objeto simulado quando não temos dados reais
    const mockPerson = {
      id: personId,
      name: `Pessoa ${personId.substring(0, 8)}...`,
      path: 'Carregado via URL'
    };
    
    setSelectedPerson(mockPerson);
  };

  const handleSelectPerson = (person) => {
    console.log("🔍 NOTION-SEARCH: Pessoa selecionada:", {
      id: person.id,
      name: person.name,
      path: person.path
    });
    
    setSelectedPerson(person);
    
    // Salvar dados completos da pessoa no localStorage
    try {
      localStorage.setItem(`person_${person.id}`, JSON.stringify(person));
      console.log("💾 NOTION-SEARCH: Pessoa salva no localStorage com ID:", person.id);
      
      // Salvar o ID da pessoa em uma chave separada para fácil acesso global
      localStorage.setItem('lastSelectedPersonId', person.id);
      console.log("🔑 NOTION-SEARCH: ID da pessoa salvo como lastSelectedPersonId:", person.id);
    } catch (e) {
      console.error("❌ NOTION-SEARCH: Erro ao salvar dados da pessoa:", e);
    }
    
    // Navegar para a URL específica da pessoa
    console.log("🚀 NOTION-SEARCH: Navegando para rota de processos com ID:", person.id);
    navigate(`/person/${person.id}/processes`);
    
    // Em dispositivos móveis, fazer scroll para a seleção de processos
    if (window.innerWidth <= 768) {
      setTimeout(() => {
        document.querySelector('.lista-processos-container')?.scrollIntoView({ 
          behavior: 'smooth' 
        });
      }, 100);
    }
  };

  const handleBackToSearch = () => {
    console.log("⬅️ NOTION-SEARCH: Voltando para tela de pesquisa");
    setSelectedPerson(null);
    // Se estamos em uma rota específica de pessoa, voltar para a busca principal
    if (personId) {
      navigate('/search');
    }
  };

  // Se nenhuma pessoa estiver selecionada, mostrar apenas a pesquisa
  if (!selectedPerson) {
    return (
      <div className="notion-search-screen" style={{ width: '100%', maxWidth: '100%', padding: 0, margin: 0 }}>
        <NotionSearch onSelectPerson={handleSelectPerson} />
      </div>
    );
  }

  // Pessoa selecionada, mostrar seleção de processos
  return (
    <div className="notion-search-screen" style={{ width: '100%', maxWidth: '100%', padding: 0, margin: 0 }}>
      <div className="process-selection-panel" style={{ width: '100%', maxWidth: '100%' }}>
        <ListaDeProcessos pessoa={selectedPerson} />
        <button 
          className="back-button"
          onClick={handleBackToSearch}
        >
          Voltar para pesquisa
        </button>
      </div>
    </div>
  );
};

export default NotionSearchScreen; 