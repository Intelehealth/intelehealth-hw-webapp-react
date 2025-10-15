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

  it('should render the down menu container', () => {
    const { container } = render(
      <MemoryRouter>
        <DownMenu />
      </MemoryRouter>
    );
    
    const menuContainer = container.querySelector('div');
    expect(menuContainer).toHaveClass('flex', 'justify-around', 'p-3');
  });

  it('should render all navigation links', () => {
    render(
      <MemoryRouter>
        <DownMenu />
      </MemoryRouter>
    );
    
    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.getByText('Appointments')).toBeInTheDocument();
    expect(screen.getByText('Prescriptions')).toBeInTheDocument();
    expect(screen.getByText('Patients')).toBeInTheDocument();
  });

  it('should have correct link destinations', () => {
    render(
      <MemoryRouter>
        <DownMenu />
      </MemoryRouter>
    );
    
    const homeLink = screen.getByText('Home').closest('a');
    const appointmentsLink = screen.getByText('Appointments').closest('a');
    const prescriptionsLink = screen.getByText('Prescriptions').closest('a');
    const patientsLink = screen.getByText('Patients').closest('a');
    
    expect(homeLink).toHaveAttribute('href', '/');
    expect(appointmentsLink).toHaveAttribute('href', '/appointments');
    expect(prescriptionsLink).toHaveAttribute('href', '/prescriptions');
    expect(patientsLink).toHaveAttribute('href', '/patients');
  });

  it('should render icons for each menu item', () => {
    render(
      <MemoryRouter>
        <DownMenu />
      </MemoryRouter>
    );
    
    const homeIcon = screen.getByText('Home').closest('a')?.querySelector('.fas.fa-home');
    const appointmentsIcon = screen.getByText('Appointments').closest('a')?.querySelector('.fas.fa-calendar-alt');
    const prescriptionsIcon = screen.getByText('Prescriptions').closest('a')?.querySelector('.fas.fa-file-medical');
    const patientsIcon = screen.getByText('Patients').closest('a')?.querySelector('.fas.fa-users');
    
    expect(homeIcon).toBeInTheDocument();
    expect(appointmentsIcon).toBeInTheDocument();
    expect(prescriptionsIcon).toBeInTheDocument();
    expect(patientsIcon).toBeInTheDocument();
  });

  it('should have correct CSS classes for menu items', () => {
    render(
      <MemoryRouter>
        <DownMenu />
      </MemoryRouter>
    );
    
    const homeLink = screen.getByText('Home').closest('a');
    const appointmentsLink = screen.getByText('Appointments').closest('a');
    const prescriptionsLink = screen.getByText('Prescriptions').closest('a');
    const patientsLink = screen.getByText('Patients').closest('a');
    
    expect(homeLink).toHaveClass('flex', 'flex-col', 'items-center', 'space-y-1');
    expect(appointmentsLink).toHaveClass('flex', 'flex-col', 'items-center', 'space-y-1');
    expect(prescriptionsLink).toHaveClass('flex', 'flex-col', 'items-center', 'space-y-1');
    expect(patientsLink).toHaveClass('flex', 'flex-col', 'items-center', 'space-y-1');
  });

  it('should have proper link structure with icons and text', () => {
    render(
      <MemoryRouter>
        <DownMenu />
      </MemoryRouter>
    );
    
    const homeLink = screen.getByText('Home').closest('a');
    const homeIcon = homeLink?.querySelector('i');
    const homeText = homeLink?.querySelector('span');
    
    expect(homeIcon).toHaveClass('fas', 'fa-home');
    expect(homeText).toHaveTextContent('Home');
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
      expect(link).toHaveClass('flex', 'flex-col', 'items-center', 'space-y-1');
      expect(link.querySelector('i')).toBeInTheDocument();
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
});
