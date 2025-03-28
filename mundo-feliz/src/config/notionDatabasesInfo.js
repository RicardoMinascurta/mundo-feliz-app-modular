/**
 * Configuração dos períodos das bases de dados Notion
 * Este ficheiro associa cada ID de base de dados ao seu respetivo período
 */

// Array com informações detalhadas dos períodos para cada base de dados
export const databasesInfo = [
  // 2021
  { id: "8b6d712de5da407fb204f5034d05d3cf", period: "Janeiro-Março 2021" },
  { id: "f4aac6cf0061440aa8a15d171f35481d", period: "Abril 2021" },
  { id: "ffe86444262143ebb5327dadb6c6e422", period: "Maio 2021" },
  { id: "a93ce7a1f828451d93ce6298ab7f601a", period: "Junho 2021" },
  { id: "6be267fb2d7f4fdc8b61f46eb2a0ebba", period: "Julho 2021" },
  { id: "eed67eb3b69a442c9b4d8f86a4a6a4c9", period: "Agosto 2021" },
  { id: "b9d7c317a930479ea80235c9828d73a2", period: "Setembro 2021" },
  { id: "a2114ae7333d4067ba85b8a08bd0f583", period: "Outubro 2021" },
  { id: "49cb2679a9cc4d25a632ed0a618b0fad", period: "Novembro 2021" },
  { id: "cd874e807cf54a37ad8d61c8709e7256", period: "Dezembro 2021" },
  
  // 2022
  { id: "0795f6df3b5f44ad8052ad2602874b70", period: "Janeiro 2022" },
  { id: "2ce3a079d7204d00bf8ab575a8a01a4f", period: "Fevereiro 2022" },
  { id: "86bcab16d040480ea078d279611b095e", period: "Março 2022" },
  { id: "4d4c4b39978247cca674f6a28a0a06c3", period: "Abril 2022" },
  { id: "d7f83bbaeb9e46f6aceacd13bad9842f", period: "Maio 2022" },
  { id: "ae82827ab29c4a01aae60e74a746945b", period: "Junho 2022" },
  { id: "9e3c3a49369541fa9d6cb815a1e9fcc5", period: "Julho 2022" },
  { id: "42dcb22c5a8840e2b2941347f524d8d4", period: "Agosto 2022" },
  { id: "611ee01166684638813037a78b8c4208", period: "Setembro 2022" },
  { id: "ba7ca6a9a2e24a8392fee611a3b0dc40", period: "Outubro 2022" },
  { id: "3b6c5e6ec5c54944b9fef3a1d801d57f", period: "Novembro 2022" },
  { id: "d9fd1ab111a94993953c94f9afc41898", period: "Dezembro 2022" },
  
  // 2023
  { id: "ad156a243eb94ad9a30044b90811d461", period: "Janeiro 2023" },
  { id: "a6f8660748314e0dbbb3e71dfe11f906", period: "Fevereiro 2023" },
  { id: "cf19ff4bccc7489a8aaddf4514c56c87", period: "Março 2023" },
  { id: "8ae3d0e73979400dbe9016f5db2254e9", period: "Abril 2023" },
  { id: "9d0cdb718788413cadcd77a3413572a7", period: "Maio 2023" },
  { id: "92c675a9d97a47f1aa2772c91c6a1203", period: "Junho 2023" },
  { id: "63a0957e6d2b4d1ba651997fea813a83", period: "Julho 2023" },
  { id: "b5606e0bda6a40f08475dc2df03ab1d9", period: "Agosto 2023" },
  { id: "93978b6147f047d89dff6ce0dd462afa", period: "Setembro 2023" },
  { id: "2ecb741f56514dc58114a5a286809b3a", period: "Outubro 2023" },
  { id: "9b684bf4ed324e5d9809d00128eb1455", period: "Novembro 2023" },
  { id: "c4cf150b70db4f4f9238910ee9715e76", period: "Dezembro 2023" },
  
  // 2024
  { id: "6329fa2e0a434d7091e59053fe560e7a", period: "Janeiro 2024" },
  { id: "fd2cefc0a5f84c708076470071f6f17a", period: "Fevereiro 2024" },
  { id: "0b37d324adde4f5e86d8efc0736f531e", period: "Março 2024" },
  { id: "7ebba12b5dda4458af4732987429109e", period: "Abril 2024" },
  { id: "461318efc57841b2892aa36f2e0a3a02", period: "Maio 2024" },
  { id: "1582d34a36d54e9b96b115274bf7b1c8", period: "Junho 2024" },
  { id: "ff297d66a67240a3b32587df8880eee0", period: "Julho 2024" },
  { id: "55507a6e7d17441586b1d9ae2d3e736a", period: "Agosto 2024" },
  { id: "3a8d43aa5d5c4380887f4be733375afc", period: "Setembro 2024" },
  { id: "c95a892531e84370b9d08561b4505c04", period: "Outubro 2024" },
  { id: "6c38a8cf8ba045bca17737c32b153332", period: "Novembro 2024" },
  { id: "a1f3004dc4954440a0edccd977745323", period: "Dezembro 2024" }
];

/**
 * Função para obter o período (ano e mês) a partir do ID da base de dados
 * @param {string} databaseId - ID da base de dados Notion
 * @returns {string} Período correspondente ao ID ou texto padrão
 */
export function getPeriodoFromDatabaseId(databaseId) {
  if (!databaseId) return "Base de dados Notion";

  // Remover traços do ID recebido para comparação
  const cleanId = databaseId.replace(/-/g, "");
  
  // Procurar pelo ID sem traços
  const dbInfo = databasesInfo.find(db => 
    db.id.replace(/-/g, "") === cleanId
  );
  
  console.log(`Buscando período para ID: ${databaseId}, ID limpo: ${cleanId}, Encontrado: ${dbInfo?.period || 'não encontrado'}`);
  
  return dbInfo ? dbInfo.period : "Base de dados Notion";
} 