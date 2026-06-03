import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// Hoisted mocks
const h = vi.hoisted(() => ({
  mockFileToBase64: vi.fn(),
  mockValidateImageFormat: vi.fn(),
  mockShowToast: vi.fn(),
  mockDispatch: vi.fn(),
  mockStartLoading: vi.fn(() => ({ type: 'loader/start' })),
  mockStopLoading: vi.fn(() => ({ type: 'loader/stop' })),
}));

vi.mock('../../../modules/profile/profile.helpers', () => ({
  fileToBase64: h.mockFileToBase64,
  validateImageFormat: h.mockValidateImageFormat,
}));

vi.mock('../../../services/toast', () => ({
  showToast: h.mockShowToast,
}));

vi.mock('../../../reducers/loader.reducer', () => ({
  startLoading: h.mockStartLoading,
  stopLoading: h.mockStopLoading,
}));

vi.mock('react-redux', () => ({
  useDispatch: () => h.mockDispatch,
}));

// Mock lazy-loaded modals
vi.mock('../../../components/common/camera-capture-modal.component', () => ({
  default: ({
    isOpen,
    onClose,
    onCapture,
  }: {
    isOpen: boolean;
    onClose: () => void;
    onCapture: (file: File) => void;
  }) =>
    isOpen ? (
      <div data-testid="camera-modal">
        <button type="button" onClick={onClose}>
          CloseCam
        </button>
        <button
          type="button"
          onClick={() =>
            onCapture(new File(['img'], 'camera.jpg', { type: 'image/jpeg' }))
          }
        >
          CaptureCam
        </button>
      </div>
    ) : null,
}));

vi.mock('../../../components/common/photo-crop-modal.component', () => ({
  default: ({
    onCropComplete,
    onCancel,
  }: {
    image: string;
    onCropComplete: (img: string | File) => void;
    onCancel?: () => void;
  }) => (
    <div data-testid="crop-modal">
      <button
        type="button"
        onClick={() => onCropComplete('data:image/jpeg;base64,cropped')}
      >
        CropSaveBase64
      </button>
      <button
        type="button"
        onClick={() =>
          onCropComplete(
            new File(['cropped'], 'cropped.jpg', { type: 'image/jpeg' })
          )
        }
      >
        CropSaveFile
      </button>
      {onCancel && (
        <button type="button" onClick={onCancel}>
          CropCancel
        </button>
      )}
    </div>
  ),
}));

vi.mock('../../../components/common/loader.component', () => ({
  Loader: () => <div data-testid="loader" />,
}));

vi.mock('../../../components/common/button.component', () => ({
  default: ({
    children,
    onClick,
    leftIcon,
  }: {
    children: React.ReactNode;
    onClick?: () => void;
    leftIcon?: React.ReactNode;
  }) => (
    <button type="button" onClick={onClick}>
      {leftIcon}
      {children}
    </button>
  ),
}));

import PhotoUploadModal from '../../../components/common/photo-upload-modal.component';

const mockOnClose = vi.fn();
const mockOnTakePhoto = vi.fn();
const mockOnUploadPhoto = vi.fn();

const baseProps = {
  isOpen: true,
  onClose: mockOnClose,
  onTakePhoto: mockOnTakePhoto,
  onUploadPhoto: mockOnUploadPhoto,
};

describe('PhotoUploadModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    h.mockValidateImageFormat.mockReturnValue(true);
    h.mockFileToBase64.mockResolvedValue('data:image/jpeg;base64,abc123');
    document.body.style.overflow = '';
  });

  it('renders nothing when isOpen is false', () => {
    render(<PhotoUploadModal {...baseProps} isOpen={false} />);
    // Only the loader should render
    expect(screen.getByTestId('loader')).toBeInTheDocument();
    expect(screen.queryByText('Upload/Change photo')).not.toBeInTheDocument();
  });

  it('renders modal with title when isOpen is true', () => {
    render(<PhotoUploadModal {...baseProps} />);
    expect(screen.getByText('Upload/Change photo')).toBeInTheDocument();
  });

  it('shows Take photo and Upload photo options', () => {
    render(<PhotoUploadModal {...baseProps} />);
    expect(screen.getByText('Take photo')).toBeInTheDocument();
    expect(screen.getByText('Upload photo')).toBeInTheDocument();
  });

  it('sets body overflow hidden when open', () => {
    render(<PhotoUploadModal {...baseProps} />);
    expect(document.body.style.overflow).toBe('hidden');
  });

  it('resets body overflow when closed', () => {
    const { rerender } = render(<PhotoUploadModal {...baseProps} />);
    rerender(<PhotoUploadModal {...baseProps} isOpen={false} />);
    expect(document.body.style.overflow).toBe('unset');
  });

  it('resets body overflow on unmount', () => {
    const { unmount } = render(<PhotoUploadModal {...baseProps} />);
    unmount();
    expect(document.body.style.overflow).toBe('unset');
  });

  it('calls onClose when backdrop is clicked', () => {
    const { container } = render(<PhotoUploadModal {...baseProps} />);
    const backdrop = container.querySelector('.absolute.inset-0');
    fireEvent.click(backdrop!);
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('calls onClose when close button is clicked', () => {
    render(<PhotoUploadModal {...baseProps} />);
    const header = screen.getByText('Upload/Change photo').parentElement!;
    const closeBtn = header.querySelector('button')!;
    fireEvent.click(closeBtn);
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('opens camera modal when Use Camera is clicked', async () => {
    render(<PhotoUploadModal {...baseProps} />);
    fireEvent.click(screen.getByText('Use Camera'));
    expect(await screen.findByTestId('camera-modal')).toBeInTheDocument();
  });

  it('closes camera modal when CloseCam is clicked', async () => {
    render(<PhotoUploadModal {...baseProps} />);
    fireEvent.click(screen.getByText('Use Camera'));
    expect(await screen.findByTestId('camera-modal')).toBeInTheDocument();

    fireEvent.click(screen.getByText('CloseCam'));
    await waitFor(() => {
      expect(screen.queryByTestId('camera-modal')).not.toBeInTheDocument();
    });
  });

  it('triggers file input when Upload is clicked', () => {
    render(<PhotoUploadModal {...baseProps} />);
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    const clickSpy = vi.spyOn(fileInput, 'click');
    fireEvent.click(screen.getByText('Upload'));
    expect(clickSpy).toHaveBeenCalled();
  });

  it('opens crop modal after selecting a valid file', async () => {
    render(<PhotoUploadModal {...baseProps} />);
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;

    const file = new File(['img'], 'photo.jpg', { type: 'image/jpeg' });

    await act(async () => {
      fireEvent.change(fileInput, { target: { files: [file] } });
    });

    expect(h.mockValidateImageFormat).toHaveBeenCalledWith(file);
    expect(h.mockFileToBase64).toHaveBeenCalledWith(file);

    await waitFor(() => {
      expect(screen.getByTestId('crop-modal')).toBeInTheDocument();
    });
  });

  it('shows warning toast for invalid file format', async () => {
    h.mockValidateImageFormat.mockReturnValue(false);

    render(<PhotoUploadModal {...baseProps} />);
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;

    const file = new File(['data'], 'photo.bmp', { type: 'image/bmp' });

    await act(async () => {
      fireEvent.change(fileInput, { target: { files: [file] } });
    });

    expect(h.mockShowToast).toHaveBeenCalledWith(
      'Upload error!',
      'Upload JPG, JPEG or PNG format image only.',
      'warning'
    );
    expect(screen.queryByTestId('crop-modal')).not.toBeInTheDocument();
  });

  it('skips crop and calls onUploadPhoto directly when skipCrop is true', async () => {
    render(<PhotoUploadModal {...baseProps} skipCrop />);
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;

    const file = new File(['img'], 'photo.jpg', { type: 'image/jpeg' });

    await act(async () => {
      fireEvent.change(fileInput, { target: { files: [file] } });
    });

    expect(mockOnUploadPhoto).toHaveBeenCalledWith(file);
    expect(mockOnClose).toHaveBeenCalled();
    expect(screen.queryByTestId('crop-modal')).not.toBeInTheDocument();
  });

  it('calls onUploadPhoto with File when crop completes with File', async () => {
    render(<PhotoUploadModal {...baseProps} />);
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;

    const file = new File(['img'], 'photo.jpg', { type: 'image/jpeg' });

    await act(async () => {
      fireEvent.change(fileInput, { target: { files: [file] } });
    });

    await waitFor(() => {
      expect(screen.getByTestId('crop-modal')).toBeInTheDocument();
    });

    await act(async () => {
      fireEvent.click(screen.getByText('CropSaveFile'));
    });

    expect(mockOnUploadPhoto).toHaveBeenCalledWith(expect.any(File));
  });

  it('converts base64 crop result to File and calls onUploadPhoto', async () => {
    // Mock fetch for base64 -> blob conversion
    const mockBlob = new Blob(['data'], { type: 'image/jpeg' });
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        blob: () => Promise.resolve(mockBlob),
      })
    );

    render(<PhotoUploadModal {...baseProps} />);
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;

    const file = new File(['img'], 'photo.jpg', { type: 'image/jpeg' });

    await act(async () => {
      fireEvent.change(fileInput, { target: { files: [file] } });
    });

    await waitFor(() => {
      expect(screen.getByTestId('crop-modal')).toBeInTheDocument();
    });

    await act(async () => {
      fireEvent.click(screen.getByText('CropSaveBase64'));
    });

    await waitFor(() => {
      expect(mockOnUploadPhoto).toHaveBeenCalledWith(expect.any(File));
    });

    vi.unstubAllGlobals();
  });

  it('shows error toast when base64 crop conversion fails', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        blob: () => Promise.reject(new Error('fetch failed')),
      })
    );

    render(<PhotoUploadModal {...baseProps} />);
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;

    const file = new File(['img'], 'photo.jpg', { type: 'image/jpeg' });

    await act(async () => {
      fireEvent.change(fileInput, { target: { files: [file] } });
    });

    await waitFor(() => {
      expect(screen.getByTestId('crop-modal')).toBeInTheDocument();
    });

    await act(async () => {
      fireEvent.click(screen.getByText('CropSaveBase64'));
    });

    await waitFor(() => {
      expect(h.mockShowToast).toHaveBeenCalledWith(
        'Upload error!',
        'Failed to process cropped image.',
        'error'
      );
    });

    vi.unstubAllGlobals();
  });

  it('closes crop modal and clears state on cancel', async () => {
    render(<PhotoUploadModal {...baseProps} />);
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;

    const file = new File(['img'], 'photo.jpg', { type: 'image/jpeg' });

    await act(async () => {
      fireEvent.change(fileInput, { target: { files: [file] } });
    });

    await waitFor(() => {
      expect(screen.getByTestId('crop-modal')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('CropCancel'));
    expect(screen.queryByTestId('crop-modal')).not.toBeInTheDocument();
  });

  it('handles camera capture and opens crop modal', async () => {
    render(<PhotoUploadModal {...baseProps} />);
    fireEvent.click(screen.getByText('Use Camera'));
    const capBtn = await screen.findByText('CaptureCam');

    await act(async () => {
      fireEvent.click(capBtn);
    });

    // The component uses setTimeout(150ms + 200ms) to open crop modal
    await waitFor(
      () => {
        expect(screen.getByTestId('crop-modal')).toBeInTheDocument();
      },
      { timeout: 5000 }
    );

    // Wait for the inner setTimeout(200ms) that calls dispatch(stopLoading())
    await waitFor(
      () => {
        expect(h.mockDispatch).toHaveBeenCalledWith({ type: 'loader/stop' });
      },
      { timeout: 5000 }
    );
  });

  it('handles camera capture with skipCrop - directly uploads', async () => {
    render(<PhotoUploadModal {...baseProps} skipCrop />);
    fireEvent.click(screen.getByText('Use Camera'));
    const capBtn = await screen.findByText('CaptureCam');

    await act(async () => {
      fireEvent.click(capBtn);
    });

    await waitFor(() => {
      expect(mockOnUploadPhoto).toHaveBeenCalledWith(expect.any(File));
    });
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('shows toast when camera capture produces invalid format', async () => {
    h.mockValidateImageFormat.mockReturnValue(false);

    render(<PhotoUploadModal {...baseProps} />);
    fireEvent.click(screen.getByText('Use Camera'));
    const capBtn = await screen.findByText('CaptureCam');

    await act(async () => {
      fireEvent.click(capBtn);
    });

    expect(h.mockShowToast).toHaveBeenCalledWith(
      'Upload error!',
      'Upload JPG, JPEG or PNG format image only.',
      'warning'
    );
  });

  it('handles fileToBase64 error during camera capture', async () => {
    h.mockFileToBase64.mockRejectedValue(new Error('base64 failed'));

    render(<PhotoUploadModal {...baseProps} />);
    fireEvent.click(screen.getByText('Use Camera'));
    const capBtn = await screen.findByText('CaptureCam');

    await act(async () => {
      fireEvent.click(capBtn);
    });

    await waitFor(() => {
      expect(h.mockShowToast).toHaveBeenCalledWith(
        'Upload error!',
        'Failed to process image.',
        'error'
      );
    });
  });

  it('does nothing when file input change has no files', async () => {
    render(<PhotoUploadModal {...baseProps} />);
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;

    await act(async () => {
      fireEvent.change(fileInput, { target: { files: [] } });
    });

    expect(h.mockValidateImageFormat).not.toHaveBeenCalled();
  });

  it('renders the Loader component', () => {
    render(<PhotoUploadModal {...baseProps} />);
    expect(screen.getByTestId('loader')).toBeInTheDocument();
  });
});
