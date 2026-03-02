import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import CollapsedComponent from '../../../modules/visit-summary/visit-summary-collapsed.component';

describe('CollapsedComponent', () => {
  const defaultProps = {
    icon: 'test-icon.svg',
    title: 'Test Title',
    children: <div>Test Content</div>,
  };

  it('should render without crashing', () => {
    expect(() => {
      render(<CollapsedComponent {...defaultProps} />);
    }).not.toThrow();
  });

  it('should render the title', () => {
    render(<CollapsedComponent {...defaultProps} />);
    expect(screen.getByText('Test Title')).toBeInTheDocument();
  });

  it('should render subtitle when provided', () => {
    render(<CollapsedComponent {...defaultProps} subtitle="Test Subtitle" />);
    expect(screen.getByText('Test Subtitle')).toBeInTheDocument();
  });

  it('should not render subtitle when not provided', () => {
    render(<CollapsedComponent {...defaultProps} />);
    expect(screen.queryByText('Test Subtitle')).not.toBeInTheDocument();
  });

  it('should render children when open by default', () => {
    render(<CollapsedComponent {...defaultProps} defaultOpen={true} />);
    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });

  it('should not render children when defaultOpen is false', () => {
    render(<CollapsedComponent {...defaultProps} defaultOpen={false} />);
    expect(screen.queryByText('Test Content')).not.toBeInTheDocument();
  });

  it('should toggle content on header click', () => {
    render(<CollapsedComponent {...defaultProps} defaultOpen={true} />);

    expect(screen.getByText('Test Content')).toBeInTheDocument();

    // Click to close
    fireEvent.click(screen.getByRole('button', { name: /test title/i }));
    expect(screen.queryByText('Test Content')).not.toBeInTheDocument();

    // Click to reopen
    fireEvent.click(screen.getByRole('button', { name: /test title/i }));
    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });

  it('should set aria-expanded correctly', () => {
    render(<CollapsedComponent {...defaultProps} defaultOpen={true} />);

    const button = screen.getByRole('button', { name: /test title/i });
    expect(button).toHaveAttribute('aria-expanded', 'true');

    fireEvent.click(button);
    expect(button).toHaveAttribute('aria-expanded', 'false');
  });

  it('should render contentLabel when provided', () => {
    render(
      <CollapsedComponent {...defaultProps} contentLabel="Details" defaultOpen={true} />
    );
    expect(screen.getByText('Details')).toBeInTheDocument();
  });

  it('should render Change button when onChangeClick is provided', () => {
    const onChangeClick = vi.fn();
    render(
      <CollapsedComponent
        {...defaultProps}
        onChangeClick={onChangeClick}
        defaultOpen={true}
      />
    );
    expect(screen.getByText('Change')).toBeInTheDocument();
  });

  it('should call onChangeClick when Change button is clicked', () => {
    const onChangeClick = vi.fn();
    render(
      <CollapsedComponent
        {...defaultProps}
        onChangeClick={onChangeClick}
        defaultOpen={true}
      />
    );

    fireEvent.click(screen.getByText('Change'));
    expect(onChangeClick).toHaveBeenCalledTimes(1);
  });

  it('should call onChangeClick on Enter key press', () => {
    const onChangeClick = vi.fn();
    render(
      <CollapsedComponent
        {...defaultProps}
        onChangeClick={onChangeClick}
        defaultOpen={true}
      />
    );

    fireEvent.keyDown(screen.getByText('Change'), { key: 'Enter' });
    expect(onChangeClick).toHaveBeenCalledTimes(1);
  });

  it('should not render Change button when onChangeClick is not provided', () => {
    render(<CollapsedComponent {...defaultProps} defaultOpen={true} />);
    expect(screen.queryByText('Change')).not.toBeInTheDocument();
  });

  it('should render icon image', () => {
    const { container } = render(<CollapsedComponent {...defaultProps} />);
    const img = container.querySelector('img[src="test-icon.svg"]');
    expect(img).toBeInTheDocument();
  });

  it('should render contentLabel and Change button together', () => {
    const onChangeClick = vi.fn();
    render(
      <CollapsedComponent
        {...defaultProps}
        contentLabel="General exams"
        onChangeClick={onChangeClick}
        defaultOpen={true}
      />
    );
    expect(screen.getByText('General exams')).toBeInTheDocument();
    expect(screen.getByText('Change')).toBeInTheDocument();
  });
});
