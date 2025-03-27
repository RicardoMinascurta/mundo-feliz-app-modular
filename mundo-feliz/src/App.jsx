import React from 'react';
import { Routes, Route } from 'react-router-dom';
import NotionSearchScreen from './screens/NotionSearchScreen';
import DynamicUploadScreen from './components/upload/DynamicUploadScreen';
import CPLPMaioresUpload from './screens/upload/CPLPMaioresUpload';
import CPLPMenoresUpload from './screens/upload/CPLPMenoresUpload';
import ContagemTempoUpload from './screens/upload/ContagemTempoUpload';
import TREstudanteUpload from './screens/upload/TREstudanteUpload';
import TREstudante2Upload from './screens/upload/TREstudante2Upload';
import TRNovoUpload from './screens/upload/TRNovoUpload';
import RenovacaoTRUpload from './screens/upload/RenovacaoTRUpload';
import ReagrupamentoFamiliarUpload from './screens/upload/ReagrupamentoFamiliarUpload';
import { InformacaoUpload } from './components/upload';
import DataViewer from './components/debug/DataViewer';
import { 
  RenovacaoEstudanteSuperior,
  RenovacaoEstudanteSecundario,
  RenovacaoTratamentoMedico,
  RenovacaoNaoTemEstatuto,
  RenovacaoUniaoEuropeia
} from './components/renovacao';
import { 
  ConcessaoTR, 
  ConcessaoTREstudante,
  ConcessaoTREstudanteMenor,
  ConcessaoTRNovo,
  ReagrupamentoConjuge,
  ReagrupamentoFilho,
  ReagrupamentoPaisIdosos,
  ReagrupamentoTutor,
  ReagrupamentoPaiMaeFora,
  CPLPMaiores,
  CPLPMenor,
  ContagemTempo
} from './components/concessao';
import InboxPage from './components/inbox/InboxPage';
import ProcessoDetalhes from './components/detalhes/ProcessoDetalhes';
import './App.css';

function App() {
  return (
    <div className="app-container">
      <main className="app-content">
        <div className="content-wrapper">
          <Routes>
            <Route path="/" element={<NotionSearchScreen />} />
            <Route path="/search" element={<NotionSearchScreen />} />
            <Route path="/person/:personId/processes" element={<NotionSearchScreen />} />
            
            {/* Nova rota para a página de Inbox */}
            <Route path="/inbox" element={<InboxPage />} />
            
            {/* Rota para os detalhes do processo */}
            <Route path="/processo/:processId" element={<ProcessoDetalhes />} />
            <Route path="/processo/*" element={<ProcessoDetalhes />} />
            
            {/* Rota genérica para upload */}
            <Route path="/upload/:processType/:personId/:processId" element={<DynamicUploadScreen />} />
            
            {/* Rotas para telas de upload personalizadas */}
            <Route path="/upload/cplp-maiores/:personId/:processId" element={<CPLPMaioresUpload />} />
            <Route path="/upload/cplp-menores/:personId/:processId" element={<CPLPMenoresUpload />} />
            <Route path="/upload/contagem-tempo/:personId/:processId" element={<ContagemTempoUpload />} />
            <Route path="/upload/tr-estudante/:personId/:processId" element={<TREstudanteUpload />} />
            <Route path="/upload/tr-estudante2/:personId/:processId" element={<TREstudante2Upload />} />
            <Route path="/upload/tr-novo/:personId/:processId" element={<TRNovoUpload />} />
            <Route path="/upload/renovacao-tr/:personId/:processId" element={<RenovacaoTRUpload />} />
            <Route path="/upload/reagrupamento-familiar/:personId/:processId" element={<ReagrupamentoFamiliarUpload />} />
            
            {/* Rotas para informação */}
            <Route path="/informacao/portal/:personId/:processId" element={<InformacaoUpload />} />
            <Route path="/informacao/presencial/:personId/:processId" element={<InformacaoUpload />} />
            
            {/* Rotas para telas de renovação */}
            <Route path="/renovacao/estudante-superior/:personId/:processId" element={<RenovacaoEstudanteSuperior />} />
            <Route path="/renovacao/estudante-secundario/:personId/:processId" element={<RenovacaoEstudanteSecundario />} />
            <Route path="/renovacao/tratamento-medico/:personId/:processId" element={<RenovacaoTratamentoMedico />} />
            <Route path="/renovacao/sem-estatuto/:personId/:processId" element={<RenovacaoNaoTemEstatuto />} />
            <Route path="/renovacao/uniao-europeia/:personId/:processId" element={<RenovacaoUniaoEuropeia />} />
            
            {/* Rotas para telas de concessão */}
            <Route path="/concessao/tr/:personId/:processId" element={<ConcessaoTRNovo />} />
            <Route path="/concessao/tr-estudante/:personId/:processId" element={<ConcessaoTREstudante />} />
            <Route path="/concessao/tr-estudante-menor/:personId/:processId" element={<ConcessaoTREstudanteMenor />} />
            <Route path="/concessao/reagrupamento-conjuge/:personId/:processId" element={<ReagrupamentoConjuge />} />
            <Route path="/concessao/reagrupamento-filho/:personId/:processId" element={<ReagrupamentoFilho />} />
            <Route path="/concessao/reagrupamento-pais-idosos/:personId/:processId" element={<ReagrupamentoPaisIdosos />} />
            <Route path="/concessao/reagrupamento-tutor/:personId/:processId" element={<ReagrupamentoTutor />} />
            <Route path="/concessao/reagrupamento-pai-mae-fora/:personId/:processId" element={<ReagrupamentoPaiMaeFora />} />
            <Route path="/concessao/cplp-maiores/:personId/:processId" element={<CPLPMaiores />} />
            <Route path="/concessao/cplp-menor/:personId/:processId" element={<CPLPMenor />} />
            <Route path="/concessao/contagem-tempo/:personId/:processId" element={<ContagemTempo />} />
            
            {/* Ferramentas de Debug */}
            <Route path="/debug/data" element={<DataViewer />} />
            
            {/* Outras rotas podem ser adicionadas aqui */}
          </Routes>
        </div>
      </main>
    </div>
  );
}

export default App;
