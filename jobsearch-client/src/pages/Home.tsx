import { useState } from 'react';
import { useJobs } from '../hooks/useJobs';
import JobCard from '../components/JobCard';
import SourceToggle from '../components/SourceToggle';
import type { Source, Filters } from '../api/jobs';
import Toolbar from '../components/Toolbar';

export default function Home() {
	const [source, setSource] = useState<Source>('ats');

	// For now, no extra filters (they’re ready to add later).
	const filters: Filters = { includeStartups: '1' };

	const { jobs, loading, error } = useJobs(source, filters);

	return (
		<div className='min-h-screen bg-base-100'>
			<div className='container mx-auto p-4 md:p-6'>
				<header className='mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4'>
					<h1 className='text-2xl md:text-3xl font-bold'>JobSearch Viewer</h1>
					<SourceToggle source={source} onChange={setSource} />
				</header>

				<div className='mb-4'>
					{loading && <span className='loading loading-spinner loading-md' />}
					{!loading && error && (
						<div className='alert alert-error'>
							<span>{error}</span>
						</div>
					)}
					{!loading && !error && (
						<Toolbar source={source} filters={filters} count={jobs.length} />
					)}
				</div>

				{!loading && !error && (
					<section className='grid gap-4 md:gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3'>
						{jobs.map((job, i) => (
							<JobCard key={`${job.link}-${i}`} job={job} />
						))}
					</section>
				)}

				{!loading && !error && jobs.length === 0 && (
					<div className='mt-8 alert'>
						<span>No results yet for {source.toUpperCase()}.</span>
					</div>
				)}
			</div>
		</div>
	);
}
