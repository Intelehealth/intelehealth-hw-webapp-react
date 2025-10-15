import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import Card from '../../components/common/card.component';

describe('Card', () => {
  const mockImage = 'https://via.placeholder.com/150';
  const mockTitle = 'Card Title';
  const mockDescription = 'This is a description';

  it('renders title and description', () => {
    render(<Card title={mockTitle} description={mockDescription} />);
    expect(screen.getByText(mockTitle)).toBeInTheDocument();
    expect(screen.getByText(mockDescription)).toBeInTheDocument();
  });

  it('renders image with correct alt text', () => {
    render(<Card image={mockImage} title={mockTitle} />);
    const img = screen.getByRole('img');
    expect(img).toHaveAttribute('src', mockImage);
    expect(img).toHaveAttribute('alt', mockTitle);
  });

  it('does not render image if not provided', () => {
    render(<Card title="No Image" />);
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });

  it('renders children content', () => {
    render(
      <Card>
        <button>Child Button</button>
      </Card>
    );
    expect(
      screen.getByRole('button', { name: 'Child Button' })
    ).toBeInTheDocument();
  });

  it('renders without title or description but with children', () => {
    render(
      <Card>
        <span>Only Children</span>
      </Card>
    );
    expect(screen.getByText('Only Children')).toBeInTheDocument();
  });

  // Additional test cases for 100% branch coverage

  it('renders only image without title, description, or children', () => {
    render(<Card image={mockImage} />);
    const img = screen.getByRole('img');
    expect(img).toHaveAttribute('src', mockImage);
    expect(img.getAttribute('alt')).toBeNull();
    expect(screen.queryByText(mockTitle)).not.toBeInTheDocument();
    expect(screen.queryByText(mockDescription)).not.toBeInTheDocument();
  });

  it('renders only title without image, description, or children', () => {
    render(<Card title={mockTitle} />);
    expect(screen.getByText(mockTitle)).toBeInTheDocument();
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
    expect(screen.queryByText(mockDescription)).not.toBeInTheDocument();
  });

  it('renders only description without image, title, or children', () => {
    render(<Card description={mockDescription} />);
    expect(screen.getByText(mockDescription)).toBeInTheDocument();
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
    expect(screen.queryByText(mockTitle)).not.toBeInTheDocument();
  });

  it('renders empty card with no props', () => {
    render(<Card />);
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
    expect(screen.queryByText(mockTitle)).not.toBeInTheDocument();
    expect(screen.queryByText(mockDescription)).not.toBeInTheDocument();
  });

  it('renders image without title (alt text should be null)', () => {
    render(<Card image={mockImage} />);
    const img = screen.getByRole('img');
    expect(img).toHaveAttribute('src', mockImage);
    expect(img.getAttribute('alt')).toBeNull();
  });

  it('applies custom className', () => {
    const { container } = render(<Card className="custom-class" />);
    const cardElement = container.firstChild as HTMLElement;
    expect(cardElement).toHaveClass('custom-class');
  });

  it('applies default className when no custom className provided', () => {
    const { container } = render(<Card />);
    const cardElement = container.firstChild as HTMLElement;
    expect(cardElement).toHaveClass('bg-white', 'rounded-xl', 'shadow-md');
  });

  it('renders children with margin when title is present', () => {
    render(
      <Card title={mockTitle}>
        <button>Child Button</button>
      </Card>
    );
    const childContainer = screen.getByRole('button').parentElement;
    expect(childContainer).toHaveClass('mt-4');
  });

  it('renders children with margin when description is present', () => {
    render(
      <Card description={mockDescription}>
        <button>Child Button</button>
      </Card>
    );
    const childContainer = screen.getByRole('button').parentElement;
    expect(childContainer).toHaveClass('mt-4');
  });

  it('renders children with margin when both title and description are present', () => {
    render(
      <Card title={mockTitle} description={mockDescription}>
        <button>Child Button</button>
      </Card>
    );
    const childContainer = screen.getByRole('button').parentElement;
    expect(childContainer).toHaveClass('mt-4');
  });

  it('renders children without margin when neither title nor description are present', () => {
    render(
      <Card>
        <button>Child Button</button>
      </Card>
    );
    const childContainer = screen.getByRole('button').parentElement;
    expect(childContainer).not.toHaveClass('mt-4');
    // When no title or description, the className should be empty string
    expect(childContainer?.className).toBe('');
  });

  it('renders all props together', () => {
    render(
      <Card 
        image={mockImage} 
        title={mockTitle} 
        description={mockDescription}
        className="test-class"
      >
        <button>Child Button</button>
      </Card>
    );
    
    // Check image
    const img = screen.getByRole('img');
    expect(img).toHaveAttribute('src', mockImage);
    expect(img).toHaveAttribute('alt', mockTitle);
    
    // Check title
    expect(screen.getByText(mockTitle)).toBeInTheDocument();
    
    // Check description
    expect(screen.getByText(mockDescription)).toBeInTheDocument();
    
    // Check children
    expect(screen.getByRole('button', { name: 'Child Button' })).toBeInTheDocument();
    
    // Check className
    const { container } = render(
      <Card 
        image={mockImage} 
        title={mockTitle} 
        description={mockDescription}
        className="test-class"
      >
        <button>Child Button</button>
      </Card>
    );
    const cardElement = container.firstChild as HTMLElement;
    expect(cardElement).toHaveClass('test-class');
  });

  it('renders with title but no description', () => {
    render(<Card title={mockTitle} />);
    expect(screen.getByText(mockTitle)).toBeInTheDocument();
    expect(screen.queryByText(mockDescription)).not.toBeInTheDocument();
  });

  it('renders with description but no title', () => {
    render(<Card description={mockDescription} />);
    expect(screen.getByText(mockDescription)).toBeInTheDocument();
    expect(screen.queryByText(mockTitle)).not.toBeInTheDocument();
  });

  it('renders with image and title but no description', () => {
    render(<Card image={mockImage} title={mockTitle} />);
    const img = screen.getByRole('img');
    expect(img).toHaveAttribute('src', mockImage);
    expect(img).toHaveAttribute('alt', mockTitle);
    expect(screen.getByText(mockTitle)).toBeInTheDocument();
    expect(screen.queryByText(mockDescription)).not.toBeInTheDocument();
  });

  it('renders with image and description but no title', () => {
    render(<Card image={mockImage} description={mockDescription} />);
    const img = screen.getByRole('img');
    expect(img).toHaveAttribute('src', mockImage);
    expect(img.getAttribute('alt')).toBeNull();
    expect(screen.getByText(mockDescription)).toBeInTheDocument();
    expect(screen.queryByText(mockTitle)).not.toBeInTheDocument();
  });
});
