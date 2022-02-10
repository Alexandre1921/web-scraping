const sqlite3 = require("sqlite3");
const { open } = require("sqlite");
const fileCreator = require("../../util/fileCreator");
// node field names
const ebapiNodeFieldNames = require("./consts/ebapi/nodeFieldNames");
const municNodeFieldNames = require("./consts/munic/nodeFieldNames");
// plataform nodeFieldNames
const perfilNodeFieldNames = require("./consts/platform/perfil/nodeFieldNames");
const acessoNodeFieldNames = require("./consts/platform/acesso/nodeFieldNames");
const apoioNodeFieldNames = require("./consts/platform/apoio/nodeFieldNames");
const cidadaniaNodeFieldNames = require("./consts/platform/cidadania/nodeFieldNames");
const conectividadeNodeFieldNames = require("./consts/platform/conectividade/nodeFieldNames");
const financasNodeFieldNames = require("./consts/platform/financas/nodeFieldNames");
const habitatNodeFieldNames = require("./consts/platform/habitat/nodeFieldNames");

const getHeader = () => {
  const headers = [
      ebapiNodeFieldNames,
      municNodeFieldNames,
      perfilNodeFieldNames,
      acessoNodeFieldNames,
      apoioNodeFieldNames,
      cidadaniaNodeFieldNames,
      conectividadeNodeFieldNames,
      financasNodeFieldNames,
      habitatNodeFieldNames,
  ].flat();

  return '"' + 'ibge_codigo,' + '","' + headers.join('","') + '"' + "\n";
}

module.exports = async function () {
  const db = await open({
      filename: './database.db',
      driver: sqlite3.Database
  });
  const res = await db.all("SELECT * FROM longeviver");
  db.close();

  let csvContent = getHeader() + "\n";
  csvContent += res.map(({ line_data }) => line_data).join("\n");
  fileCreator("./result/longeviver.csv", csvContent, "File longeviver.csv created");
}