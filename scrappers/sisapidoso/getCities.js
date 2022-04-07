const puppeteer = require('puppeteer');
const fileCreator = require("../../util/fileCreator");
const parcialData = require('../../result/sisapidosoParcialData.json');
// const buildLines = require('./buildLines');
const getValuesFromTable = require('./getValuesFromTable');

const admin = require('firebase-admin');
const { initializeApp, applicationDefault, cert } = require('firebase-admin/app');
const { getFirestore, Timestamp, FieldValue } = require('firebase-admin/firestore');

process.env.FIRESTORE_EMULATOR_HOST = 'localhost:8080';

initializeApp({ credential: admin.credential.cert({
    "type": "service_account",
    "project_id": "bike-turismo",
    "private_key_id": "7c2b6b5c91c34fe27dbde90ab7f13fd153a9442d",
    "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQCsqack7CvnXWel\nOubxf1DnLfv6KVY3ZJTtdtz22UxHKAzCdgMD/nkddDzJ26JQNZj9+/B9OYjPy1JF\nzC6Sc1cWd8piJCuBYjnpSJixx11BWfYkFW/JogAWJIarXEzgqtIgqmHUFbLWoc9s\nQTrgey2iLb6Lsc8i8g3tl3aYHxUo3Lk4hCXIAcLWxOjnNaCmzUMlVZiko4hgmmqm\nW9iFFLPXhXt4nsAbNW7HcIMndtZPWang8U6Rn4WauMJucQRCEq43WWgOchkXslJF\n7Bbkfu/egRkRwebSdNTQIAw1Q9eBqE+2xhISDiiKC+MhGdqLp0Hg3fwuuORY7mQk\nfn7/t9tDAgMBAAECggEAKO5O4UHbZo2N9G1yMe2skCEmirch6R++7kwvNZVtr7Ce\n1bqEHH5G1+SmRHP8lmceTZdb+1OYSyo35rPwlmchTgI3x+wrJBDVCahcCkjoooVh\nBEzQo0v0GUuvYRAQaXIVPgkmB9DdBGR3d4I/ItgQiVGuyg7su6wGATzWsFkt+vF0\nNrVswl8dt5Q3vuPejaHrsJLLRj3/UEb8x1JLR4qYeTLXnSYAPLq/JpMjcdV3NuoF\naJUZi2YFC3cMn2Q/2f+1ZVkQUYkHT1CZPaKbSQlgUpjfGeN13F0QpEdPtMmx02nL\nESyzRNQqVH2GQq+q0nZx+lx+zm4QNQZDF+ri9eFDgQKBgQDj0gLplk2L1iqQWWlD\nJILrhhiJwJkBClNvwZIbpxF7hJjCpcUA1eDacclpzEeMtgp1FmXYDfbQM2DeHPl1\nRSMeiYyj/4zOGrgw3CYZIQizEqbVrT3H8zP1f8WTVCJqMo4FtY+ElxqD75z2y5CE\nw5fDlSdTcbE+bovcI4VbjAFcDwKBgQDCBQ+L80mzVTOJA3TghCDL2UP7O2sx8blz\naFzPKQ4HfKhsoVMRODsS3N2CNIutlIsdSKhtzkcnArHs6ZOEeJfG9hBt714pGqOD\nhLvTY2sCmNFFdNHmdG29zwk0IdUf2EVJ0vJ1dpxj3g+R5nGl5QppMNjIMiPhctjG\nQRKIamppjQKBgAuahL91Aloe/GgBxdS/pVNtrw5FGwXsirdkepah+cf6xvUTEGes\nfRljNkkHOJW4J+wyydkpTOrp0wM9Io+Qh+tkQh+QQpG01rDWZbJd9l14k7rKah0n\nC/xzF5Mbc+1IyecMilTMhXM23x3K3H+GntI9ZJVhcw+k/camoII7LU6NAoGBAIf/\naCBfTn/n7xHRXHGr7Bk3mBFYWxFNMQMWWkfTrUPOO3i5tDJTygS00IfeMTJg9wp1\nzan6d6F+oB1CtOacaTdLb8S/jq8dPxSHS+kmvPG7EKWw9xik7++mWfsy4+NIg3j1\n5oIzu/e8xgktEOiKHbwSQ0JA8ymqiQyevFDm1uRZAoGAdbKZa7pAYOcYKCJ/stYi\nCboxsvo2Am2JiUD2xdU5SCCr5GlEttxKfEMQx7uOQXjdeYvqnWN1c13nZ6//KF31\nl2pvEwAYZHC+q8AXcBEREuqOUDxm9vdI+P1Wm+0fl4oWp5luiNfqqrxzOeCKcHz9\n1+syO9mP+C+1p3yhHm51RdA=\n-----END PRIVATE KEY-----\n",
    "client_email": "firebase-adminsdk-5i4ko@bike-turismo.iam.gserviceaccount.com",
    "client_id": "102445644501992100414",
    "auth_uri": "https://accounts.google.com/o/oauth2/auth",
    "token_uri": "https://oauth2.googleapis.com/token",
    "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
    "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-5i4ko%40bike-turismo.iam.gserviceaccount.com"
})});

const db = getFirestore();

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

    await new Promise(resolve => setTimeout(resolve, 1000));

    let pages = await browser.pages();
    
    await pages[2].waitForSelector('body > div:nth-child(2) > table').catch(() => console.log("Err: ", code, type));

    const [, header, ...data] = await pages[2].$eval('body > div:nth-child(2) > table', (el) => [...el.rows].map(t => [...t.children].map(u => u.innerText)))

    pages.map(cPage => cPage.close());

    const valuesFromTable = getValuesFromTable(header, data);
    const keys = Object.keys(valuesFromTable);
    const values = Object.values(valuesFromTable);

    // for (let index = 0; index < keys.length; index++) {
    //     console.log(index);
    //     const key = keys[index];
    //     await new Promise(resolve => setTimeout(resolve, 100));
    //     await db.collection("docs").doc(key).set({[code + type]: values[index]})
    // }
    return Promise.all(keys.map((key, index) => db.collection("docs").doc(key).update(code + type, values[index]).catch(()=>db.collection("docs").doc(key).set({[code + type]: values[index]})))) 
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
    const regs = [
        // BrasilReg,
        UFsReg, 
        MunicipiosReg];
    for (let i = 0; i < regs.length; i++) {
        const currentReg = regs[i];
        const regName = i === 0 ? 'UFs' : 'Municipios';
        
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
                            // db.doc(currentV[indexx] + ' - Type: ' + types[index] + ' - ' + regName).set(res);
                            // data[currentV[indexx]][types[index]][regName] = res;
                            // await fileCreator("./result/sisapidosoParcialData.json", JSON.stringify(data), "File sisapidosoParcialData.json created");
                            console.log('Not Empty');
                        } else {
                            console.log('Empty, reason: ', res);
                        }
                    } catch (error) {
                        console.log(error);
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