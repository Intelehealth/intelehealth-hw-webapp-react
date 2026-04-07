import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import AchievementUiPage from '../../../pages/achievement-ui/achievement-ui.page';

vi.mock('../../../modules/achievement-ui/achievement-ui.component', () => ({
  AchievementUiComponent: vi.fn(() => (
    <div data-testid="achievement-ui-component">Achievement UI Component</div>
  )),
}));

describe('AchievementUiPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render without crashing', () => {
    render(<AchievementUiPage />);
    expect(screen.getByTestId('achievement-ui-component')).toBeInTheDocument();
  });

  it('should render AchievementUiComponent', () => {
    render(<AchievementUiPage />);
    expect(screen.getByText('Achievement UI Component')).toBeInTheDocument();
  });

  it('should export AchievementUiPage as default', () => {
    expect(AchievementUiPage).toBeDefined();
    expect(typeof AchievementUiPage).toBe('function');
  });
});
