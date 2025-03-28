import React, { useEffect, forwardRef, useImperativeHandle } from 'react';
import './EditorSimples.css';

const EditorSimples = forwardRef((props, ref) => {
  const editorRef = React.useRef(null);

  useEffect(() => {
    if (editorRef.current) {
      // Inicializar o editor com a tabela SEF
      editorRef.current.innerHTML = gerarTabelaSEF();
    }
  }, []);

  // Expõe o innerHTML para o componente pai através da ref
  useImperativeHandle(ref, () => ({
    get innerHTML() {
      return editorRef.current ? editorRef.current.innerHTML : '';
    },
    set innerHTML(value) {
      if (editorRef.current) {
        editorRef.current.innerHTML = value;
      }
    }
  }));

  // Função para gerar a tabela do formulário SEF
  const gerarTabelaSEF = () => {
    return `
    <div style="max-width: 500px; margin: 0; text-align: left;">
    <table style="border-collapse: collapse; width: 480px; max-width: 480px; color: #000000; margin: 0; table-layout: fixed; float: left;" data-template="estudante">
      <tbody>
        <tr>
          <td style="width: 30%; border: 1px solid black; padding: 7px; background-color: #d4e5f7; color: #000000; font-weight: bold;" colspan="2">
            Pedido de Agendamento (SEF/CC)
          </td>
        </tr>
        <tr>
          <td style="width: 30%; border: 1px solid black; padding: 7px; background-color: white; color: #000000; text-align: left; height: 95%;">
            Nome Completo
          </td>
          <td style="width: 70%; border: 1px solid black; padding: 7px; background-color: white; color: #000000; text-align: left; height: 95%;">
            
          </td>
        </tr>
        <tr>
          <td style="width: 30%; border: 1px solid black; padding: 7px; background-color: white; color: #000000; text-align: left; height: 95%;">
            Data de Nascimento
          </td>
          <td style="width: 70%; border: 1px solid black; padding: 7px; background-color: white; color: #000000; text-align: left; height: 95%;">
            
          </td>
        </tr>
        <tr>
          <td style="width: 30%; border: 1px solid black; padding: 7px; background-color: white; color: #000000; text-align: left; height: 95%;">
            Nacionalidade
          </td>
          <td style="width: 70%; border: 1px solid black; padding: 7px; background-color: white; color: #000000; text-align: left; height: 95%;">
            
          </td>
        </tr>
        <tr>
          <td style="width: 30%; border: 1px solid black; padding: 7px; background-color: white; color: #000000; text-align: left; height: 95%;">
            TR / CR / Visto
          </td>
          <td style="width: 70%; border: 1px solid black; padding: 7px; background-color: white; color: #000000; text-align: left; height: 95%;">
            
          </td>
        </tr>
        <tr>
          <td style="width: 30%; border: 1px solid black; padding: 7px; background-color: white; color: #000000; text-align: left; height: 95%;"></td>
          <td style="width: 70%; border: 1px solid black; padding: 7px; background-color: white; color: #000000; text-align: left; height: 95%;"></td>
        </tr>
        <tr>
          <td style="width: 30%; border: 1px solid black; padding: 7px; background-color: white; color: #000000; text-align: left; height: 95%;">
            Área de Residência
          </td>
          <td style="width: 70%; border: 1px solid black; padding: 7px; background-color: white; color: #000000; text-align: left; height: 95%;">
            
          </td>
        </tr>
        <tr>
          <td style="width: 30%; border: 1px solid black; padding: 7px; background-color: white; color: #000000; text-align: left; height: 95%;">
            Contacto
          </td>
          <td style="width: 70%; border: 1px solid black; padding: 7px; background-color: white; color: #000000; text-align: left; height: 95%;">
            
          </td>
        </tr>
        <tr>
          <td style="width: 30%; border: 1px solid black; padding: 7px; background-color: white; color: #000000; text-align: left; height: 95%;">
            E-mail
          </td>
          <td style="width: 70%; border: 1px solid black; padding: 7px; background-color: white; color: #000000; text-align: left; height: 95%;">
            
          </td>
        </tr>
        <tr>
          <td style="width: 30%; border: 1px solid black; padding: 7px; background-color: white; color: #000000; text-align: left; height: 95%;">
            Posto de Atendimento do<br>SEF preferencial
          </td>
          <td style="width: 70%; border: 1px solid black; padding: 7px; background-color: white; color: #000000; text-align: left; height: 95%;">
            
          </td>
        </tr>
        <tr>
          <td style="width: 30%; border: 1px solid black; padding: 7px; vertical-align: top; background-color: white; color: #000000; text-align: left; height: 95%;">
            Observações
          </td>
          <td style="width: 70%; border: 1px solid black; padding: 7px; height: 57px; vertical-align: top; background-color: white; color: #000000; text-align: left;">
            
          </td>
        </tr>
        <tr>
          <td style="width: 30%; border: 1px solid black; padding: 7px; vertical-align: top; background-color: white; color: #000000; text-align: left; height: 95%;">
            Data do Agendamento (a<br>preencher pelo SEF/CC)
          </td>
          <td style="width: 70%; border: 1px solid black; padding: 7px; vertical-align: top; background-color: white; color: #000000; height: 95%;">
            <p style="text-align: right; color: #000000; margin: 0;">Motivo</p>
            <p style="text-align: right; color: #000000; margin: 0;">Local</p>
            <p style="text-align: right; color: #000000; margin: 0;">Data e Hora</p>
          </td>
        </tr>
        <tr>
          <td style="width: 30%; border: 1px solid black; padding: 7px; vertical-align: top; background-color: white; color: #000000; text-align: left; height: 95%;">
            Observações SEF/CC
          </td>
          <td style="width: 70%; border: 1px solid black; padding: 7px; height: 38px; vertical-align: top; background-color: white; color: #000000; text-align: left;"></td>
        </tr>
      </tbody>
    </table>
    <div style="clear: both;"></div>
    </div>
    <p>&nbsp;</p>
    <p>&nbsp;</p>
    `;
  };

  return (
    <div 
      ref={editorRef}
      className="editor-simples"
      contentEditable={true}
      spellCheck="true"
    ></div>
  );
});

export default EditorSimples; 