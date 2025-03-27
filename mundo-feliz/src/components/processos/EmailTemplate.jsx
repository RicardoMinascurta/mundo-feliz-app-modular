const getEmailTemplate = (processType) => {
  // Normaliza o tipo do processo para garantir consistência
  const normalizedType = processType?.toLowerCase() || '';
  
  const templates = {
    'informacaoportal': {
      subject: 'Informação de Processo via Portal',
      body: 'Informação de Processo via Portal'
    },
    'informacaopresencial': {
      subject: 'Informação de Processo Presencial',
      body: 'Informação de Processo Presencial'
    }
  };

  // Tenta encontrar o template normalizado
  const template = templates[normalizedType];
  
  // Se não encontrar, tenta encontrar por inclusão parcial
  if (!template) {
    if (normalizedType.includes('portal')) {
      return templates['informacaoportal'];
    } else if (normalizedType.includes('presencial')) {
      return templates['informacaopresencial'];
    }
  }

  return template || defaultTemplate;
}; 