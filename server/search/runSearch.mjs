// src/search/runSearch.mjs
import { serperSearch } from './serperClient.mjs';
import { mustMatchAll } from '../utils/textFilters.mjs';
import {
	ROLE_TERMS,
	LEVEL_TERMS,
	REMOTE_TERMS,
	STACK_TERMS,
	EXCLUDE_DOMAINS,
	MUST_MATCH,
} from './config.mjs';
import pLimit from 'p-limit';

// Build compact queries so Google won’t truncate
export function buildQueries(domains, overrides = {}) {
	const roles = overrides.roles ?? ROLE_TERMS;
	const levels = overrides.levels ?? LEVEL_TERMS;
	const remote = overrides.remote ?? REMOTE_TERMS;
	const stack = overrides.stack ?? STACK_TERMS;

	const levelStr = `(${levels.join(' OR ')})`;
	const remoteStr = `(${remote.join(' OR ')})`;
	const stackStr = stack.length ? ` (${stack.join(' OR ')})` : '';
	const excludeStr = EXCLUDE_DOMAINS.join(' ');

	const qs = [];
	for (const d of domains) {
		for (const role of roles) {
			qs.push(
				`${d} (${role}) ${levelStr} ${remoteStr}${stackStr} ${excludeStr}`
			);
		}
	}
	return qs;
}

export async function runSearch(
	domains,
	{ concurrency = 4, num = 20, overrides = {} } = {}
) {
	const queries = buildQueries(domains, overrides);
	const limit = pLimit(concurrency);
	const bag = new Map();

	await Promise.all(
		queries.map((q) =>
			limit(async () => {
				try {
					const hits = await serperSearch(q, num);
					for (const h of hits) {
						const text = `${h.title} ${h.snippet}`;
						if (!mustMatchAll(text, MUST_MATCH)) continue;
						const key = (h.link || '').toLowerCase();
						if (!bag.has(key)) bag.set(key, h);
					}
				} catch (e) {
					// swallow individual query errors; continue
				}
			})
		)
	);

	return Array.from(bag.values());
}
