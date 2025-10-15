import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import Navbar from '../../../components/navbar/navbar.component';

describe('Navbar', () => {
  it('should render without crashing', () => {
    expect(() => {
      render(<Navbar />);
    }).not.toThrow();
  });

  it('should render the navbar header', () => {
    render(<Navbar />);
    
    expect(screen.getByRole('banner')).toBeInTheDocument();
  });

  it('should display the Intelehealth brand name', () => {
    render(<Navbar />);
    
    expect(screen.getByText('Intelehealth')).toBeInTheDocument();
  });

  it('should display the last sync time', () => {
    render(<Navbar />);
    
    expect(screen.getByText('Last sync: 12:30 pm, 12 May 2022')).toBeInTheDocument();
  });

  it('should render notification and user icons', () => {
    render(<Navbar />);
    
    // Check for bell icon
    const bellIcon = screen.getByRole('banner').querySelector('.fa-bell');
    expect(bellIcon).toBeInTheDocument();
    
    // Check for user icon
    const userIcon = screen.getByRole('banner').querySelector('.fa-user-circle');
    expect(userIcon).toBeInTheDocument();
  });

  it('should have correct CSS classes for styling', () => {
    const { container } = render(<Navbar />);
    
    const header = container.querySelector('header');
    expect(header).toHaveClass('bg-white', 'shadow-md', 'flex', 'justify-between', 'items-center', 'p-4', 'rounded-lg');
  });

  it('should have proper structure with brand and actions sections', () => {
    render(<Navbar />);
    
    const header = screen.getByRole('banner');
    const brandSection = header.querySelector('div:first-child');
    const actionsSection = header.querySelector('div:last-child');
    
    expect(brandSection).toBeInTheDocument();
    expect(actionsSection).toBeInTheDocument();
  });

  it('should display brand name with correct styling', () => {
    render(<Navbar />);
    
    const brandName = screen.getByText('Intelehealth');
    expect(brandName).toHaveClass('text-xl', 'text-purple-700');
  });

  it('should display sync time with correct styling', () => {
    render(<Navbar />);
    
    const syncTime = screen.getByText('Last sync: 12:30 pm, 12 May 2022');
    expect(syncTime).toHaveClass('text-purple-700');
  });

  it('should have icons with correct styling', () => {
    render(<Navbar />);
    
    const bellIcon = screen.getByRole('banner').querySelector('.fa-bell');
    const userIcon = screen.getByRole('banner').querySelector('.fa-user-circle');
    
    expect(bellIcon).toHaveClass('fa-regular', 'fa-bell', 'text-purple-700');
    expect(userIcon).toHaveClass('fa-regular', 'fa-user-circle', 'text-purple-700');
  });

  it('should maintain proper layout structure', () => {
    const { container } = render(<Navbar />);
    
    const header = container.querySelector('header');
    const children = header?.children;
    
    expect(children).toHaveLength(2); // Brand section and actions section
  });
});
