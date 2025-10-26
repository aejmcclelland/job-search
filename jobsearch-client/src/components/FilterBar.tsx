// src/components/FilterBar.tsx
import type { Filters } from '../api/jobs';

interface FilterBarProps {
	filters: Filters;
	onChange: (updated: Filters) => void;
}

export default function FilterBar({ filters, onChange }: FilterBarProps) {
	const setFilter = <K extends keyof Filters>(key: K, value: Filters[K]) =>
		onChange({ ...filters, [key]: value });

	return (
		<div className='flex flex-wrap items-center justify-center gap-3 mb-2 md:mb-4'>
			{/* Region */}
			<div className='join'>
				<button
					className={`btn btn-sm join-item ${
						filters.region === 'uk' ? 'btn-primary' : 'btn-outline'
					}`}
					onClick={() => setFilter('region', 'uk')}>
					UK
				</button>
				<button
					className={`btn btn-sm join-item ${
						filters.region === 'eu' ? 'btn-primary' : 'btn-outline'
					}`}
					onClick={() => setFilter('region', 'eu')}>
					Europe
				</button>
				<button
					className={`btn btn-sm join-item ${
						!filters.region ? 'btn-primary' : 'btn-outline'
					}`}
					onClick={() => setFilter('region', '')}>
					All
				</button>
			</div>

			{/* Work Mode */}
			<div className='join'>
				{['remote', 'hybrid', 'onsite'].map((mode) => (
					<button
						key={mode}
						className={`btn btn-sm join-item ${
							filters.workMode === mode ? 'btn-secondary' : 'btn-outline'
						}`}
						onClick={() => setFilter('workMode', mode)}>
						{mode.charAt(0).toUpperCase() + mode.slice(1)}
					</button>
				))}
				<button
					className={`btn btn-sm join-item ${
						!filters.workMode ? 'btn-secondary' : 'btn-outline'
					}`}
					onClick={() => setFilter('workMode', '')}>
					All
				</button>
			</div>

			{/* Experience */}
			<div className='join'>
				{([0, 2, ''] as const).map((yrs, i) => (
					<button
						key={i}
						className={`btn btn-sm join-item ${
							filters.maxYears === yrs ? 'btn-accent' : 'btn-outline'
						}`}
						onClick={() => setFilter('maxYears', yrs)}>
						{yrs === '' ? 'Any' : `≤ ${yrs} yrs`}
					</button>
				))}
			</div>
		</div>
	);
}
