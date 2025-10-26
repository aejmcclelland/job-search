import type { Source } from '../api/jobs';

export default function SourceToggle({
	source,
	onChange,
}: {
	source: Source;
	onChange: (s: Source) => void;
}) {
	return (
		<div className='join'>
			<button
				className={`btn join-item ${source === 'ats' ? 'btn-primary' : ''}`}
				onClick={() => onChange('ats')}>
				ATS
			</button>
			<button
				className={`btn join-item ${source === 'nonats' ? 'btn-primary' : ''}`}
				onClick={() => onChange('nonats')}>
				Non-ATS
			</button>
		</div>
	);
}
