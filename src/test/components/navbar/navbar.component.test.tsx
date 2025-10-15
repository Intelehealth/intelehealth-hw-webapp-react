import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import Navbar from '../../../components/navbar/navbar.component';

describe('Navbar', () => {
  it('should render without crashing', () => {
    expect(() => {
      render(<Navbar />);
    }).not.toThrow();
  });

  it('should render the navbar header with correct classes', () => {
    const { container } = render(<Navbar />);
    
    const header = container.querySelector('header');
    expect(header).toHaveClass('bg-white', 'shadow-md', 'flex', 'flex-col', 'justify-between', 'gap-4', 'items-center', 'p-4', 'rounded-lg');
  });

  it('should display the location information', () => {
    render(<Navbar />);
    
    expect(screen.getByText('Ranchi')).toBeInTheDocument();
  });

  it('should display the last sync time', () => {
    render(<Navbar />);
    
    expect(screen.getByText('Last sync: 12:30 pm, 12 May 2022')).toBeInTheDocument();
  });

  it('should render all required icons', () => {
    render(<Navbar />);
    
    // Check for location icon
    const locationIcon = screen.getByAltText('Location');
    expect(locationIcon).toBeInTheDocument();
    expect(locationIcon).toHaveClass('w-6', 'h-6');
    
    // Check for sync icon
    const syncIcon = screen.getByAltText('Sync');
    expect(syncIcon).toBeInTheDocument();
    expect(syncIcon).toHaveClass('w-6', 'h-6');
    
    // Check for notification icon
    const notificationIcon = screen.getByAltText('Notification');
    expect(notificationIcon).toBeInTheDocument();
    expect(notificationIcon).toHaveClass('w-6', 'h-6');
    
    // Check for user avatar
    const userAvatar = screen.getByAltText('Bell');
    expect(userAvatar).toBeInTheDocument();
    expect(userAvatar).toHaveClass('w-10', 'h-10');
  });

  it('should render patient search input on desktop', () => {
    render(<Navbar />);
    
    const searchInputs = screen.getAllByPlaceholderText('Patient Search');
    expect(searchInputs).toHaveLength(2); // Desktop and mobile versions
    expect(searchInputs[0]).toBeInTheDocument();
  });

  it('should render patient search input on mobile', () => {
    render(<Navbar />);
    
    // The mobile search input should also be present
    const searchInputs = screen.getAllByPlaceholderText('Patient Search');
    expect(searchInputs).toHaveLength(2); // Desktop and mobile versions
  });

  it('should have correct structure for desktop layout', () => {
    const { container } = render(<Navbar />);
    
    const desktopSection = container.querySelector('.hidden.md\\:flex');
    expect(desktopSection).toBeInTheDocument();
    expect(desktopSection).toHaveClass('items-center', 'space-x-2', 'w-4/12', 'hidden', 'md:flex');
  });

  it('should have correct structure for mobile layout', () => {
    const { container } = render(<Navbar />);
    
    const mobileSection = container.querySelector('.w-full.md\\:hidden');
    expect(mobileSection).toBeInTheDocument();
    expect(mobileSection).toHaveClass('w-full', 'md:hidden');
  });

  it('should display location with correct styling', () => {
    render(<Navbar />);
    
    const locationText = screen.getByText('Ranchi');
    expect(locationText).toHaveClass('text-(--color-muted)');
  });

  it('should display sync time with correct styling', () => {
    render(<Navbar />);
    
    const syncTime = screen.getByText('Last sync: 12:30 pm, 12 May 2022');
    expect(syncTime).toHaveClass('text-(--color-muted)');
  });

  it('should have proper layout structure with flex justify-between', () => {
    const { container } = render(<Navbar />);
    
    const mainSection = container.querySelector('.flex.justify-between.items-center.w-full.gap-4');
    expect(mainSection).toBeInTheDocument();
  });

  it('should render location section with correct classes', () => {
    const { container } = render(<Navbar />);
    
    const locationSection = container.querySelector('.flex.flex-col.w-8\\/12.md\\:w-6\\/12.pl-12.md\\:pl-4');
    expect(locationSection).toBeInTheDocument();
  });

  it('should render actions section with correct classes', () => {
    const { container } = render(<Navbar />);
    
    const actionsSection = container.querySelector('.flex.items-center.space-x-2.ml-auto.gap-4');
    expect(actionsSection).toBeInTheDocument();
  });

  it('should have proper accessibility attributes for images', () => {
    render(<Navbar />);
    
    const locationIcon = screen.getByAltText('Location');
    const syncIcon = screen.getByAltText('Sync');
    const notificationIcon = screen.getByAltText('Notification');
    const userAvatar = screen.getByAltText('Bell');
    
    expect(locationIcon).toHaveAttribute('alt', 'Location');
    expect(syncIcon).toHaveAttribute('alt', 'Sync');
    expect(notificationIcon).toHaveAttribute('alt', 'Notification');
    expect(userAvatar).toHaveAttribute('alt', 'Bell');
  });

  it('should render search icon in input', () => {
    render(<Navbar />);
    
    const searchIcons = screen.getAllByAltText('search');
    expect(searchIcons).toHaveLength(2); // Desktop and mobile versions
    expect(searchIcons[0]).toBeInTheDocument();
    expect(searchIcons[0]).toHaveClass('w-6', 'h-6');
    expect(searchIcons[1]).toBeInTheDocument();
    expect(searchIcons[1]).toHaveClass('w-6', 'h-6');
  });

  it('should maintain proper responsive layout structure', () => {
    const { container } = render(<Navbar />);
    
    const header = container.querySelector('header');
    const children = header?.children;
    
    expect(children).toHaveLength(2); // Desktop section and mobile section
  });

  it('should have correct gap spacing between elements', () => {
    const { container } = render(<Navbar />);
    
    const mainSection = container.querySelector('.flex.justify-between.items-center.w-full.gap-4');
    expect(mainSection).toHaveClass('gap-4');
    
    const actionsSection = container.querySelector('.flex.items-center.space-x-2.ml-auto.gap-4');
    expect(actionsSection).toHaveClass('gap-4');
  });
});
