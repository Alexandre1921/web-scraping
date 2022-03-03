const puppeteer = require('puppeteer');
const fileCreator = require("../../util/fileCreator");
const sisapidoso = require("../../result/sisapidosoFinalData.json");


module.exports = async function () {
    sisapidoso
    fileCreator("./result/sisapidosoFinalData.json", JSON.stringify(data), "File sisapidosoFinalData.json created");
}