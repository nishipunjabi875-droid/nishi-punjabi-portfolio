const { test, expect } = require('@playwright/test');
const axios = require('axios');
const pLimitModule = require('p-limit');
const limit = pLimitModule.default ? pLimitModule.default(15) : pLimitModule(15);

const API_ENDPOINT = 'https://applicationapi.teamwoodenstreet.com/api/v1/new-landingpage';
const IMAGE_BASE_URL = 'https://images.woodenstreet.de/image/';
const WEB_BASE_URL = 'https://www.woodenstreet.com';
const ALIAS_API_BASE = 'https://applicationapi.teamwoodenstreet.com/api/v1/urlalias/';

test.describe('New Landing Page API 404 & Link Integrity Audit', () => {

  test('Verify GET request behavior on /api/v1/new-landingpage', async () => {
    const res = await axios.get(API_ENDPOINT, { validateStatus: () => true });
    console.log(`GET ${API_ENDPOINT} returns HTTP ${res.status}:`, res.data);
    expect(res.status).toBe(404);
  });

  test('Audit all links and assets in POST /api/v1/new-landingpage', async () => {
    const res = await axios.post(API_ENDPOINT, {}, {
      headers: { 'User-Agent': 'WoodenstreetApp/1.0', 'Accept': 'application/json' },
      timeout: 10000
    });

    expect(res.status).toBe(200);
    expect(res.data.code).toBe(200);

    const rawPayload = res.data;
    const itemsToTest = [];
    const seenUrls = new Set();

    function traverse(obj, currentPath = '', componentName = 'Root') {
      if (!obj) return;

      if (typeof obj === 'object') {
        let comp = componentName;
        if (obj.component) comp = obj.component;
        if (obj.section && obj.section.title) comp += ` > ${obj.section.title}`;

        if (Array.isArray(obj)) {
          obj.forEach((child, idx) => traverse(child, `${currentPath}[${idx}]`, comp));
        } else {
          for (const [key, val] of Object.entries(obj)) {
            const fieldPath = currentPath ? `${currentPath}.${key}` : key;
            if (typeof val === 'string') {
              const str = val.trim();
              if (!str) continue;

              const isLinkKey = ['href', 'link', 'url', 'target', 'target_url', 'redirect', 'page_url', 'slug'].includes(key);
              const isImageKey = ['image', 'img', 'banner', 'icon', 'thumbnail', 'avatar'].includes(key) || key.includes('image');
              const isUrlFormat = str.startsWith('http://') || str.startsWith('https://') || str.startsWith('/') || str.includes('data/') || str.match(/\.(png|jpg|jpeg|webp|gif|svg|mp4)(\?.*)?$/i);

              if (isLinkKey || isImageKey || isUrlFormat) {
                let type = 'Other';
                let fullUrl = str;

                if (str.startsWith('http://') || str.startsWith('https://')) {
                  type = str.match(/\.(png|jpg|jpeg|webp|gif|svg|mp4)(\?.*)?$/i) ? 'Image/Media' : 'Absolute Link';
                  fullUrl = str;
                } else if (isImageKey || str.includes('data/') || str.match(/\.(png|jpg|jpeg|webp|gif|svg|mp4)(\?.*)?$/i)) {
                  type = 'Image Asset';
                  fullUrl = IMAGE_BASE_URL + str.replace(/^\/+/, '');
                } else if (str.startsWith('/') || isLinkKey) {
                  type = 'Relative Page Link';
                  const cleanSlug = str.replace(/^\/+/, '');
                  fullUrl = `${WEB_BASE_URL}/${cleanSlug}`;
                }

                const itemKey = `${comp}|${key}|${fullUrl}`;
                if (!seenUrls.has(itemKey)) {
                  seenUrls.add(itemKey);
                  itemsToTest.push({
                    path: fieldPath,
                    component: comp,
                    key,
                    rawValue: str,
                    resolvedUrl: fullUrl,
                    type,
                    slug: str.startsWith('/') ? str.replace(/^\/+/, '') : null
                  });
                }
              }
            } else {
              traverse(val, fieldPath, comp);
            }
          }
        }
      }
    }

    traverse(rawPayload);

    console.log(`Auditing ${itemsToTest.length} total extracted links and assets concurrently...`);

    const results = await Promise.all(
      itemsToTest.map(item =>
        limit(async () => {
          const itemRes = { ...item, web404: false, alias404: false };
          try {
            const method = item.type === 'Image Asset' || item.type === 'Image/Media' ? 'head' : 'get';
            const httpRes = await axios({
              method,
              url: item.resolvedUrl,
              headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
              timeout: 8000,
              validateStatus: () => true
            });

            if (httpRes.status === 404) itemRes.web404 = true;

            if (item.slug) {
              const aliasRes = await axios.get(`${ALIAS_API_BASE}${item.slug}`, {
                headers: { 'User-Agent': 'WoodenstreetApp/1.0' },
                validateStatus: () => true
              });
              if (aliasRes.status === 404) itemRes.alias404 = true;
            }
          } catch (err) {
            // ignore network edge timeout
          }
          return itemRes;
        })
      )
    );

    const fourOhFours = results.filter(r => r.web404 || r.alias404);
    console.log(`Audit complete. Total links: ${itemsToTest.length}, 404 broken items: ${fourOhFours.length}`);
    if (fourOhFours.length > 0) {
      console.log('404 Items detected:', fourOhFours.map(f => `${f.component} -> ${f.rawValue}`));
    }
  });

});
