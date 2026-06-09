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
  default: vi.fn(() => <div data-testid="help-video">HelpVideo</div>),
}));

vi.mock('../../../modules/help-and-support/help-faq', () => ({
  default: vi.fn(() => <div data-testid="help-faq">HelpFaq</div>),
}));

import { BreadcrumbProvider } from '../../../context/BreadcrumbContext';
import HelpAndSupportPage from '../../../pages/help-and-support/help-and-support.page';

describe('HelpAndSupportPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render without crashing', () => {
    render(<BreadcrumbProvider><HelpAndSupportPage /></BreadcrumbProvider>);
    expect(screen.getByTestId('help-layout')).toBeInTheDocument();
  });

  it('should render HelpAndSupportComponent layout', () => {
    render(<BreadcrumbProvider><HelpAndSupportPage /></BreadcrumbProvider>);
    expect(screen.getByTestId('help-layout')).toBeInTheDocument();
  });

  it('should render HelpSearchHeader in headerRight', () => {
    render(<BreadcrumbProvider><HelpAndSupportPage /></BreadcrumbProvider>);
    expect(screen.getByTestId('header-right')).toBeInTheDocument();
    expect(screen.getByTestId('search-header')).toBeInTheDocument();
    expect(screen.getByText('Search for help')).toBeInTheDocument();
  });

  it('should render HelpVideo component', () => {
    render(<BreadcrumbProvider><HelpAndSupportPage /></BreadcrumbProvider>);
    expect(screen.getByTestId('help-video')).toBeInTheDocument();
  });

  it('should render HelpFaq component', () => {
    render(<BreadcrumbProvider><HelpAndSupportPage /></BreadcrumbProvider>);
    expect(screen.getByTestId('help-faq')).toBeInTheDocument();
  });

  it('should export HelpAndSupportPage as default', () => {
    expect(HelpAndSupportPage).toBeDefined();
    expect(typeof HelpAndSupportPage).toBe('function');
  });
});
