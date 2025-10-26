import type { Source, Filters } from '../api/jobs';
import { buildCsvUrl } from '../api/jobs';

export default function Toolbar({
	source,
	filters,
	count,
}: {
	source: Source;
	filters: Filters;
	count: number;
}) {
	const csvHref = buildCsvUrl(source, filters);
	return (
		<div className='flex items-center gap-3 flex-wrap'>
			<div className='text-sm opacity-70'>
				Showing {count} results ({source.toUpperCase()})
			</div>
			<a className='btn btn-sm btn-outline' href={csvHref}>
				Download CSV
			</a>
		</div>
	);
}
