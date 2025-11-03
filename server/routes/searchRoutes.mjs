import express from 'express';
import { runSearch } from '../search/runSearch.mjs';
import { ATS_DOMAINS, NON_ATS_SOURCES } from '../search/config.mjs';
import { toCSV, applyUserFilters } from '../utils/textFilters.mjs';
import { saveResults } from '../utils/fileUtils.mjs';

export const searchRoutes = express.Router();

/**
 * GET /api/search/ats
 * Optional query params:
 *   csv=1        -> return CSV instead of JSON
 *   concurrency  -> default 4
 *   num          -> results per query (default 20)
 *   country      -> filter by country keyword in title/snippet
 *   maxYears     -> drop roles requiring more than this number of years
 *   langs        -> comma-separated keywords (e.g. typescript,node,react)
 *   save=1       -> save to Search-results/ats-results/<DD-MM-YY>/ats.{json,csv}
 */
searchRoutes.get('/ats', async (req, res) => {
	const concurrency = Number(req.query.concurrency ?? 4);
	const num = Number(req.query.num ?? 20);
	const save = String(req.query.save || '').toLowerCase() === '1';
	const asCSV = String(req.query.csv || '').toLowerCase() === '1';

	const country = req.query.country || '';
	const maxYears =
		req.query.maxYears != null ? Number(req.query.maxYears) : null;
	const langs = req.query.langs || '';
	const region = req.query.region || '';
	const workMode = req.query.workMode || '';

	const raw = await runSearch(ATS_DOMAINS, { concurrency, num });

	const results = Array.isArray(raw) ? raw : raw.results || [];
	const filtered = applyUserFilters(results, { country, region, workMode, maxYears, langs });

	if (save) {
		const dir = await saveResults(
			'Search-results',
			'ats-results',
			'ats',
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

/**
 * GET /api/search/nonats
 * Same params as /ats. Pulls company-hosted careers and selected startup boards.
 * Saves to Search-results/website-results/<DD-MM-YY>/nonats.{json,csv} when save=1
 */
searchRoutes.get('/nonats', async (req, res) => {
	const concurrency = Number(req.query.concurrency ?? 4);
	const num = Number(req.query.num ?? 20);
	const save = String(req.query.save || '').toLowerCase() === '1';
	const asCSV = String(req.query.csv || '').toLowerCase() === '1';

	const country = req.query.country || '';
	const maxYears =
		req.query.maxYears != null ? Number(req.query.maxYears) : null;
	const langs = req.query.langs || '';
	const region = req.query.region || '';
	const workMode = req.query.workMode || '';

	const raw = await runSearch(NON_ATS_SOURCES, { concurrency, num });

	const results = Array.isArray(raw) ? raw : raw.results || [];
	const filtered = applyUserFilters(results, { country, region, workMode, maxYears, langs });

	if (save) {
		const dir = await saveResults(
			'Search-results',
			'website-results',
			'nonats',
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
