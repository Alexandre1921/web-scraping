const puppeteer = require("puppeteer");
const sqlite3 = require("sqlite3");
const { open } = require("sqlite");
const ibgeCodes = require("../../consts/ibge_codes.json");

// nodes
const ebapiNodes = require("./consts/ebapi/nodes");
const municNodes = require("./consts/munic/nodes");
// plataform nodes
const perfilNodes = require("./consts/platform/perfil/nodes");
const acessoNodes = require("./consts/platform/acesso/nodes");
const apoioNodes = require("./consts/platform/apoio/nodes");
const cidadaniaNodes = require("./consts/platform/cidadania/nodes");
const conectividadeNodes = require("./consts/platform/conectividade/nodes");
const financasNodes = require("./consts/platform/financas/nodes");
const habitatNodes = require("./consts/platform/habitat/nodes");

const getBody = (ibgeCodigo, results) => {
    return '"' + ibgeCodigo + '","' + results.flat().join('","') + '"';
}
  

const getPage = async (url, ibgeCodigos) => {
    const browser = await puppeteer.launch({ headless: false });
    const page = await browser.newPage();
    // await page.setViewport({ width: 800, height: 600 });
    
    await page.goto(url).catch((err) => console.log(err));

    const login = async () => {
        await page.type('#logincadastro > div:nth-child(1) > form > div:nth-child(4) > div > div > input', 'Alfredo de Gouvea');
        await page.type('#logincadastro > div:nth-child(1) > form > div:nth-child(5) > div.col-sm-4.no-padding > div > input', 'HYtgy5EhVpWPi3s');
        await page.click('#logincadastro > div:nth-child(1) > form > div:nth-child(5) > div.col-sm-8 > button');
        
        await page.waitForSelector("#buscamuni").catch((err) => console.log(err));
    }

    const getData = async (nodes, url) => {
        await page.goto(url).catch((err) => console.log(err));

        await Promise.all(nodes.map((node) => page.waitForSelector(node).catch((err) => console.log('url: ', url,err))));
        
        const { data } = await page.evaluate(({ nodes }) => {
            const data = nodes.map(nodePath => ((document.querySelector(nodePath) || {}).innerText || "").replaceAll('\n', ' ').trim())
    
            return { data };
        }, { nodes: nodes });

        console.log(url,data);
    
        return data;
    }

    await login();

    for (let index = 0; index < ibgeCodigos.length; index++) {
        const ibgeCodigo = ibgeCodigos[index];

        const dataPromises = [];
        // ebapi
        dataPromises.push(await getData(ebapiNodes, url + 'ebapi.php?ibge=' + ibgeCodigo));
        // munic
        dataPromises.push(await getData(municNodes, url + 'munic.php?ibge=' + ibgeCodigo));
        // plataform
        dataPromises.push(await getData(perfilNodes, url + 'municipio.php?ibge=' + ibgeCodigo + '&dimensao=perfil'));
        dataPromises.push(await getData(acessoNodes, url + 'municipio.php?ibge=' + ibgeCodigo + '&dimensao=acesso'));
        dataPromises.push(await getData(apoioNodes, url + 'municipio.php?ibge=' + ibgeCodigo + '&dimensao=apoio'));
        dataPromises.push(await getData(cidadaniaNodes, url + 'municipio.php?ibge=' + ibgeCodigo + '&dimensao=cidadania'));
        dataPromises.push(await getData(conectividadeNodes, url + 'municipio.php?ibge=' + ibgeCodigo + '&dimensao=conectividade'));
        dataPromises.push(await getData(financasNodes, url + 'municipio.php?ibge=' + ibgeCodigo + '&dimensao=financas'));
        dataPromises.push(await getData(habitatNodes, url + 'municipio.php?ibge=' + ibgeCodigo + '&dimensao=habitat'));
        const results = await Promise.all(dataPromises);
        const line = getBody(ibgeCodigo, results);

        var db = new sqlite3.Database('./database.db');
        db.serialize(function() {
            db.run("CREATE TABLE if not exists longeviver (ibge_codigo INTEGER, line_data TEXT, UNIQUE(ibge_codigo))");

            var stmt = db.prepare("INSERT OR IGNORE INTO longeviver VALUES (?, ?)");

            stmt.run(ibgeCodigo, line);
            stmt.finalize();
        });
        db.close();
    }

    await browser.close();
}

module.exports = async function () {
    // const db = await open({
    //     filename: './database.db',
    //     driver: sqlite3.Database
    // });
    // const res = await db.all("SELECT ibge_codigo FROM longeviver");
    // const codesAlreadyUsed = res.map(({ ibge_codigo }) => ibge_codigo);
    // db.close();

    const newCodes = ibgeCodes.filter(code => ![].includes(code));
    await getPage("https://plataforma.longeviver.com/longeviver/", newCodes);
}