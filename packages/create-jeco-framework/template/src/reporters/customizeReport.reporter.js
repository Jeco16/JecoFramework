/*
Copyright 2026 Jacopo Enrico Marinaccio
Licensed under the Apache License, Version 2.0
You may obtain a copy at: http://www.apache.org/licenses/LICENSE-2.0
*/
import fs from 'fs/promises';
import path from 'path';

/**
 * @module reporters/customizeReport
 * @description Playwright custom reporter that aggregates per-test metadata from
 * `report/data` (and Playwright attachments) and emits a single-file `report/index.html`.
 */

/**
 * @typedef {Object} ReportMeta
 * @property {string} title
 * @property {string} testId
 * @property {string} dataFile
 * @property {string[]} keys
 * @property {string} status
 * @property {string|null} startTime
 * @property {number|null} duration
 * @property {Array<Object>} steps
 * @property {Array<Object>} attachments
 */

function safeAccess(p) {
  return fs
    .access(p)
    .then(() => true)
    .catch(() => false);
}

export default class CustomizeReportReporter {
  /**
   * Custom Playwright reporter that prepares `report/data` and builds `report/index.html`.
   */
  async onBegin() {
    try {
      const dataDir = path.join(process.cwd(), 'report', 'data');
      await fs.rm(dataDir, { recursive: true, force: true }).catch(() => {});
      await fs.mkdir(dataDir, { recursive: true });
      // also clear attachments from previous runs so report/attachments is fresh each run
      const attachmentsDir = path.join(process.cwd(), 'report', 'attachments');
      await fs.rm(attachmentsDir, { recursive: true, force: true }).catch(() => {});
      await fs.mkdir(attachmentsDir, { recursive: true }).catch(() => {});
    } catch (e) {
      // ignore
    }
  }
  async onEnd(config, result) {
    /**
     * Called by Playwright at the end of a run. It collects JSON metadata files,
     * merges runtime results and writes a self-contained HTML report.
     * @param {object} config - Playwright config object
     * @param {object} result - Playwright run result
     */
    try {
      const reportDir = path.resolve(process.cwd(), 'report');
      await fs.mkdir(reportDir, { recursive: true });
      const indexHtml = path.join(reportDir, 'index.html');

      const css = `/* Custom report styles */
    body { font-family: Inter, Arial, sans-serif; margin: 0; padding: 0; color:#111; background: #f3f4f6; }
    .jeco-header { display:flex; align-items:center; gap:12px; padding:16px 18px; background: linear-gradient(90deg,#ffffff, #f8fafc); box-shadow: 0 1px 0 rgba(0,0,0,0.04);} 
    .jeco-header img { height:56px; border-radius:8px; }
    .jeco-run-title { font-weight:700; font-size:20px; }
    .jeco-metadata-panel { margin: 16px auto; padding: 18px; border: 1px solid #eef2f7; background: #fff; border-radius: 10px; max-width:1100px; }
    .jeco-test-row { padding:12px 14px; border-bottom:1px solid #f1f5f9; display:flex; align-items:center; gap:12px; }
    .jeco-test-title { font-weight:600; font-size:15px; }
    .jeco-test-meta { color:#475569; font-size:13px; margin-top:4px; }
    .status-pass { background: rgba(16,185,129,0.03); }
    .status-fail { background: rgba(239,68,68,0.03); }
    .status-skip { background: rgba(245,158,11,0.03); }
    .status-other { background: rgba(99,102,241,0.03); }
    .jeco-test-meta strong.status-text { font-weight:700; padding:4px 8px; border-radius:6px; font-size:12px; }
    .status-pass .jeco-test-meta strong.status-text { color: #065f46; background: rgba(16,185,129,0.12); }
    .status-fail .jeco-test-meta strong.status-text { color: #7f1d1d; background: rgba(239,68,68,0.08); }
    .status-skip .jeco-test-meta strong.status-text { color: #92400e; background: rgba(245,158,11,0.08); }
    .step-row { margin:6px 0; }
    .step-pass strong.status-text { color: #16a34a; }
    .step-fail strong.status-text { color: #dc2626; }
    .step-skip strong.status-text { color: #f59e0b; }
    .jeco-steps { font-size:13px; transition: max-height 200ms ease; overflow:hidden; }
    .jeco-meta-json { background:#fff; border:1px solid #eef2f6; padding:10px; border-radius:8px; max-height:260px; overflow:auto; font-family:monospace; font-size:12px; }
    .attachments-grid { display:flex; gap:12px; flex-wrap:wrap; margin-top:10px; }
    .attachment-thumb { display:block; width:320px; }
    .attachment-thumb img { width:100%; height:220px; object-fit:cover; border-radius:8px; box-shadow: 0 6px 18px rgba(16,24,40,0.08); border:1px solid #eef2f6; transition: transform 140ms ease, box-shadow 140ms ease; cursor:pointer; }
    .attachment-thumb img:hover { transform:scale(1.03); box-shadow: 0 12px 36px rgba(16,24,40,0.12); }
    .attachment-caption { font-size:12px; color:#475569; margin-top:6px; }
    .lightbox { position:fixed; inset:0; display:flex; align-items:center; justify-content:center; background:rgba(2,6,23,0.7); z-index:9999; padding:20px; }
    .lightbox img, .lightbox video { max-width:calc(100% - 80px); max-height:calc(100% - 80px); border-radius:8px; box-shadow: 0 20px 60px rgba(2,6,23,0.6); }
    .lightbox .close { position:absolute; top:18px; right:20px; color:#fff; font-size:20px; cursor:pointer; }
    `;

      // copy logo if present
      const projectSvg = path.resolve(process.cwd(), 'src', 'utils', 'images', 'logo.svg');
      const projectPng = path.resolve(process.cwd(), 'src', 'utils', 'images', 'logo.png');
      const outSvg = path.join(reportDir, 'logo.svg');
      const outPng = path.join(reportDir, 'logo.png');
      let headerLogoHref = './logo.svg';
      const fallbackSvg = `<?xml version="1.0" encoding="UTF-8"?>\n<svg xmlns="http://www.w3.org/2000/svg" width="120" height="36" viewBox="0 0 120 36">\n  <rect width="120" height="36" rx="6" fill="#2563EB" />\n  <text x="12" y="23" font-family="Arial,Helvetica,sans-serif" font-size="14" fill="#fff">JecoFramework</text>\n</svg>`;
      if (await safeAccess(projectSvg)) {
        try {
          await fs.copyFile(projectSvg, outSvg);
          headerLogoHref = './logo.svg';
        } catch (e) {
          await fs.writeFile(outSvg, fallbackSvg, 'utf8');
        }
      } else if (await safeAccess(projectPng)) {
        try {
          await fs.copyFile(projectPng, outPng);
          headerLogoHref = './logo.png';
        } catch (e) {
          await fs.writeFile(outSvg, fallbackSvg, 'utf8');
        }
      } else {
        await fs.writeFile(outSvg, fallbackSvg, 'utf8');
      }

      // collect metadata JSONs from possible locations
      const possibleDataDirs = [
        path.join(process.cwd(), 'playwright-report', 'data'),
        path.join(process.cwd(), 'report', 'data'),
      ];
      let metas = [];
      for (const d of possibleDataDirs) {
        try {
          const entries = await fs.readdir(d);
          for (const e of entries) {
            const p = path.join(d, e);
            try {
              const raw = await fs.readFile(p, 'utf8');
              const obj = JSON.parse(raw);
              if (obj && (obj.testId || obj.title)) {
                // mark as run if it contains status/start/duration
                obj.ran = !!(
                  obj.status ||
                  obj.startTime ||
                  (typeof obj.duration === 'number' && obj.duration !== null)
                );
                metas.push(obj);
              }
            } catch (e) {
              /* ignore */
            }
          }
        } catch (e) {
          /* ignore missing dir */
        }
      }

      // also add src/data jsons
      try {
        const walk = async (dir, out = []) => {
          const ents = await fs.readdir(dir, { withFileTypes: true });
          for (const ent of ents) {
            const p = path.join(dir, ent.name);
            if (ent.isDirectory()) await walk(p, out);
            else if (ent.isFile() && ent.name.endsWith('.json')) out.push(p);
          }
          return out;
        };
        const jsonFiles = await walk(path.join(process.cwd(), 'src', 'data')).catch(() => []);
        for (const jf of jsonFiles) {
          try {
            const raw = await fs.readFile(jf, 'utf8');
            const obj = JSON.parse(raw);
            const id = path.basename(jf, '.json');
            const rel = path.relative(process.cwd(), jf).replace(/\\/g, '/');
            if (!metas.find((m) => m.testId === id))
              metas.push({ title: id, testId: id, dataFile: rel, keys: Object.keys(obj || {}) });
          } catch (e) {
            /* ignore */
          }
        }
      } catch (e) {
        /* ignore */
      }

      // try extracting from Playwright result (best-effort)
      const collectTestsFromResult = (node, out = []) => {
        if (!node || typeof node !== 'object') return out;
        if (Array.isArray(node)) {
          for (const v of node) collectTestsFromResult(v, out);
          return out;
        }
        if (Array.isArray(node.tests)) {
          for (const t of node.tests) {
            const title = t.title || t.name || '';
            const resultsArr = t.results || (t.result ? [t.result] : t.results || []);
            if (Array.isArray(resultsArr) && resultsArr.length) {
              for (const r of resultsArr) {
                out.push({
                  title,
                  status: r.status || r.outcome || r.status,
                  startTime: r.startTime || r.start,
                  duration: r.duration || null,
                  steps: r.steps || [],
                });
              }
            } else {
              out.push({
                title,
                status: t.status || '',
                startTime: t.startTime,
                duration: t.duration,
                steps: t.steps || [],
              });
            }
          }
        }
        for (const k of Object.keys(node)) {
          if (k === 'tests' || k === 'results') continue;
          collectTestsFromResult(node[k], out);
        }
        return out;
      };

      const extracted = collectTestsFromResult(result || {});
      for (const t of extracted) {
        const match = metas.find(
          (m) =>
            m.title === t.title ||
            m.testId === t.title ||
            (t.title && m.testId === t.title.split(' ').pop())
        );
        if (match) {
          match.status = t.status || match.status || '';
          match.startTime = t.startTime || match.startTime || null;
          match.duration = t.duration || match.duration || null;
          match.steps = t.steps || match.steps || [];
          match.ran = true;
        } else {
          metas.push({
            title: t.title,
            testId: t.title,
            dataFile: '',
            keys: [],
            status: t.status,
            startTime: t.startTime,
            duration: t.duration,
            steps: t.steps || [],
            ran: true,
          });
        }
      }

      // keep only run tests
      metas = metas.filter((m) => m && m.ran);

      // debug dump
      try {
        await fs.writeFile(
          path.join(reportDir, 'result-keys.json'),
          JSON.stringify(Object.keys(result || {}), null, 2),
          'utf8'
        );
      } catch (e) {
        /* ignore */
      }

      // embed data and render pie + list
      const embedded = JSON.stringify(metas || []);
      const now = new Date();
      const runDateStr =
        now.toLocaleDateString('en-GB') +
        ' ' +
        now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
      const html = `<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>JecoFramework</title>
  <style>${css}</style>
  <link rel="icon" href="${headerLogoHref}">
</head>
<body>
  <div class="jeco-header">
    <img src="${headerLogoHref}" alt="logo"/>
    <div class="jeco-run-title">Report of ${runDateStr}</div>
  </div>
  <div id="report-body">
    <div class="jeco-metadata-panel">
      <h3>Run Summary</h3>
      <div style="display:flex;gap:24px;align-items:center;flex-wrap:wrap">
        <canvas id="pieChart" width="300" height="200"></canvas>
        <div id="legend" style="font-size:13px"></div>
      </div>
      <h4 style="margin-top:16px;margin-bottom:8px">Tests</h4>
      <div id="test-list"></div>
      <script id="embedded-data" type="application/json">${embedded}</script>
      <script>
      (function(){
        const metas = JSON.parse(document.getElementById('embedded-data').textContent || '[]');
        const counts = { passed:0, failed:0, skipped:0 };
        metas.forEach(m => { const s = (m.status||'').toLowerCase(); if (s==='passed') counts.passed++; else if (s==='failed') counts.failed++; else if (s==='skipped' || s==='timedout') counts.skipped++; });
        const total = counts.passed + counts.failed + counts.skipped || 1;
        const canvas = document.getElementById('pieChart');
        const ctx = canvas.getContext('2d');
        const cx = canvas.width/2, cy = canvas.height/2, radius = Math.min(cx, cy) - 10;
        const slices = [ {label:'Passed', value:counts.passed, color:'#16a34a'}, {label:'Failed', value:counts.failed, color:'#dc2626'}, {label:'Skipped', value:counts.skipped, color:'#f59e0b'} ];
        let start = -0.5 * Math.PI;
        slices.forEach(s => { const ang = (s.value/total) * 2 * Math.PI; ctx.beginPath(); ctx.moveTo(cx, cy); ctx.fillStyle = s.color; ctx.arc(cx, cy, radius, start, start + ang); ctx.closePath(); ctx.fill(); start += ang; });
        // compute success percentage and render legend with percentage
        const totalTests = counts.passed + counts.failed + counts.skipped;
        const successPercent = totalTests ? Math.round((counts.passed / totalTests) * 100) : 0;
        const slicesHtml = slices.map(s => '<div style="display:flex;align-items:center;gap:8px;margin-bottom:6px"><span style="width:12px;height:12px;background:' + s.color + ';display:inline-block;border-radius:2px"></span><strong style="width:60px">' + s.label + '</strong> ' + s.value + '</div>').join('');
        document.getElementById('legend').innerHTML = '<div style="display:flex;flex-direction:column;gap:8px"><div style="display:flex;align-items:center;gap:12px"><div style="font-size:28px;font-weight:700">' + successPercent + '%</div><div style="font-size:13px;color:#6b7280">Success rate</div></div>' + slicesHtml + '</div>';
        const list = document.getElementById('test-list');
        if (!metas.length) { list.innerHTML = '<div>No tests found</div>'; return; }
        function fmt(d){ try{ if(!d) return ''; const D = new Date(d); return D.toLocaleString('it-IT'); } catch(e){ return d||''; } }
        list.innerHTML = metas.map((m, idx) => {
          const rawStatus = m.status || '';
          const st = (rawStatus || '').toLowerCase();
          const cls = st==='passed' ? 'status-pass' : st==='failed' ? 'status-fail' : (st==='skipped' || st==='timedout') ? 'status-skip' : 'status-other';
          const s = fmt(m.startTime);
          const dur = m.duration != null ? m.duration + ' ms' : '';
          const statusHtml = '<strong class="status-text">' + (rawStatus || '') + '</strong>';
          // build steps html collapsed by default and include attachments inside the expandable panel
          let stepsHtml = '';
          try {
            let stepsInner = '';
            if (Array.isArray(m.steps) && m.steps.length) {
              const items = m.steps.map(function(s){
                const raw = s.status || '';
                const st2 = (raw || '').toLowerCase();
                const cls2 = st2==='passed' ? 'step-pass' : st2==='failed' ? 'step-fail' : (st2==='skipped' || st2==='timedout') ? 'step-skip' : '';
                const dur2 = s.duration ? ' ('+s.duration+'ms)' : '';
                const statusHtml2 = '<strong class="status-text">'+ (raw || '') +'</strong>';
                return '<li class="step-row ' + cls2 + '">' + (s.title||s.name||'') + ' — ' + statusHtml2 + dur2 + '</li>';
              }).join('');
              stepsInner = '<ul style="margin:0;padding-left:18px">' + items + '</ul>';
            } else {
              const dbg = "<div>No steps recorded for this test. Ensure tests use 'test.step' or enable Playwright report data.</div>";
              const metaJson = '<pre class="jeco-meta-json">' + (function(){ try { return JSON.stringify(m, null, 2); } catch(e){ return String(m); } })() + '</pre>';
              stepsInner = dbg + metaJson;
            }

            // attachments rendering (filter metadata and inject inside steps panel)
            let attachmentsInner = '';
            if (Array.isArray(m.attachments) && m.attachments.length) {
              const files = (m.attachments || []).filter(a => {
                const ct = (a.contentType || '').toLowerCase();
                const name = (a.name || '').toLowerCase();
                if (ct.indexOf('application/json') === 0) return false;
                if (name === 'test-metadata' || name === 'metadata' || name === 'test-metadata.json') return false;
                return true;
              });
              if (files.length) {
                attachmentsInner = '<div class="attachments-grid">' + files.map(function(a){
                  const p = a.path || '';
                  const name = a.name || p.split('/').pop();
                  const ct = (a.contentType || '').toLowerCase();
                  if (ct.startsWith('image/') || p.match(/(png|jpg|jpeg|gif)$/i)) {
                    const inline = a.inline || null;
                    const src = inline ? inline : encodeURI(p);
                    return '<div class="attachment-thumb">' +
                      '<img src="' + src + '" alt="' + name + '" data-src="' + (inline ? src : encodeURI(p)) + '"/>' +
                      '<div class="attachment-caption">' + name + '</div>' +
                    '</div>';
                  }
                  if (ct.startsWith('video/') || p.match(/(mp4|webm)$/i)) {
                    const src = encodeURI(p);
                    return '<div class="attachment-thumb">' +
                      '<video controls preload="metadata" style="width:100%;height:140px;object-fit:cover;border-radius:8px"><source src="' + src + '"></video>' +
                      '<div class="attachment-caption">' + name + '</div>' +
                    '</div>';
                  }
                  return '<div class="attachment-thumb"><a href="' + p + '" target="_blank">' + name + '</a></div>';
                }).join('') + '</div>';
              }
            }

            stepsHtml = '<div class="jeco-steps" style="display:none;margin:6px 0 12px 12px;padding:12px;background:#fafafa;border-radius:6px">' + stepsInner + attachmentsInner + '</div>';
          } catch (e) {
            stepsHtml = '<div class="jeco-steps" style="display:none;margin:6px 0 12px 12px;padding:12px;background:#fafafa;border-radius:6px">Error rendering steps</div>';
          }
          return '<div data-idx="' + idx + '">' +
            '<div class="jeco-test-row ' + cls + '" role="button" tabindex="0">' +
              '<div class="jeco-test-title">' + (m.title||m.testId) + '</div>' +
              '<div class="jeco-test-meta">' + statusHtml + (s ? ' — ' + s : '') + (dur ? ' — ' + dur : '') + '</div>' +
            '</div>' +
            stepsHtml +
          '</div>';
        }).join('');

        // attach click/keyboard handlers to toggle steps
        Array.from(list.querySelectorAll('[data-idx]')).forEach(function(container){
          const row = container.querySelector('.jeco-test-row');
          const steps = container.querySelector('.jeco-steps');
          if (!row || !steps) return;
          row.style.cursor = 'pointer';
          row.addEventListener('click', function(){
            steps.style.display = steps.style.display === 'none' ? 'block' : 'none';
            if (steps.style.display === 'block') row.setAttribute('aria-expanded', 'true'); else row.setAttribute('aria-expanded', 'false');
          });
          row.addEventListener('keydown', function(e){ if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); row.click(); } });
        });
        // lightbox: open clicked image in overlay
        function ensureLightbox(){
          if (document.querySelector('.lightbox')) return document.querySelector('.lightbox');
          const lb = document.createElement('div'); lb.className = 'lightbox'; lb.style.display='none';
          const img = document.createElement('img'); lb.appendChild(img);
          const close = document.createElement('div'); close.className='close'; close.textContent='✕'; lb.appendChild(close);
          close.addEventListener('click', function(){ lb.style.display='none'; });
          lb.addEventListener('click', function(e){ if (e.target === lb) lb.style.display='none'; });
          document.body.appendChild(lb);
          return lb;
        }
        Array.from(list.querySelectorAll('.attachment-thumb img')).forEach(function(img){
          img.addEventListener('click', function(e){
            const src = img.getAttribute('data-src') || img.src;
            const lb = ensureLightbox();
            const el = lb.querySelector('img');
            el.src = src;
            lb.style.display = 'flex';
          });
        });
      })();
      </script>
    </div>
  </div>
</body>
</html>`;

      await fs.writeFile(indexHtml, html, 'utf8');
    } catch (e) {
      // Do not fail the run if customization fails
      // eslint-disable-next-line no-console
      console.warn('CustomizeReportReporter failed:', e && e.message ? e.message : e);
    }
  }
}
