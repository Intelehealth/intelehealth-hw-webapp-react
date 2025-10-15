import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import ToastContent from './toast';

describe('ToastContent', () => {
  it('renders title and description when provided', () => {
    render(<ToastContent title="Hello" description="World" />);
    expect(screen.getByText('Hello')).toBeInTheDocument();
    expect(screen.getByText('World')).toBeInTheDocument();
  });

  it('renders title and omits description when not provided', () => {
    render(<ToastContent title="Only Title" />);
    expect(screen.getByText('Only Title')).toBeInTheDocument();
    // Description span exists but may be empty; assert there is no text node with the missing description content
    expect(screen.queryByText(/.+/)).not.toContain(
      screen.getByText('', { selector: 'span' })
    );
  });
});
