import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { ConfirmationModal } from '../../../components/modal/confirmation.modal';

describe('ConfirmationModal', () => {
  const defaultProps = {
    open: true,
    type: 'confirm' as const,
    title: 'Test Modal',
    onClose: vi.fn(),
  };

  it('renders nothing when open is false', () => {
    const { container } = render(<ConfirmationModal {...defaultProps} open={false} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders modal with title when open is true', () => {
    render(<ConfirmationModal {...defaultProps} />);
    expect(screen.getByText('Test Modal')).toBeInTheDocument();
  });

  it('renders description when provided', () => {
    render(
      <ConfirmationModal {...defaultProps} description="This is a test description" />
    );
    expect(screen.getByText('This is a test description')).toBeInTheDocument();
  });

  it('renders icon when provided', () => {
    render(<ConfirmationModal {...defaultProps} icon="/test-icon.svg" />);
    const icon = screen.getByRole('img');
    expect(icon).toBeInTheDocument();
    expect(icon).toHaveAttribute('src', '/test-icon.svg');
    expect(icon).toHaveClass('w-12', 'h-12');

    // Check wrapper div and classes
    const wrapper = icon.parentElement;
    expect(wrapper).toHaveClass('flex', 'justify-center', 'mb-4');
  });

  it('does not render icon when not provided', () => {
    render(<ConfirmationModal {...defaultProps} />);
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });

  it('renders default button text when title is present', () => {
    render(<ConfirmationModal {...defaultProps} />);
    expect(screen.getByText('Back')).toBeInTheDocument();
    expect(screen.getByText('Confirm')).toBeInTheDocument();
  });

  it('does not render cancel button when title is empty', () => {
    render(<ConfirmationModal {...defaultProps} title="" />);
    expect(screen.queryByText('Back')).not.toBeInTheDocument();
    expect(screen.getByText('Confirm')).toBeInTheDocument();
  });

  it('renders custom button text when provided', () => {
    render(
      <ConfirmationModal
        {...defaultProps}
        cancelText="Cancel"
        confirmText="OK"
      />
    );
    expect(screen.getByText('Cancel')).toBeInTheDocument();
    expect(screen.getByText('OK')).toBeInTheDocument();
  });

  it('calls onClose when cancel button is clicked', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();

    render(<ConfirmationModal {...defaultProps} onClose={onClose} />);
    await user.click(screen.getByText('Back'));

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onConfirm when confirm button is clicked', async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();

    render(<ConfirmationModal {...defaultProps} onConfirm={onConfirm} />);
    await user.click(screen.getByText('Confirm'));

    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it('renders with correct modal structure and styling classes', () => {
    const { container } = render(<ConfirmationModal {...defaultProps} />);
    const modal = container.querySelector('.fixed.inset-0.z-50');
    const modalBox = container.querySelector('.bg-white');

    expect(modal).toBeInTheDocument();
    expect(modalBox).toBeInTheDocument();
  });

  describe('Size Prop', () => {
    it('applies sm size classes by default', () => {
      const { container } = render(<ConfirmationModal {...defaultProps} />);
      const modalBox = container.querySelector('.bg-white');
      expect(modalBox).toHaveClass('w-[400px]');
    });

    it('applies lg size classes when size is lg', () => {
      const { container } = render(<ConfirmationModal {...defaultProps} size="lg" />);
      const modalBox = container.querySelector('.bg-white');
      expect(modalBox).toHaveClass('w-[90vw]');
    });

    it('applies sm size classes when size is explicitly sm', () => {
      const { container } = render(<ConfirmationModal {...defaultProps} size="sm" />);
      const modalBox = container.querySelector('.bg-white');
      expect(modalBox).toHaveClass('w-[400px]');
    });
  });

  it('renders note when provided', () => {
    render(
      <ConfirmationModal {...defaultProps} note="This is an important note" />
    );
    expect(screen.getByText('Note:')).toBeInTheDocument();
    expect(screen.getByText(/This is an important note/)).toBeInTheDocument();
  });

  it('does not render note when not provided', () => {
    render(<ConfirmationModal {...defaultProps} />);
    expect(screen.queryByText('Note:')).not.toBeInTheDocument();
  });

  it('applies text-center for description when size is sm (default)', () => {
    render(<ConfirmationModal {...defaultProps} description="Test Description" />);

    const descElement = screen.getByText('Test Description');
    expect(descElement).toHaveClass('text-center');
  });

  it('applies text-left for description when size is lg', () => {
    render(<ConfirmationModal {...defaultProps} description="Test Description" size="lg" />);

    const descElement = screen.getByText('Test Description');
    expect(descElement).toHaveClass('text-left');
  });

  it('applies text-gray-500 for description when title is present', () => {
    render(<ConfirmationModal {...defaultProps} description="Test Description" />);

    const descElement = screen.getByText('Test Description');
    expect(descElement).toHaveClass('text-gray-500');
  });

  it('applies font-semibold and text-gray-800 for description when title is empty', () => {
    render(<ConfirmationModal {...defaultProps} title="" description="Test Description" />);

    const descElement = screen.getByText('Test Description');
    expect(descElement).toHaveClass('font-semibold', 'text-gray-800');
  });

  it('renders both buttons when title is present', () => {
    render(<ConfirmationModal {...defaultProps} />);
    const buttons = screen.getAllByRole('button');

    expect(buttons).toHaveLength(2);
  });

  it('renders only confirm button when title is empty', () => {
    render(<ConfirmationModal {...defaultProps} title="" />);
    const buttons = screen.getAllByRole('button');

    expect(buttons).toHaveLength(1);
    expect(screen.getByText('Confirm')).toBeInTheDocument();
  });

  it('works without onConfirm callback', async () => {
    const user = userEvent.setup();
    render(<ConfirmationModal {...defaultProps} onConfirm={undefined} />);

    // Should not throw error when clicking confirm without callback
    await user.click(screen.getByText('Confirm'));
    expect(true).toBe(true);
  });

  describe('Items Rendering', () => {
    it('renders items when provided', () => {
      const items = ['Item 1', 'Item 2', 'Item 3'];
      render(<ConfirmationModal {...defaultProps} items={items} />);

      expect(screen.getByText('Item 1')).toBeInTheDocument();
      expect(screen.getByText('Item 2')).toBeInTheDocument();
      expect(screen.getByText('Item 3')).toBeInTheDocument();
    });

    it('does not render items section when items prop is not provided', () => {
      const { container } = render(<ConfirmationModal {...defaultProps} />);

      // Check that the items container div doesn't exist
      const itemsContainer = container.querySelector('.mt-3.flex.flex-wrap.justify-center.gap-2');
      expect(itemsContainer).not.toBeInTheDocument();
    });

    it('renders empty items container when items array is empty', () => {
      const { container } = render(<ConfirmationModal {...defaultProps} items={[]} />);

      // The container renders but has no child items
      const itemsContainer = container.querySelector('.mt-3.flex.flex-wrap.justify-center.gap-2');
      expect(itemsContainer).toBeInTheDocument();
      expect(itemsContainer?.children.length).toBe(0);
    });

    it('renders single item correctly', () => {
      const items = ['Single Item'];
      render(<ConfirmationModal {...defaultProps} items={items} />);

      expect(screen.getByText('Single Item')).toBeInTheDocument();
    });

    it('renders items with correct styling classes', () => {
      const items = ['Styled Item'];
      const { container } = render(<ConfirmationModal {...defaultProps} items={items} />);

      // Check items container classes
      const itemsContainer = container.querySelector('.mt-3.flex.flex-wrap.justify-center.gap-2');
      expect(itemsContainer).toBeInTheDocument();

      // Check individual item styling
      const itemElement = screen.getByText('Styled Item').closest('div');
      expect(itemElement).toHaveClass(
        'flex',
        'items-center',
        'gap-2',
        'px-3',
        'py-1',
        'rounded-sm',
        'bg-[#2E1E91]',
        'text-white',
        'text-sm'
      );
    });

    it('renders multiple items with proper structure', () => {
      const items = ['First', 'Second', 'Third', 'Fourth'];
      const { container } = render(<ConfirmationModal {...defaultProps} items={items} />);

      const itemElements = container.querySelectorAll('.bg-\\[\\#2E1E91\\]');
      expect(itemElements).toHaveLength(4);
    });

    it('renders items in correct order', () => {
      const items = ['Alpha', 'Beta', 'Gamma'];
      const { container } = render(<ConfirmationModal {...defaultProps} items={items} />);

      const itemElements = container.querySelectorAll('.bg-\\[\\#2E1E91\\]');
      expect(itemElements[0]).toHaveTextContent('Alpha');
      expect(itemElements[1]).toHaveTextContent('Beta');
      expect(itemElements[2]).toHaveTextContent('Gamma');
    });

    it('renders items with special characters', () => {
      const items = ['Item & Special', 'Item <html>', 'Item "quotes"'];
      render(<ConfirmationModal {...defaultProps} items={items} />);

      expect(screen.getByText('Item & Special')).toBeInTheDocument();
      expect(screen.getByText('Item <html>')).toBeInTheDocument();
      expect(screen.getByText('Item "quotes"')).toBeInTheDocument();
    });

    it('renders items with long text', () => {
      const items = ['This is a very long item text that should still render correctly'];
      render(<ConfirmationModal {...defaultProps} items={items} />);

      expect(screen.getByText('This is a very long item text that should still render correctly')).toBeInTheDocument();
    });

    it('uses item value as key for each item element', () => {
      const items = ['Key1', 'Key2', 'Key3'];
      const { container } = render(<ConfirmationModal {...defaultProps} items={items} />);

      const itemElements = container.querySelectorAll('.bg-\\[\\#2E1E91\\]');
      expect(itemElements).toHaveLength(3);
    });

    it('renders items section between description and divider', () => {
      const items = ['Test Item'];
      const description = 'Test Description';
      const { container } = render(
        <ConfirmationModal {...defaultProps} description={description} items={items} />
      );

      const descriptionElement = screen.getByText(description);
      const itemElement = screen.getByText('Test Item');
      const divider = container.querySelector('.border-b');

      // Check order in DOM
      const parent = container.querySelector('.bg-white');
      const children = Array.from(parent?.children || []);

      const descIndex = children.findIndex(child => child.contains(descriptionElement));
      const itemIndex = children.findIndex(child => child.contains(itemElement));
      const dividerIndex = children.findIndex(child => child === divider);

      expect(descIndex).toBeLessThan(itemIndex);
      expect(itemIndex).toBeLessThan(dividerIndex);
    });

    it('handles undefined items gracefully', () => {
      const { container } = render(<ConfirmationModal {...defaultProps} items={undefined} />);

      const itemsContainer = container.querySelector('.mt-3.flex.flex-wrap.justify-center.gap-2');
      expect(itemsContainer).not.toBeInTheDocument();
    });

    it('renders items with numbers', () => {
      const items = ['Item 1', 'Item 2', '123', '456'];
      render(<ConfirmationModal {...defaultProps} items={items} />);

      expect(screen.getByText('Item 1')).toBeInTheDocument();
      expect(screen.getByText('123')).toBeInTheDocument();
      expect(screen.getByText('456')).toBeInTheDocument();
    });
  });
});
