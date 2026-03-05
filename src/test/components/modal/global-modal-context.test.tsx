import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import {
    GlobalModalProvider,
    useGlobalModal,
} from '../../../components/modal/global-modal-context';

// Test component to access context methods
const TestComponent = ({
  onShowConfirm,
  onShowVitalConfirm,
}: {
  onShowConfirm?: () => void;
  onShowVitalConfirm?: () => void;
}) => {
  const { showConfirmModal, showVitalConfirmationModal, closeModal } = useGlobalModal();

  return (
    <div>
      <button
        onClick={() => {
          showVitalConfirmationModal({
            open: true,
            type: 'vitalConfirm',
            title: 'Vital Confirm Modal',
            description: 'This is a vital confirm modal',
            items: [{ label: 'Test', value: 'Value' }],
          });
          onShowVitalConfirm?.();
        }}
      >
        Show Vital Confirm Modal
      </button>
      <button
        onClick={() => {
          showConfirmModal({
            open: true,
            type: 'confirm',
            title: 'Confirm Modal',
            description: 'This is a confirm modal',
          });
          onShowConfirm?.();
        }}
      >
        Show Confirm Modal
      </button>
      <button onClick={closeModal}>Close Modal</button>
    </div>
  );
};

describe('GlobalModalProvider', () => {
  it('renders children correctly', () => {
    render(
      <GlobalModalProvider>
        <div>Test Content</div>
      </GlobalModalProvider>
    );
    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });

  it('renders VitalConfirmationModal when showVitalConfirmationModal is called', async () => {
    const user = userEvent.setup();
    render(
      <GlobalModalProvider>
        <TestComponent />
      </GlobalModalProvider>
    );

    await user.click(screen.getByText('Show Vital Confirm Modal'));

    await waitFor(() => {
      expect(screen.getByText('Vital Confirm Modal')).toBeInTheDocument();
      expect(screen.getByText('This is a vital confirm modal')).toBeInTheDocument();
    });
  });

  it('renders ConfirmationModal when showConfirmModal is called', async () => {
    const user = userEvent.setup();
    render(
      <GlobalModalProvider>
        <TestComponent />
      </GlobalModalProvider>
    );

    await user.click(screen.getByText('Show Confirm Modal'));

    await waitFor(() => {
      expect(screen.getByText('Confirm Modal')).toBeInTheDocument();
      expect(screen.getByText('This is a confirm modal')).toBeInTheDocument();
    });
  });

  it('closes modal when closeModal is called', async () => {
    const user = userEvent.setup();
    render(
      <GlobalModalProvider>
        <TestComponent />
      </GlobalModalProvider>
    );

    // Open modal
    await user.click(screen.getByText('Show Confirm Modal'));
    await waitFor(() => {
      expect(screen.getByText('Confirm Modal')).toBeInTheDocument();
    });

    // Close modal
    await user.click(screen.getByText('Close Modal'));

    await waitFor(() => {
      expect(screen.queryByText('Confirm Modal')).not.toBeInTheDocument();
    });
  });

  it('closes modal when onClose is triggered from modal', async () => {
    const user = userEvent.setup();
    render(
      <GlobalModalProvider>
        <TestComponent />
      </GlobalModalProvider>
    );

    // Open modal
    await user.click(screen.getByText('Show Confirm Modal'));
    await waitFor(() => {
      expect(screen.getByText('Confirm Modal')).toBeInTheDocument();
    });

    // Click Back button in modal to close
    await user.click(screen.getByText('Cancel'));

    await waitFor(() => {
      expect(screen.queryByText('Confirm Modal')).not.toBeInTheDocument();
    });
  });

  it('calls onConfirm callback and closes modal', async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();

    const TestWithCallback = () => {
      const { showConfirmModal } = useGlobalModal();
      return (
        <button
          onClick={() =>
            showConfirmModal({
              open: true,
              type: 'confirm',
              title: 'Test',
              onConfirm,
            })
          }
        >
          Show
        </button>
      );
    };

    render(
      <GlobalModalProvider>
        <TestWithCallback />
      </GlobalModalProvider>
    );

    await user.click(screen.getByText('Show'));
    await user.click(screen.getByText('Confirm'));

    expect(onConfirm).toHaveBeenCalledTimes(1);
    await waitFor(() => {
      expect(screen.queryByText('Test')).not.toBeInTheDocument();
    });
  });

  it('calls onChange callback and closes modal for vitalConfirm type', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    const TestWithChange = () => {
      const { showVitalConfirmationModal } = useGlobalModal();
      return (
        <button
          onClick={() =>
            showVitalConfirmationModal({
              open: true,
              type: 'vitalConfirm',
              title: 'Test Change',
              description: 'Test',
              onChange,
            })
          }
        >
          Show
        </button>
      );
    };

    render(
      <GlobalModalProvider>
        <TestWithChange />
      </GlobalModalProvider>
    );

    await user.click(screen.getByText('Show'));
    await waitFor(() => {
      expect(screen.getByText('Change')).toBeInTheDocument();
    });

    await user.click(screen.getByText('Change'));

    expect(onChange).toHaveBeenCalledTimes(1);
    await waitFor(() => {
      expect(screen.queryByText('Test Change')).not.toBeInTheDocument();
    });
  });

  it('switches between different modal types', async () => {
    const user = userEvent.setup();
    render(
      <GlobalModalProvider>
        <TestComponent />
      </GlobalModalProvider>
    );

    // Show vital confirm modal
    await user.click(screen.getByText('Show Vital Confirm Modal'));
    await waitFor(() => {
      expect(screen.getByText('Vital Confirm Modal')).toBeInTheDocument();
    });

    // Close and show confirm modal
    await user.click(screen.getByText('Close Modal'));
    await user.click(screen.getByText('Show Confirm Modal'));

    await waitFor(() => {
      expect(screen.getByText('Confirm Modal')).toBeInTheDocument();
      expect(screen.queryByText('Vital Confirm Modal')).not.toBeInTheDocument();
    });
  });

  it('uses default cancel and confirm text when not provided', async () => {
    const user = userEvent.setup();
    render(
      <GlobalModalProvider>
        <TestComponent />
      </GlobalModalProvider>
    );

    await user.click(screen.getByText('Show Vital Confirm Modal'));

    await waitFor(() => {
      expect(screen.getByText('Cancel')).toBeInTheDocument();
      expect(screen.getByText('Confirm')).toBeInTheDocument();
    });
  });

  it('uses custom button text when provided', async () => {
    const user = userEvent.setup();

    const TestWithCustomText = () => {
      const { showConfirmModal } = useGlobalModal();
      return (
        <button
          onClick={() =>
            showConfirmModal({
              open: true,
              type: 'confirm',
              title: 'Custom Text',
              cancelText: 'Go Back',
              confirmText: 'Accept',
            })
          }
        >
          Show
        </button>
      );
    };

    render(
      <GlobalModalProvider>
        <TestWithCustomText />
      </GlobalModalProvider>
    );

    await user.click(screen.getByText('Show'));

    await waitFor(() => {
      expect(screen.getByText('Go Back')).toBeInTheDocument();
      expect(screen.getByText('Accept')).toBeInTheDocument();
    });
  });

  it('passes items to VitalConfirmationModal correctly', async () => {
    const user = userEvent.setup();
    const items = [
      { label: 'Test Label', value: 'Test Value' },
      { label: 'Another Label', value: 123 },
    ];

    const TestWithItems = () => {
      const { showVitalConfirmationModal } = useGlobalModal();
      return (
        <button
          onClick={() =>
            showVitalConfirmationModal({
              open: true,
              type: 'vitalConfirm',
              title: 'Test Items',
              items,
            })
          }
        >
          Show
        </button>
      );
    };

    render(
      <GlobalModalProvider>
        <TestWithItems />
      </GlobalModalProvider>
    );

    await user.click(screen.getByText('Show'));

    await waitFor(() => {
      expect(screen.getByText('Test Label')).toBeInTheDocument();
      expect(screen.getByText('Test Value')).toBeInTheDocument();
      expect(screen.getByText('Another Label')).toBeInTheDocument();
      expect(screen.getByText('123')).toBeInTheDocument();
    });
  });

  it('handles modal without items (defaults to empty array)', async () => {
    const user = userEvent.setup();

    const TestNoItems = () => {
      const { showVitalConfirmationModal } = useGlobalModal();
      return (
        <button
          onClick={() =>
            showVitalConfirmationModal({
              open: true,
              type: 'vitalConfirm',
              title: 'No Items',
            })
          }
        >
          Show
        </button>
      );
    };

    render(
      <GlobalModalProvider>
        <TestNoItems />
      </GlobalModalProvider>
    );

    await user.click(screen.getByText('Show'));

    await waitFor(() => {
      expect(screen.getByText('No Items')).toBeInTheDocument();
    });
  });

  it('does not render modal initially', () => {
    render(
      <GlobalModalProvider>
        <div>Content</div>
      </GlobalModalProvider>
    );

    expect(screen.queryByText('Confirm')).not.toBeInTheDocument();
  });

  it('uses default context methods when hook is used outside provider', async () => {
    // Test that useGlobalModal can be called outside provider without errors
    // The default context methods are no-ops
    const user = userEvent.setup();
    const TestOutsideProvider = () => {
      const { showConfirmModal, showVitalConfirmationModal, closeModal } = useGlobalModal();
      return (
        <div>
          <button onClick={() => showConfirmModal({ open: true, type: 'confirm', title: 'Test' })}>
            Show Confirm
          </button>
          <button onClick={() => showVitalConfirmationModal({ open: true, type: 'vitalConfirm', title: 'Test' })}>
            Show Vital Confirm
          </button>
          <button onClick={closeModal}>Close</button>
        </div>
      );
    };

    render(<TestOutsideProvider />);

    // Invoke all three default context no-ops — should not throw
    await user.click(screen.getByText('Show Confirm'));
    await user.click(screen.getByText('Show Vital Confirm'));
    await user.click(screen.getByText('Close'));
  });

  it('passes note to ConfirmationModal when note is provided', async () => {
    const user = userEvent.setup();

    const TestWithNote = () => {
      const { showConfirmModal } = useGlobalModal();
      return (
        <button
          onClick={() =>
            showConfirmModal({
              open: true,
              type: 'confirm',
              title: 'Note Modal',
              note: 'This is a note',
            })
          }
        >
          Show Note Modal
        </button>
      );
    };

    render(
      <GlobalModalProvider>
        <TestWithNote />
      </GlobalModalProvider>
    );

    await user.click(screen.getByText('Show Note Modal'));

    await waitFor(() => {
      expect(screen.getByText('Note Modal')).toBeInTheDocument();
    });
  });

  it('properly closes modal after onConfirm is called in confirm modal', async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();

    const TestConfirmOnConfirm = () => {
      const { showConfirmModal } = useGlobalModal();
      return (
        <button
          onClick={() =>
            showConfirmModal({
              open: true,
              type: 'confirm',
              title: 'Confirm with Callback',
              onConfirm,
            })
          }
        >
          Show
        </button>
      );
    };

    render(
      <GlobalModalProvider>
        <TestConfirmOnConfirm />
      </GlobalModalProvider>
    );

    // Open modal
    await user.click(screen.getByText('Show'));
    await waitFor(() => {
      expect(screen.getByText('Confirm with Callback')).toBeInTheDocument();
    });

    // Click confirm - should call onConfirm AND close modal
    await user.click(screen.getByText('Confirm'));

    expect(onConfirm).toHaveBeenCalledTimes(1);
    await waitFor(() => {
      expect(screen.queryByText('Confirm with Callback')).not.toBeInTheDocument();
    });
  });

  it('properly closes modal after onConfirm is called in vitalConfirm modal', async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();

    const TestVitalConfirmOnConfirm = () => {
      const { showVitalConfirmationModal } = useGlobalModal();
      return (
        <button
          onClick={() =>
            showVitalConfirmationModal({
              open: true,
              type: 'vitalConfirm',
              title: 'Vital Confirm with Callback',
              onConfirm,
            })
          }
        >
          Show
        </button>
      );
    };

    render(
      <GlobalModalProvider>
        <TestVitalConfirmOnConfirm />
      </GlobalModalProvider>
    );

    // Open modal
    await user.click(screen.getByText('Show'));
    await waitFor(() => {
      expect(screen.getByText('Vital Confirm with Callback')).toBeInTheDocument();
    });

    // Click confirm - should call onConfirm AND close modal
    await user.click(screen.getByText('Confirm'));

    expect(onConfirm).toHaveBeenCalledTimes(1);
    await waitFor(() => {
      expect(screen.queryByText('Vital Confirm with Callback')).not.toBeInTheDocument();
    });
  });

  it('handles onConfirm being undefined without errors', async () => {
    const user = userEvent.setup();

    const TestNoOnConfirm = () => {
      const { showConfirmModal } = useGlobalModal();
      return (
        <button
          onClick={() =>
            showConfirmModal({
              open: true,
              type: 'confirm',
              title: 'No Callback',
            })
          }
        >
          Show
        </button>
      );
    };

    render(
      <GlobalModalProvider>
        <TestNoOnConfirm />
      </GlobalModalProvider>
    );

    await user.click(screen.getByText('Show'));
    await waitFor(() => {
      expect(screen.getByText('No Callback')).toBeInTheDocument();
    });

    // Should not throw when onConfirm is undefined
    await user.click(screen.getByText('Confirm'));

    await waitFor(() => {
      expect(screen.queryByText('No Callback')).not.toBeInTheDocument();
    });
  });

  it('handles onChange being undefined without errors for vitalConfirm modal', async () => {
    const user = userEvent.setup();

    const TestNoOnChange = () => {
      const { showVitalConfirmationModal } = useGlobalModal();
      return (
        <button
          onClick={() =>
            showVitalConfirmationModal({
              open: true,
              type: 'vitalConfirm',
              title: 'No onChange',
              description: 'Test',
            })
          }
        >
          Show
        </button>
      );
    };

    render(
      <GlobalModalProvider>
        <TestNoOnChange />
      </GlobalModalProvider>
    );

    await user.click(screen.getByText('Show'));

    await waitFor(() => {
      expect(screen.getByText('No onChange')).toBeInTheDocument();
    });

    // Change button appears, but clicking it should not throw error even when onChange callback is undefined
    await user.click(screen.getByText('Change'));

    // Modal should close after clicking Change
    await waitFor(() => {
      expect(screen.queryByText('No onChange')).not.toBeInTheDocument();
    });
  });
});
