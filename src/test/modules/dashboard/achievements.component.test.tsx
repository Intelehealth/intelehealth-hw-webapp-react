import { render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { achievementsData } from '../../../assets/data/achievements.data';
import { AchievementsComponent } from '../../../modules/dashboard/achievements.component';
import type { AchievementSummary } from '../../../modules/daily-time-tracking/types/achievement-summary.types';
import { formatDuration } from '../../../modules/daily-time-tracking/utils/achievement-format';
import {
  istDate,
  serverKey,
} from '../../../modules/daily-time-tracking/utils/activity-buffer';

const mockUseAchievementSummary = vi.fn();

vi.mock('../../../modules/daily-time-tracking/hooks/useAchievementSummary', () => ({
  useAchievementSummary: () => mockUseAchievementSummary(),
}));

const mockUnsentSeconds = vi.fn();
const mockUnsentArgs = vi.fn();

vi.mock('../../../modules/daily-time-tracking/hooks/useUnsentActivitySeconds', () => ({
  useUnsentActivitySeconds: (from?: string | null, to?: string | null) => {
    mockUnsentArgs(from, to);
    return mockUnsentSeconds();
  },
}));

const summary = (
  overrides: Partial<AchievementSummary> = {}
): AchievementSummary => ({
  from: '2026-10-27',
  to: '2026-10-27',
  doctorVisitsInRange: 0, // for the dates asked for (today)
  doctorVisitsCompletedTotal: 3, // everything up to now: this is what the panel shows
  visitsPendingFromDoctor: 7, // in the response, not shown on the panel
  beneficiariesRegisteredInRange: 0,
  beneficiariesRegisteredTotal: 5,
  timeSpentSecondsInRange: 5460,
  status: 'Active',
  ...overrides,
});

const loaded = (data: AchievementSummary) => ({
  data,
  loading: false,
  error: false,
});

describe('AchievementsComponent', () => {
  const renderComponent = () => render(<AchievementsComponent />);

  beforeEach(() => {
    mockUseAchievementSummary.mockReset();
    mockUseAchievementSummary.mockReturnValue(loaded(summary()));
    mockUnsentSeconds.mockReset();
    mockUnsentSeconds.mockReturnValue(0);
    mockUnsentArgs.mockReset();
  });

  describe('layout', () => {
    it('renders without crashing', () => {
      expect(() => renderComponent()).not.toThrow();
    });

    it('renders Achievements heading', () => {
      renderComponent();
      expect(screen.getByText('Achievements')).toBeInTheDocument();
    });

    it('renders achievements icon in header', () => {
      renderComponent();
      expect(screen.getByAltText('achievements')).toBeInTheDocument();
    });

    it('renders all achievement item labels', () => {
      renderComponent();
      for (const item of achievementsData) {
        expect(screen.getByText(item.label)).toBeInTheDocument();
      }
    });

    it('renders the four cards the portal can supply', () => {
      renderComponent();
      expect(achievementsData.length).toBe(4);
    });

    it('does not show the Sevika/NCD and Household cards, even if the portal sends a value', () => {
      // the portal still sends these fields: they are not part of the type, so they are not read
      const response = { ...summary(), sevikaNcdVisits: 4, householdsRegistered: 6 };
      mockUseAchievementSummary.mockReturnValue(loaded(response));
      renderComponent();
      expect(screen.queryByText('Sevika/ NCD Visits')).not.toBeInTheDocument();
      expect(
        screen.queryByText('Household Registered')
      ).not.toBeInTheDocument();
      expect(screen.queryByText('4')).not.toBeInTheDocument();
      expect(screen.queryByText('6')).not.toBeInTheDocument();
    });

    it('renders correct number of icons (1 header + 4 items + 4 info)', () => {
      renderComponent();
      expect(screen.getAllByRole('img').length).toBe(9);
    });

    it('renders info indicators for each item', () => {
      renderComponent();
      expect(screen.getAllByAltText('info').length).toBe(
        achievementsData.length
      );
    });
  });

  describe('values from the portal', () => {
    it('shows the totals up to now', () => {
      renderComponent();
      expect(screen.getByText('3')).toBeInTheDocument(); // doctor visits completed
      expect(screen.getByText('5')).toBeInTheDocument(); // beneficiaries registered
    });

    it('shows the totals, not the numbers for the dates asked for', () => {
      mockUseAchievementSummary.mockReturnValue(
        loaded(
          summary({
            doctorVisitsInRange: 9,
            doctorVisitsCompletedTotal: 166,
            beneficiariesRegisteredInRange: 8,
            beneficiariesRegisteredTotal: 729,
          })
        )
      );
      renderComponent();
      expect(screen.getByText('166')).toBeInTheDocument();
      expect(screen.getByText('729')).toBeInTheDocument();
      expect(screen.queryByText('9')).not.toBeInTheDocument();
      expect(screen.queryByText('8')).not.toBeInTheDocument();
    });

    it('does not show the pending-visits number, which stays in the response', () => {
      mockUseAchievementSummary.mockReturnValue(
        loaded(
          summary({
            visitsPendingFromDoctor: 543,
          })
        )
      );
      renderComponent();
      expect(screen.queryByText('543')).not.toBeInTheDocument();
      expect(
        screen.queryByText('Visits Pending from Doctor')
      ).not.toBeInTheDocument();
    });

    it('shows a dash for a total the portal did not send', () => {
      mockUseAchievementSummary.mockReturnValue(
        loaded(
          summary({
            doctorVisitsCompletedTotal: null,
            beneficiariesRegisteredTotal: null,
          })
        )
      );
      renderComponent();
      expect(screen.getAllByText('—').length).toBe(2);
    });

    it('shows zero as 0, not as a dash', () => {
      mockUseAchievementSummary.mockReturnValue(
        loaded(
          summary({
            doctorVisitsCompletedTotal: 0,
            beneficiariesRegisteredTotal: 0,
          })
        )
      );
      renderComponent();
      expect(screen.getAllByText('0').length).toBe(2);
    });

    it('shows the time spent as hours and minutes', () => {
      renderComponent();
      expect(screen.getByText('1h 31m')).toBeInTheDocument();
    });

    it('shows time under an hour as minutes only', () => {
      mockUseAchievementSummary.mockReturnValue(
        loaded(summary({ timeSpentSecondsInRange: 0 }))
      );
      renderComponent();
      expect(screen.getByText('0m')).toBeInTheDocument();
    });

    it('shows the status', () => {
      renderComponent();
      expect(screen.getByText('Active')).toBeInTheDocument();
    });
  });

  describe('colours', () => {
    it('colours Active green', () => {
      renderComponent();
      expect(screen.getByText('Active')).toHaveClass('text-green-500');
    });

    it('colours the status green even when the portal says Inactive', () => {
      mockUseAchievementSummary.mockReturnValue(
        loaded(summary({ status: 'Inactive' }))
      );
      renderComponent();
      expect(screen.getByText('Active')).toHaveClass('text-green-500');
      expect(screen.queryByText('Inactive')).not.toBeInTheDocument();
    });

    it('keeps the red colour on the doctor visits and beneficiary numbers', () => {
      renderComponent();
      expect(screen.getByText('3')).toHaveClass('text-red-500');
      expect(screen.getByText('5')).toHaveClass('text-red-500');
    });

    it('shows no dash when every shown value is there', () => {
      renderComponent();
      expect(screen.queryByText('—')).not.toBeInTheDocument();
    });

    it('never colours a dash like a result', () => {
      mockUseAchievementSummary.mockReturnValue({
        data: null,
        loading: false,
        error: true,
      });
      const { container } = renderComponent();
      expect(container.querySelectorAll('.text-red-500').length).toBe(0);
      // only the status, which does not depend on the answer, keeps its colour
      expect(container.querySelectorAll('.text-green-500').length).toBe(1);
      expect(screen.getByText('Active')).toHaveClass('text-green-500');
    });
  });

  describe('loading and errors', () => {
    it('shows a placeholder on every card but the status while the first answer is on its way', () => {
      mockUseAchievementSummary.mockReturnValue({
        data: null,
        loading: true,
        error: false,
      });
      renderComponent();
      expect(screen.getAllByText('...').length).toBe(
        achievementsData.length - 1
      );
    });

    it('marks the list as busy while loading', () => {
      mockUseAchievementSummary.mockReturnValue({
        data: null,
        loading: true,
        error: false,
      });
      const { container } = renderComponent();
      expect(container.querySelector('[aria-busy="true"]')).toBeInTheDocument();
    });

    it('is not busy once the data is there', () => {
      const { container } = renderComponent();
      expect(
        container.querySelector('[aria-busy="true"]')
      ).not.toBeInTheDocument();
    });

    it('shows a dash on every card but the status, not zeros, when the first load failed', () => {
      mockUseAchievementSummary.mockReturnValue({
        data: null,
        loading: false,
        error: true,
      });
      renderComponent();
      expect(screen.getAllByText('—').length).toBe(achievementsData.length - 1);
      expect(screen.queryByText('0')).not.toBeInTheDocument();
    });

    it('keeps showing the last values when a refresh fails', () => {
      mockUseAchievementSummary.mockReturnValue({
        data: summary(),
        loading: false,
        error: true,
      });
      renderComponent();
      expect(screen.getByText('3')).toBeInTheDocument();
      expect(screen.getByText('1h 31m')).toBeInTheDocument();
    });
  });

  describe('the status', () => {
    it('is Active from the first render, before the portal has answered', () => {
      mockUseAchievementSummary.mockReturnValue({
        data: null,
        loading: true,
        error: false,
      });
      renderComponent();

      expect(screen.getByText('Active')).toBeInTheDocument();
    });

    it('is Active when the first load failed', () => {
      mockUseAchievementSummary.mockReturnValue({
        data: null,
        loading: false,
        error: true,
      });
      renderComponent();

      expect(screen.getByText('Active')).toBeInTheDocument();
    });

    it.each(['Inactive', null] as const)(
      'is Active when the portal says %s and nothing is waiting',
      status => {
        mockUseAchievementSummary.mockReturnValue(loaded(summary({ status })));
        renderComponent();

        expect(screen.getByText('Active')).toBeInTheDocument();
        expect(screen.queryByText('Inactive')).not.toBeInTheDocument();
      }
    );
  });

  describe('working time that has not reached the server yet', () => {
    it('adds it to the time spent, so the card keeps counting between heartbeats', () => {
      mockUnsentSeconds.mockReturnValue(600);
      renderComponent();

      expect(screen.getByText(formatDuration(5460 + 600))).toBeInTheDocument();
      expect(screen.queryByText(formatDuration(5460))).not.toBeInTheDocument();
    });

    it('shows the server time as it is when nothing is waiting', () => {
      renderComponent();

      expect(screen.getByText(formatDuration(5460))).toBeInTheDocument();
    });

    it('asks for the waiting time of the dates the numbers are for', () => {
      renderComponent();

      expect(mockUnsentArgs).toHaveBeenLastCalledWith('2026-10-27', '2026-10-27');
    });

    it('shows time of a first day even when the server has none yet', () => {
      mockUseAchievementSummary.mockReturnValue(
        loaded(summary({ timeSpentSecondsInRange: 0, status: 'Inactive' }))
      );
      mockUnsentSeconds.mockReturnValue(300);
      renderComponent();

      expect(screen.getByText(formatDuration(300))).toBeInTheDocument();
    });


    it('does not show a time when the server sent none, whatever is waiting', () => {
      mockUseAchievementSummary.mockReturnValue(
        loaded(summary({ timeSpentSecondsInRange: null }))
      );
      mockUnsentSeconds.mockReturnValue(600);
      renderComponent();

      expect(screen.queryByText(formatDuration(600))).not.toBeInTheDocument();
    });

    it('does not change the other cards', () => {
      mockUnsentSeconds.mockReturnValue(600);
      renderComponent();

      expect(screen.getByText('3')).toBeInTheDocument(); // doctor visits (total)
      expect(screen.getByText('5')).toBeInTheDocument(); // beneficiaries (total)
    });
  });

  describe('right after a reload, before the summary has arrived', () => {
    const rememberServerTotal = (seconds: number | null) => {
      const records: Record<string, string> = {
        user: JSON.stringify({ uuid: 'user-1' }),
      };
      if (seconds !== null)
        records[serverKey('user-1')] = JSON.stringify({
          userId: 'user-1',
          date: istDate(Date.now()),
          seconds,
        });
      vi.mocked(window.localStorage.getItem).mockImplementation(
        key => records[key] ?? null
      );
    };

    beforeEach(() => {
      mockUseAchievementSummary.mockReturnValue({
        data: null,
        loading: true,
        error: false,
      });
    });

    afterEach(() => {
      vi.mocked(window.localStorage.getItem).mockReset();
    });

    it('shows the total the server last gave for today, with what is waiting, Active, and a placeholder on the rest', () => {
      rememberServerTotal(5460);
      mockUnsentSeconds.mockReturnValue(600);
      renderComponent();

      expect(screen.getByText(formatDuration(5460 + 600))).toBeInTheDocument();
      expect(screen.getByText('Active')).toBeInTheDocument();
      expect(screen.getAllByText('...').length).toBe(
        achievementsData.length - 2
      );
    });

    it('shows a placeholder for the time too when the server has not given a total today', () => {
      rememberServerTotal(null);
      renderComponent();

      expect(screen.getAllByText('...').length).toBe(
        achievementsData.length - 1
      );
    });
  });

  describe('a card with no colour of its own', () => {
    it('is coloured like the default, not like a result of its own', () => {
      const item = achievementsData[0];
      const own = item.valueColor;
      delete item.valueColor;
      try {
        const { container } = renderComponent();

        expect(container.querySelectorAll('.text-gray-800').length).toBe(1);
      } finally {
        item.valueColor = own;
      }
    });
  });
});
