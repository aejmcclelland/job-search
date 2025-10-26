// src/api/jobs.ts
export type Source = 'ats' | 'nonats';
export type Filters = {
	region?: string; // "uk" | "eu" | ""
	workMode?: string; // "remote" | "hybrid" | ""
	country?: string; // "UK", "Ireland", etc.
	maxYears?: number | ''; // 3 | ""
	langs?: string; // "typescript,node"
	includeStartups?: '0' | '1';
	date?: string; // "DD-MM-YY" (optional)
	newOnly?: '0' | '1';
	sortBy?: 'firstSeen' | 'lastSeen';
};

export type Job = {
	title: string;
	link: string;
	snippet: string;
};

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:4000';

export function buildRefineUrl(source: Source, f: Filters = {}): string {
	const p = new URLSearchParams({ source });
	if (f.region) p.set('region', f.region);
	if (f.workMode) p.set('workMode', f.workMode);
	if (f.country) p.set('country', f.country);
	if (f.langs) p.set('langs', f.langs);
	if (f.includeStartups) p.set('includeStartups', f.includeStartups);
	if (f.date) p.set('date', f.date);
	if (typeof f.maxYears === 'number') p.set('maxYears', String(f.maxYears));
	return `${API_BASE}/api/refine/local?${p.toString()}`;
}

export function buildCsvUrl(source: Source, f: Filters = {}): string {
	const url = new URL(buildRefineUrl(source, f));
	url.searchParams.set('csv', '1');
	return url.toString();
}

export async function fetchJobs(
	source: Source,
	f: Filters = {}
): Promise<Job[]> {
	const res = await fetch(buildRefineUrl(source, f));
	if (!res.ok) throw new Error(`HTTP ${res.status}`);
	const data = await res.json();
	return data.results || [];
}
