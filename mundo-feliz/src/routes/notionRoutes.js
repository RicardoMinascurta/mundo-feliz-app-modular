// src/routes/notionRoutes.js
import express from 'express';
import { Client } from '@notionhq/client';
import { databaseIds } from '../config/notionConfig.js';
import logger from '../services/LoggerService.js';

const router = express.Router();

// Configuração do cliente Notion
const notion = new Client({
    auth: process.env.NOTION_API_KEY || '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'
});

// Rota para pesquisa no Notion
router.post('/notion/search', async (req, res) => {
    try {
        const { query, databaseIds } = req.body;
        
        if (!query || !databaseIds || !Array.isArray(databaseIds)) {
            return res.status(400).json({ 
                error: 'Parâmetros inválidos. Query e databaseIds são obrigatórios.' 
            });
        }

        const results = [];
        
        // Pesquisar em todas as bases de dados
        for (const databaseId of databaseIds) {
            try {
                const response = await notion.databases.query({
                    database_id: databaseId,
                    filter: {
                        property: 'Nome',
                        rich_text: {
                            contains: query
                        }
                    }
                });

                // Adicionar o ID da base de dados a cada resultado
                const processedResults = response.results.map(page => ({
                    id: page.id,
                    name: page.properties.Nome?.title?.[0]?.plain_text || 'Sem nome',
                    properties: page.properties,
                    databaseId: databaseId
                }));

                results.push(...processedResults);
            } catch (error) {
                logger.error(`Erro ao pesquisar na base ${databaseId}:`, error);
                // Continuar com a próxima base mesmo se houver erro
                continue;
            }
        }

        res.json({ results });
    } catch (error) {
        logger.error('Erro na pesquisa do Notion:', error);
        res.status(500).json({ 
            error: 'Erro ao realizar a pesquisa',
            details: error.message 
        });
    }
});

// Rota para obter detalhes de uma página
router.get('/notion/page/:pageId', async (req, res) => {
    try {
        const { pageId } = req.params;
        
        if (!pageId) {
            return res.status(400).json({ error: 'ID da página é obrigatório' });
        }

        const page = await notion.pages.retrieve({ page_id: pageId });
        
        // Formatar a resposta
        const formattedPage = {
            id: page.id,
            url: page.url,
            properties: {}
        };

        // Processar propriedades
        Object.entries(page.properties).forEach(([key, value]) => {
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
        logger.error(`Erro ao obter página ${req.params.pageId}:`, error);
        res.status(500).json({ 
            error: 'Erro ao obter detalhes da página',
            details: error.message 
        });
    }
});

export default router; 