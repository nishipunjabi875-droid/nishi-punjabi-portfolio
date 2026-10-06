const axios = require('axios');

async function inspectLandingPageAPI() {
  const url = 'https://applicationapi.teamwoodenstreet.com/api/v1/new-landingpage';
  
  console.log('====================================================');
  console.log('AUDITING API: GET & POST behavior for new-landingpage');
  console.log('====================================================\n');

  // 1. Check HTTP Methods & Headers
  console.log('--- 1. HTTP Methods Check ---');
  try {
    const getRes = await axios.get(url, { validateStatus: () => true });
    console.log(`GET Method Status: ${getRes.status}`);
    console.log(`GET Response Body:`, getRes.data);
  } catch (err) {
    console.log('GET Error:', err.message);
  }

  let postRes;
  const startTime = Date.now();
  try {
    postRes = await axios.post(url, {}, {
      headers: {
        'User-Agent': 'WoodenstreetApp/1.0',
        'Accept': 'application/json'
      },
      validateStatus: () => true
    });
    const endTime = Date.now();
    console.log(`\nPOST Method Status: ${postRes.status} (Response Time: ${endTime - startTime} ms)`);
    console.log('Response Headers:', {
      'content-type': postRes.headers['content-type'],
      'cache-control': postRes.headers['cache-control'],
      'access-control-allow-origin': postRes.headers['access-control-allow-origin'],
      'server': postRes.headers['server']
    });
  } catch (err) {
    console.error('POST Error:', err.message);
    return;
  }

  const payload = postRes.data;

  // 2. Structural & Schema Sanity
  console.log('\n--- 2. Root Schema Sanity ---');
  console.log(`Payload Top Keys:`, Object.keys(payload));
  console.log(`code: ${payload.code} (Type: ${typeof payload.code})`);
  console.log(`message: "${payload.message}" (Type: ${typeof payload.message})`);
  console.log(`data type: ${Array.isArray(payload.data) ? 'Array' : typeof payload.data}`);

  if (!payload.data) {
    console.error('CRITICAL: "data" field is missing or null!');
    return;
  }

  const sections = Array.isArray(payload.data) ? payload.data : [payload.data];
  console.log(`Total sections/components in data: ${sections.length}`);

  // 3. Detailed Component Deep Dive
  console.log('\n--- 3. Detailed Component & Section Analysis ---');
  
  const issues = [];
  const allImageUrls = [];
  const allLinkUrls = [];

  sections.forEach((sec, idx) => {
    console.log(`\n[Section ${idx}]`);
    console.log(`  Keys:`, Object.keys(sec));
    console.log(`  Component/Type:`, sec.component || sec.type || sec.section_type || 'NOT SPECIFIED');
    console.log(`  Title/Heading:`, sec.title || sec.heading || sec.name || 'N/A');

    // Check for missing component/type identifier
    if (!sec.component && !sec.type && !sec.section_type) {
      issues.push({
        severity: 'MEDIUM',
        category: 'Schema',
        sectionIndex: idx,
        message: 'Section lacks a "component", "type", or "section_type" discriminator property.'
      });
    }

    // Deep object traversal for links, images, null/undefined values, malformed data
    function scanObject(obj, path) {
      if (!obj || typeof obj !== 'object') return;

      if (Array.isArray(obj)) {
        obj.forEach((item, i) => scanObject(item, `${path}[${i}]`));
        return;
      }

      for (const [key, val] of Object.entries(obj)) {
        const currentPath = `${path}.${key}`;

        if (val === null || val === undefined) {
          if (['title', 'image', 'link', 'url', 'href', 'price', 'discount'].includes(key.toLowerCase())) {
            issues.push({
              severity: 'LOW',
              category: 'Null Value',
              path: currentPath,
              message: `Field '${key}' is ${val}`
            });
          }
        } else if (typeof val === 'string') {
          const strVal = val.trim();
          
          if (strVal === '' && ['title', 'image', 'link', 'url', 'href'].includes(key.toLowerCase())) {
            issues.push({
              severity: 'LOW',
              category: 'Empty String',
              path: currentPath,
              message: `Field '${key}' is empty string ""`
            });
          }

          // Detect Images
          const isImgKey = ['image', 'img', 'banner', 'icon', 'thumbnail', 'avatar'].some(k => key.toLowerCase().includes(k));
          const isImgExt = /\.(png|jpg|jpeg|webp|gif|svg|mp4)(\?.*)?$/i.test(strVal);

          if (isImgKey || isImgExt) {
            allImageUrls.push({ path: currentPath, raw: strVal, sectionIndex: idx });
          }

          // Detect Links/URLs
          const isLinkKey = ['href', 'link', 'url', 'target', 'target_url', 'redirect', 'page_url', 'slug'].includes(key.toLowerCase());
          if (isLinkKey && !isImgKey && !isImgExt) {
            allLinkUrls.push({ path: currentPath, raw: strVal, sectionIndex: idx });
          }
        } else if (typeof val === 'object') {
          scanObject(val, currentPath);
        }
      }
    }

    scanObject(sec, `data[${idx}]`);
  });

  console.log(`\nExtracted ${allImageUrls.length} image reference(s) and ${allLinkUrls.length} link reference(s).`);

  // Print Issues found so far
  console.log(`\n--- 4. Issues Identified During Structural Scan (${issues.length}) ---`);
  if (issues.length === 0) {
    console.log('No structural/schema issues detected in JSON response!');
  } else {
    issues.forEach(i => console.log(`[${i.severity}] [${i.category}] Path: ${i.path || 'Section ' + i.sectionIndex} -> ${i.message}`));
  }

  // Print Sample Payload preview
  console.log('\n--- 5. First Section Full Payload Preview ---');
  console.log(JSON.stringify(sections[0], null, 2).substring(0, 1500));
}

inspectLandingPageAPI();
