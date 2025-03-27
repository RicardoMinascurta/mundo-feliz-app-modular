# Usando o hook useProcessId

Este documento mostra como usar o hook `useProcessId` para gerenciar IDs de processo de forma consistente.

## Exemplo básico

```jsx
import React, { useEffect } from 'react';
import { useProcessId } from '../hooks/useProcessId';

const MeuComponente = () => {
  // Inicializar o hook com o tipo de processo
  const { 
    processId,          // ID atual do processo
    loading,            // Indicador de carregamento
    error,              // Mensagem de erro, se houver
    generateProcessId,  // Função para gerar um novo ID
    isValidFormat,      // Função para validar formato
    getCategory         // Função para extrair categoria
  } = useProcessId('CPLPMaiores');

  // Gerar ID ao montar o componente
  useEffect(() => {
    const init = async () => {
      // Isto gera um novo ID se necessário
      const id = await generateProcessId();
      console.log(`ID gerado: ${id}`);
    };
    
    init();
  }, []);

  // Verificar se um ID é válido
  const verificarId = (id) => {
    if (isValidFormat(id)) {
      console.log(`ID ${id} tem formato válido`);
    } else {
      console.log(`ID ${id} tem formato inválido`);
    }
  };

  // Extrair categoria do ID
  const mostrarCategoria = () => {
    const categoria = getCategory();
    console.log(`Categoria do processo: ${categoria}`);
  };

  return (
    <div>
      {loading ? (
        <p>Gerando ID...</p>
      ) : error ? (
        <p>Erro: {error}</p>
      ) : (
        <div>
          <p>ID do processo: {processId}</p>
          <button onClick={() => generateProcessId()}>Gerar novo ID</button>
          <button onClick={mostrarCategoria}>Mostrar categoria</button>
        </div>
      )}
    </div>
  );
};

export default MeuComponente;
```

## Usar com ID existente

```jsx
// Se você já tem um ID, pode inicializar o hook com ele
const { processId } = useProcessId('TipoProcesso', 'TipoProcesso-m8lq12z-a1b2c3d4');
```

## Modificar para outro componente

Você pode alterar o componente existente assim:

```jsx
// Antes
const gerarProcessId = async () => {
  // Verificar se o ID atual existe e se está no formato correto
  const formatoValido = processId && /^[A-Za-z]+-\d+-[0-9a-f]+$/.test(processId);
  
  if (!formatoValido) {
    if (processId) {
      console.log(`ID de processo existente com formato incorreto: ${processId}`);
    }
    console.log('Tentando gerar novo ID com formato correto...');
    
    try {
      const response = await fetch('/api/gerar-processid', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ tipoProcesso: 'ContagemTempo' }),
      });
      
      // Resto do código...
    } catch (error) {
      // Tratamento de erro...
    }
  }
  
  return processId;
};

// Depois, com useProcessId
import { useProcessId } from '../hooks/useProcessId';

// No componente
const { processId, generateProcessId, loading, error } = useProcessId('ContagemTempo', existingId);

// Usar generateProcessId diretamente
useEffect(() => {
  const initProcess = async () => {
    const validId = await generateProcessId();
    if (validId) {
      console.log(`Processo inicializado com ID: ${validId}`);
    }
  };
  
  initProcess();
}, []);
``` 