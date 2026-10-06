const axios = require('axios');

async function auditKeysAndTypos() {
  const url = 'https://applicationapi.teamwoodenstreet.com/api/v1/new-landingpage';
  const res = await axios.post(url, {}, { headers: { 'User-Agent': 'WoodenstreetApp/1.0' } });
  
  const payload = res.data;
  console.log('--- AUDITING KEYS & TYPOS IN NEW-LANDINGPAGE API ---\n');

  const keySet = new Set();
  const pathMap = new Map();

  function scanKeys(obj, path) {
    if (!obj || typeof obj !== 'object') return;
    if (Array.isArray(obj)) {
      obj.forEach((item, i) => scanKeys(item, `${path}[${i}]`));
      return;
    }

    for (const [k, v] of Object.entries(obj)) {
      const fullPath = `${path}.${k}`;
      keySet.add(k);
      if (!pathMap.has(k)) pathMap.set(k, []);
      pathMap.get(k).push(fullPath);

      if (typeof v === 'object') {
        scanKeys(v, fullPath);
      }
    }
  }

  scanKeys(payload, 'root');

  console.log(`Total unique key names across payload: ${keySet.size}`);
  
  console.log('\n--- Key Names Found ---');
  const sortedKeys = Array.from(keySet).sort();
  console.log(sortedKeys.join(', '));

  console.log('\n--- Suspected Key Typos & Naming Issues ---');
  const suspicious = [];

  sortedKeys.forEach(k => {
    // Typos check
    if (['tite', 'subtitlee', 'subtitel', 'headdig', 'headding', 'discription', 'descripition', 'imag'].includes(k.toLowerCase())) {
      suspicious.push({ key: k, issue: 'Spelling typo in key name', samplePath: pathMap.get(k)[0] });
    }
    // Mixing case conventions
    if (k.includes('_') && /[A-Z]/.test(k)) {
      suspicious.push({ key: k, issue: 'Mixed snake_case and Pascal/camelCase', samplePath: pathMap.get(k)[0] });
    }
  });

  console.log(JSON.stringify(suspicious, null, 2));

  // Let's inspect component 4 and 12 in detail to see what values are inside subtitlee and tite
  console.log('\n--- Detail of Component 4 (INDIA_S_FINEST_FURNITURE_BRAND) ---');
  console.log(JSON.stringify(payload.data.mobile[4], null, 2));

  console.log('\n--- Detail of Component 12 (topSelling) ---');
  console.log(JSON.stringify(payload.data.mobile[12], null, 2));
}

auditKeysAndTypos();
