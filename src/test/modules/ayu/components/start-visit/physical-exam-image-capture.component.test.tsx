import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// ── Mocks ───────────────────────────────────────────────────────────────────

vi.mock('../../../../../modules/ayu/components/common/ayu-button.component', () => ({
  default: ({ children, onClick, ...rest }: any) => (
    <button onClick={onClick} {...rest}>{children}</button>
  ),
}));

vi.mock('../../../../../components/common/photo-upload-modal.component', () => ({
  default: ({ isOpen, onClose, onUploadPhoto, onTakePhoto }: any) =>
    isOpen ? (
      <div data-testid="photo-upload-modal">
        <button
          data-testid="modal-upload"
          onClick={() =>
            onUploadPhoto(new File(['data'], 'photo.jpg', { type: 'image/jpeg' }))
          }
        >
          Upload Photo
        </button>
        <button data-testid="modal-close" onClick={onClose}>
          Close
        </button>
        <button data-testid="modal-take-photo" onClick={onTakePhoto}>
          Take Photo
        </button>
      </div>
    ) : null,
}));

import { PhysicalExamImageCapture } from '../../../../../modules/ayu/components/start-visit/physical-examination/physical-exam-image-capture.component';

// ── Helpers ─────────────────────────────────────────────────────────────────

const defaultProps = {
  images: [] as string[],
  onAdd: vi.fn(),
  onRemove: vi.fn(),
  onUpload: vi.fn(),
};

// ── Tests ───────────────────────────────────────────────────────────────────

describe('PhysicalExamImageCapture', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ── Empty state ────────────────────────────────────────────────────────

  describe('empty state', () => {
    it('should show add button', () => {
      render(<PhysicalExamImageCapture {...defaultProps} />);
      expect(screen.getByText('+')).toBeInTheDocument();
    });

    it('should show help text', () => {
      render(<PhysicalExamImageCapture {...defaultProps} />);
      expect(
        screen.getByText('Upload an image from gallery or take a picture')
      ).toBeInTheDocument();
    });

    it('should not show thumbnails', () => {
      render(<PhysicalExamImageCapture {...defaultProps} />);
      expect(screen.queryByAltText(/capture-/)).not.toBeInTheDocument();
    });

    it('should not show upload button', () => {
      render(<PhysicalExamImageCapture {...defaultProps} />);
      expect(screen.queryByText(/Upload \(/)).not.toBeInTheDocument();
    });

    it('should open modal when + is clicked', async () => {
      const user = userEvent.setup();
      render(<PhysicalExamImageCapture {...defaultProps} />);

      await user.click(screen.getByText('+'));
      expect(await screen.findByTestId('photo-upload-modal')).toBeInTheDocument();
    });
  });

  // ── With images ────────────────────────────────────────────────────────

  describe('with images', () => {
    const propsWithImages = {
      ...defaultProps,
      images: ['data:image/png;base64,AAA', 'data:image/png;base64,BBB'],
    };

    it('should render thumbnails for each image', () => {
      render(<PhysicalExamImageCapture {...propsWithImages} />);
      expect(screen.getByAltText('capture-0')).toBeInTheDocument();
      expect(screen.getByAltText('capture-1')).toBeInTheDocument();
    });

    it('should render remove button for each image', () => {
      render(<PhysicalExamImageCapture {...propsWithImages} />);
      const removeButtons = screen.getAllByText('✕');
      expect(removeButtons).toHaveLength(2);
    });

    it('should call onRemove with correct index when remove is clicked', async () => {
      const user = userEvent.setup();
      const onRemove = vi.fn();
      render(
        <PhysicalExamImageCapture {...propsWithImages} onRemove={onRemove} />
      );

      const removeButtons = screen.getAllByText('✕');
      await user.click(removeButtons[1]);
      expect(onRemove).toHaveBeenCalledWith(1);
    });

    it('should show add more button', () => {
      render(<PhysicalExamImageCapture {...propsWithImages} />);
      // The + button for adding more images
      const plusButtons = screen.getAllByText('+');
      expect(plusButtons.length).toBeGreaterThanOrEqual(1);
    });

    it('should open modal when add more is clicked', async () => {
      const user = userEvent.setup();
      render(<PhysicalExamImageCapture {...propsWithImages} />);

      const addMoreBtn = screen.getByText('+');
      await user.click(addMoreBtn);
      expect(await screen.findByTestId('photo-upload-modal')).toBeInTheDocument();
    });

    it('should show upload button', () => {
      render(<PhysicalExamImageCapture {...propsWithImages} />);
      expect(screen.getByText('Upload')).toBeInTheDocument();
    });

    it('should call onUpload when upload button is clicked', async () => {
      const user = userEvent.setup();
      const onUpload = vi.fn();
      render(
        <PhysicalExamImageCapture {...propsWithImages} onUpload={onUpload} />
      );

      await user.click(screen.getByText('Upload'));
      // handleUpload uses setTimeout(800) before calling onUpload
      await waitFor(() => expect(onUpload).toHaveBeenCalledTimes(1), { timeout: 2000 });
    });

    it('should show tick icon on upload button when showTick is true', () => {
      render(
        <PhysicalExamImageCapture {...propsWithImages} showTick />
      );
      const uploadBtn = screen.getByText('Upload');
      const svg = uploadBtn.querySelector('svg');
      expect(svg).toBeInTheDocument();
    });
  });

  // ── Modal interactions ─────────────────────────────────────────────────

  describe('modal', () => {
    it('should close modal and call onAdd when photo is uploaded', async () => {
      const user = userEvent.setup();
      const onAdd = vi.fn();
      render(<PhysicalExamImageCapture {...defaultProps} onAdd={onAdd} />);

      // Open modal
      await user.click(screen.getByText('+'));
      expect(await screen.findByTestId('photo-upload-modal')).toBeInTheDocument();

      // Upload photo in modal
      await user.click(screen.getByTestId('modal-upload'));

      // Modal should close
      await waitFor(() =>
        expect(screen.queryByTestId('photo-upload-modal')).not.toBeInTheDocument()
      );
      // onAdd should be called with the file
      expect(onAdd).toHaveBeenCalledWith(expect.any(File));
    });

    it('should close modal when close button is clicked', async () => {
      const user = userEvent.setup();
      render(<PhysicalExamImageCapture {...defaultProps} />);

      // Open modal
      await user.click(screen.getByText('+'));
      expect(await screen.findByTestId('photo-upload-modal')).toBeInTheDocument();

      // Close modal
      await user.click(screen.getByTestId('modal-close'));
      await waitFor(() =>
        expect(screen.queryByTestId('photo-upload-modal')).not.toBeInTheDocument()
      );
    });

    it('should handle onTakePhoto callback (no-op)', async () => {
      const user = userEvent.setup();
      render(<PhysicalExamImageCapture {...defaultProps} />);

      await user.click(screen.getByText('+'));
      expect(await screen.findByTestId('photo-upload-modal')).toBeInTheDocument();

      // Should not throw — onTakePhoto is a no-op
      await user.click(screen.getByTestId('modal-take-photo'));
    });

    it('should not show modal by default', () => {
      render(<PhysicalExamImageCapture {...defaultProps} />);
      expect(screen.queryByTestId('photo-upload-modal')).not.toBeInTheDocument();
    });
  });

  // ── Image sources ──────────────────────────────────────────────────────

  describe('image sources', () => {
    it('should set correct src on thumbnails', () => {
      render(
        <PhysicalExamImageCapture
          {...defaultProps}
          images={['data:image/png;base64,XYZ']}
        />
      );
      const img = screen.getByAltText('capture-0') as HTMLImageElement;
      expect(img.src).toBe('data:image/png;base64,XYZ');
    });
  });
});
