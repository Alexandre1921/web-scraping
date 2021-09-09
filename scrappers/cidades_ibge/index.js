// https://cidades.ibge.gov.br/
const nodeFieldNames = require("./consts/nodeFieldNames");
const nodes = require("./consts/nodes");
const sufixes = require("./consts/sufixes");
const cities = require("../../consts/cities");
const cleared = require("../../result/cidades_ibge_cleared.json");
const puppeteer = require("puppeteer");
const { mapLimit, asyncRoot } = require('modern-async');

module.exports = async function () {
    const encapsulateDataForCSV = v => `"${v}"`;

    const clear = [];
    const errors = [];

    const getPage = async (url, ibgeCode, state, city) => {
        const browser = await puppeteer.launch({ headless: true });
        const page = await browser.newPage();
        // await page.setViewport({ width: 800, height: 600 });
        
        await page.goto(url).catch(() => errors.push(url));

        const checkIfPageLoadedOkNode = "#local > ul > li:nth-child(3) > h1";

        await page.waitForSelector(checkIfPageLoadedOkNode).catch(()=>errors.push(url));
        
        await Promise.all(nodes.map((node) => page.waitForSelector(node).catch(()=>errors.push(url))));

        const { cityName, texts: data } = await page.evaluate(({ nodes, checkIfPageLoadedOkNode }) => {
            const cityName = ((document.querySelectorAll(checkIfPageLoadedOkNode) || {}).innerText || "").trim();

            // open all hidden content
            Array.from(document.querySelectorAll("div.vejaMais")).forEach(node=>node.click());

            const texts = nodes.map(nodePath => ((document.querySelector(nodePath) || {}).innerText || "").trim())
            
            texts[0] = texts[0].split(" ")[0];
            texts[1] = texts[1].split(" ")[0];
            texts[2] = texts[2].split(" ")[0];

            return { cityName, texts };
        }, { nodes, checkIfPageLoadedOkNode });

        await browser.close();

        // if Brasil, webscrap failed
        if ( cityName === "Brasil") {
            errors.push(url);
            return "";
        }

        data.unshift(url);
        data.unshift(city);
        data.unshift(state);
        data.unshift(ibgeCode);

        const sanitizatedData =  data
            // cleaner
            .map(text => (text || "").trim().split("\n")[0])
            // add sufixes
            .map((text, i) => text + (sufixes[i] ? " " + sufixes[i] : ""))
            .map(encapsulateDataForCSV);

        const csvLine = sanitizatedData.join(",");

        clear.push(url);

        return csvLine;
    }

    const objectCities = cities.filter((city) =>{
        return (cleared || {}).urls ? !cleared.urls.find(cityUrl => {
            const state = city["Estado"].toLowerCase();
            const cityName = city["Município"].normalize('NFD').replace(/[\u0300-\u036f]/g, "").replace("'","").toLowerCase().split(" ").join("-");
            return cityUrl === `https://cidades.ibge.gov.br/brasil/${state}/${cityName}/panorama`;
        }) : true;
    }).map(city => {
        const state = city["Estado"].toLowerCase();
        const cityName = city["Município"].normalize('NFD').replace(/[\u0300-\u036f]/g, "").replace("'","").toLowerCase().split(" ").join("-");
        return [`https://cidades.ibge.gov.br/brasil/${state}/${cityName}/panorama`, city["Código IBGE"], city["Estado"], city["Município"]];
    });

    let lines = "";

    await asyncRoot(async () => {
        await mapLimit(objectCities, async ([url, ibgeCode, state, city], index) => {
            console.log("Current city: ", index, " , ", url);
            const cityContent = await getPage(url, ibgeCode, state, city);
            !!!cityContent && console.log("Failed city: ", index, " , ", url);
            const csvLine = !!cityContent ? "" : (cityContent + "\n");
            lines += csvLine;
            return lines;
        }, 10);
    });

    const csvContent = (!!(cleared || {}).csv ? cleared.csv  : nodeFieldNames.map(encapsulateDataForCSV).join(",") + "\n")  + lines;

    const newErrors = [...(cleared.errors || []), ...new Set(errors)];
    const newUrls = [...(cleared.urls || []), ...clear].filter((city) =>{
        return !newErrors.find(cityUrl => {
            return cityUrl === city;
        });
    });

    return {csvContent, clear: newUrls };
}