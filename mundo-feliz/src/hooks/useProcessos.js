// Função para determinar o tipo de processo com base na categoria e subtipo
export const getTipoProcesso = (categoria, subtipo) => {
  // Se a categoria for null ou undefined
  if (!categoria) {
    return 'Desconhecido';
  }
  
  // Normalizar categoria
  const cat = categoria.toLowerCase();
  
  if (cat === 'concessao' || cat === 'concessão') {
    switch (subtipo) {
      case 'TR':
        return 'Concessão TR';
      case 'TREstudante':
        return 'TR Estudante';
      case 'TREstudante2':
        return 'TR Estudante 2';
      case 'TREstudanteMenor':
        return 'TR Estudante Menor';
      case 'ReagrupamentoConjuge':
        return 'Reagrupamento Familiar - Cônjuge';
      case 'ReagrupamentoFilho':
        return 'Reagrupamento Familiar - Filho';
      case 'ReagrupamentoTutor':
        return 'Reagrupamento Familiar - Tutor';
      case 'ReagrupamentoAtravesDoFilho':
        return 'Reagrupamento Através do Filho';
      default:
        return 'Concessão';
    }
  }
  
  // ... existing code ...
} 