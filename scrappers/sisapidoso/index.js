const puppeteer = require("puppeteer");
const ibgeCodes = require("../../consts/ibge_codes.json");
const sqlite3 = require("sqlite3");
const { open } = require("sqlite");
const { mapLimit, asyncRoot } = require('modern-async');
const fileCreator = require("../../util/fileCreator");

// getDataFrom = [ 'Município', 'UF', 'Região', 'Brasil' ]

const getPage = async (fullUrls, currentBatch, saveHeaders = false, getDataFrom = 0, indexFrom) => {
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    // await page.setViewport({ width: 800, height: 600 });

    const pagesData = [];
    for (let index = 0; index < fullUrls.length; index++) {
        const url = fullUrls[index].url;

        await page.goto(url).catch((err) => console.log(err));
        const { series, xAxisData, title, legendData } = await page.evaluate(() => {
            const series = option.series.map(({ data }) => ({ data }));
            const title = option.title.text.trim().split('\n').join('');
            const xAxisData = option.xAxis.data;
            const legendData = option.legend.data;
            return { series, xAxisData, legendData, title };
        });
        
        const data = series[getDataFrom].data.map((item, i) => ({ [(fullUrls[index].indica + '_' + xAxisData[i])]: item || "N/A" })) // empty city
        const dummyData = series[3].data.map((_, i) => ({ [(fullUrls[index].indica + '_' + xAxisData[i])]: "N/A" }));// empty city
        const dataToSave = data.length > 0 ? data : dummyData;

        console.log(data);

        pagesData.push(dataToSave
            .reduce((previousValue, currentValue) => Object.assign(previousValue, currentValue), {}));
    }

    await browser.close();

    const lineData = pagesData.reduce((previousValue, currentValue) => Object.assign(previousValue, currentValue), {});
    console.log('batch: ', currentBatch, 'ibgeCode: ', fullUrls[0].ibgeCode, 'length: ', Object.keys(lineData).length);

    var db = new sqlite3.Database('./database.db');
    db.serialize(function() {
        db.run("CREATE TABLE if not exists sisapidoso" + currentBatch + " (ibge_codigo INTEGER, line_data TEXT, UNIQUE(ibge_codigo))");

        var stmt = db.prepare("INSERT OR IGNORE INTO sisapidoso" + currentBatch + " VALUES (?, ?)");

        stmt.run(indexFrom, `"${fullUrls[0].ibgeCode}",` + Object.values(lineData).join(','));
        stmt.finalize();
    });
    db.close();

    saveHeaders && fileCreator("./consts/sisapidosoHeader" + currentBatch + ".json", JSON.stringify(Object.keys(lineData)), "File sisapidosoHeader" + currentBatch + ".json created");
}

module.exports = async function (currentBatch = 1) {
    const db = await open({
        filename: './database.db',
        driver: sqlite3.Database
    });
    const res = await db.all("SELECT ibge_codigo FROM sisapidoso" + currentBatch);
    const codesAlreadyUsed = res.map(({ ibge_codigo }) => ibge_codigo);
    db.close();
    const newCodes = ibgeCodes.filter(code => !codesAlreadyUsed.includes(code));
    console.log(codesAlreadyUsed.length, newCodes.length);

    const indicaArray = require("./consts/indicaBatch" + currentBatch + ".js");
    const indicaUrls = indicaArray.map(indica => ({ indica, url: `https://www.saudeidoso.icict.fiocruz.br/novo2/graf_painel.php?indica=${indica}` }));
    const fullUrlsList = newCodes.map(ibgeCode => indicaUrls.map(({ indica, url }) => ({ indica, ibgeCode, url: url+'&municipio='+ibgeCode })));

    await asyncRoot(async () => {
        await mapLimit(fullUrlsList, async (fullUrls, index) => {
            try {
                await getPage(fullUrls, currentBatch, index === 0, 0, index);
            } catch (error) {
                console.log(error);
                // errors++;
            }
            return "";
        }, 3);
    });
}