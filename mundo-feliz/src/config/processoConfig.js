/**
 * Configuração modular para os diferentes tipos de processos
 * Este arquivo define a estrutura e campos para cada tipo de processo
 */

const processoConfig = {
  // Configuração para Reagrupamento Cônjuge
  ReagrupamentoConjuge: {
    titulo: "Reagrupamento Familiar - Cônjuge",
    descricao: "Processo de reagrupamento familiar para cônjuge",
    
    // Checkboxes para documentos necessários
    checkboxes: [
      { id: "consentimentoDados", label: "Consentimento dados" },
      { id: "cplp", label: "CPLP" },
      { id: "sapa", label: "SAPA/AIMA" },
      { id: "renovacao", label: "Renovação título" },
      { id: "outros", label: "Outros" }
    ],
    
    // Configuração para o painel de campos baseado na estrutura do JSON
    painelCampos: [
      {
        titulo: "Dados do Cônjuge",
        campos: [
          // Atualizado para suporte à nova estrutura aninhada
          { id: "documentos.pessoaReagrupada.nomeCompleto", label: "Nome Completo", tipo: "text" },
          { id: "documentos.pessoaReagrupada.dataNascimento", label: "Data de Nascimento", tipo: "date" },
          { id: "documentos.pessoaReagrupada.nacionalidade", label: "Nacionalidade", tipo: "text" },
          { id: "documentos.pessoaReagrupada.numeroPassaporte", label: "Número do Passaporte", tipo: "text" },
          { id: "documentos.pessoaReagrupada.dataValidadePassaporte", label: "Data de Validade do Passaporte", tipo: "date" },
          { id: "documentos.pessoaReagrupada.sexo", label: "Sexo", tipo: "select", opcoes: [
            { valor: "M", rotulo: "Masculino" },
            { valor: "F", rotulo: "Feminino" }
          ]},
          { id: "documentos.pessoaReagrupada.parentesco", label: "Parentesco", tipo: "text" },
          // Mantendo os caminhos antigos para compatibilidade com versões anteriores
          { id: "pessoaReagrupada.nomeCompleto", label: "Nome Completo (Formato Antigo)", tipo: "text" },
          { id: "pessoaReagrupada.dataNascimento", label: "Data de Nascimento (Formato Antigo)", tipo: "date" },
          { id: "pessoaReagrupada.nacionalidade", label: "Nacionalidade (Formato Antigo)", tipo: "text" },
          { id: "pessoaReagrupada.numeroPassaporte", label: "Número do Passaporte (Formato Antigo)", tipo: "text" },
          { id: "pessoaReagrupada.dataValidadePassaporte", label: "Data de Validade do Passaporte (Formato Antigo)", tipo: "date" },
          { id: "pessoaReagrupada.parentesco", label: "Parentesco (Formato Antigo)", tipo: "text" }
        ]
      },
      {
        titulo: "Dados do Requerente",
        campos: [
          // Atualizado para suporte à nova estrutura aninhada
          { id: "documentos.pessoaQueRegrupa.nomeCompleto", label: "Nome Completo", tipo: "text" },
          { id: "documentos.pessoaQueRegrupa.numeroDocumento", label: "Número do Documento", tipo: "text" },
          { id: "documentos.pessoaQueRegrupa.tipoDocumento", label: "Tipo de Documento", tipo: "text" },
          { id: "documentos.pessoaQueRegrupa.dataNascimento", label: "Data de Nascimento", tipo: "date" },
          { id: "documentos.pessoaQueRegrupa.nacionalidade", label: "Nacionalidade", tipo: "text" },
          { id: "documentos.pessoaQueRegrupa.dataValidade", label: "Data de Validade", tipo: "date" },
          { id: "documentos.pessoaQueRegrupa.parentesco", label: "Parentesco", tipo: "text" },
          { id: "documentos.pessoaQueRegrupa.sexo", label: "Sexo", tipo: "select", opcoes: [
            { valor: "M", rotulo: "Masculino" },
            { valor: "F", rotulo: "Feminino" }
          ]},
          // Mantendo os caminhos antigos para compatibilidade com versões anteriores
          { id: "pessoaQueRegrupa.nomeCompleto", label: "Nome Completo (Formato Antigo)", tipo: "text" },
          { id: "pessoaQueRegrupa.numeroDocumento", label: "Número do Documento (Formato Antigo)", tipo: "text" },
          { id: "pessoaQueRegrupa.tipoDocumento", label: "Tipo de Documento (Formato Antigo)", tipo: "text" },
          { id: "pessoaQueRegrupa.dataNascimento", label: "Data de Nascimento (Formato Antigo)", tipo: "date" },
          { id: "pessoaQueRegrupa.nacionalidade", label: "Nacionalidade (Formato Antigo)", tipo: "text" },
          { id: "pessoaQueRegrupa.dataValidade", label: "Data de Validade (Formato Antigo)", tipo: "date" },
          { id: "pessoaQueRegrupa.parentesco", label: "Parentesco (Formato Antigo)", tipo: "text" }
        ]
      }
    ],
    
    // Template para exibir informações do processo - usando variáveis que verificam ambos os caminhos
    templates: {
      cartao: "{{documentos.pessoaReagrupada.nomeCompleto || pessoaReagrupada.nomeCompleto}} - Reagrupamento Familiar",
      resumo: "Reagrupamento familiar de {{documentos.pessoaReagrupada.nomeCompleto || pessoaReagrupada.nomeCompleto}} (cônjuge) com {{documentos.pessoaQueRegrupa.nomeCompleto || pessoaQueRegrupa.nomeCompleto}}",
      detalhes: "Processo de reagrupamento familiar para cônjuge {{documentos.pessoaReagrupada.nomeCompleto || pessoaReagrupada.nomeCompleto}}, de nacionalidade {{documentos.pessoaReagrupada.nacionalidade || pessoaReagrupada.nacionalidade}}, nascido em {{documentos.pessoaReagrupada.dataNascimento || pessoaReagrupada.dataNascimento}}, portador do passaporte {{documentos.pessoaReagrupada.numeroPassaporte || pessoaReagrupada.numeroPassaporte}} válido até {{documentos.pessoaReagrupada.dataValidadePassaporte || pessoaReagrupada.dataValidadePassaporte}}. Requerente: {{documentos.pessoaQueRegrupa.nomeCompleto || pessoaQueRegrupa.nomeCompleto}}."
    }
  },
  
  // Configuração para Renovação de Título
  RenovacaoTitulo: {
    titulo: "Renovação de Título de Residência",
    descricao: "Processo de renovação de título de residência",
    
    // Checkboxes para documentos necessários
    checkboxes: [
      { id: "consentimentoDados", label: "Consentimento dados" },
      { id: "cplp", label: "CPLP" },
      { id: "sapa", label: "SAPA/AIMA" },
      { id: "renovacao", label: "Renovação título" },
      { id: "outros", label: "Outros" }
    ],
    
    // Configuração para o painel de campos
    painelCampos: [
      {
        titulo: "Dados Pessoais",
        campos: [
          { id: "nomeCompleto", label: "Nome Completo", tipo: "text" },
          { id: "numeroDocumento", label: "Número do Documento", tipo: "text" },
          { id: "dataNascimento", label: "Data de Nascimento", tipo: "date" },
          { id: "nacionalidade", label: "Nacionalidade", tipo: "text" },
          { id: "dataValidade", label: "Data de Validade", tipo: "date" }
        ]
      },
      {
        titulo: "Dados do Título",
        campos: [
          { id: "numeroTitulo", label: "Número do Título", tipo: "text" },
          { id: "dataEmissao", label: "Data de Emissão", tipo: "date" },
          { id: "dataValidade", label: "Data de Validade", tipo: "date" }
        ]
      }
    ],
    
    // Template para exibir informações do processo
    templates: {
      cartao: "{{nomeCompleto}} - Renovação de Título",
      resumo: "Renovação de título de residência para {{nomeCompleto}} ({{nacionalidade}})",
      detalhes: "Processo de renovação de título de residência para {{nomeCompleto}}, portador do documento {{numeroDocumento}} válido até {{dataValidade}}."
    }
  },
  
  // Configuração para Renovação - Tratamento Médico
  RenovacaoTratamentoMedico: {
    titulo: "Renovação - Tratamento Médico",
    descricao: "Processo de renovação para tratamento médico",
    
    // Checkboxes para documentos necessários
    checkboxes: [
      { id: "consentimentoDados", label: "Consentimento dados" },
      { id: "cplp", label: "CPLP" },
      { id: "sapa", label: "SAPA/AIMA" },
      { id: "renovacao", label: "Renovação título" },
      { id: "outros", label: "Outros" }
    ],
    
    // Configuração para o painel de campos (Nota: sem numeroVisto, conforme observado)
    painelCampos: [
      {
        titulo: "Dados Pessoais",
        campos: [
          { id: "nomeCompleto", label: "Nome Completo", tipo: "text" },
          { id: "numeroDocumento", label: "Número do Documento", tipo: "text" },
          { id: "dataNascimento", label: "Data de Nascimento", tipo: "date" },
          { id: "nacionalidade", label: "Nacionalidade", tipo: "text" },
          { id: "dataValidade", label: "Data de Validade", tipo: "date" },
          { id: "sexo", label: "Sexo", tipo: "select", opcoes: [
            { valor: "M", rotulo: "Masculino" },
            { valor: "F", rotulo: "Feminino" }
          ]}
        ]
      }
    ],
    
    // Template para exibir informações do processo
    templates: {
      cartao: "{{nomeCompleto}} - Tratamento Médico",
      resumo: "Renovação para tratamento médico de {{nomeCompleto}} ({{nacionalidade}})",
      detalhes: "Processo de renovação para tratamento médico de {{nomeCompleto}}, portador do documento {{numeroDocumento}} válido até {{dataValidade}}."
    }
  },
  
  // Configuração para Renovação - Estudante Superior
  RenovacaoEstudanteSuperior: {
    titulo: "Renovação - Estudante de Ensino Superior",
    descricao: "Processo de renovação para estudante de ensino superior",
    
    // Checkboxes para documentos necessários
    checkboxes: [
      { id: "consentimentoDados", label: "Consentimento dados" },
      { id: "cplp", label: "CPLP" },
      { id: "sapa", label: "SAPA/AIMA" },
      { id: "renovacao", label: "Renovação título" },
      { id: "outros", label: "Outros" }
    ],
    
    // Configuração para o painel de campos
    painelCampos: [
      {
        titulo: "Dados Pessoais",
        campos: [
          { id: "nomeCompleto", label: "Nome Completo", tipo: "text" },
          { id: "numeroDocumento", label: "Número do Documento", tipo: "text" },
          { id: "dataNascimento", label: "Data de Nascimento", tipo: "date" },
          { id: "nacionalidade", label: "Nacionalidade", tipo: "text" },
          { id: "dataValidade", label: "Data de Validade", tipo: "date" },
          { id: "sexo", label: "Sexo", tipo: "select", opcoes: [
            { valor: "M", rotulo: "Masculino" },
            { valor: "F", rotulo: "Feminino" }
          ]}
        ]
      }
    ],
    
    // Template para exibir informações do processo
    templates: {
      cartao: "{{nomeCompleto}} - Estudante Superior",
      resumo: "Renovação para estudante de ensino superior {{nomeCompleto}} ({{nacionalidade}})",
      detalhes: "Processo de renovação para estudante de ensino superior {{nomeCompleto}}, portador do documento {{numeroDocumento}} válido até {{dataValidade}}."
    }
  },
  
  // Configuração para Renovação - Estudante Secundário
  RenovacaoEstudanteSecundario: {
    titulo: "Renovação - Estudante de Ensino Secundário",
    descricao: "Processo de renovação para estudante de ensino secundário",
    
    // Checkboxes para documentos necessários
    checkboxes: [
      { id: "consentimentoDados", label: "Consentimento dados" },
      { id: "cplp", label: "CPLP" },
      { id: "sapa", label: "SAPA/AIMA" },
      { id: "renovacao", label: "Renovação título" },
      { id: "outros", label: "Outros" }
    ],
    
    // Configuração para o painel de campos
    painelCampos: [
      {
        titulo: "Dados Pessoais",
        campos: [
          { id: "nomeCompleto", label: "Nome Completo", tipo: "text" },
          { id: "numeroDocumento", label: "Número do Documento", tipo: "text" },
          { id: "dataNascimento", label: "Data de Nascimento", tipo: "date" },
          { id: "nacionalidade", label: "Nacionalidade", tipo: "text" },
          { id: "dataValidade", label: "Data de Validade", tipo: "date" },
          { id: "sexo", label: "Sexo", tipo: "select", opcoes: [
            { valor: "M", rotulo: "Masculino" },
            { valor: "F", rotulo: "Feminino" }
          ]}
        ]
      },
      {
        titulo: "Dados do Responsável Legal",
        campos: [
          { id: "nomeResponsavelLegal", label: "Nome do Responsável", tipo: "text" },
          { id: "numeroDocumentoResponsavel", label: "Número do Documento", tipo: "text" },
          { id: "dataValidadeResponsavel", label: "Data de Validade", tipo: "date" }
        ]
      }
    ],
    
    // Template para exibir informações do processo
    templates: {
      cartao: "{{nomeCompleto}} - Estudante Secundário",
      resumo: "Renovação para estudante de ensino secundário {{nomeCompleto}} ({{nacionalidade}})",
      detalhes: "Processo de renovação para estudante de ensino secundário {{nomeCompleto}}, portador do documento {{numeroDocumento}} válido até {{dataValidade}}. Responsável legal: {{nomeResponsavelLegal}}."
    }
  },
  
  // Configuração para Renovação - Estatuto
  RenovacaoEstatuto: {
    titulo: "Renovação - Estatuto Legal",
    descricao: "Processo de renovação de estatuto legal de residência",
    
    // Checkboxes para documentos necessários
    checkboxes: [
      { id: "consentimentoDados", label: "Consentimento dados" },
      { id: "cplp", label: "CPLP" },
      { id: "sapa", label: "SAPA/AIMA" },
      { id: "renovacao", label: "Renovação título" },
      { id: "outros", label: "Outros" }
    ],
    
    // Configuração para o painel de campos
    painelCampos: [
      {
        titulo: "Dados Pessoais",
        campos: [
          { id: "nomeCompleto", label: "Nome Completo", tipo: "text" },
          { id: "numeroDocumento", label: "Número do Documento", tipo: "text" },
          { id: "dataNascimento", label: "Data de Nascimento", tipo: "date" },
          { id: "nacionalidade", label: "Nacionalidade", tipo: "text" },
          { id: "dataValidade", label: "Data de Validade", tipo: "date" },
          { id: "sexo", label: "Sexo", tipo: "select", opcoes: [
            { valor: "M", rotulo: "Masculino" },
            { valor: "F", rotulo: "Feminino" }
          ]}
        ]
      },
      {
        titulo: "Dados do Estatuto",
        campos: [
          { id: "tipoEstatuto", label: "Tipo de Estatuto", tipo: "select", opcoes: [
            { valor: "ResidenteTemporal", rotulo: "Residente Temporal" },
            { valor: "ResidentePermanente", rotulo: "Residente Permanente" },
            { valor: "Refugiado", rotulo: "Refugiado" },
            { valor: "AsiloHumanitario", rotulo: "Asilo Humanitário" },
            { valor: "CPLP", rotulo: "CPLP" },
            { valor: "Outro", rotulo: "Outro" }
          ]},
          { id: "numeroProcessoAntigo", label: "Número do Processo Anterior", tipo: "text" },
          { id: "dataConcessaoEstatuto", label: "Data de Concessão do Estatuto", tipo: "date" },
          { id: "motivoRenovacao", label: "Motivo da Renovação", tipo: "text" }
        ]
      },
      {
        titulo: "Morada Atual",
        campos: [
          { id: "moradaAtual", label: "Morada", tipo: "text" },
          { id: "codigoPostal", label: "Código Postal", tipo: "text" },
          { id: "localidade", label: "Localidade", tipo: "text" },
          { id: "distrito", label: "Distrito", tipo: "text" }
        ]
      }
    ],
    
    // Template para exibir informações do processo
    templates: {
      cartao: "{{nomeCompleto}} - Renovação Estatuto",
      resumo: "Renovação de estatuto para {{nomeCompleto}} ({{nacionalidade}})",
      detalhes: "Processo de renovação de {{tipoEstatuto}} para {{nomeCompleto}}, portador do documento {{numeroDocumento}} válido até {{dataValidade}}."
    }
  },
  
  // Configuração para Renovação - Não Tem Estatuto
  RenovacaoNaoTemEstatuto: {
    titulo: "Renovação - Não Tem Estatuto",
    descricao: "Processo de renovação para quem não tem estatuto definido",
    
    // Checkboxes para documentos necessários
    checkboxes: [
      { id: "consentimentoDados", label: "Consentimento dados" },
      { id: "cplp", label: "CPLP" },
      { id: "sapa", label: "SAPA/AIMA" },
      { id: "renovacao", label: "Renovação título" },
      { id: "outros", label: "Outros" }
    ],
    
    // Configuração para o painel de campos (apenas os que existem no JSON)
    painelCampos: [
      {
        titulo: "Dados Pessoais",
        campos: [
          { id: "nomeCompleto", label: "Nome Completo", tipo: "text" },
          { id: "numeroDocumento", label: "Número do Documento", tipo: "text" },
          { id: "dataNascimento", label: "Data de Nascimento", tipo: "date" },
          { id: "nacionalidade", label: "Nacionalidade", tipo: "text" },
          { id: "dataValidade", label: "Data de Validade", tipo: "date" },
          { id: "sexo", label: "Sexo", tipo: "select", opcoes: [
            { valor: "M", rotulo: "Masculino" },
            { valor: "F", rotulo: "Feminino" }
          ]}
        ]
      }
    ],
    
    // Template para exibir informações do processo
    templates: {
      cartao: "{{nomeCompleto}} - Renovação (Sem Estatuto)",
      resumo: "Renovação para {{nomeCompleto}} ({{nacionalidade}}) - Sem estatuto definido",
      detalhes: "Processo de renovação para {{nomeCompleto}}, portador do documento {{numeroDocumento}} válido até {{dataValidade}}. Cliente sem estatuto definido."
    }
  },
  
  // Configuração para Concessão TR Estudante
  ConcessaoTREstudante: {
    titulo: "Concessão - Título de Residência para Estudante",
    descricao: "Processo de concessão de título de residência para estudante",
    
    // Checkboxes para documentos necessários
    checkboxes: [
      { id: "consentimentoDados", label: "Consentimento dados" },
      { id: "cplp", label: "CPLP" },
      { id: "sapa", label: "SAPA/AIMA" },
      { id: "renovacao", label: "Renovação título" },
      { id: "outros", label: "Outros" }
    ],
    
    // Configuração para o painel de campos (apenas os que existem no JSON)
    painelCampos: [
      {
        titulo: "Dados Pessoais",
        campos: [
          { id: "nomeCompleto", label: "Nome Completo", tipo: "text" },
          { id: "numeroDocumento", label: "Número do Documento", tipo: "text" },
          { id: "dataNascimento", label: "Data de Nascimento", tipo: "date" },
          { id: "nacionalidade", label: "Nacionalidade", tipo: "text" },
          { id: "dataValidade", label: "Data de Validade", tipo: "date" },
          { id: "sexo", label: "Sexo", tipo: "select", opcoes: [
            { valor: "M", rotulo: "Masculino" },
            { valor: "F", rotulo: "Feminino" }
          ]}
        ]
      }
    ],
    
    // Template para exibir informações do processo
    templates: {
      cartao: "{{nomeCompleto}} - Concessão TR Estudante",
      resumo: "Concessão de TR para estudante {{nomeCompleto}} ({{nacionalidade}})",
      detalhes: "Processo de concessão de título de residência para estudante {{nomeCompleto}}, de nacionalidade {{nacionalidade}}, portador do documento {{numeroDocumento}} válido até {{dataValidade}}."
    }
  },
  
  // Configuração para Concessão TR Novo
  ConcessaoTRNovo: {
    titulo: "Concessão - TR (NOVO)",
    descricao: "Processo de concessão de título de residência (novo tipo)",
    
    // Checkboxes para documentos necessários
    checkboxes: [
      { id: "consentimentoDados", label: "Consentimento dados" },
      { id: "cplp", label: "CPLP" },
      { id: "sapa", label: "SAPA/AIMA" },
      { id: "renovacao", label: "Renovação título" },
      { id: "outros", label: "Outros" }
    ],
    
    // Configuração para o painel de campos
    painelCampos: [
      {
        titulo: "Dados Pessoais",
        campos: [
          { id: "nomeCompleto", label: "Nome Completo", tipo: "text" },
          { id: "numeroDocumento", label: "Número do Documento", tipo: "text" },
          { id: "dataNascimento", label: "Data de Nascimento", tipo: "date" },
          { id: "nacionalidade", label: "Nacionalidade", tipo: "text" },
          { id: "dataValidade", label: "Data de Validade", tipo: "date" },
          { id: "seuCampoPersonalizado", label: "Campo Personalizado", tipo: "text" },
          { id: "sexo", label: "Sexo", tipo: "select", opcoes: [
            { valor: "M", rotulo: "Masculino" },
            { valor: "F", rotulo: "Feminino" }
          ]}
        ]
      }
    ],
    
    // Template para exibir informações do processo
    templates: {
      cartao: "{{nomeCompleto}} - TR (NOVO)",
      resumo: "Concessão de TR (NOVO) para {{nomeCompleto}} ({{nacionalidade}})",
      detalhes: "Processo de concessão de título de residência (NOVO) para {{nomeCompleto}}, de nacionalidade {{nacionalidade}}, portador do documento {{numeroDocumento}} válido até {{dataValidade}}."
    }
  },
  
  // Configuração para Concessão TR
  ConcessaoTR: {
    titulo: "Concessão TR",
    descricao: "Processo de concessão de título de residência",
    
    // Checkboxes para documentos necessários
    checkboxes: [
      { id: "consentimentoDados", label: "Consentimento dados" },
      { id: "cplp", label: "CPLP" },
      { id: "sapa", label: "SAPA/AIMA" },
      { id: "renovacao", label: "Renovação título" },
      { id: "outros", label: "Outros" }
    ],
    
    // Configuração para o painel de campos
    painelCampos: [
      {
        titulo: "Dados Pessoais",
        campos: [
          { id: "nomeCompleto", label: "Nome Completo", tipo: "text" },
          { id: "numeroDocumento", label: "Número do Documento", tipo: "text" },
          { id: "dataNascimento", label: "Data de Nascimento", tipo: "date" },
          { id: "nacionalidade", label: "Nacionalidade", tipo: "text" },
          { id: "dataValidade", label: "Data de Validade", tipo: "date" },
          { id: "sexo", label: "Sexo", tipo: "select", opcoes: [
            { valor: "M", rotulo: "Masculino" },
            { valor: "F", rotulo: "Feminino" }
          ]}
        ]
      }
    ],
    
    // Template para exibir informações do processo
    templates: {
      cartao: "{{nomeCompleto}} - TR",
      resumo: "Concessão de TR para {{nomeCompleto}} ({{nacionalidade}})",
      detalhes: "Processo de concessão de título de residência para {{nomeCompleto}}, de nacionalidade {{nacionalidade}}, portador do documento {{numeroDocumento}} válido até {{dataValidade}}."
    }
  },
  
  // Configuração para Concessão TR Estudante Menor
  ConcessaoTREstudanteMenor: {
    titulo: "Concessão - TR para Estudante Menor",
    descricao: "Processo de concessão de título de residência para estudante menor de idade",
    
    // Checkboxes para documentos necessários
    checkboxes: [
      { id: "consentimentoDados", label: "Consentimento dados" },
      { id: "cplp", label: "CPLP" },
      { id: "sapa", label: "SAPA/AIMA" },
      { id: "renovacao", label: "Renovação título" },
      { id: "outros", label: "Outros" }
    ],
    
    // Configuração para o painel de campos baseado na estrutura plana do JSON
    painelCampos: [
      {
        titulo: "Dados do Estudante Menor",
        campos: [
          { id: "nomeCompleto", label: "Nome Completo", tipo: "text" },
          { id: "numeroDocumento", label: "Número do Documento", tipo: "text" },
          { id: "dataNascimento", label: "Data de Nascimento", tipo: "date" },
          { id: "nacionalidade", label: "Nacionalidade", tipo: "text" },
          { id: "dataValidade", label: "Data de Validade", tipo: "date" },
          { id: "sexo", label: "Sexo", tipo: "select", opcoes: [
            { valor: "M", rotulo: "Masculino" },
            { valor: "F", rotulo: "Feminino" }
          ]}
        ]
      },
      {
        titulo: "Dados do Responsável Legal",
        campos: [
          { id: "nomeResponsavelLegal", label: "Nome do Responsável", tipo: "text" },
          { id: "numeroDocumentoResponsavel", label: "Número do Documento", tipo: "text" },
          { id: "dataValidadeResponsavel", label: "Data de Validade", tipo: "date" }
        ]
      }
    ],
    
    // Template para exibir informações do processo
    templates: {
      cartao: "{{nomeCompleto}} - Concessão TR Estudante Menor",
      resumo: "Concessão de TR para estudante menor {{nomeCompleto}} ({{nacionalidade}})",
      detalhes: "Processo de concessão de título de residência para estudante menor {{nomeCompleto}}, de nacionalidade {{nacionalidade}}, portador do documento {{numeroDocumento}} válido até {{dataValidade}}. Responsável legal: {{nomeResponsavelLegal}}."
    }
  },
  
  // Configuração para Reagrupamento Pai/Mãe Fora
  ReagrupamentoPaiMaeFora: {
    titulo: "Reagrupamento Familiar - Pai/Mãe no Exterior",
    descricao: "Processo de reagrupamento familiar para filho com pai/mãe no exterior",
    
    // Checkboxes para documentos necessários (mesmos do ReagrupamentoConjuge, sem alterações)
    checkboxes: [
      { id: "consentimentoDados", label: "Consentimento dados" },
      { id: "cplp", label: "CPLP" },
      { id: "sapa", label: "SAPA/AIMA" },
      { id: "renovacao", label: "Renovação título" },
      { id: "outros", label: "Outros" }
    ],
    
    // Configuração para o painel de campos baseado na estrutura do JSON
    painelCampos: [
      {
        titulo: "Dados da Pessoa a Reagrupar (Filho)",
        campos: [
          { id: "documentos.pessoaReagrupada.nomeCompleto", label: "Nome Completo", tipo: "text" },
          { id: "documentos.pessoaReagrupada.dataNascimento", label: "Data de Nascimento", tipo: "date" },
          { id: "documentos.pessoaReagrupada.nacionalidade", label: "Nacionalidade", tipo: "text" },
          { id: "documentos.pessoaReagrupada.numeroPassaporte", label: "Número do Passaporte", tipo: "text" },
          { id: "documentos.pessoaReagrupada.dataValidadePassaporte", label: "Data de Validade do Passaporte", tipo: "date" },
          { id: "documentos.pessoaReagrupada.sexo", label: "Sexo", tipo: "select", opcoes: [
            { valor: "M", rotulo: "Masculino" },
            { valor: "F", rotulo: "Feminino" }
          ]},
          { id: "pessoaReagrupada.nomeCompleto", label: "Nome Completo (Formato Antigo)", tipo: "text" },
          { id: "pessoaReagrupada.dataNascimento", label: "Data de Nascimento (Formato Antigo)", tipo: "date" },
          { id: "pessoaReagrupada.nacionalidade", label: "Nacionalidade (Formato Antigo)", tipo: "text" },
          { id: "pessoaReagrupada.numeroPassaporte", label: "Número do Passaporte (Formato Antigo)", tipo: "text" },
          { id: "pessoaReagrupada.dataValidadePassaporte", label: "Data de Validade do Passaporte (Formato Antigo)", tipo: "date" }
        ]
      },
      {
        titulo: "Dados do Pai/Mãe Residente",
        campos: [
          { id: "documentos.pessoaQueRegrupa.parentesco", label: "Parentesco", tipo: "text" },
          { id: "documentos.pessoaQueRegrupa.nomeCompleto", label: "Nome Completo", tipo: "text" },
          { id: "documentos.pessoaQueRegrupa.numeroDocumento", label: "Número do Documento", tipo: "text" },
          { id: "documentos.pessoaQueRegrupa.tipoDocumento", label: "Tipo de Documento", tipo: "text" },
          { id: "documentos.pessoaQueRegrupa.dataNascimento", label: "Data de Nascimento", tipo: "date" },
          { id: "documentos.pessoaQueRegrupa.nacionalidade", label: "Nacionalidade", tipo: "text" },
          { id: "documentos.pessoaQueRegrupa.dataValidade", label: "Data de Validade", tipo: "date" },
          { id: "documentos.pessoaQueRegrupa.sexo", label: "Sexo", tipo: "select", opcoes: [
            { valor: "M", rotulo: "Masculino" },
            { valor: "F", rotulo: "Feminino" }
          ]},
          { id: "pessoaQueRegrupa.parentesco", label: "Parentesco (Formato Antigo)", tipo: "text" },
          { id: "pessoaQueRegrupa.nomeCompleto", label: "Nome Completo (Formato Antigo)", tipo: "text" },
          { id: "pessoaQueRegrupa.numeroDocumento", label: "Número do Documento (Formato Antigo)", tipo: "text" },
          { id: "pessoaQueRegrupa.tipoDocumento", label: "Tipo de Documento (Formato Antigo)", tipo: "text" },
          { id: "pessoaQueRegrupa.dataNascimento", label: "Data de Nascimento (Formato Antigo)", tipo: "date" },
          { id: "pessoaQueRegrupa.nacionalidade", label: "Nacionalidade (Formato Antigo)", tipo: "text" },
          { id: "pessoaQueRegrupa.dataValidade", label: "Data de Validade (Formato Antigo)", tipo: "date" }
        ]
      }
    ],
    
    // Template para exibir informações do processo - usando variáveis que verificam ambos os caminhos
    templates: {
      cartao: "{{documentos.pessoaReagrupada.nomeCompleto || pessoaReagrupada.nomeCompleto}} - Reagrupamento Familiar",
      resumo: "Reagrupamento familiar de {{documentos.pessoaReagrupada.nomeCompleto || pessoaReagrupada.nomeCompleto}} ({{documentos.pessoaReagrupada.parentesco || pessoaReagrupada.parentesco}}) com {{documentos.pessoaQueRegrupa.nomeCompleto || pessoaQueRegrupa.nomeCompleto}} ({{documentos.pessoaQueRegrupa.parentesco || pessoaQueRegrupa.parentesco}})",
      detalhes: "Processo de reagrupamento familiar para {{documentos.pessoaReagrupada.parentesco || pessoaReagrupada.parentesco}} {{documentos.pessoaReagrupada.nomeCompleto || pessoaReagrupada.nomeCompleto}}, de nacionalidade {{documentos.pessoaReagrupada.nacionalidade || pessoaReagrupada.nacionalidade}}, nascido em {{documentos.pessoaReagrupada.dataNascimento || pessoaReagrupada.dataNascimento}}, portador do passaporte {{documentos.pessoaReagrupada.numeroPassaporte || pessoaReagrupada.numeroPassaporte}} válido até {{documentos.pessoaReagrupada.dataValidadePassaporte || pessoaReagrupada.dataValidadePassaporte}}. {{documentos.pessoaQueRegrupa.parentesco || pessoaQueRegrupa.parentesco}}: {{documentos.pessoaQueRegrupa.nomeCompleto || pessoaQueRegrupa.nomeCompleto}}."
    }
  },
  
  // Configuração para Reagrupamento através do Filho
  ReagrupamentoFilho: {
    titulo: "Reagrupamento Familiar - Através do Filho",
    descricao: "Processo de reagrupamento familiar em que o filho traz os pais",
    
    // Checkboxes para documentos necessários (mesmos do ReagrupamentoConjuge, sem alterações)
    checkboxes: [
      { id: "consentimentoDados", label: "Consentimento dados" },
      { id: "cplp", label: "CPLP" },
      { id: "sapa", label: "SAPA/AIMA" },
      { id: "renovacao", label: "Renovação título" },
      { id: "outros", label: "Outros" }
    ],
    
    // Configuração para o painel de campos baseado na estrutura do JSON
    painelCampos: [
      {
        titulo: "Dados da Pessoa a Reagrupar (Pai/Mãe)",
        campos: [
          // Atualizado para suporte à nova estrutura aninhada
          { id: "documentos.pessoaReagrupada.nomeCompleto", label: "Nome Completo", tipo: "text" },
          { id: "documentos.pessoaReagrupada.dataNascimento", label: "Data de Nascimento", tipo: "date" },
          { id: "documentos.pessoaReagrupada.nacionalidade", label: "Nacionalidade", tipo: "text" },
          { id: "documentos.pessoaReagrupada.numeroPassaporte", label: "Número do Passaporte", tipo: "text" },
          { id: "documentos.pessoaReagrupada.dataValidadePassaporte", label: "Data de Validade do Passaporte", tipo: "date" },
          { id: "documentos.pessoaReagrupada.sexo", label: "Sexo", tipo: "select", opcoes: [
            { valor: "M", rotulo: "Masculino" },
            { valor: "F", rotulo: "Feminino" }
          ]},
          { id: "documentos.pessoaReagrupada.parentesco", label: "Parentesco", tipo: "text" },
          // Mantendo os caminhos antigos para compatibilidade com versões anteriores
          { id: "pessoaReagrupada.nomeCompleto", label: "Nome Completo (Formato Antigo)", tipo: "text" },
          { id: "pessoaReagrupada.dataNascimento", label: "Data de Nascimento (Formato Antigo)", tipo: "date" },
          { id: "pessoaReagrupada.nacionalidade", label: "Nacionalidade (Formato Antigo)", tipo: "text" },
          { id: "pessoaReagrupada.numeroPassaporte", label: "Número do Passaporte (Formato Antigo)", tipo: "text" },
          { id: "pessoaReagrupada.dataValidadePassaporte", label: "Data de Validade do Passaporte (Formato Antigo)", tipo: "date" },
          { id: "pessoaReagrupada.parentesco", label: "Parentesco (Formato Antigo)", tipo: "text" }
        ]
      },
      {
        titulo: "Dados do Filho Residente",
        campos: [
          // Atualizado para suporte à nova estrutura aninhada
          { id: "documentos.pessoaQueRegrupa.nomeCompleto", label: "Nome Completo", tipo: "text" },
          { id: "documentos.pessoaQueRegrupa.numeroDocumento", label: "Número do Documento", tipo: "text" },
          { id: "documentos.pessoaQueRegrupa.tipoDocumento", label: "Tipo de Documento", tipo: "text" },
          { id: "documentos.pessoaQueRegrupa.dataNascimento", label: "Data de Nascimento", tipo: "date" },
          { id: "documentos.pessoaQueRegrupa.nacionalidade", label: "Nacionalidade", tipo: "text" },
          { id: "documentos.pessoaQueRegrupa.dataValidade", label: "Data de Validade", tipo: "date" },
          { id: "documentos.pessoaQueRegrupa.parentesco", label: "Parentesco", tipo: "text" },
          { id: "documentos.pessoaQueRegrupa.sexo", label: "Sexo", tipo: "select", opcoes: [
            { valor: "M", rotulo: "Masculino" },
            { valor: "F", rotulo: "Feminino" }
          ]},
          // Mantendo os caminhos antigos para compatibilidade com versões anteriores
          { id: "pessoaQueRegrupa.nomeCompleto", label: "Nome Completo (Formato Antigo)", tipo: "text" },
          { id: "pessoaQueRegrupa.numeroDocumento", label: "Número do Documento (Formato Antigo)", tipo: "text" },
          { id: "pessoaQueRegrupa.tipoDocumento", label: "Tipo de Documento (Formato Antigo)", tipo: "text" },
          { id: "pessoaQueRegrupa.dataNascimento", label: "Data de Nascimento (Formato Antigo)", tipo: "date" },
          { id: "pessoaQueRegrupa.nacionalidade", label: "Nacionalidade (Formato Antigo)", tipo: "text" },
          { id: "pessoaQueRegrupa.dataValidade", label: "Data de Validade (Formato Antigo)", tipo: "date" },
          { id: "pessoaQueRegrupa.parentesco", label: "Parentesco (Formato Antigo)", tipo: "text" }
        ]
      }
    ],
    
    // Template para exibir informações do processo - usando variáveis que verificam ambos os caminhos
    templates: {
      cartao: "{{documentos.pessoaReagrupada.nomeCompleto || pessoaReagrupada.nomeCompleto}} - Reagrupamento Familiar",
      resumo: "Reagrupamento familiar de {{documentos.pessoaReagrupada.nomeCompleto || pessoaReagrupada.nomeCompleto}} através do filho {{documentos.pessoaQueRegrupa.nomeCompleto || pessoaQueRegrupa.nomeCompleto}}",
      detalhes: "Processo de reagrupamento familiar para {{documentos.pessoaReagrupada.nomeCompleto || pessoaReagrupada.nomeCompleto}}, de nacionalidade {{documentos.pessoaReagrupada.nacionalidade || pessoaReagrupada.nacionalidade}}, nascido em {{documentos.pessoaReagrupada.dataNascimento || pessoaReagrupada.dataNascimento}}, portador do passaporte {{documentos.pessoaReagrupada.numeroPassaporte || pessoaReagrupada.numeroPassaporte}} válido até {{documentos.pessoaReagrupada.dataValidadePassaporte || pessoaReagrupada.dataValidadePassaporte}}. Filho reagrupante: {{documentos.pessoaQueRegrupa.nomeCompleto || pessoaQueRegrupa.nomeCompleto}}."
    }
  },
  
  // Configuração para Reagrupamento através do Tutor
  ReagrupamentoTutor: {
    titulo: "Reagrupamento Familiar - Através do Tutor",
    descricao: "Processo de reagrupamento familiar em que o tutor traz o menor",
    
    // Checkboxes para documentos necessários (mesmos do ReagrupamentoConjuge, sem alterações)
    checkboxes: [
      { id: "consentimentoDados", label: "Consentimento dados" },
      { id: "cplp", label: "CPLP" },
      { id: "sapa", label: "SAPA/AIMA" },
      { id: "renovacao", label: "Renovação título" },
      { id: "outros", label: "Outros" }
    ],
    
    // Configuração para o painel de campos baseado na estrutura do JSON
    painelCampos: [
      {
        titulo: "Dados da Pessoa a Reagrupar (Menor)",
        campos: [
          { id: "documentos.pessoaReagrupada.nomeCompleto", label: "Nome Completo", tipo: "text" },
          { id: "documentos.pessoaReagrupada.dataNascimento", label: "Data de Nascimento", tipo: "date" },
          { id: "documentos.pessoaReagrupada.nacionalidade", label: "Nacionalidade", tipo: "text" },
          { id: "documentos.pessoaReagrupada.numeroPassaporte", label: "Número do Passaporte", tipo: "text" },
          { id: "documentos.pessoaReagrupada.dataValidadePassaporte", label: "Data de Validade do Passaporte", tipo: "date" },
          { id: "documentos.pessoaReagrupada.sexo", label: "Sexo", tipo: "select", opcoes: [
            { valor: "M", rotulo: "Masculino" },
            { valor: "F", rotulo: "Feminino" }
          ]},
          { id: "documentos.pessoaReagrupada.parentesco", label: "Parentesco", tipo: "text" },
          { id: "pessoaReagrupada.nomeCompleto", label: "Nome Completo (Formato Antigo)", tipo: "text" },
          { id: "pessoaReagrupada.dataNascimento", label: "Data de Nascimento (Formato Antigo)", tipo: "date" },
          { id: "pessoaReagrupada.nacionalidade", label: "Nacionalidade (Formato Antigo)", tipo: "text" },
          { id: "pessoaReagrupada.numeroPassaporte", label: "Número do Passaporte (Formato Antigo)", tipo: "text" },
          { id: "pessoaReagrupada.dataValidadePassaporte", label: "Data de Validade do Passaporte (Formato Antigo)", tipo: "date" },
          { id: "pessoaReagrupada.parentesco", label: "Parentesco (Formato Antigo)", tipo: "text" }
        ]
      },
      {
        titulo: "Dados do Tutor Residente",
        campos: [
          { id: "documentos.pessoaQueRegrupa.nomeCompleto", label: "Nome Completo", tipo: "text" },
          { id: "documentos.pessoaQueRegrupa.numeroDocumento", label: "Número do Documento", tipo: "text" },
          { id: "documentos.pessoaQueRegrupa.tipoDocumento", label: "Tipo de Documento", tipo: "text" },
          { id: "documentos.pessoaQueRegrupa.dataNascimento", label: "Data de Nascimento", tipo: "date" },
          { id: "documentos.pessoaQueRegrupa.nacionalidade", label: "Nacionalidade", tipo: "text" },
          { id: "documentos.pessoaQueRegrupa.dataValidade", label: "Data de Validade", tipo: "date" },
          { id: "documentos.pessoaQueRegrupa.parentesco", label: "Parentesco", tipo: "text" },
          { id: "documentos.pessoaQueRegrupa.sexo", label: "Sexo", tipo: "select", opcoes: [
            { valor: "M", rotulo: "Masculino" },
            { valor: "F", rotulo: "Feminino" }
          ]},
          { id: "pessoaQueRegrupa.nomeCompleto", label: "Nome Completo (Formato Antigo)", tipo: "text" },
          { id: "pessoaQueRegrupa.numeroDocumento", label: "Número do Documento (Formato Antigo)", tipo: "text" },
          { id: "pessoaQueRegrupa.tipoDocumento", label: "Tipo de Documento (Formato Antigo)", tipo: "text" },
          { id: "pessoaQueRegrupa.dataNascimento", label: "Data de Nascimento (Formato Antigo)", tipo: "date" },
          { id: "pessoaQueRegrupa.nacionalidade", label: "Nacionalidade (Formato Antigo)", tipo: "text" },
          { id: "pessoaQueRegrupa.dataValidade", label: "Data de Validade (Formato Antigo)", tipo: "date" }
        ]
      }
    ],
    
    // Template para exibir informações do processo - usando variáveis que verificam ambos os caminhos
    templates: {
      cartao: "{{documentos.pessoaReagrupada.nomeCompleto || pessoaReagrupada.nomeCompleto}} - Reagrupamento Familiar (Tutor)",
      resumo: "Reagrupamento familiar de {{documentos.pessoaReagrupada.nomeCompleto || pessoaReagrupada.nomeCompleto}} através do tutor {{documentos.pessoaQueRegrupa.nomeCompleto || pessoaQueRegrupa.nomeCompleto}}",
      detalhes: "Processo de reagrupamento familiar para menor {{documentos.pessoaReagrupada.nomeCompleto || pessoaReagrupada.nomeCompleto}}, de nacionalidade {{documentos.pessoaReagrupada.nacionalidade || pessoaReagrupada.nacionalidade}}, nascido em {{documentos.pessoaReagrupada.dataNascimento || pessoaReagrupada.dataNascimento}}, portador do passaporte {{documentos.pessoaReagrupada.numeroPassaporte || pessoaReagrupada.numeroPassaporte}} válido até {{documentos.pessoaReagrupada.dataValidadePassaporte || pessoaReagrupada.dataValidadePassaporte}}. Tutor: {{documentos.pessoaQueRegrupa.nomeCompleto || pessoaQueRegrupa.nomeCompleto}}."
    }
  },
  
  // Configuração para Reagrupamento Pai Idoso
  ReagrupamentoPaiIdoso: {
    titulo: "Reagrupamento Familiar - Pai Idoso",
    descricao: "Processo de reagrupamento familiar para pai idoso através do filho",
    
    // Checkboxes para documentos necessários (mesmos do ReagrupamentoConjuge, sem alterações)
    checkboxes: [
      { id: "consentimentoDados", label: "Consentimento dados" },
      { id: "cplp", label: "CPLP" },
      { id: "sapa", label: "SAPA/AIMA" },
      { id: "renovacao", label: "Renovação título" },
      { id: "outros", label: "Outros" }
    ],
    
    // Configuração para o painel de campos baseado na estrutura do JSON
    painelCampos: [
      {
        titulo: "Dados da Pessoa a Reagrupar (Pai)",
        campos: [
          // Atualizado para suporte à nova estrutura aninhada
          { id: "documentos.pessoaReagrupada.nomeCompleto", label: "Nome Completo", tipo: "text" },
          { id: "documentos.pessoaReagrupada.dataNascimento", label: "Data de Nascimento", tipo: "date" },
          { id: "documentos.pessoaReagrupada.nacionalidade", label: "Nacionalidade", tipo: "text" },
          { id: "documentos.pessoaReagrupada.numeroPassaporte", label: "Número do Passaporte", tipo: "text" },
          { id: "documentos.pessoaReagrupada.dataValidadePassaporte", label: "Data de Validade do Passaporte", tipo: "date" },
          { id: "documentos.pessoaReagrupada.sexo", label: "Sexo", tipo: "select", opcoes: [
            { valor: "M", rotulo: "Masculino" },
            { valor: "F", rotulo: "Feminino" }
          ]},
          { id: "documentos.pessoaReagrupada.parentesco", label: "Parentesco", tipo: "text" },
          // Mantendo os caminhos antigos para compatibilidade com versões anteriores
          { id: "pessoaReagrupada.nomeCompleto", label: "Nome Completo (Formato Antigo)", tipo: "text" },
          { id: "pessoaReagrupada.dataNascimento", label: "Data de Nascimento (Formato Antigo)", tipo: "date" },
          { id: "pessoaReagrupada.nacionalidade", label: "Nacionalidade (Formato Antigo)", tipo: "text" },
          { id: "pessoaReagrupada.numeroPassaporte", label: "Número do Passaporte (Formato Antigo)", tipo: "text" },
          { id: "pessoaReagrupada.dataValidadePassaporte", label: "Data de Validade do Passaporte (Formato Antigo)", tipo: "date" },
          { id: "pessoaReagrupada.parentesco", label: "Parentesco (Formato Antigo)", tipo: "text" }
        ]
      },
      {
        titulo: "Dados do Filho Residente",
        campos: [
          // Atualizado para suporte à nova estrutura aninhada
          { id: "documentos.pessoaQueRegrupa.nomeCompleto", label: "Nome Completo", tipo: "text" },
          { id: "documentos.pessoaQueRegrupa.numeroDocumento", label: "Número do Documento", tipo: "text" },
          { id: "documentos.pessoaQueRegrupa.dataNascimento", label: "Data de Nascimento", tipo: "date" },
          { id: "documentos.pessoaQueRegrupa.nacionalidade", label: "Nacionalidade", tipo: "text" },
          { id: "documentos.pessoaQueRegrupa.dataValidade", label: "Data de Validade", tipo: "date" },
          { id: "documentos.pessoaQueRegrupa.tipoDocumento", label: "Tipo de Documento", tipo: "select", opcoes: [
            { valor: "TR", rotulo: "TR" },
            { valor: "CC", rotulo: "CC" }
          ]},
          { id: "documentos.pessoaQueRegrupa.parentesco", label: "Parentesco", tipo: "select", opcoes: [
            { valor: "FILHO", rotulo: "Filho" },
            { valor: "FILHA", rotulo: "Filha" }
          ]},
          { id: "documentos.pessoaQueRegrupa.sexo", label: "Sexo", tipo: "select", opcoes: [
            { valor: "M", rotulo: "Masculino" },
            { valor: "F", rotulo: "Feminino" }
          ]},
          // Mantendo os caminhos antigos para compatibilidade com versões anteriores
          { id: "pessoaQueRegrupa.nomeCompleto", label: "Nome Completo (Formato Antigo)", tipo: "text" },
          { id: "pessoaQueRegrupa.numeroDocumento", label: "Número do Documento (Formato Antigo)", tipo: "text" },
          { id: "pessoaQueRegrupa.tipoDocumento", label: "Tipo de Documento (Formato Antigo)", tipo: "select", opcoes: [
            { valor: "TR", rotulo: "TR" },
            { valor: "CC", rotulo: "CC" }
          ]},
          { id: "pessoaQueRegrupa.dataNascimento", label: "Data de Nascimento (Formato Antigo)", tipo: "date" },
          { id: "pessoaQueRegrupa.nacionalidade", label: "Nacionalidade (Formato Antigo)", tipo: "text" },
          { id: "pessoaQueRegrupa.dataValidade", label: "Data de Validade (Formato Antigo)", tipo: "date" },
          { id: "pessoaQueRegrupa.parentesco", label: "Parentesco (Formato Antigo)", tipo: "select", opcoes: [
            { valor: "FILHO", rotulo: "Filho" },
            { valor: "FILHA", rotulo: "Filha" }
          ]}
        ]
      }
    ],
    
    // Template para exibir informações do processo - usando variáveis que verificam ambos os caminhos
    templates: {
      cartao: "{{documentos.pessoaReagrupada.nomeCompleto || pessoaReagrupada.nomeCompleto}} - Reagrupamento Familiar (Pai Idoso)",
      resumo: "Reagrupamento familiar de {{documentos.pessoaReagrupada.nomeCompleto || pessoaReagrupada.nomeCompleto}} (pai) através do filho {{documentos.pessoaQueRegrupa.nomeCompleto || pessoaQueRegrupa.nomeCompleto}}",
      detalhes: "Processo de reagrupamento familiar para o pai {{documentos.pessoaReagrupada.nomeCompleto || pessoaReagrupada.nomeCompleto}}, de nacionalidade {{documentos.pessoaReagrupada.nacionalidade || pessoaReagrupada.nacionalidade}}, nascido em {{documentos.pessoaReagrupada.dataNascimento || pessoaReagrupada.dataNascimento}}, portador do passaporte {{documentos.pessoaReagrupada.numeroPassaporte || pessoaReagrupada.numeroPassaporte}} válido até {{documentos.pessoaReagrupada.dataValidadePassaporte || pessoaReagrupada.dataValidadePassaporte}}. Filho: {{documentos.pessoaQueRegrupa.nomeCompleto || pessoaQueRegrupa.nomeCompleto}}."
    }
  },
  
  // Configuração para Contagem de Tempo
  ContagemTempo: {
    titulo: "Contagem de Tempo de Residência",
    descricao: "Processo para contagem de tempo de residência legal em Portugal",
    
    // Checkboxes para documentos necessários (mesmos do ReagrupamentoConjuge, sem alterações)
    checkboxes: [
      { id: "consentimentoDados", label: "Consentimento dados" },
      { id: "cplp", label: "CPLP" },
      { id: "sapa", label: "SAPA/AIMA" },
      { id: "renovacao", label: "Renovação título" },
      { id: "outros", label: "Outros" }
    ],
    
    // Configuração para o painel de campos baseado na estrutura do JSON
    painelCampos: [
      {
        titulo: "Dados Pessoais",
        campos: [
          { id: "nomeCompleto", label: "Nome Completo", tipo: "text" },
          { id: "numeroDocumento", label: "Número do Documento", tipo: "text" },
          { id: "dataNascimento", label: "Data de Nascimento", tipo: "date" },
          { id: "nacionalidade", label: "Nacionalidade", tipo: "text" },
          { id: "dataValidade", label: "Data de Validade", tipo: "date" },
          { id: "sexo", label: "Sexo", tipo: "select", opcoes: [
            { valor: "M", rotulo: "Masculino" },
            { valor: "F", rotulo: "Feminino" }
          ]},
          { id: "nif", label: "NIF", tipo: "text" }
        ]
      }
    ],
    
    // Template para exibir informações do processo
    templates: {
      cartao: "{{nomeCompleto}} - Contagem de Tempo",
      resumo: "Contagem de tempo de residência para {{nomeCompleto}} ({{nacionalidade}})",
      detalhes: "Processo de contagem de tempo de residência para {{nomeCompleto}}, de nacionalidade {{nacionalidade}}, portador do documento {{numeroDocumento}} válido até {{dataValidade}}, NIF {{nif}}."
    }
  },
  
  // Configuração para CPLP Maiores
  CPLPMaiores: {
    titulo: "CPLP - Maiores de Idade",
    descricao: "Processo para autorização de residência CPLP para maiores de idade",
    
    // Checkboxes para documentos necessários (mesmos do ReagrupamentoConjuge, sem alterações)
    checkboxes: [
      { id: "consentimentoDados", label: "Consentimento dados" },
      { id: "cplp", label: "CPLP" },
      { id: "sapa", label: "SAPA/AIMA" },
      { id: "renovacao", label: "Renovação título" },
      { id: "outros", label: "Outros" }
    ],
    
    // Configuração para o painel de campos baseado na estrutura do JSON
    painelCampos: [
      {
        titulo: "Dados Pessoais",
        campos: [
          // Apenas estrutura nova com documentos
          { id: "documentos.nomeCompleto", label: "Nome Completo", tipo: "text" },
          { id: "documentos.nacionalidade", label: "Nacionalidade", tipo: "text" },
          { id: "documentos.dataNascimento", label: "Data de Nascimento", tipo: "date" },
          { id: "documentos.numeroPassaporte", label: "Número do Passaporte", tipo: "text" },
          { id: "documentos.dataValidadePassaporte", label: "Data de Validade do Passaporte", tipo: "date" },
          { id: "documentos.numeroVisto", label: "Número do Visto", tipo: "text" },
          { id: "documentos.sexo", label: "Sexo", tipo: "select", opcoes: [
            { valor: "M", rotulo: "Masculino" },
            { valor: "F", rotulo: "Feminino" }
          ]}
        ]
      }
    ],
    
    // Template para exibir informações do processo
    templates: {
      cartao: "{{documentos.nomeCompleto}} - CPLP Maiores",
      resumo: "Autorização de residência CPLP para {{documentos.nomeCompleto}} ({{documentos.nacionalidade}})",
      detalhes: "Processo de autorização de residência CPLP para {{documentos.nomeCompleto}}, de nacionalidade {{documentos.nacionalidade}}, nascido em {{documentos.dataNascimento}}, portador do passaporte {{documentos.numeroPassaporte}} válido até {{documentos.dataValidadePassaporte}}."
    }
  },
  
  // Configuração para CPLP Menores
  CPLPMenor: {
    titulo: "CPLP - Menores de Idade",
    descricao: "Processo para autorização de residência CPLP para menores de idade",
    
    // Checkboxes para documentos necessários
    checkboxes: [
      { id: "consentimentoDados", label: "Consentimento dados" },
      { id: "cplp", label: "CPLP" },
      { id: "sapa", label: "SAPA/AIMA" },
      { id: "renovacao", label: "Renovação título" },
      { id: "outros", label: "Outros" }
    ],
    
    // Configuração para o painel de campos baseado na estrutura do JSON
    painelCampos: [
      {
        titulo: "Dados do Menor",
        campos: [
          // Apenas estrutura nova com documentos
          { id: "documentos.dados_do_menor.nome_completo", label: "Nome Completo", tipo: "text" },
          { id: "documentos.dados_do_menor.nacionalidade", label: "Nacionalidade", tipo: "text" },
          { id: "documentos.dados_do_menor.data_de_nascimento", label: "Data de Nascimento", tipo: "date" },
          { id: "documentos.dados_do_menor.numero_do_passaporte", label: "Número do Passaporte", tipo: "text" }
        ]
      },
      {
        titulo: "Dados do Responsável",
        campos: [
          // Apenas estrutura nova com documentos
          { id: "documentos.dados_do_responsavel.nome_do_responsavel", label: "Nome do Responsável", tipo: "text" },
          { id: "documentos.dados_do_responsavel.numero_do_documento", label: "Número do Documento", tipo: "text" },
          { id: "documentos.dados_do_responsavel.data_de_validade_do_documento", label: "Data de Validade do Documento", tipo: "date" }
        ]
      }
    ],
    
    // Template para exibir informações do processo
    templates: {
      cartao: "{{documentos.dados_do_menor.nome_completo}} - CPLP Menor",
      resumo: "Autorização de residência CPLP para menor {{documentos.dados_do_menor.nome_completo}} ({{documentos.dados_do_menor.nacionalidade}})",
      detalhes: "Processo de autorização de residência CPLP para menor {{documentos.dados_do_menor.nome_completo}}, de nacionalidade {{documentos.dados_do_menor.nacionalidade}}, nascido em {{documentos.dados_do_menor.data_de_nascimento}}, portador do passaporte {{documentos.dados_do_menor.numero_do_passaporte}}. Responsável: {{documentos.dados_do_responsavel.nome_do_responsavel}}."
    }
  },
  
  // Configuração para Manifestação de Interesse
  ManifestacaoInteresse: {
    titulo: "Manifestação de Interesse",
    descricao: "Processo de manifestação de interesse para obtenção de residência",
    
    // Checkboxes para documentos necessários
    checkboxes: [
      { id: "consentimentoDados", label: "Consentimento dados" },
      { id: "cplp", label: "CPLP" },
      { id: "sapa", label: "SAPA/AIMA" },
      { id: "renovacao", label: "Renovação título" },
      { id: "outros", label: "Outros" }
    ],
    
    // Configuração para o painel de campos
    painelCampos: [
      {
        titulo: "Dados Pessoais",
        campos: [
          { id: "nomeCompleto", label: "Nome Completo", tipo: "text" },
          { id: "numeroPassaporte", label: "Número do Passaporte", tipo: "text" },
          { id: "dataNascimento", label: "Data de Nascimento", tipo: "date" },
          { id: "nacionalidade", label: "Nacionalidade", tipo: "text" },
          { id: "dataValidadePassaporte", label: "Data de Validade do Passaporte", tipo: "date" }
        ]
      },
      {
        titulo: "Dados de Residência",
        campos: [
          { id: "endereco", label: "Endereço", tipo: "text" },
          { id: "codigoPostal", label: "Código Postal", tipo: "text" },
          { id: "localidade", label: "Localidade", tipo: "text" }
        ]
      }
    ],
    
    // Template para exibir informações do processo
    templates: {
      cartao: "{{nomeCompleto}} - Manifestação de Interesse",
      resumo: "Manifestação de interesse para {{nomeCompleto}} ({{nacionalidade}})",
      detalhes: "Processo de manifestação de interesse para {{nomeCompleto}}, portador do passaporte {{numeroPassaporte}} válido até {{dataValidadePassaporte}}."
    }
  },
  
  // Configuração padrão para processos genéricos
  default: {
    titulo: "Processo Genérico",
    descricao: "Processo genérico de documentação",
    
    // Checkboxes para documentos necessários
    checkboxes: [
      { id: "consentimentoDados", label: "Consentimento dados" },
      { id: "cplp", label: "CPLP" },
      { id: "sapa", label: "SAPA/AIMA" },
      { id: "renovacao", label: "Renovação título" },
      { id: "outros", label: "Outros" }
    ],
    
    // Configuração para o painel de campos
    painelCampos: [
      {
        titulo: "Dados Pessoais",
        campos: [
          { id: "nomeCompleto", label: "Nome", tipo: "text" },
          { id: "numeroDocumento", label: "Número de Documento", tipo: "text" },
          { id: "dataNascimento", label: "Data de Nascimento", tipo: "date" },
          { id: "nacionalidade", label: "Nacionalidade", tipo: "text" }
        ]
      },
      {
        titulo: "Dados Adicionais",
        campos: [
          { id: "numeroVisto", label: "Número do Visto", tipo: "text" },
          { id: "dataValidade", label: "Data de Validade", tipo: "date" }
        ]
      }
    ],
    
    // Template para exibir informações do processo
    templates: {
      cartao: "{{nomeCompleto}} - Processo",
      resumo: "Processo para {{nomeCompleto}} ({{nacionalidade}})",
      detalhes: "Processo para {{nomeCompleto}}, portador do documento {{numeroDocumento}} válido até {{dataValidade}}."
    }
  },
  
  // Configuração para TR Estudante 2
  TREstudante2: {
    titulo: "Título de Residência - Estudante 2",
    descricao: "Processo para concessão de título de residência para estudante (2)",
    
    // Checkboxes para documentos necessários
    checkboxes: [
      { id: "consentimentoDados", label: "Consentimento dados" },
      { id: "cplp", label: "CPLP" },
      { id: "sapa", label: "SAPA/AIMA" },
      { id: "renovacao", label: "Renovação título" },
      { id: "outros", label: "Outros" }
    ],
    
    // Configuração para o painel de campos
    painelCampos: [
      {
        titulo: "Dados Pessoais",
        campos: [
          { id: "nomeCompleto", label: "Nome Completo", tipo: "text" },
          { id: "numeroPassaporte", label: "Número do Passaporte", tipo: "text" },
          { id: "dataNascimento", label: "Data de Nascimento", tipo: "date" },
          { id: "nacionalidade", label: "Nacionalidade", tipo: "text" },
          { id: "dataValidade", label: "Data de Validade", tipo: "date" },
          { id: "sexo", label: "Sexo", tipo: "select", opcoes: [
            { valor: "M", rotulo: "Masculino" },
            { valor: "F", rotulo: "Feminino" }
          ]}
        ]
      },
      {
        titulo: "Dados da Instituição de Ensino",
        campos: [
          { id: "nomeInstituicao", label: "Nome da Instituição", tipo: "text" },
          { id: "cursoMatriculado", label: "Curso Matriculado", tipo: "text" },
          { id: "anoCurso", label: "Ano do Curso", tipo: "text" }
        ]
      }
    ],
    
    // Template para exibir informações do processo
    templates: {
      cartao: "{{nomeCompleto}} - TR Estudante 2",
      resumo: "Concessão de TR para estudante {{nomeCompleto}} ({{nacionalidade}})",
      detalhes: "Processo de concessão de título de residência para estudante {{nomeCompleto}}, portador do passaporte {{numeroPassaporte}} válido até {{dataValidade}}, matriculado no curso de {{cursoMatriculado}} na instituição {{nomeInstituicao}}."
    }
  },
  
  // Configuração para Informação de Processo
  Informacao: {
    titulo: "Pedido de Título de Residência - (Informação de Processo)",
    descricao: "Processo de informação sobre pedido de título de residência",
    
    // Checkboxes para documentos necessários
    checkboxes: [
      { id: "consentimentoDados", label: "Consentimento dados" },
      { id: "cplp", label: "CPLP" },
      { id: "sapa", label: "SAPA/AIMA" },
      { id: "renovacao", label: "Renovação título" },
      { id: "outros", label: "Outros" }
    ],
    
    // Configuração para o painel de campos
    painelCampos: [
      {
        titulo: "Dados Pessoais",
        campos: [
          { id: "nomeCompleto", label: "Nome Completo", tipo: "text" },
          { id: "numeroDocumento", label: "Número do Documento", tipo: "text" },
          { id: "dataNascimento", label: "Data de Nascimento", tipo: "date" },
          { id: "nacionalidade", label: "Nacionalidade", tipo: "text" },
          { id: "dataValidade", label: "Data de Validade", tipo: "date" },
          { id: "sexo", label: "Sexo", tipo: "select", opcoes: [
            { valor: "M", rotulo: "Masculino" },
            { valor: "F", rotulo: "Feminino" }
          ]}
        ]
      }
    ],
    
    // Template para exibir informações do processo
    templates: {
      cartao: "{{nomeCompleto}} - Informação de Processo",
      resumo: "Pedido de informação para {{nomeCompleto}} ({{nacionalidade}})",
      detalhes: "Processo de informação para {{nomeCompleto}}, portador do documento {{numeroDocumento}}, nascido em {{dataNascimento}}."
    }
  },

  // Configuração para Informação de Processo via Portal
  InformacaoPortal: {
    id: "informacao_portal",
    titulo: "Pedido de Título de Residência - (Informação de Processo via Portal)",
    descricao: "Processo de informação sobre pedido de título de residência via portal",
    
    checkboxes: [
      { id: "consentimentoDados", label: "Consentimento dados" },
      { id: "cplp", label: "CPLP" },
      { id: "sapa", label: "SAPA/AIMA" },
      { id: "renovacao", label: "Renovação título" },
      { id: "outros", label: "Outros" }
    ],
    
    painelCampos: [
      {
        titulo: "Dados Pessoais",
        campos: [
          { id: "nomeCompleto", label: "Nome Completo", tipo: "text", obrigatorio: true },
          { id: "numeroDocumento", label: "Número do Documento", tipo: "text", obrigatorio: true },
          { id: "dataNascimento", label: "Data de Nascimento", tipo: "date", obrigatorio: true },
          { id: "nacionalidade", label: "Nacionalidade", tipo: "text", obrigatorio: true },
          { id: "dataValidade", label: "Data de Validade", tipo: "date", obrigatorio: true },
          { id: "sexo", label: "Sexo", tipo: "select", obrigatorio: true, opcoes: [
            { valor: "M", rotulo: "Masculino" },
            { valor: "F", rotulo: "Feminino" }
          ]}
        ]
      }
    ],
    
    templates: {
      cartao: "{{nomeCompleto}} - Informação de Processo (Portal)",
      resumo: "Pedido de informação via portal para {{nomeCompleto}} ({{nacionalidade}}), documento {{numeroDocumento}} válido até {{dataValidade}}",
      detalhes: "Processo de informação via portal para {{nomeCompleto}}, portador do documento {{numeroDocumento}} (válido até {{dataValidade}}), nascido em {{dataNascimento}}, {{sexo === 'M' ? 'nacionalidade' : 'nacionalidade'}}."
    },

    mapeamentoCampos: {
      nomeCompleto: "nomeCompleto",
      numeroDocumento: "numeroDocumento",
      dataNascimento: "dataNascimento",
      nacionalidade: "nacionalidade",
      dataValidade: "dataValidade",
      sexo: "sexo"
    }
  },

  // Configuração para Informação de Processo Presencial
  InformacaoPresencial: {
    id: "informacao_presencial",
    titulo: "Pedido de Título de Residência - (Informação de Processo Presencial)",
    descricao: "Processo de informação sobre pedido de título de residência presencial",
    
    checkboxes: [
      { id: "consentimentoDados", label: "Consentimento dados" },
      { id: "cplp", label: "CPLP" },
      { id: "sapa", label: "SAPA/AIMA" },
      { id: "renovacao", label: "Renovação título" },
      { id: "outros", label: "Outros" }
    ],
    
    painelCampos: [
      {
        titulo: "Dados Pessoais",
        campos: [
          { id: "nomeCompleto", label: "Nome Completo", tipo: "text", obrigatorio: true },
          { id: "numeroDocumento", label: "Número do Documento", tipo: "text", obrigatorio: true },
          { id: "dataNascimento", label: "Data de Nascimento", tipo: "date", obrigatorio: true },
          { id: "nacionalidade", label: "Nacionalidade", tipo: "text", obrigatorio: true },
          { id: "dataValidade", label: "Data de Validade", tipo: "date", obrigatorio: true },
          { id: "sexo", label: "Sexo", tipo: "select", obrigatorio: true, opcoes: [
            { valor: "M", rotulo: "Masculino" },
            { valor: "F", rotulo: "Feminino" }
          ]}
        ]
      }
    ],
    
    templates: {
      cartao: "{{nomeCompleto}} - Informação de Processo (Presencial)",
      resumo: "Pedido de informação presencial para {{nomeCompleto}} ({{nacionalidade}}), documento {{numeroDocumento}} válido até {{dataValidade}}",
      detalhes: "Processo de informação presencial para {{nomeCompleto}}, portador do documento {{numeroDocumento}} (válido até {{dataValidade}}), nascido em {{dataNascimento}}, {{sexo === 'M' ? 'nacionalidade' : 'nacionalidade'}}."
    },

    mapeamentoCampos: {
      nomeCompleto: "nomeCompleto",
      numeroDocumento: "numeroDocumento",
      dataNascimento: "dataNascimento",
      nacionalidade: "nacionalidade",
      dataValidade: "dataValidade",
      sexo: "sexo"
    }
  }
};

export default processoConfig; 