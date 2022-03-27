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
    const indicadores = Object.keys(parcialData);
    const tipos = Object.keys(Object.values(parcialData)[0]);
    // const desagregacaoGeografica = ['Brasil', 'UFs', 'Municipios'];

    const BrasilData = {subtitles: {}, data: {}};
    const UFsData = {subtitles: {}, data: {}};
    const MunicipiosData = {subtitles: {}, data: {}};
    for (let i = 0; i < indicadores.length; i++) {
        const element = parcialData[indicadores[i]];
        for (let i1 = 0; i1 < tipos.length; i1++) {
            const element1 = element[tipos[i1]];
            
            if (element1?.['Brasil']) {
                MunicipiosData[indicadores[i] + tipos[i1]] = {
                    data: element1['Brasil'].map(getDataFromElement),
                    subtitle: element1['Brasil'].map(v => getSubtitleFromElement(v, indicadores[i] + '|' + tipos[i1] + '|' + 'BR|'))[0]
                }
            }
            if (element1?.['UFs']) {
                UFsData[indicadores[i] + tipos[i1]] = {
                    data: element1['UFs'].map(getDataFromElement),
                    subtitle: element1['UFs'].map(v => getSubtitleFromElement(v, indicadores[i] + '|' + tipos[i1] + '|' + 'UF|'))[0]
                }
            }
            if (element1?.['Municipios']) {
                MunicipiosData[indicadores[i] + tipos[i1]] = {
                    data: element1['Municipios'].map(getDataFromElement),
                    subtitle: element1['Municipios'].map(v => getSubtitleFromElement(v, indicadores[i] + '|' + tipos[i1] + '|' + 'MUN|'))[0]
                }
            }
        }
    }

    const final = [];
    for (const key in BrasilData) {
        if (Object.hasOwnProperty.call(BrasilData, key)) {
            const { data, subtitle } = BrasilData[key];
            if (data) {
                final.push(subtitle + '\n' + data.join('\n'));
            }
        }
    }

    for (const key in UFsData) {
        if (Object.hasOwnProperty.call(UFsData, key)) {
            const { data, subtitle } = UFsData[key];
            if (data) {
                final.push(subtitle + '\n' + data.join('\n'));
            }
        }
    }

    for (const key in MunicipiosData) {
        if (Object.hasOwnProperty.call(MunicipiosData, key)) {
            const { data, subtitle } = MunicipiosData[key];
            if (data) {
                final.push(subtitle + '\n' + data.join('\n'));
            }
        }
    }

    fileCreator("./result/sisapidoso.csv", final.join('\n\n'), "File sisapidoso.csv created");
}