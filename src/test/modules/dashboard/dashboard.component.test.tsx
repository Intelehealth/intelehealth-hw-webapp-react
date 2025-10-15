import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import DashboardComponent from '../../../modules/dashboard/dashboard.component';

describe('DashboardComponent', () => {
  it('should render without crashing', () => {
    expect(() => {
      render(<DashboardComponent />);
    }).not.toThrow();
  });

  it('should render the dashboard title', () => {
    render(<DashboardComponent />);
    
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
  });

  it('should render with default props', () => {
    render(<DashboardComponent />);
    
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.queryByText(/message/)).not.toBeInTheDocument();
  });

  it('should render message when provided', () => {
    const message = 'Welcome to the dashboard!';
    render(<DashboardComponent message={message} />);
    
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText(message)).toBeInTheDocument();
  });

  it('should not render message when not provided', () => {
    render(<DashboardComponent />);
    
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.queryByText(/Welcome/)).not.toBeInTheDocument();
  });

  it('should render with empty message', () => {
    render(<DashboardComponent message="" />);
    
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.queryByText(/Welcome/)).not.toBeInTheDocument();
  });

  it('should render with different message content', () => {
    const message = 'This is a test message';
    render(<DashboardComponent message={message} />);
    
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText(message)).toBeInTheDocument();
  });

  it('should have correct structure', () => {
    const { container } = render(<DashboardComponent message="Test message" />);
    
    const div = container.querySelector('div');
    expect(div).toBeInTheDocument();
    
    const h1 = div?.querySelector('h1');
    expect(h1).toBeInTheDocument();
    expect(h1).toHaveTextContent('Dashboard');
    
    const p = div?.querySelector('p');
    expect(p).toBeInTheDocument();
    expect(p).toHaveTextContent('Test message');
  });

  it('should handle undefined message prop', () => {
    render(<DashboardComponent message={undefined} />);
    
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.queryByText(/Test/)).not.toBeInTheDocument();
  });

  it('should handle null message prop', () => {
    render(<DashboardComponent message={null as unknown as string} />);
    
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.queryByText(/Test/)).not.toBeInTheDocument();
  });

  it('should render multiple instances correctly', () => {
    render(
      <div>
        <DashboardComponent message="First dashboard" />
        <DashboardComponent message="Second dashboard" />
      </div>
    );
    
    const dashboards = screen.getAllByText('Dashboard');
    expect(dashboards).toHaveLength(2);
    
    expect(screen.getByText('First dashboard')).toBeInTheDocument();
    expect(screen.getByText('Second dashboard')).toBeInTheDocument();
  });

  it('should be accessible', () => {
    render(<DashboardComponent message="Accessible dashboard" />);
    
    const heading = screen.getByRole('heading', { level: 1 });
    expect(heading).toBeInTheDocument();
    expect(heading).toHaveTextContent('Dashboard');
  });

  it('should handle long messages', () => {
    const longMessage = 'This is a very long message that should be displayed correctly in the dashboard component without any issues or truncation.';
    render(<DashboardComponent message={longMessage} />);
    
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText(longMessage)).toBeInTheDocument();
  });

  it('should handle special characters in message', () => {
    const specialMessage = 'Dashboard with special chars: !@#$%^&*()_+-=[]{}|;:,.<>?';
    render(<DashboardComponent message={specialMessage} />);
    
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText(specialMessage)).toBeInTheDocument();
  });

  it('should handle HTML in message (should be escaped)', () => {
    const htmlMessage = '<script>alert("xss")</script>';
    render(<DashboardComponent message={htmlMessage} />);
    
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText(htmlMessage)).toBeInTheDocument();
    // The HTML should be escaped and not executed
    expect(screen.queryByText('xss')).not.toBeInTheDocument();
  });
});
