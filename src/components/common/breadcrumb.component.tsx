import React from 'react';
import { Link } from 'react-router-dom';
import { useBreadcrumbContext } from '../../context/BreadcrumbContext';
import { cn } from '../../utils/cn';

export interface BreadcrumbProps {
  className?: string;
}

const Breadcrumb: React.FC<BreadcrumbProps> = ({ className }) => {
  const { items, bgColor } = useBreadcrumbContext();

  if (items.length === 0) {
    return null;
  }

  return (
    <nav
      aria-label="Breadcrumb"
      className={cn('px-4 py-2', bgColor, className)}
    >
      <ol className="flex items-center gap-1.5 text-sm flex-wrap">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;

          const getItemClassName = () =>
            isLast ? 'text-[#374151] font-medium' : 'text-[#9CA3AF]';

          return (
            <li
              key={`${item.label}-${index}`}
              className="flex items-center gap-1.5"
            >
              {index > 0 && (
                <span className="text-[#9CA3AF] text-xs" aria-hidden="true">
                  &gt;
                </span>
              )}
              {item.path && !isLast ? (
                <Link
                  to={item.path}
                  state={item.state}
                  className="text-[#9CA3AF] hover:underline transition-colors"
                >
                  {item.label}
                </Link>
              ) : item.onClick ? (
                <button
                  type="button"
                  onClick={item.onClick}
                  className={cn(
                    'bg-transparent border-none p-0 m-0 font-inherit text-inherit',
                    'hover:underline cursor-pointer transition-colors',
                    getItemClassName()
                  )}
                >
                  {item.label}
                </button>
              ) : (
                <span
                  className={cn(getItemClassName())}
                  aria-current={
                    item.status === 'active'
                      ? 'step'
                      : isLast
                        ? 'page'
                        : undefined
                  }
                >
                  {item.label}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
};

Breadcrumb.displayName = 'Breadcrumb';

export default Breadcrumb;
