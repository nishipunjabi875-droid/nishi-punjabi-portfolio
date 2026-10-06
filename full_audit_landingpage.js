const axios = require('axios');
const pLimitModule = require('p-limit');
const limit = pLimitModule.default ? pLimitModule.default(20) : pLimitModule(20);

const API_ENDPOINT = 'https://applicationapi.teamwoodenstreet.com/api/v1/new-landingpage';
const IMAGE_BASE_URL = 'https://images.woodenstreet.de/image/';
const WEB_BASE_URL = 'https://www.woodenstreet.com';
const ALIAS_API_BASE = 'https://applicationapi.teamwoodenstreet.com/api/v1/urlalias/';

async function auditLandingPage() {
  console.log('Starting full audit of https://applicationapi.teamwoodenstreet.com/api/v1/new-landingpage ...\n');
  
  const startTime = Date.now();
  let res;
  try {
    res = await axios.post(API_ENDPOINT, {}, {
      headers: {
        'User-Agent': 'WoodenstreetApp/1.0',
        'Accept': 'application/json'
      },
      timeout: 15000
    });
  } catch (err) {
    console.error('API request failed:', err.message);
    return;
  }

  const responseTime = Date.now() - startTime;
  console.log(`API Response Status: ${res.status}`);
  console.log(`API Response Time: ${responseTime} ms`);
  console.log(`Payload keys:`, Object.keys(res.data));

  const dataObj = res.data.data || {};
  console.log(`data keys:`, Object.keys(dataObj));

  const mobileComponents = dataObj.mobile || [];
  console.log(`Total components in 'data.mobile': ${mobileComponents.length}`);

  const auditReport = {
    summary: {
      responseTimeMs: responseTime,
      totalComponents: mobileComponents.length,
      componentNames: [],
      totalImagesFound: 0,
      totalLinksFound: 0,
      brokenImages: [],
      brokenLinks: [],
      schemaWarnings: [],
      emptyFields: []
    }
  };

  mobileComponents.forEach((comp, idx) => {
    const compName = comp.component || `component_${idx}`;
    auditReport.summary.componentNames.push(compName);
  });

  const imagesToTest = [];
  const linksToTest = [];

  function traverse(obj, path, currentComp) {
    if (!obj) return;
    if (typeof obj === 'object') {
      let compName = currentComp;
      if (obj.component) compName = obj.component;

      if (Array.isArray(obj)) {
        obj.forEach((item, i) => traverse(item, `${path}[${i}]`, compName));
      } else {
        for (const [key, val] of Object.entries(obj)) {
          const fieldPath = `${path}.${key}`;

          if (val === null || val === undefined) {
            auditReport.summary.emptyFields.push({
              path: fieldPath,
              component: compName,
              key,
              val: String(val)
            });
          } else if (typeof val === 'string') {
            const str = val.trim();
            if (str === '') {
              auditReport.summary.emptyFields.push({
                path: fieldPath,
                component: compName,
                key,
                val: '"" (empty string)'
              });
            }

            const isImgKey = ['image', 'img', 'banner', 'icon', 'thumbnail', 'avatar'].some(k => key.toLowerCase().includes(k));
            const isImgExt = /\.(png|jpg|jpeg|webp|gif|svg|mp4)(\?.*)?$/i.test(str);
            const isLinkKey = ['href', 'link', 'url', 'target', 'target_url', 'redirect', 'page_url', 'slug'].includes(key.toLowerCase());

            if (isImgKey || isImgExt) {
              let fullImgUrl = str;
              if (!str.startsWith('http://') && !str.startsWith('https://')) {
                fullImgUrl = IMAGE_BASE_URL + str.replace(/^\/+/, '');
              }
              imagesToTest.push({
                path: fieldPath,
                component: compName,
                key,
                raw: str,
                resolvedUrl: fullImgUrl
              });
            } else if (isLinkKey) {
              let fullLinkUrl = str;
              let slug = null;
              if (str.startsWith('http://') || str.startsWith('https://')) {
                fullLinkUrl = str;
              } else {
                slug = str.replace(/^\/+/, '');
                fullLinkUrl = `${WEB_BASE_URL}/${slug}`;
              }
              linksToTest.push({
                path: fieldPath,
                component: compName,
                key,
                raw: str,
                resolvedUrl: fullLinkUrl,
                slug
              });
            }
          } else if (typeof val === 'object') {
            traverse(val, fieldPath, compName);
          }
        }
      }
    }
  }

  traverse(mobileComponents, 'mobile', 'Root');

  // Remove duplicate URLs to avoid redundant HTTP calls
  const uniqueImagesMap = new Map();
  imagesToTest.forEach(img => {
    if (!uniqueImagesMap.has(img.resolvedUrl)) {
      uniqueImagesMap.set(img.resolvedUrl, []);
    }
    uniqueImagesMap.get(img.resolvedUrl).push(img);
  });

  const uniqueLinksMap = new Map();
  linksToTest.forEach(lnk => {
    if (!uniqueLinksMap.has(lnk.resolvedUrl)) {
      uniqueLinksMap.set(lnk.resolvedUrl, []);
    }
    uniqueLinksMap.get(lnk.resolvedUrl).push(lnk);
  });

  auditReport.summary.totalImagesFound = imagesToTest.length;
  auditReport.summary.totalLinksFound = linksToTest.length;

  console.log(`Extracted ${imagesToTest.length} image refs (${uniqueImagesMap.size} unique) and ${linksToTest.length} link refs (${uniqueLinksMap.size} unique).`);
  console.log('Validating HTTP status of all image and link assets concurrently...\n');

  // Test Images
  const imgResults = await Promise.all(
    Array.from(uniqueImagesMap.keys()).map(url =>
      limit(async () => {
        try {
          const res = await axios.head(url, {
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
            timeout: 7000,
            validateStatus: () => true
          });
          if (res.status >= 400) {
            // Retry with GET if HEAD is rejected by CDN
            const getRes = await axios.get(url, {
              headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
              timeout: 7000,
              validateStatus: () => true
            });
            return { url, status: getRes.status, ok: getRes.status === 200 };
          }
          return { url, status: res.status, ok: res.status === 200 };
        } catch (err) {
          return { url, status: 'ERROR', error: err.message, ok: false };
        }
      })
    )
  );

  imgResults.forEach(res => {
    if (!res.ok) {
      const occurrences = uniqueImagesMap.get(res.url);
      auditReport.summary.brokenImages.push({
        url: res.url,
        status: res.status,
        error: res.error,
        occurrences: occurrences.map(o => ({ component: o.component, path: o.path, raw: o.raw }))
      });
    }
  });

  // Test Links
  const linkResults = await Promise.all(
    Array.from(uniqueLinksMap.keys()).map(url =>
      limit(async () => {
        const occurrences = uniqueLinksMap.get(url);
        const sampleLnk = occurrences[0];
        let webStatus = 200;
        let aliasStatus = 200;
        let aliasData = null;

        try {
          const webRes = await axios.get(url, {
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
            timeout: 7000,
            validateStatus: () => true
          });
          webStatus = webRes.status;
        } catch (err) {
          webStatus = 'TIMEOUT/ERROR: ' + err.message;
        }

        if (sampleLnk.slug) {
          try {
            const aliasRes = await axios.get(`${ALIAS_API_BASE}${sampleLnk.slug}`, {
              headers: { 'User-Agent': 'WoodenstreetApp/1.0' },
              timeout: 7000,
              validateStatus: () => true
            });
            aliasStatus = aliasRes.status;
            aliasData = aliasRes.data;
          } catch (err) {
            aliasStatus = 'TIMEOUT/ERROR: ' + err.message;
          }
        }

        return {
          url,
          webStatus,
          aliasStatus,
          aliasData,
          ok: (webStatus === 200 || webStatus === 301 || webStatus === 302) && (aliasStatus === 200 || !sampleLnk.slug)
        };
      })
    )
  );

  linkResults.forEach(res => {
    if (!res.ok) {
      const occurrences = uniqueLinksMap.get(res.url);
      auditReport.summary.brokenLinks.push({
        url: res.url,
        webStatus: res.webStatus,
        aliasStatus: res.aliasStatus,
        aliasData: res.aliasData,
        occurrences: occurrences.map(o => ({ component: o.component, path: o.path, raw: o.raw }))
      });
    }
  });

  console.log('====================================================');
  console.log('AUDIT SUMMARY RESULTS');
  console.log('====================================================');
  console.log(`Total Components Audited: ${auditReport.summary.totalComponents}`);
  console.log(`Component List:\n - ${auditReport.summary.componentNames.join('\n - ')}\n`);
  console.log(`Total Image Assets Checked: ${auditReport.summary.totalImagesFound}`);
  console.log(`Broken Images (404/Error): ${auditReport.summary.brokenImages.length}`);
  console.log(`Total Links Checked: ${auditReport.summary.totalLinksFound}`);
  console.log(`Broken Links (404/Alias Failed): ${auditReport.summary.brokenLinks.length}`);
  console.log(`Empty/Null Fields Detected: ${auditReport.summary.emptyFields.length}`);

  if (auditReport.summary.brokenImages.length > 0) {
    console.log('\n--- BROKEN IMAGES ---');
    console.log(JSON.stringify(auditReport.summary.brokenImages, null, 2));
  }

  if (auditReport.summary.brokenLinks.length > 0) {
    console.log('\n--- BROKEN LINKS ---');
    console.log(JSON.stringify(auditReport.summary.brokenLinks, null, 2));
  }

  if (auditReport.summary.emptyFields.length > 0) {
    console.log('\n--- EMPTY / NULL FIELDS SAMPLE ---');
    console.log(JSON.stringify(auditReport.summary.emptyFields.slice(0, 15), null, 2));
  }

  return auditReport;
}

auditLandingPage();
