const axios = require('axios');

async function checkComponents() {
  const url = 'https://applicationapi.teamwoodenstreet.com/api/v1/new-landingpage';
  const res = await axios.post(url, {}, { headers: { 'User-Agent': 'WoodenstreetApp/1.0' } });
  
  const mobile = res.data.data.mobile;
  console.log(`Total components in mobile array: ${mobile.length}\n`);

  mobile.forEach((c, idx) => {
    console.log(`=== Index ${idx}: Component "${c.component}" ===`);
    if (c.section) {
      console.log(`  Section Title: "${c.section.title || c.section.heading || ''}"`);
      console.log(`  Section Keys:`, Object.keys(c.section));
    }
  });

  // Check product prices and discounts across components like Top_trending_product, topSelling, deal-of-the-day, etc.
  console.log('\n--- Checking Product Pricing & Math ---');
  let invalidPrices = [];

  function checkProducts(obj, compName, path) {
    if (!obj || typeof obj !== 'object') return;
    if (Array.isArray(obj)) {
      obj.forEach((item, i) => checkProducts(item, compName, `${path}[${i}]`));
      return;
    }

    if (obj.price || obj.mrp || obj.special_price || obj.discount) {
      const price = parseFloat(obj.price || obj.special_price || 0);
      const mrp = parseFloat(obj.mrp || obj.price || 0);
      const discount = obj.discount;

      if (price <= 0 && mrp <= 0) {
        invalidPrices.push({ compName, path, issue: 'Zero or missing price', item: obj });
      }
    }

    for (const [k, v] of Object.entries(obj)) {
      if (typeof v === 'object') checkProducts(v, compName, `${path}.${k}`);
    }
  }

  checkProducts(mobile, 'mobile', 'mobile');
  console.log(`Product pricing anomalies found: ${invalidPrices.length}`);
  if (invalidPrices.length > 0) {
    console.log(JSON.stringify(invalidPrices, null, 2));
  }
}

checkComponents();
