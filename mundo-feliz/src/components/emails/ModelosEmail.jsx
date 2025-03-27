import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  TextField, 
  Button, 
  Paper, 
  List, 
  ListItem, 
  ListItemButton, 
  ListItemText, 
  Divider,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import { Add, Delete, Edit, ContentCopy, Save } from '@mui/icons-material';
import { processTemplate } from '../../utils/processUtils';

// Modelos de email padrão para cada tipo de processo
const modelosEmailPadrao = {
  ReagrupamentoConjuge: {
    assunto: "Agendamento para entrega de documentos - Reagrupamento Familiar",
    corpo: `Prezado(a) {{pessoaQueRegrupa.nomeCompleto}},

Confirmamos o recebimento do seu pedido de reagrupamento familiar para o seu cônjuge {{pessoaReagrupada.nomeCompleto}}.

Para prosseguirmos com o seu processo, solicitamos o seu comparecimento no nosso escritório para a entrega dos seguintes documentos originais:

1. Título de Residência do requerente
2. Passaporte válido do cônjuge a reagrupar
3. Comprovativo de relação familiar (certidão de casamento)
4. Comprovativo de meios de subsistência
5. Comprovativo de alojamento

Data e hora do agendamento:
DATA: [INSERIR DATA]
HORA: [INSERIR HORA]
LOCAL: [INSERIR ENDEREÇO]

Pedimos que compareça com 15 minutos de antecedência e traga todos os documentos originais e respectivas cópias.

Em caso de dúvidas ou impossibilidade de comparecer na data agendada, por favor contacte-nos através deste e-mail ou pelo telefone [NÚMERO].

Atenciosamente,
Equipe de Atendimento
Mundo Feliz Serviços`
  },
  RenovacaoTitulo: {
    assunto: "Agendamento para renovação de título de residência",
    corpo: `Prezado(a) {{nomeCompleto}},

Confirmamos o recebimento do seu pedido de renovação de título de residência.

Para prosseguirmos com o seu processo, solicitamos o seu comparecimento no nosso escritório para a entrega dos seguintes documentos originais:

1. Título de Residência atual
2. Comprovativo de meios de subsistência
3. Comprovativo de alojamento
4. NIF
5. NISS

Data e hora do agendamento:
DATA: [INSERIR DATA]
HORA: [INSERIR HORA]
LOCAL: [INSERIR ENDEREÇO]

Pedimos que compareça com 15 minutos de antecedência e traga todos os documentos originais e respectivas cópias.

Em caso de dúvidas ou impossibilidade de comparecer na data agendada, por favor contacte-nos através deste e-mail ou pelo telefone [NÚMERO].

Atenciosamente,
Equipe de Atendimento
Mundo Feliz Serviços`
  },
  ManifestacaoInteresse: {
    assunto: "Confirmação de recebimento - Manifestação de Interesse",
    corpo: `Prezado(a) {{nomeCompleto}},

Confirmamos o recebimento da sua manifestação de interesse para obtenção de autorização de residência.

Para prosseguirmos com o seu processo, solicitamos o seu comparecimento no nosso escritório para a entrega dos seguintes documentos originais:

1. Passaporte válido
2. Comprovativo de entrada legal em Portugal (visto ou carimbo)
3. Comprovativo de meios de subsistência
4. Comprovativo de alojamento
5. NIF (se tiver)
6. NISS (se tiver)

Data e hora do agendamento:
DATA: [INSERIR DATA]
HORA: [INSERIR HORA]
LOCAL: [INSERIR ENDEREÇO]

Pedimos que compareça com 15 minutos de antecedência e traga todos os documentos originais e respectivas cópias.

Em caso de dúvidas ou impossibilidade de comparecer na data agendada, por favor contacte-nos através deste e-mail ou pelo telefone [NÚMERO].

Atenciosamente,
Equipe de Atendimento
Mundo Feliz Serviços`
  },
  default: {
    assunto: "Agendamento para entrega de documentos",
    corpo: `Prezado(a) {{nomeCompleto}},

Confirmamos o recebimento do seu pedido.

Para prosseguirmos com o seu processo, solicitamos o seu comparecimento no nosso escritório para a entrega dos documentos necessários.

Data e hora do agendamento:
DATA: [INSERIR DATA]
HORA: [INSERIR HORA]
LOCAL: [INSERIR ENDEREÇO]

Pedimos que compareça com 15 minutos de antecedência e traga todos os documentos originais e respectivas cópias.

Em caso de dúvidas ou impossibilidade de comparecer na data agendada, por favor contacte-nos através deste e-mail ou pelo telefone [NÚMERO].

Atenciosamente,
Equipe de Atendimento
Mundo Feliz Serviços`
  }
};

/**
 * Componente para gerenciar modelos de email para diferentes tipos de processo
 */
const ModelosEmail = ({ processo }) => {
  // Estado para armazenar os modelos de email (carregar do localStorage ou usar padrões)
  const [modelos, setModelos] = useState(() => {
    const modelosSalvos = localStorage.getItem('modelosEmail');
    return modelosSalvos ? JSON.parse(modelosSalvos) : modelosEmailPadrao;
  });
  
  // Estado para o modelo atualmente selecionado
  const [modeloSelecionado, setModeloSelecionado] = useState('default');
  const [assunto, setAssunto] = useState('');
  const [corpo, setCorpo] = useState('');
  const [modoEdicao, setModoEdicao] = useState(false);
  const [modoPreVisualizacao, setModoPreVisualizacao] = useState(false);
  const [emailProcessado, setEmailProcessado] = useState({ assunto: '', corpo: '' });
  
  // Diálogo para confirmação de exclusão
  const [dialogoExclusao, setDialogoExclusao] = useState(false);
  // Diálogo para adição de novo modelo
  const [dialogoNovoModelo, setDialogoNovoModelo] = useState(false);
  const [novoModeloNome, setNovoModeloNome] = useState('');
  
  // Carregar modelo selecionado
  useEffect(() => {
    if (modeloSelecionado && modelos[modeloSelecionado]) {
      setAssunto(modelos[modeloSelecionado].assunto || '');
      setCorpo(modelos[modeloSelecionado].corpo || '');
    }
  }, [modeloSelecionado, modelos]);
  
  // Salvar modelos no localStorage quando mudar
  useEffect(() => {
    localStorage.setItem('modelosEmail', JSON.stringify(modelos));
  }, [modelos]);
  
  // Processar o email com os dados do processo quando alternar para pré-visualização
  useEffect(() => {
    if (modoPreVisualizacao && processo) {
      const assuntoProcessado = processTemplate(assunto, processo);
      const corpoProcessado = processTemplate(corpo, processo);
      
      setEmailProcessado({
        assunto: assuntoProcessado,
        corpo: corpoProcessado
      });
    }
  }, [modoPreVisualizacao, processo, assunto, corpo]);
  
  const handleSalvarModelo = () => {
    if (!modeloSelecionado) return;
    
    setModelos(prev => ({
      ...prev,
      [modeloSelecionado]: {
        assunto,
        corpo
      }
    }));
    
    setModoEdicao(false);
  };
  
  const handleExcluirModelo = () => {
    if (modeloSelecionado === 'default') {
      alert('Não é possível excluir o modelo padrão.');
      return;
    }
    
    const novosModelos = { ...modelos };
    delete novosModelos[modeloSelecionado];
    
    setModelos(novosModelos);
    setModeloSelecionado('default');
    setDialogoExclusao(false);
  };
  
  const handleAdicionarModelo = () => {
    if (!novoModeloNome.trim()) {
      alert('Por favor, informe um nome para o modelo.');
      return;
    }
    
    // Converter para formato de ID (sem espaços ou caracteres especiais)
    const modeloId = novoModeloNome.trim()
      .replace(/\s+/g, '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
    
    if (modelos[modeloId]) {
      alert('Já existe um modelo com este nome.');
      return;
    }
    
    setModelos(prev => ({
      ...prev,
      [modeloId]: {
        assunto: `Assunto para ${novoModeloNome}`,
        corpo: `Corpo do email para ${novoModeloNome}\n\nInsira seu texto aqui.`
      }
    }));
    
    setModeloSelecionado(modeloId);
    setDialogoNovoModelo(false);
    setNovoModeloNome('');
    setModoEdicao(true);
  };
  
  const handleCopiarModelo = () => {
    // Criar um novo modelo baseado no atual, mas com "(Cópia)" no nome
    const modeloOriginal = modeloSelecionado;
    const modeloCopia = `${modeloOriginal}Copia`;
    let contador = 1;
    
    // Se já existir uma cópia, incrementar o contador
    let novoModeloId = modeloCopia;
    while (modelos[novoModeloId]) {
      novoModeloId = `${modeloCopia}${contador}`;
      contador++;
    }
    
    setModelos(prev => ({
      ...prev,
      [novoModeloId]: {
        assunto: `${assunto} (Cópia)`,
        corpo: corpo
      }
    }));
    
    setModeloSelecionado(novoModeloId);
  };
  
  // Formatação do nome do modelo para exibição
  const formatarNomeModelo = (id) => {
    if (id === 'default') return 'Padrão';
    
    // Adicionar espaços antes de letras maiúsculas e capitalizar primeira letra
    return id
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, (str) => str.toUpperCase());
  };
  
  return (
    <Box sx={{ display: 'flex', height: '100%' }}>
      {/* Painel lateral com lista de modelos */}
      <Paper 
        elevation={1} 
        sx={{ 
          width: 250, 
          mr: 2, 
          overflow: 'auto', 
          display: 'flex', 
          flexDirection: 'column' 
        }}
      >
        <Box sx={{ p: 2, bgcolor: 'primary.main', color: 'white' }}>
          <Typography variant="h6">Modelos de Email</Typography>
        </Box>
        
        <List sx={{ flex: 1, overflow: 'auto' }}>
          {Object.keys(modelos).map((id) => (
            <ListItem key={id} disablePadding>
              <ListItemButton 
                selected={modeloSelecionado === id}
                onClick={() => {
                  setModeloSelecionado(id);
                  setModoEdicao(false);
                  setModoPreVisualizacao(false);
                }}
              >
                <ListItemText primary={formatarNomeModelo(id)} />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
        
        <Divider />
        
        <Box sx={{ p: 1, display: 'flex', justifyContent: 'center' }}>
          <Button 
            startIcon={<Add />}
            onClick={() => setDialogoNovoModelo(true)}
            size="small"
            fullWidth
          >
            Novo Modelo
          </Button>
        </Box>
      </Paper>
      
      {/* Área principal com editor/visualizador */}
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <Box sx={{ 
          p: 1, 
          mb: 2, 
          display: 'flex', 
          justifyContent: 'space-between',
          bgcolor: 'background.default',
          borderRadius: 1
        }}>
          <Box>
            <Button 
              variant={modoEdicao ? "contained" : "outlined"}
              onClick={() => {
                setModoEdicao(true);
                setModoPreVisualizacao(false);
              }}
              size="small"
              startIcon={<Edit />}
              sx={{ mr: 1 }}
            >
              Editar
            </Button>
            
            <Button 
              variant={modoPreVisualizacao ? "contained" : "outlined"}
              onClick={() => {
                setModoPreVisualizacao(true);
                setModoEdicao(false);
              }}
              size="small"
              disabled={!processo}
              sx={{ mr: 1 }}
            >
              Pré-visualizar
            </Button>
          </Box>
          
          <Box>
            {modoEdicao && (
              <Button 
                variant="contained" 
                color="success"
                onClick={handleSalvarModelo}
                size="small"
                startIcon={<Save />}
                sx={{ mr: 1 }}
              >
                Salvar
              </Button>
            )}
            
            <IconButton 
              color="info" 
              onClick={handleCopiarModelo}
              size="small"
              sx={{ mr: 1 }}
            >
              <ContentCopy />
            </IconButton>
            
            <IconButton 
              color="error" 
              onClick={() => setDialogoExclusao(true)}
              size="small"
              disabled={modeloSelecionado === 'default'}
            >
              <Delete />
            </IconButton>
          </Box>
        </Box>
        
        {/* Formulário de edição ou pré-visualização */}
        <Paper elevation={1} sx={{ p: 2, flex: 1, overflow: 'auto' }}>
          {modoPreVisualizacao ? (
            <Box>
              <Typography variant="h6" gutterBottom>
                Assunto: {emailProcessado.assunto}
              </Typography>
              
              <Divider sx={{ my: 2 }} />
              
              <Typography 
                variant="body1" 
                sx={{ 
                  whiteSpace: 'pre-wrap', 
                  fontFamily: 'monospace',
                  bgcolor: 'background.default',
                  p: 2,
                  borderRadius: 1
                }}
              >
                {emailProcessado.corpo}
              </Typography>
            </Box>
          ) : (
            <Box>
              <TextField
                label="Assunto"
                fullWidth
                value={assunto}
                onChange={(e) => setAssunto(e.target.value)}
                disabled={!modoEdicao}
                sx={{ mb: 2 }}
              />
              
              <TextField
                label="Corpo do Email"
                multiline
                rows={15}
                fullWidth
                value={corpo}
                onChange={(e) => setCorpo(e.target.value)}
                disabled={!modoEdicao}
                sx={{ mb: 2 }}
              />
              
              {!modoEdicao && (
                <Typography variant="caption" color="text.secondary">
                  Clique em "Editar" para modificar este modelo ou "Pré-visualizar" para ver como ficará com os dados do processo.
                </Typography>
              )}
            </Box>
          )}
        </Paper>
      </Box>
      
      {/* Diálogo de confirmação de exclusão */}
      <Dialog open={dialogoExclusao} onClose={() => setDialogoExclusao(false)}>
        <DialogTitle>Confirmar Exclusão</DialogTitle>
        <DialogContent>
          <Typography>
            Tem certeza que deseja excluir o modelo "{formatarNomeModelo(modeloSelecionado)}"?
            Esta ação não pode ser desfeita.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogoExclusao(false)} variant="outlined">
            Cancelar
          </Button>
          <Button onClick={handleExcluirModelo} variant="contained" color="error">
            Excluir
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Diálogo para adicionar novo modelo */}
      <Dialog open={dialogoNovoModelo} onClose={() => setDialogoNovoModelo(false)}>
        <DialogTitle>Novo Modelo de Email</DialogTitle>
        <DialogContent>
          <TextField
            label="Nome do modelo"
            fullWidth
            value={novoModeloNome}
            onChange={(e) => setNovoModeloNome(e.target.value)}
            margin="normal"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogoNovoModelo(false)} variant="outlined">
            Cancelar
          </Button>
          <Button onClick={handleAdicionarModelo} variant="contained" color="primary">
            Criar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ModelosEmail; 