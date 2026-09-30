const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const { parseHTML } = require(process.env.WISHLIST_TEST_DOM || 'linkedom');
const source = fs.readFileSync('scriptable/Wishlist Sync.js', 'utf8').replace('await main();\nScript.complete();', '');
const context = vm.createContext({});
vm.runInContext(source, context);
const read = context.readAmazonProductDocument.toString();
const asin = 'B012345678';
const title = '<span id="productTitle">Test Product</span><input id="ASIN" value="B012345678">';
const image = 'https://m.media-amazon.com/images/I/TEST.jpg';
const price = (amount, cls = '') => `<span class="a-price ${cls}"><span class="a-offscreen">￥${amount}</span></span>`;
(async () => {
  {
    async function parse(html) {
      const { document } = parseHTML(`<html><body>${html}</body></html>`);
      return context.readAmazonProductDocument(document, asin);
    }
    let cases = 0;
    async function check(html, expected) {
      const result = await parse(html);
      for (const [key, value] of Object.entries(expected)) assert.equal(result[key], value, `${key}: ${html}`);
      cases++;
    }
    await check(title + '<div id="corePriceDisplay_desktop_feature_div">' + price('9,999', 'a-text-price') + price('7,980') + '</div>', { price: 7980 });
    await check(title + '<div id="availability">In stock</div><aside>Related product: currently unavailable</aside><div id="corePrice_feature_div">' + price('1,234') + '</div>', { price: 1234, availability: 'available' });
    await check(title + '<div id="corePriceDisplay_mobile_feature_div"><span class="a-price priceToPay"><span class="a-price-whole">２，９８０</span><span class="a-price-fraction">00</span></span></div><img id="main-image" data-src="'+image+'">', { price: 2980, imageUrl: image });
    await check(title + '<div id="corePrice_feature_div"><div style="display:none">' + price('800') + '</div>' + price('900') + '</div>', { price: 900 });
    await check(title + '<div id="corePrice_feature_div">' + price('9,999', 'a-text-price') + '</div><aside>'+price('500')+'</aside>', { price: null });
    await check(title + '<div id="availability">現在在庫切れです。</div><aside>'+price('1000')+'</aside>', { price: null, availability: 'unavailable' });
    await check('<title>Amazon</title><form action="/errors/validateCaptcha"></form>', { validProduct: false });
    await check(title.replace(asin, 'B098765432'), { validProduct: false });
    await check(title + '<meta content="'+image+'" property="og:image">', { imageUrl: image });
    await check(title + `<img id="landingImage" data-a-dynamic-image='{"https://m.media-amazon.com/images/I/SMALL.jpg":[100,100],"${image}":[1000,1000]}'>`, { imageUrl: image });
    await check(title + '<div id="corePrice_feature_div">'+price('2,000.50')+'</div>', { price: null });
    assert.equal(context.cleanAmazonImageUrl('https://m.media-amazon.com/images/I/TEST._AC_SL1500_.jpg'), image);
    console.log(`PASS: ${cases} parsed HTML cases and image URL normalization`);
  }

})().catch(error => { console.error(error); process.exitCode = 1; });
