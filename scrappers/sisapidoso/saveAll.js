const puppeteer = require('puppeteer');
const fileCreator = require("../../util/fileCreator");
const parcialData = require('../../result/sisapidosoParcialData.json');

const getDataFromElement = v => {
    const data = []; 

    for (const key in v) {
        if (Object.hasOwnProperty.call(v, key)) {
            const element = v[key];
            if (key !== 'Código' && key !== 'Brasil')
                data.push(element);
        }
    }

    return `"${data.join('","')}"`;
};

const getSubtitleFromElement = (v, sub) => {
    const subtitles = [];

    for (const key in v) {
        if (Object.hasOwnProperty.call(v, key)) {
            if (key !== 'Código' && key !== 'Brasil')
                subtitles.push(key);
        }
    }

    return `"${sub}${subtitles.join(`","${sub}`)}"`;
};

module.exports = async function () {
    const lines = [];
    const indicadores = Object.keys(parcialData);
    for (let index = 0; index < indicadores.length; index++) {
        const element = indicadores[index];
        const tipos = Object.keys(parcialData[element]);

        for (let index1 = 0; index1 < tipos.length; index1++) {
            const element1 = tipos[index1];

            // const br = parcialData[element][element1]['Brasil'] || []};
            // const ufs = parcialData[element][element1]['UFs'] || [];
            // console.log(element, element1, parcialData[element][element1]);
            if (parcialData[element][element1]?.Municipios) {
                console.log(element, element1);
                const mun = parcialData[element][element1]['Municipios'] || [];

                for (let index2 = 0; index2 < mun.length; index2++) {
                    const element2 = mun[index2];
                    const newElement = {};
                    for (const key in element2) {
                        if (Object.hasOwnProperty.call(element2, key)) {
                            const element3 = element2[key];
                            newElement[`${element}-${element1}-${key}`] = `${element}-${element1}-${key} - ${element3}`;
                        }
                    }
    
                    if (!lines[index2]) {
                        lines[index2] = {};
                    }
                    lines[index2] = Object.assign(lines[index2], newElement);
                }
            }
        }
    }

    fileCreator("./result/sisapidoso.csv", lines.map((v) => Object.values(v)).join('\n'), "File sisapidoso.csv created");
}