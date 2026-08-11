const fs = require('fs');
const path = require('path');
const ExcelJS = require('exceljs');

async function generateReports() {
    const jsonPath = path.join(__dirname, 'results', 'buying_guides_audit_raw.json');
    if (!fs.existsSync(jsonPath)) {
        console.error(`Error: Audit JSON file not found at ${jsonPath}. Run check_buying_guides_beta.spec.js first.`);
        process.exit(1);
    }

    const rawData = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));

    let grandTotal = 0;
    let grandValid = 0;
    let grandRedirected = 0;
    let grand404 = 0;
    let grandUnlinked = 0;

    rawData.forEach(pageData => {
        if (pageData.stats) {
            grandTotal += pageData.stats.total;
            grandValid += pageData.stats.valid;
            grandRedirected += pageData.stats.redirected;
            grand404 += pageData.stats.broken404;
            grandUnlinked += pageData.stats.unlinked;
        }
    });

    console.log(`Generating Excel Report & HTML Dashboard for ${rawData.length} buying guide pages...`);

    // ==========================================
    // 1. GENERATE EXCEL REPORT (exceljs)
    // ==========================================
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'WoodenStreet QA Automation';
    workbook.created = new Date();

    // --- Sheet 1: Executive Summary ---
    const summarySheet = workbook.addWorksheet('Executive Summary');
    
    // Title Block
    summarySheet.mergeCells('A1:G1');
    const titleCell = summarySheet.getCell('A1');
    titleCell.value = 'WOODENSTREET - BETA BUYING GUIDES LINK & REDIRECTION AUDIT';
    titleCell.font = { name: 'Calibri', size: 16, bold: true, color: { argb: 'FFFFFF' } };
    titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '1B365D' } };
    titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
    summarySheet.getRow(1).height = 35;

    summarySheet.mergeCells('A2:G2');
    const metaCell = summarySheet.getCell('A2');
    metaCell.value = `Audit Date: ${new Date().toLocaleString('en-IN')} | Target: beta.teamwoodenstreet.com`;
    metaCell.font = { name: 'Calibri', size: 11, italic: true, color: { argb: '555555' } };
    metaCell.alignment = { horizontal: 'center', vertical: 'middle' };
    summarySheet.getRow(2).height = 20;

    // KPI Cards row
    summarySheet.addRow([]);
    const kpiRow = summarySheet.addRow([
        'Total Audited', grandTotal,
        'Valid Direct (200)', grandValid,
        'Redirected Links', grandRedirected,
        '404 Broken Links', grand404
    ]);
    kpiRow.font = { name: 'Calibri', size: 11, bold: true };

    summarySheet.addRow([]);

    // Table Headers
    const summaryHeaders = ['Buying Guide Page URL', 'Page Title', 'Total Links/Buttons', 'Valid (200 OK)', 'Redirected', '404 Broken', 'Unlinked/Empty', 'Audit Status'];
    const headerRow = summarySheet.addRow(summaryHeaders);
    headerRow.height = 25;
    headerRow.eachCell((cell) => {
        cell.font = { name: 'Calibri', size: 11, bold: true, color: { argb: 'FFFFFF' } };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '2C3E50' } };
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
    });

    rawData.forEach((pageData) => {
        const stats = pageData.stats || { total: 0, valid: 0, redirected: 0, broken404: 0, unlinked: 0 };
        const pageStatus = stats.broken404 > 0 ? 'FAIL (404s Found)' : (stats.redirected > 0 || stats.unlinked > 0 ? 'WARNING' : 'PASS');

        const row = summarySheet.addRow([
            pageData.guideUrl,
            pageData.pageTitle,
            stats.total,
            stats.valid,
            stats.redirected,
            stats.broken404,
            stats.unlinked,
            pageStatus
        ]);

        // Cell formatting
        row.getCell(1).font = { color: { argb: '1B365D' }, underline: true };
        row.getCell(6).font = { bold: stats.broken404 > 0, color: { argb: stats.broken404 > 0 ? 'C0392B' : '000000' } };
        
        const statusCell = row.getCell(8);
        statusCell.alignment = { horizontal: 'center' };
        if (pageStatus.startsWith('FAIL')) {
            statusCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FADBD8' } };
            statusCell.font = { bold: true, color: { argb: '900C3F' } };
        } else if (pageStatus === 'WARNING') {
            statusCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FCF3CF' } };
            statusCell.font = { bold: true, color: { argb: '7D6608' } };
        } else {
            statusCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'D4EFDF' } };
            statusCell.font = { bold: true, color: { argb: '1E8449' } };
        }
    });

    // Auto fit column widths
    summarySheet.columns.forEach((column) => {
        let maxLength = 0;
        column.eachCell({ includeEmpty: true }, (cell) => {
            const columnLength = cell.value ? cell.value.toString().length : 10;
            if (columnLength > maxLength) {
                maxLength = columnLength;
            }
        });
        column.width = Math.min(Math.max(maxLength + 4, 15), 60);
    });

    // --- Sheet 2: Detailed Link Audit ---
    const detailSheet = workbook.addWorksheet('Detailed Link Audit');

    const detailHeaders = [
        'Source Buying Guide',
        '#',
        'Element Type',
        'Link Text / Label',
        'Section / Context',
        'Original href',
        'Resolved Target URL',
        'Final Target URL',
        'HTTP Status',
        'Redirection Status',
        'Issue Category',
        'Details'
    ];

    const dHeaderRow = detailSheet.addRow(detailHeaders);
    dHeaderRow.height = 25;
    dHeaderRow.eachCell((cell) => {
        cell.font = { name: 'Calibri', size: 11, bold: true, color: { argb: 'FFFFFF' } };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '1B365D' } };
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
    });

    let globalIdx = 1;
    rawData.forEach((pageData) => {
        (pageData.elements || []).forEach((item) => {
            const row = detailSheet.addRow([
                pageData.guideUrl,
                globalIdx++,
                item.elementType || 'Anchor',
                item.text || '',
                item.section || 'Body',
                item.rawHref || '',
                item.resolvedHref || '',
                item.finalUrl || '',
                item.statusCode || '',
                item.redirectionStatus || '',
                item.statusCategory || '',
                item.issueDescription || ''
            ]);

            // Conditional Row Colors
            if (item.is404) {
                row.eachCell((cell) => {
                    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FADBD8' } };
                });
                row.getCell(9).font = { bold: true, color: { argb: '900C3F' } };
                row.getCell(11).font = { bold: true, color: { argb: '900C3F' } };
            } else if (item.isRedirected) {
                row.eachCell((cell) => {
                    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FCF3CF' } };
                });
                row.getCell(10).font = { bold: true, color: { argb: '7D6608' } };
            } else if (item.isUnlinked) {
                row.eachCell((cell) => {
                    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FEF9E7' } };
                });
                row.getCell(11).font = { color: { argb: 'B7950B' } };
            }
        });
    });

    detailSheet.columns.forEach((column) => {
        let maxLength = 0;
        column.eachCell({ includeEmpty: true }, (cell) => {
            const columnLength = cell.value ? cell.value.toString().length : 10;
            if (columnLength > maxLength) {
                maxLength = columnLength;
            }
        });
        column.width = Math.min(Math.max(maxLength + 3, 12), 50);
    });

    const excelPath = path.join(__dirname, 'Buying_Guides_Audit_Report.xlsx');
    await workbook.xlsx.writeFile(excelPath);
    console.log(`✅ Excel Report generated: ${excelPath}`);

    // ==========================================
    // 2. GENERATE INTERACTIVE HTML DASHBOARD
    // ==========================================
    const htmlPath = path.join(__dirname, 'Buying_Guides_Audit_Dashboard.html');
    const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>WoodenStreet Beta - Buying Guides Link & Redirection Dashboard</title>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <style>
        :root {
            --bg-main: #f8fafc;
            --card-bg: #ffffff;
            --text-primary: #0f172a;
            --text-secondary: #475569;
            --border-color: #e2e8f0;
            --primary-blue: #2563eb;
            --danger-red: #ef4444;
            --warning-amber: #f59e0b;
            --success-green: #10b981;
            --info-indigo: #6366f1;
        }

        * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
            font-family: 'Inter', sans-serif;
        }

        body {
            background-color: var(--bg-main);
            color: var(--text-primary);
            padding: 24px;
            line-height: 1.5;
        }

        .header {
            background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
            color: #ffffff;
            padding: 28px 32px;
            border-radius: 16px;
            margin-bottom: 24px;
            box-shadow: 0 10px 25px -5px rgba(15, 23, 42, 0.2);
            display: flex;
            justify-content: space-between;
            align-items: center;
            flex-wrap: wrap;
            gap: 16px;
        }

        .header-title h1 {
            font-size: 24px;
            font-weight: 700;
            letter-spacing: -0.5px;
            margin-bottom: 6px;
        }

        .header-title p {
            font-size: 14px;
            color: #94a3b8;
        }

        .env-badge {
            background: rgba(37, 99, 235, 0.2);
            border: 1px solid rgba(59, 130, 246, 0.4);
            color: #60a5fa;
            padding: 6px 14px;
            border-radius: 9999px;
            font-size: 13px;
            font-weight: 600;
            display: inline-flex;
            align-items: center;
            gap: 6px;
        }

        /* KPI Cards Grid */
        .kpi-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 16px;
            margin-bottom: 24px;
        }

        .kpi-card {
            background: var(--card-bg);
            border: 1px solid var(--border-color);
            border-radius: 12px;
            padding: 20px;
            box-shadow: 0 1px 3px rgba(0,0,0,0.05);
            transition: transform 0.2s, box-shadow 0.2s;
        }

        .kpi-card:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(0,0,0,0.08);
        }

        .kpi-title {
            font-size: 13px;
            font-weight: 500;
            color: var(--text-secondary);
            margin-bottom: 8px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }

        .kpi-value {
            font-size: 28px;
            font-weight: 700;
            color: var(--text-primary);
        }

        .kpi-card.kpi-danger .kpi-value { color: var(--danger-red); }
        .kpi-card.kpi-warning .kpi-value { color: var(--warning-amber); }
        .kpi-card.kpi-success .kpi-value { color: var(--success-green); }
        .kpi-card.kpi-info .kpi-value { color: var(--info-indigo); }

        /* Filter Section */
        .controls-card {
            background: var(--card-bg);
            border: 1px solid var(--border-color);
            border-radius: 12px;
            padding: 20px;
            margin-bottom: 24px;
            box-shadow: 0 1px 3px rgba(0,0,0,0.05);
            display: flex;
            flex-direction: column;
            gap: 16px;
        }

        .filter-row {
            display: flex;
            align-items: center;
            gap: 12px;
            flex-wrap: wrap;
        }

        .filter-btn {
            background: #f1f5f9;
            border: 1px solid #cbd5e1;
            color: var(--text-secondary);
            padding: 8px 16px;
            border-radius: 8px;
            font-size: 13px;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.2s;
        }

        .filter-btn:hover {
            background: #e2e8f0;
        }

        .filter-btn.active {
            background: var(--primary-blue);
            color: #ffffff;
            border-color: var(--primary-blue);
            font-weight: 600;
        }

        .search-input {
            flex: 1;
            min-width: 260px;
            padding: 9px 16px;
            border: 1px solid var(--border-color);
            border-radius: 8px;
            font-size: 14px;
            outline: none;
            transition: border-color 0.2s;
        }

        .search-input:focus {
            border-color: var(--primary-blue);
            box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.15);
        }

        /* Page Tabs */
        .page-tabs {
            display: flex;
            gap: 8px;
            overflow-x: auto;
            padding-bottom: 4px;
            border-bottom: 1px solid var(--border-color);
        }

        .page-tab {
            padding: 8px 16px;
            font-size: 13px;
            font-weight: 500;
            color: var(--text-secondary);
            border-bottom: 2px solid transparent;
            cursor: pointer;
            white-space: nowrap;
        }

        .page-tab.active {
            color: var(--primary-blue);
            border-bottom-color: var(--primary-blue);
            font-weight: 600;
        }

        /* Table Styling */
        .table-container {
            background: var(--card-bg);
            border: 1px solid var(--border-color);
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 1px 3px rgba(0,0,0,0.05);
        }

        table {
            width: 100%;
            border-collapse: collapse;
            text-align: left;
            font-size: 13px;
        }

        th {
            background: #f8fafc;
            color: #475569;
            font-weight: 600;
            padding: 14px 16px;
            border-bottom: 1px solid var(--border-color);
            text-transform: uppercase;
            font-size: 11px;
            letter-spacing: 0.5px;
        }

        td {
            padding: 12px 16px;
            border-bottom: 1px solid var(--border-color);
            vertical-align: middle;
            word-break: break-word;
        }

        tr:last-child td {
            border-bottom: none;
        }

        tr:hover td {
            background-color: #f1f5f9;
        }

        tr.row-404 td {
            background-color: #fef2f2;
        }

        tr.row-redirect td {
            background-color: #fffbeb;
        }

        tr.row-unlinked td {
            background-color: #fafaf9;
        }

        /* Badges */
        .badge {
            display: inline-flex;
            align-items: center;
            padding: 4px 10px;
            border-radius: 9999px;
            font-size: 12px;
            font-weight: 600;
        }

        .badge-success { background: #dcfce7; color: #15803d; }
        .badge-danger { background: #fee2e2; color: #b91c1c; }
        .badge-warning { background: #fef3c7; color: #b45309; }
        .badge-secondary { background: #f1f5f9; color: #475569; }

        .url-link {
            color: var(--primary-blue);
            text-decoration: none;
            word-break: break-all;
        }

        .url-link:hover {
            text-decoration: underline;
        }

        .redirect-path {
            display: flex;
            flex-direction: column;
            gap: 2px;
            font-size: 12px;
        }

        .redirect-arrow {
            color: var(--warning-amber);
            font-weight: 700;
        }

        .footer {
            margin-top: 32px;
            text-align: center;
            color: var(--text-secondary);
            font-size: 13px;
        }
    </style>
</head>
<body>

    <div class="header">
        <div class="header-title">
            <h1>Buying Guides Link & Redirection Audit</h1>
            <p>Environment: beta.teamwoodenstreet.com | Generated: ${new Date().toLocaleString('en-IN')}</p>
        </div>
        <div>
            <span class="env-badge">
                <span>●</span> BETA TESTING SUITE
            </span>
        </div>
    </div>

    <!-- KPI Summary Cards -->
    <div class="kpi-grid">
        <div class="kpi-card kpi-info">
            <div class="kpi-title">Total Links & Buttons</div>
            <div class="kpi-value">${grandTotal}</div>
        </div>
        <div class="kpi-card kpi-success">
            <div class="kpi-title">Valid Direct (200 OK)</div>
            <div class="kpi-value">${grandValid}</div>
        </div>
        <div class="kpi-card kpi-warning">
            <div class="kpi-title">Redirected Links</div>
            <div class="kpi-value">${grandRedirected}</div>
        </div>
        <div class="kpi-card kpi-danger">
            <div class="kpi-title">404 Broken Links</div>
            <div class="kpi-value">${grand404}</div>
        </div>
        <div class="kpi-card">
            <div class="kpi-title">Unlinked / Empty Href</div>
            <div class="kpi-value">${grandUnlinked}</div>
        </div>
    </div>

    <!-- Filters & Page Tabs -->
    <div class="controls-card">
        <div class="page-tabs" id="pageTabs">
            <div class="page-tab active" data-page="ALL">All Buying Guides (${rawData.length})</div>
            ${rawData.map((p, idx) => `
                <div class="page-tab" data-page="${p.guideUrl}">${p.guideUrl.replace('https://beta.teamwoodenstreet.com/', '')}</div>
            `).join('')}
        </div>

        <div class="filter-row">
            <input type="text" id="searchInput" class="search-input" placeholder="Search link text, URL, section, or status code...">
            
            <button class="filter-btn active" data-status="ALL">All Statuses</button>
            <button class="filter-btn" data-status="404">❌ 404 Errors (${grand404})</button>
            <button class="filter-btn" data-status="REDIRECT">↪️ Redirects (${grandRedirected})</button>
            <button class="filter-btn" data-status="UNLINKED">⚠️ Unlinked Elements (${grandUnlinked})</button>
            <button class="filter-btn" data-status="VALID">✅ Valid Direct</button>
        </div>
    </div>

    <!-- Audit Data Table -->
    <div class="table-container">
        <table>
            <thead>
                <tr>
                    <th style="width: 5%;">#</th>
                    <th style="width: 22%;">Buying Guide Source</th>
                    <th style="width: 15%;">Link Label / Text</th>
                    <th style="width: 12%;">Section</th>
                    <th style="width: 25%;">Target URL / Redirection Path</th>
                    <th style="width: 10%;">HTTP Status</th>
                    <th style="width: 11%;">Status Category</th>
                </tr>
            </thead>
            <tbody id="tableBody">
            </tbody>
        </table>
    </div>

    <div class="footer">
        <p>WoodenStreet Quality Assurance Automation Suite &bull; Buying Guide Verification</p>
    </div>

    <script>
        const auditData = ${JSON.stringify(rawData)};
        let activePage = 'ALL';
        let activeStatus = 'ALL';
        let searchQuery = '';

        // Flatten data items
        const allItems = [];
        let indexCounter = 1;
        auditData.forEach(page => {
            (page.elements || []).forEach(item => {
                allItems.push({
                    ...item,
                    globalIndex: indexCounter++,
                    sourceGuideUrl: page.guideUrl
                });
            });
        });

        const tableBody = document.getElementById('tableBody');
        const searchInput = document.getElementById('searchInput');

        function renderTable() {
            const filtered = allItems.filter(item => {
                // Filter by Page
                if (activePage !== 'ALL' && item.sourceGuideUrl !== activePage) return false;

                // Filter by Status
                if (activeStatus === '404' && !item.is404) return false;
                if (activeStatus === 'REDIRECT' && !item.isRedirected) return false;
                if (activeStatus === 'UNLINKED' && !item.isUnlinked) return false;
                if (activeStatus === 'VALID' && (item.is404 || item.isRedirected || item.isUnlinked || item.statusCode !== 200)) return false;

                // Filter by Search Query
                if (searchQuery) {
                    const q = searchQuery.toLowerCase();
                    const textMatch = (item.text || '').toLowerCase().includes(q);
                    const hrefMatch = (item.resolvedHref || '').toLowerCase().includes(q);
                    const finalMatch = (item.finalUrl || '').toLowerCase().includes(q);
                    const sectionMatch = (item.section || '').toLowerCase().includes(q);
                    const statusMatch = String(item.statusCode || '').includes(q);
                    const guideMatch = (item.sourceGuideUrl || '').toLowerCase().includes(q);

                    if (!textMatch && !hrefMatch && !finalMatch && !sectionMatch && !statusMatch && !guideMatch) return false;
                }

                return true;
            });

            if (filtered.length === 0) {
                tableBody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 40px; color: #64748b;">No matching records found.</td></tr>';
                return;
            }

            tableBody.innerHTML = filtered.map(item => {
                let rowClass = '';
                let statusBadge = '<span class="badge badge-success">Valid (200)</span>';

                if (item.is404) {
                    rowClass = 'row-404';
                    statusBadge = '<span class="badge badge-danger">404 Broken</span>';
                } else if (item.isRedirected) {
                    rowClass = 'row-redirect';
                    statusBadge = '<span class="badge badge-warning">Redirected</span>';
                } else if (item.isUnlinked) {
                    rowClass = 'row-unlinked';
                    statusBadge = '<span class="badge badge-secondary">Unlinked</span>';
                }

                let targetDisplay = '';
                if (item.isUnlinked) {
                    targetDisplay = '<span style="color: #94a3b8; italic;">No Href / Empty</span>';
                } else if (item.isRedirected) {
                    targetDisplay = \`
                        <div class="redirect-path">
                            <a href="\${item.resolvedHref}" target="_blank" class="url-link">\${item.resolvedHref}</a>
                            <div><span class="redirect-arrow">↪ Redirects to:</span> <a href="\${item.finalUrl}" target="_blank" class="url-link" style="color: #d97706;">\${item.finalUrl}</a></div>
                        </div>
                    \`;
                } else {
                    targetDisplay = \`<a href="\${item.resolvedHref}" target="_blank" class="url-link">\${item.resolvedHref}</a>\`;
                }

                return \`
                    <tr class="\${rowClass}">
                        <td>\${item.globalIndex}</td>
                        <td><strong>\${item.sourceGuideUrl.replace('https://beta.teamwoodenstreet.com/', '')}</strong></td>
                        <td>\${escapeHtml(item.text)}</td>
                        <td><span style="background: #f1f5f9; padding: 2px 8px; border-radius: 4px; font-size: 11px;">\${escapeHtml(item.section)}</span></td>
                        <td>\${targetDisplay}</td>
                        <td><strong>\${item.statusCode}</strong></td>
                        <td>\${statusBadge}</td>
                    </tr>
                \`;
            }).join('');
        }

        function escapeHtml(str) {
            if (!str) return '';
            return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
        }

        // Tab Switching
        document.getElementById('pageTabs').addEventListener('click', (e) => {
            if (e.target.classList.contains('page-tab')) {
                document.querySelectorAll('.page-tab').forEach(t => t.classList.remove('active'));
                e.target.classList.add('active');
                activePage = e.target.getAttribute('data-page');
                renderTable();
            }
        });

        // Filter Buttons
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                activeStatus = btn.getAttribute('data-status');
                renderTable();
            });
        });

        // Search Input
        searchInput.addEventListener('input', (e) => {
            searchQuery = e.target.value;
            renderTable();
        });

        // Initial Render
        renderTable();
    </script>
</body>
</html>`;

    fs.writeFileSync(htmlPath, htmlContent, 'utf-8');
    console.log(`✅ Interactive HTML Dashboard generated: ${htmlPath}`);
    console.log('\n================ AUDIT REPORT GENERATION COMPLETE ================');
}

generateReports().catch(err => {
    console.error('Error generating reports:', err);
    process.exit(1);
});
