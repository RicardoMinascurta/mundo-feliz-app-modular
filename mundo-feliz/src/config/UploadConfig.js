const uploadConfigs = {
  // Configuração para CPLP Maiores
  "CPLP Maiores": {
    title: "Upload de Documentos - CPLP Maiores",
    documentFields: [
      {
        name: "passport",
        label: "Passaporte",
        required: true,
        acceptedTypes: "application/pdf,image/jpeg,image/png",
        fullWidth: false
      },
      {
        name: "visa",
        label: "Visto",
        required: true,
        acceptedTypes: "application/pdf,image/jpeg,image/png",
        fullWidth: false
      },
      {
        name: "fotoTipo",
        label: "Foto Tipo Passe",
        required: true,
        acceptedTypes: "image/jpeg,image/png",
        fullWidth: false
      },
      {
        name: "certificadoResidencia",
        label: "Certificado de Residência",
        required: false,
        acceptedTypes: "application/pdf,image/jpeg,image/png",
        fullWidth: false
      }
    ],
    requireSignature: true
  },
  
  // Configuração para CPLP Menores
  "CPLP Menores": {
    title: "Upload de Documentos - CPLP Menores",
    documentFields: [
      {
        name: "passport",
        label: "Passaporte",
        required: true,
        acceptedTypes: "application/pdf,image/jpeg,image/png",
        fullWidth: false
      },
      {
        name: "visa",
        label: "Visto",
        required: true,
        acceptedTypes: "application/pdf,image/jpeg,image/png",
        fullWidth: false
      },
      {
        name: "fotoTipo",
        label: "Foto Tipo Passe",
        required: true,
        acceptedTypes: "image/jpeg,image/png",
        fullWidth: false
      },
      {
        name: "certificadoNascimento",
        label: "Certidão de Nascimento",
        required: true,
        acceptedTypes: "application/pdf,image/jpeg,image/png",
        fullWidth: false
      },
      {
        name: "autorizacaoParental",
        label: "Autorização Parental",
        required: true,
        acceptedTypes: "application/pdf,image/jpeg,image/png",
        fullWidth: false
      }
    ],
    requireSignature: true
  },
  
  // Configuração para Contagem de Tempo
  "Contagem de Tempo": {
    title: "Upload de Documentos - Contagem de Tempo",
    documentFields: [
      {
        name: "passportAll",
        label: "Passaporte (Todas as Páginas)",
        required: true,
        acceptedTypes: "application/pdf,image/jpeg,image/png",
        fullWidth: false
      },
      {
        name: "residence",
        label: "Autorização de Residência Atual",
        required: true,
        acceptedTypes: "application/pdf,image/jpeg,image/png",
        fullWidth: false
      },
      {
        name: "fotoTipo",
        label: "Foto Tipo Passe",
        required: true,
        acceptedTypes: "image/jpeg,image/png",
        fullWidth: false
      }
    ],
    requireSignature: true
  },
  
  // Configuração para Concessão TR Estudante Menor
  "Concessão TR Estudante Menor": {
    title: "Upload de Documentos - Concessão TR Estudante Menor",
    documentFields: [
      {
        name: "passport",
        label: "Passaporte do Menor",
        required: true,
        acceptedTypes: "application/pdf,image/jpeg,image/png",
        fullWidth: false
      },
      {
        name: "parentDocument",
        label: "Documento do Responsável Legal",
        required: true,
        acceptedTypes: "application/pdf,image/jpeg,image/png",
        fullWidth: false
      },
      {
        name: "schoolProof",
        label: "Comprovativo de Escola",
        required: true,
        acceptedTypes: "application/pdf,image/jpeg,image/png",
        fullWidth: false
      },
      {
        name: "fotoTipo",
        label: "Foto Tipo Passe",
        required: true,
        acceptedTypes: "image/jpeg,image/png",
        fullWidth: false
      },
      {
        name: "extra",
        label: "Documentos Extras (opcional)",
        required: false,
        acceptedTypes: "application/pdf,image/jpeg,image/png",
        fullWidth: true,
        multipleFiles: true
      }
    ],
    requireSignature: true,
    maxStepDocuments: 3
  },
  
  // Incluir outras configurações conforme necessário
};

export default uploadConfigs; 