import React, { useState, useEffect } from 'react';
import { Box, Typography, TextField, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, InputAdornment, IconButton, Tooltip } from '@mui/material';
import { Search, Close, Refresh } from '@mui/icons-material';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { jsonData } from '../../services';
import './InboxStyles.css';
import { useNavigate } from 'react-router-dom';

const InboxPage = () => {
  const navigate = useNavigate();
  const [processos, setProcessos] = useState([]);
  const [filteredProcessos, setFilteredProcessos] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchProcessos = async () => {
    try {
      setLoading(true);
      // Buscar todos os processos do armazenamento
      const allProcessos = await jsonData.getAllProcesses();
      
      // Mapear para o formato necessário para a tabela
      const processedData = allProcessos.map(processo => {
        // Extrair o tipo principal (categoria) do tipo de processo
        let tipoProcesso = processo.processId ? processo.processId.split('-')[0] : 'Desconhecido';
        let categoriaPrincipal = '';
        
        // Mapear categoria principal com base no tipo
        if (tipoProcesso.includes('Renovacao')) {
          categoriaPrincipal = 'Renovação';
        } else if (tipoProcesso.includes('Concessao') || tipoProcesso.includes('Reagrupamento')) {
          categoriaPrincipal = 'Concessão';
        } else if (tipoProcesso.includes('CPLP') || tipoProcesso.startsWith('Maiores') || tipoProcesso.startsWith('Menores')) {
          categoriaPrincipal = 'CPLP';
        } else if (tipoProcesso.includes('Contagem')) {
          categoriaPrincipal = 'Contagem de Tempo';
        } else if (tipoProcesso.includes('Informacao')) {
          categoriaPrincipal = 'Informação';
        }
        
        // Formatar o tipo para exibição
        const tipoFormatado = tipoProcesso
          .replace('Reagrupamento', 'Reag.')
          .replace('Concessao', 'Conc.')
          .replace('Renovacao', 'Renov.');
        
        // Determinar o nome da pessoa baseado no tipo de processo
        let nomeCompleto = '';
        
        // Caso especial para processos de Reagrupamento
        if (tipoProcesso.includes('Reagrupamento')) {
          // Para processos de reagrupamento, buscar a pessoa reagrupada (beneficiário)
          
          // 1. Verificar na estrutura campos.pessoaReagrupada (formato mais recente)
          if (processo.campos?.pessoaReagrupada?.nomeCompleto) {
            nomeCompleto = processo.campos.pessoaReagrupada.nomeCompleto;
          } 
          // 2. Verificar na estrutura data.dadosExtraidos.pessoaReagrupada
          else if (processo.data?.dadosExtraidos?.pessoaReagrupada?.nomeCompleto) {
            nomeCompleto = processo.data.dadosExtraidos.pessoaReagrupada.nomeCompleto;
          }
          // 3. Verificar campos específicos para diferentes tipos de reagrupamento
          else {
            // Reagrupamento Cônjuge - verificar estruturas específicas
            if (tipoProcesso.includes('Conjuge')) {
              nomeCompleto = processo.campos?.nomeConjuge || 
                            processo.data?.dadosExtraidos?.nomeConjuge ||
                            processo.campos?.nomeReagrupado || 
                            processo.data?.dadosExtraidos?.nomeReagrupado;
            } 
            // Reagrupamento Filho - verificar campos específicos para filhos
            else if (tipoProcesso.includes('Filho')) {
              nomeCompleto = processo.campos?.nomeFilho || 
                            processo.data?.dadosExtraidos?.nomeFilho ||
                            processo.campos?.nomeReagrupado || 
                            processo.data?.dadosExtraidos?.nomeReagrupado;
            }
            // Reagrupamento Pais/Idosos - verificar campos específicos
            else if (tipoProcesso.includes('Pais') || tipoProcesso.includes('Idosos')) {
              nomeCompleto = processo.campos?.nomePai || 
                            processo.campos?.nomeMae || 
                            processo.data?.dadosExtraidos?.nomePai || 
                            processo.data?.dadosExtraidos?.nomeMae ||
                            processo.campos?.nomeReagrupado || 
                            processo.data?.dadosExtraidos?.nomeReagrupado;
            }
            // Reagrupamento Tutor - verificar campos específicos
            else if (tipoProcesso.includes('Tutor')) {
              nomeCompleto = processo.campos?.nomeMenor || 
                            processo.data?.dadosExtraidos?.nomeMenor ||
                            processo.campos?.nomeReagrupado || 
                            processo.data?.dadosExtraidos?.nomeReagrupado;
            }
            // Outros casos de reagrupamento ou fallback
            else {
              nomeCompleto = processo.campos?.nomePessoaReagrupada || 
                            processo.data?.dadosExtraidos?.nomePessoaReagrupada ||
                            processo.campos?.nomeBeneficiario || 
                            processo.data?.dadosExtraidos?.nomeBeneficiario ||
                            processo.campos?.nomeReagrupado || 
                            processo.data?.dadosExtraidos?.nomeReagrupado;
            }
          }
        } else {
          // Para outros tipos de processo, usar o nome normal da pessoa
          nomeCompleto = processo.campos?.nomeCompleto || processo.data?.dadosExtraidos?.nomeCompleto;
        }
        
        // Fallback para quando o nome não é encontrado
        if (!nomeCompleto) {
          nomeCompleto = 'Nome não extraído';
        }
        
        // Determinar a data de criação
        const dataProcesso = processo.timestamps?.criacao 
          ? new Date(processo.timestamps.criacao) 
          : processo.createdAt 
            ? new Date(processo.createdAt) 
            : new Date();
            
        return {
          id: processo.processId || processo.id,
          nome: nomeCompleto,
          tipoCompleto: tipoProcesso,
          tipo: tipoFormatado,
          categoria: categoriaPrincipal,
          data: dataProcesso,
          estado: processo.estado || 'Pendente'
        };
      });
      
      // Ordenar os processos do mais recente para o mais antigo
      processedData.sort((a, b) => b.data - a.data);
      
      setProcessos(processedData);
      setFilteredProcessos(processedData);
      setLoading(false);
      setRefreshing(false);
    } catch (error) {
      console.error('Erro ao buscar processos:', error);
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Carregar processos quando o componente monta
  useEffect(() => {
    fetchProcessos();
  }, []);
  
  // Função para atualizar manualmente
  const handleRefresh = () => {
    setRefreshing(true);
    fetchProcessos();
  };
  
  // Filtrar processos quando o termo de pesquisa muda
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredProcessos(processos);
      return;
    }
    
    const termLower = searchTerm.toLowerCase();
    const filtered = processos.filter(processo => 
      processo.nome.toLowerCase().includes(termLower) || 
      processo.tipoCompleto.toLowerCase().includes(termLower)
    );
    
    setFilteredProcessos(filtered);
  }, [searchTerm, processos]);
  
  // Limpar a pesquisa
  const handleClearSearch = () => {
    setSearchTerm('');
  };
  
  // Formatar data para exibição
  const formatarData = (data) => {
    return format(data, "dd/MM/yyyy HH:mm:ss", { locale: ptBR });
  };
  
  // Função para navegar para a página de detalhes do processo
  const handleRowClick = (processoId) => {
    // Codificar o ID para URL para evitar problemas com caracteres especiais
    const encodedId = encodeURIComponent(processoId);
    navigate(`/processo/${encodedId}`);
    console.log(`Navegando para: /processo/${encodedId}`);
  };

  return (
    <Box className="inbox-container">
      <Box className="inbox-header">
        <Typography variant="h5" className="inbox-title">
          Caixa de Entrada
        </Typography>
        
        <Tooltip title="Atualizar" arrow>
          <IconButton 
            onClick={handleRefresh} 
            className="refresh-button"
            disabled={loading || refreshing}
          >
            <Refresh 
              className={refreshing ? "refresh-icon rotating" : "refresh-icon"} 
            />
          </IconButton>
        </Tooltip>
      </Box>
      
      <Box className="search-container">
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Pesquisar por nome ou tipo de processo..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search style={{ color: '#666666' }} />
              </InputAdornment>
            ),
            endAdornment: searchTerm && (
              <InputAdornment position="end">
                <IconButton 
                  aria-label="limpar pesquisa" 
                  onClick={handleClearSearch}
                  edge="end"
                  size="small"
                >
                  <Close style={{ fontSize: '1rem', color: '#999999' }} />
                </IconButton>
              </InputAdornment>
            ),
            className: "search-input"
          }}
        />
      </Box>
      
      <TableContainer component={Paper} className="table-container">
        <Table aria-label="tabela de processos">
          <TableHead>
            <TableRow>
              <TableCell className="table-header">Nome</TableCell>
              <TableCell className="table-header">Tipo</TableCell>
              <TableCell className="table-header">Data e Hora</TableCell>
              <TableCell className="table-header">Estado</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={4} align="center">Carregando processos...</TableCell>
              </TableRow>
            ) : filteredProcessos.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} align="center">Nenhum processo encontrado</TableCell>
              </TableRow>
            ) : (
              filteredProcessos.map((processo) => (
                <TableRow 
                  key={processo.id} 
                  className="table-row"
                  onClick={() => handleRowClick(processo.id)}
                  style={{ cursor: 'pointer' }}
                >
                  <TableCell className="table-cell nome-cell">{processo.nome}</TableCell>
                  <TableCell className="table-cell tipo-cell" style={{ minWidth: '200px' }}>
                    <div className="tipo-container">
                      <span className={`categoria-badge ${processo.categoria.toLowerCase().replace(/\s+/g, '-')}`}>
                        {processo.categoria}
                      </span>
                      <span className="tipo-texto">{processo.tipo}</span>
                    </div>
                  </TableCell>
                  <TableCell className="table-cell data-cell">{formatarData(processo.data)}</TableCell>
                  <TableCell className="table-cell estado-cell">
                    <span className={`estado-badge ${processo.estado.toLowerCase()}`}>
                      {processo.estado}
                    </span>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default InboxPage; 