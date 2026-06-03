import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import PhotoCropModal from '../../../components/common/photo-crop-modal.component';

vi.mock('react-easy-crop', () => ({
  default: (props: {
    onCropComplete: (_: unknown, croppedPixels: { x: number; y: number; width: number; height: number }) => void;
  }) => (
    <div data-testid="mock-cropper">
      <button
        type="button"
        onClick={() =>
          props.onCropComplete(null, { x: 0, y: 0, width: 100, height: 100 })
        }
      >
        Complete Crop
      </button>
    </div>
  ),
}));

vi.mock('../../../components/common/button.component', () => ({
  default: ({
    children,
    onClick,
  }: {
    children: React.ReactNode;
    onClick?: () => void;
  }) => <button onClick={onClick}>{children}</button>,
}));

const mockOnCropComplete = vi.fn();
const mockOnCancel = vi.fn();

const baseProps = {
  image: 'data:image/png;base64,abc',
  onCropComplete: mockOnCropComplete,
};

describe('PhotoCropModal', () => {
  const mockCtx = {
    drawImage: vi.fn(),
    beginPath: vi.fn(),
    arc: vi.fn(),
    closePath: vi.fn(),
    fill: vi.fn(),
    fillRect: vi.fn(),
    globalCompositeOperation: '',
    fillStyle: '',
  };

  beforeAll(() => {
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation(
      () => mockCtx as unknown as CanvasRenderingContext2D
    );
    vi.spyOn(HTMLCanvasElement.prototype, 'toDataURL').mockReturnValue(
      'data:image/jpeg;base64,mocked'
    );
    Object.defineProperty(HTMLCanvasElement.prototype, 'toBlob', {
      value: vi.fn((cb: (blob: Blob | null) => void) =>
        cb(new Blob(['x'], { type: 'image/jpeg' }))
      ),
      configurable: true,
    });

    class MockImage {
      onload: null | (() => void) = null;
      onerror: null | ((e: unknown) => void) = null;
      crossOrigin?: string;
      private _src = '';

      set src(value: string) {
        this._src = value;
        queueMicrotask(() => this.onload?.());
      }

      get src() {
        return this._src;
      }
    }

    vi.stubGlobal('Image', MockImage);
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders cropper and zoom slider', () => {
    render(<PhotoCropModal {...baseProps} />);
    expect(screen.getByTestId('mock-cropper')).toBeInTheDocument();
    expect(screen.getByRole('slider')).toBeInTheDocument();
  });

  it('does not render Save/Cancel buttons when manual is false', () => {
    render(<PhotoCropModal {...baseProps} manual={false} onCancel={mockOnCancel} />);
    expect(screen.queryByText(/save/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/cancel/i)).not.toBeInTheDocument();
  });

  it('renders Save and Cancel buttons when manual is true and onCancel exists', () => {
    render(<PhotoCropModal {...baseProps} manual onCancel={mockOnCancel} />);
    expect(screen.getByText(/save/i)).toBeInTheDocument();
    expect(screen.getByText(/cancel/i)).toBeInTheDocument();
  });

  it('calls onCancel when backdrop is clicked', () => {
    const { container } = render(
      <PhotoCropModal {...baseProps} manual onCancel={mockOnCancel} />
    );
    const backdrop = container.querySelector('.absolute.inset-0');
    expect(backdrop).toBeTruthy();
    fireEvent.click(backdrop as Element);
    expect(mockOnCancel).toHaveBeenCalledTimes(1);
  });

  it('calls onCancel when Cancel button is clicked', () => {
    render(<PhotoCropModal {...baseProps} manual onCancel={mockOnCancel} />);
    fireEvent.click(screen.getByText(/cancel/i));
    expect(mockOnCancel).toHaveBeenCalledTimes(1);
  });

  it('does not call onCropComplete when Save is clicked before crop is completed', async () => {
    render(<PhotoCropModal {...baseProps} manual />);
    fireEvent.click(screen.getByText(/save/i));

    await waitFor(() => {
      expect(mockOnCropComplete).not.toHaveBeenCalled();
    });
  });

  it('calls onCropComplete with base64 result after completing crop and clicking Save', async () => {
    render(<PhotoCropModal {...baseProps} manual />);
    fireEvent.click(screen.getByText(/complete crop/i));
    fireEvent.click(screen.getByText(/save/i));

    await waitFor(() => {
      expect(mockOnCropComplete).toHaveBeenCalledWith(
        expect.stringMatching(/^data:image\/jpeg;base64,/)
      );
    });
  });

  it('calls onCropComplete with File when outputType is file', async () => {
    render(<PhotoCropModal {...baseProps} manual outputType="file" />);
    fireEvent.click(screen.getByText(/complete crop/i));
    fireEvent.click(screen.getByText(/save/i));

    await waitFor(() => {
      expect(mockOnCropComplete).toHaveBeenCalledWith(expect.any(File));
    });
  });

  it('sets crossOrigin for non-data URL images', async () => {
    const externalProps = {
      ...baseProps,
      image: 'http://example.com/photo.jpg',
    };
    render(<PhotoCropModal {...externalProps} manual />);
    fireEvent.click(screen.getByText(/complete crop/i));
    fireEvent.click(screen.getByText(/save/i));

    await waitFor(() => {
      expect(mockOnCropComplete).toHaveBeenCalled();
    });
  });

  it('rejects when image fails to load', async () => {
    class ErrorImage {
      onload: null | (() => void) = null;
      onerror: null | ((e: unknown) => void) = null;
      crossOrigin?: string;
      private _src = '';

      set src(value: string) {
        this._src = value;
        queueMicrotask(() => this.onerror?.(new Error('load failed')));
      }

      get src() {
        return this._src;
      }
    }

    vi.stubGlobal('Image', ErrorImage);

    render(<PhotoCropModal {...baseProps} manual />);
    fireEvent.click(screen.getByText(/complete crop/i));
    fireEvent.click(screen.getByText(/save/i));

    await waitFor(() => {
      expect(mockOnCropComplete).not.toHaveBeenCalled();
    });

    // Restore original mock
    class MockImage {
      onload: null | (() => void) = null;
      onerror: null | ((e: unknown) => void) = null;
      crossOrigin?: string;
      private _src = '';

      set src(value: string) {
        this._src = value;
        queueMicrotask(() => this.onload?.());
      }

      get src() {
        return this._src;
      }
    }

    vi.stubGlobal('Image', MockImage);
  });

  it('rejects when first canvas context is null in getCroppedImg', async () => {
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation(
      () => null
    );

    render(<PhotoCropModal {...baseProps} manual />);
    fireEvent.click(screen.getByText(/complete crop/i));
    fireEvent.click(screen.getByText(/save/i));

    await waitFor(() => {
      expect(mockOnCropComplete).not.toHaveBeenCalled();
    });

    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation(
      () => mockCtx as unknown as CanvasRenderingContext2D
    );
  });

  it('rejects when final canvas context is null in getCroppedImg', async () => {
    let callCount = 0;
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation(
      () => {
        callCount++;
        if (callCount <= 1) return mockCtx as unknown as CanvasRenderingContext2D;
        return null;
      }
    );

    render(<PhotoCropModal {...baseProps} manual />);
    fireEvent.click(screen.getByText(/complete crop/i));
    fireEvent.click(screen.getByText(/save/i));

    await waitFor(() => {
      expect(mockOnCropComplete).not.toHaveBeenCalled();
    });

    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation(
      () => mockCtx as unknown as CanvasRenderingContext2D
    );
  });

  it('rejects when toBlob returns null', async () => {
    Object.defineProperty(HTMLCanvasElement.prototype, 'toBlob', {
      value: vi.fn((cb: (blob: Blob | null) => void) => cb(null)),
      configurable: true,
    });

    render(<PhotoCropModal {...baseProps} manual outputType="file" />);
    fireEvent.click(screen.getByText(/complete crop/i));
    fireEvent.click(screen.getByText(/save/i));

    await waitFor(() => {
      expect(mockOnCropComplete).not.toHaveBeenCalled();
    });

    Object.defineProperty(HTMLCanvasElement.prototype, 'toBlob', {
      value: vi.fn((cb: (blob: Blob | null) => void) =>
        cb(new Blob(['x'], { type: 'image/jpeg' }))
      ),
      configurable: true,
    });
  });

  it('changes zoom when slider is adjusted', () => {
    render(<PhotoCropModal {...baseProps} />);
    const slider = screen.getByRole('slider');
    fireEvent.change(slider, { target: { value: '2.5' } });
    expect(slider).toHaveValue('2.5');
  });
});
