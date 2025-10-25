import express from 'express';
import fs from 'node:fs/promises';
import path from 'node:path';
import { STARTUP_ALLOW, HARD_BLOCK } from '../search/config.mjs';
import {
	toCSV,
	applyUserFilters,
	filterByDomains,
} from '../utils/textFilters.mjs';

export const refineRoutes = express.Router();

// ---------------- helpers (local-only refine; no Serper calls) ----------------
function todayStamp() {
	const d = new Date();
	const dd = String(d.getDate()).padStart(2, '0');
	const mm = String(d.getMonth() + 1).padStart(2, '0');
	const yy = String(d.getFullYear()).slice(-2);
	return `${dd}-${mm}-${yy}`; // e.g., 25-10-25
}

async function ensureDir(dir) {
	await fs.mkdir(dir, { recursive: true });
}

async function saveResults(rootDir, subDir, fileBase, results, csvMaker) {
	const stamp = todayStamp();
	const dir = path.join(rootDir, subDir, stamp);
	await ensureDir(dir);
	await fs.writeFile(
		path.join(dir, `${fileBase}.json`),
		JSON.stringify(results, null, 2)
	);
	await fs.writeFile(path.join(dir, `${fileBase}.csv`), csvMaker(results));
	return dir;
}

// Small CSV parser for our 3-column schema (title,url,snippet)
function parseCSV(text) {
	const lines = text.split(/\r?\n/).filter(Boolean);
	if (lines.length < 2) return [];
	const rows = [];
	for (let i = 1; i < lines.length; i++) {
		const line = lines[i];
		const cells = [];
		let cur = '',
			inQ = false;
		for (let j = 0; j < line.length; j++) {
			const ch = line[j];
			if (ch === '"') {
				if (inQ && line[j + 1] === '"') {
					cur += '"';
					j++;
				} else {
					inQ = !inQ;
				}
			} else if (ch === ',' && !inQ) {
				cells.push(cur);
				cur = '';
			} else {
				cur += ch;
			}
		}
		cells.push(cur);
		const [title = '', url = '', snippet = ''] = cells.map((s) =>
			s.replace(/^"|"$/g, '')
		);
		if (url) rows.push({ title, link: url, snippet });
	}
	return rows;
}

// Domain-based filtering
const STARTUP_ALLOW_SET = new Set(STARTUP_ALLOW);
const HARD_BLOCK_SET = new Set(HARD_BLOCK);

function hostOf(u) {
	try {
		return new URL(u).hostname.toLowerCase();
	} catch {
		return '';
	}
}

// Read most recent (or specific) date-stamped run from Search-results/
async function loadLocalResults(source, opts = {}) {
	const requestedStamp = (opts.date || '').trim(); // expects DD-MM-YY if provided
	const roots = ['Search-results', 'search-results'];
	const subDir = source === 'ats' ? 'ats-results' : 'website-results';
	const fileBase = source === 'ats' ? 'ats' : 'nonats';

	const stampToKey = (s) => {
		const m = /^(\d{2})-(\d{2})-(\d{2})$/.exec(s);
		if (!m) return -Infinity;
		const [, dd, mm, yy] = m;
		const year = Number('20' + yy);
		return new Date(year, Number(mm) - 1, Number(dd)).getTime();
	};

	for (const root of roots) {
		try {
			const baseDir = path.join(process.cwd(), root, subDir);
			const entries = await fs.readdir(baseDir, { withFileTypes: true });
			let candidates = entries
				.filter((e) => e.isDirectory())
				.map((e) => e.name);
			if (requestedStamp)
				candidates = candidates.filter((n) => n === requestedStamp);
			candidates.sort((a, b) => stampToKey(b) - stampToKey(a));
			for (const stamp of candidates) {
				const dir = path.join(baseDir, stamp);
				try {
					const jsonPath = path.join(dir, `${fileBase}.json`);
					const txt = await fs.readFile(jsonPath, 'utf8');
					const arr = JSON.parse(txt);
					return arr.map((r) => ({
						title: r.title,
						link: r.link,
						snippet: r.snippet,
					}));
				} catch {}
				try {
					const csvPath = path.join(dir, `${fileBase}.csv`);
					const txt = await fs.readFile(csvPath, 'utf8');
					return parseCSV(txt);
				} catch {}
			}
		} catch {}
	}
	return [];
}

/**
 * GET /api/refine/local
 * Params:
 *   source=ats|nonats        (required)
 *   country=UK               (optional)
 *   region=uk|eu             (optional, if supported by applyUserFilters)
 *   workMode=remote|hybrid   (optional, if supported by applyUserFilters)
 *   maxYears=3               (optional)
 *   langs=typescript,node    (optional, comma-separated)
 *   includeStartups=1|0      (optional; default 1; keeps Wellfound/WTTJ)
 *   date=DD-MM-YY            (optional; load specific run folder)
 *   save=1                   (optional; saves refined.{json,csv} to date dir)
 *   csv=1                    (optional; respond as CSV)
 */
refineRoutes.get('/local', async (req, res) => {
	const source = String(req.query.source || '').toLowerCase();
	if (source !== 'ats' && source !== 'nonats') {
		res.status(400).json({ error: "source must be 'ats' or 'nonats'" });
		return;
	}

	const includeStartups = String(req.query.includeStartups || '1') !== '0';
	const asCSV = String(req.query.csv || '') === '1';
	const save = String(req.query.save || '') === '1';
	const date = req.query.date || '';

	const country = req.query.country || '';
	const region = req.query.region || '';
	const workMode = req.query.workMode || '';
	const maxYears =
		req.query.maxYears != null ? Number(req.query.maxYears) : null;
	const langs = req.query.langs || '';

	const raw = await loadLocalResults(source, { date });
	const domFiltered = filterByDomains(raw, { includeStartups });
	const filtered = applyUserFilters(domFiltered, {
		country,
		region,
		workMode,
		maxYears,
		langs,
	});

	if (save) {
		const subDir = source === 'ats' ? 'ats-results' : 'website-results';
		const dir = await saveResults(
			'Search-results',
			subDir,
			'refined',
			filtered,
			toCSV
		);
		if (asCSV) {
			res.type('text/csv').send(toCSV(filtered));
		} else {
			res.json({ savedTo: dir, count: filtered.length, results: filtered });
		}
		return;
	}

	if (asCSV) {
		res.type('text/csv').send(toCSV(filtered));
	} else {
		res.json({ count: filtered.length, results: filtered });
	}
});
