// https://cidades.ibge.gov.br/
const nodeFieldNames = require("./consts/nodeFieldNames");
const nodes = require("./consts/nodes");
const sufixes = require("./consts/sufixes");
const puppeteer = require("puppeteer");
const { mapLimit, asyncRoot } = require('modern-async');
const fileCreator = require("../../util/fileCreator");

const getPage = async (url, state, city) => {
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    // await page.setViewport({ width: 800, height: 600 });

    await page.goto(url);

    const checkIfPageLoadedOkNode = "#local > ul > li:nth-child(3) > h1";

    await page.waitForSelector(checkIfPageLoadedOkNode);
    
    await Promise.all(nodes.map((node) => page.waitForSelector(node)));
    await page.waitForSelector("#dados > panorama-resumo > div > div.topo > div.topo__celula-esquerda > p");
    
    const { cityName, texts: data, ibgeCode } = await page.evaluate(({ nodes, checkIfPageLoadedOkNode }) => {
        const cityName = ((document.querySelectorAll(checkIfPageLoadedOkNode) || {}).innerText || "").trim();

        // open all hidden content
        Array.from(document.querySelectorAll("div.vejaMais")).forEach(node=>node.click());

        const texts = nodes.map(nodePath => ((document.querySelector(nodePath) || {}).innerText || "").trim())
        
        texts[0] = texts[0].split(" ")[0];
        texts[1] = texts[1].split(" ")[0];
        texts[2] = texts[2].split(" ")[0];

        const ibgeCode = document.querySelector("#dados > panorama-resumo > div > div.topo > div.topo__celula-esquerda > p")?.innerText || "no-id";

        return { cityName, texts, ibgeCode };
    }, { nodes, checkIfPageLoadedOkNode });

    await browser.close();

    data.unshift(url);
    data.unshift(city);
    data.unshift(state);
    data.unshift(ibgeCode);

    const sanitizatedData =  data
        // cleaner
        .map(text => (text || "").trim().split("\n")[0])
        // add sufixes
        .map((text, i) => text + (sufixes[i] ? " " + sufixes[i] : ""))
        .map(v => `"${v}"`);

    const csvLine = sanitizatedData.join(",");

    return csvLine;
}


process.setMaxListeners(0);
module.exports = async function () {
    const objectCities = [];
    const cities = require("./consts/cities.json");

    do {
        let citiesCleared = require("../../result/cidades_ibge_pr_cleared.json"); 
        delete require.cache[require.resolve("../../result/cidades_ibge_pr_cleared.json")];
        citiesCleared = require("../../result/cidades_ibge_pr_cleared.json");

        const { citiesGotten = [], csvContent: lastIterationCsv = '' } = citiesCleared;

        const newCities = cities.filter(element => !citiesGotten.includes(element));
        const maxCitiesToGet = 500;
    
        objectCities.length = 0;
        objectCities.push(...newCities.map(url => [url, 'PR', url.split('/').pop()]));
        objectCities.length = objectCities.length > 0 ? maxCitiesToGet : 0;
    
        let lines = "";
        let success = 0;
        let errors = 0;

        await asyncRoot(async () => {
            await mapLimit(objectCities, async ([url, state, city], index) => {
                console.log("Current city: ", index, ", ", url);
                await new Promise(r => setTimeout(r, (Math.floor(Math.random() * (40 - 12 + 1)) + 12) * 1000));
                try {
                    const cityContent = await getPage(url, state, city);
                    const csvLine = !cityContent ? "" : (cityContent + "\n");
                    lines += csvLine;
                    citiesGotten.push(url);
                    success++;
                } catch (error) {
                    errors++;
                }
                console.log(success+errors + " - " + Math.floor(((success+errors)/maxCitiesToGet) * 100) + "% completo");
                console.log(success + " - " + Math.floor((success/maxCitiesToGet) * 100) + "% de sucesso");
                console.log(errors + " - " + Math.floor((errors/maxCitiesToGet) * 100) + "% de erro");
                return "";
            }, 10);
        });
        
        const csvContent = (lastIterationCsv ? lastIterationCsv : nodeFieldNames.map(v => `"${v}"`).join(",") + "\n") + lines;
    
        console.log("Save and delay");
        fileCreator("./result/cidades_pr_ibge.csv", csvContent, "File cidades_ibge.csv created");
        fileCreator("./result/cidades_ibge_pr_cleared.json", JSON.stringify({ csvContent, citiesGotten }), "File cidades_ibge.json created");
        await new Promise(r => setTimeout(r, 20000));
        console.log("finish");
    } while (objectCities.length > 0);
}