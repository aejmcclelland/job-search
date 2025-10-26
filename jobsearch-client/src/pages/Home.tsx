import { useState } from 'react';
import { useJobs } from '../hooks/useJobs';
import { usePagination } from '../hooks/usePagination';
import Pagination from '../components/Pagination';
import JobCard from '../components/JobCard';
import SourceToggle from '../components/SourceToggle';
import type { Source, Filters } from '../api/jobs';
import Toolbar from '../components/Toolbar';
import FilterBar from '../components/FilterBar';

export default function Home(): React.ReactElement {
	const [source, setSource] = useState<Source>('ats');
	const [filters, setFilters] = useState<Filters>({
		includeStartups: '1',
		region: '',
		workMode: '',
		maxYears: '',
	});
	const { jobs, loading, error } = useJobs(source, filters);

	const { page, pageSize, total, pageItems, setPage, setPageSize } =
		usePagination(jobs, 24);

	return (
		<div className='min-h-screen bg-base-100'>
			<div className='container mx-auto p-4 md:p-6'>
				<header className='mb-4 md:mb-6 flex flex-col items-center text-center md:text-left md:flex-row md:items-center md:justify-between gap-4'>
					<h1 className='text-2xl md:text-3xl font-bold text-center md:text-left'>
						My Job Search
					</h1>
					<SourceToggle source={source} onChange={setSource} />
				</header>

				<div className='bg-base-200 flex items-center justify-center rounded-lg p-3 shadow-sm mb-4 mx-auto w-full md:max-w-3xl'>
					<FilterBar filters={filters} onChange={setFilters} />
				</div>

				{/* Top toolbar + pagination */}
				{/* Sticky toolbar (CSV + pagination) */}
				<div className='sticky top-0 z-30 bg-base-100/90 backdrop-blur supports-backdrop-filter:bg-base-100/60 border-b border-base-300'>
					<div className='container mx-auto px-4 md:px-6 py-2 flex items-center justify-between gap-3 flex-wrap'>
						{!loading && !error && (
							<Toolbar source={source} filters={filters} count={total} />
						)}
						{!loading && !error && total > 0 && (
							<Pagination
								total={total}
								page={page}
								pageSize={pageSize}
								onPageChange={setPage}
								onPageSizeChange={setPageSize}
							/>
						)}
					</div>
				</div>

				{loading && <span className='loading loading-spinner loading-md' />}
				{error && (
					<div className='alert alert-error'>
						<span>{error}</span>
					</div>
				)}

				{/* Grid uses pageItems instead of jobs */}
				{!loading && !error && (
					<section className='grid gap-4 md:gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3'>
						{pageItems.map((job, i) => (
							<JobCard key={`${job.link}-${i}`} job={job} />
						))}
					</section>
				)}

				{!loading && !error && total > pageSize && (
					<div className='mt-6 flex justify-end'>
						<Pagination
							total={total}
							page={page}
							pageSize={pageSize}
							onPageChange={setPage}
							onPageSizeChange={setPageSize}
						/>
					</div>
				)}

				{!loading && !error && total === 0 && (
					<div className='mt-8 alert'>
						<span>No results yet for {source.toUpperCase()}.</span>
					</div>
				)}
			</div>
		</div>
	);
}
