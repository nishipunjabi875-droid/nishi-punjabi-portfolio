const { chromium } = require('playwright');
const ExcelJS = require('exceljs');
const fs = require('fs');
const path = require('path');

(async () => {
    console.log('=== WoodenStreet Beta Homepage Links & Navigation Audit ===\n');

    const targetUrl = 'https://beta.teamwoodenstreet.com/';
    console.log(`[1/5] Launching browser & navigating to ${targetUrl}...`);

    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({
        viewport: { width: 1440, height: 900 },
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    });

    const page = await context.newPage();

    try {
        await page.goto(targetUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });
        await page.waitForTimeout(3000);
    } catch (e) {
        console.log(`Page load note: ${e.message}`);
    }

    // Hover mega menu items to reveal subcategory dropdown links
    console.log('[2/5] Hovering navigation items to reveal mega menu links...');
    const topNavSelectors = ['header nav a', 'header ul li', '.navigation a', '.header-menu a', '.nav-item', 'header a'];
    for (const selector of topNavSelectors) {
        const items = await page.$$(selector);
        if (items.length > 0) {
            console.log(`  - Hovering ${items.length} top navigation items...`);
            for (let i = 0; i < Math.min(items.length, 30); i++) {
                try {
                    await items[i].hover({ timeout: 600 }).catch(() => {});
                } catch (e) {}
            }
            break;
        }
    }

    // Scroll down to load all lazy sections & footer links
    console.log('[3/5] Scrolling page to reveal lazy loaded sections & footer...');
    await page.evaluate(async () => {
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

    await page.waitForTimeout(2000);

    // Extract all links with metadata & section taxonomy
    console.log('[4/5] Extracting all links and categorizing sections...');
    const linkItems = await page.evaluate((sourcePage) => {
        const anchors = Array.from(document.querySelectorAll('a'));
        return anchors.map((a, index) => {
            const rawHref = a.getAttribute('href') || '';
            const fullUrl = a.href || '';
            let text = (a.innerText || a.textContent || '').trim().replace(/\s+/g, ' ');
            
            // If anchor text is empty, check image alt or title inside anchor
            if (!text) {
                const img = a.querySelector('img');
                if (img) {
                    text = img.getAttribute('alt') || img.getAttribute('title') || '[Banner / Image Link]';
                } else {
                    text = a.getAttribute('title') || a.getAttribute('aria-label') || '[Icon / Link]';
                }
            }

            // Categorize page section
            let section = 'Body Section';
            if (a.closest('header') || a.closest('.header') || a.closest('#header')) {
                section = 'Header Top Bar / Nav';
            } else if (a.closest('.mega-menu') || a.closest('.nav-dropdown') || a.closest('.menu-dropdown') || a.closest('header ul')) {
                section = 'Header Mega Menu';
            } else if (a.closest('footer') || a.closest('.footer') || a.closest('#footer')) {
                section = 'Footer';
            } else if (a.closest('.banner') || a.closest('.hero') || a.closest('.slider')) {
                section = 'Hero Banner Carousel';
            }

            return {
                id: index + 1,
                sourceUrl: sourcePage,
                rawHref,
                fullUrl,
                linkText: text.substring(0, 120),
                section
            };
        });
    }, targetUrl);

    console.log(`  - Total anchor elements found: ${linkItems.length}`);

    // Map & test link navigation
    console.log('[5/5] Testing navigation status for all extracted links...');
    const urlTestCache = new Map();
    const batchSize = 15;

    // Unique URLs list
    const uniqueUrls = [...new Set(linkItems.map(item => item.fullUrl).filter(u => u && u.startsWith('http')))];
    console.log(`  - Unique HTTP URLs to test: ${uniqueUrls.length}`);

    for (let i = 0; i < uniqueUrls.length; i += batchSize) {
        const batch = uniqueUrls.slice(i, i + batchSize);
        await Promise.all(batch.map(async (url) => {
            try {
                const res = await page.request.get(url, { timeout: 20000, maxRedirects: 5 });
                const status = res.status();
                const finalUrl = res.url();
                
                let isSoft404 = false;
                if (status === 200) {
                    const bodyText = await res.text();
                    if (bodyText.includes('404 Page Not Found') || bodyText.includes('page-not-found')) {
                        const titleMatch = bodyText.match(/<title>(.*?)<\/title>/i);
                        if (titleMatch && (titleMatch[1].toLowerCase().includes('404') || titleMatch[1].toLowerCase().includes('not found'))) {
                            isSoft404 = true;
                        }
                    }
                }

                urlTestCache.set(url, {
                    status,
                    finalUrl,
                    isSoft404,
                    error: null
                });
            } catch (err) {
                urlTestCache.set(url, {
                    status: 'Error',
                    finalUrl: url,
                    isSoft404: false,
                    error: err.message
                });
            }
        }));
    }

    await browser.close();

    // Compile full dataset
    let passCount = 0;
    let broken404Count = 0;
    let redirectCount = 0;
    let invalidCount = 0;
    let otherErrorCount = 0;

    const fullResults = linkItems.map(item => {
        const { fullUrl, rawHref } = item;

        if (!rawHref || rawHref === '#' || rawHref.startsWith('javascript:')) {
            invalidCount++;
            return {
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
            ...item,
            finalUrl: finalUrl || fullUrl,
            status: status || 'Error',
            navResult,
            badgeClass
        };
    });

    console.log('\n================ AUDIT SUMMARY ================');
    console.log(`Total Homepage Links   : ${fullResults.length}`);
    console.log(`Passing / Active Links : ${passCount}`);
    console.log(`404 Broken Links       : ${broken404Count}`);
    console.log(`Redirected Links       : ${redirectCount}`);
    console.log(`Empty/Hash Links       : ${invalidCount}`);
    console.log(`Other Errors           : ${otherErrorCount}`);
    console.log('===============================================\n');

    // -------------------------------------------------------------
    // GENERATE EXCEL REPORT (ExcelJS)
    // -------------------------------------------------------------
    console.log('Generating Excel Report: Homepage_Links_Navigation_Report.xlsx...');
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'WoodenStreet QA Automation';
    workbook.created = new Date();

    const worksheet = workbook.addWorksheet('Homepage Links Audit', {
        views: [{ state: 'frozen', ySplit: 1 }]
    });

    // Define Columns
    worksheet.columns = [
        { header: 'ID', key: 'id', width: 8 },
        { header: 'Source Page URL', key: 'sourceUrl', width: 35 },
        { header: 'Page Section', key: 'section', width: 25 },
        { header: 'Link Text / Label', key: 'linkText', width: 35 },
        { header: 'Original Link (href)', key: 'fullUrl', width: 45 },
        { header: 'Final Destination URL', key: 'finalUrl', width: 45 },
        { header: 'HTTP Status', key: 'status', width: 14 },
        { header: 'Navigation Result', key: 'navResult', width: 22 }
    ];

    // Style Header Row
    const headerRow = worksheet.getRow(1);
    headerRow.font = { bold: true, color: { argb: 'FFFFFF' }, size: 11 };
    headerRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: '1E293B' } // Dark slate header
    };
    headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
    headerRow.height = 26;

    // Add Data Rows
    fullResults.forEach(r => {
        const row = worksheet.addRow({
            id: r.id,
            sourceUrl: r.sourceUrl,
            section: r.section,
            linkText: r.linkText,
            fullUrl: r.fullUrl || r.rawHref,
            finalUrl: r.finalUrl,
            status: r.status,
            navResult: r.navResult
        });

        // Highlight broken rows in soft red
        const statusCell = row.getCell('status');
        const navCell = row.getCell('navResult');

        if (r.navResult.includes('FAIL') || r.status === 404) {
            row.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FEE2E2' } // Light red fill
            };
            navCell.font = { color: { argb: '991B1B' }, bold: true };
            statusCell.font = { color: { argb: '991B1B' }, bold: true };
        } else if (r.navResult.includes('Redirected')) {
            row.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FEF3C7' } // Light amber fill
            };
            navCell.font = { color: { argb: '92400E' }, bold: true };
        } else {
            navCell.font = { color: { argb: '166534' }, bold: true };
        }
    });

    const excelPath = 'Homepage_Links_Navigation_Report.xlsx';
    await workbook.xlsx.writeFile(excelPath);
    console.log(`✅ Excel report created successfully: ${excelPath}`);

    // -------------------------------------------------------------
    // GENERATE HTML DASHBOARD
    // -------------------------------------------------------------
    console.log('Generating HTML Dashboard: Homepage_Links_Navigation_Dashboard.html...');
    const htmlDashboardContent = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>WoodenStreet Homepage Links & Navigation Dashboard</title>
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
            letter-spacing: 0.5px;
            color: #64748b;
        }
        .metric-value {
            font-size: 2.25rem;
            font-weight: 700;
            margin-top: 0.5rem;
        }
        .badge-pass { background-color: #dcfce7; color: #15803d; border: 1px solid #bbf7d0; font-weight: 600; }
        .badge-fail { background-color: #fee2e2; color: #b91c1c; border: 1px solid #fecaca; font-weight: 600; }
        .badge-redirect { background-color: #fef3c7; color: #b45309; border: 1px solid #fde68a; font-weight: 600; }
        .badge-hash { background-color: #f1f5f9; color: #475569; border: 1px solid #e2e8f0; font-weight: 600; }
        
        .table-container {
            background: white;
            border-radius: 12px;
            border: 1px solid var(--card-border);
            box-shadow: 0 2px 6px rgba(0,0,0,0.03);
            overflow: hidden;
        }
        .table th {
            background-color: #f1f5f9;
            color: #475569;
            font-weight: 600;
            font-size: 0.85rem;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            border-bottom: 2px solid #e2e8f0;
        }
        .table td {
            vertical-align: middle;
            font-size: 0.9rem;
        }
        .url-link {
            word-break: break-all;
            color: #2563eb;
            text-decoration: none;
        }
        .url-link:hover { text-decoration: underline; }
        .search-box {
            border-radius: 8px;
            border: 1px solid #cbd5e1;
            padding: 0.6rem 1rem;
        }
        .section-tag {
            font-size: 0.75rem;
            padding: 0.25rem 0.6rem;
            border-radius: 6px;
            background-color: #e2e8f0;
            color: #334155;
            font-weight: 600;
        }
    </style>
</head>
<body>

    <div class="header-bg">
        <div class="container">
            <div class="d-flex justify-content-between align-items-center">
                <div>
                    <h2 class="mb-1"><i class="fa-solid fa-link me-2 text-primary"></i>WoodenStreet Homepage Links Audit</h2>
                    <p class="mb-0 text-light opacity-75">Page Target: <a href="${targetUrl}" target="_blank" class="text-info fw-bold">${targetUrl}</a> | Audited: ${new Date().toLocaleString()}</p>
                </div>
                <div>
                    <a href="${excelPath}" download class="btn btn-success fw-semibold"><i class="fa-solid fa-file-excel me-2"></i>Download Excel Report</a>
                </div>
            </div>
        </div>
    </div>

    <div class="container mb-5">

        <!-- Summary Metrics -->
        <div class="row g-3 mb-4">
            <div class="col-md-3">
                <div class="metric-card">
                    <div class="metric-title"><i class="fa-solid fa-list-check me-2 text-primary"></i>Total Extracted Links</div>
                    <div class="metric-value text-dark">${fullResults.length}</div>
                    <small class="text-muted">Unique URLs: ${uniqueUrls.length}</small>
                </div>
            </div>
            <div class="col-md-3">
                <div class="metric-card">
                    <div class="metric-title"><i class="fa-solid fa-circle-check me-2 text-success"></i>Passing / Active Links</div>
                    <div class="metric-value text-success">${passCount}</div>
                    <small class="text-success fw-semibold">${((passCount / fullResults.length) * 100).toFixed(1)}% Active</small>
                </div>
            </div>
            <div class="col-md-3">
                <div class="metric-card">
                    <div class="metric-title"><i class="fa-solid fa-triangle-exclamation me-2 text-danger"></i>404 Broken Links</div>
                    <div class="metric-value text-danger">${broken404Count}</div>
                    <small class="text-danger fw-semibold">${broken404Count > 0 ? 'Requires Action' : 'All Links Working'}</small>
                </div>
            </div>
            <div class="col-md-3">
                <div class="metric-card">
                    <div class="metric-title"><i class="fa-solid fa-arrow-right-arrow-left me-2 text-warning"></i>Redirected Links</div>
                    <div class="metric-value text-warning">${redirectCount}</div>
                    <small class="text-muted">301 / 302 Hops</small>
                </div>
            </div>
        </div>

        <!-- Filter & Search Controls -->
        <div class="table-container p-4 mb-4">
            <div class="row g-3 align-items-center mb-3">
                <div class="col-md-5">
                    <input type="text" id="searchInput" class="form-control search-box" placeholder="Search link text, URL, section...">
                </div>
                <div class="col-md-4">
                    <select id="sectionFilter" class="form-select search-box">
                        <option value="ALL">All Page Sections</option>
                        <option value="Header Top Bar / Nav">Header Top Bar / Nav</option>
                        <option value="Header Mega Menu">Header Mega Menu</option>
                        <option value="Body Section">Body Section</option>
                        <option value="Hero Banner Carousel">Hero Banner Carousel</option>
                        <option value="Footer">Footer</option>
                    </select>
                </div>
                <div class="col-md-3">
                    <select id="statusFilter" class="form-select search-box">
                        <option value="ALL">All Statuses</option>
                        <option value="PASS">PASS (200 OK)</option>
                        <option value="FAIL">FAIL (404 Not Found)</option>
                        <option value="Redirected">Redirected</option>
                        <option value="EMPTY/HASH">Empty/Hash Link</option>
                    </select>
                </div>
            </div>

            <!-- Links Data Table -->
            <div class="table-responsive">
                <table class="table table-hover align-middle mb-0" id="linksTable">
                    <thead>
                        <tr>
                            <th style="width: 50px;">#</th>
                            <th style="width: 170px;">Page Section</th>
                            <th style="width: 200px;">Link Label / Text</th>
                            <th>Original Link (href)</th>
                            <th>Final Navigation Destination</th>
                            <th style="width: 100px;">Status</th>
                            <th style="width: 140px;">Result</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${fullResults.map(r => `
                        <tr data-section="${r.section}" data-status="${r.navResult}">
                            <td class="fw-bold text-secondary">${r.id}</td>
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
        const sectionFilter = document.getElementById('sectionFilter');
        const statusFilter = document.getElementById('statusFilter');
        const tableRows = document.querySelectorAll('#linksTable tbody tr');

        function filterTable() {
            const query = searchInput.value.toLowerCase();
            const section = sectionFilter.value;
            const status = statusFilter.value;

            tableRows.forEach(row => {
                const text = row.innerText.toLowerCase();
                const rowSection = row.getAttribute('data-section');
                const rowStatus = row.getAttribute('data-status');

                const matchesQuery = text.includes(query);
                const matchesSection = (section === 'ALL' || rowSection === section);
                const matchesStatus = (status === 'ALL' || rowStatus.includes(status));

                if (matchesQuery && matchesSection && matchesStatus) {
                    row.style.display = '';
                } else {
                    row.style.display = 'none';
                }
            });
        }

        searchInput.addEventListener('keyup', filterTable);
        sectionFilter.addEventListener('change', filterTable);
        statusFilter.addEventListener('change', filterTable);
    </script>
</body>
</html>`;

    const dashboardPath = 'Homepage_Links_Navigation_Dashboard.html';
    fs.writeFileSync(dashboardPath, htmlDashboardContent, 'utf8');
    console.log(`✅ HTML Dashboard created successfully: ${dashboardPath}\n`);

})();
