import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import Breadcrumb from '../../components/common/breadcrumb.component';
import {
  BreadcrumbProvider,
  useBreadcrumbContext,
  type BreadcrumbItem,
} from '../../context/BreadcrumbContext';

/**
 * Helper component that sets breadcrumb items in the context,
 * simulating what useBreadcrumb does in real pages.
 */
const BreadcrumbSetter: React.FC<{
  items: BreadcrumbItem[];
  bgColor?: string;
}> = ({ items, bgColor }) => {
  const { setItems, setBgColor } = useBreadcrumbContext();

  React.useEffect(() => {
    setItems(items);
    if (bgColor) {
      setBgColor(bgColor);
    }
  }, [items, bgColor, setItems, setBgColor]);

  return null;
};

/**
 * Render helper that wraps Breadcrumb in required providers.
 */
const renderBreadcrumb = (
  items: BreadcrumbItem[],
  options?: { bgColor?: string; className?: string }
) => {
  return render(
    <MemoryRouter>
      <BreadcrumbProvider>
        <BreadcrumbSetter items={items} bgColor={options?.bgColor} />
        <Breadcrumb className={options?.className} />
      </BreadcrumbProvider>
    </MemoryRouter>
  );
};

describe('Breadcrumb Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('rendering', () => {
    it('should return null when items array is empty', () => {
      const { container } = renderBreadcrumb([]);
      expect(container.querySelector('nav')).toBeNull();
    });

    it('should render nav element when items exist', () => {
      renderBreadcrumb([{ label: 'Dashboard' }]);
      const nav = screen.getByRole('navigation', { name: 'Breadcrumb' });
      expect(nav).toBeInTheDocument();
    });

    it('should have aria-label="Breadcrumb" on nav', () => {
      renderBreadcrumb([{ label: 'Dashboard' }]);
      const nav = screen.getByRole('navigation');
      expect(nav).toHaveAttribute('aria-label', 'Breadcrumb');
    });

    it('should render an ordered list', () => {
      renderBreadcrumb([{ label: 'Dashboard' }]);
      const list = screen.getByRole('list');
      expect(list).toBeInTheDocument();
    });

    it('should render list items for each breadcrumb item', () => {
      renderBreadcrumb([
        { label: 'Dashboard', path: '/dashboard' },
        { label: 'Settings' },
      ]);
      const listItems = screen.getAllByRole('listitem');
      expect(listItems).toHaveLength(2);
    });
  });

  describe('single item', () => {
    it('should render as span (not link) when single item has no path', () => {
      renderBreadcrumb([{ label: 'Dashboard' }]);
      const span = screen.getByText('Dashboard');
      expect(span.tagName).toBe('SPAN');
    });

    it('should render single item as current page', () => {
      renderBreadcrumb([{ label: 'Dashboard' }]);
      const span = screen.getByText('Dashboard');
      expect(span).toHaveAttribute('aria-current', 'page');
    });

    it('should apply last-item styling to single item', () => {
      renderBreadcrumb([{ label: 'Dashboard' }]);
      const span = screen.getByText('Dashboard');
      expect(span).toHaveClass('text-[#374151]');
      expect(span).toHaveClass('font-medium');
    });

    it('should not render separator for single item', () => {
      renderBreadcrumb([{ label: 'Dashboard' }]);
      expect(screen.queryByText('>')).not.toBeInTheDocument();
    });
  });

  describe('multiple items', () => {
    const items: BreadcrumbItem[] = [
      { label: 'Dashboard', path: '/dashboard' },
      { label: 'Visit Details', path: '/visit-details/123' },
      { label: 'Prescription Detail' },
    ];

    it('should render ancestor items as links', () => {
      renderBreadcrumb(items);
      const dashboardLink = screen.getByRole('link', { name: 'Dashboard' });
      expect(dashboardLink).toBeInTheDocument();
      expect(dashboardLink).toHaveAttribute('href', '/dashboard');
    });

    it('should render middle items with path as links', () => {
      renderBreadcrumb(items);
      const visitLink = screen.getByRole('link', { name: 'Visit Details' });
      expect(visitLink).toBeInTheDocument();
      expect(visitLink).toHaveAttribute('href', '/visit-details/123');
    });

    it('should render last item as span (not link)', () => {
      renderBreadcrumb(items);
      const lastItem = screen.getByText('Prescription Detail');
      expect(lastItem.tagName).toBe('SPAN');
    });

    it('should set aria-current="page" only on last item', () => {
      renderBreadcrumb(items);
      const lastItem = screen.getByText('Prescription Detail');
      expect(lastItem).toHaveAttribute('aria-current', 'page');

      const dashboardLink = screen.getByRole('link', { name: 'Dashboard' });
      expect(dashboardLink).not.toHaveAttribute('aria-current');
    });

    it('should render separators between items', () => {
      renderBreadcrumb(items);
      const separators = screen.getAllByText('>');
      // 3 items = 2 separators
      expect(separators).toHaveLength(2);
    });

    it('should hide separators from accessibility tree', () => {
      renderBreadcrumb(items);
      const separators = screen.getAllByText('>');
      separators.forEach((separator) => {
        expect(separator).toHaveAttribute('aria-hidden', 'true');
      });
    });

    it('should not render separator before the first item', () => {
      renderBreadcrumb(items);
      const firstListItem = screen.getAllByRole('listitem')[0];
      // The first list item should not contain a separator
      const separatorInFirst = firstListItem.querySelector('[aria-hidden="true"]');
      expect(separatorInFirst).toBeNull();
    });
  });

  describe('link styling', () => {
    it('should apply ancestor link styles', () => {
      renderBreadcrumb([
        { label: 'Dashboard', path: '/dashboard' },
        { label: 'Settings' },
      ]);

      const link = screen.getByRole('link', { name: 'Dashboard' });
      expect(link).toHaveClass('text-[#9CA3AF]');
      expect(link).toHaveClass('hover:underline');
      expect(link).toHaveClass('transition-colors');
    });

    it('should apply current item styles', () => {
      renderBreadcrumb([
        { label: 'Dashboard', path: '/dashboard' },
        { label: 'Settings' },
      ]);

      const currentItem = screen.getByText('Settings');
      expect(currentItem).toHaveClass('text-[#374151]');
      expect(currentItem).toHaveClass('font-medium');
    });

    it('should apply muted color to separators', () => {
      renderBreadcrumb([
        { label: 'Dashboard', path: '/dashboard' },
        { label: 'Settings' },
      ]);

      const separator = screen.getByText('>');
      expect(separator).toHaveClass('text-[#9CA3AF]');
      expect(separator).toHaveClass('text-xs');
    });
  });

  describe('item without path (not last)', () => {
    it('should render non-last item without path as span', () => {
      renderBreadcrumb([
        { label: 'Dashboard' },
        { label: 'Settings' },
      ]);

      const dashboard = screen.getByText('Dashboard');
      expect(dashboard.tagName).toBe('SPAN');
    });

    it('should apply muted style to non-last item without path', () => {
      renderBreadcrumb([
        { label: 'Dashboard' },
        { label: 'Settings' },
      ]);

      const dashboard = screen.getByText('Dashboard');
      expect(dashboard).toHaveClass('text-[#9CA3AF]');
    });

    it('should not set aria-current on non-last item without path', () => {
      renderBreadcrumb([
        { label: 'Dashboard' },
        { label: 'Settings' },
      ]);

      const dashboard = screen.getByText('Dashboard');
      expect(dashboard).not.toHaveAttribute('aria-current');
    });
  });

  describe('link state', () => {
    it('should render link with state when item has state property', () => {
      const items: BreadcrumbItem[] = [
        { label: 'Dashboard', path: '/dashboard' },
        {
          label: 'Visit Details',
          path: '/visit-details/123',
          state: { fromLabel: 'Prescriptions', fromPath: '/prescriptions' },
        },
        { label: 'Prescription Detail' },
      ];

      renderBreadcrumb(items);
      const link = screen.getByRole('link', { name: 'Visit Details' });
      expect(link).toBeInTheDocument();
      expect(link).toHaveAttribute('href', '/visit-details/123');
    });

    it('should render link without state when item has no state', () => {
      const items: BreadcrumbItem[] = [
        { label: 'Dashboard', path: '/dashboard' },
        { label: 'Settings' },
      ];

      renderBreadcrumb(items);
      const link = screen.getByRole('link', { name: 'Dashboard' });
      expect(link).toBeInTheDocument();
    });
  });

  describe('bgColor', () => {
    it('should apply default bg-white class', () => {
      renderBreadcrumb([{ label: 'Dashboard' }]);
      const nav = screen.getByRole('navigation');
      expect(nav).toHaveClass('bg-white');
    });

    it('should apply custom bgColor from context', () => {
      renderBreadcrumb([{ label: 'Dashboard' }], {
        bgColor: 'bg-[#F5F5FA]',
      });
      const nav = screen.getByRole('navigation');
      expect(nav).toHaveClass('bg-[#F5F5FA]');
    });

    it('should apply bg-gray-50 bgColor', () => {
      renderBreadcrumb([{ label: 'Educational Videos' }], {
        bgColor: 'bg-gray-50',
      });
      const nav = screen.getByRole('navigation');
      expect(nav).toHaveClass('bg-gray-50');
    });
  });

  describe('className prop', () => {
    it('should apply additional className to nav', () => {
      renderBreadcrumb([{ label: 'Dashboard' }], {
        className: 'custom-class',
      });
      const nav = screen.getByRole('navigation');
      expect(nav).toHaveClass('custom-class');
    });

    it('should maintain default classes when className is provided', () => {
      renderBreadcrumb([{ label: 'Dashboard' }], {
        className: 'custom-class',
      });
      const nav = screen.getByRole('navigation');
      expect(nav).toHaveClass('px-4');
      expect(nav).toHaveClass('py-2');
    });

    it('should render without className when not provided', () => {
      renderBreadcrumb([{ label: 'Dashboard' }]);
      const nav = screen.getByRole('navigation');
      expect(nav).toHaveClass('px-4');
      expect(nav).toHaveClass('py-2');
    });
  });

  describe('text sizing', () => {
    it('should use text-sm for the breadcrumb list', () => {
      renderBreadcrumb([{ label: 'Dashboard' }]);
      const list = screen.getByRole('list');
      expect(list).toHaveClass('text-sm');
    });
  });

  describe('edge cases', () => {
    it('should handle last item that also has a path (renders as span)', () => {
      // Even if the last item has a path, it should still render as span
      renderBreadcrumb([
        { label: 'Dashboard', path: '/dashboard' },
        { label: 'Settings', path: '/settings' },
      ]);

      const settings = screen.getByText('Settings');
      expect(settings.tagName).toBe('SPAN');
      expect(settings).toHaveAttribute('aria-current', 'page');
    });

    it('should render correctly with many items', () => {
      renderBreadcrumb([
        { label: 'Dashboard', path: '/dashboard' },
        { label: 'Open Visits', path: '/open-visits' },
        { label: 'Visit Details', path: '/visit-details/1' },
        { label: 'Visit Summary', path: '/visit-summary/1' },
        { label: 'Prescription Detail' },
      ]);

      const listItems = screen.getAllByRole('listitem');
      expect(listItems).toHaveLength(5);

      const separators = screen.getAllByText('>');
      expect(separators).toHaveLength(4);
    });
  });

  describe('onClick items', () => {
    it('should render item with onClick as a button element', () => {
      const handleClick = vi.fn();
      renderBreadcrumb([
        { label: 'Dashboard', path: '/dashboard' },
        { label: 'Add Patient', onClick: handleClick },
        { label: 'Current Page' },
      ]);
      const button = screen.getByRole('button', { name: 'Add Patient' });
      expect(button).toBeInTheDocument();
      expect(button.tagName).toBe('BUTTON');
    });

    it('should call onClick handler when button is clicked', async () => {
      const user = userEvent.setup();
      const handleClick = vi.fn();
      renderBreadcrumb([
        { label: 'Dashboard', path: '/dashboard' },
        { label: 'Start Visit', onClick: handleClick },
        { label: 'Current' },
      ]);
      await user.click(screen.getByRole('button', { name: 'Start Visit' }));
      expect(handleClick).toHaveBeenCalledOnce();
    });

    it('should set type="button" on onClick items', () => {
      renderBreadcrumb([
        { label: 'Back', onClick: vi.fn() },
        { label: 'Current' },
      ]);
      const button = screen.getByRole('button', { name: 'Back' });
      expect(button).toHaveAttribute('type', 'button');
    });

    it('should apply reset styles to onClick button', () => {
      renderBreadcrumb([
        { label: 'Step', onClick: vi.fn() },
        { label: 'Current' },
      ]);
      const button = screen.getByRole('button', { name: 'Step' });
      expect(button).toHaveClass('bg-transparent');
      expect(button).toHaveClass('border-none');
      expect(button).toHaveClass('p-0');
      expect(button).toHaveClass('m-0');
      expect(button).toHaveClass('cursor-pointer');
    });

    it('should apply non-last styling to non-last onClick item', () => {
      renderBreadcrumb([
        { label: 'Step', onClick: vi.fn() },
        { label: 'Current' },
      ]);
      const button = screen.getByRole('button', { name: 'Step' });
      expect(button).toHaveClass('text-[#9CA3AF]');
    });

    it('should apply last-item styling when onClick item is last', () => {
      renderBreadcrumb([
        { label: 'Dashboard', path: '/dashboard' },
        { label: 'Active Step', onClick: vi.fn() },
      ]);
      const button = screen.getByRole('button', { name: 'Active Step' });
      expect(button).toHaveClass('text-[#374151]');
      expect(button).toHaveClass('font-medium');
    });

    it('should prefer path over onClick when item is not last', () => {
      const handleClick = vi.fn();
      renderBreadcrumb([
        { label: 'Clickable', path: '/some-path', onClick: handleClick },
        { label: 'Current' },
      ]);
      // path && !isLast takes precedence, so it renders as a Link, not a button
      const link = screen.getByRole('link', { name: 'Clickable' });
      expect(link).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'Clickable' })).not.toBeInTheDocument();
    });
  });

  describe('status and aria-current', () => {
    it('should set aria-current="step" when status is active', () => {
      renderBreadcrumb([
        { label: 'Dashboard', path: '/dashboard' },
        { label: 'Vitals', status: 'active' },
      ]);
      const span = screen.getByText('Vitals');
      expect(span).toHaveAttribute('aria-current', 'step');
    });

    it('should set aria-current="page" on last item without active status', () => {
      renderBreadcrumb([
        { label: 'Dashboard', path: '/dashboard' },
        { label: 'Settings' },
      ]);
      const span = screen.getByText('Settings');
      expect(span).toHaveAttribute('aria-current', 'page');
    });

    it('should not set aria-current on completed status item (non-last)', () => {
      renderBreadcrumb([
        { label: 'Vitals', status: 'completed' },
        { label: 'Visit Reason', status: 'active' },
      ]);
      const completed = screen.getByText('Vitals');
      expect(completed).not.toHaveAttribute('aria-current');
    });

    it('should apply non-last styling to completed status items', () => {
      renderBreadcrumb([
        { label: 'Vitals', status: 'completed' },
        { label: 'Visit Reason', status: 'active' },
      ]);
      const completed = screen.getByText('Vitals');
      expect(completed).toHaveClass('text-[#9CA3AF]');
    });

    it('should apply last-item styling to active status when it is the last item', () => {
      renderBreadcrumb([
        { label: 'Dashboard', path: '/dashboard' },
        { label: 'Vitals', status: 'active' },
      ]);
      const active = screen.getByText('Vitals');
      expect(active).toHaveClass('text-[#374151]');
      expect(active).toHaveClass('font-medium');
    });
  });
});
