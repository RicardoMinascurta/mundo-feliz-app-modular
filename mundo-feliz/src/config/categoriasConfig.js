/**
 * Configuração de mapeamento de categorias para nomes de pastas
 * Este ficheiro define a estrutura de pastas para cada tipo de processo
 */

// Definir um mapa de categorias para nomes de pastas
export const categoriasMap = {
  'CPLP': 'CPLP',
  'CPLPMaiores': 'CPLP/Maiores',
  'CPLPMenor': 'CPLP/Menores',
  'ConcessaoTR': 'Concessao/TR',
  'ConcessaoTREstudante': 'Concessao/TREstudante',
  'ConcessaoTREstudanteMenor': 'Concessao/TREstudanteMenor',
  'Reagrupamento': 'Reagrupamento',
  'ReagrupamentoFilho': 'Reagrupamento/Filho',
  'ReagrupamentoConjuge': 'Reagrupamento/Conjuge',
  'ReagrupamentoPaiIdoso': 'Reagrupamento/PaiIdoso',
  'ReagrupamentoPaiMaeFora': 'Reagrupamento/PaiMaeFora',
  'ReagrupamentoTutor': 'Reagrupamento/Tutor',
  'RenovacaoEstudanteSuperior': 'Renovacao/EstudanteSuperior',
  'RenovacaoEstudanteSecundario': 'Renovacao/EstudanteSecundario',
  'RenovacaoTratamentoMedico': 'Renovacao/TratamentoMedico',
  'RenovacaoNaoTemEstatuto': 'Renovacao/NaoTemEstatuto',
  'RenovacaoUniaoEuropeia': 'Renovacao/UniaoEuropeia',
  'InformacaoPortal': 'Informacao/Portal',
  'InformacaoPresencial': 'Informacao/Presencial',
  'ContagemTempo': 'Contagem/Tempo'
};

// Mapeamento de tipos de processo para categorias de template
export const processToTemplateCategory = {
  // Concessão
  'TR': 'concessao',
  'TRNovo': 'concessao',
  'TREstudante': 'concessao',
  'TREstudante2': 'concessao',
  'TREstudanteMenor': 'concessao',
  'ConcessaoTR': 'concessao',
  'ConcessaoTRNovo': 'concessao',
  'ConcessaoTREstudante': 'concessao',
  'ConcessaoTREstudante2': 'concessao',
  'ConcessaoTREstudanteMenor': 'concessao',
  
  // Reagrupamento (usa templates de concessão)
  'ReagrupamentoConjuge': 'concessao',
  'ReagrupamentoFilho': 'concessao',
  'ReagrupamentoPaiIdoso': 'concessao',
  'ReagrupamentoTutor': 'concessao',
  'ReagrupamentoPaiMaeFora': 'concessao',
  
  // CPLP
  'CPLPMaiores': 'cplp',
  'CPLPMenor': 'cplp',
  
  // Renovação
  'RenovacaoEstudanteSuperior': 'renovacao',
  'RenovacaoEstudanteSecundario': 'renovacao',
  'RenovacaoTratamentoMedico': 'renovacao',
  'RenovacaoNaoTemEstatuto': 'renovacao',
  'RenovacaoUniaoEuropeia': 'renovacao',
  'RenovacaoTitulo': 'renovacao',
  'RenovacaoEstatuto': 'renovacao',
  
  // Contagem de tempo
  'ContagemTempo': 'contagem',
  
  // Informação
  'InformacaoPortal': 'infoportal',
  'InfoPortal': 'infoportal',
  'InformacaoPresencial': 'informacao',
  'InfoPresencial': 'informacao',
  
  // Manifestação de interesse
  'ManifestacaoInteresse': 'manifestacao',
  
  // Alias para corrigir problemas específicos
  'c': 'cplp'
};

// Mapeamento explícito de tipo de processo para categoria do template de prompt
export const processoParaCategoriaTemplate = {
  // Concessão
  'TR': 'concessao',
  'TRNovo': 'concessao',
  'TREstudante': 'concessao',
  'TREstudante2': 'concessao',
  'TREstudanteMenor': 'concessao',
  'ConcessaoTR': 'concessao',
  'ConcessaoTRNovo': 'concessao',
  'ConcessaoTREstudante': 'concessao'
}; 