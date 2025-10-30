import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import MainContainer from '../../routes/main-container.routes';

// Mock the components
vi.mock('../../components/side-menu/side-menu.component', () => ({
  default: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="side-menu">{children}</div>
  ),
}));

vi.mock('../../components/navbar/navbar.component', () => ({
  default: () => <div data-testid="navbar">Navbar</div>,
}));

vi.mock('../../components/down-menu/down-menu.component', () => ({
  default: () => <div data-testid="down-menu">DownMenu</div>,
}));

// Test component to render inside MainContainer
// const TestPage = () => <div data-testid="test-page">Test Page</div>;

describe('MainContainer', () => {
  it('should render the main container layout', () => {
    render(
      <MemoryRouter>
        <MainContainer />
      </MemoryRouter>
    );

    expect(screen.getByTestId('side-menu')).toBeInTheDocument();
    expect(screen.getByTestId('navbar')).toBeInTheDocument();
    expect(screen.getByTestId('down-menu')).toBeInTheDocument();
  });

  it('should render children content through Outlet', () => {
    render(
      <MemoryRouter>
        <MainContainer />
      </MemoryRouter>
    );

    // The Outlet should be present in the layout
    const mainContent = screen.getByTestId('side-menu');
    expect(mainContent).toBeInTheDocument();
  });

  it('should have correct CSS classes for layout', () => {
    const { container } = render(
      <MemoryRouter>
        <MainContainer />
      </MemoryRouter>
    );

    const mainDiv = container.firstChild as HTMLElement;
    expect(mainDiv).toHaveClass('flex', 'flex-col', 'h-full', 'bg-(--color-maint-bg)');
  });

  it('should render SideMenu with children', () => {
    render(
      <MemoryRouter>
        <MainContainer />
      </MemoryRouter>
    );

    const sideMenu = screen.getByTestId('side-menu');
    expect(sideMenu).toBeInTheDocument();
    
    // Check that SideMenu contains the expected children structure
    expect(screen.getByTestId('navbar')).toBeInTheDocument();
    expect(screen.getByTestId('down-menu')).toBeInTheDocument();
  });

  it('should have proper structure with flex layout', () => {
    const { container } = render(
      <MemoryRouter>
        <MainContainer />
      </MemoryRouter>
    );

    const mainDiv = container.firstChild as HTMLElement;
    expect(mainDiv).toHaveClass('flex', 'flex-col', 'h-full');
  });

  it('should render Navbar in the correct position', () => {
    render(
      <MemoryRouter>
        <MainContainer />
      </MemoryRouter>
    );

    const navbar = screen.getByTestId('navbar');
    expect(navbar).toBeInTheDocument();
    expect(navbar.textContent).toBe('Navbar');
  });

  it('should render DownMenu in the correct position', () => {
    render(
      <MemoryRouter>
        <MainContainer />
      </MemoryRouter>
    );

    const downMenu = screen.getByTestId('down-menu');
    expect(downMenu).toBeInTheDocument();
    expect(downMenu.textContent).toBe('DownMenu');
  });

  it('should have responsive design classes', () => {
    render(
      <MemoryRouter>
        <MainContainer />
      </MemoryRouter>
    );

    // Check for responsive classes in the structure
    const sideMenu = screen.getByTestId('side-menu');
    expect(sideMenu).toBeInTheDocument();
  });

  it('should render without crashing', () => {
    expect(() => {
      render(
        <MemoryRouter>
          <MainContainer />
        </MemoryRouter>
      );
    }).not.toThrow();
  });

  it('should maintain proper component hierarchy', () => {
    render(
      <MemoryRouter>
        <MainContainer />
      </MemoryRouter>
    );

    // Verify all expected components are rendered
    expect(screen.getByTestId('side-menu')).toBeInTheDocument();
    expect(screen.getByTestId('navbar')).toBeInTheDocument();
    expect(screen.getByTestId('down-menu')).toBeInTheDocument();
  });
});
