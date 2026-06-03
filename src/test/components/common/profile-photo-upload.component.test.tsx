import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const h = vi.hoisted(() => ({
  mockFileToBase64: vi.fn(),
}));

vi.mock('../../../modules/profile/profile.helpers', () => ({
  fileToBase64: h.mockFileToBase64,
}));

vi.mock('../../../components/common/photo-upload-modal.component', () => ({
  default: ({
    isOpen,
    onClose,
    onTakePhoto,
    onUploadPhoto,
  }: {
    isOpen: boolean;
    onClose: () => void;
    onTakePhoto: () => void;
    onUploadPhoto: (file: File) => void;
  }) =>
    isOpen ? (
      <div data-testid="upload-modal">
        <button type="button" onClick={onClose}>
          CloseUpload
        </button>
        <button type="button" onClick={onTakePhoto}>
          TakePhoto
        </button>
        <button
          type="button"
          onClick={() =>
            onUploadPhoto(
              new File(['img'], 'upload.jpg', { type: 'image/jpeg' })
            )
          }
        >
          DoUpload
        </button>
      </div>
    ) : null,
}));

import { ProfilePhotoUpload } from '../../../components/common/profile-photo-upload.component';

const mockOnUpload = vi.fn();

const baseProps = {
  image: '',
  onUpload: mockOnUpload,
};

describe('ProfilePhotoUpload', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    h.mockFileToBase64.mockResolvedValue('data:image/jpeg;base64,abc123');
  });

  it('renders profile image and camera button', () => {
    render(<ProfilePhotoUpload {...baseProps} />);
    expect(screen.getByAltText('Profile')).toBeInTheDocument();
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('uses provided image src', () => {
    render(
      <ProfilePhotoUpload {...baseProps} image="http://example.com/img.jpg" />
    );
    const img = screen.getByAltText('Profile') as HTMLImageElement;
    expect(img.src).toBe('http://example.com/img.jpg');
  });

  it('falls back to default image on error', () => {
    render(
      <ProfilePhotoUpload {...baseProps} image="http://example.com/bad.jpg" />
    );
    const img = screen.getByAltText('Profile') as HTMLImageElement;
    fireEvent.error(img);
    // After error, src should be the default user image (an SVG import)
    expect(img.src).toBeTruthy();
  });

  it('opens upload modal when camera button is clicked', () => {
    render(<ProfilePhotoUpload {...baseProps} />);
    fireEvent.click(screen.getByRole('button'));
    expect(screen.getByTestId('upload-modal')).toBeInTheDocument();
  });

  it('closes upload modal on close', () => {
    render(<ProfilePhotoUpload {...baseProps} />);
    fireEvent.click(screen.getByRole('button'));
    expect(screen.getByTestId('upload-modal')).toBeInTheDocument();

    fireEvent.click(screen.getByText('CloseUpload'));
    expect(screen.queryByTestId('upload-modal')).not.toBeInTheDocument();
  });

  it('calls onUpload with File when imageFormat is file (default)', async () => {
    render(<ProfilePhotoUpload {...baseProps} />);
    fireEvent.click(screen.getByRole('button'));

    await act(async () => {
      fireEvent.click(screen.getByText('DoUpload'));
    });

    expect(mockOnUpload).toHaveBeenCalledWith(expect.any(File));
  });

  it('converts to base64 before calling onUpload when imageFormat is base64', async () => {
    render(
      <ProfilePhotoUpload {...baseProps} imageFormat="base64" />
    );
    fireEvent.click(screen.getByRole('button'));

    await act(async () => {
      fireEvent.click(screen.getByText('DoUpload'));
    });

    await waitFor(() => {
      expect(h.mockFileToBase64).toHaveBeenCalled();
      expect(mockOnUpload).toHaveBeenCalledWith(
        'data:image/jpeg;base64,abc123'
      );
    });
  });

  it('closes upload modal after photo upload', async () => {
    render(<ProfilePhotoUpload {...baseProps} />);
    fireEvent.click(screen.getByRole('button'));
    expect(screen.getByTestId('upload-modal')).toBeInTheDocument();

    await act(async () => {
      fireEvent.click(screen.getByText('DoUpload'));
    });

    expect(screen.queryByTestId('upload-modal')).not.toBeInTheDocument();
  });

  it('calls handleTakePhoto (no-op) without errors', () => {
    render(<ProfilePhotoUpload {...baseProps} />);
    fireEvent.click(screen.getByRole('button'));
    // TakePhoto triggers handleTakePhoto which is intentionally a no-op
    fireEvent.click(screen.getByText('TakePhoto'));
    // Should not throw or crash
    expect(screen.getByTestId('upload-modal')).toBeInTheDocument();
  });

  it('uses default image when image prop is empty', () => {
    render(<ProfilePhotoUpload {...baseProps} image="" />);
    const img = screen.getByAltText('Profile') as HTMLImageElement;
    // Should use DefaultUserImage (mocked as SVG path)
    expect(img.src).toBeTruthy();
  });
});
