// src/config/emailTemplates/concessao.js
// Templates de e-mail para processos de concessão de títulos

const concessaoTemplates = {
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
    <p>&nbsp;</p>`;
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
    <p>&nbsp;</p>`;
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
      return `CONCESSAO TITULO ESTUDANTE - ${nome} - ${documento}`;
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
      const motivoPedido = "CONCESSÃO T.R. ESTUDANTE";
      
      // Observações específicas para este tipo de processo - Ensino Superior
      const observacoes = `ENSINO SUPERIOR`;
      
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
    <p>&nbsp;</p>`;
    }
  }
};

export default concessaoTemplates; 