import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import DownMenu from '../../../components/down-menu/down-menu.component';

describe('DownMenu', () => {
  it('should render without crashing', () => {
    expect(() => {
      render(
        <MemoryRouter>
          <DownMenu />
        </MemoryRouter>
      );
    }).not.toThrow();
  });

  it('should render the down menu container with correct classes', () => {
    const { container } = render(
      <MemoryRouter>
        <DownMenu />
      </MemoryRouter>
    );
    
    const menuContainer = container.querySelector('div');
    expect(menuContainer).toHaveClass('flex', 'justify-around', 'p-3', 'shodow', 'rounded-t-lg', 'bg-white');
  });

  it('should render all navigation links', () => {
    render(
      <MemoryRouter>
        <DownMenu />
      </MemoryRouter>
    );
    
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Achievements')).toBeInTheDocument();
    expect(screen.getByText('Help & Support')).toBeInTheDocument();
    expect(screen.getByText('Add Patient')).toBeInTheDocument();
  });

  it('should have correct link destinations', () => {
    render(
      <MemoryRouter>
        <DownMenu />
      </MemoryRouter>
    );
    
    const dashboardLink = screen.getByText('Dashboard').closest('a');
    const achievementsLink = screen.getByText('Achievements').closest('a');
    const helpLink = screen.getByText('Help & Support').closest('a');
    const addPatientLink = screen.getByText('Add Patient').closest('a');
    
    expect(dashboardLink).toHaveAttribute('href', '/dashboard');
    expect(achievementsLink).toHaveAttribute('href', '/achievements');
    expect(helpLink).toHaveAttribute('href', '/help');
    expect(addPatientLink).toHaveAttribute('href', '/add-patient');
  });

  it('should render icons for each menu item', () => {
    render(
      <MemoryRouter>
        <DownMenu />
      </MemoryRouter>
    );
    
    const dashboardIcon = screen.getByText('Dashboard').closest('a')?.querySelector('img');
    const achievementsIcon = screen.getByText('Achievements').closest('a')?.querySelector('img');
    const helpIcon = screen.getByText('Help & Support').closest('a')?.querySelector('img');
    const addPatientIcon = screen.getByText('Add Patient').closest('a')?.querySelector('img');
    
    expect(dashboardIcon).toBeInTheDocument();
    expect(achievementsIcon).toBeInTheDocument();
    expect(helpIcon).toBeInTheDocument();
    expect(addPatientIcon).toBeInTheDocument();
  });

  it('should have correct CSS classes for menu items', () => {
    render(
      <MemoryRouter>
        <DownMenu />
      </MemoryRouter>
    );
    
    const dashboardLink = screen.getByText('Dashboard').closest('a');
    const achievementsLink = screen.getByText('Achievements').closest('a');
    const helpLink = screen.getByText('Help & Support').closest('a');
    const addPatientLink = screen.getByText('Add Patient').closest('a');
    
    expect(dashboardLink).toHaveClass('flex', 'flex-col', 'items-center', 'space-y-1', 'p-2', 'rounded-lg', 'min-h-[50px]');
    expect(achievementsLink).toHaveClass('flex', 'flex-col', 'items-center', 'space-y-1', 'p-2', 'rounded-lg', 'min-h-[50px]');
    expect(helpLink).toHaveClass('flex', 'flex-col', 'items-center', 'space-y-1', 'p-2', 'rounded-lg', 'min-h-[50px]');
    expect(addPatientLink).toHaveClass('flex', 'flex-col', 'items-center', 'space-y-1', 'p-2', 'rounded-lg', 'min-h-[50px]');
  });

  it('should have proper link structure with icons and text', () => {
    render(
      <MemoryRouter>
        <DownMenu />
      </MemoryRouter>
    );
    
    const dashboardLink = screen.getByText('Dashboard').closest('a');
    const dashboardIcon = dashboardLink?.querySelector('img');
    const dashboardText = dashboardLink?.querySelector('span');
    
    expect(dashboardIcon).toHaveClass('w-6', 'h-6', 'text-black');
    expect(dashboardText).toHaveTextContent('Dashboard');
  });

  it('should render all menu items with consistent structure', () => {
    render(
      <MemoryRouter>
        <DownMenu />
      </MemoryRouter>
    );
    
    const menuItems = screen.getAllByRole('link');
    expect(menuItems).toHaveLength(4);
    
    menuItems.forEach(link => {
      expect(link).toHaveClass('flex', 'flex-col', 'items-center', 'space-y-1', 'p-2', 'rounded-lg', 'min-h-[50px]');
      expect(link.querySelector('img')).toBeInTheDocument();
      expect(link.querySelector('span')).toBeInTheDocument();
    });
  });

  it('should have proper accessibility attributes', () => {
    render(
      <MemoryRouter>
        <DownMenu />
      </MemoryRouter>
    );
    
    const links = screen.getAllByRole('link');
    links.forEach(link => {
      expect(link).toHaveAttribute('href');
    });
  });

  it('should maintain proper layout with flex justify-around', () => {
    const { container } = render(
      <MemoryRouter>
        <DownMenu />
      </MemoryRouter>
    );
    
    const menuContainer = container.querySelector('div');
    expect(menuContainer).toHaveClass('flex', 'justify-around', 'p-3');
  });

  it('should apply active link styling when on dashboard route', () => {
    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <DownMenu />
      </MemoryRouter>
    );
    
    const dashboardLink = screen.getByText('Dashboard').closest('a');
    const dashboardIcon = dashboardLink?.querySelector('img');
    const dashboardText = dashboardLink?.querySelector('span');
    
    // Check if active styling is applied
    expect(dashboardText).toHaveClass('text-(--color-primary)');
    expect(dashboardIcon).toHaveStyle({
      filter: 'invert(12%) sepia(81%) saturate(4258%) hue-rotate(249deg) brightness(78%) contrast(99%)'
    });
  });

  it('should apply inactive link styling when not on current route', () => {
    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <DownMenu />
      </MemoryRouter>
    );
    
    const achievementsLink = screen.getByText('Achievements').closest('a');
    const achievementsIcon = achievementsLink?.querySelector('img');
    const achievementsText = achievementsLink?.querySelector('span');
    
    // Check if inactive styling is applied
    expect(achievementsText).toHaveClass('text-(--color-muted)');
    expect(achievementsIcon).toHaveStyle({
      filter: 'filter: invert(73%) sepia(15%) saturate(204%) hue-rotate(210deg) brightness(93%) contrast(92%)'
    });
  });

  it('should apply active link styling when on achievements route', () => {
    render(
      <MemoryRouter initialEntries={['/achievements']}>
        <DownMenu />
      </MemoryRouter>
    );
    
    const achievementsLink = screen.getByText('Achievements').closest('a');
    const achievementsIcon = achievementsLink?.querySelector('img');
    const achievementsText = achievementsLink?.querySelector('span');
    
    // Check if active styling is applied
    expect(achievementsText).toHaveClass('text-(--color-primary)');
    expect(achievementsIcon).toHaveStyle({
      filter: 'invert(12%) sepia(81%) saturate(4258%) hue-rotate(249deg) brightness(78%) contrast(99%)'
    });
  });

  it('should render icons with correct alt text', () => {
    render(
      <MemoryRouter>
        <DownMenu />
      </MemoryRouter>
    );
    
    const dashboardIcon = screen.getByText('Dashboard').closest('a')?.querySelector('img');
    const achievementsIcon = screen.getByText('Achievements').closest('a')?.querySelector('img');
    const helpIcon = screen.getByText('Help & Support').closest('a')?.querySelector('img');
    const addPatientIcon = screen.getByText('Add Patient').closest('a')?.querySelector('img');
    
    expect(dashboardIcon).toHaveAttribute('alt', 'Dashboard');
    expect(achievementsIcon).toHaveAttribute('alt', 'Achievements');
    expect(helpIcon).toHaveAttribute('alt', 'Help & Support');
    expect(addPatientIcon).toHaveAttribute('alt', 'Add Patient');
  });
});
