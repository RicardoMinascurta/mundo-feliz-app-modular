// Função de template para o email com tabela SEF
export const getEmailTemplate = (tipoProcesso, processo) => {
  // Função útil para formatar tipos de processo
  const formatarTipoProcesso = (tipo) => {
    if (!tipo) return '';
    
    return tipo
      .replace(/([A-Z])/g, ' $1')  // Inserir espaço antes de maiúsculas
      .replace(/^./, (str) => str.toUpperCase());  // Primeira letra maiúscula
  };
  
  // Extrair dados do processo que podem ser usados no template
  const nomePessoa = processo?.campos?.nomeCompleto || 
                    processo?.campos?.pessoaReagrupada?.nomeCompleto || 
                    processo?.campos?.dados_do_menor?.nome_completo || 
                    'Nome do Solicitante';
  
  // Template padrão com tabela SEF vazia
  return `
    <p>&nbsp;</p>
    <table border="1" cellspacing="0" cellpadding="5" style="width: 100%; border-collapse: collapse; border: 2.25pt solid windowtext;">
      <tbody>
        <tr style="height: 22px;">
          <td colspan="2" align="center" style="border: 1px solid black; padding: 3px; font-weight: bold; text-align: center; background-color: #d4e5f7; font-size: 10pt;">
            Pedido de Agendamento SEF/CC
          </td>
        </tr>
        <tr style="height: 20px;">
          <td style="width: 30%; border: 1px solid black; padding: 5px; background-color: white; font-size: 10pt;">
            Motivo do Pedido<br>de Agendamento
          </td>
          <td style="border: 1px solid black; padding: 5px; background-color: white;">
            
          </td>
        </tr>
        <tr style="height: 20px;">
          <td style="border: 1px solid black; padding: 5px; background-color: white; font-size: 10pt;">
            Nome Completo
          </td>
          <td style="border: 1px solid black; padding: 5px; background-color: white;">
            
          </td>
        </tr>
        <tr style="height: 20px;">
          <td style="border: 1px solid black; padding: 5px; background-color: white; font-size: 10pt;">
            Data de Nascimento
          </td>
          <td style="border: 1px solid black; padding: 5px; background-color: white;">
            
          </td>
        </tr>
        <tr style="height: 20px;">
          <td style="border: 1px solid black; padding: 5px; background-color: white; font-size: 10pt;">
            Nacionalidade
          </td>
          <td style="border: 1px solid black; padding: 5px; background-color: white;">
            
          </td>
        </tr>
        <tr style="height: 20px;">
          <td style="border: 1px solid black; padding: 5px; background-color: white; font-size: 10pt;">
            TR / CR / Visto
          </td>
          <td style="border: 1px solid black; padding: 5px; background-color: white;">
            
          </td>
        </tr>
        <tr style="height: 20px;">
          <td style="border: 1px solid black; padding: 5px; background-color: white; font-size: 10pt;"></td>
          <td style="border: 1px solid black; padding: 5px; background-color: white;">
            
          </td>
        </tr>
        <tr style="height: 20px;">
          <td style="border: 1px solid black; padding: 5px; background-color: white; font-size: 10pt;">
            Área de Residência
          </td>
          <td style="border: 1px solid black; padding: 5px; background-color: white;">
            
          </td>
        </tr>
        <tr style="height: 20px;">
          <td style="border: 1px solid black; padding: 5px; background-color: white; font-size: 10pt;">
            Contacto
          </td>
          <td style="border: 1px solid black; padding: 5px; background-color: white;">
            
          </td>
        </tr>
        <tr style="height: 20px;">
          <td style="border: 1px solid black; padding: 5px; background-color: white; font-size: 10pt;">
            E-mail
          </td>
          <td style="border: 1px solid black; padding: 5px; background-color: white;">
            
          </td>
        </tr>
        <tr style="height: 20px;">
          <td style="border: 1px solid black; padding: 5px; background-color: white; font-size: 10pt;">
            Posto de Atendimento do<br>SEF preferencial
          </td>
          <td style="border: 1px solid black; padding: 5px; background-color: white;">
            
          </td>
        </tr>
        <tr>
          <td style="border: 1px solid black; padding: 5px; vertical-align: top; background-color: white; font-size: 10pt;">
            Observações
          </td>
          <td style="border: 1px solid black; padding: 5px; height: 60px; vertical-align: top; background-color: white;">
            
          </td>
        </tr>
        <tr>
          <td style="border: 1px solid black; padding: 5px; vertical-align: top; background-color: white; font-size: 10pt;">
            Data do Agendamento (a<br>preencher pelo SEF/CC)
          </td>
          <td style="border: 1px solid black; padding: 5px; vertical-align: top; text-align: right; background-color: white;">
            <p style="text-align: right; margin: 0; font-size: 10pt;">Motivo</p>
            <p style="text-align: right; margin: 0; font-size: 10pt;">Local</p>
            <p style="text-align: right; margin: 0; font-size: 10pt;">Data e Hora</p>
          </td>
        </tr>
        <tr>
          <td style="border: 1px solid black; padding: 5px; vertical-align: top; background-color: white; font-size: 10pt;">
            Observações SEF/CC
          </td>
          <td style="border: 1px solid black; padding: 5px; height: 40px; vertical-align: top; background-color: white;"></td>
        </tr>
      </tbody>
    </table>
    <p>&nbsp;</p>
    <p>-- Associação de Imigrantes Mundo Feliz Tel: 214 103 917 | 968 472 247 Email: geral.mundofeliz@gmail.com Website: mundofeliz.pt</p>
  `;
}; 