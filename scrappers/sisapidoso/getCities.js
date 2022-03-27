const puppeteer = require('puppeteer');
const fileCreator = require("../../util/fileCreator");
const parcialData = require('../../result/sisapidosoParcialData.json');

console.log(parcialData);

// type - N = Numero, P = Proporcao, T = Taxa
// geograficDesagragation - Brasil, GrandesRegioes, UFs, Municipios
// sex - 0 = Todas, 1 = Masculino, 2 = Feminino

const getPage = async (code, type = 'N', geograficDesagragation = 'Municipios') => {
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    page.goto('https://www.saudeidoso.icict.fiocruz.br/novo2/ficha.php?p=1&cod=' + code);

    const selectors = {
        selectType: 'body > div:nth-child(7) > form > table > tbody > tr:nth-child(2) > td.ficha_sub5 > select',
        selectSex: '#sexo',
        radioBrasil: 'body > div:nth-child(7) > form > table > tbody > tr:nth-child(4) > td.ficha_sub5 > input[type=radio]:nth-child(1)',
        radioGrandesRegioes: 'body > div:nth-child(7) > form > table > tbody > tr:nth-child(4) > td.ficha_sub5 > input[type=radio]:nth-child(2)',
        radioUfs: 'body > div:nth-child(7) > form > table > tbody > tr:nth-child(4) > td.ficha_sub5 > input[type=radio]:nth-child(3)',
        radioMunicipios: 'body > div:nth-child(7) > form > table > tbody > tr:nth-child(4) > td.ficha_sub5 > input[type=radio]:nth-child(4)',
        send: 'body > div:nth-child(7) > form > table > tbody > tr:nth-child(5) > td > input',
    };
    await page.waitForSelector(selectors.selectType).catch(() => console.log("Err: ", code, type));

    await page.$eval(selectors.selectType, (e, type) => e.value = type, type);
    await page.$eval(selectors.selectSex, (e, sex) => e.value = sex, '0').catch((err) => err);
    switch (geograficDesagragation) {
        case 'Brasil':
            await page.$eval(selectors.radioBrasil, e => e.click());
            break;
        case 'GrandesRegioes':
            await page.$eval(selectors.radioGrandesRegioes, e => e.click());
            break;
        case 'UFs':
            await page.$eval(selectors.radioUfs, e => e.click());
            break;
        case 'Municipios':
        default:
            await page.$eval(selectors.radioMunicipios, e => e.click());
            break;
    }
    await page.$eval(selectors.send, e => e.click());

    await new Promise(r => setTimeout(r, 1000));

    let pages = await browser.pages();
    
    await pages[2].waitForSelector('body > div:nth-child(2) > table').catch(() => console.log("Err: ", code, type));

    var [, header, ...data] = await pages[2].$eval('body > div:nth-child(2) > table', (el) => [...el.rows].map(t => [...t.children].map(u => u.innerText)))

    const ArrayOfEntries = data.map(d => new Map(header.map((h,i) => [h, d[i]])));
    
    const obj = ArrayOfEntries.map(entries => Object.fromEntries(entries));

    pages.map(cPage => cPage.close());

    return obj;
}

module.exports = async function () {
    const codesP = [
        'D11', 'D12', 'D08','H01', 'H02', 'H03', 'H04', 'P02', 'P07', 'P09', 
        'P24', 'P13', 'P16','P33', 'D14',  'D13', 'D01', 'J04', 'J07', 'J03',
        'J02', 'J01', 'V01', 'I32', 'M33', 'E10', 'C13', 'F01'
    ];
    const codesN = [
        'P24', 'D14', 'D13', 'D01', 'V01', 'I32', 'M33', 'E10', 'C13'
    ];
    const codesT = ['V01', 'I32', 'M33', 'E10'];
    const codesI = ['D02'];
    const codesR = ['D06', 'D07', 'D05', 'D04'];

    const allCodes = [...new Set([codesP, codesN, codesT, codesI, codesR].flat())];
        
    const BrasilReg = {
        codesP: allCodes,
        codesN: allCodes,
        codesT: allCodes,
        codesI: allCodes,
        codesR: allCodes,
    };
    const UFsReg = BrasilReg;
    const MunicipiosReg = BrasilReg;

    const data = parcialData ? parcialData : {};
    const types = ['P', 'N', 'T', 'I', 'R'];
    const regs = [BrasilReg, UFsReg, MunicipiosReg];
    for (let i = 0; i < regs.length; i++) {
        const currentReg = regs[i];
        const regName = i === 0 ? 'Brasil' : i === 1 ? 'UFs' : 'Municipios';
        
        for (let index = 0; index < types.length; index++) {
            const currentV = currentReg['codes' + types[index]];
            for (let indexx = 0; indexx < currentV.length; indexx++) {
                if (!data[currentV[indexx]])
                    data[currentV[indexx]] = {};
                
                if (!data[currentV[indexx]]?.[types[index]])
                    data[currentV[indexx]][types[index]] = {};

                console.log('------------------------');
                console.log(currentV[indexx] + types[index] + regName);
                console.log(currentV[indexx] + ' - Type: ' + types[index] + ' - ' + regName);
                
                if (!parcialData[currentV[indexx]]?.[types[index]]?.[regName]) {
                    console.log('Not found');
                    try {
                        const res = await getPage(currentV[indexx], types[index], regName);
                        if (res) {
                            data[currentV[indexx]][types[index]][regName] = res;
                            await fileCreator("./result/sisapidosoParcialData.json", JSON.stringify(data), "File sisapidosoParcialData.json created");
                            console.log('Not Empty');
                        } else {
                            console.log('Empty, reason: ', res);
                        }
                    } catch (error) {
                        console.log("Error: " + currentV[indexx] + ' - Type: ' + types[index] + ' - ' + regName);
                    }
                } else {
                    console.log('Found');
                }
            }
        }
    }

    console.log(data);
    console.log(data.length);
    fileCreator("./result/sisapidosoFinalData.json", JSON.stringify(data), "File sisapidosoFinalData.json created");
}