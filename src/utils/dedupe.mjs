// src/utils/dedupe.mjs
import fs from 'node:fs/promises';
import path from 'node:path';

function normalizeUrl(u) {
	try {
		const url = new URL(u);
		url.hash = '';
		// strip common tracking params
		[
			'utm_source',
			'utm_medium',
			'utm_campaign',
			'utm_term',
			'utm_content',
			'gclid',
			'fbclid',
			'ref',
			'referrer',
		].forEach((p) => url.searchParams.delete(p));
		return url.toString();
	} catch {
		return (u || '').trim();
	}
}

export function jobKey(job) {
	// prefer normalized link; fallback to host+title
	const link = normalizeUrl(job.link || job.url || '');
	if (link) return link;
	try {
		const host = new URL(job.link || job.url || '').hostname || '';
		return `${host}::${(job.title || '').trim().toLowerCase()}`;
	} catch {
		return `${(job.title || '').trim().toLowerCase()}::${(
			job.snippet || ''
		).slice(0, 50)}`;
	}
}

export async function loadSeen(source) {
	const file = path.join(
		process.cwd(),
		'search-results',
		'index',
		`seen-${source}.json`
	);
	try {
		const raw = await fs.readFile(file, 'utf8');
		return JSON.parse(raw);
	} catch {
		return {}; // { [jobKey]: { firstSeen:'YYYY-MM-DD', lastSeen:'YYYY-MM-DD', times: n } }
	}
}

export async function saveSeen(source, seen) {
	const dir = path.join(process.cwd(), 'search-results', 'index');
	await fs.mkdir(dir, { recursive: true });
	const file = path.join(dir, `seen-${source}.json`);
	await fs.writeFile(file, JSON.stringify(seen, null, 2));
}

/**
 * Update the seen index with the current run’s results.
 * @returns tagged results: each item gets { firstSeen, lastSeen, seenTimes, isNew }
 */
export function tagAndUpdateSeen(seen, results, runISODate) {
	const out = [];
	for (const r of results) {
		const k = jobKey(r);
		const rec = seen[k];
		if (rec) {
			rec.lastSeen = runISODate;
			rec.times = (rec.times || 1) + 1;
			out.push({
				...r,
				firstSeen: rec.firstSeen,
				lastSeen: rec.lastSeen,
				seenTimes: rec.times,
				isNew: false,
			});
		} else {
			seen[k] = { firstSeen: runISODate, lastSeen: runISODate, times: 1 };
			out.push({
				...r,
				firstSeen: runISODate,
				lastSeen: runISODate,
				seenTimes: 1,
				isNew: true,
			});
		}
	}
	return out;
}
