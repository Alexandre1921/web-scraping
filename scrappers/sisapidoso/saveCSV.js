const sqlite3 = require("sqlite3");
const { open } = require("sqlite");
const fileCreator = require("../../util/fileCreator");

module.exports = async function (currentBatch = 1) {
  const headers = require("../../consts/sisapidosoHeader" + currentBatch + ".json");
  const db = await open({
      filename: './database.db',
      driver: sqlite3.Database
  });
  const res = await db.all("SELECT * FROM sisapidoso" + currentBatch);
  db.close();

  let csvContent = '"ibge_codigo/UF",'+ headers.join(',') + "\n";
  csvContent += res.map(({ line_data }) => line_data).join("\n");
  fileCreator("./result/sisapidoso" + currentBatch + ".csv", csvContent, "File sisapidoso" + currentBatch + ".csv created");
}