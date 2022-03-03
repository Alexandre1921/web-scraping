const fileCreator = require("../../util/fileCreator");
const createBatches = require("../../util/createBatches");
// data
const data17Indicator0 = require("../../result/ibge/data17Indicator0.json");
const data23Indicator1 = require("../../result/ibge/data23Indicator1.json");
const data23Indicator3 = require("../../result/ibge/data23Indicator3.json");
const reducedSubtitles17 = require("../../result/ibge/reducedSubtitles17.json");
const reducedSubtitles23 = require("../../result/ibge/reducedSubtitles23.json");

module.exports = async function () {
  const allData = [
    Object.values(data17Indicator0).flat(),
    // Object.values(data23Indicator1).flat(),
    // Object.values(data23Indicator3).flat()
  ].flat().reduce((previousValue, currentValue) => ({ ...previousValue, [currentValue['id']]: [...(previousValue?.[currentValue['id']] || []), ...currentValue['res']]}), {});

  const allSubtitles = [reducedSubtitles17, reducedSubtitles23].flat()
    .reduce((previousValue, currentValue) => ({ ...previousValue, ...currentValue }), {});
  const keys = {};

  const findChildren = (v = []) => {
    keys[v.id] = v;
    v?.children?.forEach(ind => findChildren(ind));
  };
  keys['localidade'] = { id: 'localidade' };
  Object.values(Object.values(allSubtitles).flat()).forEach(v => findChildren(v));

  const cities = {};
  Object.entries(allData).forEach(([id, values]) => {
    values.forEach(({ localidade, res }) => {
      if (!cities[localidade]) {
        cities[localidade] = { localidade };
      }
      cities[localidade][id] = res;
    });
  });

  // const header = Object.keys(cities[160080]).map((key) => `"${keys[key]?.indicador}"`).join(',');
  // console.log(header);

  const ids = Object.keys(cities[160080]).map((key) => keys[key]?.id);
  const header = ids.map(v => {
    if (typeof v === 'string') {
      return `"${v}"`;
    }
    return Object.keys(cities[160080][v]).map(vv => `"${v} - ${vv}"`).join(',');
  }).join(',');
  
  const body = Object.values(cities).map(v => Object.values(v).map(vv => {
    if (typeof vv === 'string') {
      return `"${vv}"`;
    }
    return Object.values(vv).map(v => `"${v}"`).join(',');
  }).join(',')).join('\n');

  fileCreator('./result/ibge/final17.csv', header + '\n' + body, 'successMessage');

  const finalHeader = '"id","posicao","indicador","classe","unidade - uniId", "unidade - classe","unidade - multiplicador"';
  console.log(Object.values(keys));
  const finalBody = Object.values(keys).map(({ id = 'N/A', posicao, indicador, classe, unidade: { id: uniId, classe: uniClasse, multiplicador } = { id: '-', classe: '-', multiplicador: '-' } }) => 
  `"${id}","${posicao}","${indicador}","${classe}","${uniId}","${uniClasse}","${multiplicador}"`)
  .join('\n')
  fileCreator('./result/ibge/headers.csv', finalHeader + '\n' + finalBody, 'successMessage');
}
