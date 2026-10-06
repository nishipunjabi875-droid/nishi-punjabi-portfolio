const axios = require('axios');

async function printAllSummaries() {
  const url = 'https://applicationapi.teamwoodenstreet.com/api/v1/new-landingpage';
  const res = await axios.post(url, {}, { headers: { 'User-Agent': 'WoodenstreetApp/1.0' } });
  
  const mobile = res.data.data.mobile;

  mobile.forEach((c, idx) => {
    console.log(`\n====================================================`);
    console.log(`SECTION ${idx}: component = "${c.component}"`);
    console.log(`====================================================`);
    console.log(JSON.stringify(c, null, 2).substring(0, 700));
  });
}

printAllSummaries();
