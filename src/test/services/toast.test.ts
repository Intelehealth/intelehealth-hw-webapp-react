import { toast } from 'react-toastify';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { showToast } from '../../services/toast';

// Mock dependencies
vi.mock('react-toastify');
vi.mock('../../components/toast', () => ({
  default: vi.fn()
}));

const mockedToast = vi.mocked(toast);

describe('showToast', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should call toast with ToastContent component and default options', () => {
    const title = 'Test Title';
    const description = 'Test Description';

    showToast(title, description);

    expect(mockedToast).toHaveBeenCalledWith(
      expect.any(Object), // ToastContent component
      {
        type: 'default',
        position: 'bottom-right'
      }
    );
  });

  it('should call toast with only title when description is not provided', () => {
    const title = 'Test Title';

    showToast(title);

    expect(mockedToast).toHaveBeenCalledWith(
      expect.any(Object), // ToastContent component
      {
        type: 'default',
        position: 'bottom-right'
      }
    );
  });

  it('should call toast with custom type', () => {
    const title = 'Success';
    const description = 'Operation completed';
    const type = 'success';

    showToast(title, description, type);

    expect(mockedToast).toHaveBeenCalledWith(
      expect.any(Object), // ToastContent component
      {
        type: 'success',
        position: 'bottom-right'
      }
    );
  });

  it('should call toast with custom options', () => {
    const title = 'Test';
    const description = 'Test Description';
    const type = 'error';
    const options = {
      autoClose: 5000,
      hideProgressBar: false
    };

    showToast(title, description, type, options);

    expect(mockedToast).toHaveBeenCalledWith(
      expect.any(Object), // ToastContent component
      {
        type: 'error',
        position: 'bottom-right',
        autoClose: 5000,
        hideProgressBar: false
      }
    );
  });

  it('should merge custom options with default options', () => {
    const title = 'Test';
    const options = {
      position: 'top-right' as const,
      autoClose: 3000
    };

    showToast(title, undefined, 'info', options);

    expect(mockedToast).toHaveBeenCalledWith(
      expect.any(Object), // ToastContent component
      {
        type: 'info',
        position: 'top-right',
        autoClose: 3000
      }
    );
  });

  it('should handle all toast types', () => {
    const types = ['default', 'success', 'error', 'warning', 'info'] as const;
    
    types.forEach(type => {
      vi.clearAllMocks();
      
      showToast('Test', 'Description', type);
      
      expect(mockedToast).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({
          type,
          position: 'bottom-right'
        })
      );
    });
  });

  it('should pass correct props to ToastContent component', () => {
    const title = 'Test Title';
    const description = 'Test Description';

    showToast(title, description);

    // Verify that ToastContent is called with correct props
    expect(mockedToast).toHaveBeenCalledWith(
      expect.objectContaining({
        props: {
          title,
          description
        }
      }),
      expect.any(Object)
    );
  });

  it('should handle empty title', () => {
    const title = '';

    showToast(title);

    expect(mockedToast).toHaveBeenCalledWith(
      expect.any(Object),
      expect.objectContaining({
        type: 'default',
        position: 'bottom-right'
      })
    );
  });

  it('should handle undefined description', () => {
    const title = 'Test Title';

    showToast(title, undefined);

    expect(mockedToast).toHaveBeenCalledWith(
      expect.any(Object),
      expect.objectContaining({
        type: 'default',
        position: 'bottom-right'
      })
    );
  });

  it('should handle null description', () => {
    const title = 'Test Title';

    showToast(title, "");

    expect(mockedToast).toHaveBeenCalledWith(
      expect.any(Object),
      expect.objectContaining({
        type: 'default',
        position: 'bottom-right'
      })
    );
  });

  it('should handle complex custom options', () => {
    const title = 'Complex Test';
    const options = {
      autoClose: 10000,
      hideProgressBar: true,
      closeOnClick: false,
      pauseOnHover: true,
      draggable: false,
      progress: undefined
    };

    showToast(title, 'Description', 'warning', options);

    expect(mockedToast).toHaveBeenCalledWith(
      expect.any(Object),
      {
        type: 'warning',
        position: 'bottom-right',
        autoClose: 10000,
        hideProgressBar: true,
        closeOnClick: false,
        pauseOnHover: true,
        draggable: false,
        progress: undefined
      }
    );
  });

  it('should pass toastId option through to toast call', () => {
    showToast('Duplicate Guard', 'Only one', 'warning', { toastId: 'postal-code-invalid' });

    expect(mockedToast).toHaveBeenCalledWith(
      expect.any(Object),
      expect.objectContaining({
        toastId: 'postal-code-invalid'
      })
    );
  });
});
