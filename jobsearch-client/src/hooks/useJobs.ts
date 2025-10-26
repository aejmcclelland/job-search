import { useEffect, useState } from 'react';
import type { Job, Source, Filters } from '../api/jobs';
import { fetchJobs } from '../api/jobs';

export function useJobs(source: Source, filters: Filters = {}) {
	const [jobs, setJobs] = useState<Job[]>([]);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		let cancelled = false;
		setLoading(true);
		setError(null);
		fetchJobs(source, filters)
			.then((j) => !cancelled && setJobs(j))
			.catch((err) => !cancelled && setError(err.message))
			.finally(() => !cancelled && setLoading(false));
		return () => {
			cancelled = true;
		};
	}, [source, JSON.stringify(filters)]);

	return { jobs, loading, error };
}
