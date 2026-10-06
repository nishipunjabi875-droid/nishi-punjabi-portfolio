const axios = require('axios');

async function checkMoreDetails() {
  const url = 'https://applicationapi.teamwoodenstreet.com/api/v1/new-landingpage';
  const res = await axios.post(url, {}, { headers: { 'User-Agent': 'WoodenstreetApp/1.0' } });
  
  const mobile = res.data.data.mobile;

  console.log('--- Section 1 (hero-swiper) ---');
  console.log(JSON.stringify(mobile[1], null, 2));

  console.log('\n--- Section 2 (usp-strip) ---');
  console.log(JSON.stringify(mobile[2], null, 2));

  console.log('\n--- Section 8 (mid-banners2) ---');
  console.log(JSON.stringify(mobile[8], null, 2));

  console.log('\n--- Section 9 (mid-banners3) & 11 (mid-banners4) link formats ---');
  console.log('mid-banners3 link:', mobile[9].sections.link);
  console.log('mid-banners4 link:', mobile[11].sections.link);
}

checkMoreDetails();
