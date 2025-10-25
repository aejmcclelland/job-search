import path from 'node:path';
import { writeJSON, writeText, ensureDir } from './fileUtils.mjs';
import { toCSV } from './textFilters.mjs';

const DATA_ROOT = 'data';

function domainOf(url) {
	try {
		return new URL(url).hostname;
	} catch {
		return '';
	}
}

export function newRunContext(label = 'run') {
	const startedAt = new Date();
	const runId = startedAt.toISOString().replace(/[:.]/g, '-'); // safe for folder names
	const runDir = path.join(DATA_ROOT, 'runs', runId);

	const stats = {
		label,
		startedAt: startedAt.toISOString(),
		endedAt: null,
		durationMs: null,
		queries: [], // {query, batch: 'ATS'|'NON_ATS'}
		perQuery: [], // {query, count, domains: {[host]: n}}
		totals: { results: 0, queries: 0 },
		perDomain: {}, // {host: count}
	};

	function recordQuery(query, batch) {
		stats.queries.push({ query, batch });
	}

	function recordResultSet(query, results) {
		const byDomain = {};
		for (const r of results) {
			const d = domainOf(r.link);
			if (d) {
				stats.perDomain[d] = (stats.perDomain[d] || 0) + 1;
				byDomain[d] = (byDomain[d] || 0) + 1;
			}
		}
		stats.perQuery.push({ query, count: results.length, domains: byDomain });
		stats.totals.results += results.length;
	}

	function finish() {
		const endedAt = new Date();
		stats.endedAt = endedAt.toISOString();
		stats.durationMs = endedAt - new Date(stats.startedAt);
		stats.totals.queries = stats.queries.length;
		return stats;
	}

	async function saveBatchFiles(batchName, results) {
		await writeJSON(path.join(runDir, `${batchName}.json`), results);
		await writeText(path.join(runDir, `${batchName}.csv`), toCSV(results));
	}

	async function saveQueries() {
		await writeJSON(path.join(runDir, 'queries.json'), stats.queries);
	}

	async function saveSummary() {
		await writeJSON(path.join(runDir, 'summary.json'), stats);
	}

	return {
		runDir,
		recordQuery,
		recordResultSet,
		saveBatchFiles,
		saveQueries,
		saveSummary,
		finish,
	};
}

// Global seen store for cross-run diffs
async function readSeen() {
	try {
		const mod = await import('node:fs/promises');
		const raw = await mod.readFile(
			path.join(DATA_ROOT, 'global', 'seen.json'),
			'utf8'
		);
		return JSON.parse(raw);
	} catch {
		return {}; // first run
	}
}

async function writeSeen(seen) {
	await writeJSON(path.join(DATA_ROOT, 'global', 'seen.json'), seen);
}

export async function diffAndUpdateGlobal(runDir, batches) {
	const seen = await readSeen();
	const now = new Date().toISOString();
	const changes = { new: [], existing: [], updated: [] };

	for (const { name, results } of batches) {
		for (const r of results) {
			const key = (r.link || '').toLowerCase();
			if (!key) continue;
			if (!seen[key]) {
				seen[key] = {
					firstSeen: now,
					lastSeen: now,
					timesSeen: 1,
					title: r.title || '',
				};
				changes.new.push(r);
			} else {
				seen[key].lastSeen = now;
				seen[key].timesSeen += 1;
				// if title changed, consider it updated
				if (r.title && r.title !== seen[key].title) {
					seen[key].title = r.title;
					changes.updated.push(r);
				} else {
					changes.existing.push(r);
				}
			}
		}
	}

	await ensureDir(runDir);
	await writeJSON(path.join(runDir, 'diff.json'), {
		generatedAt: now,
		counts: {
			new: changes.new.length,
			updated: changes.updated.length,
			existing: changes.existing.length,
		},
		samples: {
			new: changes.new.slice(0, 20),
			updated: changes.updated.slice(0, 20),
		},
	});

	await writeSeen(seen);
	return changes;
}
