/**
 * ============================================================================
 * GENIEFLOW AI — LIVE EAMS FILENET DOCKET EXTRACTOR (1-CLICK BROWSER SNIPPET)
 * ============================================================================
 * Instructions:
 * 1. On your open EAMS tab (https://eamsdm.dwc.ca.gov/eamsnavigator/...), 
 *    press F12 (or Right-Click -> Inspect) and click on the "Console" tab.
 * 2. Paste this entire script and hit Enter.
 * 3. It will instantly extract all 35 documents, copy the JSON to your clipboard,
 *    and trigger an automatic download of 'EAMS_ADJ20494186_DOCKET_EXPORT.json'.
 * ============================================================================
 */
(function extractEAMSDocket() {
  console.log("%c[GenieFlow AI] Scanning EAMS FileNet P8 Workspace...", "color: #06b6d4; font-weight: bold; font-size: 14px;");

  const urlParams = new URLSearchParams(window.location.search);
  const caseId = urlParams.get('caseid') || 'ADJ20494186';
  const caseType = urlParams.get('casetype') || 'ADJ';

  let extractedDocs = [];

  // METHOD 1: Query IBM Content Navigator (ICN) Dojo Desktop Model
  try {
    if (window.ecm && window.ecm.model && window.ecm.model.desktop) {
      const searchWidget = dijit.registry.toArray().find(w => w.resultSet && w.resultSet.items && w.resultSet.items.length > 0);
      if (searchWidget && searchWidget.resultSet && searchWidget.resultSet.items) {
        console.log("%c[GenieFlow AI] Found active ICN ResultSet with " + searchWidget.resultSet.items.length + " items.", "color: #10b981; font-weight: bold;");
        extractedDocs = searchWidget.resultSet.items.map((item, idx) => ({
          doc_index: idx + 1,
          name: item.name || item.attributes?.DocumentTitle || 'Untitled Document',
          doc_title: item.attributes?.DocTitle || item.attributes?.DocumentTitle || item.name,
          doc_type: item.attributes?.DocType || 'UNKNOWN',
          doc_status: item.attributes?.DocStatus || 'PUBLIC',
          case_id: item.attributes?.CaseID || caseId,
          case_type: item.attributes?.CaseType || caseType,
          doc_date: item.attributes?.DocDate || null,
          received_date: item.attributes?.ReceivedDate || null,
          entry_date: item.attributes?.DocEntryDate || null,
          author_proponent: item.attributes?.Author || item.attributes?.Proponent || null,
          filenet_id: item.id || null,
          vs_id: item.vsId || null,
          mimetype: item.mimetype || 'application/pdf'
        }));
      }
    }
  } catch (err) {
    console.warn("[GenieFlow AI] ICN internal store lookup bypassed, using DOM traversal:", err);
  }

  // METHOD 2: DOM Grid Traversal Fallback
  if (extractedDocs.length === 0) {
    console.log("%c[GenieFlow AI] Extracting from visible DOM grid elements...", "color: #f59e0b; font-weight: bold;");
    const rows = document.querySelectorAll('tr[role="row"], .gridxRow, .ecmContentList tr, table tbody tr');
    let idx = 1;
    rows.forEach(row => {
      const cells = Array.from(row.querySelectorAll('td, th, [role="gridcell"]')).map(c => c.innerText.trim());
      if (cells.length >= 3 && !cells[0].toLowerCase().includes('name') && cells.some(c => c.length > 0)) {
        extractedDocs.push({
          doc_index: idx++,
          name: cells[0] || cells[1] || 'Document',
          doc_title: cells[1] || cells[0] || 'Document',
          doc_type: cells[2] || 'LEGAL DOCS',
          doc_status: cells[3] || 'PUBLIC',
          proponent: cells[6] || null,
          author: cells[7] || null,
          raw_columns: cells
        });
      }
    });
  }

  const exportData = {
    case_id: caseId,
    case_type: caseType,
    url: window.location.href,
    repository: 'EAMS (IBM FileNet P8)',
    extracted_at: new Date().toISOString(),
    total_documents: extractedDocs.length,
    documents: extractedDocs
  };

  const jsonStr = JSON.stringify(exportData, null, 2);

  try {
    navigator.clipboard.writeText(jsonStr);
    console.log("%c[GenieFlow AI] ✓ Copied JSON to clipboard!", "color: #10b981; font-weight: bold;");
  } catch(e) {}

  const blob = new Blob([jsonStr], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `EAMS_${caseId}_FILENET_EXPORT.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);

  const banner = document.createElement('div');
  banner.style.cssText = 'position:fixed;top:20px;right:20px;background:#0f172a;color:#fff;border:2px solid #10b981;border-radius:10px;padding:16px 20px;z-index:999999;box-shadow:0 10px 30px rgba(0,0,0,0.5);font-family:sans-serif;font-size:14px;max-width:380px;';
  banner.innerHTML = `
    <div style="display:flex;align-items:center;gap:10px;margin-bottom:8px;">
      <span style="background:#10b981;color:#fff;border-radius:50%;width:24px;height:24px;display:flex;align-items:center;justify-content:center;font-weight:bold;">✓</span>
      <strong style="color:#10b981;font-size:15px;">GenieFlow AI Ingestion</strong>
    </div>
    <div style="font-size:13px;line-height:1.5;color:#e2e8f0;">
      Successfully captured <strong>${extractedDocs.length} items</strong> for case <strong>${caseId}</strong>.<br>
      ✓ Exported to <code>EAMS_${caseId}_FILENET_EXPORT.json</code><br>
      ✓ Copied JSON to your clipboard
    </div>
    <button onclick="this.parentElement.remove()" style="margin-top:10px;background:#1e293b;color:#94a3b8;border:1px solid #334155;border-radius:4px;padding:4px 10px;cursor:pointer;font-size:12px;">Dismiss</button>
  `;
  document.body.appendChild(banner);

  return exportData;
})();
