import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronDown, FileText, Clock, Users, RefreshCw, Globe, CreditCard, User, Award } from 'lucide-react';
import '../../assets/notion.css';

const ListaDeProcessos = ({ pessoa }) => {
  const navigate = useNavigate();
  const [expandedCategories, setExpandedCategories] = useState({});

  // Categorias de processos
  const categorias = [
    {
      id: 'renovacao',
      nome: 'Renovação de Residência',
      icone: <CreditCard size={18} style={{ color: "#4F46E5" }} />,
      cor: "#4F46E5", // Roxo/índigo
      tipos: [
        { id: 'estudanteSecundario', nome: 'Estudante Ensino Secundário' },
        { id: 'estudanteSuperior', nome: 'Estudante Ensino Superior' },
        { id: 'naoTemEstatuto', nome: 'Não tem estatuto' },
        { id: 'tratamentoMedico', nome: 'Tratamento Médico' },
        { id: 'uniaoEuropeia', nome: 'União Europeia (UE)' }
      ]
    },
    {
      id: 'reagrupamento',
      nome: 'Concessão',
      icone: <Users size={18} style={{ color: "#059669" }} />,
      cor: "#059669", // Verde esmeralda
      tipos: [
        { id: 'trNovo', nome: 'Concessão TR' },
        { id: 'trEstudante', nome: 'Concessão - TR (Estudante)' },
        { id: 'trEstudanteMenor', nome: 'Concessão - TR (Estudante Menor)' },
        { id: 'atravesPaiMae', nome: 'Reagrupamento - Através de Mãe/Pai (Filho/a fora de território nacional)' },
        { id: 'atravesDoFilho', nome: 'Reagrupamento - Através do Filho/a' },
        { id: 'atravesDoTutor', nome: 'Reagrupamento - Através do Tutor' },
        { id: 'atravesDoConjuge', nome: 'Reagrupamento - Através do Cônjuge' },
        { id: 'paraPaisIdosos', nome: 'Reagrupamento - Para Pais Idosos (+65)' }
      ]
    },
    {
      id: 'contagem',
      nome: 'Contagem do Tempo',
      icone: <Clock size={18} style={{ color: "#DB2777" }} />,
      cor: "#DB2777", // Rosa
      tipos: [
        { id: 'residenciaPermanente', nome: 'Contagem de Tempo para Residência Permanente' }
      ]
    },
    {
      id: 'cplp',
      nome: 'CPLP',
      icone: <Globe size={18} style={{ color: "#D97706" }} />,
      cor: "#D97706", // Âmbar
      tipos: [
        { id: 'maiores', nome: 'CPLP (Maiores)' },
        { id: 'menores', nome: 'CPLP (Presencial - Menor)' }
      ]
    },
    {
      id: 'informacao',
      nome: 'Informação',
      icone: <FileText size={18} style={{ color: "#0891B2" }} />,
      cor: "#0891B2", // Ciano
      tipos: [
        { id: 'infoPortal', nome: 'PEDIDO DE TÍTULO DE RESIDÊNCIA - (INFORMAÇÃO DO PROCESSO ATRAVÉS DO PORTAL)' },
        { id: 'infoPresencial', nome: 'PEDIDO DE TÍTULO DE RESIDÊNCIA - (INFORMAÇÃO DO PROCESSO PRESENCIAL)' }
      ]
    }
  ];

  // Toggle categoria
  const toggleCategoria = (categoriaId) => {
    if (expandedCategories[categoriaId]) {
      // Se a categoria já está expandida, apenas a feche
      setExpandedCategories({});
    } else {
      // Se a categoria não está expandida, feche todas as outras e abra apenas esta
      setExpandedCategories({ [categoriaId]: true });
    }
  };

  // Selecionar um tipo de processo
  const selecionarProcesso = (categoria, tipo) => {
    console.log("📋 LISTA-PROCESSOS: Iniciando seleção de processo");
    console.log("👤 LISTA-PROCESSOS: Dados da pessoa recebida:", {
      id: pessoa?.id,
      name: pessoa?.name,
      path: pessoa?.path
    });
    
    // Verifica se pessoa existe e tem id
    const pessoaId = pessoa?.id || 'unknown';
    
    console.log("🆔 LISTA-PROCESSOS: ID da pessoa a usar:", pessoaId);
    
    const processoInfo = {
      categoria: categoria.id,
      tipo: tipo.id,
      pessoaId: pessoaId
    };
    
    console.log("📝 LISTA-PROCESSOS: Dados do processo a iniciar:", processoInfo);
    
    // Salvar no localStorage para persistência adicional
    try {
      localStorage.setItem('currentProcessPessoaId', pessoaId);
      console.log("💾 LISTA-PROCESSOS: ID da pessoa salvo em currentProcessPessoaId:", pessoaId);
    } catch (e) {
      console.error("❌ LISTA-PROCESSOS: Erro ao salvar ID da pessoa:", e);
    }

    if (categoria.id === 'renovacao') {
      let renovacaoPath = '';
      let tipoProcesso = '';
      
      // Mapear cada tipo para a URL correta conforme definido no App.jsx
      switch (tipo.id) {
        case 'estudanteSuperior':
          renovacaoPath = 'estudante-superior';
          tipoProcesso = 'RenovacaoEstudanteSuperior';
          break;
        case 'estudanteSecundario':
          renovacaoPath = 'estudante-secundario';
          tipoProcesso = 'RenovacaoEstudanteSecundario';
          break;
        case 'tratamentoMedico':
          renovacaoPath = 'tratamento-medico';
          tipoProcesso = 'RenovacaoTratamentoMedico';
          break;
        case 'naoTemEstatuto':
          renovacaoPath = 'sem-estatuto';
          tipoProcesso = 'RenovacaoNaoTemEstatuto';
          break;
        case 'uniaoEuropeia':
          renovacaoPath = 'uniao-europeia';
          tipoProcesso = 'RenovacaoUniaoEuropeia';
          break;
        default:
          renovacaoPath = tipo.id;
          tipoProcesso = `Renovacao${tipo.id.charAt(0).toUpperCase() + tipo.id.slice(1)}`;
      }
      
      // Criar um ID de processo no formato correto
      const timestamp = Date.now().toString(36);
      const randomHex = Math.random().toString(16).substring(2, 10);
      const processId = `${tipoProcesso}-${timestamp}-${randomHex}`;
      
      console.log("🚀 LISTA-PROCESSOS: Navegando para rota de renovação:", {
        path: `/renovacao/${renovacaoPath}/${pessoaId}/${processId}`,
        processId,
        pessoaId
      });
      
      navigate(`/renovacao/${renovacaoPath}/${pessoaId}/${processId}`);
    } 
    // Se for concessão/reagrupamento
    else if (categoria.id === 'reagrupamento') {
      // Determinar o tipo de processo baseado no tipo selecionado
      let tipoProcesso = '';
      
      // Mapear cada tipo de concessão para a rota correta
      switch (tipo.id) {
        case 'trNovo':
          tipoProcesso = 'ConcessaoTR';
          // Gerar ID no formato correto
          const novoTimestamp = Date.now().toString(36);
          const novoRandomHex = Math.random().toString(16).substring(2, 10);
          const novoProcessId = `${tipoProcesso}-${novoTimestamp}-${novoRandomHex}`;
          navigate(`/concessao/tr/${pessoaId}/${novoProcessId}`);
          break;
        case 'trEstudante':
          tipoProcesso = 'ConcessaoTREstudante';
          // Gerar ID no formato correto
          const estudanteTimestamp = Date.now().toString(36);
          const estudanteRandomHex = Math.random().toString(16).substring(2, 10);
          const estudanteProcessId = `${tipoProcesso}-${estudanteTimestamp}-${estudanteRandomHex}`;
          navigate(`/concessao/tr-estudante/${pessoaId}/${estudanteProcessId}`);
          break;
        case 'trEstudanteMenor':
          tipoProcesso = 'ConcessaoTREstudanteMenor';
          // Gerar ID no formato correto
          const menorTimestamp = Date.now().toString(36);
          const menorRandomHex = Math.random().toString(16).substring(2, 10);
          const menorProcessId = `${tipoProcesso}-${menorTimestamp}-${menorRandomHex}`;
          navigate(`/concessao/tr-estudante-menor/${pessoaId}/${menorProcessId}`);
          break;
        case 'atravesPaiMae':
          tipoProcesso = 'ReagrupamentoPaiMaeFora';
          // Gerar ID no formato correto
          const paiMaeTimestamp = Date.now().toString(36);
          const paiMaeRandomHex = Math.random().toString(16).substring(2, 10);
          const paiMaeProcessId = `${tipoProcesso}-${paiMaeTimestamp}-${paiMaeRandomHex}`;
          navigate(`/concessao/reagrupamento-pai-mae-fora/${pessoaId}/${paiMaeProcessId}`);
          break;
        case 'atravesDoFilho':
          tipoProcesso = 'ReagrupamentoFilho';
          // Gerar ID no formato correto
          const filhoTimestamp = Date.now().toString(36);
          const filhoRandomHex = Math.random().toString(16).substring(2, 10);
          const filhoProcessId = `${tipoProcesso}-${filhoTimestamp}-${filhoRandomHex}`;
          navigate(`/concessao/reagrupamento-filho/${pessoaId}/${filhoProcessId}`);
          break;
        case 'atravesDoTutor':
          tipoProcesso = 'ReagrupamentoTutor';
          // Gerar ID no formato correto
          const tutorTimestamp = Date.now().toString(36);
          const tutorRandomHex = Math.random().toString(16).substring(2, 10);
          const tutorProcessId = `${tipoProcesso}-${tutorTimestamp}-${tutorRandomHex}`;
          navigate(`/concessao/reagrupamento-tutor/${pessoaId}/${tutorProcessId}`);
          break;
        case 'atravesDoConjuge':
          tipoProcesso = 'ReagrupamentoConjuge';
          // Gerar ID no formato correto
          const conjugeTimestamp = Date.now().toString(36);
          const conjugeRandomHex = Math.random().toString(16).substring(2, 10);
          const conjugeProcessId = `${tipoProcesso}-${conjugeTimestamp}-${conjugeRandomHex}`;
          navigate(`/concessao/reagrupamento-conjuge/${pessoaId}/${conjugeProcessId}`);
          break;
        case 'paraPaisIdosos':
          // Gerar ID no formato correto (TipoProcesso-timestamp-randomhex)
          const timestamp = Date.now().toString(36);
          const randomHex = Math.random().toString(16).substring(2, 10);
          const paisIdososProcessId = `ReagrupamentoPaiIdoso-${timestamp}-${randomHex}`;
          navigate(`/concessao/reagrupamento-pais-idosos/${pessoaId}/${paisIdososProcessId}`);
          break;
        default:
          // Fallback para rota genérica se não encontrar uma rota específica
          tipoProcesso = `Concessao${tipo.id.charAt(0).toUpperCase() + tipo.id.slice(1)}`;
          // Gerar ID no formato correto
          const defaultTimestamp = Date.now().toString(36);
          const defaultRandomHex = Math.random().toString(16).substring(2, 10);
          const defaultProcessId = `${tipoProcesso}-${defaultTimestamp}-${defaultRandomHex}`;
          navigate(`/upload/${tipo.id}/${pessoaId}/${defaultProcessId}`, {
            state: {
              personData: pessoa,
              categoria: categoria.id,
              tipoProcesso: tipo.nome,
              tipoId: tipo.id
            }
          });
      }
    }
    // Se for CPLP
    else if (categoria.id === 'cplp') {
      // Determinar o tipo de processo baseado no tipo selecionado
      const processType = tipo.id === 'maiores' ? 'CPLPMaiores' : 'CPLPMenor';
      
      // Gerar timestamp e hexadecimal aleatório para o ID do processo
      const timestamp = Date.now().toString(36);
      const randomHex = Math.random().toString(16).substring(2, 10);
      
      // Criar ID no formato padrão: TipoProcesso-timestamp-randomhex
      const processId = `${processType}-${timestamp}-${randomHex}`;
      
      // Navegar para a página correta com base no tipo
      if (tipo.id === 'maiores') {
        navigate(`/concessao/cplp-maiores/${pessoaId}/${processId}`);
      } else if (tipo.id === 'menores') {
        navigate(`/concessao/cplp-menor/${pessoaId}/${processId}`);
      } else {
        // Caso para outros tipos de CPLP (se houver no futuro)
        navigate(`/upload/cplp-${tipo.id}/${pessoaId}/${processId}`);
      }
    }
    // Se for contagem de tempo
    else if (categoria.id === 'contagem') {
      // Gerar process ID no formato padrão para contagem de tempo
      const processType = 'ContagemTempo';
      const timestamp = Date.now().toString(36);
      const randomHex = Math.random().toString(16).substring(2, 10);
      const processId = `${processType}-${timestamp}-${randomHex}`;
      
      navigate(`/concessao/contagem-tempo/${pessoaId}/${processId}`);
    }
    // Se for informação
    else if (categoria.id === 'informacao') {
      // Determinar o tipo de processo baseado na seleção
      const processType = tipo.id === 'infoPortal' ? 'InformacaoPortal' : 'InformacaoPresencial';
      const timestamp = Date.now().toString(36);
      const randomHex = Math.random().toString(16).substring(2, 10);
      const processId = `${processType}-${timestamp}-${randomHex}`;
      
      if (tipo.id === 'infoPortal') {
        navigate(`/informacao/portal/${pessoaId}/${processId}`);
      } else if (tipo.id === 'infoPresencial') {
        navigate(`/informacao/presencial/${pessoaId}/${processId}`);
      } else {
        // Fallback para rota genérica de informação
        navigate(`/upload/${tipo.id}/${pessoaId}/${processId}`, {
          state: {
            personData: pessoa,
            categoria: categoria.id,
            tipoProcesso: tipo.nome,
            tipoId: tipo.id
          }
        });
      }
    }
    // Para outros processos, usar a rota genérica
    else {
      // Gerar um ID de processo no formato correto
      const tipoProcesso = `${categoria.id.charAt(0).toUpperCase() + categoria.id.slice(1)}${tipo.id.charAt(0).toUpperCase() + tipo.id.slice(1)}`;
      const timestamp = Date.now().toString(36);
      const randomHex = Math.random().toString(16).substring(2, 10);
      const processId = `${tipoProcesso}-${timestamp}-${randomHex}`;
      
      navigate(`/upload/${tipo.id}/${pessoaId}/${processId}`, {
        state: {
          personData: pessoa,
          categoria: categoria.id,
          tipoProcesso: tipo.nome,
          tipoId: tipo.id
        }
      });
    }
  };

  return (
    <div className="lista-processos-container">
      <div className="processos-header">
        <h2>Selecionar Tipo de Processo</h2>
        <p>Pessoa selecionada: <strong>{pessoa.name || pessoa.nome || pessoa.fullName}</strong></p>
        <p>Localização: <strong>{pessoa.path || pessoa.localizacao || pessoa.location || 'Não especificada'}</strong></p>
      </div>

      <div className="categorias-grid">
        {categorias.map(categoria => (
          <div 
            key={categoria.id}
          >
            <div 
              className={`categoria-header ${expandedCategories[categoria.id] ? 'expanded' : ''}`}
              onClick={() => toggleCategoria(categoria.id)}
            >
              <h3>{categoria.icone} {categoria.nome}</h3>
              <ChevronDown className={`toggle-icon ${expandedCategories[categoria.id] ? 'rotate-180' : ''}`} size={18} />
            </div>
            
            <div className={`tipos-list ${expandedCategories[categoria.id] ? 'expanded' : ''}`}>
              {categoria.tipos.map(tipo => (
                <button
                  key={tipo.id}
                  className="tipo-button"
                  onClick={() => selecionarProcesso(categoria, tipo)}
                >
                  {tipo.nome}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ListaDeProcessos;