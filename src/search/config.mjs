// src/search/config.mjs

// Roles you care about
export const ROLE_TERMS = [
	'"frontend developer"',
	'"frontend engineer"',
	'"backend developer"',
	'"backend engineer"',
	'"software engineer"',
	'"software developer"',
	'"qa engineer"',
	'sdet',
	'"cloud engineer"',
	'devops',
];

// Levels / experience
export const LEVEL_TERMS = [
	'"junior"',
	'"entry level"',
	'graduate',
	'"0-2 years"',
	'"1-2 years"',
];

// Remote indicators
export const REMOTE_TERMS = [
	'remote',
	'"work from home"',
	'anywhere',
	'distributed',
];

// Optional tech keywords (comment out if you want max breadth)
export const STACK_TERMS = ['typescript', 'node', 'react', 'javascript', 'aws'];

// Known ATS domains (you can expand from everyats.com)
export const ATS_DOMAINS = [
	'site:boards.greenhouse.io',
	'site:jobs.lever.co',
	'site:jobs.ashbyhq.com',
	'site:smartrecruiters.com',
	'site:workdayjobs.com OR site:myworkdayjobs.com',
	'site:apply.workable.com',
	'site:personio.com',
	'site:recruitee.com',
];

// Non-ATS/company careers patterns + startup boards
export const NON_ATS_SOURCES = [
	'(inurl:careers OR inurl:jobs OR inurl:join-us OR inurl:work-with-us OR inurl:opportunities OR intitle:careers)',
	'site:wellfound.com',
	'site:welcometothejungle.com',
];

// Exclusions (job boards you don’t want)
export const EXCLUDE_DOMAINS = [
	'-site:linkedin.com',
	'-site:indeed.com',
	'-site:glassdoor.com',
	'-site:ziprecruiter.com',
	'-site:totaljobs.com',
	'-site:reed.co.uk',
	'-site:monster.com',
	'-site:simplyhired.com',
	'-site:simplyhired.co.uk',
];

export const STARTUP_ALLOW = ['wellfound.com', 'welcometothejungle.com'];

export const HARD_BLOCK = [
	'indeed.com',
	'ziprecruiter.com',
	'glassdoor.com',
	'jooble.org',
	'jobgether.com',
	'builtin.com',
	'quora.com',
	'himalayas.app',
];

// Filters that must appear in title/snippet
export const MUST_MATCH = [
	/(junior|entry level|graduate|0-2|1-2)/i,
	/(remote|work from home|anywhere|distributed)/i,
];
