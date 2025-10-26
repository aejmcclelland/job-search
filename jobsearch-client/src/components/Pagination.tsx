// src/components/Pagination.tsx
import type { ReactNode } from 'react';

export type PaginationProps = {
  total: number;
  page: number; // 1-based
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
};

export default function Pagination({
  total,
  page,
  pageSize,
  onPageChange,
  onPageSizeChange,
}: PaginationProps): ReactNode | null {
  if (total <= 0) return null;
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const current = Math.min(Math.max(1, page), pageCount);

  const canPrev = current > 1;
  const canNext = current < pageCount;

  return (
    <div className="flex items-start justify-between gap-4 flex-wrap w-full">
      {/* Page size block (label above select) */}
      {onPageSizeChange && (
        <div className="flex flex-col gap-1 min-w-[140px]">
          <span className="text-sm opacity-80">Page size</span>
          <select
            className="select select-bordered select-sm"
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
          >
            {[12, 24, 36, 48].map((n) => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
        </div>
      )}

      {/* Prev / Next controls using DaisyUI join */}
      <div className="ml-auto">
        <div className="join grid grid-cols-2">
          <button
            className="join-item btn btn-outline btn-sm"
            disabled={!canPrev}
            onClick={() => onPageChange(current - 1)}
          >
            Previous
          </button>
          <button
            className="join-item btn btn-outline btn-sm"
            disabled={!canNext}
            onClick={() => onPageChange(current + 1)}
          >
            Next
          </button>
        </div>
        <div className="text-xs opacity-70 mt-1 text-right">
          Page {current} of {pageCount}
        </div>
      </div>
    </div>
  );
}
