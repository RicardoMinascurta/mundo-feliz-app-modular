// src/config/emailTemplates/reagrupamento.js
// Templates de e-mail para processos de reagrupamento familiar

const reagrupamentoTemplates = {
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
      
      // Usando o HTML exato da tabela original
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
    <p>&nbsp;</p>`;
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
      
      // HTML da tabela foi implementado
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
    <p>&nbsp;</p>`;
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
      
      // HTML da tabela foi implementado
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
    <p>&nbsp;</p>`;
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
      const parentescoReagrupada = campos.pessoaReagrupada?.parentesco || 'Filho/Filha';
      
      // Dados da pessoa que reagrupa (pai/mãe)
      const nomePessoaQueRegrupa = campos.pessoaQueRegrupa?.nomeCompleto || '';
      const dataNascimentoQueRegrupa = campos.pessoaQueRegrupa?.dataNascimento || '';
      const nacionalidadeQueRegrupa = campos.pessoaQueRegrupa?.nacionalidade || '';
      const numeroDocumentoQueRegrupa = campos.pessoaQueRegrupa?.numeroDocumento || '';
      const tipoDocumento = campos.pessoaQueRegrupa?.tipoDocumento || 'TR';
      const parentescoQueRegrupa = campos.pessoaQueRegrupa?.parentesco || 'Pai/Mãe';
      
      // Definir o título do documento com base no tipo selecionado
      const tituloDocumento = tipoDocumento === 'CC' ? 'Cartão de Cidadão' : 'Título de Residência';
      
      // Definir o título dos dados com base no parentesco
      const tituloParentesco = parentescoReagrupada.includes('Filho') ? 'Dados filho' : 'Dados filha';
      
      // Motivo do pedido específico para este tipo de processo
      const motivoPedido = `REAGRUPAMENTO FAMILIAR - ${parentescoQueRegrupa.toUpperCase()} PARA ${parentescoReagrupada.toUpperCase()} COM ${tituloDocumento.toUpperCase()}`;
      
      // HTML da tabela foi implementado
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
            <p>Dados ${parentescoQueRegrupa.toLowerCase()}:</p>
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
    <p>&nbsp;</p>`;
    }
  }
};

export default reagrupamentoTemplates; 