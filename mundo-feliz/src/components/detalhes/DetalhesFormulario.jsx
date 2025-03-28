import React, { useState, useEffect } from 'react';
import { Box, TextField, Typography, Button, Divider, Grid, Checkbox, FormControlLabel, InputAdornment, Select, MenuItem, FormControl, InputLabel } from '@mui/material';
import { Edit, Save, DocumentScanner, Person, Flag, Cake, CalendarMonth } from '@mui/icons-material';

// Importar a configuração e utilitários
import processoConfig from '../../config/processoConfig';
import { getNestedValue, extrairTipoProcesso } from '../../utils/processUtils';

const DetalhesFormulario = ({ 
  processo, 
  tipoProcesso, 
  simplified = false, 
  onNomeChange,
  onSave,
  initialNome,
  onTipoCPLPChange
}) => {
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({});
  const [selectedFields, setSelectedFields] = useState({});
  const [outrosDetalhes, setOutrosDetalhes] = useState('');
  const [tipoCPLP, setTipoCPLP] = useState('desbloqueio');
  
  // Adicionar useEffect para notificar quando tipoCPLP mudar
  useEffect(() => {
    if (onTipoCPLPChange) {
      onTipoCPLPChange(tipoCPLP);
    }
  }, [tipoCPLP, onTipoCPLPChange]);

  // Determinar o tipo de processo e obter a configuração correspondente
  const processType = tipoProcesso || extrairTipoProcesso(processo?.processId);
  const config = processoConfig[processType] || processoConfig.default;

  useEffect(() => {
    // Inicializar formData com os valores do processo
    if (processo) {
      // Primeiro, verificar campos de primeiro nível
      let initialData = processo.campos || {};
      
      // Verificar em dadosExtraidos se não encontrou nos campos de primeiro nível
      if (!initialData.pessoaReagrupada && !initialData.documentos?.pessoaReagrupada && processo.dadosExtraidos?.gpt?.pessoaReagrupada) {
        initialData = {
          ...initialData,
          pessoaReagrupada: processo.dadosExtraidos.gpt.pessoaReagrupada
        };
      }
      
      if (!initialData.pessoaQueRegrupa && !initialData.documentos?.pessoaQueRegrupa && processo.dadosExtraidos?.gpt?.pessoaQueRegrupa) {
        initialData = {
          ...initialData,
          pessoaQueRegrupa: processo.dadosExtraidos.gpt.pessoaQueRegrupa
        };
      }
      
      // Se temos a estrutura aninhada documentos, mover para o nível superior para o formulário
      if (initialData.documentos) {
        if (initialData.documentos.pessoaReagrupada) {
          initialData.pessoaReagrupada = initialData.documentos.pessoaReagrupada;
        }
        if (initialData.documentos.pessoaQueRegrupa) {
          initialData.pessoaQueRegrupa = initialData.documentos.pessoaQueRegrupa;
        }
        
        // Tratar caso específico de CPLPMenor
        if (initialData.documentos.dados_do_menor) {
          initialData.dados_do_menor = initialData.documentos.dados_do_menor;
        }
        
        // Tratar caso específico de dados do responsável de CPLPMenor
        if (initialData.documentos.dados_do_responsavel) {
          initialData.dados_do_responsavel = initialData.documentos.dados_do_responsavel;
        }
        
        // Para CPLPMaiores
        if (processType === 'CPLPMaiores' && initialData.documentos.nomeCompleto) {
          initialData.nomeCompleto = initialData.documentos.nomeCompleto;
          initialData.nacionalidade = initialData.documentos.nacionalidade;
          initialData.dataNascimento = initialData.documentos.dataNascimento;
          initialData.numeroPassaporte = initialData.documentos.numeroPassaporte;
          initialData.dataValidadePassaporte = initialData.documentos.dataValidadePassaporte;
          initialData.numeroVisto = initialData.documentos.numeroVisto;
        }
      }
      
      setFormData(initialData);

      // Inicializar os campos selecionados se existirem no processo
      if (processo.campos?.selectedFields) {
        setSelectedFields(processo.campos.selectedFields);
        console.log('Campos selecionados carregados do processo:', processo.campos.selectedFields);
      } else if (processo.selectedFields) {
        setSelectedFields(processo.selectedFields);
        console.log('Campos selecionados carregados diretamente do processo:', processo.selectedFields);
      } else {
        // Inicializar checkboxes vazios
        const initialCheckboxes = {};
        config.checkboxes.forEach(checkbox => {
          initialCheckboxes[checkbox.id] = false;
        });
        setSelectedFields(initialCheckboxes);
      }

      // Inicializar o campo de outros detalhes se existir
      if (processo.campos?.outrosDetalhes) {
        setOutrosDetalhes(processo.campos.outrosDetalhes);
      } else if (processo.outrosDetalhes) {
        setOutrosDetalhes(processo.outrosDetalhes);
      }
    }
    
    // Se initialNome estiver definido, usar esse valor para o campo nomeCompleto
    if (initialNome) {
      // Verificar se o processo é do tipo reagrupamento
      if (processType.includes('Reagrupamento')) {
        // Definir o nome da pessoa reagrupada se for reagrupamento
        setFormData(prev => ({
          ...prev,
          pessoaReagrupada: {
            ...prev.pessoaReagrupada,
            nomeCompleto: initialNome
          }
        }));
      } else {
        // Para outros processos, usar o campo nomeCompleto diretamente
        setFormData(prev => ({
          ...prev,
          nomeCompleto: initialNome
        }));
      }
    }
  }, [processo, config, initialNome, processType]);
  
  const handleInputChange = (e, campo) => {
    const { name, value } = e.target;
    const fieldName = name || campo;
    
    // Para campos aninhados com múltiplos níveis (ex: documentos.dados_do_menor.nome_completo)
    if (campo && campo.includes('.')) {
      const partes = campo.split('.');
      
      if (partes.length > 2) {
        // Para campos com mais de um nível de aninhamento
        setFormData(prev => {
          // Criar uma cópia profunda para evitar alterações imutáveis incorretas
          const novo = JSON.parse(JSON.stringify(prev));
          
          // Navegar pela estrutura até o penúltimo nível
          let atual = novo;
          for (let i = 0; i < partes.length - 1; i++) {
            const parte = partes[i];
            // Criar objeto se não existir
            if (!atual[parte]) atual[parte] = {};
            atual = atual[parte];
          }
          
          // Definir o valor na propriedade final
          atual[partes[partes.length - 1]] = value;

          // Atualizar o processo e PDF em tempo real após as mudanças
          const fieldName = partes[partes.length - 1];
          if (fieldName === 'nomeCompleto' || fieldName === 'nome_completo' || fieldName === 'nome_completo_do_menor') {
            // Se for o campo de nome, atualizar através do onNomeChange
            if (onNomeChange) {
              onNomeChange(value);
            }
          }

          // Disparar uma atualização do PDF quando os dados são alterados
          setTimeout(() => {
            const dadosAtualizados = {
              ...novo,
              selectedFields,
              outrosDetalhes
            };
            if (onSave) {
              onSave(dadosAtualizados);
            }
            // Disparar evento para regenerar PDF
            window.dispatchEvent(new CustomEvent('regeneratePdf'));
          }, 100);
          
          return novo;
        });
      } else {
        // Para campos com um nível de aninhamento (ex: pessoaReagrupada.nomeCompleto)
        const [parent, child] = partes;
        setFormData(prev => {
          const updated = {
            ...prev,
            [parent]: {
              ...prev[parent],
              [child]: value
            }
          };

          // Atualizar o nome se for o campo de nome
          if (child === 'nomeCompleto' || child === 'nome_completo' || child === 'nome_completo_do_menor') {
            if (onNomeChange) {
              onNomeChange(value);
            }
          }

          // Disparar uma atualização do PDF quando os dados são alterados
          setTimeout(() => {
            const dadosAtualizados = {
              ...updated,
              selectedFields,
              outrosDetalhes
            };
            if (onSave) {
              onSave(dadosAtualizados);
            }
            // Disparar evento para regenerar PDF
            window.dispatchEvent(new CustomEvent('regeneratePdf'));
          }, 100);

          return updated;
        });
        
        // Se estamos a lidar com processo ReagrupamentoPaiMaeFora e o campo parentesco está a ser limpo,
        // garante que ele mantenha o valor padrão
        if (processType === 'ReagrupamentoPaiMaeFora') {
          if (child === 'parentesco' && value === '') {
            const defaultValue = parent === 'pessoaQueRegrupa' ? 'PAI' : 
                                parent === 'pessoaReagrupada' ? 'FILHO' : value;
            
            // Atualiza o valor do campo para o valor padrão
            setTimeout(() => {
              setFormData(prev => {
                const updated = {
                  ...prev,
                  [parent]: {
                    ...prev[parent],
                    [child]: defaultValue
                  }
                };

                // Disparar atualização do PDF
                setTimeout(() => {
                  const dadosAtualizados = {
                    ...updated,
                    selectedFields,
                    outrosDetalhes
                  };
                  if (onSave) {
                    onSave(dadosAtualizados);
                  }
                  window.dispatchEvent(new CustomEvent('regeneratePdf'));
                }, 100);

                return updated;
              });
            }, 0);
          } else if (child === 'tipoDocumento' && value === '' && parent === 'pessoaQueRegrupa') {
            // Atualiza o valor do campo tipoDocumento para o valor padrão 'TR'
            setTimeout(() => {
              setFormData(prev => ({
                ...prev,
                [parent]: {
                  ...prev[parent],
                  [child]: 'TR'
                }
              }));
            }, 0);
          }
        } else if (processType === 'ReagrupamentoPaiIdoso') {
          if (child === 'parentesco' && value === '') {
            const defaultValue = parent === 'pessoaQueRegrupa' ? 'FILHO' : value;
            
            // Atualiza o valor do campo para o valor padrão
            setTimeout(() => {
              setFormData(prev => ({
                ...prev,
                [parent]: {
                  ...prev[parent],
                  [child]: defaultValue
                }
              }));
            }, 0);
          } else if (child === 'tipoDocumento' && value === '' && parent === 'pessoaQueRegrupa') {
            // Atualiza o valor do campo tipoDocumento para o valor padrão 'TR'
            setTimeout(() => {
              setFormData(prev => ({
                ...prev,
                [parent]: {
                  ...prev[parent],
                  [child]: 'TR'
                }
              }));
            }, 0);
          }
        } else if (processType === 'ReagrupamentoFilho') {
          if (child === 'parentesco' && value === '' && parent === 'pessoaQueRegrupa') {
            // Atualiza o valor do campo parentesco para o valor padrão 'FILHO'
            setTimeout(() => {
              setFormData(prev => ({
                ...prev,
                [parent]: {
                  ...prev[parent],
                  [child]: 'FILHO'
                }
              }));
            }, 0);
          } else if (child === 'tipoDocumento' && value === '' && parent === 'pessoaQueRegrupa') {
            // Atualiza o valor do campo tipoDocumento para o valor padrão 'TR'
            setTimeout(() => {
              setFormData(prev => ({
                ...prev,
                [parent]: {
                  ...prev[parent],
                  [child]: 'TR'
                }
              }));
            }, 0);
          }
        } else if (processType === 'ReagrupamentoConjuge') {
          if (child === 'parentesco' && value === '' && parent === 'pessoaQueRegrupa') {
            // Atualiza o valor do campo parentesco para o valor padrão 'CÔNJUGE'
            setTimeout(() => {
              setFormData(prev => ({
                ...prev,
                [parent]: {
                  ...prev[parent],
                  [child]: 'CÔNJUGE'
                }
              }));
            }, 0);
          } else if (child === 'tipoDocumento' && value === '' && parent === 'pessoaQueRegrupa') {
            // Atualiza o valor do campo tipoDocumento para o valor padrão 'TR'
            setTimeout(() => {
              setFormData(prev => ({
                ...prev,
                [parent]: {
                  ...prev[parent],
                  [child]: 'TR'
                }
              }));
            }, 0);
          }
        }
      }
    } else {
      // Para campos simples
      setFormData(prev => {
        const updated = {
          ...prev,
          [fieldName]: value
        };

        // Atualizar o nome se for o campo de nome
        if (fieldName === 'nomeCompleto' || fieldName === 'nome_completo' || fieldName === 'nome_completo_do_menor') {
          if (onNomeChange) {
            onNomeChange(value);
          }
        }

        // Disparar uma atualização do PDF quando os dados são alterados
        setTimeout(() => {
          const dadosAtualizados = {
            ...updated,
            selectedFields,
            outrosDetalhes
          };
          if (onSave) {
            onSave(dadosAtualizados);
          }
          // Disparar evento para regenerar PDF
          window.dispatchEvent(new CustomEvent('regeneratePdf'));
        }, 100);

        return updated;
      });
    }
  };
  
  const handleCheckboxChange = (event) => {
    const { name, checked } = event.target;
    
    // Se estiver desmarcando a opção "outros", limpa o campo de detalhes
    if (name === 'outros' && !checked) {
      setOutrosDetalhes('');
    }
    
    // Atualizar estado dos campos selecionados
    const updatedSelectedFields = {
      ...selectedFields,
      [name]: checked
    };
    
    setSelectedFields(updatedSelectedFields);
    
    // Preparar dados completos para salvar
    const dadosCompletos = {
      ...formData,
      selectedFields: updatedSelectedFields,
      outrosDetalhes: outrosDetalhes
    };
    
    // Salvar os dados usando a função onSave se fornecida
    if (onSave) {
      onSave(dadosCompletos);
    }
    
    // Regenerar o PDF automaticamente
    window.dispatchEvent(new CustomEvent('regeneratePdf'));
  };
  
  const handleSave = () => {
    // Criar uma cópia profunda dos dados do formulário
    const dataToSave = JSON.parse(JSON.stringify(formData));
    
    // Garantir que a estrutura de documentos exista
    if (!dataToSave.documentos) {
      dataToSave.documentos = {};
    }
    
    // Tratar casos específicos com base no tipo de processo
    if (processType.includes('Reagrupamento')) {
      // Garantir que as estruturas existam para Reagrupamento
      if (!dataToSave.pessoaReagrupada) {
        dataToSave.pessoaReagrupada = {};
      }
      if (!dataToSave.pessoaQueRegrupa) {
        dataToSave.pessoaQueRegrupa = {};
      }
      
      // Migrar dados para a estrutura aninhada documentos
      if (!dataToSave.documentos.pessoaReagrupada) {
        dataToSave.documentos.pessoaReagrupada = {...dataToSave.pessoaReagrupada};
      }
      if (!dataToSave.documentos.pessoaQueRegrupa) {
        dataToSave.documentos.pessoaQueRegrupa = {...dataToSave.pessoaQueRegrupa};
      }
      
      // Atribuir valores padrão, se necessário
      if (processType === 'ReagrupamentoPaiMaeFora') {
        if (!dataToSave.pessoaQueRegrupa.parentesco) dataToSave.pessoaQueRegrupa.parentesco = 'PAI';
        if (!dataToSave.pessoaQueRegrupa.tipoDocumento) dataToSave.pessoaQueRegrupa.tipoDocumento = 'TR';
        
        // Também atualizar na estrutura aninhada
        if (!dataToSave.documentos.pessoaQueRegrupa.parentesco) dataToSave.documentos.pessoaQueRegrupa.parentesco = 'PAI';
        if (!dataToSave.documentos.pessoaQueRegrupa.tipoDocumento) dataToSave.documentos.pessoaQueRegrupa.tipoDocumento = 'TR';
      } else if (processType === 'ReagrupamentoPaiIdoso') {
        if (!dataToSave.pessoaQueRegrupa.parentesco) dataToSave.pessoaQueRegrupa.parentesco = 'FILHO';
        if (!dataToSave.pessoaQueRegrupa.tipoDocumento) dataToSave.pessoaQueRegrupa.tipoDocumento = 'TR';
        
        // Também atualizar na estrutura aninhada
        if (!dataToSave.documentos.pessoaQueRegrupa.parentesco) dataToSave.documentos.pessoaQueRegrupa.parentesco = 'FILHO';
        if (!dataToSave.documentos.pessoaQueRegrupa.tipoDocumento) dataToSave.documentos.pessoaQueRegrupa.tipoDocumento = 'TR';
      } else if (processType === 'ReagrupamentoFilho') {
        if (!dataToSave.pessoaQueRegrupa.parentesco) dataToSave.pessoaQueRegrupa.parentesco = 'FILHO';
        if (!dataToSave.pessoaQueRegrupa.tipoDocumento) dataToSave.pessoaQueRegrupa.tipoDocumento = 'TR';
        
        // Também atualizar na estrutura aninhada
        if (!dataToSave.documentos.pessoaQueRegrupa.parentesco) dataToSave.documentos.pessoaQueRegrupa.parentesco = 'FILHO';
        if (!dataToSave.documentos.pessoaQueRegrupa.tipoDocumento) dataToSave.documentos.pessoaQueRegrupa.tipoDocumento = 'TR';
      } else if (processType === 'ReagrupamentoConjuge') {
        if (!dataToSave.pessoaQueRegrupa.parentesco) dataToSave.pessoaQueRegrupa.parentesco = 'CÔNJUGE';
        if (!dataToSave.pessoaQueRegrupa.tipoDocumento) dataToSave.pessoaQueRegrupa.tipoDocumento = 'TR';
        
        // Também atualizar na estrutura aninhada
        if (!dataToSave.documentos.pessoaQueRegrupa.parentesco) dataToSave.documentos.pessoaQueRegrupa.parentesco = 'CÔNJUGE';
        if (!dataToSave.documentos.pessoaQueRegrupa.tipoDocumento) dataToSave.documentos.pessoaQueRegrupa.tipoDocumento = 'TR';
      }
    } else if (processType === 'CPLPMaiores') {
      // Migrar dados para a estrutura aninhada documentos para CPLPMaiores
      dataToSave.documentos.nomeCompleto = dataToSave.nomeCompleto || '';
      dataToSave.documentos.nacionalidade = dataToSave.nacionalidade || '';
      dataToSave.documentos.dataNascimento = dataToSave.dataNascimento || '';
      dataToSave.documentos.numeroPassaporte = dataToSave.numeroPassaporte || '';
      dataToSave.documentos.dataValidadePassaporte = dataToSave.dataValidadePassaporte || '';
      dataToSave.documentos.numeroVisto = dataToSave.numeroVisto || '';
    } else if (processType === 'CPLPMenor') {
      // Garantir que a estrutura aninhada exista para CPLPMenor
      if (!dataToSave.documentos.dados_do_menor) {
        dataToSave.documentos.dados_do_menor = {};
      }
      if (!dataToSave.documentos.dados_do_responsavel) {
        dataToSave.documentos.dados_do_responsavel = {};
      }
      
      // Migrar dados para a estrutura aninhada documentos para CPLPMenor
      if (dataToSave.dados_do_menor) {
        dataToSave.documentos.dados_do_menor = {
          ...dataToSave.documentos.dados_do_menor,
          ...dataToSave.dados_do_menor
        };
      }
      
      if (dataToSave.dados_do_responsavel) {
        dataToSave.documentos.dados_do_responsavel = {
          ...dataToSave.documentos.dados_do_responsavel,
          ...dataToSave.dados_do_responsavel
        };
      }
    }
    
    // Preparar dados completos para salvar
    const dadosCompletos = {
      ...dataToSave,
      selectedFields: selectedFields,
      outrosDetalhes: outrosDetalhes
    };
    
    // Salvar os dados usando a função onSave se fornecida
    if (onSave) {
      onSave(dadosCompletos);
    }
    
    // Sair do modo de edição após salvar
    setEditMode(false);

    // Disparar evento para atualizar o PDF
    window.dispatchEvent(new CustomEvent('regeneratePdf'));
  };
   
  const handleToggleEditMode = () => {
    setEditMode(true);
  };
  
  // Renderizar formulário simplificado (estilo da imagem de referência)
  const renderSimplifiedForm = () => {
    // Verificar se o processo é do tipo reagrupamento
    const isReagrupamento = processType.includes('Reagrupamento');
    const isCPLPMenor = processType === 'CPLPMenor';
    
    return (
      <Box className="simplified-form" sx={{ width: '100%' }}>
        {/* Botões de Editar/Salvar */}
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 1 }}>
          {editMode ? (
            <Button 
              size="small" 
              variant="contained" 
              color="primary" 
              startIcon={<Save />} 
              onClick={handleSave}
              sx={{ fontSize: '0.75rem', py: 0.5 }}
            >
              Salvar
            </Button>
          ) : (
            <Button 
              size="small" 
              variant="outlined" 
              color="primary" 
              startIcon={<Edit />} 
              onClick={handleToggleEditMode}
              sx={{ fontSize: '0.75rem', py: 0.5 }}
            >
              Editar
            </Button>
          )}
        </Box>

        {/* Dropdown CPLP */}
        {processType === 'CPLPMaiores' && (
          <Grid item xs={12}>
            <FormControl fullWidth>
              <InputLabel>Tipo de Processo CPLP</InputLabel>
              <Select
                value={tipoCPLP}
                onChange={(e) => {
                  setTipoCPLP(e.target.value);
                  if (onTipoCPLPChange) {
                    onTipoCPLPChange(e.target.value);
                  }
                }}
                label="Tipo de Processo CPLP"
              >
                <MenuItem value="desbloqueio">Desbloqueio</MenuItem>
                <MenuItem value="analise">Análise</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        )}
        
        {/* Checkboxes de documentos */}
        <Box sx={{ width: '100%' }}>
          {config.checkboxes.map((checkbox, index) => 
            checkbox.id !== 'outros' ? (
              <FormControlLabel
                key={checkbox.id}
                control={
                  <Checkbox 
                    checked={selectedFields[checkbox.id] || false} 
                    onChange={handleCheckboxChange} 
                    name={checkbox.id}
                    size="small"
                    disabled={!editMode}
                  />
                }
                label={<Typography variant="body2" style={{ fontSize: '0.8rem' }}>{checkbox.label}</Typography>}
                sx={{ width: '100%', margin: '0 0 -2px 0' }}
              />
            ) : null
          )}
          
          {/* Opção Outros com campo de texto */}
          <Box sx={{ width: '100%', display: 'flex', alignItems: 'center', marginTop: '-2px', marginBottom: '-2px' }}>
            <FormControlLabel
              control={
                <Checkbox 
                  checked={selectedFields.outros || false} 
                  onChange={handleCheckboxChange} 
                  name="outros"
                  size="small"
                  disabled={!editMode}
                />
              }
              label={<Typography variant="body2" style={{ fontSize: '0.8rem' }}>Outros</Typography>}
              sx={{ margin: 0 }}
            />
            <TextField 
              size="small"
              variant="outlined"
              placeholder="Especifique"
              disabled={!selectedFields.outros}
              value={outrosDetalhes}
              onChange={(e) => {
                const newValue = e.target.value;
                setOutrosDetalhes(newValue);
                
                // Preparar dados completos para salvar
                const dadosCompletos = {
                  ...formData,
                  selectedFields: selectedFields,
                  outrosDetalhes: newValue
                };
                
                // Salvar os dados usando a função onSave se fornecida
                if (onSave) {
                  onSave(dadosCompletos);
                }
                
                // Regenerar o PDF automaticamente
                window.dispatchEvent(new CustomEvent('regeneratePdf'));
              }}
              sx={{ 
                marginLeft: '8px',
                flex: 1,
                '& .MuiInputBase-root': { 
                  height: '26px', 
                  fontSize: '0.8rem',
                  backgroundColor: !editMode ? 'rgba(232, 244, 253, 0.3)' : 'inherit'
                } 
              }}
            />
          </Box>
        </Box>
        
        {/* Formulário específico para Reagrupamento */}
        {isReagrupamento ? (
          <Box>
            {/* Pessoa a Reagrupar (cônjuge) */}
            <Typography variant="subtitle2" style={{ fontSize: '0.85rem', fontWeight: 'bold', marginTop: '16px', marginBottom: '4px' }}>
              {processType === 'ReagrupamentoConjuge' && "Dados do Cônjuge a Reagrupar"}
              {processType === 'ReagrupamentoPaiMaeFora' && "Dados da Pessoa a Reagrupar (Filho)"}
              {processType === 'ReagrupamentoFilho' && "Dados da Pessoa a Reagrupar (Pai/Mãe)"}
              {processType === 'ReagrupamentoTutor' && "Dados da Pessoa a Reagrupar (Menor)"}
              {processType === 'ReagrupamentoPaiIdoso' && "Dados da Pessoa a Reagrupar (Pai)"}
            </Typography>
            
            <Box className="form-field" mt={1} sx={{ width: '100%' }}>
              <Typography variant="body2" className="field-label" style={{ fontSize: '0.8rem' }}>
                Nome Completo
              </Typography>
              <TextField
                name="pessoaReagrupada.nomeCompleto"
                value={formData.pessoaReagrupada?.nomeCompleto || ''}
                onChange={(e) => handleInputChange(e, 'pessoaReagrupada.nomeCompleto')}
                disabled={false}
                variant="outlined"
                size="small"
                fullWidth
                sx={{ 
                  '& .MuiInputBase-root': { 
                    height: '30px',
                    fontSize: '0.85rem',
                    backgroundColor: !editMode ? 'rgba(232, 244, 253, 0.3)' : 'inherit'
                  }
                }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Person fontSize="small" />
                    </InputAdornment>
                  )
                }}
              />
            </Box>
            
            {/* Campo de parentesco para processos ReagrupamentoPaiMaeFora */}
            {processType === 'ReagrupamentoPaiMaeFora' && (
              <Box className="form-field" mt={1} sx={{ width: '100%' }}>
                <Typography variant="body2" className="field-label" style={{ fontSize: '0.8rem' }}>
                  Parentesco
                </Typography>
                <Select
                  name="pessoaReagrupada.parentesco"
                  value={formData.pessoaReagrupada?.parentesco || 'FILHO'}
                  onChange={(e) => handleInputChange(e, 'pessoaReagrupada.parentesco')}
                  disabled={!editMode}
                  variant="outlined"
                  size="small"
                  fullWidth
                  sx={{ 
                    '& .MuiInputBase-root': { 
                      height: '30px',
                      fontSize: '0.85rem',
                      backgroundColor: !editMode ? 'rgba(232, 244, 253, 0.3)' : 'inherit'
                    }
                  }}
                >
                  <MenuItem value="FILHO">Filho</MenuItem>
                  <MenuItem value="FILHA">Filha</MenuItem>
                </Select>
              </Box>
            )}
            
            {/* Campo de parentesco para processos ReagrupamentoPaiIdoso */}
            {processType === 'ReagrupamentoPaiIdoso' && (
              <Box className="form-field" mt={1} sx={{ width: '100%' }}>
                <Typography variant="body2" className="field-label" style={{ fontSize: '0.8rem' }}>
                  Parentesco
                </Typography>
                <Select
                  name="pessoaReagrupada.parentesco"
                  value={formData.pessoaReagrupada?.parentesco || 'FILHO'}
                  onChange={(e) => handleInputChange(e, 'pessoaReagrupada.parentesco')}
                  disabled={!editMode}
                  variant="outlined"
                  size="small"
                  fullWidth
                  sx={{ 
                    '& .MuiInputBase-root': { 
                      height: '30px',
                      fontSize: '0.85rem',
                      backgroundColor: !editMode ? 'rgba(232, 244, 253, 0.3)' : 'inherit'
                    }
                  }}
                >
                  <MenuItem value="FILHO">Filho</MenuItem>
                  <MenuItem value="FILHA">Filha</MenuItem>
                </Select>
              </Box>
            )}
            
            <Box className="form-field" mt={1} sx={{ width: '100%' }}>
              <Typography variant="body2" className="field-label" style={{ fontSize: '0.8rem' }}>
                Número do Passaporte
              </Typography>
              <TextField
                name="pessoaReagrupada.numeroPassaporte"
                value={formData.pessoaReagrupada?.numeroPassaporte || ''}
                onChange={(e) => handleInputChange(e, 'pessoaReagrupada.numeroPassaporte')}
                disabled={false}
                variant="outlined"
                size="small"
                fullWidth
                sx={{ 
                  '& .MuiInputBase-root': { 
                    height: '30px',
                    fontSize: '0.85rem',
                    backgroundColor: !editMode ? 'rgba(232, 244, 253, 0.3)' : 'inherit'
                  }
                }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <DocumentScanner fontSize="small" />
                    </InputAdornment>
                  )
                }}
              />
            </Box>
            
            <Box className="form-field" mt={1} sx={{ width: '100%' }}>
              <Typography variant="body2" className="field-label" style={{ fontSize: '0.8rem' }}>
                Data de Nascimento
              </Typography>
              <TextField
                name="pessoaReagrupada.dataNascimento"
                value={formData.pessoaReagrupada?.dataNascimento || ''}
                onChange={(e) => handleInputChange(e, 'pessoaReagrupada.dataNascimento')}
                disabled={false}
                variant="outlined"
                size="small"
                fullWidth
                sx={{ 
                  '& .MuiInputBase-root': { 
                    height: '30px',
                    fontSize: '0.85rem',
                    backgroundColor: !editMode ? 'rgba(232, 244, 253, 0.3)' : 'inherit'
                  }
                }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Cake fontSize="small" />
                    </InputAdornment>
                  )
                }}
              />
            </Box>
            
            <Box className="form-field" mt={1} sx={{ width: '100%' }}>
              <Typography variant="body2" className="field-label" style={{ fontSize: '0.8rem' }}>
                Nacionalidade
              </Typography>
              <TextField
                name="pessoaReagrupada.nacionalidade"
                value={formData.pessoaReagrupada?.nacionalidade || ''}
                onChange={(e) => handleInputChange(e, 'pessoaReagrupada.nacionalidade')}
                disabled={false}
                variant="outlined"
                size="small"
                fullWidth
                sx={{ 
                  '& .MuiInputBase-root': { 
                    height: '30px',
                    fontSize: '0.85rem',
                    backgroundColor: !editMode ? 'rgba(232, 244, 253, 0.3)' : 'inherit'
                  }
                }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Flag fontSize="small" />
                    </InputAdornment>
                  )
                }}
              />
            </Box>
            
            <Box className="form-field" mt={1} sx={{ width: '100%' }}>
              <Typography variant="body2" className="field-label" style={{ fontSize: '0.8rem' }}>
                Data de Validade do Passaporte
              </Typography>
              <TextField
                name="pessoaReagrupada.dataValidadePassaporte"
                value={formData.pessoaReagrupada?.dataValidadePassaporte || ''}
                onChange={(e) => handleInputChange(e, 'pessoaReagrupada.dataValidadePassaporte')}
                disabled={false}
                variant="outlined"
                size="small"
                fullWidth
                sx={{ 
                  '& .MuiInputBase-root': { 
                    height: '30px',
                    fontSize: '0.85rem',
                    backgroundColor: !editMode ? 'rgba(232, 244, 253, 0.3)' : 'inherit'
                  }
                }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <CalendarMonth fontSize="small" />
                    </InputAdornment>
                  )
                }}
              />
            </Box>
            
            {/* Pessoa que Reagrupa (requerente) */}
            <Typography variant="subtitle2" style={{ fontSize: '0.85rem', fontWeight: 'bold', marginTop: '16px', marginBottom: '4px' }}>
              {processType === 'ReagrupamentoConjuge' && "Dados do Requerente"}
              {processType === 'ReagrupamentoPaiMaeFora' && "Dados do Pai/Mãe Residente"}
              {processType === 'ReagrupamentoFilho' && "Dados do Filho Residente"}
              {processType === 'ReagrupamentoTutor' && "Dados do Tutor Residente"}
              {processType === 'ReagrupamentoPaiIdoso' && "Dados do Filho Residente"}
            </Typography>
            
            <Box className="form-field" mt={1} sx={{ width: '100%' }}>
              <Typography variant="body2" className="field-label" style={{ fontSize: '0.8rem' }}>
                Nome Completo
              </Typography>
              <TextField
                name="pessoaQueRegrupa.nomeCompleto"
                value={formData.pessoaQueRegrupa?.nomeCompleto || ''}
                onChange={(e) => handleInputChange(e, 'pessoaQueRegrupa.nomeCompleto')}
                disabled={!editMode}
                variant="outlined"
                size="small"
                fullWidth
                sx={{ 
                  '& .MuiInputBase-root': { 
                    height: '30px',
                    fontSize: '0.85rem',
                    backgroundColor: !editMode ? 'rgba(232, 244, 253, 0.3)' : 'inherit'
                  }
                }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Person fontSize="small" />
                    </InputAdornment>
                  )
                }}
              />
            </Box>
            
            {/* Campo de parentesco para processos ReagrupamentoFilho */}
            {processType === 'ReagrupamentoFilho' && (
              <Box className="form-field" mt={1} sx={{ width: '100%' }}>
                <Typography variant="body2" className="field-label" style={{ fontSize: '0.8rem' }}>
                  Parentesco
                </Typography>
                <Select
                  name="pessoaQueRegrupa.parentesco"
                  value={formData.pessoaQueRegrupa?.parentesco || 'FILHO'}
                  onChange={(e) => handleInputChange(e, 'pessoaQueRegrupa.parentesco')}
                  disabled={!editMode}
                  variant="outlined"
                  size="small"
                  fullWidth
                  sx={{ 
                    '& .MuiInputBase-root': { 
                      height: '30px',
                      fontSize: '0.85rem',
                      backgroundColor: !editMode ? 'rgba(232, 244, 253, 0.3)' : 'inherit'
                    }
                  }}
                >
                  <MenuItem value="FILHO">Filho</MenuItem>
                  <MenuItem value="FILHA">Filha</MenuItem>
                </Select>
              </Box>
            )}
            
            {/* Campo de tipo de documento para processos ReagrupamentoFilho */}
            {processType === 'ReagrupamentoFilho' && (
              <Box className="form-field" mt={1} sx={{ width: '100%' }}>
                <Typography variant="body2" className="field-label" style={{ fontSize: '0.8rem' }}>
                  Tipo de Documento
                </Typography>
                <Select
                  name="pessoaQueRegrupa.tipoDocumento"
                  value={formData.pessoaQueRegrupa?.tipoDocumento || 'TR'}
                  onChange={(e) => handleInputChange(e, 'pessoaQueRegrupa.tipoDocumento')}
                  disabled={!editMode}
                  variant="outlined"
                  size="small"
                  fullWidth
                  sx={{ 
                    '& .MuiInputBase-root': { 
                      height: '30px',
                      fontSize: '0.85rem',
                      backgroundColor: !editMode ? 'rgba(232, 244, 253, 0.3)' : 'inherit'
                    }
                  }}
                >
                  <MenuItem value="TR">TR</MenuItem>
                  <MenuItem value="CC">CC</MenuItem>
                </Select>
              </Box>
            )}
            
            {/* Campo de tipo de documento para processos ReagrupamentoConjuge */}
            {processType === 'ReagrupamentoConjuge' && (
              <Box className="form-field" mt={1} sx={{ width: '100%' }}>
                <Typography variant="body2" className="field-label" style={{ fontSize: '0.8rem' }}>
                  Tipo de Documento
                </Typography>
                <Select
                  name="pessoaQueRegrupa.tipoDocumento"
                  value={formData.pessoaQueRegrupa?.tipoDocumento || 'TR'}
                  onChange={(e) => handleInputChange(e, 'pessoaQueRegrupa.tipoDocumento')}
                  disabled={!editMode}
                  variant="outlined"
                  size="small"
                  fullWidth
                  sx={{ 
                    '& .MuiInputBase-root': { 
                      height: '30px',
                      fontSize: '0.85rem',
                      backgroundColor: !editMode ? 'rgba(232, 244, 253, 0.3)' : 'inherit'
                    }
                  }}
                >
                  <MenuItem value="TR">TR</MenuItem>
                  <MenuItem value="CC">CC</MenuItem>
                </Select>
              </Box>
            )}
            
            {/* Campo de parentesco para processos ReagrupamentoPaiMaeFora */}
            {processType === 'ReagrupamentoPaiMaeFora' && (
              <Box className="form-field" mt={1} sx={{ width: '100%' }}>
                <Typography variant="body2" className="field-label" style={{ fontSize: '0.8rem' }}>
                  Parentesco
                </Typography>
                <Select
                  name="pessoaQueRegrupa.parentesco"
                  value={formData.pessoaQueRegrupa?.parentesco || 'PAI'}
                  onChange={(e) => handleInputChange(e, 'pessoaQueRegrupa.parentesco')}
                  disabled={!editMode}
                  variant="outlined"
                  size="small"
                  fullWidth
                  sx={{ 
                    '& .MuiInputBase-root': { 
                      height: '30px',
                      fontSize: '0.85rem',
                      backgroundColor: !editMode ? 'rgba(232, 244, 253, 0.3)' : 'inherit'
                    }
                  }}
                >
                  <MenuItem value="PAI">Pai</MenuItem>
                  <MenuItem value="MÃE">Mãe</MenuItem>
                </Select>
              </Box>
            )}
            
            {/* Campo de tipo de documento para processos ReagrupamentoPaiMaeFora */}
            {processType === 'ReagrupamentoPaiMaeFora' && (
              <Box className="form-field" mt={1} sx={{ width: '100%' }}>
                <Typography variant="body2" className="field-label" style={{ fontSize: '0.8rem' }}>
                  Tipo de Documento
                </Typography>
                <Select
                  name="pessoaQueRegrupa.tipoDocumento"
                  value={formData.pessoaQueRegrupa?.tipoDocumento || 'TR'}
                  onChange={(e) => handleInputChange(e, 'pessoaQueRegrupa.tipoDocumento')}
                  disabled={!editMode}
                  variant="outlined"
                  size="small"
                  fullWidth
                  sx={{ 
                    '& .MuiInputBase-root': { 
                      height: '30px',
                      fontSize: '0.85rem',
                      backgroundColor: !editMode ? 'rgba(232, 244, 253, 0.3)' : 'inherit'
                    }
                  }}
                >
                  <MenuItem value="TR">TR</MenuItem>
                  <MenuItem value="CC">CC</MenuItem>
                </Select>
              </Box>
            )}
            
            {/* Campo de tipo de documento para processos ReagrupamentoPaiIdoso */}
            {processType === 'ReagrupamentoPaiIdoso' && (
              <Box className="form-field" mt={1} sx={{ width: '100%' }}>
                <Typography variant="body2" className="field-label" style={{ fontSize: '0.8rem' }}>
                  Tipo de Documento
                </Typography>
                <Select
                  name="pessoaQueRegrupa.tipoDocumento"
                  value={formData.pessoaQueRegrupa?.tipoDocumento || 'TR'}
                  onChange={(e) => handleInputChange(e, 'pessoaQueRegrupa.tipoDocumento')}
                  disabled={!editMode}
                  variant="outlined"
                  size="small"
                  fullWidth
                  sx={{ 
                    '& .MuiInputBase-root': { 
                      height: '30px',
                      fontSize: '0.85rem',
                      backgroundColor: !editMode ? 'rgba(232, 244, 253, 0.3)' : 'inherit'
                    }
                  }}
                >
                  <MenuItem value="TR">TR</MenuItem>
                  <MenuItem value="CC">CC</MenuItem>
                </Select>
              </Box>
            )}
            
            {/* Campo de parentesco para processos ReagrupamentoPaiIdoso */}
            {processType === 'ReagrupamentoPaiIdoso' && (
              <Box className="form-field" mt={1} sx={{ width: '100%' }}>
                <Typography variant="body2" className="field-label" style={{ fontSize: '0.8rem' }}>
                  Parentesco
                </Typography>
                <Select
                  name="pessoaQueRegrupa.parentesco"
                  value={formData.pessoaQueRegrupa?.parentesco || 'FILHO'}
                  onChange={(e) => handleInputChange(e, 'pessoaQueRegrupa.parentesco')}
                  disabled={!editMode}
                  variant="outlined"
                  size="small"
                  fullWidth
                  sx={{ 
                    '& .MuiInputBase-root': { 
                      height: '30px',
                      fontSize: '0.85rem',
                      backgroundColor: !editMode ? 'rgba(232, 244, 253, 0.3)' : 'inherit'
                    }
                  }}
                >
                  <MenuItem value="FILHO">Filho</MenuItem>
                  <MenuItem value="FILHA">Filha</MenuItem>
                </Select>
              </Box>
            )}
            
            <Box className="form-field" mt={1} sx={{ width: '100%' }}>
              <Typography variant="body2" className="field-label" style={{ fontSize: '0.8rem' }}>
                Número do Documento
              </Typography>
              <TextField
                name="pessoaQueRegrupa.numeroDocumento"
                value={formData.pessoaQueRegrupa?.numeroDocumento || ''}
                onChange={(e) => handleInputChange(e, 'pessoaQueRegrupa.numeroDocumento')}
                disabled={false}
                variant="outlined"
                size="small"
                fullWidth
                sx={{ 
                  '& .MuiInputBase-root': { 
                    height: '30px',
                    fontSize: '0.85rem',
                    backgroundColor: !editMode ? 'rgba(232, 244, 253, 0.3)' : 'inherit'
                  }
                }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <DocumentScanner fontSize="small" />
                    </InputAdornment>
                  )
                }}
              />
            </Box>
            
            <Box className="form-field" mt={1} sx={{ width: '100%' }}>
              <Typography variant="body2" className="field-label" style={{ fontSize: '0.8rem' }}>
                Data de Nascimento
              </Typography>
              <TextField
                name="pessoaQueRegrupa.dataNascimento"
                value={formData.pessoaQueRegrupa?.dataNascimento || ''}
                onChange={(e) => handleInputChange(e, 'pessoaQueRegrupa.dataNascimento')}
                disabled={false}
                variant="outlined"
                size="small"
                fullWidth
                sx={{ 
                  '& .MuiInputBase-root': { 
                    height: '30px',
                    fontSize: '0.85rem',
                    backgroundColor: !editMode ? 'rgba(232, 244, 253, 0.3)' : 'inherit'
                  }
                }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Cake fontSize="small" />
                    </InputAdornment>
                  )
                }}
              />
            </Box>
            
            <Box className="form-field" mt={1} sx={{ width: '100%' }}>
              <Typography variant="body2" className="field-label" style={{ fontSize: '0.8rem' }}>
                Nacionalidade
              </Typography>
              <TextField
                name="pessoaQueRegrupa.nacionalidade"
                value={formData.pessoaQueRegrupa?.nacionalidade || ''}
                onChange={(e) => handleInputChange(e, 'pessoaQueRegrupa.nacionalidade')}
                disabled={false}
                variant="outlined"
                size="small"
                fullWidth
                sx={{ 
                  '& .MuiInputBase-root': { 
                    height: '30px',
                    fontSize: '0.85rem',
                    backgroundColor: !editMode ? 'rgba(232, 244, 253, 0.3)' : 'inherit'
                  }
                }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Flag fontSize="small" />
                    </InputAdornment>
                  )
                }}
              />
            </Box>
            
            <Box className="form-field" mt={1} sx={{ width: '100%' }}>
              <Typography variant="body2" className="field-label" style={{ fontSize: '0.8rem' }}>
                Data de Validade
              </Typography>
              <TextField
                name="pessoaQueRegrupa.dataValidade"
                value={formData.pessoaQueRegrupa?.dataValidade || ''}
                onChange={(e) => handleInputChange(e, 'pessoaQueRegrupa.dataValidade')}
                disabled={false}
                variant="outlined"
                size="small"
                fullWidth
                sx={{ 
                  '& .MuiInputBase-root': { 
                    height: '30px',
                    fontSize: '0.85rem',
                    backgroundColor: !editMode ? 'rgba(232, 244, 253, 0.3)' : 'inherit'
                  }
                }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <CalendarMonth fontSize="small" />
                    </InputAdornment>
                  )
                }}
              />
            </Box>
          </Box>
        ) : (
          // Renderizar grupos de campos para processos não reagrupamento
          config.painelCampos.map((grupo, grupoIndex) => (
            <Box key={grupoIndex} mt={2}>
              {grupo.titulo && (
                <Typography variant="subtitle2" style={{ fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '4px' }}>
                  {grupo.titulo}
                </Typography>
              )}
              
              {grupo.campos.map((campo, campoIndex) => {
                // Determinar o valor a ser exibido
                let valorCampo = '';
                if (campo.id.includes('.')) {
                  // Lidar com campos aninhados com múltiplos níveis (ex: documentos.dados_do_menor.nome_completo)
                  const partes = campo.id.split('.');
                  if (partes.length > 2) {
                    // Para campos com mais de um nível de aninhamento (ex: documentos.dados_do_menor.nome_completo)
                    let valor = formData;
                    for (const parte of partes) {
                      valor = valor && valor[parte] ? valor[parte] : undefined;
                    }
                    valorCampo = valor || '';
                  } else {
                    // Para campos com um nível de aninhamento (ex: pessoaReagrupada.nomeCompleto)
                    const [parent, child] = partes;
                    valorCampo = formData[parent] ? formData[parent][child] || '' : '';
                    
                    // Adicionar valores padrão para o processo ReagrupamentoPaiMaeFora
                    if (processType === 'ReagrupamentoPaiMaeFora') {
                      if (valorCampo === '' && parent === 'pessoaQueRegrupa' && child === 'parentesco') {
                        valorCampo = 'PAI';
                      } else if (valorCampo === '' && parent === 'pessoaReagrupada' && child === 'parentesco') {
                        valorCampo = 'FILHO';
                      } else if (valorCampo === '' && parent === 'pessoaQueRegrupa' && child === 'tipoDocumento') {
                        valorCampo = 'TR';
                      }
                    }
                  }
                } else {
                  valorCampo = formData[campo.id] || '';
                }
                
                // Converter para string para evitar [object Object]
                if (typeof valorCampo === 'object' && valorCampo !== null) {
                  valorCampo = JSON.stringify(valorCampo);
                }
                
                // Verificar se deve exibir o campo com base no seu tipo e valor
                const shouldDisplayField = 
                  // Sempre exibir campos que tenham valor
                  valorCampo !== '' || 
                  // Sempre exibir campos de parentesco para ReagrupamentoPaiMaeFora
                  (processType === 'ReagrupamentoPaiMaeFora' && campo.id.endsWith('parentesco')) ||
                  // Sempre exibir campos de tipoDocumento para ReagrupamentoPaiMaeFora
                  (processType === 'ReagrupamentoPaiMaeFora' && campo.id.endsWith('tipoDocumento')) ||
                  // Sempre exibir campos de parentesco para ReagrupamentoFilho
                  (processType === 'ReagrupamentoFilho' && campo.id.endsWith('parentesco')) ||
                  // Sempre exibir campos de tipoDocumento para ReagrupamentoFilho
                  (processType === 'ReagrupamentoFilho' && campo.id.endsWith('tipoDocumento')) ||
                  // Sempre exibir campos de parentesco para ReagrupamentoTutor
                  (processType === 'ReagrupamentoTutor' && campo.id.endsWith('parentesco')) ||
                  // Sempre exibir campos de tipoDocumento para ReagrupamentoTutor
                  (processType === 'ReagrupamentoTutor' && campo.id.endsWith('tipoDocumento')) ||
                  // Sempre exibir campos de parentesco para ReagrupamentoConjuge
                  (processType === 'ReagrupamentoConjuge' && campo.id.endsWith('parentesco')) ||
                  // Sempre exibir campos de tipoDocumento para ReagrupamentoConjuge
                  (processType === 'ReagrupamentoConjuge' && campo.id.endsWith('tipoDocumento')) ||
                  // Sempre exibir campos de parentesco para ReagrupamentoPaiIdoso
                  (processType === 'ReagrupamentoPaiIdoso' && campo.id.endsWith('parentesco')) ||
                  // Sempre exibir campos de tipoDocumento para ReagrupamentoPaiIdoso
                  (processType === 'ReagrupamentoPaiIdoso' && campo.id.endsWith('tipoDocumento')) ||
                  // Para outros campos, usar lógica original
                  (!campo.id.endsWith('sexo') && !campo.id.endsWith('parentesco') && !campo.id.endsWith('tipoDocumento'));
                
                if (!shouldDisplayField) {
                  return null;
                }
                
                return (
                  <Box className="form-field" key={campoIndex} mt={1} sx={{ width: '100%' }}>
                    <Typography variant="body2" className="field-label" style={{ fontSize: '0.8rem' }}>
                      {campo.label}
                    </Typography>
                    <TextField
                      name={campo.id}
                      value={valorCampo}
                      onChange={(e) => handleInputChange(e, campo.id)}
                      disabled={false}
                      variant="outlined"
                      size="small"
                      fullWidth
                      sx={{ 
                        '& .MuiInputBase-root': { 
                          height: '30px',
                          fontSize: '0.85rem',
                          // Destacar campos que são sempre editáveis
                          backgroundColor: !editMode ? 'rgba(232, 244, 253, 0.3)' : 'inherit'
                        }
                      }}
                      InputProps={{
                        startAdornment: campo.id.endsWith('nomeCompleto') || campo.id.endsWith('nome_completo') || campo.id.endsWith('nome_do_responsavel') ? (
                          <InputAdornment position="start">
                            <Person fontSize="small" />
                          </InputAdornment>
                        ) : campo.id.endsWith('nacionalidade') ? (
                          <InputAdornment position="start">
                            <Flag fontSize="small" />
                          </InputAdornment>
                        ) : campo.id.endsWith('dataNascimento') || campo.id.endsWith('dataValidade') || campo.id.endsWith('data_de_nascimento') || campo.id.endsWith('data_de_validade_do_documento') ? (
                          <InputAdornment position="start">
                            <CalendarMonth fontSize="small" />
                          </InputAdornment>
                        ) : null
                      }}
                    />
                  </Box>
                );
              })}
            </Box>
          ))
        )}
      </Box>
    );
  };
  
  return (
    <Box className="detalhes-formulario-container">
      {simplified ? renderSimplifiedForm() : (
        <>
          <Box className="form-actions">
            <Button
              variant={editMode ? "contained" : "outlined"}
              color={editMode ? "primary" : "secondary"}
              startIcon={editMode ? <Save /> : <Edit />}
              onClick={editMode ? handleSave : handleToggleEditMode}
              className="action-button"
            >
              {editMode ? "Salvar" : "Editar"}
            </Button>
          </Box>
          
          <Box className="form-content">
            {renderSimplifiedForm()}
          </Box>
        </>
      )}
    </Box>
  );
};

export default DetalhesFormulario; 