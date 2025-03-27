import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Box, Paper, Typography, Button, IconButton, Grid } from '@mui/material';
import { ChevronLeft } from '@mui/icons-material';
import { jsonData } from '../../services';
import PdfViewer from './PdfViewer';
import DetalhesFormulario from './DetalhesFormulario';
import TemplateEmail from './TemplateEmail';
import './DetalhesStyles.css';

const ProcessoDetalhes = () => {
  const { processId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [processo, setProcesso] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pessoaNome, setPessoaNome] = useState('');
  const [tipoCPLP, setTipoCPLP] = useState('desbloqueio');
  
  // Extrair o ID do processo da URL se não estiver disponível nos parâmetros
  const getProcessId = () => {
    // Decodificar o ID se estiver nos parâmetros
    if (processId) return decodeURIComponent(processId);
    
    // Extrair da URL completa como fallback
    const urlPath = location.pathname;
    const match = urlPath.match(/\/processo\/(.+)/);
    
    // Decodificar o ID extraído da URL
    return match ? decodeURIComponent(match[1]) : null;
  };

  useEffect(() => {
    const carregarProcesso = async () => {
      try {
        setLoading(true);
        const idToSearch = getProcessId();
        console.log("Buscando processo com ID:", idToSearch);
        
        const allProcessos = await jsonData.getAllProcesses();
        console.log("Todos os processos:", allProcessos.map(p => p.processId));
        
        const processoEncontrado = allProcessos.find(p => p.processId === idToSearch);
        console.log("Processo encontrado:", processoEncontrado);
        
        if (!processoEncontrado) {
          setError(`Processo não encontrado: ${idToSearch}`);
          setLoading(false);
          return;
        }
        
        setProcesso(processoEncontrado);
        
        // Determinar o tipo de processo
        const tipoProcesso = processoEncontrado.processId.split('-')[0];
        console.log("Tipo de processo:", tipoProcesso);
        
        // Extrair o nome da pessoa do processo conforme o tipo de processo
        let nomePessoaExtraido = '';
        
        if (tipoProcesso === 'CPLPMenor') {
          // Para processos CPLPMenor, tentar extrair dos dados do menor
          nomePessoaExtraido = processoEncontrado?.campos?.dados_do_menor?.nome_completo_do_menor || 
                               processoEncontrado?.campos?.dados_do_menor?.nome_completo || 
                               processoEncontrado?.dadosExtraidos?.campos?.dados_do_menor?.nome_completo_do_menor ||
                               processoEncontrado?.dadosExtraidos?.campos?.dados_do_menor?.nome_completo ||
                               processoEncontrado?.dadosExtraidos?.gpt?.dados_do_menor?.nome_completo_do_menor || 
                               processoEncontrado?.dadosExtraidos?.gpt?.dados_do_menor?.nome_completo || '';
          
          console.log("Nome extraído para CPLPMenor:", nomePessoaExtraido);
        } else {
          // Para outros processos
          nomePessoaExtraido = processoEncontrado?.campos?.nomeCompleto || 
                              processoEncontrado?.dadosExtraidos?.campos?.nomeCompleto ||
                              processoEncontrado?.dadosExtraidos?.gpt?.nomeCompleto || '';
          
          console.log("Nome extraído para processo regular:", nomePessoaExtraido);
        }
        
        // Se não encontrou o nome ainda, tentar outras possibilidades
        if (!nomePessoaExtraido) {
          if (processoEncontrado?.campos?.pessoaReagrupada?.nomeCompleto) {
            nomePessoaExtraido = processoEncontrado.campos.pessoaReagrupada.nomeCompleto;
          } else if (processoEncontrado?.dadosExtraidos?.campos?.pessoaReagrupada?.nomeCompleto) {
            nomePessoaExtraido = processoEncontrado.dadosExtraidos.campos.pessoaReagrupada.nomeCompleto;
          }
          console.log("Nome extraído da pessoa reagrupada:", nomePessoaExtraido);
        }
        
        // No caso de ainda não ter encontrado, usar um valor padrão para a exibição
        if (!nomePessoaExtraido) {
          nomePessoaExtraido = "Nome do Beneficiário";
          console.log("Usando nome padrão devido a dados incompletos");
        }
        
        setPessoaNome(nomePessoaExtraido);
        setLoading(false);
      } catch (err) {
        console.error('Erro ao carregar processo:', err);
        setError('Erro ao carregar dados do processo');
        setLoading(false);
      }
    };
    
    carregarProcesso();
  }, [processId, location]);
  
  const handleVoltar = () => {
    navigate('/inbox');
  };
  
  // Função para atualizar o nome da pessoa
  const handleNomeChange = (novoNome) => {
    console.log("Nome atualizado:", novoNome);
    setPessoaNome(novoNome);
    
    // Opcional: Também atualizar o nome no objeto processo para manter consistência
    if (processo) {
      const tipoProcesso = processo?.processId?.split('-')[0] || '';
      
      // Criar uma cópia atualizada do processo para usar em outros componentes
      const updatedProcesso = { ...processo };
      
      // Atualizar o nome no lugar correto com base no tipo de processo
      if (tipoProcesso === 'CPLPMenor') {
        // Para processos CPLPMenor
        if (updatedProcesso.campos?.dados_do_menor) {
          updatedProcesso.campos.dados_do_menor.nome_completo = novoNome;
          updatedProcesso.campos.dados_do_menor.nome_completo_do_menor = novoNome;
        }
      } else if (tipoProcesso.includes('Reagrupamento')) {
        // Para processos de Reagrupamento
        if (updatedProcesso.campos?.pessoaReagrupada) {
          updatedProcesso.campos.pessoaReagrupada.nomeCompleto = novoNome;
        }
      } else {
        // Para outros processos
        if (updatedProcesso.campos) {
          updatedProcesso.campos.nomeCompleto = novoNome;
        }
      }
      
      // Atualizar o estado do processo
      setProcesso(updatedProcesso);
    }
  };
  
  // Função para salvar o processo atualizado
  const handleSaveProcesso = async (dadosAtualizados) => {
    try {
      // Aqui você adicionaria a lógica para salvar os dados no backend
      console.log("Salvando dados atualizados:", dadosAtualizados);
      
      // Atualizar o estado local com os novos dados
      const updatedProcesso = {
        ...processo,
        campos: {
          ...processo.campos,
          ...dadosAtualizados
        }
      };
      
      // Garantir que selectedFields e outrosDetalhes estão no lugar certo
      if (dadosAtualizados.selectedFields) {
        updatedProcesso.campos.selectedFields = dadosAtualizados.selectedFields;
      }
      
      if (dadosAtualizados.outrosDetalhes) {
        updatedProcesso.campos.outrosDetalhes = dadosAtualizados.outrosDetalhes;
      }
      
      // Atualizar o estado com o processo atualizado
      setProcesso(updatedProcesso);
      
      // Se o nome foi atualizado, atualizar também o estado de pessoaNome
      const tipoProcesso = processo?.processId?.split('-')[0] || '';
      
      if (tipoProcesso === 'CPLPMenor') {
        if (dadosAtualizados.dados_do_menor?.nome_completo_do_menor) {
          setPessoaNome(dadosAtualizados.dados_do_menor.nome_completo_do_menor);
        } else if (dadosAtualizados.dados_do_menor?.nome_completo) {
          setPessoaNome(dadosAtualizados.dados_do_menor.nome_completo);
        }
      } else if (tipoProcesso.includes('Reagrupamento')) {
        if (dadosAtualizados.pessoaReagrupada?.nomeCompleto) {
          setPessoaNome(dadosAtualizados.pessoaReagrupada.nomeCompleto);
        }
      } else if (dadosAtualizados.nomeCompleto) {
        setPessoaNome(dadosAtualizados.nomeCompleto);
      }
      
      // Disparar evento para regenerar o PDF
      window.dispatchEvent(new CustomEvent('regeneratePdf'));
      
      return true; // Indicar sucesso
    } catch (err) {
      console.error("Erro ao salvar processo:", err);
      return false; // Indicar falha
    }
  };
  
  // Adicionar handler para mudanças no tipo CPLP
  const handleTipoCPLPChange = (newTipoCPLP) => {
    console.log("CPLP type changed to:", newTipoCPLP);
    setTipoCPLP(newTipoCPLP);
  };
  
  const tipoProcesso = processo?.processId?.split('-')[0] || '';
  
  // Determinar o caminho do PDF completo
  const pdfPath = processo?.arquivosUpload?.find(
    arquivo => arquivo.documentType === 'pdf_completo'
  )?.path || '';
  
  if (loading) {
    return (
      <Box className="processo-detalhes-container">
        <Typography className="loading-message">Carregando detalhes do processo...</Typography>
      </Box>
    );
  }
  
  if (error || !processo) {
    return (
      <Box className="processo-detalhes-container">
        <Typography className="error-message">{error || 'Processo não encontrado'}</Typography>
        <Button variant="contained" onClick={handleVoltar}>Voltar para a Inbox</Button>
      </Box>
    );
  }
  
  return (
    <Box className="processo-detalhes-container">
      <Box className="processo-header">
        <IconButton 
          onClick={handleVoltar}
          className="voltar-button"
          aria-label="Voltar para inbox"
        >
          <ChevronLeft />
        </IconButton>
        <Typography variant="h5" className="processo-titulo">
          Detalhes do Processo: {tipoProcesso}
        </Typography>
      </Box>
      
      <Grid container spacing={0} className="processo-content" style={{ width: '100%', margin: 0 }}>
        {/* Painel Esquerdo - PDF (40%) */}
        <Grid item xs={12} md={4.8} style={{ flexBasis: '40%', maxWidth: '40%', paddingRight: '8px', paddingLeft: 0 }} className="pdf-panel">
          <Paper className="painel" elevation={1}>
            <Typography variant="h6" className="painel-titulo">PDF</Typography>
            <PdfViewer 
              pdfPath={pdfPath} 
              nomePessoa={pessoaNome}
              processId={processo.processId}
              processo={processo}
            />
          </Paper>
        </Grid>
        
        {/* Painel Central - Formulário de Detalhes (15%) */}
        <Grid item xs={12} md={1.8} style={{ flexBasis: '15%', maxWidth: '15%', paddingLeft: '8px', paddingRight: '8px' }} className="formulario-panel">
          <Paper className="painel" elevation={1}>
            <Typography variant="h6" className="painel-titulo">Informações Extraídas</Typography>
            <DetalhesFormulario 
              processo={processo} 
              tipoProcesso={tipoProcesso} 
              simplified={true}
              onNomeChange={handleNomeChange}
              onSave={handleSaveProcesso}
              initialNome={pessoaNome}
              onTipoCPLPChange={handleTipoCPLPChange}
            />
          </Paper>
        </Grid>
        
        {/* Painel Direito - Template de Email (45%) */}
        <Grid item xs={12} md={5.4} style={{ flexBasis: '45%', maxWidth: '45%', paddingLeft: '8px', paddingRight: 0 }} className="email-panel">
          <Paper className="painel" elevation={1}>
            <Typography variant="h6" className="painel-titulo">Enviar E-mail</Typography>
            <TemplateEmail 
              processo={processo} 
              tipoProcesso={tipoProcesso} 
              simplified={true}
              nomePessoa={pessoaNome}
              tipoCPLP={tipoCPLP}
            />
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default ProcessoDetalhes; 