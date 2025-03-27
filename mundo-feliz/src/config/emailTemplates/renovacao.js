// src/config/emailTemplates/renovacao.js
// Templates de e-mail para processos de renovação

const renovacaoTemplates = {
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
  }
};

export default renovacaoTemplates; 