// const cidades_ibge = require("./scrappers/cidades_ibge");
// const get_cities_ibge = require("./scrappers/get_cities_ibge");

// const sisapidoso = require("./scrappers/sisapidoso");
// const saveCSV = require("./scrappers/sisapidoso/saveCSV");
// const longeviver = require("./scrappers/longeviver");
// const longeviverSaveCSV = require("./scrappers/longeviver/saveCSV");
// const getDataFromIbgeAPI = require("./scrappers/cidades_ibge/getDataFromAPI");
// const buildDataFromAPI = require("./scrappers/cidades_ibge/buildDataFromAPI");
const getCities = require("./scrappers/sisapidoso/getCities");
// const siteMercado = require("./scrappers/site_mercado");

// const fileCreator = require("./util/fileCreator");
// const { existsSync } = require("fs");

// getCities
// (async () => {
//     const CidadesIbgePath = "./result/cidades_ibge.csv";
//     if (!existsSync(CidadesIbgePath)) {
//         const {csvContent, clear} = await cidades_ibge();
//         fileCreator(CidadesIbgePath, csvContent, "File cidades_ibge.csv created");
//         fileCreator("./result/data23Indicator1cidades_ibge_cleared.json", JSON.stringify({ urls: clear, csv: csvContent }), "File cidades_ibge.json created");
//     }
// })();

// getCities
// (async () => {
//     get_cities_ibge();
// })();

// (async () => {
//     // sisapidoso(1);
//     // sisapidoso(2);
//     // sisapidoso(3);
//     saveCSV(1);
//     saveCSV(2);
//     saveCSV(3);
// })();

// (async () => {
//     // longeviver();
//     longeviverSaveCSV();
// })();

// (async () => {
//     // getDataFromIbgeAPI();
//     buildDataFromAPI();
// })();

(async () => {
    getCities();
})();

// (async () => {
//     siteMercado();
// })();