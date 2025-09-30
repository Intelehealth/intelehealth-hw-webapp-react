import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import Card from '../../components/common/card.component'; // adjust the path as needed

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
});
