import clsx from 'clsx';
import React from 'react';
import LoadingState from './LoadingState';
import EmptyState from './EmptyState';

export interface TableColumn<T> {
  title: string;
  key: string;
  render?: (row: T) => React.ReactNode;
  dataIndex?: keyof T;
  width?: string | number;
  className?: string;
}

interface TableProps<T> {
  columns: TableColumn<T>[];
  dataSource: T[];
  isLoading?: boolean;
  emptyText?: string;
  pagination?: {
    current: number;
    pageSize: number;
    total: number;
    onChange: (page: number) => void;
  };
}

export default function Table<T extends { key?: string | number }>({
  columns,
  dataSource,
  isLoading = false,
  emptyText = 'Trống',
  pagination,
}: TableProps<T>) {
  if (isLoading) {
    return <LoadingState />;
  }

  if (!dataSource || dataSource.length === 0) {
    return <EmptyState subMessage={emptyText} />;
  }

  return (
    <div className="w-full flex flex-col">
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left border-collapse">
          <thead>
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  style={{ width: col.width }}
                  className={clsx('admin-table-header', col.className)}
                >
                  {col.title}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {dataSource.map((row, rowIndex) => (
              <tr
                key={row.key || rowIndex}
                className="group hover:bg-slate-50/70 transition-colors duration-150"
              >
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className={clsx(
                      'px-4 py-3.5 align-middle text-sm text-slate-700 group-hover:text-slate-900 transition-colors duration-150',
                      col.className
                    )}
                  >
                    {col.render
                      ? col.render(row)
                      : (row[col.dataIndex as keyof T] as React.ReactNode)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {pagination && pagination.total > pagination.pageSize && (
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 bg-white">
          <div className="text-xs font-semibold text-slate-500">
            Hiển thị trang <span className="text-slate-800">{pagination.current}</span> /{' '}
            {Math.ceil(pagination.total / pagination.pageSize)}
          </div>
          <div className="flex gap-2">
            <button
              disabled={pagination.current === 1}
              onClick={() => pagination.onChange(pagination.current - 1)}
              className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-bold text-slate-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 transition-colors"
            >
              Trước
            </button>
            <button
              disabled={pagination.current === Math.ceil(pagination.total / pagination.pageSize)}
              onClick={() => pagination.onChange(pagination.current + 1)}
              className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-bold text-slate-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 transition-colors"
            >
              Sau
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
