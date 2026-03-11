import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ReasonCategoryList } from '../../../../../../modules/ayu/components/start-visit/visit-reason/reason-categoryList.component';

describe('ReasonCategoryList', () => {
  const mockAddReason = vi.fn();

  it('should render "Recently searched" section', () => {
    render(<ReasonCategoryList addReason={mockAddReason} />);

    expect(screen.getByText('Recently searched')).toBeInTheDocument();
  });

  it('should render "Most common reasons" section', () => {
    render(<ReasonCategoryList addReason={mockAddReason} />);

    expect(screen.getByText('Most common reasons')).toBeInTheDocument();
  });

  it('should render "All reasons" section', () => {
    render(<ReasonCategoryList addReason={mockAddReason} />);

    expect(screen.getByText('All reasons')).toBeInTheDocument();
  });

  it('should render recently searched items', () => {
    render(<ReasonCategoryList addReason={mockAddReason} />);

    expect(screen.getByText('Headache')).toBeInTheDocument();
    expect(screen.getByText('Fever')).toBeInTheDocument();
    expect(screen.getByText('Diarrhea')).toBeInTheDocument();
  });

  it('should render most common reasons items', () => {
    render(<ReasonCategoryList addReason={mockAddReason} />);

    expect(screen.getByText('Dizziness')).toBeInTheDocument();
    expect(screen.getByText('Leg pain')).toBeInTheDocument();
    expect(screen.getByText('Cough')).toBeInTheDocument();
  });

  it('should call addReason when a recently searched item is clicked', async () => {
    const user = userEvent.setup();
    render(<ReasonCategoryList addReason={mockAddReason} />);

    await user.click(screen.getByText('Headache'));

    expect(mockAddReason).toHaveBeenCalledWith('Headache');
  });

  it('should call addReason when a common reason item is clicked', async () => {
    const user = userEvent.setup();
    render(<ReasonCategoryList addReason={mockAddReason} />);

    await user.click(screen.getByText('Dizziness'));

    expect(mockAddReason).toHaveBeenCalledWith('Dizziness');
  });

  it('should render all recently searched items as clickable buttons', () => {
    render(<ReasonCategoryList addReason={mockAddReason} />);

    const buttons = screen.getAllByRole('button');
    // 3 recently searched + 3 most common = 6 total
    expect(buttons).toHaveLength(6);
  });

  it('should call addReason for each recently searched item when clicked', async () => {
    const user = userEvent.setup();
    render(<ReasonCategoryList addReason={mockAddReason} />);

    await user.click(screen.getByText('Fever'));
    expect(mockAddReason).toHaveBeenCalledWith('Fever');

    await user.click(screen.getByText('Diarrhea'));
    expect(mockAddReason).toHaveBeenCalledWith('Diarrhea');
  });

  it('should call addReason for each most common reason when clicked', async () => {
    const user = userEvent.setup();
    render(<ReasonCategoryList addReason={mockAddReason} />);

    await user.click(screen.getByText('Leg pain'));
    expect(mockAddReason).toHaveBeenCalledWith('Leg pain');

    await user.click(screen.getByText('Cough'));
    expect(mockAddReason).toHaveBeenCalledWith('Cough');
  });
});
