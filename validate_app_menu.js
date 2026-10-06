const axios = require('axios');
const fs = require('fs');
const pLimitModule = require('p-limit');
const pLimit = pLimitModule.default || pLimitModule;

const MENU_API = 'https://flutter.teamwoodenstreet.com/api/v1/menu';
const limit = pLimit(10);

/* ----------------------------------
   Collect all URLs recursively
-----------------------------------*/
function collectUrls(data, urls = new Set()) {
  if (!data) return urls;

  if (Array.isArray(data)) {
    data.forEach((item) => collectUrls(item, urls));
    return urls;
  }

  if (typeof data === 'object') {
    for (const key in data) {
      const value = data[key];

      if (
        key === 'url' &&
        typeof value === 'string' &&
        value.trim() &&
        !value.startsWith('http')
      ) {
        urls.add(value);
      } else {
        collectUrls(value, urls);
      }
    }
  }

  return urls;
}

/* ----------------------------------
   Fetch Menu
-----------------------------------*/
async function fetchMenu() {
  try {
    const response = await axios.get(MENU_API, {
      timeout: 15000,
    });

    // Adjust this depending on your API response structure
    return response.data?.data || response.data;
  } catch (err) {
    console.error('Failed to fetch menu:', err.response?.status || err.message);

    throw err;
  }
}

/* ----------------------------------
   Validate One URL
-----------------------------------*/
async function checkUrl(url) {
  const slug = url.replace(/^\/+/, '');

  try {
    // Step 1: Resolve alias
    const aliasRes = await axios.get(
      `https://flutter.teamwoodenstreet.com/api/v1/urlalias/${slug}`,
      {
        timeout: 10000,
      }
    );

    const alias = aliasRes.data?.data;

    if (!alias || !alias.id || !alias.type) {
      return {
        url,
        success: false,
        error: 'Alias not found',
      };
    }

    // Step 2: Call actual API
    const apiUrl = `https://api.woodenstreet.com/api/v1/${alias.type}/${alias.id}`;

    const apiRes = await axios.get(apiUrl, {
      timeout: 10000,
    });

    return {
      url,
      success: apiRes.status === 200,
      type: alias.type,
      id: alias.id,
    };
  } catch (err) {
    return {
      url,
      success: false,
      error: err.response?.status || err.message,
    };
  }
}

/* ----------------------------------
   Run
-----------------------------------*/
(async () => {
  try {
    console.log('Fetching menu...');

    const menu = await fetchMenu();

    const urls = [...collectUrls(menu)].sort();

    console.log(`Found ${urls.length} URLs...\n`);

    const results = await Promise.all(
      urls.map((url) => limit(() => checkUrl(url)))
    );

    const failed = results.filter((r) => !r.success);

    results.forEach((r) => {
      if (r.success) {
        console.log(`✅ ${r.url} -> ${r.type}/${r.id}`);
      } else {
        console.log(`❌ ${r.url} -> ${r.error}`);
      }
    });

    console.log('\n==============================');
    console.log(`Total : ${results.length}`);
    console.log(`Passed: ${results.length - failed.length}`);
    console.log(`Failed: ${failed.length}`);

    // Save ALL URLs
    fs.writeFileSync('all-urls.json', JSON.stringify(results, null, 2));

    // Save only FAILED URLs
    fs.writeFileSync('failed-urls.json', JSON.stringify(failed, null, 2));

    console.log('\nFiles generated:');
    console.log('✓ all-urls.json');
    console.log('✓ failed-urls.json');
  } catch (err) {
    console.error('\nMenu validation failed.');
    process.exit(1);
  }
})();
