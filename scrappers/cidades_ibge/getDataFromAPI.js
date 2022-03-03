const allCities = require("../../consts/ibge_codes.json");
const axios = require('axios').default;
const fileCreator = require("../../util/fileCreator");
const createBatches = require("../../util/createBatches");

module.exports = async function () {
    // Helpers
    const createJSONWithResponses = async (fileURL, successMessage, dataURLs) => {
        const dataPromises = dataURLs.map((dataURL) => 
            axios({ method: 'get', url: dataURL }).then(({ data }) => data)
        );
        const dataData = await Promise.all(dataPromises);
        const reducedData = dataData.reduce((previousValue, currentValue, i) => Object.assign(previousValue, { [dataURLs[i]]: currentValue }), {});
        fileCreator(fileURL, JSON.stringify(reducedData), successMessage);
    }

    const genURL = (URL, end, v) => URL + v.join('|') + end;

    // Subtitle ----
    const subtitles23URLs = [
        'https://servicodados.ibge.gov.br/api/v1/pesquisas/23',
        'https://servicodados.ibge.gov.br/api/v1/pesquisas/23/periodos/all/indicadores/0'
    ];
    createJSONWithResponses("./result/ibge/reducedSubtitles23.json", "File reducedSubtitles23 created", subtitles23URLs);

    const subtitles17URLs = [
        'https://servicodados.ibge.gov.br/api/v1/pesquisas/17',
        'https://servicodados.ibge.gov.br/api/v1/pesquisas/17/periodos/all/indicadores/0',
    ]
    const periodSubtitles17URLs = [2019, 2018, 2017, 2016, 2015, 2014, 2013, 2012, 2011, 2010, 2009, 2008, 2007, 2006]
        .flatMap(year => 'https://servicodados.ibge.gov.br/api/v1/pesquisas/17/periodos/'+ year + '/indicadores/0?scope=one');
    
    subtitles17URLs.push(...periodSubtitles17URLs);
    createJSONWithResponses("./result/ibge/reducedSubtitles17.json", "File reducedSubtitles17 created", subtitles17URLs);

    // Data ----
    // const data23Indicator1 = createBatches(allCities, 800).map(citiesList => genURL('https://servicodados.ibge.gov.br/api/v1/pesquisas/23/periodos/all/indicadores/1/resultados/', '?scope=sub&pt', citiesList))
    // const data23Indicator3 = createBatches(allCities, 800).map(citiesList => genURL('https://servicodados.ibge.gov.br/api/v1/pesquisas/23/periodos/all/indicadores/3/resultados/', '?scope=sub&pt', citiesList));
    // const data17Indicator0 = createBatches(allCities, 800).map(citiesList => genURL('https://servicodados.ibge.gov.br/api/v1/pesquisas/17/periodos/all/indicadores/0/resultados/', '?scope=sub&pt', citiesList));

    // createJSONWithResponses("./result/ibge/data23Indicator1.json", "File data23Indicator1 created", data23Indicator1);
    // createJSONWithResponses("./result/ibge/data23Indicator3.json", "File data23Indicator3 created", data23Indicator3);
    // createJSONWithResponses("./result/ibge/data17Indicator0.json", "File data17Indicator0 created", data17Indicator0);
}