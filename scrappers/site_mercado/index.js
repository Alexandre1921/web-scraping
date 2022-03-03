const puppeteer = require("puppeteer");
const fileCreator = require("../../util/fileCreator");

// Closure
(function(){

	/**
	 * Ajuste decimal de um número.
	 *
	 * @param	{String}	type	O tipo de arredondamento.
	 * @param	{Number}	value	O número a arredondar.
	 * @param	{Integer}	exp		O expoente (o logaritmo decimal da base pretendida).
	 * @returns	{Number}			O valor depois de ajustado.
	 */
	function decimalAdjust(type, value, exp) {
		// Se exp é indefinido ou zero...
		if (typeof exp === 'undefined' || +exp === 0) {
			return Math[type](value);
		}
		value = +value;
		exp = +exp;
		// Se o valor não é um número ou o exp não é inteiro...
		if (isNaN(value) || !(typeof exp === 'number' && exp % 1 === 0)) {
			return NaN;
		}
		// Transformando para string
		value = value.toString().split('e');
		value = Math[type](+(value[0] + 'e' + (value[1] ? (+value[1] - exp) : -exp)));
		// Transformando de volta
		value = value.toString().split('e');
		return +(value[0] + 'e' + (value[1] ? (+value[1] + exp) : exp));
	}

	// Arredondamento decimal
	if (!Math.round) {
		Math.round = function(value, exp) {
			return decimalAdjust('round', value, exp);
		};
	}
	// Decimal arredondado para baixo
	if (!Math.floor) {
		Math.floor = function(value, exp) {
			return decimalAdjust('floor', value, exp);
		};
	}
	// Decimal arredondado para cima
	if (!Math.ceil) {
		Math.ceil = function(value, exp) {
			return decimalAdjust('ceil', value, exp);
		};
	}

})();

const getPage = async () => {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  // await page.setViewport({ width: 800, height: 600 });

  const loadTokenDelay = 10000;
  const data = {};

  const idLoja = 660;
  const mainUrl = 'https://www.sitemercado.com.br/patao/pato-branco-loja-tupi-baixada-avenida-tupi';
  
  await page.goto(mainUrl);
  const { departments } = await page.evaluate(async (idLoja) => {
    const res = await fetch(`https://www.sitemercado.com.br/api/b2c/page/menu?id_loja=${idLoja}`, {
        "headers": {
            "sm-token": `{\"IdLoja\":${idLoja}}`,
        },
    });
    const json = await res.json();
    
    return json;
  }, idLoja);

  const marketUrls = departments.flatMap(({ categories, name, url }) => 
    categories.map(({ name: nameCategory, url: urlCategory }) => ({
      department: url,
      category: urlCategory,
      urlGoTo: `${mainUrl}/produtos/${url}/${urlCategory}`,
      urlData: `https://www.sitemercado.com.br/api/b2c/product/department/${url}/category/${urlCategory}?store_id=${idLoja}`
    }))
  )

  console.log(`Categorias encontrado: ${marketUrls.length} - Tempo estimado: ${(marketUrls.length * 10) * 60}`);
  for (let index = 0; index < marketUrls.length; index++) {
    const { department, category, urlGoTo, urlData } = marketUrls[index];

    data[department] = data?.[department] ?? {};
    data[department][category] = data[department]?.[category] ?? {};

    // Go to page and wait for delay
    await page.goto(urlGoTo);
    await new Promise(r => setTimeout(r, loadTokenDelay));

    // Fetch data
    console.log(urlData);
    data[department][category] = await page.evaluate(async (url) => {
      const res = await fetch(url);
      const json = await res.json();

      return json;
    }, urlData);

    // Save current data
    fileCreator("./result/site_mercado.json", JSON.stringify(data), "File site_mercado.json created");
  }

  page.close();
  console.log(data);
  fileCreator("./result/site_mercado.json", JSON.stringify(data), "File site_mercado.json created");
}

const saveData = () => {
  const data = require("../../result/site_mercado.json");

  const formatPrice = (num) => (Math.round((num + Number.EPSILON) * 100) / 100).toFixed(2);

  const allProducts = Object.values(data)
    .flatMap((item) => Object.values(item))
    .flatMap(({ products }) => Object.values(products))
    .map(({ excerpt, prices, discount: { value = 0 } = { }, priceExclusive }) => ({
      product_name: excerpt,
      price: formatPrice(prices[prices.length - 1].price),
      discount: value !== 0,
      is_exclusive: priceExclusive,
    }));

  const header = `"product_name","price","discount","is_exclusive"\n`;
  const body = allProducts.map(v => `"${v.product_name}","${v.price}","${v.discount}","${v.is_exclusive}"`).join('\n');
  fileCreator("./result/site_mercado_res.csv", header+body, "File site_mercado_res.csv created");
}

module.exports = () => {
  // getPage();
  saveData();
}