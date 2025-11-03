import fs from 'node:fs/promises';
import path from 'node:path';

// ---------- Basic FS helpers ----------
export async function ensureDir(dir) {
  await fs.mkdir(dir, { recursive: true });
}

export async function writeJSON(filePath, data) {
  await ensureDir(path.dirname(filePath));
  await fs.writeFile(filePath, JSON.stringify(data, null, 2));
}

export async function writeText(filePath, text) {
  await ensureDir(path.dirname(filePath));
  await fs.writeFile(filePath, text);
}

// ---------- Run/date helpers ----------
export function todayStamp() {
  const d = new Date();
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yy = String(d.getFullYear()).slice(-2);
  return `${dd}-${mm}-${yy}`; // e.g., 25-10-25
}

// Save results to Search-results/<subDir>/<DD-MM-YY>/<fileBase>.{json,csv}
// csvMaker should be a function like toCSV(results)
export async function saveResults(rootDir, subDir, fileBase, results, csvMaker) {
  const stamp = todayStamp();
  const dir = path.join(rootDir, subDir, stamp);
  await ensureDir(dir);
  await fs.writeFile(path.join(dir, `${fileBase}.json`), JSON.stringify(results, null, 2));
  await fs.writeFile(path.join(dir, `${fileBase}.csv`), csvMaker(results));
  return dir;
}

// ---------- CSV parsing for our 3-column schema ----------
// Assumes header: "title","url","snippet"
export function parseCSV(text) {
  const lines = text.split(/\r?\n/).filter(Boolean);
  if (lines.length < 2) return [];
  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    const cells = [];
    let cur = '', inQ = false;
    for (let j = 0; j < line.length; j++) {
      const ch = line[j];
      if (ch === '"') {
        if (inQ && line[j + 1] === '"') { cur += '"'; j++; }
        else { inQ = !inQ; }
      } else if (ch === ',' && !inQ) {
        cells.push(cur); cur = '';
      } else {
        cur += ch;
      }
    }
    cells.push(cur);
    const [title = '', url = '', snippet = ''] = cells.map(s => s.replace(/^"|"$/g, ''));
    if (url) rows.push({ title, link: url, snippet });
  }
  return rows;
}

// ---------- Load latest (or specific) saved results ----------
// source: 'ats' | 'nonats'
// opts.date: 'DD-MM-YY' to load a specific run folder
export async function loadLocalResults(source, opts = {}) {
  const requestedStamp = (opts.date || '').trim(); // expects DD-MM-YY if provided
  const roots = ['Search-results', 'search-results']; // support both capitalisations
  const subDir = source === 'ats' ? 'ats-results' : 'website-results';
  const fileBase = source === 'ats' ? 'ats' : 'nonats';

  const stampToKey = (s) => {
    const m = /^(\d{2})-(\d{2})-(\d{2})$/.exec(s);
    if (!m) return -Infinity;
    const [, dd, mm, yy] = m;
    const year = Number('20' + yy);
    return new Date(year, Number(mm) - 1, Number(dd)).getTime();
  };

  // Prefer date-stamped folders
  for (const root of roots) {
    try {
      const baseDir = path.join(process.cwd(), root, subDir);
      const entries = await fs.readdir(baseDir, { withFileTypes: true });
      let candidates = entries.filter(e => e.isDirectory()).map(e => e.name);
      if (requestedStamp) candidates = candidates.filter(n => n === requestedStamp);
      candidates.sort((a, b) => stampToKey(b) - stampToKey(a)); // newest first
      for (const stamp of candidates) {
        const dir = path.join(baseDir, stamp);
        // prefer JSON
        try {
          const jsonPath = path.join(dir, `${fileBase}.json`);
          const txt = await fs.readFile(jsonPath, 'utf8');
          const arr = JSON.parse(txt);
          return arr.map(r => ({ title: r.title, link: r.link, snippet: r.snippet }));
        } catch {}
        // fallback to CSV
        try {
          const csvPath = path.join(dir, `${fileBase}.csv`);
          const txt = await fs.readFile(csvPath, 'utf8');
          return parseCSV(txt);
        } catch {}
      }
    } catch {}
  }

  // Nothing found
  return [];
}
