// src/utils/textFilters.mjs
import { STARTUP_ALLOW, HARD_BLOCK } from '../search/config.mjs';

// ---------------- Basic utilities ----------------
export function mustMatchAll(text, regexes) {
  return regexes.every((rx) => rx.test(text));
}

export function toCSV(rows) {
  const esc = (s) => `"${String(s ?? '').replace(/"/g, '""')}"`;
  const header = ['title', 'url', 'snippet'].map(esc).join(',');
  const lines = (rows || []).map((r) => [r.title, r.link, r.snippet].map(esc).join(','));
  return [header, ...lines].join('\n');
}

// ---------------- Domain filtering ----------------
const STARTUP_ALLOW_SET = new Set(STARTUP_ALLOW);
const HARD_BLOCK_SET = new Set(HARD_BLOCK);

function hostOf(u) {
  try { return new URL(u).hostname.toLowerCase(); } catch { return ''; }
}

export function filterByDomains(items, { includeStartups = true } = {}) {
  return (items || []).filter((r) => {
    const h = hostOf(r.link || r.url || '');
    if (!h) return false;
    if (HARD_BLOCK_SET.has(h)) return false;
    if (STARTUP_ALLOW_SET.has(h)) return includeStartups; // keep only if requested
    return true;
  });
}

// ---------------- Experience parsing ----------------
const YEARS_RX = {
  range: /\b(\d{1,2})\s*[-–]\s*(\d{1,2})\s*(?:years?|yrs?)\b/gi,
  plus:  /\b(\d{1,2})\s*\+\s*(?:years?|yrs?)\b/gi,
  plain: /\b(\d{1,2})\s*(?:years?|yrs?)\b/gi,
};

export function exceedsYears(text, maxYears = 3) {
  const t = (text || '').toLowerCase();
  let m;
  while ((m = YEARS_RX.range.exec(t)) !== null) {
    const a = parseInt(m[1], 10), b = parseInt(m[2], 10);
    if ((Number.isFinite(a) && a > maxYears) || (Number.isFinite(b) && b > maxYears)) return true;
  }
  while ((m = YEARS_RX.plus.exec(t)) !== null) {
    const n = parseInt(m[1], 10);
    if (Number.isFinite(n) && (n >= maxYears + 1)) return true; // treat 3+ as > 3 when max=3
  }
  while ((m = YEARS_RX.plain.exec(t)) !== null) {
    const n = parseInt(m[1], 10);
    if (Number.isFinite(n) && n > maxYears) return true;
  }
  return false;
}

// ---------------- Region & work-mode dictionaries ----------------
export const REGION_PRESETS = {
  uk: [
    'uk','united kingdom','great britain','britain','gb',
    'england','scotland','wales','northern ireland',
    'london','manchester','edinburgh','glasgow','belfast','leeds','bristol'
  ],
  eu: [
    'europe','eu','emea','european',
    'ireland','dublin','cork','limerick',
    'germany','berlin','munich','france','paris','lyon','netherlands','amsterdam','rotterdam',
    'spain','madrid','barcelona','italy','rome','milan','poland','portugal','lisbon',
    'sweden','norway','denmark','finland','austria','switzerland','belgium'
  ]
};

export const WORKMODE = {
  remote: ['remote','anywhere','work from home','distributed'],
  hybrid: ['hybrid','remote/office','office/remote','flexible','days in office','2 days a week','3 days a week']
};

// ---------------- Main text filters ----------------
export function applyUserFilters(
  results,
  { country, region, workMode, maxYears, langs } = {}
) {
  const wantedCountry = (country || '').trim().toLowerCase();
  const regionTerms = (region ? (REGION_PRESETS[region.toLowerCase()] || []) : []).map((s) => s.toLowerCase());
  const modeTerms = (workMode ? (WORKMODE[workMode.toLowerCase()] || []) : []).map((s) => s.toLowerCase());
  const langList = (langs || '').split(',').map((s) => s.trim().toLowerCase()).filter(Boolean);

  return (results || []).filter((r) => {
    const text = `${r.title || ''} ${r.snippet || ''}`.toLowerCase();

    // experience filter
    if (maxYears != null && exceedsYears(text, Number(maxYears))) return false;

    // country or region
    if (wantedCountry && !text.includes(wantedCountry)) return false;
    if (regionTerms.length && !regionTerms.some((term) => text.includes(term))) return false;

    // work mode
    if (modeTerms.length && !modeTerms.some((term) => text.includes(term))) return false;

    // languages / stack keywords
    if (langList.length && !langList.some((k) => text.includes(k))) return false;

    return true;
  });
}
