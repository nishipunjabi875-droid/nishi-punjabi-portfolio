const { chromium } = require('playwright');
const ExcelJS = require('exceljs');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

(async () => {
    console.log('================================================================');
    console.log(' WoodenStreet Production Homepage Links & 404 Audit (Playwright)');
    console.log(' Viewports: Desktop (1440x900) & Mobile (375x812 iPhone)');
    console.log('================================================================\n');

    const targetUrl = process.env.TARGET_URL || process.env.BASE_URL || 'https://www.woodenstreet.com/';
    console.log(`🎯 Target Environment URL: ${targetUrl}\n`);

    const browser = await chromium.launch({ 
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const allExtractedItems = [];

    // -------------------------------------------------------------
    // 1. DESKTOP VIEWPORT AUDIT SCAN (1440x900)
    // -------------------------------------------------------------
    console.log('[1/6] Launching Desktop context (1440x900) & navigating...');
    const desktopContext = await browser.newContext({
        viewport: { width: 1440, height: 900 },
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    });
    const desktopPage = await desktopContext.newPage();

    try {
        await desktopPage.goto(targetUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });
        await desktopPage.waitForTimeout(3000);
    } catch (e) {
        console.log(`Desktop load note: ${e.message}`);
    }

    console.log('[2/6] Hovering mega menu items on Desktop to reveal subcategories...');
    const topNavSelectors = [
        'header nav a', 'header ul li', '.navigation a', '.header-menu a', 
        '.nav-item', 'header a', '.main-menu > li', '.menu-item'
    ];
    for (const selector of topNavSelectors) {
        const items = await desktopPage.$$(selector);
        if (items.length > 0) {
            console.log(`  - Hovering ${items.length} top navigation items...`);
            for (let i = 0; i < Math.min(items.length, 35); i++) {
                try {
                    await items[i].hover({ timeout: 600 }).catch(() => {});
                } catch (e) {}
            }
            break;
        }
    }

    console.log('  - Scrolling Desktop page to load lazy sections & footer...');
    await desktopPage.evaluate(async () => {
        await new Promise((resolve) => {
            let totalHeight = 0;
            const distance = 400;
            const timer = setInterval(() => {
                const scrollHeight = document.body.scrollHeight;
                window.scrollBy(0, distance);
                totalHeight += distance;
                if (totalHeight >= scrollHeight || totalHeight > 30000) {
                    clearInterval(timer);
                    resolve();
                }
            }, 100);
        });
    });
    await desktopPage.waitForTimeout(2000);

    const desktopLinks = await desktopPage.evaluate((sourcePage) => {
        const anchors = Array.from(document.querySelectorAll('a'));
        return anchors.map((a, index) => {
            const rawHref = a.getAttribute('href') || '';
            const fullUrl = a.href || '';
            let text = (a.innerText || a.textContent || '').trim().replace(/\s+/g, ' ');
            if (!text) {
                const img = a.querySelector('img');
                if (img) text = img.getAttribute('alt') || img.getAttribute('title') || '[Banner / Image Link]';
                else text = a.getAttribute('title') || a.getAttribute('aria-label') || '[Icon / Link]';
            }

            let section = 'Desktop Body Section';
            if (a.closest('header') || a.closest('.header') || a.closest('#header')) section = 'Header Top Bar / Nav';
            else if (a.closest('.mega-menu') || a.closest('.nav-dropdown') || a.closest('.menu-dropdown') || a.closest('.dropdown-menu')) section = 'Header Mega Menu';
            else if (a.closest('footer') || a.closest('.footer') || a.closest('#footer')) section = 'Desktop Footer';
            else if (a.closest('.banner') || a.closest('.hero') || a.closest('.slider') || a.closest('.main-slider')) section = 'Hero Banner Carousel';

            return {
                device: 'Desktop',
                sourceUrl: sourcePage,
                rawHref,
                fullUrl,
                linkText: text.substring(0, 120),
                section
            };
        });
    }, targetUrl);

    console.log(`  - Total Desktop anchor elements extracted: ${desktopLinks.length}`);
    allExtractedItems.push(...desktopLinks);
    await desktopContext.close();


    // -------------------------------------------------------------
    // 2. MOBILE VIEWPORT AUDIT SCAN (375x812 iPhone 13)
    // -------------------------------------------------------------
    console.log('\n[3/6] Launching Mobile context (375x812 iPhone) & navigating...');
    const mobileContext = await browser.newContext({
        viewport: { width: 375, height: 812 },
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1',
        isMobile: true,
        hasTouch: true
    });
    const mobilePage = await mobileContext.newPage();

    try {
        await mobilePage.goto(targetUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });
        await mobilePage.waitForTimeout(3000);
    } catch (e) {
        console.log(`Mobile load note: ${e.message}`);
    }

    console.log('[4/6] Opening Mobile Hamburger Menu & Category Drawers...');
    const menuTriggers = [
        'header .hamburger', 'header .menu-icon', 'header [aria-label="menu"]',
        '#menu-toggle', '.mobile-menu-toggle', '.header-hamburger', '.burger-menu',
        '.cat-menu', '.category-slider a', '.category-list a', '.nav-toggle',
        '.header-left button', '.mobile-nav-icon', '.sidebar-toggle', '.menu-btn'
    ];
    for (const sel of menuTriggers) {
        try {
            const btns = await mobilePage.$$(sel);
            for (const btn of btns) {
                if (await btn.isVisible()) {
                    await btn.click().catch(() => {});
                    await mobilePage.waitForTimeout(800);
                }
            }
        } catch (e) {}
    }

    // Expand accordion / subcategory toggles in mobile drawer
    const accordionTriggers = [
        '.menu-drawer .has-child', '.mobile-menu .dropdown', '.sub-menu-toggle', 
        '.accordion-header', '.cat-item', '.category-accordion', 'li.has-sub > a', 
        '.menu-list .arrow', '.sub-category-list', '.category-title'
    ];
    for (const sel of accordionTriggers) {
        try {
            const btns = await mobilePage.$$(sel);
            for (const btn of btns.slice(0, 35)) {
                if (await btn.isVisible()) {
                    await btn.click().catch(() => {});
                    await mobilePage.waitForTimeout(300);
                }
            }
        } catch (e) {}
    }

    console.log('  - Scrolling Mobile page to load all sections & category cards...');
    await mobilePage.evaluate(async () => {
        await new Promise((resolve) => {
            let totalHeight = 0;
            const distance = 300;
            const timer = setInterval(() => {
                const scrollHeight = document.body.scrollHeight;
                window.scrollBy(0, distance);
                totalHeight += distance;
                if (totalHeight >= scrollHeight || totalHeight > 30000) {
                    clearInterval(timer);
                    resolve();
                }
            }, 100);
        });
    });
    await mobilePage.waitForTimeout(2000);

    const mobileLinks = await mobilePage.evaluate((sourcePage) => {
        const anchors = Array.from(document.querySelectorAll('a'));
        return anchors.map((a, index) => {
            const rawHref = a.getAttribute('href') || '';
            const fullUrl = a.href || '';
            let text = (a.innerText || a.textContent || '').trim().replace(/\s+/g, ' ');
            if (!text) {
                const img = a.querySelector('img');
                if (img) text = img.getAttribute('alt') || img.getAttribute('title') || '[Banner / Image Link]';
                else text = a.getAttribute('title') || a.getAttribute('aria-label') || '[Icon / Link]';
            }

            let section = 'Mobile Body Section';
            if (a.closest('header') || a.closest('.mobile-header') || a.closest('.header')) section = 'Mobile Header';
            else if (a.closest('.mobile-menu') || a.closest('.drawer') || a.closest('.sidebar') || a.closest('.navigation') || a.closest('.menu')) section = 'Mobile Drawer / Menu';
            else if (a.closest('footer') || a.closest('.footer')) section = 'Mobile Footer';
            else if (a.closest('.category-slider') || a.closest('.categories') || a.closest('.shop-by-category')) section = 'Mobile Categories Grid';

            return {
                device: 'Mobile',
                sourceUrl: sourcePage,
                rawHref,
                fullUrl,
                linkText: text.substring(0, 120),
                section
            };
        });
    }, targetUrl);

    console.log(`  - Total Mobile anchor elements extracted: ${mobileLinks.length}`);
    allExtractedItems.push(...mobileLinks);


    // -------------------------------------------------------------
    // 3. TESTING ALL UNIQUE HTTP URLS FOR 404 & NAVIGATION STATUS
    // -------------------------------------------------------------
    console.log('\n[5/6] Testing navigation status for all extracted URLs (Desktop + Mobile)...');
    const uniqueUrls = [...new Set(allExtractedItems.map(item => item.fullUrl).filter(u => u && u.startsWith('http')))];
    console.log(`  - Total unique HTTP URLs to test: ${uniqueUrls.length}`);

    const urlTestCache = new Map();
    const batchSize = 15;

    for (let i = 0; i < uniqueUrls.length; i += batchSize) {
        const batch = uniqueUrls.slice(i, i + batchSize);
        await Promise.all(batch.map(async (url) => {
            try {
                const res = await mobilePage.request.get(url, { timeout: 20000, maxRedirects: 5 });
                const status = res.status();
                const finalUrl = res.url();
                let isSoft404 = false;

                if (status === 200) {
                    const bodyText = await res.text();
                    if (bodyText.includes('404 Page Not Found') || bodyText.includes('page-not-found') || bodyText.includes('Looking for something?')) {
                        const titleMatch = bodyText.match(/<title>(.*?)<\/title>/i);
                        if (titleMatch && (titleMatch[1].toLowerCase().includes('404') || titleMatch[1].toLowerCase().includes('not found'))) {
                            isSoft404 = true;
                        }
                    }
                }

                urlTestCache.set(url, { status, finalUrl, isSoft404, error: null });
            } catch (err) {
                urlTestCache.set(url, { status: 'Error', finalUrl: url, isSoft404: false, error: err.message });
            }
        }));
    }

    await browser.close();

    // -------------------------------------------------------------
    // 4. COMPILE FINAL DATASET & AUDIT SUMMARY
    // -------------------------------------------------------------
    console.log('\n[6/6] Compiling final report dataset...');
    let passCount = 0;
    let broken404Count = 0;
    let redirectCount = 0;
    let invalidCount = 0;
    let otherErrorCount = 0;

    const broken404Items = [];

    const fullResults = allExtractedItems.map((item, idx) => {
        const { fullUrl, rawHref } = item;

        if (!rawHref || rawHref === '#' || rawHref.startsWith('javascript:')) {
            invalidCount++;
            return {
                id: idx + 1,
                ...item,
                finalUrl: 'N/A (Placeholder / JS Link)',
                status: 'N/A',
                navResult: 'EMPTY/HASH LINK',
                badgeClass: 'badge-warning'
            };
        }

        const testRes = urlTestCache.get(fullUrl) || { status: 'Untested', finalUrl: fullUrl };
        const status = testRes.status;
        const finalUrl = testRes.finalUrl;
        const isSoft404 = testRes.isSoft404;

        let navResult = 'PASS';
        let badgeClass = 'badge-success';

        if (status === 404 || isSoft404) {
            navResult = 'FAIL (404 Not Found)';
            badgeClass = 'badge-danger';
            broken404Count++;
            broken404Items.push({ id: idx + 1, ...item, status, finalUrl });
        } else if (typeof status === 'number' && status >= 400) {
            navResult = `FAIL (HTTP ${status})`;
            badgeClass = 'badge-danger';
            otherErrorCount++;
        } else if (testRes.error) {
            navResult = `FAIL (${testRes.error})`;
            badgeClass = 'badge-danger';
            otherErrorCount++;
        } else if (finalUrl && finalUrl !== fullUrl) {
            navResult = 'PASS (Redirected)';
            badgeClass = 'badge-info';
            redirectCount++;
            passCount++;
        } else {
            passCount++;
        }

        return {
            id: idx + 1,
            ...item,
            finalUrl: finalUrl || fullUrl,
            status: status || 'Error',
            navResult,
            badgeClass
        };
    });

    console.log('\n================ AUDIT SUMMARY ================');
    console.log(`Target Environment     : ${targetUrl}`);
    console.log(`Total Homepage Links   : ${fullResults.length}`);
    console.log(`Passing / Active Links : ${passCount}`);
    console.log(`404 Broken Links       : ${broken404Count}`);
    console.log(`Redirected Links       : ${redirectCount}`);
    console.log(`Empty/Hash Links       : ${invalidCount}`);
    console.log(`Other Errors           : ${otherErrorCount}`);
    console.log('===============================================\n');

    if (broken404Items.length > 0) {
        console.log('🚨 LIST OF 404 BROKEN LINKS FOUND:');
        broken404Items.forEach((b, i) => {
            console.log(` ${i + 1}. [${b.device}] [${b.section}] "${b.linkText}" -> ${b.fullUrl}`);
        });
        console.log('');
    } else {
        console.log('✅ SUCCESS: No 404 broken links found on homepage!\n');
    }

    // -------------------------------------------------------------
    // GENERATE EXCEL REPORT (Production_Homepage_Links_Report.xlsx)
    // -------------------------------------------------------------
    const excelFilename = 'Production_Homepage_Links_Report.xlsx';
    console.log(`Generating Excel Report: ${excelFilename}...`);
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'WoodenStreet QA Automation';
    workbook.created = new Date();

    const worksheet = workbook.addWorksheet('All Links Audit', {
        views: [{ state: 'frozen', ySplit: 1 }]
    });

    worksheet.columns = [
        { header: 'ID', key: 'id', width: 8 },
        { header: 'Device', key: 'device', width: 12 },
        { header: 'Page Section', key: 'section', width: 25 },
        { header: 'Link Text / Label', key: 'linkText', width: 35 },
        { header: 'Original Link (href)', key: 'fullUrl', width: 45 },
        { header: 'Final Destination URL', key: 'finalUrl', width: 45 },
        { header: 'HTTP Status', key: 'status', width: 14 },
        { header: 'Navigation Result', key: 'navResult', width: 22 }
    ];

    const headerRow = worksheet.getRow(1);
    headerRow.font = { bold: true, color: { argb: 'FFFFFF' }, size: 11 };
    headerRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: '1E293B' }
    };
    headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
    headerRow.height = 26;

    fullResults.forEach(r => {
        const row = worksheet.addRow({
            id: r.id,
            device: r.device,
            section: r.section,
            linkText: r.linkText,
            fullUrl: r.fullUrl || r.rawHref,
            finalUrl: r.finalUrl,
            status: r.status,
            navResult: r.navResult
        });

        const statusCell = row.getCell('status');
        const navCell = row.getCell('navResult');

        if (r.navResult.includes('FAIL') || r.status === 404) {
            row.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FEE2E2' }
            };
            navCell.font = { color: { argb: '991B1B' }, bold: true };
            statusCell.font = { color: { argb: '991B1B' }, bold: true };
        } else if (r.navResult.includes('Redirected')) {
            row.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FEF3C7' }
            };
            navCell.font = { color: { argb: '92400E' }, bold: true };
        } else {
            navCell.font = { color: { argb: '166534' }, bold: true };
        }
    });

    await workbook.xlsx.writeFile(excelFilename);
    // Also save as Homepage_Links_Navigation_Report.xlsx for default dashboard compatibility
    await workbook.xlsx.writeFile('Homepage_Links_Navigation_Report.xlsx');
    console.log(`✅ Excel report saved successfully: ${excelFilename}`);

    // -------------------------------------------------------------
    // GENERATE HTML DASHBOARD (Production_Homepage_Links_Dashboard.html)
    // -------------------------------------------------------------
    const htmlFilename = 'Production_Homepage_Links_Dashboard.html';
    console.log(`Generating HTML Dashboard: ${htmlFilename}...`);
    const htmlDashboardContent = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>WoodenStreet Production Homepage Links & Navigation Dashboard</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css" rel="stylesheet">
    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" rel="stylesheet">
    <style>
        :root {
            --primary: #2563eb;
            --dark: #0f172a;
            --light-bg: #f8fafc;
            --card-border: #e2e8f0;
        }
        body {
            background-color: var(--light-bg);
            font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
            color: #334155;
        }
        .navbar-brand {
            font-weight: 700;
            color: #ffffff !important;
            letter-spacing: 0.5px;
        }
        .header-bg {
            background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
            color: white;
            padding: 2.5rem 0;
            margin-bottom: 2rem;
            box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        }
        .metric-card {
            border: 1px solid var(--card-border);
            border-radius: 12px;
            background: white;
            padding: 1.5rem;
            box-shadow: 0 2px 6px rgba(0,0,0,0.03);
            transition: transform 0.2s, box-shadow 0.2s;
        }
        .metric-card:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 16px rgba(0,0,0,0.08);
        }
        .metric-title {
            font-size: 0.875rem;
            font-weight: 600;
            text-transform: uppercase;
            color: #64748b;
            letter-spacing: 0.5px;
        }
        .metric-value {
            font-size: 2.25rem;
            font-weight: 800;
            margin-top: 0.5rem;
            color: var(--dark);
        }
        .metric-value.text-danger { color: #dc2626 !important; }
        .metric-value.text-success { color: #16a34a !important; }
        .metric-value.text-info { color: #0284c7 !important; }
        .table-card {
            border: 1px solid var(--card-border);
            border-radius: 12px;
            background: white;
            box-shadow: 0 2px 6px rgba(0,0,0,0.03);
            overflow: hidden;
        }
        .table th {
            background-color: #f1f5f9;
            color: #475569;
            font-weight: 600;
            text-transform: uppercase;
            font-size: 0.75rem;
            letter-spacing: 0.5px;
            padding: 1rem;
        }
        .table td {
            padding: 0.875rem 1rem;
            vertical-align: middle;
        }
        .badge-fail { background-color: #fee2e2; color: #991b1b; font-weight: 600; border: 1px solid #fca5a5; padding: 0.4em 0.75em; }
        .badge-pass { background-color: #dcfce7; color: #166534; font-weight: 600; border: 1px solid #86efac; padding: 0.4em 0.75em; }
        .badge-redirect { background-color: #fef3c7; color: #92400e; font-weight: 600; border: 1px solid #fde047; padding: 0.4em 0.75em; }
        .badge-hash { background-color: #f1f5f9; color: #64748b; font-weight: 600; border: 1px solid #cbd5e1; padding: 0.4em 0.75em; }
        .url-link {
            max-width: 280px;
            display: inline-block;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            color: #2563eb;
            text-decoration: none;
        }
        .url-link:hover { text-decoration: underline; }
        .section-tag {
            font-size: 0.75rem;
            font-weight: 600;
            padding: 0.25rem 0.5rem;
            border-radius: 6px;
            background-color: #e2e8f0;
            color: #334155;
        }
        .device-tag {
            font-size: 0.75rem;
            font-weight: 700;
            padding: 0.2rem 0.5rem;
            border-radius: 4px;
        }
        .device-desktop { background-color: #e0f2fe; color: #0369a1; }
        .device-mobile { background-color: #fce7f3; color: #be185d; }
    </style>
</head>
<body>

    <nav class="navbar navbar-dark bg-dark">
        <div class="container-fluid px-4">
            <span class="navbar-brand"><i class="fa-solid fa-link me-2"></i> WoodenStreet Homepage Links Audit</span>
            <span class="text-light small"><i class="fa-regular fa-clock me-1"></i> Audited: ${new Date().toLocaleString()}</span>
        </div>
    </nav>

    <div class="header-bg">
        <div class="container">
            <h1 class="display-6 fw-bold mb-2">Production Homepage Links & 404 Dashboard</h1>
            <p class="lead opacity-75 mb-0">Target URL: <a href="${targetUrl}" target="_blank" class="text-white text-decoration-underline">${targetUrl}</a> | Viewports: Desktop (1440x900) & Mobile (375x812)</p>
        </div>
    </div>

    <div class="container mb-5">

        <!-- METRIC CARDS -->
        <div class="row g-4 mb-4">
            <div class="col-md-3">
                <div class="metric-card">
                    <div class="metric-title"><i class="fa-solid fa-compass me-1"></i> Total Links</div>
                    <div class="metric-value">${fullResults.length}</div>
                    <div class="text-muted small mt-1">Extracted from DOM</div>
                </div>
            </div>
            <div class="col-md-3">
                <div class="metric-card">
                    <div class="metric-title"><i class="fa-solid fa-circle-check me-1"></i> Passing Links</div>
                    <div class="metric-value text-success">${passCount}</div>
                    <div class="text-muted small mt-1">Status 200 / Active</div>
                </div>
            </div>
            <div class="col-md-3">
                <div class="metric-card">
                    <div class="metric-title"><i class="fa-solid fa-triangle-exclamation me-1"></i> 404 Broken Links</div>
                    <div class="metric-value text-danger">${broken404Count}</div>
                    <div class="text-muted small mt-1">${broken404Count > 0 ? 'Requires Immediate Fix' : 'All Clear'}</div>
                </div>
            </div>
            <div class="col-md-3">
                <div class="metric-card">
                    <div class="metric-title"><i class="fa-solid fa-arrow-right-arrow-left me-1"></i> Redirects / Other</div>
                    <div class="metric-value text-info">${redirectCount + otherErrorCount}</div>
                    <div class="text-muted small mt-1">${redirectCount} Redirects, ${otherErrorCount} Other</div>
                </div>
            </div>
        </div>

        <!-- FILTERS -->
        <div class="card border-0 shadow-sm mb-4">
            <div class="card-body p-3">
                <div class="row g-3">
                    <div class="col-md-4">
                        <input type="text" id="searchInput" class="form-control" placeholder="🔍 Search link label, URL, or section...">
                    </div>
                    <div class="col-md-3">
                        <select id="deviceFilter" class="form-select">
                            <option value="ALL">📱 Viewport: All Devices</option>
                            <option value="Desktop">🖥️ Desktop</option>
                            <option value="Mobile">📱 Mobile</option>
                        </select>
                    </div>
                    <div class="col-md-3">
                        <select id="statusFilter" class="form-select">
                            <option value="ALL">All Statuses</option>
                            <option value="FAIL">🚨 404 / Failed Links</option>
                            <option value="200">✅ 200 Passing</option>
                            <option value="Redirected">🔁 Redirected</option>
                        </select>
                    </div>
                    <div class="col-md-2 text-end">
                        <a href="${excelFilename}" class="btn btn-outline-success w-100" download><i class="fa-solid fa-file-excel me-1"></i> Export Excel</a>
                    </div>
                </div>
            </div>
        </div>

        <!-- LINKS TABLE -->
        <div class="table-card">
            <div class="table-responsive">
                <table class="table table-hover mb-0 align-middle" id="linksTable">
                    <thead>
                        <tr>
                            <th style="width: 50px;">#</th>
                            <th style="width: 90px;">Device</th>
                            <th style="width: 170px;">Section</th>
                            <th>Link Text / Label</th>
                            <th>Target URL</th>
                            <th>Final URL</th>
                            <th style="width: 80px;" class="text-center">Status</th>
                            <th style="width: 160px;">Navigation Result</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${fullResults.map(r => `
                        <tr data-device="${r.device}" data-section="${r.section}" data-status="${r.navResult.includes('FAIL') ? 'FAIL' : (r.navResult.includes('Redirected') ? 'Redirected' : '200')}">
                            <td class="text-muted small">${r.id}</td>
                            <td><span class="device-tag ${r.device === 'Mobile' ? 'device-mobile' : 'device-desktop'}">${r.device}</span></td>
                            <td><span class="section-tag">${r.section}</span></td>
                            <td class="fw-semibold">${r.linkText}</td>
                            <td><a href="${r.fullUrl || '#'}" target="_blank" class="url-link">${r.fullUrl || r.rawHref}</a></td>
                            <td><a href="${r.finalUrl}" target="_blank" class="url-link text-secondary">${r.finalUrl}</a></td>
                            <td class="text-center"><span class="badge ${r.status === 200 ? 'bg-success' : (r.status === 404 ? 'bg-danger' : 'bg-secondary')}">${r.status}</span></td>
                            <td>
                                <span class="badge ${r.navResult.includes('FAIL') ? 'badge-fail' : (r.navResult.includes('Redirected') ? 'badge-redirect' : (r.navResult.includes('EMPTY') ? 'badge-hash' : 'badge-pass'))}">
                                    ${r.navResult}
                                </span>
                            </td>
                        </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        </div>

    </div>

    <script>
        const searchInput = document.getElementById('searchInput');
        const deviceFilter = document.getElementById('deviceFilter');
        const statusFilter = document.getElementById('statusFilter');
        const tableRows = document.querySelectorAll('#linksTable tbody tr');

        function filterTable() {
            const query = searchInput.value.toLowerCase();
            const device = deviceFilter.value;
            const status = statusFilter.value;

            tableRows.forEach(row => {
                const text = row.innerText.toLowerCase();
                const rowDevice = row.getAttribute('data-device');
                const rowStatus = row.getAttribute('data-status');

                const matchesQuery = text.includes(query);
                const matchesDevice = (device === 'ALL' || rowDevice === device);
                const matchesStatus = (status === 'ALL' || rowStatus.includes(status));

                if (matchesQuery && matchesDevice && matchesStatus) {
                    row.style.display = '';
                } else {
                    row.style.display = 'none';
                }
            });
        }

        searchInput.addEventListener('keyup', filterTable);
        deviceFilter.addEventListener('change', filterTable);
        statusFilter.addEventListener('change', filterTable);
    </script>
</body>
</html>`;

    fs.writeFileSync(htmlFilename, htmlDashboardContent, 'utf8');
    fs.writeFileSync('Homepage_Links_Navigation_Dashboard.html', htmlDashboardContent, 'utf8');
    console.log(`✅ HTML Dashboard saved successfully: ${htmlFilename}\n`);

})();
