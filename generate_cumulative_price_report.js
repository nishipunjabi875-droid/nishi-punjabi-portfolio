const { chromium } = require('playwright');
const ExcelJS = require('exceljs');
const path = require('path');
const fs = require('fs');

const COLLECTIONS = [
    { name: 'Veda Collection', url: 'https://www.woodenstreet.com/collection/veda-collection' },
    { name: 'Udaipur Collection', url: 'https://www.woodenstreet.com/collection/udaipur' },
    { name: 'Tarash Collection', url: 'https://www.woodenstreet.com/collection/tarash' },
    { name: 'Luxury Furniture', url: 'https://www.woodenstreet.com/luxury-furniture' },
    { name: 'Aligne Collection', url: 'https://www.woodenstreet.com/collection/aligne' }
];

function parsePriceNumber(priceStr) {
    if (!priceStr) return null;
    const digits = priceStr.replace(/[^0-9]/g, '');
    return digits ? parseInt(digits, 10) : null;
}

function formatCurrency(num) {
    if (num === null || num === undefined || isNaN(num)) return 'N/A';
    return '₹' + num.toLocaleString('en-IN');
}

function cleanTitleFromUrl(url) {
    try {
        const parts = url.split('/product/')[1] || url.split('/').pop();
        const slug = parts.split('?')[0].replace(/-/g, ' ');
        return slug.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    } catch (e) {
        return url;
    }
}

(async () => {
    console.log('Starting Cumulative Price Verification across all 5 Collection Pages...\n');

    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    });
    const page = await context.newPage();

    const allResults = [];
    const collectionSummaries = [];

    for (const col of COLLECTIONS) {
        console.log(`==================================================`);
        console.log(`[Collection] ${col.name}`);
        console.log(`URL: ${col.url}`);
        console.log(`==================================================`);

        let colProducts = [];
        try {
            await page.goto(col.url, { waitUntil: 'domcontentloaded', timeout: 45000 });
            await page.waitForTimeout(2000);
            await page.waitForSelector('a[href*="/product/"]', { timeout: 15000 }).catch(() => {});

            colProducts = await page.evaluate(() => {
                const productElements = Array.from(document.querySelectorAll('a[href*="/product/"]'));

                const items = productElements.map(a => {
                    const url = a.href;
                    // Extract title
                    let title = '';
                    const img = a.querySelector('img');
                    if (img && img.alt && img.alt.trim().length > 3) {
                        title = img.alt.trim();
                    } else if (img && img.title && img.title.trim().length > 3) {
                        title = img.title.trim();
                    }
                    if (!title) {
                        const titleEl = a.querySelector('.name, .title, p, h2, h3, span[class*="title"]');
                        if (titleEl && titleEl.textContent.trim()) {
                            title = titleEl.textContent.trim();
                        }
                    }

                    // Extract price
                    const priceSpans = a.querySelectorAll('span.font-redhatMedium, p span[class*="font-redhatMedium"], strong, .price');
                    let priceText = null;

                    for (const span of priceSpans) {
                        if (span.textContent && span.textContent.includes('₹')) {
                            priceText = span.textContent.trim();
                            break;
                        }
                    }

                    if (!priceText) {
                        const iter = document.createNodeIterator(a, NodeFilter.SHOW_TEXT);
                        let node;
                        while ((node = iter.nextNode())) {
                            if (node.nodeValue.includes('₹')) {
                                priceText = node.nodeValue.trim();
                                break;
                            }
                        }
                    }

                    return { url, title, priceText };
                });

                const validItems = items.filter(p => p.url && p.priceText);

                const uniqueUrls = new Set();
                const deduplicated = [];
                for (const item of validItems) {
                    if (!uniqueUrls.has(item.url)) {
                        uniqueUrls.add(item.url);
                        deduplicated.push(item);
                    }
                }
                return deduplicated;
            });
        } catch (err) {
            console.error(`❌ Error loading collection page ${col.url}: ${err.message}`);
        }

        console.log(`Found ${colProducts.length} unique products on ${col.name}.`);

        let colMatched = 0;
        let colMismatched = 0;

        for (let i = 0; i < colProducts.length; i++) {
            const prod = colProducts[i];
            const displayTitle = prod.title || cleanTitleFromUrl(prod.url);
            console.log(`\n  Product [${i + 1}/${colProducts.length}]: ${displayTitle}`);
            console.log(`  Collection Price: ${prod.priceText}`);

            let productPagePriceText = '';
            try {
                await page.goto(prod.url, { waitUntil: 'domcontentloaded', timeout: 25000 });
                const priceLocator = page.locator('.offerprice, span.text-font22, .price, .final-price').filter({ hasText: '₹' }).first();
                await priceLocator.waitFor({ state: 'attached', timeout: 10000 }).catch(() => {});
                productPagePriceText = await priceLocator.innerText().catch(() => '');
            } catch (err) {
                console.log(`  ⚠️ Error fetching product page: ${err.message}`);
            }

            console.log(`  Product Page Price: ${productPagePriceText || 'N/A'}`);

            const colPriceNum = parsePriceNumber(prod.priceText);
            const prodPriceNum = parsePriceNumber(productPagePriceText);

            let priceDiff = null;
            let status = 'MISMATCH';
            let diffPercentage = '0%';
            let statusNote = '';

            if (colPriceNum !== null && prodPriceNum !== null) {
                priceDiff = prodPriceNum - colPriceNum;
                if (colPriceNum === prodPriceNum) {
                    status = 'MATCH';
                    colMatched++;
                    statusNote = 'Prices match perfectly';
                } else {
                    status = 'MISMATCH';
                    colMismatched++;
                    const diffVal = Math.abs(priceDiff);
                    const pct = ((diffVal / colPriceNum) * 100).toFixed(1);
                    diffPercentage = `${priceDiff > 0 ? '+' : '-'}${pct}%`;
                    if (priceDiff < 0) {
                        statusNote = `Product page is ${formatCurrency(diffVal)} cheaper than collection page (${diffPercentage})`;
                    } else {
                        statusNote = `Product page is ${formatCurrency(diffVal)} higher than collection page (+${pct}%)`;
                    }
                }
            } else {
                status = 'ERROR / UNABLE TO FETCH';
                statusNote = 'Could not extract numeric price from one or both pages';
            }

            console.log(`  Status: ${status} | Diff: ${priceDiff !== null ? formatCurrency(priceDiff) : 'N/A'}`);

            allResults.push({
                collectionName: col.name,
                collectionUrl: col.url,
                productTitle: displayTitle,
                productUrl: prod.url,
                collectionPriceRaw: prod.priceText,
                productPriceRaw: productPagePriceText,
                collectionPriceNum: colPriceNum,
                productPriceNum: prodPriceNum,
                priceDiff: priceDiff,
                status: status,
                diffPercentage: diffPercentage,
                statusNote: statusNote
            });
        }

        collectionSummaries.push({
            collectionName: col.name,
            collectionUrl: col.url,
            totalProducts: colProducts.length,
            matchedProducts: colMatched,
            mismatchedProducts: colMismatched
        });
    }

    await browser.close();

    console.log('\n==================================================');
    console.log('Generating Cumulative Excel Report...');
    console.log('==================================================\n');

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'WoodenStreet QA Automation';
    workbook.lastModifiedBy = 'WoodenStreet QA Automation';
    workbook.created = new Date();

    // ---------------------------------------------------------
    // SHEET 1: Executive Dashboard & Summary
    // ---------------------------------------------------------
    const summarySheet = workbook.addWorksheet('Executive Summary');
    summarySheet.views = [{ showGridLines: true }];

    // Title Block
    summarySheet.mergeCells('A1:F1');
    const titleCell = summarySheet.getCell('A1');
    titleCell.value = 'WoodenStreet Cumulative Price Consistency Audit Report';
    titleCell.font = { name: 'Arial', size: 16, bold: true, color: { argb: 'FFFFFFFF' } };
    titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1F4E79' } };
    titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
    summarySheet.getRow(1).height = 40;

    summarySheet.mergeCells('A2:F2');
    const subtitleCell = summarySheet.getCell('A2');
    subtitleCell.value = `Audit Date: ${new Date().toLocaleString('en-IN')} | Verified across 5 Collections`;
    subtitleCell.font = { name: 'Arial', size: 11, italic: true, color: { argb: 'FF333333' } };
    subtitleCell.alignment = { horizontal: 'center', vertical: 'middle' };
    summarySheet.getRow(2).height = 24;

    summarySheet.addRow([]); // Row 3 empty

    // High Level Metrics Cards
    const totalProds = allResults.length;
    const totalMatched = allResults.filter(r => r.status === 'MATCH').length;
    const totalMismatches = allResults.filter(r => r.status === 'MISMATCH').length;
    const totalErrors = allResults.filter(r => r.status.includes('ERROR')).length;

    summarySheet.addRow(['Overall Audit Summary Metrics']);
    summarySheet.mergeCells('A4:D4');
    summarySheet.getCell('A4').font = { name: 'Arial', size: 13, bold: true, color: { argb: 'FF1F4E79' } };

    const metricHeaders = ['Metric Description', 'Count', 'Percentage of Total', 'Audit Status'];
    const mHeaderRow = summarySheet.addRow(metricHeaders);
    mHeaderRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    mHeaderRow.eachCell(cell => {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2F5597' } };
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
    });

    const mRows = [
        ['Total Products Audited Across All 5 Collections', totalProds, '100%', 'Completed'],
        ['Total Products with Perfect Price Match', totalMatched, `${((totalMatched / totalProds) * 100).toFixed(1)}%`, '✅ PASSED'],
        ['Total Products with Price Mismatches', totalMismatches, `${((totalMismatches / totalProds) * 100).toFixed(1)}%`, '❌ DISCREPANCY DETECTED'],
        ['Total Extraction/Fetch Errors', totalErrors, `${((totalErrors / totalProds) * 100).toFixed(1)}%`, totalErrors > 0 ? '⚠️ WARNING' : '✅ NONE']
    ];

    mRows.forEach(rData => {
        const r = summarySheet.addRow(rData);
        r.font = { name: 'Arial', size: 11 };
        r.getCell(2).alignment = { horizontal: 'center' };
        r.getCell(3).alignment = { horizontal: 'center' };
        r.getCell(4).alignment = { horizontal: 'center' };
        if (rData[0].includes('Mismatches') && totalMismatches > 0) {
            r.getCell(4).font = { bold: true, color: { argb: 'FFC00000' } };
        } else if (rData[0].includes('Match')) {
            r.getCell(4).font = { bold: true, color: { argb: 'FF375623' } };
        }
    });

    summarySheet.addRow([]); // empty

    // Breakdown Table by Collection Page
    summarySheet.addRow(['Breakdown by Collection Page']);
    summarySheet.mergeCells('A11:E11');
    summarySheet.getCell('A11').font = { name: 'Arial', size: 13, bold: true, color: { argb: 'FF1F4E79' } };

    const colBreakdownHeaders = ['Collection Page Name', 'Collection Page URL', 'Total Products', 'Price Matches', 'Price Mismatches'];
    const cbHeaderRow = summarySheet.addRow(colBreakdownHeaders);
    cbHeaderRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    cbHeaderRow.eachCell(cell => {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2F5597' } };
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
    });

    collectionSummaries.forEach(cs => {
        const row = summarySheet.addRow([
            cs.collectionName,
            cs.collectionUrl,
            cs.totalProducts,
            cs.matchedProducts,
            cs.mismatchedProducts
        ]);
        row.getCell(2).value = { text: cs.collectionUrl, hyperlink: cs.collectionUrl };
        row.getCell(2).font = { color: { argb: 'FF0563C1' }, underline: true };
        row.getCell(3).alignment = { horizontal: 'center' };
        row.getCell(4).alignment = { horizontal: 'center' };
        row.getCell(5).alignment = { horizontal: 'center' };

        if (cs.mismatchedProducts > 0) {
            row.getCell(5).font = { bold: true, color: { argb: 'FFC00000' } };
            row.getCell(5).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFCE4D6' } };
        } else {
            row.getCell(4).font = { bold: true, color: { argb: 'FF375623' } };
            row.getCell(4).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE2EFDA' } };
        }
    });

    // Auto fit widths for Summary Sheet
    summarySheet.columns = [
        { width: 45 },
        { width: 55 },
        { width: 22 },
        { width: 22 },
        { width: 22 },
        { width: 20 }
    ];


    // ---------------------------------------------------------
    // SHEET 2: Price Mismatches Only (Grouped by Collection)
    // ---------------------------------------------------------
    const mismatchesSheet = workbook.addWorksheet('Price Discrepancies Only');
    mismatchesSheet.views = [{ showGridLines: true }];

    mismatchesSheet.mergeCells('A1:H1');
    const mmTitle = mismatchesSheet.getCell('A1');
    mmTitle.value = 'Action Required: Products with Price Mismatches Between Collection Page & Product Page';
    mmTitle.font = { name: 'Arial', size: 14, bold: true, color: { argb: 'FFFFFFFF' } };
    mmTitle.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFC00000' } };
    mmTitle.alignment = { horizontal: 'center', vertical: 'middle' };
    mismatchesSheet.getRow(1).height = 36;

    const mmHeaders = [
        'Collection Page Name',
        'Product Title',
        'Product Page URL',
        'Collection Page Price (₹)',
        'Product Page Price (₹)',
        'Price Difference (₹)',
        'Price Variance (%)',
        'Audit Findings / Discrepancy Analysis'
    ];

    const mmHeaderRow = mismatchesSheet.addRow(mmHeaders);
    mmHeaderRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    mmHeaderRow.eachCell(cell => {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFC00000' } };
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
    });
    mismatchesSheet.getRow(2).height = 25;

    const mismatchedResults = allResults.filter(r => r.status === 'MISMATCH');

    if (mismatchedResults.length === 0) {
        const noMismatchRow = mismatchesSheet.addRow(['No price mismatches detected across any of the 5 collections! All prices match perfectly.']);
        mismatchesSheet.mergeCells(`A3:H3`);
        noMismatchRow.getCell(1).font = { italic: true, color: { argb: 'FF375623' } };
    } else {
        // Group by Collection Name
        const groupedMismatches = {};
        mismatchedResults.forEach(r => {
            if (!groupedMismatches[r.collectionName]) {
                groupedMismatches[r.collectionName] = [];
            }
            groupedMismatches[r.collectionName].push(r);
        });

        for (const [colName, items] of Object.entries(groupedMismatches)) {
            // Group Header Row
            const gRow = mismatchesSheet.addRow([`📌 Collection: ${colName} (${items.length} price mismatch${items.length > 1 ? 'es' : ''})`]);
            mismatchesSheet.mergeCells(`A${gRow.number}:H${gRow.number}`);
            gRow.getCell(1).font = { bold: true, size: 12, color: { argb: 'FF1F4E79' } };
            gRow.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD9E1F2' } };

            items.forEach(item => {
                const row = mismatchesSheet.addRow([
                    item.collectionName,
                    item.productTitle,
                    item.productUrl,
                    item.collectionPriceNum !== null ? item.collectionPriceNum : item.collectionPriceRaw,
                    item.productPriceNum !== null ? item.productPriceNum : item.productPriceRaw,
                    item.priceDiff !== null ? item.priceDiff : 'N/A',
                    item.diffPercentage,
                    item.statusNote
                ]);

                // Formatting
                row.getCell(3).value = { text: item.productUrl, hyperlink: item.productUrl };
                row.getCell(3).font = { color: { argb: 'FF0563C1' }, underline: true };

                if (item.collectionPriceNum !== null) {
                    row.getCell(4).numberFormat = '₹#,##0';
                }
                if (item.productPriceNum !== null) {
                    row.getCell(5).numberFormat = '₹#,##0';
                }
                if (item.priceDiff !== null) {
                    row.getCell(6).numberFormat = '₹#,##0;[Red]-₹#,##0;₹0';
                    if (item.priceDiff < 0) {
                        row.getCell(6).font = { color: { argb: 'FF375623' }, bold: true }; // Cheaper on PDP
                    } else if (item.priceDiff > 0) {
                        row.getCell(6).font = { color: { argb: 'FFC00000' }, bold: true }; // Higher on PDP
                    }
                }
                row.getCell(7).alignment = { horizontal: 'center' };
            });
        }
    }

    mismatchesSheet.columns = [
        { width: 22 },
        { width: 45 },
        { width: 60 },
        { width: 24 },
        { width: 24 },
        { width: 22 },
        { width: 18 },
        { width: 65 }
    ];


    // ---------------------------------------------------------
    // SHEET 3: Complete Cumulative Master List (All Products)
    // ---------------------------------------------------------
    const masterSheet = workbook.addWorksheet('Cumulative All Products');
    masterSheet.views = [{ showGridLines: true }];

    masterSheet.mergeCells('A1:I1');
    const masterTitle = masterSheet.getCell('A1');
    masterTitle.value = 'Cumulative Product Price Audit Log - All 5 Collection Pages';
    masterTitle.font = { name: 'Arial', size: 14, bold: true, color: { argb: 'FFFFFFFF' } };
    masterTitle.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1F4E79' } };
    masterTitle.alignment = { horizontal: 'center', vertical: 'middle' };
    masterSheet.getRow(1).height = 36;

    const masterHeaders = [
        'Collection Page Name',
        'Product Title',
        'Product Page URL',
        'Collection Page Price (₹)',
        'Product Page Price (₹)',
        'Price Difference (₹)',
        'Status',
        'Variance (%)',
        'Detailed Audit Notes'
    ];

    const masterHeaderRow = masterSheet.addRow(masterHeaders);
    masterHeaderRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    masterHeaderRow.eachCell(cell => {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2F5597' } };
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
    });
    masterSheet.getRow(2).height = 25;

    // Group by Collection Name for clean visual separation
    const groupedAll = {};
    allResults.forEach(r => {
        if (!groupedAll[r.collectionName]) {
            groupedAll[r.collectionName] = [];
        }
        groupedAll[r.collectionName].push(r);
    });

    for (const [colName, items] of Object.entries(groupedAll)) {
        // Group Header
        const gRow = masterSheet.addRow([`📂 Collection: ${colName} (${items.length} items total)`]);
        masterSheet.mergeCells(`A${gRow.number}:I${gRow.number}`);
        gRow.getCell(1).font = { bold: true, size: 12, color: { argb: 'FF1F4E79' } };
        gRow.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE9EEF4' } };

        items.forEach(item => {
            const row = masterSheet.addRow([
                item.collectionName,
                item.productTitle,
                item.productUrl,
                item.collectionPriceNum !== null ? item.collectionPriceNum : item.collectionPriceRaw,
                item.productPriceNum !== null ? item.productPriceNum : item.productPriceRaw,
                item.priceDiff !== null ? item.priceDiff : 0,
                item.status,
                item.diffPercentage,
                item.statusNote
            ]);

            // Formatting
            row.getCell(3).value = { text: item.productUrl, hyperlink: item.productUrl };
            row.getCell(3).font = { color: { argb: 'FF0563C1' }, underline: true };

            if (item.collectionPriceNum !== null) {
                row.getCell(4).numberFormat = '₹#,##0';
            }
            if (item.productPriceNum !== null) {
                row.getCell(5).numberFormat = '₹#,##0';
            }
            if (item.priceDiff !== null) {
                row.getCell(6).numberFormat = '₹#,##0;[Red]-₹#,##0;₹0';
            }
            row.getCell(7).alignment = { horizontal: 'center' };
            row.getCell(8).alignment = { horizontal: 'center' };

            if (item.status === 'MATCH') {
                row.getCell(7).font = { bold: true, color: { argb: 'FF375623' } };
                row.getCell(7).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE2EFDA' } };
            } else if (item.status === 'MISMATCH') {
                row.getCell(7).font = { bold: true, color: { argb: 'FFC00000' } };
                row.getCell(7).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFCE4D6' } };
            }
        });
    }

    masterSheet.columns = [
        { width: 22 },
        { width: 45 },
        { width: 60 },
        { width: 24 },
        { width: 24 },
        { width: 22 },
        { width: 16 },
        { width: 16 },
        { width: 65 }
    ];

    const outputPath = path.join(__dirname, 'Cumulative_Price_Difference_Report.xlsx');
    await workbook.xlsx.writeFile(outputPath);

    console.log(`✅ Cumulative Excel Report successfully generated and saved to:`);
    console.log(outputPath);
})();
