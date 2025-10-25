// src/search/serperClient.mjs
import 'dotenv/config';

const API_KEY = process.env.SERP_API_KEY;
if (!API_KEY) {
	console.error('❌ Missing SERP_API_KEY');
	process.exit(1);
}

export async function serperSearch(query, num = 20) {
	const res = await fetch('https://google.serper.dev/search', {
		method: 'POST',
		headers: {
			'X-API-KEY': API_KEY,
			'Content-Type': 'application/json',
		},
		body: JSON.stringify({ q: query, num }),
	});
	if (!res.ok) throw new Error(`Serper error ${res.status}`);
	const data = await res.json();
	return (data.organic || []).map((r) => ({
		title: r.title || '',
		link: r.link || '',
		snippet: r.snippet || '',
	}));
}
