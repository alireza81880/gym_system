import React from 'react';
import { ChevronLeft, ChevronRight, Inbox } from 'lucide-react';
import { GlassSkeleton } from './GlassSkeleton';

export interface Column<T> {
  key: string;
  header: string;
  render?: (item: T, index: number) => React.ReactNode;
  className?: string;
  headerClassName?: string;
}

export interface GlassDataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (item: T, index: number) => string;
  loading?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyIcon?: React.ReactNode;
  emptyAction?: React.ReactNode;
  onRowClick?: (item: T) => void;
  currentPage?: number;
  totalPages?: number;
  onPageChange?: (page: number) => void;
  totalRecords?: number;
  pageSize?: number;
  className?: string;
}

export function GlassDataTable<T>({
  columns,
  data,
  keyExtractor,
  loading = false,
  emptyTitle = 'داده‌ای یافت نشد',
  emptyDescription,
  emptyIcon,
  emptyAction,
  onRowClick,
  currentPage = 1,
  totalPages = 1,
  onPageChange,
  totalRecords,
  className = '',
}: GlassDataTableProps<T>) {
  return (
    <div className={`glass-regular rounded-2xl border border-[var(--gym-border)] overflow-hidden shadow-xs ${className}`}>
      <div className="overflow-x-auto scrollbar-thin">
        <table className="w-full text-xs text-right border-collapse">
          {/* Sticky Header */}
          <thead className="bg-[var(--gym-surface-glass-strong)] border-b border-[var(--gym-border)] text-[var(--gym-text-muted,#9ca3af)] font-bold sticky top-0 z-10 select-none">
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={`p-3.5 sm:p-4 text-right whitespace-nowrap ${col.headerClassName || ''}`}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>

          {/* Table Body */}
          <tbody className="divide-y divide-[var(--gym-border)] text-[var(--gym-text,#f3f4f6)]">
            {loading ? (
              <tr>
                <td colSpan={columns.length} className="p-6">
                  <GlassSkeleton count={5} height="h-8" />
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="p-10 text-center text-[var(--gym-text-muted,#9ca3af)]">
                  <div className="flex flex-col items-center justify-center max-w-sm mx-auto">
                    <div className="w-10 h-10 rounded-xl bg-[var(--gym-surface-glass)] flex items-center justify-center text-[var(--gym-text-muted)] mb-2">
                      {emptyIcon || <Inbox className="w-5 h-5" />}
                    </div>
                    <p className="font-bold text-sm text-[var(--gym-text)]">{emptyTitle}</p>
                    {emptyDescription && (
                      <p className="text-xs text-[var(--gym-text-muted)] mt-1">{emptyDescription}</p>
                    )}
                    {emptyAction && <div className="mt-4">{emptyAction}</div>}
                  </div>
                </td>
              </tr>
            ) : (
              data.map((item, idx) => (
                <tr
                  key={keyExtractor(item, idx)}
                  onClick={() => onRowClick && onRowClick(item)}
                  className={`transition-colors duration-100 ${
                    onRowClick ? 'cursor-pointer hover:bg-[var(--gym-brand-soft,rgba(16,185,129,0.08))]' : 'hover:bg-[var(--gym-surface-glass)]'
                  }`}
                >
                  {columns.map((col) => (
                    <td key={col.key} className={`p-3.5 sm:p-4 align-middle ${col.className || ''}`}>
                      {col.render ? col.render(item, idx) : (item as any)[col.key]}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      {totalPages > 1 && onPageChange && (
        <div className="p-3 sm:px-5 border-t border-[var(--gym-border)] bg-[var(--gym-surface-glass)] flex items-center justify-between text-xs text-[var(--gym-text-muted,#9ca3af)] select-none">
          <div className="flex items-center gap-2">
            <span>
              صفحه <strong className="font-mono text-[var(--gym-text)]">{currentPage}</strong> از{' '}
              <strong className="font-mono text-[var(--gym-text)]">{totalPages}</strong>
            </span>
            {totalRecords !== undefined && (
              <span className="hidden sm:inline">
                ({totalRecords.toLocaleString('fa-IR')} رکورد کل)
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5">
            <button
              disabled={currentPage <= 1}
              onClick={() => onPageChange(currentPage - 1)}
              className="p-1.5 rounded-xl border border-[var(--gym-border)] hover:bg-[var(--gym-surface-strong)] disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer text-[var(--gym-text)]"
              aria-label="صفحه قبل"
            >
              <ChevronRight className="w-4 h-4" />
            </button>

            <button
              disabled={currentPage >= totalPages}
              onClick={() => onPageChange(currentPage + 1)}
              className="p-1.5 rounded-xl border border-[var(--gym-border)] hover:bg-[var(--gym-surface-strong)] disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer text-[var(--gym-text)]"
              aria-label="صفحه بعد"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
