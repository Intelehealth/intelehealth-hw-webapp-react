import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import SideMenu from '../../../components/side-menu/side-menu.component';

// Mock window.innerWidth
const mockInnerWidth = vi.fn();
Object.defineProperty(window, 'innerWidth', {
  value: mockInnerWidth,
  writable: true,
});

describe('SideMenu', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockInnerWidth.mockReturnValue(1024); // Desktop width
  });

  it('should render without crashing', () => {
    expect(() => {
      render(<SideMenu />);
    }).not.toThrow();
  });

  it('should render the main container with correct classes', () => {
    const { container } = render(<SideMenu />);
    
    const mainContainer = container.querySelector('div');
    expect(mainContainer).toHaveClass('flex', 'h-screen', 'bg-gray-100');
  });

  it('should render the sidebar with correct classes', () => {
    const { container } = render(<SideMenu />);
    
    const sidebar = container.querySelector('aside');
    expect(sidebar).toHaveClass('fixed', 'md:static', 'top-0', 'left-0', 'h-full', 'bg-(--color-main-bg)', 'shadow-lg', 'transform', 'transition-all', 'duration-300', 'z-50', 'p-2');
  });

  it('should render the logo in header', () => {
    render(<SideMenu />);
    
    const logo = screen.getByAltText('hero');
    expect(logo).toBeInTheDocument();
    expect(logo).toHaveClass('h-[74px]', 'object-contain');
  });

  it('should render all menu items', () => {
    render(<SideMenu />);
    
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Appointments')).toBeInTheDocument();
    expect(screen.getByText('Prescriptions')).toBeInTheDocument();
    expect(screen.getByText('Patients')).toBeInTheDocument();
    expect(screen.getByText('Settings')).toBeInTheDocument();
  });

  it('should render menu items with correct icons', () => {
    render(<SideMenu />);
    
    const dashboardIcon = screen.getByText('Dashboard').closest('a')?.querySelector('.fa-home');
    const appointmentsIcon = screen.getByText('Appointments').closest('a')?.querySelector('.fa-calendar-check');
    const prescriptionsIcon = screen.getByText('Prescriptions').closest('a')?.querySelector('.fa-file-medical');
    const patientsIcon = screen.getByText('Patients').closest('a')?.querySelector('.fa-users');
    const settingsIcon = screen.getByText('Settings').closest('a')?.querySelector('.fa-gear');
    
    expect(dashboardIcon).toBeInTheDocument();
    expect(appointmentsIcon).toBeInTheDocument();
    expect(prescriptionsIcon).toBeInTheDocument();
    expect(patientsIcon).toBeInTheDocument();
    expect(settingsIcon).toBeInTheDocument();
  });

  it('should render menu items with correct classes', () => {
    render(<SideMenu />);
    
    const dashboardLink = screen.getByText('Dashboard').closest('a');
    expect(dashboardLink).toHaveClass('flex', 'items-center', 'gap-3', 'p-2', 'rounded-lg', 'hover:bg-(--color-primary-dark)', 'transition');
  });

  it('should render toggle button for collapsing', () => {
    render(<SideMenu />);
    
    const toggleButton = screen.getAllByRole('button')[1]; // Second button is the toggle
    expect(toggleButton).toBeInTheDocument();
    expect(toggleButton).toHaveClass('absolute', 'top-13', 'right-0', 'bg-white', 'border', 'border-(--color-primary)', 'shadow', 'rounded-full', 'w-6', 'h-6', 'flex', 'items-center', 'justify-center', 'z-50', 'hover:bg-gray-100', 'transition');
  });

  it('should toggle collapsed state when toggle button is clicked', () => {
    render(<SideMenu />);
    
    const toggleButton = screen.getAllByRole('button')[1]; // Second button is the toggle
    const sidebar = screen.getByRole('complementary');
    
    // Initially not collapsed
    expect(sidebar).not.toHaveClass('md:w-25');
    
    // Click toggle button
    fireEvent.click(toggleButton);
    
    // Should be collapsed
    expect(sidebar).toHaveClass('md:w-25');
  });

  it('should show mobile toggle button on mobile screens', () => {
    mockInnerWidth.mockReturnValue(500); // Mobile width
    render(<SideMenu />);
    
    const mobileToggleButton = screen.getAllByRole('button')[0]; // First button is mobile toggle
    expect(mobileToggleButton).toBeInTheDocument();
    expect(mobileToggleButton).toHaveClass('md:hidden', 'fixed', 'top-4', 'left-4', 'z-50', 'bg-white', 'rounded-full', 'shadow', 'w-10', 'h-10', 'flex', 'items-center', 'justify-center');
  });

  it('should show overlay on mobile when menu is open', () => {
    mockInnerWidth.mockReturnValue(500); // Mobile width
    render(<SideMenu />);
    
    const mobileToggleButton = screen.getAllByRole('button')[0]; // First button is mobile toggle
    fireEvent.click(mobileToggleButton);
    
    const overlay = document.querySelector('.fixed.inset-0.bg-black\\/30.z-40.md\\:hidden');
    expect(overlay).toBeInTheDocument();
  });

  it('should render children content in main section', () => {
    const TestChild = () => <div data-testid="test-child">Test Child</div>;
    
    render(
      <SideMenu>
        <TestChild />
      </SideMenu>
    );
    
    expect(screen.getByTestId('test-child')).toBeInTheDocument();
  });

  it('should have proper structure with header, navigation, and main content', () => {
    render(<SideMenu />);
    
    const sidebar = screen.getByRole('complementary');
    const header = sidebar.querySelector('div:first-child');
    const navigation = sidebar.querySelector('nav');
    
    expect(header).toBeInTheDocument();
    expect(navigation).toBeInTheDocument();
  });

  it('should render menu items with correct icon classes', () => {
    render(<SideMenu />);
    
    const dashboardIcon = screen.getByText('Dashboard').closest('a')?.querySelector('i');
    expect(dashboardIcon).toHaveClass('fa-solid', 'fa-home', 'text-white', 'text-lg');
  });

  it('should handle mobile menu toggle correctly', () => {
    mockInnerWidth.mockReturnValue(500); // Mobile width
    render(<SideMenu />);
    
    const mobileToggleButton = screen.getAllByRole('button')[0]; // First button is mobile toggle
    const sidebar = screen.getByRole('complementary');
    
    // Initially hidden on mobile
    expect(sidebar).toHaveClass('-translate-x-full', 'md:translate-x-0');
    
    // Click to open
    fireEvent.click(mobileToggleButton);
    
    // Should be visible
    expect(sidebar).toHaveClass('translate-x-0');
  });

  it('should render all menu items with consistent structure', () => {
    render(<SideMenu />);
    
    const menuItems = screen.getAllByRole('link');
    expect(menuItems).toHaveLength(5);
    
    menuItems.forEach(link => {
      expect(link).toHaveClass('flex', 'items-center', 'gap-3', 'p-2', 'rounded-lg', 'hover:bg-(--color-primary-dark)', 'transition');
      expect(link.querySelector('i')).toBeInTheDocument();
      expect(link.querySelector('span')).toBeInTheDocument();
    });
  });
});
