import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockNavigate = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

// Mock Calendar component to avoid DatePicker complexity
vi.mock('../../../components/common/calendar.component', () => ({
  default: ({ value, onChange, placeholder }: any) => (
    <input
      data-testid="calendar-input"
      value={value}
      placeholder={placeholder}
      onChange={e => onChange?.(e.target.value)}
    />
  ),
}));

// Mock SVG imports
vi.mock('../../../assets/icons/icon-achievements-clock.svg', () => ({ default: 'icon-clock' }));
vi.mock('../../../assets/icons/icon-achievements-level1.svg', () => ({ default: 'icon-level1' }));
vi.mock('../../../assets/icons/icon-achievements-star.svg', () => ({ default: 'icon-star' }));
vi.mock('../../../assets/icons/icon-achievements-title.svg', () => ({ default: 'icon-title' }));
vi.mock('../../../assets/icons/icon-achievements-visit-completed.svg', () => ({ default: 'icon-visit-completed' }));
vi.mock('../../../assets/icons/icon-achievements-vist-added.svg', () => ({ default: 'icon-visit-added' }));
vi.mock('../../../assets/icons/icon-calendar-blue.svg', () => ({ default: 'icon-calendar-blue' }));
vi.mock('../../../assets/icons/icon-sync.svg', () => ({ default: 'icon-sync' }));
vi.mock('../../../assets/icons/icon-three-dot-green-rounded.svg', () => ({ default: 'icon-three-dot' }));

import { AchievementUiComponent } from '../../../modules/achievement-ui/achievement-ui.component';

const renderComponent = () =>
  render(
    <MemoryRouter>
      <AchievementUiComponent />
    </MemoryRouter>
  );

describe('AchievementUiComponent', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('rendering', () => {
    it('should render without crashing', () => {
      expect(() => renderComponent()).not.toThrow();
    });

    it('should render mobile header with "My achievements" title', () => {
      renderComponent();
      expect(screen.getByText('My achievements')).toBeInTheDocument();
    });

    it('should render desktop header with "Achievements" title', () => {
      renderComponent();
      expect(screen.getByText('Achievements')).toBeInTheDocument();
    });

    it('should render level info — Level 1 and 1200 Points', () => {
      renderComponent();
      expect(screen.getByText('Level 1')).toBeInTheDocument();
      expect(screen.getByText('1200 Points')).toBeInTheDocument();
    });

    it('should render all three tabs', () => {
      renderComponent();
      expect(screen.getByText('Overall')).toBeInTheDocument();
      expect(screen.getByText('Daily')).toBeInTheDocument();
      expect(screen.getByText('Date Range')).toBeInTheDocument();
    });

    it('should render sync and three-dot menu buttons in mobile header', () => {
      const { container } = renderComponent();
      const images = container.querySelectorAll('img[alt="sync"], img[alt="menu"]');
      expect(images.length).toBe(2);
    });
  });

  describe('default tab — Overall', () => {
    it('should have Overall tab active by default', () => {
      renderComponent();
      const overallTab = screen.getByText('Overall');
      expect(overallTab).toHaveClass('text-indigo-600');
    });

    it('should not show the daily date section on Overall tab', () => {
      renderComponent();
      const today = new Date().toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
      expect(screen.queryByText(today)).not.toBeInTheDocument();
    });

    it('should not show date range pickers on Overall tab', () => {
      renderComponent();
      expect(screen.queryByPlaceholderText('Select date')).not.toBeInTheDocument();
    });

    it('should render all four achievement cards on Overall tab', () => {
      renderComponent();
      expect(screen.getByText('Your patient satisfactions score')).toBeInTheDocument();
      expect(screen.getByText('Daily average time spent by you')).toBeInTheDocument();
      expect(screen.getByText('Visits completed by you')).toBeInTheDocument();
      expect(screen.getByText('Patients added by you')).toBeInTheDocument();
    });

    it('should render achievement card values', () => {
      renderComponent();
      expect(screen.getByText('0.3')).toBeInTheDocument();
      expect(screen.getByText('0h 0m')).toBeInTheDocument();
      expect(screen.getByText('22')).toBeInTheDocument();
      expect(screen.getByText('24')).toBeInTheDocument();
    });
  });

  describe('tab switching', () => {
    it('should switch active tab to Daily when clicked', () => {
      renderComponent();
      const dailyTab = screen.getByText('Daily');
      fireEvent.click(dailyTab);
      expect(dailyTab).toHaveClass('text-indigo-600');
    });

    it('should deactivate Overall tab when Daily is clicked', () => {
      renderComponent();
      fireEvent.click(screen.getByText('Daily'));
      expect(screen.getByText('Overall')).toHaveClass('text-[#7F7B92]');
    });

    it('should switch active tab to Date Range when clicked', () => {
      renderComponent();
      const dataRangeTab = screen.getByText('Date Range');
      fireEvent.click(dataRangeTab);
      expect(dataRangeTab).toHaveClass('text-indigo-600');
    });

    it('should switch back to Overall from Daily', () => {
      renderComponent();
      fireEvent.click(screen.getByText('Daily'));
      fireEvent.click(screen.getByText('Overall'));
      expect(screen.getByText('Overall')).toHaveClass('text-indigo-600');
    });
  });

  describe('Daily tab', () => {
    it('should show today\'s date when Daily tab is active', () => {
      renderComponent();
      fireEvent.click(screen.getByText('Daily'));

      const today = new Date().toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
      expect(screen.getByText(today)).toBeInTheDocument();
    });

    it('should not show date range pickers on Daily tab', () => {
      renderComponent();
      fireEvent.click(screen.getByText('Daily'));
      expect(screen.queryByPlaceholderText('Select date')).not.toBeInTheDocument();
    });

    it('should still show achievement cards on Daily tab', () => {
      renderComponent();
      fireEvent.click(screen.getByText('Daily'));
      expect(screen.getByText('Visits completed by you')).toBeInTheDocument();
    });
  });

  describe('Date Range tab', () => {
    it('should show From and To labels when Date Range tab is active', () => {
      renderComponent();
      fireEvent.click(screen.getByText('Date Range'));
      expect(screen.getByText('From')).toBeInTheDocument();
      expect(screen.getByText('To')).toBeInTheDocument();
    });

    it('should render two date picker inputs on Date Range tab', () => {
      renderComponent();
      fireEvent.click(screen.getByText('Date Range'));
      const inputs = screen.getAllByTestId('calendar-input');
      expect(inputs).toHaveLength(2);
    });

    it('should render date pickers with "Select date" placeholder', () => {
      renderComponent();
      fireEvent.click(screen.getByText('Date Range'));
      const inputs = screen.getAllByPlaceholderText('Select date');
      expect(inputs).toHaveLength(2);
    });

    it('should not show daily date section on Date Range tab', () => {
      renderComponent();
      fireEvent.click(screen.getByText('Date Range'));
      const today = new Date().toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
      expect(screen.queryByText(today)).not.toBeInTheDocument();
    });

    it('should update fromDate when From input changes', () => {
      renderComponent();
      fireEvent.click(screen.getByText('Date Range'));
      const [fromInput] = screen.getAllByTestId('calendar-input');
      fireEvent.change(fromInput, { target: { value: '2026-01-01' } });
      expect((fromInput as HTMLInputElement).value).toBe('2026-01-01');
    });

    it('should update toDate when To input changes', () => {
      renderComponent();
      fireEvent.click(screen.getByText('Date Range'));
      const [, toInput] = screen.getAllByTestId('calendar-input');
      fireEvent.change(toInput, { target: { value: '2026-01-31' } });
      expect((toInput as HTMLInputElement).value).toBe('2026-01-31');
    });

    it('should still show achievement cards on Date Range tab', () => {
      renderComponent();
      fireEvent.click(screen.getByText('Date Range'));
      expect(screen.getByText('Visits completed by you')).toBeInTheDocument();
    });
  });

  describe('navigation', () => {
    it('should navigate to /dashboard when back arrow is clicked', () => {
      const { container } = renderComponent();
      const arrowBtn = container.querySelector('button .fa-arrow-left')?.closest('button');
      if (arrowBtn) {
        fireEvent.click(arrowBtn);
        expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
      }
    });
  });

  describe('achievement cards layout', () => {
    it('should render exactly four achievement cards', () => {
      const { container } = renderComponent();
      const grid = container.querySelector('.grid.grid-cols-2');
      expect(grid?.children.length).toBe(4);
    });

    it('should render cards with distinct background colors', () => {
      const { container } = renderComponent();
      expect(container.querySelector('.bg-\\[\\#E5FFF3\\]')).toBeInTheDocument();
      expect(container.querySelector('.bg-\\[\\#EFE8FF\\]')).toBeInTheDocument();
      expect(container.querySelector('.bg-\\[\\#FFEADE\\]')).toBeInTheDocument();
      expect(container.querySelector('.bg-\\[\\#FAF9FF\\]')).toBeInTheDocument();
    });
  });
});
