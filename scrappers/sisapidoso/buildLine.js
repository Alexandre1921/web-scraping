function getRegion(firstRow) {
    if (firstRow[0] === 'UF' && firstRow[1] === 'Municípios' &&  firstRow[2] === 'Código') {
        return 'municipio';
    } else if (firstRow[0] === 'UFs'){
        return 'uf'
    }
    return 'brasil';
}

const getRest = (restAttrs, restValues) => restAttrs.reduce((previousValueRest, currentValueRest, index) => {
        const key = currentValueRest;
        const value = restValues[index];
        previousValueRest[key] = value;
        return previousValueRest;
}, {});

function getMunicipio(currentValue, header) {
    const [uf, municipios, codigo, ...restValues] = currentValue;
    const [,,,...restAttrs] = header;

    const rest = getRest(restAttrs, restValues);

    const newLine = {
        uf,
        municipios,
        codigo,
        ...rest
    };

    return { key: 'municipio' + codigo, newLine };
}

function getUF(currentValue, header) {
    const [uf, codigo, ...restValues] = currentValue;
    const [,,...restAttrs] = header;

    const rest = getRest(restAttrs, restValues);

    const newLine = {
        uf,
        municipios: '-',
        codigo,
        ...rest
    };

    return { key: 'uf' + codigo, newLine };
}

function getBr(currentValue, header) {
    const [, codigo, ...restValues] = currentValue;
    const [,,...restAttrs] = header;

    const rest = getRest(restAttrs, restValues);

    const newLine = {
        uf: '-',
        municipios: '-',
        codigo,
        ...rest,
    };

    return { key: 'br' + codigo, newLine };
}

const getValuesFromTable = (header, data) => {
    let callback;
    const region = getRegion(header);
    switch (region) {
        case 'municipio':
            callback = getMunicipio;
            break;
        case 'uf':
            callback = getUF;
            break;
        case 'brasil':
        default:
            callback = getBr;
            break;
    }

    data.reduce((previousValue, currentValue) => {
        const { key, newLine } = callback(currentValue, header);
        previousValue[key] = newLine;
        return previousValue;
    }, {})
};

module.exports = getValuesFromTable;