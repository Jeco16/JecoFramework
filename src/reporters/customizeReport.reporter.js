import fs from 'fs/promises';
import path from 'path';

function safeAccess(p) {
  return fs
    .access(p)
    .then(() => true)
    .catch(() => false);
}

export default class CustomizeReportReporter {
  async onBegin() {
    try {
      const dataDir = path.join(process.cwd(), 'report', 'data');
      await fs.rm(dataDir, { recursive: true, force: true }).catch(() => {});
      await fs.mkdir(dataDir, { recursive: true });
    } catch (e) {
      // ignore
    }
  }
  async onEnd(config, result) {
    try {
      const reportDir = path.resolve(process.cwd(), 'report');
      await fs.mkdir(reportDir, { recursive: true });
      const indexHtml = path.join(reportDir, 'index.html');

      const css = `/* Custom report styles */
body { font-family: Inter, Arial, sans-serif; margin: 0; padding: 0; }
.jeco-header { display:flex; align-items:center; gap:12px; padding:12px; background: #f6f8fa; }
.jeco-header img { height:70px; border-radius:6px; }
.jeco-run-title { font-weight:700; font-size:25px; }
.jeco-metadata-panel { margin: 12px; padding: 12px; border: 1px solid #e6e6e6; background: #fff; border-radius: 6px; }
.jeco-test-row { padding:8px 10px; border-bottom:1px solid #f0f0f0; }
.jeco-test-title { font-weight:600; }
  .jeco-test-meta { color:#666; font-size:13px; margin-top:4px; }
  .status-pass { background: rgba(16,185,129,0.03); }
  .status-fail { background: rgba(239,68,68,0.03); }
  .status-skip { background: rgba(245,158,11,0.03); }
  .status-other { background: rgba(99,102,241,0.03); }
  .jeco-test-meta strong.status-text { font-weight:700; }
  .status-pass .jeco-test-meta strong.status-text { color: #16a34a; }
  .status-fail .jeco-test-meta strong.status-text { color: #dc2626; }
  .status-skip .jeco-test-meta strong.status-text { color: #f59e0b; }
  .step-row { margin:4px 0; }
  .step-pass strong.status-text { color: #16a34a; }
  .step-fail strong.status-text { color: #dc2626; }
  .step-skip strong.status-text { color: #f59e0b; }
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
        document.getElementById('legend').innerHTML = slices.map(s => '<div style="display:flex;align-items:center;gap:8px;margin-bottom:6px"><span style="width:12px;height:12px;background:' + s.color + ';display:inline-block;border-radius:2px"></span><strong style="width:60px">' + s.label + '</strong> ' + s.value + '</div>').join('');
        const list = document.getElementById('test-list');
        if (!metas.length) { list.innerHTML = '<div>No tests found</div>'; return; }
        function fmt(d){ try{ if(!d) return ''; const D = new Date(d); return D.toLocaleString('it-IT'); } catch(e){ return d||''; } }
        list.innerHTML = metas.map(m => {
          const rawStatus = m.status || '';
          const st = (rawStatus || '').toLowerCase();
          const cls = st==='passed' ? 'status-pass' : st==='failed' ? 'status-fail' : (st==='skipped' || st==='timedout') ? 'status-skip' : 'status-other';
          const s = fmt(m.startTime);
          const dur = m.duration != null ? m.duration + ' ms' : '';
          const statusHtml = '<strong class="status-text">' + (rawStatus || '') + '</strong>';
          return '<div class="jeco-test-row ' + cls + '"><div class="jeco-test-title">' + (m.title||m.testId) + '</div><div class="jeco-test-meta">' + statusHtml + (s ? ' — ' + s : '') + (dur ? ' — ' + dur : '') + '</div></div>';
        }).join('');
        metas.forEach(m => {
          if (Array.isArray(m.steps) && m.steps.length) {
            const c = document.createElement('div');
            let h = '<details style="margin:6px 0"><summary>Steps for ' + (m.title||m.testId) + '</summary><ul>';
            h += m.steps.map(function(s){
              const raw = s.status || '';
              const st = (raw || '').toLowerCase();
              const cls = st==='passed' ? 'step-pass' : st==='failed' ? 'step-fail' : (st==='skipped' || st==='timedout') ? 'step-skip' : '';
              const dur = s.duration ? ' ('+s.duration+'ms)' : '';
              const statusHtml = '<strong class="status-text">'+ (raw || '') +'</strong>';
              return '<li class="step-row ' + cls + '">' + (s.title||s.name||'') + ' — ' + statusHtml + dur + '</li>';
            }).join('');
            h += '</ul></details>';
            c.innerHTML = h;
            list.appendChild(c);
          }
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
