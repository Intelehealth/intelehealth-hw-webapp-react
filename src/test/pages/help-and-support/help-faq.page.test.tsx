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

vi.mock('../../../modules/help-and-support/help-faq', () => ({
  default: vi.fn(() => <div data-testid="help-faq">HelpFaq</div>),
}));

import { BreadcrumbProvider } from '../../../context/BreadcrumbContext';
import HelpFaqPage from '../../../pages/help-and-support/help-faq.page';

describe('HelpFaqPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render without crashing', () => {
    render(<BreadcrumbProvider><HelpFaqPage /></BreadcrumbProvider>);
    expect(screen.getByTestId('help-layout')).toBeInTheDocument();
  });

  it('should render HelpAndSupportComponent layout', () => {
    render(<BreadcrumbProvider><HelpFaqPage /></BreadcrumbProvider>);
    expect(screen.getByTestId('help-layout')).toBeInTheDocument();
  });

  it('should render HelpSearchHeader with FAQ placeholder', () => {
    render(<BreadcrumbProvider><HelpFaqPage /></BreadcrumbProvider>);
    expect(screen.getByTestId('search-header')).toBeInTheDocument();
    expect(screen.getByText('Search FAQs')).toBeInTheDocument();
  });

  it('should render HelpFaq component', () => {
    render(<BreadcrumbProvider><HelpFaqPage /></BreadcrumbProvider>);
    expect(screen.getByTestId('help-faq')).toBeInTheDocument();
  });

  it('should export HelpFaqPage as default', () => {
    expect(HelpFaqPage).toBeDefined();
    expect(typeof HelpFaqPage).toBe('function');
  });
});
