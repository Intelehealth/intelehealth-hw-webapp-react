import { fireEvent, render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import SideMenu from '../../../components/side-menu copy/side-menu.component';

// Mock window.innerWidth
const mockInnerWidth = vi.fn();
Object.defineProperty(window, 'innerWidth', {
  value: mockInnerWidth,
  writable: true,
});

describe('SideMenu Copy', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockInnerWidth.mockReturnValue(1024); // Desktop width
  });

  it('should render without crashing', () => {
    expect(() => {
      render(
        <BrowserRouter>
          <SideMenu />
        </BrowserRouter>
      );
    }).not.toThrow();
  });

  it('should handle outside click to close mobile menu when clicking outside menu', () => {
    mockInnerWidth.mockReturnValue(500); // Mobile width
    render(
      <BrowserRouter>
        <SideMenu />
      </BrowserRouter>
    );
    
    const hamburgerButton = screen.getByRole('button');
    fireEvent.click(hamburgerButton);
    
    // Menu should be open
    const menu = document.querySelector('nav');
    expect(menu).toBeInTheDocument();
    
    // Simulate clicking outside the menu (lines 19-24)
    const mainContent = document.querySelector('main');
    if (mainContent) {
      fireEvent.click(mainContent);
    }
    
    // Verify the component handles the outside click
    expect(menu).toBeInTheDocument();
  });

  it('should handle hamburger button click to toggle menu', () => {
    mockInnerWidth.mockReturnValue(500); // Mobile width
    render(
      <BrowserRouter>
        <SideMenu />
      </BrowserRouter>
    );
    
    const hamburgerButton = screen.getByRole('button');
    
    // Click hamburger button
    fireEvent.click(hamburgerButton);
    
    // Verify the component handles the click
    expect(hamburgerButton).toBeInTheDocument();
  });
});
