import {
  ArrowDown,
  ArrowUp,
  ChevronLeft,
  ChevronRight,
  Download,
  Search,
  SlidersHorizontal,
  X,
} from 'lucide-react';
import { useMemo, useState, type ReactNode } from 'react';

export interface AdminDataColumn<T> {
  key: string;
  header: string;
  accessor?: keyof T | ((row: T) => unknown);
  render?: (row: T) => ReactNode;
  sortable?: boolean;
  exportValue?: (row: T) => string | number | null | undefined;
  className?: string;
  align?: 'left' | 'center' | 'right';
}

export interface AdminDataFilter<T> {
  key: string;
  label: string;
  options: Array<{ label: string; value: string }>;
  predicate: (row: T, value: string) => boolean;
}

export interface AdminBulkAction<T> {
  label: string;
  onClick: (rows: T[]) => void | Promise<void>;
  tone?: 'default' | 'danger';
}

interface AdminDataTableProps<T> {
  rows: T[];
  columns: AdminDataColumn<T>[];
  rowKey: (row: T) => string | number;
  searchFields?: Array<keyof T | ((row: T) => unknown)>;
  searchPlaceholder?: string;
  filters?: AdminDataFilter<T>[];
  pageSizeOptions?: number[];
  defaultPageSize?: number;
  selectable?: boolean;
  bulkActions?: AdminBulkAction<T>[];
  exportFileName?: string;
  isLoading?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
  toolbar?: ReactNode;
}

function normalize(value: unknown) {
  return String(value ?? '').toLocaleLowerCase('vi-VN').normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

function csvCell(value: unknown) {
  const text = String(value ?? '');
  return `"${text.replaceAll('"', '""')}"`;
}

export default function AdminDataTable<T>({
  rows,
  columns,
  rowKey,
  searchFields = [],
  searchPlaceholder = 'Tìm kiếm trong danh sách...',
  filters = [],
  pageSizeOptions = [10, 20, 50],
  defaultPageSize = 10,
  selectable = false,
  bulkActions = [],
  exportFileName = 'admin-export.csv',
  isLoading = false,
  emptyTitle = 'Chưa có dữ liệu',
  emptyDescription = 'Dữ liệu phù hợp sẽ xuất hiện tại đây.',
  toolbar,
}: AdminDataTableProps<T>) {
  const [query, setQuery] = useState('');
  const [filterValues, setFilterValues] = useState<Record<string, string>>({});
  const [sort, setSort] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(defaultPageSize);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const processedRows = useMemo(() => {
    const normalizedQuery = normalize(query.trim());
    let result = rows.filter((row) => {
      if (normalizedQuery && searchFields.length) {
        const matches = searchFields.some((field) => {
          const value = typeof field === 'function' ? field(row) : row[field];
          return normalize(value).includes(normalizedQuery);
        });
        if (!matches) return false;
      }
      return filters.every((filter) => {
        const value = filterValues[filter.key];
        return !value || filter.predicate(row, value);
      });
    });

    if (sort) {
      const column = columns.find((item) => item.key === sort.key);
      if (column) {
        const valueFor = (row: T) => {
          if (typeof column.accessor === 'function') return column.accessor(row);
          if (column.accessor) return row[column.accessor];
          return (row as Record<string, unknown>)[column.key];
        };
        result = [...result].sort((left, right) => {
          const a = valueFor(left);
          const b = valueFor(right);
          const comparison = typeof a === 'number' && typeof b === 'number'
            ? a - b
            : String(a ?? '').localeCompare(String(b ?? ''), 'vi', { numeric: true });
          return sort.direction === 'asc' ? comparison : -comparison;
        });
      }
    }

    return result;
  }, [columns, filterValues, filters, query, rows, searchFields, sort]);

  const totalPages = Math.max(1, Math.ceil(processedRows.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const pageRows = processedRows.slice((safePage - 1) * pageSize, safePage * pageSize);
  const selectedRows = processedRows.filter((row) => selected.has(String(rowKey(row))));
  const selectedPageCount = pageRows.filter((row) => selected.has(String(rowKey(row)))).length;
  const allPageSelected = pageRows.length > 0 && selectedPageCount === pageRows.length;

  const resetPage = () => setPage(1);

  const toggleSort = (column: AdminDataColumn<T>) => {
    if (!column.sortable) return;
    setSort((current) => {
      if (!current || current.key !== column.key) return { key: column.key, direction: 'asc' };
      if (current.direction === 'asc') return { key: column.key, direction: 'desc' };
      return null;
    });
  };

  const toggleRow = (row: T) => {
    const key = String(rowKey(row));
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const togglePage = () => {
    setSelected((current) => {
      const next = new Set(current);
      pageRows.forEach((row) => {
        const key = String(rowKey(row));
        if (allPageSelected) next.delete(key);
        else next.add(key);
      });
      return next;
    });
  };

  const exportCsv = () => {
    const exportRows = selectedRows.length ? selectedRows : processedRows;
    const exportColumns = columns.filter((column) => column.exportValue || column.accessor);
    const content = [
      exportColumns.map((column) => csvCell(column.header)).join(','),
      ...exportRows.map((row) => exportColumns.map((column) => {
        if (column.exportValue) return csvCell(column.exportValue(row));
        if (typeof column.accessor === 'function') return csvCell(column.accessor(row));
        if (column.accessor) return csvCell(row[column.accessor]);
        return csvCell('');
      }).join(',')),
    ].join('\n');
    const blob = new Blob([`\uFEFF${content}`], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = exportFileName;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-col gap-4 border-b border-slate-100 p-4 lg:flex-row lg:items-center lg:justify-between lg:p-5">
        <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
          <label className="relative min-w-0 flex-1 lg:max-w-sm">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={query}
              onChange={(event) => { setQuery(event.target.value); resetPage(); }}
              placeholder={searchPlaceholder}
              className="min-h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-10 text-sm outline-none transition focus:border-primary-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
            />
            {query && <button type="button" onClick={() => { setQuery(''); resetPage(); }} className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1 text-slate-400 hover:bg-slate-200" aria-label="Xóa tìm kiếm"><X className="h-3.5 w-3.5" /></button>}
          </label>

          {filters.map((filter) => (
            <label key={filter.key} className="relative">
              <SlidersHorizontal className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <select
                value={filterValues[filter.key] ?? ''}
                onChange={(event) => { setFilterValues((current) => ({ ...current, [filter.key]: event.target.value })); resetPage(); }}
                className="min-h-11 rounded-xl border border-slate-200 bg-white pl-9 pr-8 text-sm font-semibold text-slate-600 outline-none focus:border-primary-500 focus:ring-4 focus:ring-blue-100"
                aria-label={filter.label}
              >
                <option value="">{filter.label}: Tất cả</option>
                {filter.options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
              </select>
            </label>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {toolbar}
          <button type="button" onClick={exportCsv} disabled={!processedRows.length} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-black text-slate-600 transition hover:border-primary-200 hover:text-primary-700 disabled:opacity-40">
            <Download className="h-4 w-4" /> Export CSV
          </button>
        </div>
      </div>

      {selectedRows.length > 0 && (
        <div className="flex flex-col gap-3 border-b border-blue-100 bg-blue-50/70 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <span className="text-sm font-black text-blue-900">Đã chọn {selectedRows.length} dòng</span>
          <div className="flex flex-wrap gap-2">
            {bulkActions.map((action) => (
              <button key={action.label} type="button" onClick={() => void action.onClick(selectedRows)} className={`rounded-lg px-3 py-2 text-xs font-black ${action.tone === 'danger' ? 'bg-red-600 text-white' : 'border border-blue-200 bg-white text-blue-700'}`}>{action.label}</button>
            ))}
            <button type="button" onClick={() => setSelected(new Set())} className="rounded-lg px-3 py-2 text-xs font-black text-slate-500 hover:bg-white">Bỏ chọn</button>
          </div>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] border-collapse text-left text-sm">
          <thead className="bg-slate-50/90">
            <tr>
              {selectable && <th className="w-12 px-4 py-3"><input type="checkbox" checked={allPageSelected} onChange={togglePage} aria-label="Chọn tất cả dòng trên trang" /></th>}
              {columns.map((column) => (
                <th key={column.key} className={`px-4 py-3 text-[11px] font-black uppercase tracking-wider text-slate-500 ${column.className ?? ''}`}>
                  <button type="button" disabled={!column.sortable} onClick={() => toggleSort(column)} className={`inline-flex items-center gap-1.5 ${column.sortable ? 'cursor-pointer hover:text-slate-900' : 'cursor-default'}`}>
                    {column.header}
                    {sort?.key === column.key && (sort.direction === 'asc' ? <ArrowUp className="h-3.5 w-3.5" /> : <ArrowDown className="h-3.5 w-3.5" />)}
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {isLoading ? Array.from({ length: 5 }).map((_, index) => (
              <tr key={index}>{selectable && <td className="px-4 py-4"><div className="h-4 w-4 animate-pulse rounded bg-slate-100" /></td>}{columns.map((column) => <td key={column.key} className="px-4 py-4"><div className="h-4 animate-pulse rounded bg-slate-100" /></td>)}</tr>
            )) : pageRows.map((row) => {
              const key = String(rowKey(row));
              return (
                <tr key={key} className={`transition hover:bg-slate-50 ${selected.has(key) ? 'bg-blue-50/50' : ''}`}>
                  {selectable && <td className="px-4 py-4"><input type="checkbox" checked={selected.has(key)} onChange={() => toggleRow(row)} aria-label={`Chọn dòng ${key}`} /></td>}
                  {columns.map((column) => (
                    <td key={column.key} className={`px-4 py-4 text-slate-700 ${column.align === 'right' ? 'text-right' : column.align === 'center' ? 'text-center' : ''} ${column.className ?? ''}`}>
                      {column.render ? column.render(row) : typeof column.accessor === 'function' ? String(column.accessor(row) ?? '') : column.accessor ? String(row[column.accessor] ?? '') : ''}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {!isLoading && !pageRows.length && (
        <div className="px-6 py-16 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400"><Search className="h-6 w-6" /></div>
          <h3 className="mt-4 text-base font-black text-slate-900">{emptyTitle}</h3>
          <p className="mt-1 text-sm text-slate-500">{emptyDescription}</p>
        </div>
      )}

      <footer className="flex flex-col gap-4 border-t border-slate-100 bg-slate-50/70 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3 text-xs font-semibold text-slate-500">
          <span>{processedRows.length} kết quả</span>
          <label className="flex items-center gap-2">Hiển thị
            <select value={pageSize} onChange={(event) => { setPageSize(Number(event.target.value)); setPage(1); }} className="rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs font-black text-slate-700">
              {pageSizeOptions.map((value) => <option key={value} value={value}>{value}</option>)}
            </select>
          </label>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" disabled={safePage <= 1} onClick={() => setPage((current) => Math.max(1, current - 1))} className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 disabled:opacity-40" aria-label="Trang trước"><ChevronLeft className="h-4 w-4" /></button>
          <span className="min-w-20 text-center text-xs font-black text-slate-600">{safePage} / {totalPages}</span>
          <button type="button" disabled={safePage >= totalPages} onClick={() => setPage((current) => Math.min(totalPages, current + 1))} className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 disabled:opacity-40" aria-label="Trang sau"><ChevronRight className="h-4 w-4" /></button>
        </div>
      </footer>
    </section>
  );
}
