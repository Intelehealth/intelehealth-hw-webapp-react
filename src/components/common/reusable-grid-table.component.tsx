import React from 'react';

interface Column<T> {
  header: string;
  accessor: keyof T;
  render?: (row: T) => React.ReactNode;
}

interface ResponsiveTableProps<T> {
  columns: Column<T>[];
  data: T[];
}

export function ReusableGridTable<T>({
  columns,
  data,
}: ResponsiveTableProps<T>) {
  return (
    <div>
      {/* Desktop Header */}
      <div className="hidden lg:grid lg:grid-cols-6 gap-4 px-6 lg:px-4 mt-1 text-sm font-medium text-gray-500">
        {columns.map((col, index) => (
          <span key={index}>{col.header}</span>
        ))}
      </div>

      {/*  Rows */}
      <div className="space-y-1.5 p-2 lg:p-1.5">
        {data.map((row, rowIndex) => (
          <div
            key={rowIndex}
            className="rounded-xl border border-[#ECEEFF] bg-white shadow-[0px_1px_2px_0px_#1018280D]"
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

      {/*  Footer */}
      <div className="flex justify-end px-6 lg:px-4 py-3 lg:py-2 cursor-pointer">
        <p className="text-sm text-indigo-600">Show all →</p>
      </div>
    </div>
  );
}
