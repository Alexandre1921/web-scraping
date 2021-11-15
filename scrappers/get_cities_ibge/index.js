// const puppeteer = require("puppeteer");
// const fileCreator = require("../../util/fileCreator");
const getCitiesByURL = require("../cidades_ibge/getCitiesByURL");

module.exports = async function () {
    // const browser = await puppeteer.launch({ headless: true });
    // const page = await browser.newPage();
    // // await page.setViewport({ width: 800, height: 600 });
    
    // await page.goto("https://cidades.ibge.gov.br/");

    // await page.waitForSelector("#localidade > button:nth-child(2)");
    
    // await page.evaluate(() => {
    //     document.querySelector("#localidade > button:nth-child(2)").click();
    //     document.querySelector("#menu__municipio").click();
    // });

    // await page.waitForSelector("#segunda-coluna > ul > li:not(li:first-child) > div");

    // const citiesUrls = await page.evaluate(() => {
    //     const statesArray = Array.from(document.querySelectorAll("#segunda-coluna > ul > li:not(li:first-child) > div"));
    //     return statesArray.flatMap(node => {
    //         node.click();
    //         const allCities = document.querySelectorAll("#municipios > div.conjunto > .municipios > ul > li > a");
    //         return Array.from(allCities).map(cityA => cityA.href);
    //     });
    // });
    
    // await browser.close();

    // fileCreator('./scrappers/get_cities_ibge/cities.json', JSON.stringify(citiesUrls), "File cidades_ibge.csv created");

    // return citiesUrls.length;

    getCitiesByURL();
}