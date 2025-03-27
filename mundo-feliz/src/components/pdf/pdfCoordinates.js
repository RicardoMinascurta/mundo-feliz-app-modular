/**
 * Coordenadas específicas para posicionamento de texto em PDFs
 */

// Coordenadas para PDF de menores
export const childPdfCoordinates = {
  // Nome do menor
  nomeMenor: { x: 137, y: 415 },
  
  // Nome do responsável (adulto)
  nomeResponsavel: { x: 110, y: 508 },
  
  // Número do documento do menor
  numeroDocumentoMenor: { x: 412, y: 385 },
  
  // Nacionalidade do menor
  nacionalidadeMenor: { x: 85, y: 387 },
  
  // Número do documento do responsável
  numeroDocumentoResponsavel: { x: 178, y: 483 },
  
  // Data de validade do documento do menor (formato "DD de MÊS de ANO")
  dataValidadeMenor: {
    dia: { x: 106, y: 357 },
    mes: { x: 127, y: 357 },
    ano: { x: 150, y: 357 }
  },
  
  // Data de validade do documento do responsável (formato "DD de MÊS de ANO")
  dataValidadeResponsavel: {
    dia: { x: 385, y: 483 },
    mes: { x: 410, y: 483 },
    ano: { x: 435, y: 483 }
  },
  
  // Data atual (para assinatura)
  dataAtual: {
    dia: { x: 117, y: 182 },
    mes: { x: 155, y: 182 }
  },
  
  // Checkboxes
  checkboxes: {
    tratamentoDados: { x: 86, y: 658 },
    trocaCredenciaisCPLP: { x: 88, y: 638 },
    trocaCredenciaisSAPA: { x: 87, y: 610 },
    trocaCredenciaisRenovacao: { x: 88, y: 584 },
    outros: { x: 90, y: 556 },
    outrosTexto: { x: 145, y: 554 }
  }
};

// Coordenadas para PDF de adultos
export const adultPdfCoordinates = {
  // Nome do adulto
  nomeAdulto: { x: 112, y: 515 },
  
  // Número do documento
  numeroDocumento: { x: 210, y: 482 },
  
  // Data de validade do documento (formato DD/MM/AAAA)
  dataValidade: {
    dia: { x: 488, y: 482 },
    mes: { x: 456, y: 482 },
    ano: { x: 424, y: 482 }
  },
  
  // Data atual (para assinatura)
  dataAtual: {
    dia: { x: 117, y: 220 },
    mes: { x: 155, y: 220 }
  },
  
  // Checkboxes
  checkboxes: {
    tratamentoDados: { x: 86, y: 672 },
    trocaCredenciaisCPLP: { x: 88, y: 652 },
    trocaCredenciaisSAPA: { x: 87, y: 624 },
    trocaCredenciaisRenovacao: { x: 88, y: 598 },
    outros: { x: 90, y: 570 },
    outrosTexto: { x: 145, y: 570 }
  }
};

// Meses por extenso para formatação de datas
export const mesesPorExtenso = [
  'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
  'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'
];

// Meses por extenso com inicial maiúscula
export const mesesPorExtensoMaiusculo = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

// Função para formatar data para o formato "DD de MÊS de ANO"
export const formatarDataPorExtenso = (dataString) => {
  if (!dataString) return { dia: '', mes: '', ano: '' };
  
  // Verificar formato da data (DD/MM/AAAA ou AAAA-MM-DD ou DD MM AAAA)
  let dia, mes, ano;
  
  if (dataString.includes('/')) {
    // Formato DD/MM/AAAA
    const partes = dataString.split('/');
    dia = partes[0].padStart(2, '0');
    mes = parseInt(partes[1]);
    ano = partes[2];
  } else if (dataString.includes('-')) {
    // Formato AAAA-MM-DD ou DD-MM-AAAA
    const partes = dataString.split('-');
    if (partes[0].length === 4) {
      // AAAA-MM-DD
      dia = partes[2].padStart(2, '0');
      mes = parseInt(partes[1]);
      ano = partes[0];
    } else {
      // DD-MM-AAAA
      dia = partes[0].padStart(2, '0');
      mes = parseInt(partes[1]);
      ano = partes[2];
    }
  } else if (dataString.includes(' ')) {
    // Formato DD MM AAAA ou semelhante
    const partes = dataString.split(' ').filter(p => p.trim() !== '');
    dia = partes[0].padStart(2, '0');
    
    // Verifica se o segundo elemento é um mês por extenso ou um número
    if (isNaN(parseInt(partes[1]))) {
      // É um mês por extenso
      const mesLower = partes[1].toLowerCase();
      mes = mesesPorExtenso.findIndex(m => m.startsWith(mesLower)) + 1;
      if (mes === 0) mes = 1; // fallback para janeiro se não encontrar
    } else {
      mes = parseInt(partes[1]);
    }
    
    ano = partes[2];
  } else {
    return { dia: '', mes: '', ano: '' };
  }
  
  // Converter número do mês para nome por extenso
  const mesPorExtenso = mesesPorExtenso[mes - 1] || '';
  
  return { dia, mes: mesPorExtenso, ano };
};

// Função para formatar data para o formato "DD/MM/AAAA"
export const formatarDataNumerica = (dataString) => {
  if (!dataString) return { dia: '', mes: '', ano: '' };
  
  // Verificar formato da data
  let dia, mes, ano;
  
  if (dataString.includes('/')) {
    // Formato DD/MM/AAAA
    const partes = dataString.split('/');
    dia = partes[0].padStart(2, '0');
    mes = partes[1].padStart(2, '0');
    ano = partes[2];
  } else if (dataString.includes('-')) {
    // Formato AAAA-MM-DD ou DD-MM-AAAA
    const partes = dataString.split('-');
    if (partes[0].length === 4) {
      // AAAA-MM-DD
      dia = partes[2].padStart(2, '0');
      mes = partes[1].padStart(2, '0');
      ano = partes[0];
    } else {
      // DD-MM-AAAA
      dia = partes[0].padStart(2, '0');
      mes = partes[1].padStart(2, '0');
      ano = partes[2];
    }
  } else if (dataString.includes(' ')) {
    // Formato DD MM AAAA ou semelhante
    const partes = dataString.split(' ').filter(p => p.trim() !== '');
    dia = partes[0].padStart(2, '0');
    
    // Verifica se o segundo elemento é um mês por extenso ou um número
    if (isNaN(parseInt(partes[1]))) {
      // É um mês por extenso
      const mesLower = partes[1].toLowerCase();
      const mesIndex = mesesPorExtenso.findIndex(m => m.startsWith(mesLower));
      mes = (mesIndex + 1).toString().padStart(2, '0');
      if (mes === '00') mes = '01'; // fallback para janeiro se não encontrar
    } else {
      mes = partes[1].padStart(2, '0');
    }
    
    ano = partes[2];
  } else {
    return { dia: '', mes: '', ano: '' };
  }
  
  return { dia, mes, ano };
};

export default {
  childPdfCoordinates,
  adultPdfCoordinates,
  mesesPorExtenso,
  mesesPorExtensoMaiusculo,
  formatarDataPorExtenso,
  formatarDataNumerica
}; 