import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { AchievementsComponent } from '../../../modules/dashboard/achievements.component';
import { achievementsData } from '../../../assets/data/achievements.data';

describe('AchievementsComponent', () => {
  const renderComponent = () => render(<AchievementsComponent />);

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

  it('renders all achievement item values', () => {
    renderComponent();
    expect(screen.getByText('0m')).toBeInTheDocument();
    expect(screen.getByText('Active')).toBeInTheDocument();
  });

  it('renders correct number of icons (1 header + 6 items + 6 info)', () => {
    renderComponent();
    const icons = screen.getAllByRole('img');
    expect(icons.length).toBe(13);
  });

  it('renders info indicators for each item', () => {
    renderComponent();
    const infoIcons = screen.getAllByAltText('info');
    expect(infoIcons.length).toBe(achievementsData.length);
  });

  it('applies green color to Status value', () => {
    renderComponent();
    const statusText = screen.getByText('Active');
    expect(statusText).toHaveClass('text-green-500');
  });

  it('applies red valueColor to Doctor Visits', () => {
    const { container } = renderComponent();
    const allValues = container.querySelectorAll('.text-red-500');
    expect(allValues.length).toBeGreaterThan(0);
  });

  it('applies default text-gray-800 when no valueColor', () => {
    const { container } = renderComponent();
    const allDefaults = container.querySelectorAll('.text-gray-800');
    expect(allDefaults.length).toBeGreaterThan(0);
  });
});
