const https = require('https');
const http = require('http');

const urls = [
  'https://beta.teamwoodenstreet.com/sofa-buying-guide',
  'https://beta.teamwoodenstreet.com/beds-buying-guide',
  'https://beta.teamwoodenstreet.com/dining-buying-guide',
  'https://beta.teamwoodenstreet.com/tv-unit-buying-guide',
  'https://beta.teamwoodenstreet.com/mattress-buying-guide',
  'https://beta.teamwoodenstreet.com/wardrobe-buying-guide'
];

async function checkUrl(url) {
  try {
    const res = await fetch(url, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
      },
      redirect: 'manual'
    });
    
    const text = await res.text();
    const titleMatch = text.match(/<title>(.*?)<\/title>/i);
    const title = titleMatch ? titleMatch[1].trim() : 'No title found';
    
    const is404Body = text.includes('404') || 
                      text.toLowerCase().includes('page not found') || 
                      text.toLowerCase().includes('page break') ||
                      text.toLowerCase().includes('looking for');
                      
    const h1Match = text.match(/<h1[^>]*>(.*?)<\/h1>/gi);

    return {
      url,
      status: res.status,
      statusText: res.statusText,
      redirectLocation: res.headers.get('location'),
      title,
      h1: h1Match ? h1Match.map(h => h.replace(/<[^>]+>/g, '').trim()) : [],
      is404Body
    };
  } catch (err) {
    return {
      url,
      error: err.message
    };
  }
}

async function run() {
  console.log('--- LINK CHECK RESULTS ---');
  for (const url of urls) {
    const result = await checkUrl(url);
    console.log(JSON.stringify(result, null, 2));
  }
}

run();
