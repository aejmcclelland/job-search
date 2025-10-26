// src/components/JobCard.tsx
import { useMemo, useState } from 'react';
import type { Job } from '../api/jobs';

function hostOf(url: string): string {
	try {
		return new URL(url).hostname.replace(/^www\./, '');
	} catch {
		return '';
	}
}

export default function JobCard({ job }: { job: Job }) {
	const host = useMemo(() => hostOf(job.link), [job.link]);
	const [iconSrc, setIconSrc] = useState(
		host ? `https://www.google.com/s2/favicons?sz=32&domain=${host}` : ''
	);
	const [iconTriedSite, setIconTriedSite] = useState(false);
	const [iconHidden, setIconHidden] = useState(false);

	const onIconError = () => {
		if (!iconTriedSite && host) {
			// 2nd attempt: site's own /favicon.ico
			setIconTriedSite(true);
			setIconSrc(`https://${host}/favicon.ico`);
		} else {
			// Give up: hide icon (or use a placeholder)
			setIconHidden(true);
		}
	};

	return (
		<article className='card bg-base-200 shadow-sm hover:shadow-lg transition'>
			<div className='card-body'>
				<div className='flex items-center gap-2 mb-1'>
					{!iconHidden && iconSrc && host && (
						<img
							src={iconSrc}
							alt=''
							width={16}
							height={16}
							className='w-4 h-4'
							referrerPolicy='no-referrer'
							decoding='async'
							loading='lazy'
							onError={onIconError}
						/>
					)}
					<span className='text-xs opacity-70'>{host}</span>
				</div>

				<h2 className='card-title line-clamp-2'>
					{job.title?.trim() || job.link}
				</h2>
				<p className='text-sm opacity-80 line-clamp-4'>{job.snippet}</p>

				<div className='card-actions justify-end'>
					<a
						className='btn btn-sm btn-outline'
						href={job.link}
						target='_blank'
						rel='noopener noreferrer'>
						View role
					</a>
				</div>
			</div>
		</article>
	);
}
