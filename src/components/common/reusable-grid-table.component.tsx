import React, { useState } from 'react';

const DEFAULT_ROW_COUNT = 6;

interface Column<T> {
  header: string;
  accessor: keyof T;
  render?: (row: T) => React.ReactNode;
}

interface ResponsiveTableProps<T> {
  columns: Column<T>[];
  data: T[];
  initialRowCount?: number;
  onRowClick?: (row: T) => void;
}

export function ReusableGridTable<T>({
  columns,
  data,
  initialRowCount = DEFAULT_ROW_COUNT,
  onRowClick,
}: ResponsiveTableProps<T>) {
  const [showAll, setShowAll] = useState(false);

  const visibleData = showAll ? data : data.slice(0, initialRowCount);
  const hasMore = data.length > initialRowCount;

  return (
    <div className="flex flex-col min-h-0 flex-1">
      {/* Desktop Header – fixed at top */}
      <div className="hidden lg:grid lg:grid-cols-6 gap-4 px-6 lg:px-4 mt-1 text-sm font-medium text-gray-500 bg-white z-10 py-2 shrink-0">
        {columns.map((col, index) => (
          <span key={index}>{col.header}</span>
        ))}
      </div>

      {/*  Rows – scrollable area */}
      <div className="space-y-1.5 p-2 lg:p-1.5 flex-1 min-h-0 overflow-y-auto">
        {visibleData.map((row, rowIndex) => (
          <div
            key={rowIndex}
            className={`rounded-xl border border-[#ECEEFF] bg-white shadow-[0px_1px_2px_0px_#1018280D]${onRowClick ? ' cursor-pointer hover:bg-gray-50 transition-colors' : ''}`}
            onClick={() => onRowClick?.(row)}
          >
            {/* MOBILE VIEW */}
            <div className="block lg:hidden p-4 space-y-2">
              {columns.map((col, colIndex) => (
                <div key={colIndex}>
                  <p className="text-sm text-gray-400">{col.header}</p>
                  <div className="text-sm text-gray-700">
                    {col.render
                      ? col.render(row)
                      : (row[col.accessor] as React.ReactNode)}
                  </div>
                </div>
              ))}
            </div>

            {/* DESKTOP VIEW */}
            <div className="hidden lg:grid lg:grid-cols-6 lg:items-center gap-4 px-2 h-[46px] text-sm">
              {columns.map((col, colIndex) => (
                <div key={colIndex} className="truncate">
                  {col.render
                    ? col.render(row)
                    : (row[col.accessor] as React.ReactNode)}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/*  Footer – fixed at bottom */}
      {hasMore && (
        <div
          className="flex justify-end px-6 lg:px-4 py-3 lg:py-2 cursor-pointer shrink-0"
          onClick={() => setShowAll(prev => !prev)}
        >
          <p className="text-sm text-indigo-600">
            {showAll ? '← Show less' : 'Show all →'}
          </p>
        </div>
      )}
    </div>
  );
}
