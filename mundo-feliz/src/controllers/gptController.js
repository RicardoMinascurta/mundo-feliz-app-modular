import fs from 'fs';
import path from 'path';
import logger from '../services/LoggerService.js';
import { promptService } from '../services/PromptService.js';

const gptLogger = logger.createComponentLogger('GPT-Controller');

/**
 * Extrai estrutura de dados a partir de texto usando GPT
 * @param {Object} req - Objeto de requisição Express
 * @param {Object} res - Objeto de resposta Express
 */
export const extractStructuredData = async (req, res) => {
  try {
    const { text, category, processType, processId, prompt } = req.body;
    
    if (!text || !processType) {
      gptLogger.error('❌ API GPT - Parâmetros incompletos');
      return res.status(400).json({
        success: false,
        error: 'Texto e tipo de processo são obrigatórios'
      });
    }
    
    // Mapeamento de tipos de processo para categorias de template
    const processToTemplateCategory = {
      // Concessão
      'TR': 'concessao',
      'TRNovo': 'concessao',
      'TREstudante': 'concessao',
      'TREstudante2': 'concessao',
      'TREstudanteMenor': 'concessao',
      'ConcessaoTR': 'concessao',
      'ConcessaoTRNovo': 'concessao',
      'ConcessaoTREstudante': 'concessao',
      'ConcessaoTREstudante2': 'concessao',
      'ConcessaoTREstudanteMenor': 'concessao',
      
      // Reagrupamento (usa templates de concessão)
      'ReagrupamentoConjuge': 'concessao',
      'ReagrupamentoFilho': 'concessao',
      'ReagrupamentoPaiIdoso': 'concessao',
      'ReagrupamentoTutor': 'concessao',
      'ReagrupamentoPaiMaeFora': 'concessao',
      
      // CPLP
      'CPLPMaiores': 'cplp',
      'CPLPMenor': 'cplp',
      
      // Renovação
      'RenovacaoEstudanteSuperior': 'renovacao',
      'RenovacaoEstudanteSecundario': 'renovacao',
      'RenovacaoTratamentoMedico': 'renovacao',
      'RenovacaoNaoTemEstatuto': 'renovacao',
      'RenovacaoUniaoEuropeia': 'renovacao',
      'RenovacaoTitulo': 'renovacao',
      'RenovacaoEstatuto': 'renovacao',
      
      // Contagem de tempo
      'ContagemTempo': 'contagem',
      
      // Informação
      'InformacaoPortal': 'infoportal',
      'InfoPortal': 'infoportal',
      'InformacaoPresencial': 'informacao',
      'InfoPresencial': 'informacao',
      
      // Manifestação de interesse
      'ManifestacaoInteresse': 'manifestacao',
      
      // Alias para corrigir problemas específicos
      'c': 'cplp'
    };
    
    // Usar o mapeamento explícito de categoria ou o valor fornecido
    // Se category estiver vazio ou for inválido, usar o mapeamento
    let normalizedCategory = category;
    
    if (!category || category.trim() === '' || category === 'c' || category === 'unknown') {
      normalizedCategory = processToTemplateCategory[processType] || category || 'default';
      gptLogger.info(`🔄 API GPT - Categoria não fornecida ou inválida, usando mapeamento: ${normalizedCategory}`);
    }
    
    gptLogger.info(`🧠 API GPT - Processando texto para ${normalizedCategory}/${processType}, processo ${processId}`);
    
    // Analisar a estrutura do texto para log
    let textSummary = '';
    if (typeof text === 'string') {
      textSummary = `String com ${text.length} caracteres`;
    } else if (typeof text === 'object' && text !== null) {
      if (text._combinedText) {
        textSummary = `Objeto com texto combinado (${text._combinedText.length} caracteres) e ${Object.keys(text).length - 1} documentos`;
      } else {
        textSummary = `Objeto com ${Object.keys(text).length} documentos`;
      }
    }
    gptLogger.info(`📄 API GPT - Tipo de texto recebido: ${textSummary}`);
    
    // Verificar e formatar o texto adequadamente
    let textToProcess = '';
    
    if (typeof text === 'object' && text !== null) {
      // Se temos um texto combinado preparado, usar
      if (text._combinedText) {
        textToProcess = text._combinedText;
      } else {
        // Criar formato correto manualmente
        textToProcess = Object.entries(text)
          .filter(([key]) => !key.startsWith('_')) // Ignorar campos com prefixo _
          .map(([docType, docText]) => `${docType}\n${docText}`).join('\n\n');
      }
    } else if (typeof text === 'string') {
      textToProcess = text;
    } else {
      return res.status(400).json({
        success: false,
        error: 'Formato de texto inválido'
      });
    }

    // Obter o template de prompt adequado
    let promptTemplate = null;
    if (prompt) {
      // Se um prompt personalizado foi fornecido, usar ele
      promptTemplate = prompt;
      gptLogger.info(`📝 API GPT - Usando prompt personalizado fornecido`);
    } else {
      // Caso contrário, tentar obter do sistema de templates
      try {
        promptTemplate = await promptService.getPromptTemplate(normalizedCategory, processType);
        if (promptTemplate) {
          gptLogger.info(`📝 API GPT - Template de prompt encontrado para ${normalizedCategory}/${processType}`);
        } else {
          gptLogger.warn(`⚠️ API GPT - Nenhum template de prompt encontrado para ${normalizedCategory}/${processType}`);
          // Usar um prompt genérico
          promptTemplate = "Extraia as informações mais importantes deste documento.";
        }
      } catch (templateError) {
        gptLogger.error(`❌ API GPT - Erro ao obter template:`, templateError);
        promptTemplate = "Extraia as informações mais importantes deste documento.";
      }
    }

    // Configurar a chamada para a API da OpenAI
    gptLogger.info(`🔄 API GPT - Enviando para processamento usando OpenAI...`);
    
    // Verificar se temos uma chave API configurada
    const OPENAI_API_KEY = process.env.OPENAI_API_KEY || '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';
    const MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini';
    
    if (!OPENAI_API_KEY) {
      throw new Error('API key da OpenAI não configurada');
    }
    
    // Preparar prompt e contexto
    const systemPrompt = promptTemplate.system || promptTemplate;
    const userPrompt = textToProcess;
    
    // LOG DETALHADO DO PROMPT E TEXTO EXTRAÍDO
    gptLogger.info('=== DETALHES COMPLETOS DO ENVIO PARA GPT ===');
    gptLogger.info('== PROMPT SYSTEM ==');
    gptLogger.info(systemPrompt);
    gptLogger.info('== TEXTO EXTRAÍDO PELO AZURE (ENVIADO COMO USER PROMPT) ==');
    gptLogger.info(userPrompt);
    gptLogger.info('=== FIM DOS DETALHES ===');
    
    // Fazer a chamada para a API da OpenAI
    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.2
      })
    });
    
    if (!openaiResponse.ok) {
      const errorData = await openaiResponse.json();
      gptLogger.error(`❌ API GPT - Erro na API OpenAI:`, errorData);
      throw new Error(`Erro na API OpenAI: ${errorData.error?.message || 'Erro desconhecido'}`);
    }
    
    const openaiData = await openaiResponse.json();
    
    // Extrair e analisar a resposta
    let responseContent = openaiData.choices[0]?.message?.content;
    let gptResponseData = null;
    
    // Tentar extrair JSON da resposta
    try {
      // Verificar se a resposta é um objeto JSON diretamente
      gptResponseData = JSON.parse(responseContent);
      gptLogger.info(`✅ API GPT - Resposta JSON válida recebida`);
    } catch (jsonError) {
      // Tentar extrair JSON da string usando regex
      gptLogger.warn(`⚠️ API GPT - Erro ao analisar JSON direto, tentando extrair bloco JSON...`);
      
      const jsonMatch = responseContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          gptResponseData = JSON.parse(jsonMatch[0]);
          gptLogger.info(`✅ API GPT - JSON extraído com sucesso da resposta`);
        } catch (innerJsonError) {
          gptLogger.error(`❌ API GPT - Erro ao analisar JSON extraído:`, innerJsonError);
          throw new Error('Formato de resposta inválido da OpenAI');
        }
      } else {
        gptLogger.error(`❌ API GPT - Nenhum JSON encontrado na resposta`);
        throw new Error('Formato de resposta inválido da OpenAI');
      }
    }
    
    // Criar objeto de resposta no formato esperado
    const gptResponse = {
      success: true,
      data: gptResponseData,
      rawResponse: openaiData,
      promptUsed: systemPrompt
    };
    
    // Função auxiliar para validar resposta do GPT
    function validateGptResponse(data, requiredFields) {
      if (!data || typeof data !== 'object') {
        return { valid: false, reason: 'Dados inválidos', missingFields: [] };
      }
      
      if (requiredFields.length === 0) {
        return { valid: true, reason: 'Sem validação', missingFields: [] };
      }
      
      const missingFields = [];
      
      for (const field of requiredFields) {
        if (field.includes('.')) {
          // Campo aninhado
          const [parent, child] = field.split('.');
          if (!data[parent] || data[parent][child] === undefined) {
            missingFields.push(field);
          }
        } else if (data[field] === undefined) {
          missingFields.push(field);
        }
      }
      
      return {
        valid: missingFields.length === 0,
        reason: missingFields.length > 0 ? 'Campos obrigatórios faltando' : 'OK',
        missingFields
      };
    }

    // Validar a resposta do GPT usando os campos obrigatórios do template
    const requiredFields = promptTemplate.requiredFields || [];
    const validationResult = validateGptResponse(gptResponse.data, requiredFields);
    gptResponse.validation = validationResult;
    
    if (!validationResult.valid) {
      gptLogger.warn(`⚠️ API GPT - Resposta inválida: ${validationResult.reason}`);
      gptLogger.warn(`⚠️ API GPT - Campos faltantes: ${validationResult.missingFields.join(', ')}`);
    }
    
    // Salvar os dados extraídos no registro do processo
    if (processId && gptResponse.success) {
      try {
        const DATA_FILE = process.env.DATA_FILE || path.join(process.cwd(), 'data', 'processos.json');
        let processos = [];
        let processoEncontrado = false;
        
        if (fs.existsSync(DATA_FILE)) {
          const fileContent = fs.readFileSync(DATA_FILE, 'utf8');
          processos = JSON.parse(fileContent);
          
          // Encontrar o processo pelo ID
          const index = processos.findIndex(p => p.processId === processId);
          
          if (index !== -1) {
            processoEncontrado = true;
            
            // Inicializar campos.documentos se não existir
            if (!processos[index].campos) {
              processos[index].campos = {};
            }
            
            if (!processos[index].campos.documentos) {
              processos[index].campos.documentos = {};
            }
            
            // Adicionar ou atualizar as informações extraídas
            processos[index].campos.documentos = {
              ...processos[index].campos.documentos,
              ...gptResponse.data
            };
            
            // Atualizar o timestamp de última atualização
            if (processos[index].timestamps) {
              processos[index].timestamps.ultimaAtualizacao = new Date().toISOString();
            }
            
            gptLogger.info(`✅ API GPT - Processo ${processId} atualizado com dados extraídos`);
            
            // Salvar as alterações
            fs.writeFileSync(DATA_FILE, JSON.stringify(processos, null, 2));
          }
        }
        
        if (!processoEncontrado) {
          gptLogger.warn(`⚠️ API GPT - Processo ${processId} não encontrado para salvar dados`);
        }
      } catch (saveError) {
        gptLogger.error(`❌ API GPT - Erro ao salvar dados extraídos: ${saveError.message}`);
      }
    }
    
    // Retornar a resposta para o cliente
    res.json(gptResponse);
    
  } catch (error) {
    gptLogger.error(`❌ API GPT - Erro no processamento: ${error.message}`);
    
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

export default {
  extractStructuredData
}; 