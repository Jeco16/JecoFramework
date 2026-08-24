import fs from 'fs/promises';
import path from 'path';

function safeAccess(p) {
  return fs
    .access(p)
    .then(() => true)
    .catch(() => false);
}

export default class CustomizeReportReporter {
  async onEnd(config, result) {
    try {
      const reportDir = path.resolve(process.cwd(), 'playwright-report');
      const indexHtml = path.join(reportDir, 'index.html');
      const cssPath = path.join(reportDir, 'custom.css');
      const logoPngPath = path.join(reportDir, 'logo.png');
      const logoSvgPath = path.join(reportDir, 'logo.svg');

      const exists = await safeAccess(indexHtml);
      if (!exists) {
        // nothing to customize
        return;
      }

      // write assets
      const css = `/* Custom Playwright report styles (injected by reporter) */
        \nbody { font-family: Inter, Arial, sans-serif; }
        \n.jeco-header { display:flex; align-items:center; gap:12px; padding:12px; }
        \n.jeco-header img { height:36px; }
        \n.jeco-run-title { font-weight:700; font-size:18px; }
        \n.jeco-metadata-panel { margin: 12px; padding: 12px; border: 1px solid #e6e6e6; background: #fafafa; border-radius: 6px; }
        \n.jeco-metadata-panel h3 { margin: 0 0 8px 0; }
        \n.jeco-meta-table { width: 100%; border-collapse: collapse; font-size: 13px; }
        \n.jeco-meta-table th, .jeco-meta-table td { text-align: left; padding: 6px 8px; border-bottom: 1px solid #eee; }
        \n.jeco-meta-table th { font-weight: 700; background: #f4f6f8; }\n`;
      await fs.writeFile(cssPath, css, 'utf8');

      // Prefer project-provided image if available
      const projectPng = path.resolve(process.cwd(), 'src', 'utils', 'images', 'logo.png');
      let headerLogoHref = './logo.svg';
      if (await safeAccess(projectPng)) {
        try {
          await fs.copyFile(projectPng, logoPngPath);
          headerLogoHref = './logo.png';
        } catch (e) {
          headerLogoHref = './logo.svg';
        }
      } else {
        const svg = `<?xml version="1.0" encoding="UTF-8"?>\n<svg xmlns="http://www.w3.org/2000/svg" width="120" height="36" viewBox="0 0 120 36">\n  <rect width="120" height="36" rx="6" fill="#2563EB" />\n  <text x="12" y="23" font-family="Arial,Helvetica,sans-serif" font-size="14" fill="#fff">JecoFramework</text>\n</svg>`;
        await fs.writeFile(logoSvgPath, svg, 'utf8');
        headerLogoHref = './logo.svg';
      }

      // patch index.html
      let html = await fs.readFile(indexHtml, 'utf8');
      if (!html.includes('custom.css')) {
        html = html.replace('</head>', '  <link rel="stylesheet" href="./custom.css">\n</head>');
      }
      if (!html.includes('jeco-header')) {
        html = html.replace(
          '<body>',
          `<body>\n  <div class="jeco-header">\n    <img src="${headerLogoHref}" alt="logo"/>\n    <div class="jeco-run-title">Custom Playwright Report</div>\n  </div>`
        );
      }
      // Aggregate metadata from report/data attachments written by tests
      const dataDir = path.join(reportDir, 'data');
      let metas = [];
      try {
        const dataEntries = await fs.readdir(dataDir);
        for (const e of dataEntries) {
          const p = path.join(dataDir, e);
          try {
            const raw = await fs.readFile(p, 'utf8');
            const obj = JSON.parse(raw);
            if (obj && obj.testId) metas.push(obj);
          } catch (err) {
            /* ignore non-json attachments */
          }
        }
      } catch (err) {
        /* ignore missing data dir */
      }

      // Fallback: try metadata.ndjson if present
      if (!metas.length) {
        const ndjsonPath = path.join(reportDir, 'metadata.ndjson');
        try {
          const raw = await fs.readFile(ndjsonPath, 'utf8');
          const lines = raw.split(/\r?\n/).filter(Boolean);
          metas = lines
            .map((l) => {
              try {
                return JSON.parse(l);
              } catch {
                return null;
              }
            })
            .filter(Boolean);
        } catch (e) {
          /* ignore */
        }
      }

      const embeddedPath = path.join(reportDir, 'metadata-embedded.json');
      try {
        await fs.writeFile(embeddedPath, JSON.stringify(metas), 'utf8');
      } catch (e) {
        // ignore
      }

      // Additionally scan workspace src/data for per-test json files and merge keys
      try {
        const workspaceDataDir = path.resolve(process.cwd(), 'src', 'data');
        async function findJsonFiles(dir, results = []) {
          const entries = await fs.readdir(dir, { withFileTypes: true });
          for (const ent of entries) {
            const p = path.join(dir, ent.name);
            if (ent.isDirectory()) await findJsonFiles(p, results);
            else if (ent.isFile() && ent.name.endsWith('.json')) results.push(p);
          }
          return results;
        }
        const jsonFiles = await findJsonFiles(workspaceDataDir).catch(() => []);
        for (const jf of jsonFiles) {
          try {
            const raw = await fs.readFile(jf, 'utf8');
            const obj = JSON.parse(raw);
            const testId = path.basename(jf, '.json');
            const rel = path.relative(process.cwd(), jf);
            // only add if not already present
            if (!metas.find((m) => m.testId === testId)) {
              metas.push({ title: testId, testId, dataFile: rel, keys: Object.keys(obj || {}) });
            }
          } catch (e) {
            // ignore
          }
        }
        // rewrite embedded file with merged data
        await fs.writeFile(embeddedPath, JSON.stringify(metas), 'utf8');
      } catch (e) {
        // ignore
      }

      const clientJsPath = path.join(reportDir, 'metadata-client.js');
      const clientJs = `document.addEventListener('DOMContentLoaded', async function(){\n  function esc(s){return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');}\n  try{\n    const res = await fetch('./metadata-embedded.json');\n    if(!res.ok) return;\n    const metas = await res.json();\n    if(!metas || !metas.length) return;\n    const container = document.createElement('div');\n    container.className = 'jeco-metadata-panel';\n    let html = '<h3>Test Metadata</h3><table class="jeco-meta-table"><thead><tr><th>Title</th><th>TestId</th><th>Data File</th><th>Keys</th></tr></thead><tbody>';
        metas.forEach(m=>{html += '<tr><td>'+esc(m.title)+'</td><td>'+esc(m.testId)+'</td><td>'+esc(m.dataFile)+'</td><td>'+esc((m.keys||[]).join(','))+'</td></tr>';});\n    html += '</tbody></table>';\n    container.innerHTML = html;\n    const header = document.querySelector('.jeco-header') || document.body;\n    header.insertAdjacentElement('afterend', container);\n  }catch(e){}\n});`;
      await fs.writeFile(clientJsPath, clientJs, 'utf8');
      // ensure favicon links to chosen logo
      if (!html.includes('rel="icon"')) {
        html = html.replace('</head>', `  <link rel="icon" href="${headerLogoHref}">\n</head>`);
      }
      // include client script before </body> if not present
      if (!html.includes('metadata-client.js')) {
        html = html.replace('</body>', `  <script src="./metadata-client.js"></script>\n</body>`);
      }
      await fs.writeFile(indexHtml, html, 'utf8');
    } catch (e) {
      // Do not fail the run if customization fails
      // eslint-disable-next-line no-console
      console.warn('CustomizeReportReporter failed:', e && e.message ? e.message : e);
    }
  }
}
