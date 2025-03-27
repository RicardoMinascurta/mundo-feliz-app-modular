import express from 'express';
import { Client } from '@notionhq/client';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { enviarEmail } from './emailService.js';
import fs from 'fs';

// Configuração do ambiente
dotenv.config();
const app = express();
const PORT = process.env.PORT || 3001;

// Configuração do CORS
app.use(cors());
app.use(express.json());

// Cliente do Notion
const notion = new Client({
  auth: process.env.NOTION_API_KEY
});

// Cache para resultados recentes
const searchCache = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos

// Função para limpar cache expirado
const cleanupCache = () => {
  const now = Date.now();
  for (const [key, value] of searchCache.entries()) {
    if (now - value.timestamp > CACHE_DURATION) {
      searchCache.delete(key);
    }
  }
};

// Endpoint para pesquisar pessoas nas bases do Notion
app.post('/api/notion/search', async (req, res) => {
  try {
    const { query, databaseIds } = req.body;
    
    if (!query || query.trim() === '') {
      return res.json({ results: [] });
    }

    // Verificar cache
    const cacheKey = `${query}-${databaseIds.join(',')}`;
    const cachedResult = searchCache.get(cacheKey);
    if (cachedResult && Date.now() - cachedResult.timestamp < CACHE_DURATION) {
      return res.json({ results: cachedResult.data });
    }

    // Limpar cache expirado
    cleanupCache();

    // Realizar consultas em paralelo com timeout
    const searchPromises = databaseIds.map(async (databaseId) => {
      try {
        // Timeout de 10 segundos para cada consulta
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Timeout')), 10000);
        });

        const searchPromise = notion.databases.query({
          database_id: databaseId,
          filter: {
            property: 'Nome',
            rich_text: {
              contains: query
            }
          }
        });

        // Competição entre timeout e consulta
        const response = await Promise.race([searchPromise, timeoutPromise]);

        // Processar resultados de forma otimizada
        if (response.results?.length > 0) {
          return response.results.map(page => ({
            id: page.id,
            name: page.properties.Nome?.title?.[0]?.plain_text || 'Nome não encontrado',
            databaseId: databaseId,
            url: page.url,
            properties: page.properties
          }));
        }
        return [];
      } catch (error) {
        console.error(`Erro ao consultar base ${databaseId}:`, error);
        return []; // Retornar array vazio em caso de erro
      }
    });

    // Aguardar todas as consultas terminarem e combinar os resultados
    const resultsArrays = await Promise.all(searchPromises);
    const allResults = resultsArrays.flat();

    // Ordenar resultados por relevância (nome mais próximo da query)
    allResults.sort((a, b) => {
      const aMatch = a.name.toLowerCase().includes(query.toLowerCase());
      const bMatch = b.name.toLowerCase().includes(query.toLowerCase());
      if (aMatch && !bMatch) return -1;
      if (!aMatch && bMatch) return 1;
      return 0;
    });

    // Salvar no cache
    searchCache.set(cacheKey, {
      data: allResults,
      timestamp: Date.now()
    });
    
    res.json({ results: allResults });
  } catch (error) {
    console.error('Erro ao pesquisar pessoas:', error);
    res.status(500).json({ error: 'Erro ao pesquisar pessoas' });
  }
});

// Endpoint para obter detalhes de uma página
app.get('/api/notion/page/:pageId', async (req, res) => {
  try {
    const { pageId } = req.params;
    
    const response = await notion.pages.retrieve({ page_id: pageId });
    
    // Formatar propriedades para objeto simples
    const formattedPage = {
      id: response.id,
      url: response.url,
      properties: {}
    };

    // Percorrer propriedades
    Object.entries(response.properties).forEach(([key, value]) => {
      switch (value.type) {
        case 'title':
          formattedPage.properties[key] = value.title.map(t => t.plain_text).join('');
          break;
        case 'rich_text':
          formattedPage.properties[key] = value.rich_text.map(t => t.plain_text).join('');
          break;
        case 'select':
          formattedPage.properties[key] = value.select?.name || null;
          break;
        case 'multi_select':
          formattedPage.properties[key] = value.multi_select.map(s => s.name);
          break;
        case 'date':
          formattedPage.properties[key] = value.date?.start || null;
          break;
        case 'number':
          formattedPage.properties[key] = value.number;
          break;
        case 'checkbox':
          formattedPage.properties[key] = value.checkbox;
          break;
        default:
          formattedPage.properties[key] = null;
      }
    });

    res.json(formattedPage);
  } catch (error) {
    console.error(`Erro ao obter página ${req.params.pageId}:`, error);
    res.status(500).json({ error: 'Erro ao obter detalhes da página' });
  }
});

// Endpoint para enviar emails
app.post('/api/email/send', async (req, res) => {
  try {
    const { to, subject, html, cc, bcc } = req.body;
    
    // Validação básica dos campos obrigatórios
    if (!to || !subject || !html) {
      return res.status(400).json({ 
        success: false, 
        message: 'Os campos "to", "subject" e "html" são obrigatórios' 
      });
    }
    
    // Enviar email usando o serviço de email
    const resultado = await enviarEmail({ to, subject, html, cc, bcc });
    
    if (resultado.success) {
      return res.status(200).json(resultado);
    } else {
      return res.status(500).json(resultado);
    }
  } catch (error) {
    console.error('Erro no endpoint de envio de email:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erro interno ao processar o envio do email',
      error: error.message
    });
  }
});

// Endpoint para salvar dados do processo
app.post('/api/save-processo', async (req, res) => {
  try {
    const dadosProcesso = req.body;
    console.log('Dados do processo recebidos:', dadosProcesso);

    // Validar dados obrigatórios
    if (!dadosProcesso.processId || !dadosProcesso.tipoProcesso) {
      return res.status(400).json({
        success: false,
        message: 'processId e tipoProcesso são obrigatórios'
      });
    }

    // Ler o arquivo de processos existente
    const processosPath = path.join(process.cwd(), 'data', 'processos.json');
    let processos = [];
    try {
      const fileContent = await fs.promises.readFile(processosPath, 'utf8');
      processos = JSON.parse(fileContent);
    } catch (error) {
      // Se o arquivo não existir ou estiver vazio, começar com array vazio
      console.log('Criando novo arquivo de processos');
    }

    // Verificar se o processo já existe
    const processoIndex = processos.findIndex(p => p.processId === dadosProcesso.processId);
    
    if (processoIndex >= 0) {
      // Atualizar processo existente
      processos[processoIndex] = {
        ...processos[processoIndex],
        ...dadosProcesso,
        timestamps: {
          ...processos[processoIndex].timestamps,
          ultimaAtualizacao: new Date().toISOString()
        }
      };
    } else {
      // Adicionar novo processo
      processos.push({
        ...dadosProcesso,
        timestamps: {
          criacao: new Date().toISOString(),
          ultimaAtualizacao: new Date().toISOString()
        }
      });
    }

    // Salvar no arquivo
    await fs.promises.writeFile(processosPath, JSON.stringify(processos, null, 2));

    res.json({
      success: true,
      processId: dadosProcesso.processId,
      message: 'Processo atualizado com sucesso'
    });
  } catch (error) {
    console.error('Erro ao salvar processo:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao salvar processo',
      error: error.message
    });
  }
});

// Em produção, servir os arquivos estáticos do frontend
if (process.env.NODE_ENV === 'production') {
  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  const distPath = path.join(__dirname, '../dist');
  
  app.use(express.static(distPath));
  
  app.get('*', (req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
}); 