import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../../modules/help-and-support/help-and-support', () => ({
  default: vi.fn(({ children, headerRight }: any) => (
    <div data-testid="help-layout">
      {headerRight && <div data-testid="header-right">{headerRight}</div>}
      {children}
    </div>
  )),
}));

vi.mock('../../../modules/help-and-support/help-search', () => ({
  HelpSearchHeader: vi.fn(({ placeholder }: any) => (
    <div data-testid="search-header">{placeholder}</div>
  )),
}));

vi.mock('../../../modules/help-and-support/help-video', () => ({
  default: vi.fn(({ showAll }: any) => (
    <div data-testid="help-video" data-show-all={showAll?.toString()}>
      HelpVideo
    </div>
  )),
}));

import { BreadcrumbProvider } from '../../../context/BreadcrumbContext';
import HelpVideoPage from '../../../pages/help-and-support/help-video.page';

describe('HelpVideoPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render without crashing', () => {
    render(<BreadcrumbProvider><HelpVideoPage /></BreadcrumbProvider>);
    expect(screen.getByTestId('help-layout')).toBeInTheDocument();
  });

  it('should render HelpAndSupportComponent layout', () => {
    render(<BreadcrumbProvider><HelpVideoPage /></BreadcrumbProvider>);
    expect(screen.getByTestId('help-layout')).toBeInTheDocument();
  });

  it('should render HelpSearchHeader with video placeholder', () => {
    render(<BreadcrumbProvider><HelpVideoPage /></BreadcrumbProvider>);
    expect(screen.getByTestId('search-header')).toBeInTheDocument();
    expect(screen.getByText('Search for videos')).toBeInTheDocument();
  });

  it('should render HelpVideo with showAll prop', () => {
    render(<BreadcrumbProvider><HelpVideoPage /></BreadcrumbProvider>);
    const helpVideo = screen.getByTestId('help-video');
    expect(helpVideo).toBeInTheDocument();
    expect(helpVideo).toHaveAttribute('data-show-all', 'true');
  });

  it('should export HelpVideoPage as default', () => {
    expect(HelpVideoPage).toBeDefined();
    expect(typeof HelpVideoPage).toBe('function');
  });
});
