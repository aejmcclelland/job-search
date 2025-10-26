import { useMemo, useState, useEffect } from 'react';

export function usePagination<T>(items: T[], initialPageSize = 24) {
	const [page, setPage] = useState(1); // 1-based
	const [pageSize, setPageSize] = useState(initialPageSize);

	const total = items.length;
	const pageCount = Math.max(1, Math.ceil(total / pageSize));
	const current = Math.min(Math.max(1, page), pageCount);
	const start = (current - 1) * pageSize;
	const end = Math.min(start + pageSize, total);
	const pageItems = useMemo(() => items.slice(start, end), [items, start, end]);

	// If items change drastically (e.g., filter/source), reset to page 1
	useEffect(() => {
		setPage(1);
	}, [items]);

	return {
		page: current,
		pageSize,
		total,
		pageCount,
		pageItems,
		setPage,
		setPageSize,
	};
}
