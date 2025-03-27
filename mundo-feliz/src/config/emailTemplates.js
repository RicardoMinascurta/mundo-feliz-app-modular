// src/config/emailTemplates.js
// Configuração de templates de e-mail para diferentes tipos de processos

const emailTemplates = {
  // Template específico para Renovação - Estudante de Ensino Superior
  RenovacaoEstudanteSuperior: {
    // Destinatário padrão
    destinatario: "ricardominascurta21@gmail.com",
    
    // Função para gerar o assunto do e-mail
    gerarAssunto: (processo) => {
      const nome = processo?.campos?.nomeCompleto || 'Nome não disponível';
      const documento = processo?.campos?.numeroDocumento || 'Documento não disponível';
      return `Renovação TR - ${nome} - ${documento}`;
    },
    
    // Função para gerar o corpo do e-mail com a tabela preenchida
    gerarCorpoEmail: (processo) => {
      // Extrair os dados necessários do processo
      const campos = processo?.campos || {};
      const nome = campos.nomeCompleto || '';
      const dataNascimento = campos.dataNascimento || '';
      const nacionalidade = campos.nacionalidade || '';
      const numeroDocumento = campos.numeroDocumento || '';
      const dataValidade = campos.dataValidade || '';
      
      // Motivo do pedido específico para este tipo de processo
      const motivoPedido = "Renovação TR Estudante de Ensino Superior";
      
      // Observações específicas para este tipo de processo
      // Usando <br> para criar uma linha em branco entre a validade e o texto
      const observacoes = `Validade: ${dataValidade}<br><br>Renovação Estudante Ensino Superior`;
      
      // Definindo estilos CSS robustos para garantir a formatação correta
      const tableStyle = 'width: 440px; border-collapse: collapse; border: 2px solid black; table-layout: fixed; max-width: 440px; margin: 0;';
      const headerCellStyle = 'border: 1px solid black; padding: 7px; font-weight: bold; text-align: center; background-color: #d4e5f7; width: 100%; color: #000000; height: 95%;';
      const labelCellStyle = 'width: 35%; border: 1px solid black; padding: 7px; background-color: white; font-weight: normal; text-align: left; vertical-align: top; color: #000000; height: 95%;';
      const valueCellStyle = 'width: 65%; border: 1px solid black; padding: 7px; background-color: white; font-weight: normal; text-align: left; vertical-align: top; color: #000000; height: 95%;';
      const observacoesCellStyle = 'border: 1px solid black; padding: 7px; height: 57px; vertical-align: top; background-color: white; min-height: 57px; color: #000000;';
      
      // Usando o HTML com estilos robustos para garantir a formatação em clientes de email
      return `
    <div style="max-width: 640px; margin: 0; font-family: Arial, sans-serif; color: #000000;">
    <table style="${tableStyle}">
      <tbody>
        <tr>
          <td colspan="2" style="${headerCellStyle}">
            Pedido de Agendamento SEF/CC
          </td>
        </tr>
        <tr>
          <td style="${labelCellStyle}">
            Motivo do Pedido<br>de Agendamento
          </td>
          <td style="${valueCellStyle}">
            ${motivoPedido}
          </td>
        </tr>
        <tr>
          <td style="${labelCellStyle}">
            Nome Completo
          </td>
          <td style="${valueCellStyle}">
            ${nome}
          </td>
        </tr>
        <tr>
          <td style="${labelCellStyle}">
            Data de Nascimento
          </td>
          <td style="${valueCellStyle}">
            ${dataNascimento}
          </td>
        </tr>
        <tr>
          <td style="${labelCellStyle}">
            Nacionalidade
          </td>
          <td style="${valueCellStyle}">
            ${nacionalidade}
          </td>
        </tr>
        <tr>
          <td style="${labelCellStyle}">
            TR / CR / Visto
          </td>
          <td style="${valueCellStyle}">
            ${numeroDocumento}
          </td>
        </tr>
        <tr>
          <td style="${labelCellStyle}"></td>
          <td style="${valueCellStyle}"></td>
        </tr>
        <tr>
          <td style="${labelCellStyle}">
            Área de Residência
          </td>
          <td style="${valueCellStyle}">
            
          </td>
        </tr>
        <tr>
          <td style="${labelCellStyle}">
            Contacto
          </td>
          <td style="${valueCellStyle}">
            
          </td>
        </tr>
        <tr>
          <td style="${labelCellStyle}">
            E-mail
          </td>
          <td style="${valueCellStyle}">
            
          </td>
        </tr>
        <tr>
          <td style="${labelCellStyle}">
            Posto de Atendimento do<br>SEF preferencial
          </td>
          <td style="${valueCellStyle}">
            
          </td>
        </tr>
        <tr>
          <td style="${labelCellStyle}">
            Observações
          </td>
          <td style="${observacoesCellStyle}">
            ${observacoes}
          </td>
        </tr>
        <tr>
          <td style="${labelCellStyle}">
            Data do Agendamento (a<br>preencher pelo SEF/CC)
          </td>
          <td style="${valueCellStyle}">
            <p style="text-align: right; color: #000000; margin: 0;">Motivo</p>
            <p style="text-align: right; color: #000000; margin: 0;">Local</p>
            <p style="text-align: right; color: #000000; margin: 0;">Data e Hora</p>
          </td>
        </tr>
        <tr>
          <td style="${labelCellStyle}">
            Observações SEF/CC
          </td>
          <td style="${observacoesCellStyle}"></td>
        </tr>
      </tbody>
    </table>
    </div>
      `;
    }
  },
  
  // Template para Renovação - Não Tem Estatuto
  RenovacaoNaoTemEstatuto: {
    // Destinatário padrão
    destinatario: "ricardominascurta21@gmail.com",
    
    // Função para gerar o assunto do e-mail
    gerarAssunto: (processo) => {
      const nome = processo?.campos?.nomeCompleto || 'Nome não disponível';
      const documento = processo?.campos?.numeroDocumento || 'Documento não disponível';
      return `Renovação TR - ${nome} - ${documento}`;
    },
    
    // Função para gerar o corpo do e-mail com a tabela preenchida
    gerarCorpoEmail: (processo) => {
      // Extrair os dados necessários do processo
      const campos = processo?.campos || {};
      const nome = campos.nomeCompleto || '';
      const dataNascimento = campos.dataNascimento || '';
      const nacionalidade = campos.nacionalidade || '';
      const numeroDocumento = campos.numeroDocumento || '';
      const dataValidade = campos.dataValidade || '';
      
      // Motivo do pedido específico para este tipo de processo
      const motivoPedido = "RENOVAÇÃO TR";
      
      // Observações específicas para este tipo de processo
      // Com base na imagem de exemplo, adicionando texto sobre estatuto e validade
      const observacoes = `O seu estatuto não cumpre os requisitos legais para utilização da funcionalidade "renovação automática".<br><br>VALIDADE : ${dataValidade}`;
      
      // Usando o HTML exato da tabela original do EditorSimples.jsx
      return `
    <p>&nbsp;</p>
    <p>&nbsp;</p>
    <table border="1" cellspacing="0" cellpadding="5" style="width: 100%; border-collapse: collapse; border: 2px solid black;">
      <tbody>
        <tr style="background-color: #d4e5f7;">
          <td colspan="2" align="center" style="border: 1px solid black; padding: 8px; font-weight: bold; text-align: center;">
            Pedido de Agendamento SEF/CC
          </td>
        </tr>
        <tr>
          <td style="width: 35%; border: 1px solid black; padding: 8px; background-color: white;">
            Motivo do Pedido<br>de Agendamento
          </td>
          <td style="border: 1px solid black; padding: 8px; background-color: white;">
            ${motivoPedido}
          </td>
        </tr>
        <tr>
          <td style="border: 1px solid black; padding: 8px; background-color: white;">
            Nome Completo
          </td>
          <td style="border: 1px solid black; padding: 8px; background-color: white;">
            ${nome}
          </td>
        </tr>
        <tr>
          <td style="border: 1px solid black; padding: 8px; background-color: white;">
            Data de Nascimento
          </td>
          <td style="border: 1px solid black; padding: 8px; background-color: white;">
            ${dataNascimento}
          </td>
        </tr>
        <tr>
          <td style="border: 1px solid black; padding: 8px; background-color: white;">
            Nacionalidade
          </td>
          <td style="border: 1px solid black; padding: 8px; background-color: white;">
            ${nacionalidade}
          </td>
        </tr>
        <tr>
          <td style="border: 1px solid black; padding: 8px; background-color: white;">
            TR / CR / Visto
          </td>
          <td style="border: 1px solid black; padding: 8px; background-color: white;">
            ${numeroDocumento}
          </td>
        </tr>
        <tr>
          <td style="border: 1px solid black; padding: 8px; background-color: white;"></td>
          <td style="border: 1px solid black; padding: 8px; background-color: white;"></td>
        </tr>
        <tr>
          <td style="border: 1px solid black; padding: 8px; background-color: white;">
            Área de Residência
          </td>
          <td style="border: 1px solid black; padding: 8px; background-color: white;">
            LISBOA
          </td>
        </tr>
        <tr>
          <td style="border: 1px solid black; padding: 8px; background-color: white;">
            Contacto
          </td>
          <td style="border: 1px solid black; padding: 8px; background-color: white;">
            
          </td>
        </tr>
        <tr>
          <td style="border: 1px solid black; padding: 8px; background-color: white;">
            E-mail
          </td>
          <td style="border: 1px solid black; padding: 8px; background-color: white;">
            
          </td>
        </tr>
        <tr>
          <td style="border: 1px solid black; padding: 8px; background-color: white;">
            Posto de Atendimento do<br>SEF preferencial
          </td>
          <td style="border: 1px solid black; padding: 8px; background-color: white;">
            LISBOA
          </td>
        </tr>
        <tr>
          <td style="border: 1px solid black; padding: 8px; vertical-align: top; background-color: white;">
            Observações
          </td>
          <td style="border: 1px solid black; padding: 8px; height: 100px; vertical-align: top; background-color: white;">
            ${observacoes}
          </td>
        </tr>
        <tr>
          <td style="border: 1px solid black; padding: 8px; vertical-align: top; background-color: white;">
            Data do Agendamento (a<br>preencher pelo SEF/CC)
          </td>
          <td style="border: 1px solid black; padding: 8px; vertical-align: top; text-align: right; background-color: white;">
            <p style="text-align: right;">Motivo</p>
            <p style="text-align: right;">Local</p>
            <p style="text-align: right;">Data e Hora</p>
          </td>
        </tr>
        <tr>
          <td style="border: 1px solid black; padding: 8px; vertical-align: top; background-color: white;">
            Observações SEF/CC
          </td>
          <td style="border: 1px solid black; padding: 8px; height: 80px; vertical-align: top; background-color: white;"></td>
        </tr>
      </tbody>
    </table>
    <p>&nbsp;</p>
    <p>&nbsp;</p>
      `;
    }
  },
  
  // Template para Renovação - Estudante do Ensino Secundário
  RenovacaoEstudanteSecundario: {
    // Destinatário padrão
    destinatario: "ricardominascurta21@gmail.com",
    
    // Função para gerar o assunto do e-mail
    gerarAssunto: (processo) => {
      const nome = processo?.campos?.nomeCompleto || 'Nome não disponível';
      const documento = processo?.campos?.numeroDocumento || 'Documento não disponível';
      return `RENOVAÇÃO TR ESTUDANTE (URGENTE) - ${nome} - ${documento}`;
    },
    
    // Função para gerar o corpo do e-mail com a tabela preenchida
    gerarCorpoEmail: (processo) => {
      // Extrair os dados necessários do processo
      const campos = processo?.campos || {};
      const nome = campos.nomeCompleto || '';
      const dataNascimento = campos.dataNascimento || '';
      const nacionalidade = campos.nacionalidade || '';
      const numeroDocumento = campos.numeroDocumento || '';
      const dataValidade = campos.dataValidade || '';
      const email = "geral.mundofeliz@gmail.com";
      
      // Motivo do pedido específico para este tipo de processo
      const motivoPedido = "RENOVAÇÃO TR ESTUDANTE";
      
      // Observações específicas para este tipo de processo - removendo a referência ao 11ºANO
      const observacoes = `<span style="color: blue; font-weight: bold;">ESTUDANTE DO <span style="background-color: yellow;">ENSINO SECUNDÁRIO</span></span><br><br><div style="text-align: right; color: red;">VALIDADE ${dataValidade}</div>`;
      
      // Usando o HTML exato da tabela original do EditorSimples.jsx
      return `
    <p>&nbsp;</p>
    <p>&nbsp;</p>
    <table border="1" cellspacing="0" cellpadding="5" style="width: 100%; border-collapse: collapse; border: 2px solid black;">
      <tbody>
        <tr style="background-color: #d4e5f7;">
          <td colspan="2" align="center" style="border: 1px solid black; padding: 8px; font-weight: bold; text-align: center;">
            Pedido de Agendamento SEF/CC
          </td>
        </tr>
        <tr>
          <td style="width: 35%; border: 1px solid black; padding: 8px; background-color: white;">
            Motivo do Pedido<br>de Agendamento
          </td>
          <td style="border: 1px solid black; padding: 8px; background-color: white;">
            ${motivoPedido}
          </td>
        </tr>
        <tr>
          <td style="border: 1px solid black; padding: 8px; background-color: white;">
            Nome Completo
          </td>
          <td style="border: 1px solid black; padding: 8px; background-color: white;">
            ${nome}
          </td>
        </tr>
        <tr>
          <td style="border: 1px solid black; padding: 8px; background-color: white;">
            Data de Nascimento
          </td>
          <td style="border: 1px solid black; padding: 8px; background-color: white;">
            ${dataNascimento}
          </td>
        </tr>
        <tr>
          <td style="border: 1px solid black; padding: 8px; background-color: white;">
            Nacionalidade
          </td>
          <td style="border: 1px solid black; padding: 8px; background-color: white;">
            ${nacionalidade}
          </td>
        </tr>
        <tr>
          <td style="border: 1px solid black; padding: 8px; background-color: white;">
            TR / CR / Visto
          </td>
          <td style="border: 1px solid black; padding: 8px; background-color: white;">
            ${numeroDocumento}
          </td>
        </tr>
        <tr>
          <td style="border: 1px solid black; padding: 8px; background-color: white;">
            Passaporte
          </td>
          <td style="border: 1px solid black; padding: 8px; background-color: white;">
            
          </td>
        </tr>
        <tr>
          <td style="border: 1px solid black; padding: 8px; background-color: white;">
            Área de Residência
          </td>
          <td style="border: 1px solid black; padding: 8px; background-color: white;">
            LISBOA
          </td>
        </tr>
        <tr>
          <td style="border: 1px solid black; padding: 8px; background-color: white;">
            Contacto Telefónico
          </td>
          <td style="border: 1px solid black; padding: 8px; background-color: white;">
            
          </td>
        </tr>
        <tr>
          <td style="border: 1px solid black; padding: 8px; background-color: white;">
            E-mail
          </td>
          <td style="border: 1px solid black; padding: 8px; background-color: white;">
            ${email}
          </td>
        </tr>
        <tr>
          <td style="border: 1px solid black; padding: 8px; background-color: white;">
            Posto de Atendimento do<br>SEF preferencial
          </td>
          <td style="border: 1px solid black; padding: 8px; background-color: white;">
            LISBOA
          </td>
        </tr>
        <tr>
          <td style="border: 1px solid black; padding: 8px; vertical-align: top; background-color: white;">
            Observações
          </td>
          <td style="border: 1px solid black; padding: 8px; height: 100px; vertical-align: top; background-color: white;">
            ${observacoes}
          </td>
        </tr>
        <tr>
          <td style="border: 1px solid black; padding: 8px; vertical-align: top; background-color: white;">
            Data do Agendamento (a<br>preencher pelo SEF/CC)
          </td>
          <td style="border: 1px solid black; padding: 8px; vertical-align: top; text-align: right; background-color: white;">
            <p style="text-align: right;">Motivo</p>
            <p style="text-align: right;">Local</p>
            <p style="text-align: right;">Data e Hora</p>
          </td>
        </tr>
        <tr>
          <td style="border: 1px solid black; padding: 8px; vertical-align: top; background-color: white;">
            Observações SEF/CC
          </td>
          <td style="border: 1px solid black; padding: 8px; height: 80px; vertical-align: top; background-color: white;"></td>
        </tr>
      </tbody>
    </table>
    <p>&nbsp;</p>
    <p>&nbsp;</p>
      `;
    }
  },
  
  // Template para Concessão de Título de Estudante
  ConcessaoTituloEstudante: {
    // Destinatário padrão
    destinatario: "ricardominascurta21@gmail.com",
    
    // Função para gerar o assunto do e-mail
    gerarAssunto: (processo) => {
      const nome = processo?.campos?.nomeCompleto || 'Nome não disponível';
      return `CONCESSAO TITULO ESTUDANTE - ${nome}`;
    },
    
    // Função para gerar o corpo do e-mail com a tabela preenchida
    gerarCorpoEmail: (processo) => {
      // Extrair os dados necessários do processo
      const campos = processo?.campos || {};
      const nome = campos.nomeCompleto || '';
      const dataNascimento = campos.dataNascimento || '';
      const nacionalidade = campos.nacionalidade || '';
      const numeroPassaporte = campos.numeroPassaporte || '';
      const email = campos.email || '';
      const isMenor = campos.isMenor === true; // Verifica se é estudante menor
      
      // Motivo do pedido específico para este tipo de processo
      const motivoPedido = "CONCESSÃO T.R. ESTUDANTE";
      
      // Observações específicas baseadas no tipo de estudante
      // Se for menor, mostra "ENSINO SECUNDÁRIO" em fundo amarelo
      // Se não for menor, mostra "ENSINO SUPERIOR"
      const observacoes = isMenor ? 
        `<span style="background-color: yellow;">ENSINO SECUNDÁRIO</span>` : 
        `ENSINO SUPERIOR`;
      
      // Usando o HTML exato da tabela original do EditorSimples.jsx
      return `
    <p>&nbsp;</p>
    <p>&nbsp;</p>
    <table border="1" cellspacing="0" cellpadding="5" style="width: 100%; border-collapse: collapse; border: 2px solid black;">
      <tbody>
        <tr style="background-color: #d4e5f7;">
          <td colspan="2" align="center" style="border: 1px solid black; padding: 8px; font-weight: bold; text-align: center;">
            Pedido de Agendamento SEF/CC
          </td>
        </tr>
        <tr>
          <td style="width: 35%; border: 1px solid black; padding: 8px; background-color: white;">
            Motivo do Pedido de<br>Agendamento
          </td>
          <td style="border: 1px solid black; padding: 8px; background-color: white;">
            ${motivoPedido}
          </td>
        </tr>
        <tr>
          <td style="border: 1px solid black; padding: 8px; background-color: white;">
            Nome Completo
          </td>
          <td style="border: 1px solid black; padding: 8px; background-color: white;">
            ${nome}
          </td>
        </tr>
        <tr>
          <td style="border: 1px solid black; padding: 8px; background-color: white;">
            Data de Nascimento
          </td>
          <td style="border: 1px solid black; padding: 8px; background-color: white;">
            ${dataNascimento}
          </td>
        </tr>
        <tr>
          <td style="border: 1px solid black; padding: 8px; background-color: white;">
            Nacionalidade
          </td>
          <td style="border: 1px solid black; padding: 8px; background-color: white;">
            ${nacionalidade}
          </td>
        </tr>
        <tr>
          <td style="border: 1px solid black; padding: 8px; background-color: white;">
            TR / CR / Visto
          </td>
          <td style="border: 1px solid black; padding: 8px; background-color: white;">
            
          </td>
        </tr>
        <tr>
          <td style="border: 1px solid black; padding: 8px; background-color: white;">
            Passaporte
          </td>
          <td style="border: 1px solid black; padding: 8px; background-color: white;">
            ${numeroPassaporte}
          </td>
        </tr>
        <tr>
          <td style="border: 1px solid black; padding: 8px; background-color: white;">
            Área de Residência
          </td>
          <td style="border: 1px solid black; padding: 8px; background-color: white;">
            LISBOA
          </td>
        </tr>
        <tr>
          <td style="border: 1px solid black; padding: 8px; background-color: white;">
            Contacto Telefónico
          </td>
          <td style="border: 1px solid black; padding: 8px; background-color: white;">
            
          </td>
        </tr>
        <tr>
          <td style="border: 1px solid black; padding: 8px; background-color: white;">
            E-mail
          </td>
          <td style="border: 1px solid black; padding: 8px; background-color: white;">
            ${email}
          </td>
        </tr>
        <tr>
          <td style="border: 1px solid black; padding: 8px; background-color: white;">
            Posto de Atendimento do<br>SEF preferencial
          </td>
          <td style="border: 1px solid black; padding: 8px; background-color: white;">
            LISBOA
          </td>
        </tr>
        <tr>
          <td style="border: 1px solid black; padding: 8px; vertical-align: top; background-color: white;">
            Observações
          </td>
          <td style="border: 1px solid black; padding: 8px; height: 100px; vertical-align: top; background-color: white;">
            ${observacoes}
          </td>
        </tr>
        <tr>
          <td style="border: 1px solid black; padding: 8px; vertical-align: top; background-color: white;">
            Data do Agendamento (a<br>preencher pelo SEF/CC)
          </td>
          <td style="border: 1px solid black; padding: 8px; vertical-align: top; background-color: white;">
            <p>Motivo</p>
            <p>Local</p>
            <p>Data e Hora</p>
          </td>
        </tr>
        <tr>
          <td style="border: 1px solid black; padding: 8px; vertical-align: top; background-color: white;">
            Observações SEF/CC
          </td>
          <td style="border: 1px solid black; padding: 8px; height: 80px; vertical-align: top; background-color: white;"></td>
        </tr>
      </tbody>
    </table>
    <p>&nbsp;</p>
    <p>&nbsp;</p>
      `;
    }
  },
  
  // Template para Concessão de Título de Estudante Menor
  ConcessaoTREstudanteMenor: {
    // Destinatário padrão
    destinatario: "ricardominascurta21@gmail.com",
    
    // Função para gerar o assunto do e-mail
    gerarAssunto: (processo) => {
      const nome = processo?.campos?.nomeCompleto || 'Nome não disponível';
      const documento = processo?.campos?.numeroDocumento || 'Documento não disponível';
      return `CONCESSAO TITULO ESTUDANTE (MENOR) - ${nome} - ${documento}`;
    },
    
    // Função para gerar o corpo do e-mail com a tabela preenchida
    gerarCorpoEmail: (processo) => {
      // Extrair os dados necessários do processo
      const campos = processo?.campos || {};
      const nome = campos.nomeCompleto || '';
      const dataNascimento = campos.dataNascimento || '';
      const nacionalidade = campos.nacionalidade || '';
      const numeroDocumento = campos.numeroDocumento || '';
      const numeroPassaporte = campos.numeroPassaporte || numeroDocumento || '';
      const email = "geral.mundofeliz@gmail.com";
      const nomeResponsavelLegal = campos.nomeResponsavelLegal || '';
      
      // Motivo do pedido específico para este tipo de processo
      const motivoPedido = "CONCESSÃO T.R. ESTUDANTE";
      
      // Observações específicas para este tipo de processo
      const observacoes = `<span style="background-color: yellow;">ENSINO SECUNDÁRIO</span>`;
      
      // Usando o HTML exato da tabela original do EditorSimples.jsx
      return `
    <p>&nbsp;</p>
    <p>&nbsp;</p>
    <table border="1" cellspacing="0" cellpadding="5" style="width: 100%; border-collapse: collapse; border: 2px solid black;">
      <tbody>
        <tr style="background-color: #d4e5f7;">
          <td colspan="2" align="center" style="border: 1px solid black; padding: 8px; font-weight: bold; text-align: center;">
            Pedido de Agendamento SEF/CC
          </td>
        </tr>
        <tr>
          <td style="width: 35%; border: 1px solid black; padding: 8px; background-color: white;">
            Motivo do Pedido de<br>Agendamento
          </td>
          <td style="border: 1px solid black; padding: 8px; background-color: white;">
            ${motivoPedido}
          </td>
        </tr>
        <tr>
          <td style="border: 1px solid black; padding: 8px; background-color: white;">
            Nome Completo
          </td>
          <td style="border: 1px solid black; padding: 8px; background-color: white;">
            ${nome}
          </td>
        </tr>
        <tr>
          <td style="border: 1px solid black; padding: 8px; background-color: white;">
            Data de Nascimento
          </td>
          <td style="border: 1px solid black; padding: 8px; background-color: white;">
            ${dataNascimento}
          </td>
        </tr>
        <tr>
          <td style="border: 1px solid black; padding: 8px; background-color: white;">
            Nacionalidade
          </td>
          <td style="border: 1px solid black; padding: 8px; background-color: white;">
            ${nacionalidade}
          </td>
        </tr>
        <tr>
          <td style="border: 1px solid black; padding: 8px; background-color: white;">
            TR / CR / Visto
          </td>
          <td style="border: 1px solid black; padding: 8px; background-color: white;">
            
          </td>
        </tr>
        <tr>
          <td style="border: 1px solid black; padding: 8px; background-color: white;">
            Passaporte
          </td>
          <td style="border: 1px solid black; padding: 8px; background-color: white;">
            ${numeroPassaporte}
          </td>
        </tr>
        <tr>
          <td style="border: 1px solid black; padding: 8px; background-color: white;">
            Área de Residência
          </td>
          <td style="border: 1px solid black; padding: 8px; background-color: white;">
            LISBOA
          </td>
        </tr>
        <tr>
          <td style="border: 1px solid black; padding: 8px; background-color: white;">
            Contacto Telefónico
          </td>
          <td style="border: 1px solid black; padding: 8px; background-color: white;">
            
          </td>
        </tr>
        <tr>
          <td style="border: 1px solid black; padding: 8px; background-color: white;">
            E-mail
          </td>
          <td style="border: 1px solid black; padding: 8px; background-color: white;">
            ${email}
          </td>
        </tr>
        <tr>
          <td style="border: 1px solid black; padding: 8px; background-color: white;">
            Posto de Atendimento do<br>SEF preferencial
          </td>
          <td style="border: 1px solid black; padding: 8px; background-color: white;">
            LISBOA
          </td>
        </tr>
        <tr>
          <td style="border: 1px solid black; padding: 8px; vertical-align: top; background-color: white;">
            Observações
          </td>
          <td style="border: 1px solid black; padding: 8px; height: 100px; vertical-align: top; background-color: white;">
            ${observacoes}
          </td>
        </tr>
        <tr>
          <td style="border: 1px solid black; padding: 8px; vertical-align: top; background-color: white;">
            Data do Agendamento (a<br>preencher pelo SEF/CC)
          </td>
          <td style="border: 1px solid black; padding: 8px; vertical-align: top; text-align: right; background-color: white;">
            <p style="text-align: right;">Motivo</p>
            <p style="text-align: right;">Local</p>
            <p style="text-align: right;">Data e Hora</p>
          </td>
        </tr>
        <tr>
          <td style="border: 1px solid black; padding: 8px; vertical-align: top; background-color: white;">
            Observações SEF/CC
          </td>
          <td style="border: 1px solid black; padding: 8px; height: 80px; vertical-align: top; background-color: white;"></td>
        </tr>
      </tbody>
    </table>
    <p>&nbsp;</p>
    <p>&nbsp;</p>
      `;
    }
  },
  
  // Template para Concessão TR Estudante (Ensino Superior)
  ConcessaoTREstudante: {
    // Destinatário padrão
    destinatario: "ricardominascurta21@gmail.com",
    
    // Função para gerar o assunto do e-mail
    gerarAssunto: (processo) => {
      const nome = processo?.campos?.nomeCompleto || 'Nome não disponível';
      const documento = processo?.campos?.numeroDocumento || 'Documento não disponível';
      return `CONCESSAO TR - ${nome} - ${documento}`;
    },
    
    // Função para gerar o corpo do e-mail com a tabela preenchida
    gerarCorpoEmail: (processo) => {
      // Extrair os dados necessários do processo
      const campos = processo?.campos || {};
      const nome = campos.nomeCompleto || '';
      const dataNascimento = campos.dataNascimento || '';
      const nacionalidade = campos.nacionalidade || '';
      const numeroDocumento = campos.numeroDocumento || '';
      const numeroPassaporte = campos.numeroPassaporte || numeroDocumento || '';
      const email = "geral.mundofeliz@gmail.com";
      
      // Motivo do pedido específico para este tipo de processo
      const motivoPedido = "CONCESSÃO T.R.";
      
      // Observações específicas para este tipo de processo - Ensino Superior
      const observacoes = `ENSINO SUPERIOR`;
      
      // Definindo estilos CSS robustos para garantir a formatação correta
      const tableStyle = 'width: 462px; border-collapse: collapse; border: 2px solid black; table-layout: fixed; max-width: 462px; margin: 0;';
      const headerCellStyle = 'border: 1px solid black; padding: 7px; font-weight: bold; text-align: center; background-color: #d4e5f7; width: 100%; color: #000000; height: 95%;';
      const labelCellStyle = 'width: 35%; border: 1px solid black; padding: 7px; background-color: white; font-weight: normal; text-align: left; vertical-align: top; color: #000000; height: 95%;';
      const valueCellStyle = 'width: 65%; border: 1px solid black; padding: 7px; background-color: white; font-weight: normal; text-align: left; vertical-align: top; color: #000000; height: 95%;';
      const observacoesCellStyle = 'border: 1px solid black; padding: 7px; height: 57px; vertical-align: top; background-color: white; min-height: 57px; color: #000000;';
      
      // Usando o HTML com estilos robustos para garantir a formatação em clientes de email
      return `
    <div style="max-width: 640px; margin: 0; font-family: Arial, sans-serif; color: #000000;">
    <table style="${tableStyle}">
      <tbody>
        <tr>
          <td colspan="2" style="${headerCellStyle}">
            Pedido de Agendamento SEF/CC
          </td>
        </tr>
        <tr>
          <td style="${labelCellStyle}">
            Motivo do Pedido de<br>Agendamento
          </td>
          <td style="${valueCellStyle}">
            ${motivoPedido}
          </td>
        </tr>
        <tr>
          <td style="${labelCellStyle}">
            Nome Completo
          </td>
          <td style="${valueCellStyle}">
            ${nome}
          </td>
        </tr>
        <tr>
          <td style="${labelCellStyle}">
            Data de Nascimento
          </td>
          <td style="${valueCellStyle}">
            ${dataNascimento}
          </td>
        </tr>
        <tr>
          <td style="${labelCellStyle}">
            Nacionalidade
          </td>
          <td style="${valueCellStyle}">
            ${nacionalidade}
          </td>
        </tr>
        <tr>
          <td style="${labelCellStyle}">
            TR / CR / Visto
          </td>
          <td style="${valueCellStyle}">
            
          </td>
        </tr>
        <tr>
          <td style="${labelCellStyle}">
            Passaporte
          </td>
          <td style="${valueCellStyle}">
            ${numeroPassaporte}
          </td>
        </tr>
        <tr>
          <td style="${labelCellStyle}">
            Área de Residência
          </td>
          <td style="${valueCellStyle}">
            LISBOA
          </td>
        </tr>
        <tr>
          <td style="${labelCellStyle}">
            Contacto Telefónico
          </td>
          <td style="${valueCellStyle}">
            
          </td>
        </tr>
        <tr>
          <td style="${labelCellStyle}">
            E-mail
          </td>
          <td style="${valueCellStyle}">
            ${email}
          </td>
        </tr>
        <tr>
          <td style="${labelCellStyle}">
            Posto de Atendimento do<br>SEF preferencial
          </td>
          <td style="${valueCellStyle}">
            LISBOA
          </td>
        </tr>
        <tr>
          <td style="${labelCellStyle}">
            Observações
          </td>
          <td style="${observacoesCellStyle}">
            ${observacoes}
          </td>
        </tr>
        <tr>
          <td style="${labelCellStyle}">
            Data do Agendamento (a<br>preencher pelo SEF/CC)
          </td>
          <td style="${valueCellStyle}">
            <p style="text-align: right; color: #000000; margin: 0;">Motivo</p>
            <p style="text-align: right; color: #000000; margin: 0;">Local</p>
            <p style="text-align: right; color: #000000; margin: 0;">Data e Hora</p>
          </td>
        </tr>
        <tr>
          <td style="${labelCellStyle}">
            Observações SEF/CC
          </td>
          <td style="${observacoesCellStyle}"></td>
        </tr>
      </tbody>
    </table>
    </div>
      `;
    }
  },
  
  // Template padrão para outros tipos de processo (será expandido posteriormente)
  default: {
    destinatario: "",
    gerarAssunto: (processo) => {
      const tipoProcesso = processo?.processId?.split('-')[0] || 'Processo';
      const nome = processo?.campos?.nomeCompleto || 'Nome não disponível';
      return `${tipoProcesso} - ${nome}`;
    },
    gerarCorpoEmail: (processo) => {
      // Definindo estilos CSS robustos para garantir a formatação correta
      const tableStyle = 'width: 440px; border-collapse: collapse; border: 2px solid black; table-layout: fixed; max-width: 440px; margin: 0;';
      const headerCellStyle = 'border: 1px solid black; padding: 7px; font-weight: bold; text-align: center; background-color: #d4e5f7; width: 100%; color: #000000; height: 95%;';
      const labelCellStyle = 'width: 35%; border: 1px solid black; padding: 7px; background-color: white; font-weight: normal; text-align: left; vertical-align: top; color: #000000; height: 95%;';
      const valueCellStyle = 'width: 65%; border: 1px solid black; padding: 7px; background-color: white; font-weight: normal; text-align: left; vertical-align: top; color: #000000; height: 95%;';
      const observacoesCellStyle = 'border: 1px solid black; padding: 7px; height: 57px; vertical-align: top; background-color: white; min-height: 57px; color: #000000;';
      
      // Usando o HTML com estilos robustos para garantir a formatação em clientes de email
      return `
    <div style="max-width: 640px; margin: 0; font-family: Arial, sans-serif; color: #000000;">
    <table style="${tableStyle}">
      <tbody>
        <tr>
          <td colspan="2" style="${headerCellStyle}">
            Pedido de Agendamento SEF/CC
          </td>
        </tr>
        <tr>
          <td style="${labelCellStyle}">
            Motivo do Pedido<br>de Agendamento
          </td>
          <td style="${valueCellStyle}">
            
          </td>
        </tr>
        <tr>
          <td style="${labelCellStyle}">
            Nome Completo
          </td>
          <td style="${valueCellStyle}">
            
          </td>
        </tr>
        <tr>
          <td style="${labelCellStyle}">
            Data de Nascimento
          </td>
          <td style="${valueCellStyle}">
            
          </td>
        </tr>
        <tr>
          <td style="${labelCellStyle}">
            Nacionalidade
          </td>
          <td style="${valueCellStyle}">
            
          </td>
        </tr>
        <tr>
          <td style="${labelCellStyle}">
            TR / CR / Visto
          </td>
          <td style="${valueCellStyle}">
            
          </td>
        </tr>
        <tr>
          <td style="${labelCellStyle}"></td>
          <td style="${valueCellStyle}"></td>
        </tr>
        <tr>
          <td style="${labelCellStyle}">
            Área de Residência
          </td>
          <td style="${valueCellStyle}">
            
          </td>
        </tr>
        <tr>
          <td style="${labelCellStyle}">
            Contacto
          </td>
          <td style="${valueCellStyle}">
            
          </td>
        </tr>
        <tr>
          <td style="${labelCellStyle}">
            E-mail
          </td>
          <td style="${valueCellStyle}">
            
          </td>
        </tr>
        <tr>
          <td style="${labelCellStyle}">
            Posto de Atendimento do<br>SEF preferencial
          </td>
          <td style="${valueCellStyle}">
            
          </td>
        </tr>
        <tr>
          <td style="${labelCellStyle}">
            Observações
          </td>
          <td style="${observacoesCellStyle}">
            
          </td>
        </tr>
        <tr>
          <td style="${labelCellStyle}">
            Data do Agendamento (a<br>preencher pelo SEF/CC)
          </td>
          <td style="${valueCellStyle}">
            <p style="text-align: right; color: #000000; margin: 0;">Motivo</p>
            <p style="text-align: right; color: #000000; margin: 0;">Local</p>
            <p style="text-align: right; color: #000000; margin: 0;">Data e Hora</p>
          </td>
        </tr>
        <tr>
          <td style="${labelCellStyle}">
            Observações SEF/CC
          </td>
          <td style="${observacoesCellStyle}"></td>
        </tr>
      </tbody>
    </table>
    </div>
      `;
    }
  },
  
  // Template para ReagrupamentoFilho
  ReagrupamentoFilho: {
    // Destinatário padrão
    destinatario: "ricardominascurta21@gmail.com",
    
    // Função para gerar o assunto do e-mail
    gerarAssunto: (processo) => {
      const nome = processo?.campos?.pessoaReagrupada?.nomeCompleto || 'Nome não disponível';
      const documento = processo?.campos?.pessoaQueRegrupa?.numeroDocumento || 'Documento não disponível';
      return `REAGRUPAMENTO FAMILIAR - ${nome} - ${documento}`;
    },
    
    // Função para gerar o corpo do e-mail com a tabela preenchida
    gerarCorpoEmail: (processo) => {
      // Extrair os dados necessários do processo
      const campos = processo?.campos || {};
      
      // Dados da pessoa reagrupada (pai/mãe)
      const nomePessoaReagrupada = campos.pessoaReagrupada?.nomeCompleto || '';
      const dataNascimentoReagrupada = campos.pessoaReagrupada?.dataNascimento || '';
      const nacionalidadeReagrupada = campos.pessoaReagrupada?.nacionalidade || '';
      const numeroPassaporteReagrupada = campos.pessoaReagrupada?.numeroPassaporte || '';
      
      // Dados da pessoa que reagrupa (filho/filha)
      const nomePessoaQueRegrupa = campos.pessoaQueRegrupa?.nomeCompleto || '';
      const dataNascimentoQueRegrupa = campos.pessoaQueRegrupa?.dataNascimento || '';
      const nacionalidadeQueRegrupa = campos.pessoaQueRegrupa?.nacionalidade || '';
      const numeroDocumentoQueRegrupa = campos.pessoaQueRegrupa?.numeroDocumento || '';
      const tipoDocumento = campos.pessoaQueRegrupa?.tipoDocumento || 'TR';
      const parentesco = campos.pessoaQueRegrupa?.parentesco || 'FILHO';
      
      // Definir o título do documento com base no tipo selecionado
      const tituloDocumento = tipoDocumento === 'CC' ? 'Cartão de Cidadão' : 'Título de Residência';
      
      // Definir o título dos dados com base no parentesco
      const tituloParentesco = parentesco === 'FILHO' ? 'Dados filho' : 'Dados filha';
      
      // Texto para o motivo do pedido com base no parentesco e tipo de documento
      const textoQuemRegrupa = parentesco === 'FILHO' ? 'DO FILHO' : 'DA FILHA';
      
      // Motivo do pedido específico para este tipo de processo
      const motivoPedido = `REAGRUPAMENTO FAMILIAR ATRAVÉS ${textoQuemRegrupa} QUE TEM ${tituloDocumento.toUpperCase()}`;
      
      // Usando o HTML exato da tabela original do EditorSimples.jsx
      return `
    <p>&nbsp;</p>
    <p>&nbsp;</p>
    <table border="1" cellspacing="0" cellpadding="5" style="width: 100%; border-collapse: collapse; border: 2px solid black;">
      <tbody>
        <tr style="background-color: #d4e5f7;">
          <td colspan="2" align="center" style="border: 1px solid black; padding: 8px; font-weight: bold; text-align: center;">
            Pedido de Agendamento SEF/CC
          </td>
        </tr>
        <tr>
          <td style="width: 35%; border: 1px solid black; padding: 8px; background-color: white;">
            Motivo do Pedido<br>de Agendamento
          </td>
          <td style="border: 1px solid black; padding: 8px; background-color: white;">
            ${motivoPedido}
          </td>
        </tr>
        <tr>
          <td style="border: 1px solid black; padding: 8px; background-color: white;">
            Nome Completo
          </td>
          <td style="border: 1px solid black; padding: 8px; background-color: white;">
            ${nomePessoaReagrupada}
          </td>
        </tr>
        <tr>
          <td style="border: 1px solid black; padding: 8px; background-color: white;">
            Data de Nascimento
          </td>
          <td style="border: 1px solid black; padding: 8px; background-color: white;">
            ${dataNascimentoReagrupada}
          </td>
        </tr>
        <tr>
          <td style="border: 1px solid black; padding: 8px; background-color: white;">
            Nacionalidade
          </td>
          <td style="border: 1px solid black; padding: 8px; background-color: white;">
            ${nacionalidadeReagrupada}
          </td>
        </tr>
        <tr>
          <td style="border: 1px solid black; padding: 8px; background-color: white;">
            TR / CR / Visto
          </td>
          <td style="border: 1px solid black; padding: 8px; background-color: white;">
            
          </td>
        </tr>
        <tr>
          <td style="border: 1px solid black; padding: 8px; background-color: white;">
            Passaporte
          </td>
          <td style="border: 1px solid black; padding: 8px; background-color: white;">
            ${numeroPassaporteReagrupada}
          </td>
        </tr>
        <tr>
          <td style="border: 1px solid black; padding: 8px; background-color: white;">
            Área de Residência
          </td>
          <td style="border: 1px solid black; padding: 8px; background-color: white;">
            LISBOA
          </td>
        </tr>
        <tr>
          <td style="border: 1px solid black; padding: 8px; background-color: white;">
            Contacto Telefónico
          </td>
          <td style="border: 1px solid black; padding: 8px; background-color: white;">
            
          </td>
        </tr>
        <tr>
          <td style="border: 1px solid black; padding: 8px; background-color: white;">
            E-mail
          </td>
          <td style="border: 1px solid black; padding: 8px; background-color: white;">
            
          </td>
        </tr>
        <tr>
          <td style="border: 1px solid black; padding: 8px; background-color: white;">
            Posto de Atendimento do SEF preferencial
          </td>
          <td style="border: 1px solid black; padding: 8px; background-color: white;">
            LISBOA
          </td>
        </tr>
        <tr>
          <td style="border: 1px solid black; padding: 8px; vertical-align: top; background-color: white;">
            Observações
          </td>
          <td style="border: 1px solid black; padding: 8px; height: 100px; vertical-align: top; background-color: white;">
            <p>${tituloParentesco}:</p>
            <p>Nome: ${nomePessoaQueRegrupa}<br>
            Data de nascimento: ${dataNascimentoQueRegrupa}<br>
            Nacionalidade: ${nacionalidadeQueRegrupa}<br>
            ${tituloDocumento.toUpperCase()}: ${numeroDocumentoQueRegrupa}</p>
          </td>
        </tr>
        <tr>
          <td style="border: 1px solid black; padding: 8px; vertical-align: top; background-color: white;">
            Data do Agendamento (a<br>preencher pelo SEF/CC)
          </td>
          <td style="border: 1px solid black; padding: 8px; vertical-align: top; text-align: right; background-color: white;">
            <p style="text-align: right;">Motivo</p>
            <p style="text-align: right;">Local</p>
            <p style="text-align: right;">Data e Hora</p>
          </td>
        </tr>
        <tr>
          <td style="border: 1px solid black; padding: 8px; vertical-align: top; background-color: white;">
            Observações SEF/CC
          </td>
          <td style="border: 1px solid black; padding: 8px; height: 80px; vertical-align: top; background-color: white;"></td>
        </tr>
      </tbody>
    </table>
    <p>&nbsp;</p>
    <p>&nbsp;</p>
      `;
    }
  },
  
  // Template para ReagrupamentoPaiMaeFora
  ReagrupamentoPaiMaeFora: {
    // Destinatário padrão
    destinatario: "ricardominascurta21@gmail.com",
    
    // Função para gerar o assunto do e-mail
    gerarAssunto: (processo) => {
      const nome = processo?.campos?.pessoaReagrupada?.nomeCompleto || 'Nome não disponível';
      const documento = processo?.campos?.pessoaQueRegrupa?.numeroDocumento || 'Documento não disponível';
      return `REAGRUPAMENTO FAMILIAR - ${nome} - ${documento}`;
    },
    
    // Função para gerar o corpo do e-mail com a tabela preenchida
    gerarCorpoEmail: (processo) => {
      // Extrair os dados necessários do processo
      const campos = processo?.campos || {};
      
      // Dados da pessoa reagrupada (filho/filha)
      const nomePessoaReagrupada = campos.pessoaReagrupada?.nomeCompleto || '';
      const dataNascimentoReagrupada = campos.pessoaReagrupada?.dataNascimento || '';
      const nacionalidadeReagrupada = campos.pessoaReagrupada?.nacionalidade || '';
      const numeroPassaporteReagrupada = campos.pessoaReagrupada?.numeroPassaporte || '';
      const parentescoReagrupada = campos.pessoaReagrupada?.parentesco || 'FILHO';
      
      // Dados da pessoa que reagrupa (pai/mãe)
      const nomePessoaQueRegrupa = campos.pessoaQueRegrupa?.nomeCompleto || '';
      const dataNascimentoQueRegrupa = campos.pessoaQueRegrupa?.dataNascimento || '';
      const nacionalidadeQueRegrupa = campos.pessoaQueRegrupa?.nacionalidade || '';
      const numeroDocumentoQueRegrupa = campos.pessoaQueRegrupa?.numeroDocumento || '';
      const tipoDocumento = campos.pessoaQueRegrupa?.tipoDocumento || 'TR';
      const parentescoQueRegrupa = campos.pessoaQueRegrupa?.parentesco || 'PAI';
      
      // Definir o título do documento com base no tipo selecionado
      const tituloDocumento = tipoDocumento === 'CC' ? 'Cartão de Cidadão' : 'Título de Residência';
      
      // Definir o título dos dados com base no parentesco
      const tituloParentesco = parentescoReagrupada === 'FILHO' ? 'Dados filho' : 'Dados filha';
      
      // Motivo do pedido específico para este tipo de processo
      const motivoPedido = `REAGRUPAMENTO FAMILIAR - ${parentescoQueRegrupa === 'PAI' ? 'PAI' : 'MÃE'} PARA ${parentescoReagrupada === 'FILHO' ? 'FILHO' : 'FILHA'} COM ${tituloDocumento.toUpperCase()}`;
      
      // Usando o HTML exato da tabela original do EditorSimples.jsx
      return `
    <p>&nbsp;</p>
    <p>&nbsp;</p>
    <table border="1" cellspacing="0" cellpadding="5" style="width: 100%; border-collapse: collapse; border: 2px solid black;">
      <tbody>
        <tr style="background-color: #d4e5f7;">
          <td colspan="2" align="center" style="border: 1px solid black; padding: 8px; font-weight: bold; text-align: center;">
            Pedido de Agendamento SEF/CC
          </td>
        </tr>
        <tr>
          <td style="width: 35%; border: 1px solid black; padding: 8px; background-color: white;">
            Motivo do Pedido<br>de Agendamento
          </td>
          <td style="border: 1px solid black; padding: 8px; background-color: white;">
            ${motivoPedido}
          </td>
        </tr>
        <tr>
          <td style="border: 1px solid black; padding: 8px; background-color: white;">
            Nome Completo
          </td>
          <td style="border: 1px solid black; padding: 8px; background-color: white;">
            ${nomePessoaReagrupada}
          </td>
        </tr>
        <tr>
          <td style="border: 1px solid black; padding: 8px; background-color: white;">
            Data de Nascimento
          </td>
          <td style="border: 1px solid black; padding: 8px; background-color: white;">
            ${dataNascimentoReagrupada}
          </td>
        </tr>
        <tr>
          <td style="border: 1px solid black; padding: 8px; background-color: white;">
            Nacionalidade
          </td>
          <td style="border: 1px solid black; padding: 8px; background-color: white;">
            ${nacionalidadeReagrupada}
          </td>
        </tr>
        <tr>
          <td style="border: 1px solid black; padding: 8px; background-color: white;">
            TR / CR / Visto
          </td>
          <td style="border: 1px solid black; padding: 8px; background-color: white;">
            
          </td>
        </tr>
        <tr>
          <td style="border: 1px solid black; padding: 8px; background-color: white;">
            Passaporte
          </td>
          <td style="border: 1px solid black; padding: 8px; background-color: white;">
            ${numeroPassaporteReagrupada}
          </td>
        </tr>
        <tr>
          <td style="border: 1px solid black; padding: 8px; background-color: white;">
            Área de Residência
          </td>
          <td style="border: 1px solid black; padding: 8px; background-color: white;">
            LISBOA
          </td>
        </tr>
        <tr>
          <td style="border: 1px solid black; padding: 8px; background-color: white;">
            Contacto Telefónico
          </td>
          <td style="border: 1px solid black; padding: 8px; background-color: white;">
            
          </td>
        </tr>
        <tr>
          <td style="border: 1px solid black; padding: 8px; background-color: white;">
            E-mail
          </td>
          <td style="border: 1px solid black; padding: 8px; background-color: white;">
            
          </td>
        </tr>
        <tr>
          <td style="border: 1px solid black; padding: 8px; background-color: white;">
            Posto de Atendimento do SEF preferencial
          </td>
          <td style="border: 1px solid black; padding: 8px; background-color: white;">
            LISBOA
          </td>
        </tr>
        <tr>
          <td style="border: 1px solid black; padding: 8px; vertical-align: top; background-color: white;">
            Observações
          </td>
          <td style="border: 1px solid black; padding: 8px; height: 100px; vertical-align: top; background-color: white;">
            <p>Dados ${parentescoQueRegrupa === 'PAI' ? 'pai' : 'mãe'}:</p>
            <p>Nome: ${nomePessoaQueRegrupa}<br>
            Data de nascimento: ${dataNascimentoQueRegrupa}<br>
            Nacionalidade: ${nacionalidadeQueRegrupa}<br>
            ${tituloDocumento.toUpperCase()}: ${numeroDocumentoQueRegrupa}</p>
          </td>
        </tr>
        <tr>
          <td style="border: 1px solid black; padding: 8px; vertical-align: top; background-color: white;">
            Data do Agendamento (a<br>preencher pelo SEF/CC)
          </td>
          <td style="border: 1px solid black; padding: 8px; vertical-align: top; text-align: right; background-color: white;">
            <p style="text-align: right;">Motivo</p>
            <p style="text-align: right;">Local</p>
            <p style="text-align: right;">Data e Hora</p>
          </td>
        </tr>
        <tr>
          <td style="border: 1px solid black; padding: 8px; vertical-align: top; background-color: white;">
            Observações SEF/CC
          </td>
          <td style="border: 1px solid black; padding: 8px; height: 80px; vertical-align: top; background-color: white;"></td>
        </tr>
      </tbody>
    </table>
    <p>&nbsp;</p>
    <p>&nbsp;</p>
      `;
    }
  },
  
  // Template para ReagrupamentoTutor
  ReagrupamentoTutor: {
    // Destinatário padrão
    destinatario: "ricardominascurta21@gmail.com",
    
    // Função para gerar o assunto do e-mail
    gerarAssunto: (processo) => {
      const nome = processo?.campos?.pessoaReagrupada?.nomeCompleto || 'Nome não disponível';
      const documento = processo?.campos?.pessoaQueRegrupa?.numeroDocumento || 'Documento não disponível';
      return `REAGRUPAMENTO FAMILIAR (TUTOR) - ${nome} - ${documento}`;
    },
    
    // Função para gerar o corpo do e-mail com a tabela preenchida
    gerarCorpoEmail: (processo) => {
      // Extrair os dados necessários do processo
      const campos = processo?.campos || {};
      
      // Dados da pessoa reagrupada (menor)
      const nomePessoaReagrupada = campos.pessoaReagrupada?.nomeCompleto || '';
      const dataNascimentoReagrupada = campos.pessoaReagrupada?.dataNascimento || '';
      const nacionalidadeReagrupada = campos.pessoaReagrupada?.nacionalidade || '';
      const numeroPassaporteReagrupada = campos.pessoaReagrupada?.numeroPassaporte || '';
      
      // Dados da pessoa que reagrupa (tutor)
      const nomePessoaQueRegrupa = campos.pessoaQueRegrupa?.nomeCompleto || '';
      const dataNascimentoQueRegrupa = campos.pessoaQueRegrupa?.dataNascimento || '';
      const nacionalidadeQueRegrupa = campos.pessoaQueRegrupa?.nacionalidade || '';
      const numeroDocumentoQueRegrupa = campos.pessoaQueRegrupa?.numeroDocumento || '';
      const tipoDocumento = campos.pessoaQueRegrupa?.tipoDocumento || 'TR';
      
      // Definir o título do documento com base no tipo selecionado
      const tituloDocumento = tipoDocumento === 'CC' ? 'Cartão de Cidadão' : 'Título de Residência';
      
      // Motivo do pedido específico para este tipo de processo
      const motivoPedido = `REAGRUPAMENTO FAMILIAR - MENOR COM TUTOR QUE TEM ${tituloDocumento.toUpperCase()}`;
      
      // Usando o HTML exato da tabela original do EditorSimples.jsx
      return `
    <p>&nbsp;</p>
    <p>&nbsp;</p>
    <table border="1" cellspacing="0" cellpadding="5" style="width: 100%; border-collapse: collapse; border: 2px solid black;">
      <tbody>
        <tr style="background-color: #d4e5f7;">
          <td colspan="2" align="center" style="border: 1px solid black; padding: 8px; font-weight: bold; text-align: center;">
            Pedido de Agendamento SEF/CC
          </td>
        </tr>
        <tr>
          <td style="width: 35%; border: 1px solid black; padding: 8px; background-color: white;">
            Motivo do Pedido<br>de Agendamento
          </td>
          <td style="border: 1px solid black; padding: 8px; background-color: white;">
            ${motivoPedido}
          </td>
        </tr>
        <tr>
          <td style="border: 1px solid black; padding: 8px; background-color: white;">
            Nome Completo
          </td>
          <td style="border: 1px solid black; padding: 8px; background-color: white;">
            ${nomePessoaReagrupada}
          </td>
        </tr>
        <tr>
          <td style="border: 1px solid black; padding: 8px; background-color: white;">
            Data de Nascimento
          </td>
          <td style="border: 1px solid black; padding: 8px; background-color: white;">
            ${dataNascimentoReagrupada}
          </td>
        </tr>
        <tr>
          <td style="border: 1px solid black; padding: 8px; background-color: white;">
            Nacionalidade
          </td>
          <td style="border: 1px solid black; padding: 8px; background-color: white;">
            ${nacionalidadeReagrupada}
          </td>
        </tr>
        <tr>
          <td style="border: 1px solid black; padding: 8px; background-color: white;">
            TR / CR / Visto
          </td>
          <td style="border: 1px solid black; padding: 8px; background-color: white;">
            
          </td>
        </tr>
        <tr>
          <td style="border: 1px solid black; padding: 8px; background-color: white;">
            Passaporte
          </td>
          <td style="border: 1px solid black; padding: 8px; background-color: white;">
            ${numeroPassaporteReagrupada}
          </td>
        </tr>
        <tr>
          <td style="border: 1px solid black; padding: 8px; background-color: white;">
            Área de Residência
          </td>
          <td style="border: 1px solid black; padding: 8px; background-color: white;">
            LISBOA
          </td>
        </tr>
        <tr>
          <td style="border: 1px solid black; padding: 8px; background-color: white;">
            Contacto Telefónico
          </td>
          <td style="border: 1px solid black; padding: 8px; background-color: white;">
            
          </td>
        </tr>
        <tr>
          <td style="border: 1px solid black; padding: 8px; background-color: white;">
            E-mail
          </td>
          <td style="border: 1px solid black; padding: 8px; background-color: white;">
            
          </td>
        </tr>
        <tr>
          <td style="border: 1px solid black; padding: 8px; background-color: white;">
            Posto de Atendimento do SEF preferencial
          </td>
          <td style="border: 1px solid black; padding: 8px; background-color: white;">
            LISBOA
          </td>
        </tr>
        <tr>
          <td style="border: 1px solid black; padding: 8px; vertical-align: top; background-color: white;">
            Observações
          </td>
          <td style="border: 1px solid black; padding: 8px; height: 100px; vertical-align: top; background-color: white;">
            <p>Dados do tutor:</p>
            <p>Nome: ${nomePessoaQueRegrupa}<br>
            Data de nascimento: ${dataNascimentoQueRegrupa}<br>
            Nacionalidade: ${nacionalidadeQueRegrupa}<br>
            ${tituloDocumento.toUpperCase()}: ${numeroDocumentoQueRegrupa}</p>
          </td>
        </tr>
        <tr>
          <td style="border: 1px solid black; padding: 8px; vertical-align: top; background-color: white;">
            Data do Agendamento (a<br>preencher pelo SEF/CC)
          </td>
          <td style="border: 1px solid black; padding: 8px; vertical-align: top; text-align: right; background-color: white;">
            <p style="text-align: right;">Motivo</p>
            <p style="text-align: right;">Local</p>
            <p style="text-align: right;">Data e Hora</p>
          </td>
        </tr>
        <tr>
          <td style="border: 1px solid black; padding: 8px; vertical-align: top; background-color: white;">
            Observações SEF/CC
          </td>
          <td style="border: 1px solid black; padding: 8px; height: 80px; vertical-align: top; background-color: white;"></td>
        </tr>
      </tbody>
    </table>
    <p>&nbsp;</p>
    <p>&nbsp;</p>
      `;
    }
  },
  
  // Template para ReagrupamentoConjuge
  ReagrupamentoConjuge: {
    // Destinatário padrão
    destinatario: "ricardominascurta21@gmail.com",
    
    // Função para gerar o assunto do e-mail
    gerarAssunto: (processo) => {
      const nome = processo?.campos?.pessoaReagrupada?.nomeCompleto || 'Nome não disponível';
      const documento = processo?.campos?.pessoaQueRegrupa?.numeroDocumento || 'Documento não disponível';
      return `REAGRUPAMENTO FAMILIAR (CÔNJUGE) - ${nome} - ${documento}`;
    },
    
    // Função para gerar o corpo do e-mail com a tabela preenchida
    gerarCorpoEmail: (processo) => {
      // Extrair os dados necessários do processo
      const campos = processo?.campos || {};
      
      // Dados da pessoa reagrupada (cônjuge que solicita autorização)
      const nomePessoaReagrupada = campos.pessoaReagrupada?.nomeCompleto || '';
      const dataNascimentoReagrupada = campos.pessoaReagrupada?.dataNascimento || '';
      const nacionalidadeReagrupada = campos.pessoaReagrupada?.nacionalidade || '';
      const numeroPassaporteReagrupada = campos.pessoaReagrupada?.numeroPassaporte || '';
      
      // Dados da pessoa que reagrupa (cônjuge residente em Portugal)
      const nomePessoaQueRegrupa = campos.pessoaQueRegrupa?.nomeCompleto || '';
      const dataNascimentoQueRegrupa = campos.pessoaQueRegrupa?.dataNascimento || '';
      const nacionalidadeQueRegrupa = campos.pessoaQueRegrupa?.nacionalidade || '';
      const numeroDocumentoQueRegrupa = campos.pessoaQueRegrupa?.numeroDocumento || '';
      const tipoDocumento = campos.pessoaQueRegrupa?.tipoDocumento || 'TR';
      
      // Definir o título do documento com base no tipo selecionado
      const tituloDocumento = tipoDocumento === 'CC' ? 'Cartão de Cidadão' : 'Título de Residência';
      
      // Motivo do pedido específico para este tipo de processo
      const motivoPedido = `REAGRUPAMENTO FAMILIAR ATRAVÉS DO CÔNJUGE QUE TEM ${tituloDocumento.toUpperCase()}`;
      
      // Usando o HTML exato da tabela original do EditorSimples.jsx
      return `
    <p>&nbsp;</p>
    <p>&nbsp;</p>
    <table border="1" cellspacing="0" cellpadding="5" style="width: 100%; border-collapse: collapse; border: 2px solid black;">
      <tbody>
        <tr style="background-color: #d4e5f7;">
          <td colspan="2" align="center" style="border: 1px solid black; padding: 8px; font-weight: bold; text-align: center;">
            Pedido de Agendamento SEF/CC
          </td>
        </tr>
        <tr>
          <td style="width: 35%; border: 1px solid black; padding: 8px; background-color: white;">
            Motivo do Pedido<br>de Agendamento
          </td>
          <td style="border: 1px solid black; padding: 8px; background-color: white;">
            ${motivoPedido}
          </td>
        </tr>
        <tr>
          <td style="border: 1px solid black; padding: 8px; background-color: white;">
            Nome Completo
          </td>
          <td style="border: 1px solid black; padding: 8px; background-color: white;">
            ${nomePessoaReagrupada}
          </td>
        </tr>
        <tr>
          <td style="border: 1px solid black; padding: 8px; background-color: white;">
            Data de Nascimento
          </td>
          <td style="border: 1px solid black; padding: 8px; background-color: white;">
            ${dataNascimentoReagrupada}
          </td>
        </tr>
        <tr>
          <td style="border: 1px solid black; padding: 8px; background-color: white;">
            Nacionalidade
          </td>
          <td style="border: 1px solid black; padding: 8px; background-color: white;">
            ${nacionalidadeReagrupada}
          </td>
        </tr>
        <tr>
          <td style="border: 1px solid black; padding: 8px; background-color: white;">
            TR / CR / Visto
          </td>
          <td style="border: 1px solid black; padding: 8px; background-color: white;">
            
          </td>
        </tr>
        <tr>
          <td style="border: 1px solid black; padding: 8px; background-color: white;">
            Passaporte
          </td>
          <td style="border: 1px solid black; padding: 8px; background-color: white;">
            ${numeroPassaporteReagrupada}
          </td>
        </tr>
        <tr>
          <td style="border: 1px solid black; padding: 8px; background-color: white;">
            Área de Residência
          </td>
          <td style="border: 1px solid black; padding: 8px; background-color: white;">
            LISBOA
          </td>
        </tr>
        <tr>
          <td style="border: 1px solid black; padding: 8px; background-color: white;">
            Contacto Telefónico
          </td>
          <td style="border: 1px solid black; padding: 8px; background-color: white;">
            
          </td>
        </tr>
        <tr>
          <td style="border: 1px solid black; padding: 8px; background-color: white;">
            E-mail
          </td>
          <td style="border: 1px solid black; padding: 8px; background-color: white;">
            
          </td>
        </tr>
        <tr>
          <td style="border: 1px solid black; padding: 8px; background-color: white;">
            Posto de Atendimento do SEF preferencial
          </td>
          <td style="border: 1px solid black; padding: 8px; background-color: white;">
            LISBOA
          </td>
        </tr>
        <tr>
          <td style="border: 1px solid black; padding: 8px; vertical-align: top; background-color: white;">
            Observações
          </td>
          <td style="border: 1px solid black; padding: 8px; height: 100px; vertical-align: top; background-color: white;">
            <p>Dados do CÔNJUGE:</p>
            <p>Nome: ${nomePessoaQueRegrupa}<br>
            Data de nascimento: ${dataNascimentoQueRegrupa}<br>
            Nacionalidade: ${nacionalidadeQueRegrupa}<br>
            ${tituloDocumento.toUpperCase()}: ${numeroDocumentoQueRegrupa}</p>
          </td>
        </tr>
        <tr>
          <td style="border: 1px solid black; padding: 8px; vertical-align: top; background-color: white;">
            Data do Agendamento (a<br>preencher pelo SEF/CC)
          </td>
          <td style="border: 1px solid black; padding: 8px; vertical-align: top; text-align: right; background-color: white;">
            <p style="text-align: right;">Motivo</p>
            <p style="text-align: right;">Local</p>
            <p style="text-align: right;">Data e Hora</p>
          </td>
        </tr>
        <tr>
          <td style="border: 1px solid black; padding: 8px; vertical-align: top; background-color: white;">
            Observações SEF/CC
          </td>
          <td style="border: 1px solid black; padding: 8px; height: 80px; vertical-align: top; background-color: white;"></td>
        </tr>
      </tbody>
    </table>
    <p>&nbsp;</p>
    <p>&nbsp;</p>
      `;
    }
  },
  
  // Template para Reagrupamento Pai Idoso (sem menção ao parentesco do pai)
  ReagrupamentoPaiIdoso: {
    // Destinatário padrão
    destinatario: "ricardominascurta21@gmail.com",
    
    // Função para gerar o assunto do e-mail
    gerarAssunto: (processo) => {
      const nomeReagrupado = processo?.campos?.pessoaReagrupada?.nomeCompleto || 'Nome não disponível';
      return `Reagrupamento Familiar - ${nomeReagrupado}`;
    },
    
    // Função para gerar o corpo do e-mail com a tabela preenchida
    gerarCorpoEmail: (processo) => {
      // Extrair os dados necessários do processo
      const campos = processo?.campos || {};
      
      // Dados da pessoa reagrupada (pai)
      const pessoaReagrupada = campos.pessoaReagrupada || {};
      const nomeReagrupado = pessoaReagrupada.nomeCompleto || '';
      const dataNascimentoReagrupado = pessoaReagrupada.dataNascimento || '';
      const nacionalidadeReagrupado = pessoaReagrupada.nacionalidade || '';
      const passaporteReagrupado = pessoaReagrupada.numeroPassaporte || '';
      
      // Dados da pessoa que reagrupa (filho/filha)
      const pessoaQueRegrupa = campos.pessoaQueRegrupa || {};
      const nomeQueRegrupa = pessoaQueRegrupa.nomeCompleto || '';
      const dataNascimentoQueRegrupa = pessoaQueRegrupa.dataNascimento || '';
      const nacionalidadeQueRegrupa = pessoaQueRegrupa.nacionalidade || '';
      const numeroDocumentoQueRegrupa = pessoaQueRegrupa.numeroDocumento || '';
      
      // Determinar texto com base no tipo de documento da pessoa que reagrupa
      const tipoDocumento = pessoaQueRegrupa.tipoDocumento || 'TR';
      const tituloDocumento = tipoDocumento === 'TR' ? 'TÍTULO DE RESIDÊNCIA' : 'CARTÃO DE CIDADÃO';
      
      // Determinar texto com base no parentesco da pessoa que reagrupa
      const parentesco = pessoaQueRegrupa.parentesco || 'FILHO';
      const textoQuemRegrupa = parentesco === 'FILHO' ? 'DO FILHO' : 'DA FILHA';
      
      // Idade do reagrupado (pai)
      const idadeEstimada = '65 ANOS';
      
      // Motivo do pedido específico para este tipo de processo
      const motivoPedido = `REAGRUPAMENTO FAMILIAR ATRAVÉS ${textoQuemRegrupa} QUE TEM ${tituloDocumento} (+ ${idadeEstimada})`;
      
      // Dados do filho para as observações
      const observacoes = `Dados ${parentesco === 'FILHO' ? 'do FILHO' : 'da FILHA'}:<br>
Nome: ${nomeQueRegrupa}<br>
Data de nascimento: ${dataNascimentoQueRegrupa}<br>
Nacionalidade: ${nacionalidadeQueRegrupa}<br>
${tituloDocumento}: ${numeroDocumentoQueRegrupa}`;
      
      // Usando o HTML da tabela para o email
      return `
    <p>&nbsp;</p>
    <p>&nbsp;</p>
    <table border="1" cellspacing="0" cellpadding="5" style="width: 100%; border-collapse: collapse; border: 2px solid black;">
      <tbody>
        <tr style="background-color: #d4e5f7;">
          <td colspan="2" align="center" style="border: 1px solid black; padding: 8px; font-weight: bold; text-align: center;">
            Pedido de Agendamento SEF/CC
          </td>
        </tr>
        <tr>
          <td style="width: 35%; border: 1px solid black; padding: 8px; background-color: white;">
            Motivo do Pedido<br>de Agendamento
          </td>
          <td style="border: 1px solid black; padding: 8px; background-color: white;">
            ${motivoPedido}
          </td>
        </tr>
        <tr>
          <td style="border: 1px solid black; padding: 8px; background-color: white;">
            Nome Completo
          </td>
          <td style="border: 1px solid black; padding: 8px; background-color: white;">
            ${nomeReagrupado}
          </td>
        </tr>
        <tr>
          <td style="border: 1px solid black; padding: 8px; background-color: white;">
            Data de Nascimento
          </td>
          <td style="border: 1px solid black; padding: 8px; background-color: white;">
            ${dataNascimentoReagrupado}
          </td>
        </tr>
        <tr>
          <td style="border: 1px solid black; padding: 8px; background-color: white;">
            Nacionalidade
          </td>
          <td style="border: 1px solid black; padding: 8px; background-color: white;">
            ${nacionalidadeReagrupado}
          </td>
        </tr>
        <tr>
          <td style="border: 1px solid black; padding: 8px; background-color: white;">
            Passaporte
          </td>
          <td style="border: 1px solid black; padding: 8px; background-color: white;">
            ${passaporteReagrupado}
          </td>
        </tr>
        <tr>
          <td style="border: 1px solid black; padding: 8px; background-color: white;">
            Área de Residência
          </td>
          <td style="border: 1px solid black; padding: 8px; background-color: white;">
            LISBOA
          </td>
        </tr>
        <tr>
          <td style="border: 1px solid black; padding: 8px; background-color: white;">
            Contacto Telefónico
          </td>
          <td style="border: 1px solid black; padding: 8px; background-color: white;">
            912748923
          </td>
        </tr>
        <tr>
          <td style="border: 1px solid black; padding: 8px; background-color: white;">
            E-mail
          </td>
          <td style="border: 1px solid black; padding: 8px; background-color: white;">
            geral.mundofeliz@gmail.com
          </td>
        </tr>
        <tr>
          <td style="border: 1px solid black; padding: 8px; background-color: white;">
            Posto de Atendimento do<br>SEF preferencial
          </td>
          <td style="border: 1px solid black; padding: 8px; background-color: white;">
            LISBOA
          </td>
        </tr>
        <tr>
          <td style="border: 1px solid black; padding: 8px; vertical-align: top; background-color: white;">
            Observações
          </td>
          <td style="border: 1px solid black; padding: 8px; height: 100px; vertical-align: top; background-color: white;">
            ${observacoes}
          </td>
        </tr>
        <tr>
          <td style="border: 1px solid black; padding: 8px; vertical-align: top; background-color: white;">
            Data do Agendamento (a<br>preencher pelo SEF/CC)
          </td>
          <td style="border: 1px solid black; padding: 8px; vertical-align: top; text-align: right; background-color: white;">
            <p style="text-align: right;">Motivo</p>
            <p style="text-align: right;">Local</p>
            <p style="text-align: right;">Data e Hora</p>
          </td>
        </tr>
        <tr>
          <td style="border: 1px solid black; padding: 8px; vertical-align: top; background-color: white;">
            Observações SEF/CC
          </td>
          <td style="border: 1px solid black; padding: 8px; height: 80px; vertical-align: top; background-color: white;"></td>
        </tr>
      </tbody>
    </table>
    <p>&nbsp;</p>
    <p>&nbsp;</p>
      `;
    }
  },

  // Template para Contagem de Tempo
  ContagemTempo: {
    // Destinatário padrão
    destinatario: "ricardominascurta21@gmail.com",
    
    // Função para gerar o assunto do e-mail
    gerarAssunto: (processo) => {
      const nome = processo?.campos?.nomeCompleto || 'Nome não disponível';
      const documento = processo?.campos?.numeroDocumento || 'Documento não disponível';
      return `PEDIDO DE CERTIDÃO DE CONTAGEM DE TEMPO - ${nome} - ${documento}`;
    },
    
    // Função para gerar o corpo do e-mail com formato simplificado
    gerarCorpoEmail: (processo) => {
      // Extrair os dados necessários do processo
      const campos = processo?.campos || {};
      const nome = campos.nomeCompleto?.toUpperCase() || '';
      const dataNascimento = campos.dataNascimento || '';
      const nacionalidade = campos.nacionalidade || '';
      const nif = campos.nif || '';
      
      // Usando tags HTML para formatação adequada
      return `<p>Exmos. Srs.,</p>

<p>Vimos por este meio solicitar a CERTIDÃO DE CONTAGEM DO TEMPO da respectiva pessoa abaixo indicada:</p>

<p>${nome}<br>
Nacionalidade : ${nacionalidade}<br>
Data de nascimento : ${dataNascimento}<br>
NIF: ${nif}</p>

<p>Com os melhores cumprimentos.</p>

<p>--<br>
Associação de Imigrantes Mundo Feliz</p>`;
    }
  },

  // Template para Desbloqueio CPLP
  CPLPDesbloqueio: {
    destinatario: "ricardominascurta21@gmail.com",
    
    gerarAssunto: (processo) => {
      const nome = processo?.campos?.nomeCompleto || 'Nome não disponível';
      const documento = processo?.campos?.numeroVisto || 'Documento não disponível';
      return `DESBLOQUEIO PROCESSO CPLP (REMOVER CREDENCIAIS) - ${nome} - ${documento}`;
    },
    
    gerarCorpoEmail: (processo) => {
      const campos = processo?.campos || {};
      const nome = campos.nomeCompleto?.toUpperCase() || '';
      const nacionalidade = campos.nacionalidade || '';
      const dataNascimento = campos.dataNascimento || '';
      const numeroPassaporte = campos.numeroPassaporte || '';
      const numeroVisto = campos.numeroVisto || '';
      const telefone = campos.telefone || '';
      
      return `<p>Exmos Srs.,</p>

<p>A pedido da nossa associada, vimos por este meio solicitar ajuda no desbloqueio deste processo.</p>

<p>Neste momento já não é possível fazer o registo para um novo email no portal CPLP, pois informa que já tem um utilizador registado devido à seguinte informação: "Erro ao criar processo. Já existe um utilizador no portal associado ao seu visto consular". Desta forma não conseguimos entrar no portal para emitir o CPLP.</p>

<p>Seria possível remover as credenciais deste processo, por favor?</p>

<p>${nome}<br>
Nac: ${nacionalidade}<br>
Data de Nasc: ${dataNascimento}<br>
Passaporte Nº: ${numeroPassaporte}<br>
VISTO: ${numeroVisto}<br>
Contacto: ${telefone}</p>

<p>Com os melhores cumprimentos,<br>
Cecília Minascurta.</p>`;
    }
  },

  // Template para Agendamento CPLP
  CPLPAgendamento: {
    destinatario: "ricardominascurta21@gmail.com",
    
    gerarAssunto: (processo) => {
      const nome = processo?.campos?.nomeCompleto || 'Nome não disponível';
      const documento = processo?.campos?.numeroPassaporte || 'Documento não disponível';
      return `AGENDAMENTO PRESENCIAL CPLP - ${nome} - ${documento}`;
    },
    
    gerarCorpoEmail: (processo) => {
      const campos = processo?.campos || {};
      const nome = campos.nomeCompleto?.toUpperCase() || '';
      const nomeMae = campos.nomeMae?.toUpperCase() || '';
      const dataNascimento = campos.dataNascimento || '';
      const nacionalidade = campos.nacionalidade || '';
      const numeroPassaporte = campos.numeroPassaporte || '';
      const numeroVisto = campos.numeroVisto || '';
      const telefone = campos.telefone || '920060106';
      
      return `<p>Exmos. Srs.,</p>

<p>A pedido da nosso associada, ${nomeMae} (mãe) do menor ${nome}, vimos por este meio solicitar ajuda para agendamento de entrega da certidão de nascimento para adquirir a AR CPLP, pois o portal informa que "aguarda atendimento presencial".<br>
Enviamos em anexo a declaração de consentimento.</p>

<p>Nome: ${nome}<br>
DATA DE NASC.: ${dataNascimento}<br>
NAC: ${nacionalidade}
PASSAPORTE: ${numeroPassaporte}<br>
VISTO: ${numeroVisto}<br>
TLF.: ${telefone}</p>

<p>Desde já agradecemos e aguardamos a vossa resposta,</p>

<p>Cecilia Minascurta<br>
Presidente.</p>`;
    }
  },

  // Template para CPLP em Análise
  CPLPAnalise: {
    destinatario: "ricardominascurta21@gmail.com",
    
    gerarAssunto: (processo) => {
      const nome = processo?.campos?.nomeCompleto || 'Nome não disponível';
      const documento = processo?.campos?.numeroProcesso || 'Documento não disponível';
      return `PROCESSO AR CPLP EM ANÁLISE - ${nome} - ${documento}`;
    },
    
    gerarCorpoEmail: (processo) => {
      const campos = processo?.campos || {};
      const nome = campos.nomeCompleto?.toUpperCase() || '';
      const numeroProcesso = campos.numeroProcesso || '';
      const emailProcesso = campos.emailProcesso || '';
      const telefone = campos.telefone || '';
      const dataSubmissao = campos.dataSubmissao || '12/02/2025';
      
      return `<p>Exmos. Srs,</p>

<p>A pedido do nosso associado ${nome}, vimos por este meio solicitar ajuda no desbloqueio deste processo.<br>
O pedido da Autorização de Residência CPLP foi submetido dia ${dataSubmissao} e encontra-se até ao momento em análise, não sendo possível a emissão do DUC e a conclusão do processo.</p>

<p>Seria possível ajuda no desbloqueio deste processo ou, alguma orientação de como proceder ao desbloqueio do mesmo por favor?</p>

<p>Segue em anexo print do processo</p>

<p>${nome}<br>
Processo: ${numeroProcesso}<br>
Email do processo: ${emailProcesso}<br>
Contacto: ${telefone}</p>

<p>Com os melhores cumprimentos,<br>
Cecília Minascurta.</p>`;
    }
  },

  // Template para CPLP Menor
  CPLPMenor: {
    destinatario: "ricardominascurta21@gmail.com",
    
    gerarAssunto: (processo) => {
      const campos = processo?.campos?.dados_do_menor || {};
      const nome = campos.nome_completo || '';
      const documento = campos.numero_do_passaporte || '';
      return `AGENDAMENTO PRESENCIAL CPLP – ${nome} – ${documento}`;
    },
    
    gerarCorpoEmail: (processo) => {
      const campos = processo?.campos || {};
      const dados_menor = campos.dados_do_menor || {};
      const dados_responsavel = campos.dados_do_responsavel || {};
      
      const nome_menor = dados_menor.nome_completo || '';
      const data_nasc = dados_menor.data_de_nascimento || '';
      const nacionalidade = dados_menor.nacionalidade || '';
      const passaporte = dados_menor.numero_do_passaporte || '';
      const visto = dados_menor.numero_do_visto || '';
      const telefone = dados_responsavel.telefone || '920060106';
      const nome_responsavel = dados_responsavel.nome_do_responsavel || '';
      const parentesco = dados_responsavel.parentesco || 'mãe';

      return `<p>Exmos. Srs.,</p>

<p>A pedido da nosso associada, ${nome_responsavel} (${parentesco}) do menor ${nome_menor}, vimos por este meio solicitar ajuda para agendamento de entrega da certidão de nascimento para adquirir a AR CPLP, pois o portal informa que "aguarda atendimento presencial". Enviamos em anexo a declaração de consentimento.</p>

<p>Nome: ${nome_menor}<br>
DATA DE NASC.: ${data_nasc}<br>
NAC: ${nacionalidade}<br>
PASSAPORTE: ${passaporte}<br>
VISTO: ${visto}<br>
TLF.: ${telefone}</p>

<p>Desde já agradecemos e aguardamos a vossa resposta,</p>

<p>Cecilia Minascurta<br>
Presidente.</p>`;
    }
  },

  // Template para Informação de Processo via Portal
  informacaoportal: {
    destinatario: "info.aima@aima.pt",
    
    gerarAssunto: (processo) => {
      const nome = processo?.campos?.nomeCompleto || 'Nome não disponível';
      const documento = processo?.campos?.numeroDocumento || 'Documento não disponível';
      return `Informação sobre o seu processo (Portal) - ${nome} - ${documento}`;
    },
    
    gerarCorpoEmail: (processo) => {
      const campos = processo?.campos || {};
      const nome = campos.nomeCompleto || '';
      const nacionalidade = campos.nacionalidade || '';
      const numeroDocumento = campos.numeroDocumento || '';
      const dataNascimento = campos.dataNascimento || '';
      const dataValidade = campos.dataValidade || '';
      
      return `Exmo(a). Sr(a). ${nome},

Em resposta ao seu pedido de informação sobre o processo submetido através do portal, informamos que:

- Nome: ${nome}
- Nacionalidade: ${nacionalidade}
- Número do Documento: ${numeroDocumento}
- Data de Nascimento: ${dataNascimento}
- Data de Validade: ${dataValidade}

O seu processo encontra-se em análise pelos nossos serviços.

Para mais informações, poderá consultar o portal SAPA/AIMA ou contactar-nos através dos canais oficiais.

Com os melhores cumprimentos,
AIMA`;
    }
  },

  // Template para Informação de Processo Presencial
  informacaopresencial: {
    destinatario: "ricardominascurta21@gmail.com",
    
    gerarAssunto: (processo) => {
      const nome = processo?.campos?.nomeCompleto || 'Nome não disponível';
      const documento = processo?.campos?.numeroDocumento || 'Documento não disponível';
      return `Informação sobre o seu processo (Presencial) - ${nome} - ${documento}`;
    },
    
    gerarCorpoEmail: (processo) => {
      const campos = processo?.campos || {};
      const nome = campos.nomeCompleto || '';
      const nacionalidade = campos.nacionalidade || '';
      const numeroDocumento = campos.numeroDocumento || '';
      const dataNascimento = campos.dataNascimento || '';
      const dataValidade = campos.dataValidade || '';
      
      return `Exmo(a). Sr(a). ${nome},

Em resposta ao seu pedido presencial de informação sobre o processo, informamos que:

- Nome: ${nome}
- Nacionalidade: ${nacionalidade}
- Número do Documento: ${numeroDocumento}
- Data de Nascimento: ${dataNascimento}
- Data de Validade: ${dataValidade}

O seu processo encontra-se em análise pelos nossos serviços.

Para mais informações, poderá dirigir-se aos nossos balcões de atendimento ou contactar-nos através dos canais oficiais.

Com os melhores cumprimentos,
AIMA`;
    }
  },

  // Template para Informação de Processo via Portal
  InformacaoPortal: {
    destinatario: "ricardominascurta21@gmail.com",
    
    gerarAssunto: (processo) => {
      const nome = processo?.campos?.nomeCompleto || 'Nome não disponível';
      const documento = processo?.campos?.numeroDocumento || 'Documento não disponível';
      return `INFORMAÇÃO DE PROCESSO PEDIDO DE TÍTULO DE RESIDÊNCIA - ${nome} - ${documento}`;
    },
    
    gerarCorpoEmail: (processo) => {
      const campos = processo?.campos || {};
      const nome = campos.nomeCompleto || '';
      const numeroDocumento = campos.numeroDocumento || '';
      const dataPedido = campos.dataPedido || '';
      const dataPagamento = campos.dataPagamento || '';
      const dataNascimento = campos.dataNascimento || '';
      const nacionalidade = campos.nacionalidade || '';
      const numeroProcesso = campos.numeroProcesso || '';
      const telefone = campos.telefone || '';
      
      return `<p>Exmos. Srs.,</p>

<p>Vimos por este meio, a pedido da(o) nosso(a) associado (a) ${nome},
solicitar informações relativas ao Título de Residência.</p>

<p>O mesmo fez o pedido do Título de Residência através do portal na opção 
"Renovação Automática" no dia ${dataPedido}, efetuou o pagamento em ${dataPagamento} e
ficou dado como concluído.</p>

<p>O senhor(a) reporta ainda que não recebeu nenhum papel dos CTT para
levantar a residência, assim como não recebeu o TR na sua morada.</p>

<p>Seria possível obter alguma informação relativa onde se encontra o cartão do
mesmo, por favor?</p>

<p><strong>Nome completo:</strong> ${nome}<br>
<strong>Data de nascimento:</strong> ${dataNascimento}<br>
<strong>Nacionalidade:</strong> ${nacionalidade}<br>
<strong>PROCESSO:</strong> ${numeroProcesso}<br>
<strong>Telefone:</strong> ${telefone}<br>
<strong>Delegação onde fez a residência:</strong> PORTAL SEF/AIMA</p>

<p>Com os melhores cumprimentos,<br>
Cecília Minascurta.</p>`;
    }
  },

  // Template para Informação de Processo Presencial
  InformacaoPresencial: {
    destinatario: "ricardominascurta21@gmail.com",
    
    gerarAssunto: (processo) => {
      const nome = processo?.campos?.nomeCompleto || 'Nome não disponível';
      const documento = processo?.campos?.numeroDocumento || 'Documento não disponível';
      return `INFORMAÇÃO DE PROCESSO PEDIDO DE TÍTULO DE RESIDÊNCIA - ${nome} - ${documento}`;
    },
    
    gerarCorpoEmail: (processo) => {
      const campos = processo?.campos || {};
      const nome = campos.nomeCompleto || '';
      const numeroDocumento = campos.numeroDocumento || '';
      const dataPedido = campos.dataPedido || '';
      const valorPagamento = campos.valorPagamento || '';
      const dataNascimento = campos.dataNascimento || '';
      const nacionalidade = campos.nacionalidade || '';
      const numeroProcesso = campos.numeroProcesso || '';
      const telefone = campos.telefone || '';
      const delegacao = campos.delegacao || '';
      
      return `<p>Exmos. Srs.,</p>

<p>Vimos por este meio, a pedido da nossa associada (${nome}), solicitar
informações relativas à renovação do Título de Residência.</p>

<p>No dia ${dataPedido}, a mesma fez o pedido, efetuou o pagamento de €${valorPagamento} e o 
processo ficou dado como concluído.</p>

<p>O(a) senhor(a) reporta ainda que não recebeu nenhum papel dos CTT para
levantar a residência, assim como não recebeu o T.R. na sua morada.</p>

<p>Seria possível obter alguma informação relativa onde se encontra o cartão do
mesmo, por favor?</p>

<p><strong>Nome completo:</strong> ${nome}<br>
<strong>Data de nascimento:</strong> ${dataNascimento}<br>
<strong>Nacionalidade:</strong> ${nacionalidade}<br>
<strong>PROCESSO Nº:</strong> ${numeroProcesso}<br>
<strong>Telefone:</strong> ${telefone}<br>
<strong>Delegação onde fez a residência:</strong> ${delegacao}</p>

<p>Com os melhores cumprimentos,<br>
Cecília Minascurta.</p>`;
    }
  },

  // Template para Concessão TR Normal
  ConcessaoTR: {
    // Destinatário padrão
    destinatario: "ricardominascurta21@gmail.com",
    
    // Função para gerar o assunto do e-mail
    gerarAssunto: (processo) => {
      const nome = processo?.campos?.nomeCompleto || 'Nome não disponível';
      const documento = processo?.campos?.numeroDocumento || 'Documento não disponível';
      return `Concessão TR - ${nome} - ${documento}`;
    },
    
    // Função para gerar o corpo do e-mail com a tabela preenchida
    gerarCorpoEmail: (processo) => {
      // Extrair os dados necessários do processo
      const campos = processo?.campos || {};
      const nome = campos.nomeCompleto || '';
      const dataNascimento = campos.dataNascimento || '';
      const nacionalidade = campos.nacionalidade || '';
      const numeroDocumento = campos.numeroDocumento || '';
      const dataValidade = campos.dataValidade || '';
      
      // Motivo do pedido específico para este tipo de processo
      const motivoPedido = "Concessão TR";
      
      // Observações específicas para este tipo de processo
      const observacoes = `Validade: ${dataValidade}<br><br>Concessão TR`;
      
      // Definindo estilos CSS robustos para garantir a formatação correta
      const tableStyle = 'width: 440px; border-collapse: collapse; border: 2px solid black; table-layout: fixed; max-width: 440px; margin: 0;';
      const headerCellStyle = 'border: 1px solid black; padding: 7px; font-weight: bold; text-align: center; background-color: #d4e5f7; width: 100%; color: #000000; height: 95%;';
      const labelCellStyle = 'width: 35%; border: 1px solid black; padding: 7px; background-color: white; font-weight: normal; text-align: left; vertical-align: top; color: #000000; height: 95%;';
      const valueCellStyle = 'width: 65%; border: 1px solid black; padding: 7px; background-color: white; font-weight: normal; text-align: left; vertical-align: top; color: #000000; height: 95%;';
      const observacoesCellStyle = 'border: 1px solid black; padding: 7px; height: 57px; vertical-align: top; background-color: white; min-height: 57px; color: #000000;';
      
      // Usando o HTML com estilos robustos para garantir a formatação em clientes de email
      return `
    <div style="max-width: 640px; margin: 0; font-family: Arial, sans-serif; color: #000000;">
    <table style="${tableStyle}">
      <tbody>
        <tr>
          <td colspan="2" style="${headerCellStyle}">
            Pedido de Agendamento SEF/CC
          </td>
        </tr>
        <tr>
          <td style="${labelCellStyle}">
            Motivo do Pedido<br>de Agendamento
          </td>
          <td style="${valueCellStyle}">
            ${motivoPedido}
          </td>
        </tr>
        <tr>
          <td style="${labelCellStyle}">
            Nome Completo
          </td>
          <td style="${valueCellStyle}">
            ${nome}
          </td>
        </tr>
        <tr>
          <td style="${labelCellStyle}">
            Data de Nascimento
          </td>
          <td style="${valueCellStyle}">
            ${dataNascimento}
          </td>
        </tr>
        <tr>
          <td style="${labelCellStyle}">
            Nacionalidade
          </td>
          <td style="${valueCellStyle}">
            ${nacionalidade}
          </td>
        </tr>
        <tr>
          <td style="${labelCellStyle}">
            TR / CR / Visto
          </td>
          <td style="${valueCellStyle}">
            ${numeroDocumento}
          </td>
        </tr>
        <tr>
          <td style="${labelCellStyle}"></td>
          <td style="${valueCellStyle}"></td>
        </tr>
        <tr>
          <td style="${labelCellStyle}">
            Área de Residência
          </td>
          <td style="${valueCellStyle}">
            
          </td>
        </tr>
        <tr>
          <td style="${labelCellStyle}">
            Contacto
          </td>
          <td style="${valueCellStyle}">
            
          </td>
        </tr>
        <tr>
          <td style="${labelCellStyle}">
            E-mail
          </td>
          <td style="${valueCellStyle}">
            
          </td>
        </tr>
        <tr>
          <td style="${labelCellStyle}">
            Posto de Atendimento do<br>SEF preferencial
          </td>
          <td style="${valueCellStyle}">
            
          </td>
        </tr>
        <tr>
          <td style="${labelCellStyle}">
            Observações
          </td>
          <td style="${observacoesCellStyle}">
            ${observacoes}
          </td>
        </tr>
        <tr>
          <td style="${labelCellStyle}">
            Data do Agendamento (a<br>preencher pelo SEF/CC)
          </td>
          <td style="${valueCellStyle}">
            <p style="text-align: right; color: #000000; margin: 0;">Motivo</p>
            <p style="text-align: right; color: #000000; margin: 0;">Local</p>
            <p style="text-align: right; color: #000000; margin: 0;">Data e Hora</p>
          </td>
        </tr>
        <tr>
          <td style="${labelCellStyle}">
            Observações SEF/CC
          </td>
          <td style="${observacoesCellStyle}"></td>
        </tr>
      </tbody>
    </table>
    </div>`;
    }
  }
};

export default emailTemplates; 