const cidades_ibge = require("./scrappers/cidades_ibge");
const fileCreator = require("./util/fileCreator");
const { existsSync } = require("fs");

(async () => {
    const CidadesIbgePath = "./result/cidades_ibge.csv";
    if (!existsSync(CidadesIbgePath)) {
        const {csvContent, clear} = await cidades_ibge();
        fileCreator(CidadesIbgePath, csvContent, "File cidades_ibge.csv created");
        fileCreator("./result/cidades_ibge_cleared.json", JSON.stringify({ urls: clear, csv: csvContent }), "File cidades_ibge.json created");
    }
})();