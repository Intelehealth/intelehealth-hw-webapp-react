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
      <ol className="flex items-center gap-1.5 text-sm">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;

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
              ) : (
                <span
                  className={cn(
                    isLast ? 'text-[#374151] font-medium' : 'text-[#9CA3AF]'
                  )}
                  aria-current={isLast ? 'page' : undefined}
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
