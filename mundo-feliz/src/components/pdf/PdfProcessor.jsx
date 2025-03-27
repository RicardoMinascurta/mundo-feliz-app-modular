import React, { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import AdultPdfProcessor from './AdultPdfProcessor';
import ChildPdfProcessor from './ChildPdfProcessor';
import { jsonData } from '../../services';
import { processoService, pdfService } from '../../services';
import { CircularProgress, Typography } from '@mui/material';

/**
 * Componente inteligente que determina o tipo de processo e utiliza o processador de PDF apropriado
 */
const PdfProcessor = ({ processId, personName, completePdfPath, onPdfProcessed, onError, pdfVersion, processo }) => {
  const [isMinor, setIsMinor] = useState(false);
  const [loading, setLoading] = useState(true);
  const [processedProcesso, setProcessedProcesso] = useState(null);
  const [childName, setChildName] = useState('');
  const [responsibleName, setResponsibleName] = useState('');
  const [dataValidade, setDataValidade] = useState('');
  const [dataValidadeResponsavel, setDataValidadeResponsavel] = useState('');
  const processedRef = useRef(false);
  const previousNameRef = useRef('');
  const prevChildNameRef = useRef('');
  const [pdfUrl, setPdfUrl] = useState(null);
  const [error, setError] = useState(null);

  // Buscar os dados do processo para extrair os nomes corretos
  useEffect(() => {
    async function fetchProcessData() {
      if (!processId) return;
      
      // Se já temos o processo via props, usá-lo diretamente
      if (processo) {
        console.log('PdfProcessor: Usando processo fornecido via props');
        const processType = processId.split('-')[0];
        const isMinor = pdfService.isMinorProcess(processType);
        setProcessedProcesso(processo);
        setIsMinor(isMinor);
        setLoading(false);
        return;
      }
      
      console.log('PdfProcessor: Buscando dados do processo', processId);
      
      try {
        const processData = await processoService.getProcessById(processId);
        if (!processData) {
          console.error('PdfProcessor: Processo não encontrado:', processId);
          return;
        }
        
        const processType = processId.split('-')[0];
        console.log('PdfProcessor: Tipo de processo identificado:', processType);
        
        const isMinor = pdfService.isMinorProcess(processType);
        console.log('PdfProcessor: É processo de menor?', isMinor);
        console.log(`PdfProcessor: VERIFICAÇÃO DE TIPO: ${processId} - Tipo Base: ${processType} - Menor: ${isMinor ? 'SIM ✅' : 'NÃO ❌'}`);
        
        // Verificar se é caso de menor ou adulto
        if (isMinor) {
          console.log('PdfProcessor: Processando dados de MENOR');
          console.log('PdfProcessor: DADOS COMPLETOS DO PROCESSO:', JSON.stringify(processData));
          
          // Extrair nome do menor e do responsável
          let childName = '';
          let responsibleName = '';
          let dataValidade = '';
          let dataValidadeResponsavel = '';
          
          // Tentar diferentes formatos de dados
          if (processType === 'CPLPMenor') {
            // Formato específico para CPLPMenor
            // Tentar extrair o nome do menor
            if (processData.campos?.dados_do_menor?.nome_completo) {
              childName = processData.campos.dados_do_menor.nome_completo;
              console.log('PdfProcessor: Nome do menor encontrado (campos diretos):', childName);
            } else if (processData.campos?.dados_do_menor?.nome_completo_do_menor) {
              childName = processData.campos.dados_do_menor.nome_completo_do_menor;
              console.log('PdfProcessor: Nome do menor encontrado (formato CPLPMenor 1):', childName);
            } else if (processData.dadosExtraidos?.campos?.dados_do_menor?.nome_completo_do_menor) {
              childName = processData.dadosExtraidos.campos.dados_do_menor.nome_completo_do_menor;
              console.log('PdfProcessor: Nome do menor encontrado (formato CPLPMenor 2):', childName);
            } else if (processData.dadosExtraidos?.gpt?.dados_do_menor?.nome_completo_do_menor) {
              childName = processData.dadosExtraidos.gpt.dados_do_menor.nome_completo_do_menor;
              console.log('PdfProcessor: Nome do menor encontrado (formato CPLPMenor 3):', childName);
            } else if (processData.dadosExtraidos?.campos?.dados_do_menor?.nome_completo) {
              childName = processData.dadosExtraidos.campos.dados_do_menor.nome_completo;
              console.log('PdfProcessor: Nome do menor encontrado (dadosExtraidos):', childName);
            } else if (processData.dadosExtraidos?.gpt?.dados_do_menor?.nome_completo) {
              childName = processData.dadosExtraidos.gpt.dados_do_menor.nome_completo;
              console.log('PdfProcessor: Nome do menor encontrado (dadosExtraidos gpt):', childName);
            }
            
            // Buscar nome do responsável - PRIORIZAR CAMPOS DIRETOS
            if (processData.campos?.dados_do_responsavel?.nome_do_responsavel) {
              responsibleName = processData.campos.dados_do_responsavel.nome_do_responsavel;
              console.log('PdfProcessor: Nome do responsável encontrado (campos diretos CPLPMenor):', responsibleName);
              
              // Extrair data de validade do documento do responsável
              if (processData.campos?.dados_do_responsavel?.data_de_validade_do_documento) {
                dataValidadeResponsavel = processData.campos.dados_do_responsavel.data_de_validade_do_documento;
                console.log('PdfProcessor: Data de validade do documento do responsável (formato CPLPMenor 1):', dataValidadeResponsavel);
              }
            } else if (processData.dadosExtraidos?.campos?.dados_do_responsavel?.nome_do_responsavel) {
              responsibleName = processData.dadosExtraidos.campos.dados_do_responsavel.nome_do_responsavel;
              console.log('PdfProcessor: Nome do responsável encontrado (formato CPLPMenor 2):', responsibleName);
              
              // Extrair data de validade do documento do responsável
              if (processData.dadosExtraidos?.campos?.dados_do_responsavel?.data_de_validade_do_documento) {
                dataValidadeResponsavel = processData.dadosExtraidos.campos.dados_do_responsavel.data_de_validade_do_documento;
                console.log('PdfProcessor: Data de validade do documento do responsável (formato CPLPMenor 2):', dataValidadeResponsavel);
              }
            } else if (processData.dadosExtraidos?.gpt?.dados_do_responsavel?.nome_do_responsavel) {
              responsibleName = processData.dadosExtraidos.gpt.dados_do_responsavel.nome_do_responsavel;
              console.log('PdfProcessor: Nome do responsável encontrado (formato CPLPMenor 3):', responsibleName);
              
              // Extrair data de validade do documento do responsável
              if (processData.dadosExtraidos?.gpt?.dados_do_responsavel?.data_de_validade_do_documento) {
                dataValidadeResponsavel = processData.dadosExtraidos.gpt.dados_do_responsavel.data_de_validade_do_documento;
                console.log('PdfProcessor: Data de validade do documento do responsável (formato CPLPMenor 3):', dataValidadeResponsavel);
              }
            }
          } else if (processData.dadosExtraidos?.campos?.dados_do_menor?.nome_completo) {
            // Formato de CPLP Menor (campo padrão)
            childName = processData.dadosExtraidos.campos.dados_do_menor.nome_completo;
            console.log('PdfProcessor: Nome do menor encontrado (formato 1):', childName);
            
            if (processData.dadosExtraidos?.campos?.dados_do_responsavel?.nome_do_responsavel) {
              responsibleName = processData.dadosExtraidos.campos.dados_do_responsavel.nome_do_responsavel;
              console.log('PdfProcessor: Nome do responsável encontrado (formato 1):', responsibleName);
              
              // Extrair data de validade do documento do responsável
              if (processData.dadosExtraidos?.campos?.dados_do_responsavel?.data_de_validade_do_documento) {
                dataValidadeResponsavel = processData.dadosExtraidos.campos.dados_do_responsavel.data_de_validade_do_documento;
                console.log('PdfProcessor: Data de validade do documento do responsável (formato 1):', dataValidadeResponsavel);
              }
            }
          } else if (processData.dadosExtraidos?.campos?.nomeCompleto && processData.dadosExtraidos?.campos?.nomeResponsavelLegal) {
            // Formato de Renovação
            childName = processData.dadosExtraidos.campos.nomeCompleto;
            console.log('PdfProcessor: Nome do menor encontrado (formato 2):', childName);
            
            responsibleName = processData.dadosExtraidos.campos.nomeResponsavelLegal;
            console.log('PdfProcessor: Nome do responsável encontrado (formato 2):', responsibleName);
            
            // Extrair data de validade do documento do menor e do responsável
            if (processData.dadosExtraidos?.campos?.dataValidade) {
              dataValidade = processData.dadosExtraidos.campos.dataValidade;
              console.log('PdfProcessor: Data de validade do documento do menor (formato 2):', dataValidade);
            }
            
            if (processData.dadosExtraidos?.campos?.dataValidadeResponsavel) {
              dataValidadeResponsavel = processData.dadosExtraidos.campos.dataValidadeResponsavel;
              console.log('PdfProcessor: Data de validade do documento do responsável (formato 2):', dataValidadeResponsavel);
            }
          } else if (processData.dadosExtraidos?.campos?.nomeCompleto) {
            // Outros formatos - quando temos apenas o nome da pessoa
            childName = processData.dadosExtraidos.campos.nomeCompleto;
            console.log('PdfProcessor: Nome do menor encontrado (formato 3):', childName);
            
            // Extrair data de validade do documento do menor
            if (processData.dadosExtraidos?.campos?.dataValidade) {
              dataValidade = processData.dadosExtraidos.campos.dataValidade;
              console.log('PdfProcessor: Data de validade do documento do menor (formato 3):', dataValidade);
            }
            
            // Verificar se temos nomes do responsável em outros formatos
            if (processData.dadosExtraidos?.gpt?.responsibleName) {
              responsibleName = processData.dadosExtraidos.gpt.responsibleName;
              console.log('PdfProcessor: Nome do responsável encontrado (GPT):', responsibleName);
            } else if (processData.campos?.nomeResponsavel) {
              responsibleName = processData.campos.nomeResponsavel;
              console.log('PdfProcessor: Nome do responsável encontrado (campos):', responsibleName);
            } else {
              // Não usar nenhum fallback para evitar duplicação
              responsibleName = ""; 
              console.log('PdfProcessor: Nome do responsável não encontrado, deixando vazio');
            }
          }
          
          // ReagrupamentoTutor e similares
          if (!childName && processData.campos?.pessoaReagrupada?.nomeCompleto) {
            childName = processData.campos.pessoaReagrupada.nomeCompleto;
            console.log('PdfProcessor: Nome do menor encontrado (formato ReagrupamentoTutor):', childName);
            
            // Extrair data de validade do documento do menor
            if (processData.campos?.pessoaReagrupada?.dataValidadePassaporte) {
              dataValidade = processData.campos.pessoaReagrupada.dataValidadePassaporte;
              console.log('PdfProcessor: Data de validade do documento do menor (ReagrupamentoTutor):', dataValidade);
            }
            
            // Verificar se temos nome do responsável
            if (processData.campos?.pessoaQueRegrupa?.nomeCompleto) {
              responsibleName = processData.campos.pessoaQueRegrupa.nomeCompleto;
              console.log('PdfProcessor: Nome do responsável encontrado (ReagrupamentoTutor):', responsibleName);
              
              // Extrair data de validade do documento do responsável
              if (processData.campos?.pessoaQueRegrupa?.dataValidade) {
                dataValidadeResponsavel = processData.campos.pessoaQueRegrupa.dataValidade;
                console.log('PdfProcessor: Data de validade do documento do responsável (ReagrupamentoTutor):', dataValidadeResponsavel);
              }
            }
          }
          
          // Se ainda não encontramos o nome, usar o personName fornecido
          if (!childName) {
            childName = personName;
            console.log('PdfProcessor: Nome do menor não encontrado, usando personName:', personName);
          }
          
          // Se ainda não encontramos o nome do responsável, deixar em branco
          if (!responsibleName) {
            // Não usar childName ou personName como fallback
            responsibleName = ""; 
            console.log('PdfProcessor: Nome do responsável não encontrado, deixando vazio');
          }
          
          setChildName(childName);
          setResponsibleName(responsibleName);
          setDataValidade(dataValidade);
          setDataValidadeResponsavel(dataValidadeResponsavel);
          setIsMinor(true);
        } else {
          console.log('PdfProcessor: Processando dados de ADULTO');
          
          // Extrair o nome da pessoa (adulto) e a data de validade do documento
          let adultName = '';
          let dataValidade = '';
          
          if (processData.dadosExtraidos?.campos?.nomeCompleto) {
            adultName = processData.dadosExtraidos.campos.nomeCompleto;
            console.log('PdfProcessor: Nome da pessoa encontrado:', adultName);
            
            // Extrair data de validade do documento
            if (processData.dadosExtraidos?.campos?.dataValidade) {
              dataValidade = processData.dadosExtraidos.campos.dataValidade;
              console.log('PdfProcessor: Data de validade do documento encontrada:', dataValidade);
            } else if (processData.dadosExtraidos?.campos?.dataValidadePassaporte) {
              dataValidade = processData.dadosExtraidos.campos.dataValidadePassaporte;
              console.log('PdfProcessor: Data de validade do passaporte encontrada:', dataValidade);
            }
          } else if (processData.campos?.nomeCompleto) {
            adultName = processData.campos.nomeCompleto;
            console.log('PdfProcessor: Nome da pessoa encontrado em campos:', adultName);
            
            if (processData.campos?.dataValidade) {
              dataValidade = processData.campos.dataValidade;
              console.log('PdfProcessor: Data de validade encontrada em campos:', dataValidade);
            }
          }
          
          // Se não encontrarmos, usar o nome fornecido
          if (!adultName) {
            adultName = personName;
            console.log('PdfProcessor: Nome da pessoa não encontrado, usando personName:', personName);
          }
          
          // Se ainda não encontramos o nome do responsável, deixar vazio
          if (!responsibleName) {
            // Não usar nenhum nome como fallback para evitar duplicação
            responsibleName = ""; 
            console.log('PdfProcessor: Nome do responsável não encontrado, deixando vazio');
          }
          
          setResponsibleName(adultName);
          setDataValidade(dataValidade);
          setIsMinor(false);
        }
        
        setProcessedProcesso(processData);
        setLoading(false);
        
      } catch (error) {
        console.error('PdfProcessor: Erro ao buscar dados do processo:', error);
        setLoading(false);
        setError(`Erro ao buscar dados do processo: ${error.message}`);
      }
    }
    
    fetchProcessData();
  }, [processId, processo, personName]);

  // Resetar processamento quando o nome muda
  useEffect(() => {
    if (childName !== prevChildNameRef.current) {
      console.log('PdfProcessor: Nome mudou, resetando processamento');
      setPdfUrl(null);
      setError(null);
      prevChildNameRef.current = childName;
    }
  }, [childName]);

  const handlePdfProcessed = (url) => {
    if (!processedRef.current) {
      console.log(`PDF processado com sucesso (${isMinor ? 'MENOR' : 'ADULTO'})`);
      processedRef.current = true;
      if (onPdfProcessed) onPdfProcessed(url);
    }
  };

  const handleError = (errorMessage) => {
    if (!processedRef.current) {
      console.error(`Erro ao processar PDF: ${errorMessage}`);
      processedRef.current = true;
      if (onError) onError(errorMessage);
    }
  };

  // Criar uma chave única para os processadores
  const processorKey = `${processId}-${personName}-${isMinor ? 'minor' : 'adult'}-v${pdfVersion}-${Date.now()}`;
  
  if (loading || !processId) {
    return null;
  }

  // Confirmar quais nomes estão sendo passados
  console.log('PdfProcessor: Nomes finais passados para o componente:');
  console.log('- Nome do Menor:', childName || personName);
  console.log('- Nome do Responsável:', responsibleName);
  
  // Verificar se o tipo de processo é CPLPMenor e imprimir dados detalhados
  if (processId.startsWith('CPLPMenor')) {
    console.log('******** DADOS DETALHADOS DO PROCESSO CPLPMenor ********');
    console.log('ProcessId:', processId);
    
    // Verificar dados no objeto processedProcesso
    if (processedProcesso) {
      if (processedProcesso.campos?.dados_do_menor) {
        console.log('MENOR em campos diretos:', processedProcesso.campos.dados_do_menor);
      }
      if (processedProcesso.campos?.dados_do_responsavel) {
        console.log('RESPONSÁVEL em campos diretos:', processedProcesso.campos.dados_do_responsavel);
      }
      
      // Verificar dados em dadosExtraidos
      if (processedProcesso.dadosExtraidos?.campos?.dados_do_menor) {
        console.log('MENOR em dadosExtraidos.campos:', processedProcesso.dadosExtraidos.campos.dados_do_menor);
      }
      if (processedProcesso.dadosExtraidos?.campos?.dados_do_responsavel) {
        console.log('RESPONSÁVEL em dadosExtraidos.campos:', processedProcesso.dadosExtraidos.campos.dados_do_responsavel);
      }
    }
    console.log('****************************************************');
  }

  // Determinar qual processo usar: o processado localmente ou o recebido via props
  const processoToUse = processo || processedProcesso;

  return (
    <div className="pdf-processor">
      {loading ? (
        <div className="pdf-loading">
          <CircularProgress />
          <Typography>Carregando PDF...</Typography>
        </div>
      ) : error ? (
        <div className="pdf-error">
          <Typography color="error">{error}</Typography>
        </div>
      ) : processoToUse ? (
        isMinor ? (
          <ChildPdfProcessor
            key={processorKey}
            processId={processId}
            personName={childName || personName}
            responsibleName={responsibleName}
            dataValidade={dataValidade}
            dataValidadeResponsavel={dataValidadeResponsavel}
            completePdfPath={completePdfPath}
            onPdfProcessed={handlePdfProcessed}
            onError={handleError}
            processData={processoToUse}
            processo={processo}
            pdfVersion={pdfVersion}
          />
        ) : (
          <AdultPdfProcessor
            key={processorKey}
            processId={processId}
            personName={responsibleName || personName}
            dataValidade={dataValidade}
            completePdfPath={completePdfPath}
            onPdfProcessed={handlePdfProcessed}
            onError={handleError}
            processData={processoToUse}
            processo={processo}
            pdfVersion={pdfVersion}
          />
        )
      ) : (
        <div className="pdf-empty">
          <Typography>Nenhum processo carregado.</Typography>
        </div>
      )}
      
      {pdfUrl && (
        <div className="pdf-viewer">
          <Typography variant="h6" gutterBottom>PDF Gerado:</Typography>
          <iframe 
            src={pdfUrl} 
            width="100%" 
            height="500px" 
            title="PDF Gerado"
            style={{ border: '1px solid #ccc' }}
          />
        </div>
      )}
    </div>
  );
};

PdfProcessor.propTypes = {
  processId: PropTypes.string.isRequired,
  personName: PropTypes.string.isRequired,
  completePdfPath: PropTypes.string,
  onPdfProcessed: PropTypes.func,
  onError: PropTypes.func,
  pdfVersion: PropTypes.number,
  processo: PropTypes.object
};

export default PdfProcessor;