/**
 * Configuração das bases de dados do Notion
 */

// Array com todos os IDs das bases de dados
export const databaseIds = [
  // 2021
  "8b6d712de5da407fb204f5034d05d3cf", // Janeiro-Março
  "f4aac6cf0061440aa8a15d171f35481d", // Abril
  "ffe86444262143ebb5327dadb6c6e422", // Maio
  "a93ce7a1f828451d93ce6298ab7f601a", // Junho
  "6be267fb2d7f4fdc8b61f46eb2a0ebba", // Julho
  "eed67eb3b69a442c9b4d8f86a4a6a4c9", // Agosto
  "b9d7c317a930479ea80235c9828d73a2", // Setembro
  "a2114ae7333d4067ba85b8a08bd0f583", // Outubro
  "49cb2679a9cc4d25a632ed0a618b0fad", // Novembro
  "cd874e807cf54a37ad8d61c8709e7256", // Dezembro
  
  // 2022
  "0795f6df3b5f44ad8052ad2602874b70", // Janeiro
  "2ce3a079d7204d00bf8ab575a8a01a4f", // Fevereiro
  "86bcab16d040480ea078d279611b095e", // Março
  "4d4c4b39978247cca674f6a28a0a06c3", // Abril
  "d7f83bbaeb9e46f6aceacd13bad9842f", // Maio
  "ae82827ab29c4a01aae60e74a746945b", // Junho
  "9e3c3a49369541fa9d6cb815a1e9fcc5", // Julho
  "42dcb22c5a8840e2b2941347f524d8d4", // Agosto
  "611ee01166684638813037a78b8c4208", // Setembro
  "ba7ca6a9a2e24a8392fee611a3b0dc40", // Outubro
  "3b6c5e6ec5c54944b9fef3a1d801d57f", // Novembro
  "d9fd1ab111a94993953c94f9afc41898", // Dezembro
  
  // 2023
  "ad156a243eb94ad9a30044b90811d461", // Janeiro
  "a6f8660748314e0dbbb3e71dfe11f906", // Fevereiro
  "cf19ff4bccc7489a8aaddf4514c56c87", // Março
  "8ae3d0e73979400dbe9016f5db2254e9", // Abril
  "9d0cdb718788413cadcd77a3413572a7", // Maio
  "92c675a9d97a47f1aa2772c91c6a1203", // Junho
  "63a0957e6d2b4d1ba651997fea813a83", // Julho
  "b5606e0bda6a40f08475dc2df03ab1d9", // Agosto
  "93978b6147f047d89dff6ce0dd462afa", // Setembro
  "2ecb741f56514dc58114a5a286809b3a", // Outubro
  "9b684bf4ed324e5d9809d00128eb1455", // Novembro
  "c4cf150b70db4f4f9238910ee9715e76", // Dezembro
  
  // 2024
  "6329fa2e0a434d7091e59053fe560e7a", // Janeiro
  "fd2cefc0a5f84c708076470071f6f17a", // Fevereiro
  "0b37d324adde4f5e86d8efc0736f531e", // Março
  "7ebba12b5dda4458af4732987429109e", // Abril
  "461318efc57841b2892aa36f2e0a3a02", // Maio
  "1582d34a36d54e9b96b115274bf7b1c8", // Junho
  "ff297d66a67240a3b32587df8880eee0", // Julho
  "55507a6e7d17441586b1d9ae2d3e736a", // Agosto
  "3a8d43aa5d5c4380887f4be733375afc", // Setembro
  "c95a892531e84370b9d08561b4505c04", // Outubro
  "6c38a8cf8ba045bca17737c32b153332", // Novembro
  "a1f3004dc4954440a0edccd977745323"  // Dezembro
];

// Organizar bases por ano
export const databasesByCategory = {
  "2021": databaseIds.slice(0, 10),   // 2021 tem 10 meses (começa em março)
  "2022": databaseIds.slice(10, 22),  // 12 meses
  "2023": databaseIds.slice(22, 34),  // 12 meses
  "2024": databaseIds.slice(34, 46)   // 12 meses
}; 