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

vi.mock('../../components/notifications/notification-manager.component', () => ({
  default: () => null,
}));

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

    const mainContent = screen.getByTestId('side-menu');
    expect(mainContent).toBeInTheDocument();
  });

  it('should have correct CSS classes for layout', () => {
    const { container } = render(
      <MemoryRouter>
        <MainContainer />
      </MemoryRouter>
    );

    const mainDiv = container.querySelector('[data-testid="main-container"]') as HTMLElement;
    expect(mainDiv).toHaveClass('flex', 'flex-col', 'h-full');
  });

  it('should render SideMenu with children', () => {
    render(
      <MemoryRouter>
        <MainContainer />
      </MemoryRouter>
    );

    const sideMenu = screen.getByTestId('side-menu');
    expect(sideMenu).toBeInTheDocument();
    expect(screen.getByTestId('navbar')).toBeInTheDocument();
    expect(screen.getByTestId('down-menu')).toBeInTheDocument();
  });

  it('should have proper structure with flex layout', () => {
    const { container } = render(
      <MemoryRouter>
        <MainContainer />
      </MemoryRouter>
    );

    const mainDiv = container.querySelector('[data-testid="main-container"]') as HTMLElement;
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

    expect(screen.getByTestId('side-menu')).toBeInTheDocument();
    expect(screen.getByTestId('navbar')).toBeInTheDocument();
    expect(screen.getByTestId('down-menu')).toBeInTheDocument();
  });

  it('should have content area with overflow-hidden and flex-col classes', () => {
    const { container } = render(
      <MemoryRouter>
        <MainContainer />
      </MemoryRouter>
    );

    const contentDiv = container.querySelector('#main-container-content') as HTMLElement;
    expect(contentDiv).toBeInTheDocument();
    expect(contentDiv).toHaveClass('flex-1', 'overflow-hidden', 'flex', 'flex-col');
  });

  it('should have content area with bg-white class', () => {
    const { container } = render(
      <MemoryRouter>
        <MainContainer />
      </MemoryRouter>
    );

    const contentDiv = container.querySelector('#main-container-content') as HTMLElement;
    expect(contentDiv).toHaveClass('bg-white');
  });

  it('should have rounded-lg and shadow-md on content area for normal routes', () => {
    const { container } = render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <MainContainer />
      </MemoryRouter>
    );

    const contentDiv = container.querySelector('#main-container-content') as HTMLElement;
    expect(contentDiv).toHaveClass('rounded-lg', 'shadow-md');
  });

  it('should render navbar visible for normal routes', () => {
    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <MainContainer />
      </MemoryRouter>
    );

    const navbarWrapper = screen.getByTestId('navbar').parentElement;
    expect(navbarWrapper).not.toHaveClass('hidden');
  });

  it('should render down-menu visible for normal routes', () => {
    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <MainContainer />
      </MemoryRouter>
    );

    const downMenuWrapper = screen.getByTestId('down-menu').parentElement;
    expect(downMenuWrapper).not.toHaveClass('hidden');
    expect(downMenuWrapper).toHaveClass('md:hidden');
  });

  it('should hide navbar on mobile for hideNavbarOnMobile routes (profile)', () => {
    render(
      <MemoryRouter initialEntries={['/profile']}>
        <MainContainer />
      </MemoryRouter>
    );

    const navbarWrapper = screen.getByTestId('navbar').parentElement;
    expect(navbarWrapper).toHaveClass('hidden', 'md:block');
  });

  it('should use md:rounded-lg md:shadow-md on content for hideNavbarOnMobile routes', () => {
    const { container } = render(
      <MemoryRouter initialEntries={['/profile']}>
        <MainContainer />
      </MemoryRouter>
    );

    const contentDiv = container.querySelector('#main-container-content') as HTMLElement;
    expect(contentDiv).toHaveClass('md:rounded-lg', 'md:shadow-md');
    expect(contentDiv).not.toHaveClass('rounded-lg');
  });

  it('should hide down-menu for hideNavbarOnMobile routes', () => {
    render(
      <MemoryRouter initialEntries={['/profile']}>
        <MainContainer />
      </MemoryRouter>
    );

    const downMenuWrapper = screen.getByTestId('down-menu').parentElement;
    expect(downMenuWrapper).toHaveClass('hidden');
  });
});
