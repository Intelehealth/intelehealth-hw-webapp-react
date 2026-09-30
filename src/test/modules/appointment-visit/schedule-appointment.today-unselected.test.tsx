import { fireEvent, render, screen } from '@testing-library/react';
import { afterAll, describe, expect, it, vi } from 'vitest';

/**
 * The component captures "today" once, when its module is first evaluated, so
 * the clock has to be pinned before the import below. Mid-month (15 Jan 2026)
 * guarantees several selectable dates regardless of when the suite runs.
 */
vi.useFakeTimers({ now: new Date(2026, 0, 15, 0, 0, 0) });

vi.mock('react-router-dom', () => ({
  useNavigate: () => vi.fn(),
  useParams: () => ({ visitUuid: 'test-visit-uuid' }),
  useLocation: () => ({ state: { speciality: 'General Physician' } }),
}));

vi.mock('../../../components/modal/global-modal-context', () => ({
  useGlobalModal: () => ({ showConfirmModal: vi.fn() }),
}));

vi.mock('../../../context/ProfileContext', () => ({
  useProfileContext: () => ({ hwProfile: null }),
}));

vi.mock('../../../hooks/useAppointmentSlots', () => ({
  useAppointmentSlots: () => ({ data: [], loading: false, error: null }),
}));

const { default: AppointmentScheduleComponent } = await import(
  '../../../modules/appointment-visit/schedule-appointment.component'
);

afterAll(() => {
  vi.useRealTimers();
});

const getDateButtons = () =>
  Array.from(
    document.querySelectorAll<HTMLButtonElement>('.flex.gap-\\[8px\\] button')
  );

const labelOf = (button: HTMLButtonElement) =>
  button.querySelectorAll('div')[1] as HTMLDivElement;

describe('AppointmentScheduleComponent - today label styling', () => {
  it('does not emphasise "Today" while it is the selected date', () => {
    render(<AppointmentScheduleComponent />);

    const [todayButton] = getDateButtons();
    expect(labelOf(todayButton)).toHaveTextContent('Today');
    expect(labelOf(todayButton).className).not.toContain('font-medium');
  });

  it('emphasises "Today" once another date is selected', () => {
    render(<AppointmentScheduleComponent />);

    const buttons = getDateButtons();
    fireEvent.click(buttons[1]);

    const [todayButton, otherButton] = getDateButtons();
    expect(screen.getByText('Today')).toBeInTheDocument();
    expect(labelOf(todayButton).className).toContain('font-medium');
    expect(labelOf(otherButton).className).not.toContain('font-medium');
  });

  it('drops the emphasis again when "Today" is re-selected', () => {
    render(<AppointmentScheduleComponent />);

    fireEvent.click(getDateButtons()[1]);
    fireEvent.click(getDateButtons()[0]);

    expect(labelOf(getDateButtons()[0]).className).not.toContain('font-medium');
  });
});
