import express from 'express';
import { toCSV, applyUserFilters, filterByDomains } from '../utils/textFilters.mjs';
import { loadLocalResults, saveResults as saveFiles } from '../utils/fileUtils.mjs';
import { loadSeen, saveSeen, tagAndUpdateSeen } from '../utils/dedupe.mjs';

export const refineRoutes = express.Router();

// Convert DD-MM-YY (e.g., 25-10-25) to ISO YYYY-MM-DD (e.g., 2025-10-25)
function stampToISO(stamp) {
  const m = /^(\d{2})-(\d{2})-(\d{2})$/.exec(String(stamp || ''));
  if (!m) return null;
  const [, dd, mm, yy] = m;
  const year = Number('20' + yy);
  return `${year.toString().padStart(4,'0')}-${mm}-${dd}`;
}

/**
 * GET /api/refine/local
 * Params:
 *   source=ats|nonats        (required)
 *   country=UK               (optional)
 *   region=uk|eu             (optional)
 *   workMode=remote|hybrid   (optional)
 *   maxYears=3               (optional)
 *   langs=typescript,node    (optional, comma-separated)
 *   includeStartups=1|0      (optional; default 1; keeps Wellfound/WTTJ)
 *   date=DD-MM-YY            (optional; load specific run folder)
 *   newOnly=1                (optional; only items not seen before)
 *   since=YYYY-MM-DD         (optional; filter by firstSeen/lastSeen)
 *   sortBy=firstSeen|lastSeen(optional; sort tagged results)
 *   save=1                   (optional; saves refined.{json,csv} to date dir)
 *   csv=1                    (optional; respond as CSV)
 */
refineRoutes.get('/local', async (req, res) => {
  try {
    const source = String(req.query.source || '').toLowerCase();
    if (source !== 'ats' && source !== 'nonats') {
      return res.status(400).json({ error: "source must be 'ats' or 'nonats'" });
    }

    // Query params
    const includeStartups = String(req.query.includeStartups || '1') !== '0';
    const asCSV = String(req.query.csv || '') === '1';
    const save = String(req.query.save || '') === '1';
    const dateStamp = (req.query.date || '').trim(); // DD-MM-YY or ''

    const country = req.query.country || '';
    const region = req.query.region || '';
    const workMode = req.query.workMode || '';
    const maxYears = req.query.maxYears != null && req.query.maxYears !== ''
      ? Number(req.query.maxYears)
      : null;
    const langs = req.query.langs || '';

    const newOnly = String(req.query.newOnly || '') === '1';
    const since = (req.query.since || '').trim(); // YYYY-MM-DD
    const sortBy = String(req.query.sortBy || '').toLowerCase(); // 'firstseen'|'lastseen'

    // Load latest (or specific) saved results
    const raw = await loadLocalResults(source, { date: dateStamp });

    // Domain & text filters
    const domFiltered = filterByDomains(raw, { includeStartups });
    const filtered = applyUserFilters(domFiltered, {
      country, region, workMode, maxYears, langs,
    });

    // Tag with seen-index (firstSeen/lastSeen/isNew)
    const runISO = stampToISO(dateStamp) || new Date().toISOString().slice(0,10);
    const seen = await loadSeen(source);
    let tagged = tagAndUpdateSeen(seen, filtered, runISO);

    // Optional: filter by newOnly or since
    if (newOnly) {
      tagged = tagged.filter(r => r.isNew);
    } else if (since) {
      tagged = tagged.filter(r => (r.firstSeen || '') >= since || (r.lastSeen || '') >= since);
    }

    // Optional: sort
    if (sortBy === 'firstseen') {
      tagged.sort((a,b) => (b.firstSeen || '').localeCompare(a.firstSeen || ''));
    } else if (sortBy === 'lastseen') {
      tagged.sort((a,b) => (b.lastSeen || '').localeCompare(a.lastSeen || ''));
    }

    // Persist seen index (we do this regardless so the index stays current)
    await saveSeen(source, seen);

    // Save refined outputs into the date-stamped folder if requested
    if (save) {
      const subDir = source === 'ats' ? 'ats-results' : 'website-results';
      const dir = await saveFiles('Search-results', subDir, 'refined', tagged, toCSV);
      if (asCSV) {
        res.type('text/csv').send(toCSV(tagged));
      } else {
        res.json({ savedTo: dir, count: tagged.length, results: tagged });
      }
      return;
    }

    // Default response
    if (asCSV) {
      res.type('text/csv').send(toCSV(tagged));
    } else {
      res.json({ count: tagged.length, results: tagged });
    }
  } catch (err) {
    console.error('refine/local error:', err);
    res.status(500).json({ error: 'Internal error processing refine' });
  }
});
