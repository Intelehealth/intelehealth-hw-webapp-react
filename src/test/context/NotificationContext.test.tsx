import { act, render, renderHook, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// Mocks
const mockInitialize = vi.fn().mockResolvedValue(true);
const mockRequestPermission = vi.fn().mockResolvedValue('test-token-123');

vi.mock('../../services/fcm.service', () => ({
  fcmService: {
    initialize: (...args: any[]) => mockInitialize(...args),
    requestPermission: (...args: any[]) => mockRequestPermission(...args),
  },
}));

const mockRegisterFCMToken = vi.fn().mockResolvedValue({});
const mockClearFCMToken = vi.fn().mockResolvedValue({});
const mockToggleNotificationStatus = vi.fn();

vi.mock('../../services/notification.service', () => ({
  default: {
    registerFCMToken: (...args: any[]) => mockRegisterFCMToken(...args),
    clearFCMToken: (...args: any[]) => mockClearFCMToken(...args),
    toggleNotificationStatus: (...args: any[]) => mockToggleNotificationStatus(...args),
  },
}));

const mockGetProvider = vi.fn();

vi.mock('../../modules/profile/profile.service', () => ({
  default: {
    getProvider: (...args: any[]) => mockGetProvider(...args),
  },
}));

vi.mock('../../utils/storage', () => ({
  storage: {
    getUser: () => JSON.stringify({ uuid: 'user-uuid-123' }),
  },
}));

// Mock toast
const { mockToast, mockDismiss } = vi.hoisted(() => ({
  mockToast: vi.fn().mockReturnValue('toast-id-1'),
  mockDismiss: vi.fn(),
}));
vi.mock('react-toastify', () => ({
  toast: Object.assign(
    (...args: any[]) => mockToast(...args),
    { dismiss: mockDismiss }
  ),
}));

// Mock Notification API
Object.defineProperty(window, 'Notification', {
  writable: true,
  configurable: true,
  value: { permission: 'granted', requestPermission: vi.fn().mockResolvedValue('granted') },
});

// Mock navigator.serviceWorker
Object.defineProperty(navigator, 'serviceWorker', {
  writable: true,
  configurable: true,
  value: {
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  },
});

import { NotificationProvider, useNotificationContext } from '../../context/NotificationContext';

describe('NotificationContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockInitialize.mockResolvedValue(true);
    mockRequestPermission.mockResolvedValue('test-token-123');
    mockGetProvider.mockResolvedValue({ results: [{ uuid: 'provider-uuid-456' }] });
    mockToggleNotificationStatus.mockResolvedValue({ data: { notification_status: true } });
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <NotificationProvider>{children}</NotificationProvider>
  );

  it('should throw when used outside provider', () => {
    expect(() => {
      renderHook(() => useNotificationContext());
    }).toThrow('useNotificationContext must be used inside NotificationProvider');
  });

  it('should provide initial values', () => {
    const { result } = renderHook(() => useNotificationContext(), { wrapper });

    expect(result.current.token).toBe('');
    expect(result.current.notifications).toEqual([]);
    expect(result.current.unreadCount).toBe(0);
    expect(result.current.isEnabled).toBe(true);
  });

  it('should initialize FCM on mount', async () => {
    renderHook(() => useNotificationContext(), { wrapper });

    await waitFor(() => {
      expect(mockInitialize).toHaveBeenCalledWith(
        expect.objectContaining({ onMessageReceived: expect.any(Function) })
      );
    });
  });

  it('should call requestPermission after FCM init when permission not denied', async () => {
    renderHook(() => useNotificationContext(), { wrapper });

    await waitFor(() => {
      expect(mockRequestPermission).toHaveBeenCalled();
    });
  });

  it('should not call requestPermission when permission is denied', async () => {
    Object.defineProperty(window, 'Notification', {
      writable: true,
      configurable: true,
      value: { permission: 'denied' },
    });

    mockRequestPermission.mockClear();
    renderHook(() => useNotificationContext(), { wrapper });

    await waitFor(() => {
      expect(mockInitialize).toHaveBeenCalled();
    });
    // requestPermission should not be called when permission is denied
    expect(mockRequestPermission).not.toHaveBeenCalled();

    // Restore
    Object.defineProperty(window, 'Notification', {
      writable: true,
      configurable: true,
      value: { permission: 'granted', requestPermission: vi.fn().mockResolvedValue('granted') },
    });
  });

  it('should not call requestPermission when FCM init fails', async () => {
    mockInitialize.mockResolvedValue(false);
    mockRequestPermission.mockClear();

    renderHook(() => useNotificationContext(), { wrapper });

    await waitFor(() => {
      expect(mockInitialize).toHaveBeenCalled();
    });
    expect(mockRequestPermission).not.toHaveBeenCalled();
  });

  it('should register FCM token for both user and provider UUID', async () => {
    renderHook(() => useNotificationContext(), { wrapper });

    await waitFor(() => {
      expect(mockRegisterFCMToken).toHaveBeenCalledWith('user-uuid-123', 'test-token-123');
      expect(mockRegisterFCMToken).toHaveBeenCalledWith('provider-uuid-456', 'test-token-123');
    });
  });

  it('should not register provider token when provider UUID matches user UUID', async () => {
    mockGetProvider.mockResolvedValue({ results: [{ uuid: 'user-uuid-123' }] });

    renderHook(() => useNotificationContext(), { wrapper });

    await waitFor(() => {
      expect(mockRegisterFCMToken).toHaveBeenCalledWith('user-uuid-123', 'test-token-123');
    });
    // Should only be called once (for user UUID), not again for provider
    expect(mockRegisterFCMToken).toHaveBeenCalledTimes(1);
  });

  it('should handle provider lookup error silently', async () => {
    mockGetProvider.mockRejectedValue(new Error('Network error'));

    renderHook(() => useNotificationContext(), { wrapper });

    await waitFor(() => {
      expect(mockRegisterFCMToken).toHaveBeenCalledWith('user-uuid-123', 'test-token-123');
    });
  });

  it('should skip token registration when requestPermission returns null', async () => {
    mockRequestPermission.mockResolvedValue(null);

    renderHook(() => useNotificationContext(), { wrapper });

    await waitFor(() => {
      expect(mockRequestPermission).toHaveBeenCalled();
    });
    expect(mockRegisterFCMToken).not.toHaveBeenCalled();
  });

  it('should toggle notifications ON', async () => {
    mockToggleNotificationStatus.mockResolvedValue({ data: { notification_status: true } });

    const { result } = renderHook(() => useNotificationContext(), { wrapper });

    await waitFor(() => {
      expect(mockInitialize).toHaveBeenCalled();
    });

    await act(async () => {
      await result.current.toggleNotifications();
    });

    expect(mockToggleNotificationStatus).toHaveBeenCalledWith('user-uuid-123');
  });

  it('should toggle notifications OFF and clear tokens', async () => {
    mockToggleNotificationStatus.mockResolvedValue({ data: { notification_status: false } });

    const { result } = renderHook(() => useNotificationContext(), { wrapper });

    await waitFor(() => {
      expect(mockInitialize).toHaveBeenCalled();
    });

    await act(async () => {
      await result.current.toggleNotifications();
    });

    expect(mockClearFCMToken).toHaveBeenCalledWith('user-uuid-123');
  });

  it('should handle toggleNotifications error silently', async () => {
    mockToggleNotificationStatus.mockRejectedValue(new Error('Toggle failed'));

    const { result } = renderHook(() => useNotificationContext(), { wrapper });

    await waitFor(() => {
      expect(mockInitialize).toHaveBeenCalled();
    });

    // Should not throw
    await act(async () => {
      await result.current.toggleNotifications();
    });
  });

  it('should show toast and increment unread count on push', async () => {
    let onMessageCallback: any;
    mockInitialize.mockImplementation(async (config: any) => {
      onMessageCallback = config.onMessageReceived;
      return true;
    });

    const { result } = renderHook(() => useNotificationContext(), { wrapper });

    await waitFor(() => {
      expect(onMessageCallback).toBeDefined();
    });

    act(() => {
      onMessageCallback({ data: { type: 'prescription', patientName: 'John Doe', drName: 'Dr. Smith' } });
    });

    expect(result.current.unreadCount).toBeGreaterThan(0);
  });

  it('should deduplicate identical push messages', async () => {
    let onMessageCallback: any;
    mockInitialize.mockImplementation(async (config: any) => {
      onMessageCallback = config.onMessageReceived;
      return true;
    });

    const { result } = renderHook(() => useNotificationContext(), { wrapper });

    await waitFor(() => {
      expect(onMessageCallback).toBeDefined();
    });

    const pushData = { data: { type: 'prescription', patientName: 'Jane' } };

    act(() => {
      onMessageCallback(pushData);
    });
    const countAfterFirst = result.current.unreadCount;

    act(() => {
      onMessageCallback(pushData); // duplicate — should be ignored
    });
    expect(result.current.unreadCount).toBe(countAfterFirst);
  });

  it('should handle SW PUSH_RECEIVED messages', async () => {
    const swListeners: any[] = [];
    Object.defineProperty(navigator, 'serviceWorker', {
      writable: true,
      configurable: true,
      value: {
        addEventListener: vi.fn((_, handler) => swListeners.push(handler)),
        removeEventListener: vi.fn(),
      },
    });

    const { result } = renderHook(() => useNotificationContext(), { wrapper });

    await waitFor(() => {
      expect(swListeners.length).toBeGreaterThan(0);
    });

    act(() => {
      swListeners[0]({ data: { type: 'PUSH_RECEIVED', data: { patientName: 'SW Push' } } });
    });

    expect(result.current.unreadCount).toBeGreaterThan(0);
  });

  it('should render children', () => {
    render(
      <NotificationProvider>
        <div data-testid="child">Hello</div>
      </NotificationProvider>
    );

    expect(screen.getByTestId('child')).toBeInTheDocument();
  });

  it('should create toast with onPrimary that dismisses toast and sets location hash (covers lines 174-176)', async () => {
    let onMessageCallback: any;
    mockInitialize.mockImplementation(async (config: any) => {
      onMessageCallback = config.onMessageReceived;
      return true;
    });

    renderHook(() => useNotificationContext(), { wrapper });

    await waitFor(() => {
      expect(onMessageCallback).toBeDefined();
    });

    mockToast.mockClear();

    act(() => {
      onMessageCallback({ data: { type: 'prescription', patientName: 'Test Patient', drName: 'Dr. Test' } });
    });

    // Toast should have been called with a React element
    expect(mockToast).toHaveBeenCalled();
    const toastElement = mockToast.mock.calls[0][0];

    // Extract onPrimary from the CustomToast props
    const onPrimary = toastElement.props.onPrimary;
    expect(onPrimary).toBeDefined();

    // Call onPrimary to cover lines 174-176
    act(() => {
      onPrimary();
    });

    // Verify window.location.hash was set
    expect(window.location.hash).toBe('#/prescriptions');
  });

  it('should dismiss toast when onSecondary is called (covers line 172)', async () => {
    let onMessageCallback: any;
    mockInitialize.mockImplementation(async (config: any) => {
      onMessageCallback = config.onMessageReceived;
      return true;
    });

    renderHook(() => useNotificationContext(), { wrapper });

    await waitFor(() => {
      expect(onMessageCallback).toBeDefined();
    });

    mockToast.mockClear();

    act(() => {
      onMessageCallback({ data: { type: 'prescription', patientName: 'Patient', drName: 'Dr. X' } });
    });

    expect(mockToast).toHaveBeenCalled();
    const toastElement = mockToast.mock.calls[0][0];
    const onSecondary = toastElement.props.onSecondary;
    expect(onSecondary).toBeDefined();

    act(() => {
      onSecondary();
    });
  });

  it('should build prescription toast with patient name and doctor', async () => {
    let onMessageCallback: any;
    mockInitialize.mockImplementation(async (config: any) => {
      onMessageCallback = config.onMessageReceived;
      return true;
    });

    renderHook(() => useNotificationContext(), { wrapper });
    await waitFor(() => expect(onMessageCallback).toBeDefined());

    mockToast.mockClear();
    act(() => {
      onMessageCallback({
        data: {
          title: 'Prescription shared',
          patientFirstName: 'John',
          patientLastName: 'Doe',
          patientOpenMrsId: 'OP-100',
          drName: 'Dr. Smith',
        },
      });
    });

    expect(mockToast).toHaveBeenCalled();
    const toastEl = mockToast.mock.calls[0][0];
    expect(toastEl.props.title).toBe('Prescription Ready');
    expect(toastEl.props.primaryLabel).toBe('Review Prescription');
    // message should contain patient and doctor info
    const msg = toastEl.props.message;
    expect(msg).toContain('John Doe (OP-100)');
    expect(msg).toContain('Dr. Smith');
  });

  it('should build prescription toast with default doctor when not provided', async () => {
    let onMessageCallback: any;
    mockInitialize.mockImplementation(async (config: any) => {
      onMessageCallback = config.onMessageReceived;
      return true;
    });

    renderHook(() => useNotificationContext(), { wrapper });
    await waitFor(() => expect(onMessageCallback).toBeDefined());

    mockToast.mockClear();
    act(() => {
      onMessageCallback({
        data: { patientName: 'Jane' },
      });
    });

    const msg = mockToast.mock.calls[0][0].props.message;
    expect(msg).toContain('Prescription received');
    expect(msg).toContain('from Doctor');
  });

  it('should build follow-up toast with correct config', async () => {
    let onMessageCallback: any;
    mockInitialize.mockImplementation(async (config: any) => {
      onMessageCallback = config.onMessageReceived;
      return true;
    });

    renderHook(() => useNotificationContext(), { wrapper });
    await waitFor(() => expect(onMessageCallback).toBeDefined());

    mockToast.mockClear();

    act(() => {
      onMessageCallback({
        data: {
          type: 'followup',
          patientFirstName: 'Alice',
          patientOpenMrsId: 'OP-200',
          drName: 'Dr. Patel',
        },
      });
    });

    expect(mockToast).toHaveBeenCalled();
    const toastEl = mockToast.mock.calls[0][0];
    expect(toastEl.props.title).toBe('Follow-up Scheduled');
    expect(toastEl.props.primaryLabel).toBe('Start Consulation');

    const msg = toastEl.props.message;
    expect(msg).toContain('Alice (OP-200)');
    expect(msg).toContain('Follow-up scheduled');

    // Check toast options for blue border
    const toastOpts = mockToast.mock.calls[0][1];
    expect(toastOpts.style.borderLeft).toContain('#3b82f6');
  });

  it('should build appointment toast with patient and doctor', async () => {
    let onMessageCallback: any;
    mockInitialize.mockImplementation(async (config: any) => {
      onMessageCallback = config.onMessageReceived;
      return true;
    });

    renderHook(() => useNotificationContext(), { wrapper });
    await waitFor(() => expect(onMessageCallback).toBeDefined());

    mockToast.mockClear();
    act(() => {
      onMessageCallback({
        data: {
          type: 'appointment',
          patientFirstName: 'Frank',
          patientLastName: 'Miller',
          patientOpenMrsId: 'OP-300',
          doctorName: 'Dr. Lee',
        },
      });
    });

    expect(mockToast).toHaveBeenCalled();
    const toastEl = mockToast.mock.calls[0][0];
    expect(toastEl.props.title).toBe('Appointment Update');
    expect(toastEl.props.primaryLabel).toBe('View Appointments');

    const msg = toastEl.props.message;
    expect(msg).toContain('Frank Miller (OP-300)');
    expect(msg).toContain('Dr. Lee');

    const toastOpts = mockToast.mock.calls[0][1];
    expect(toastOpts.style.borderLeft).toContain('#f59e0b');
  });

  it('should build appointment toast with default doctor when not provided', async () => {
    let onMessageCallback: any;
    mockInitialize.mockImplementation(async (config: any) => {
      onMessageCallback = config.onMessageReceived;
      return true;
    });

    renderHook(() => useNotificationContext(), { wrapper });
    await waitFor(() => expect(onMessageCallback).toBeDefined());

    mockToast.mockClear();
    act(() => {
      onMessageCallback({
        data: { type: 'appointment' },
      });
    });

    const toastEl = mockToast.mock.calls[0][0];
    expect(toastEl.props.title).toBe('Appointment Update');
    const msg = toastEl.props.message;
    expect(msg).toContain('Prescription received');
    expect(msg).toContain('from Doctor');
  });

  it('should detect type from explicit type field', async () => {
    let onMessageCallback: any;
    mockInitialize.mockImplementation(async (config: any) => {
      onMessageCallback = config.onMessageReceived;
      return true;
    });

    renderHook(() => useNotificationContext(), { wrapper });
    await waitFor(() => expect(onMessageCallback).toBeDefined());

    mockToast.mockClear();
    act(() => {
      onMessageCallback({ data: { type: 'appointment' } });
    });

    expect(mockToast.mock.calls[0][0].props.title).toBe('Appointment Update');
  });

  it('should navigate to appointment route on onPrimary for appointment toast', async () => {
    let onMessageCallback: any;
    mockInitialize.mockImplementation(async (config: any) => {
      onMessageCallback = config.onMessageReceived;
      return true;
    });

    renderHook(() => useNotificationContext(), { wrapper });
    await waitFor(() => expect(onMessageCallback).toBeDefined());

    mockToast.mockClear();
    act(() => {
      onMessageCallback({ data: { type: 'appointment' } });
    });

    const onPrimary = mockToast.mock.calls[0][0].props.onPrimary;
    act(() => onPrimary());
    expect(window.location.hash).toBe('#/my-appointments');
  });

  it('should navigate to dashboard on onPrimary for followup toast', async () => {
    let onMessageCallback: any;
    mockInitialize.mockImplementation(async (config: any) => {
      onMessageCallback = config.onMessageReceived;
      return true;
    });

    renderHook(() => useNotificationContext(), { wrapper });
    await waitFor(() => expect(onMessageCallback).toBeDefined());

    mockToast.mockClear();
    act(() => {
      onMessageCallback({ data: { type: 'followup' } });
    });

    const onPrimary = mockToast.mock.calls[0][0].props.onPrimary;
    act(() => onPrimary());
    expect(window.location.hash).toBe('#/dashboard');
  });

  it('should skip toggleNotifications when no UUID', async () => {
    // Override storage mock to return no uuid
    const storageModule = await import('../../utils/storage');
    const origGetUser = storageModule.storage.getUser;
    (storageModule.storage as any).getUser = () => JSON.stringify({});

    const { result } = renderHook(() => useNotificationContext(), { wrapper });

    await waitFor(() => {
      expect(mockInitialize).toHaveBeenCalled();
    });

    await act(async () => {
      await result.current.toggleNotifications();
    });

    // toggleNotificationStatus should NOT have been called
    expect(mockToggleNotificationStatus).not.toHaveBeenCalled();

    // Restore
    (storageModule.storage as any).getUser = origGetUser;
  });

  it('should handle push with no data (undefined pushData)', async () => {
    let onMessageCallback: any;
    mockInitialize.mockImplementation(async (config: any) => {
      onMessageCallback = config.onMessageReceived;
      return true;
    });

    const { result } = renderHook(() => useNotificationContext(), { wrapper });
    await waitFor(() => expect(onMessageCallback).toBeDefined());

    const countBefore = result.current.unreadCount;
    mockToast.mockClear();

    // Send payload with no .data — simulates edge case
    act(() => {
      onMessageCallback({});
    });

    // handlePush receives undefined, showCustomToast should NOT be called
    // but unreadCount still increments
    expect(result.current.unreadCount).toBe(countBefore + 1);
  });

  it('should handle showCustomToast with nested data wrapper', async () => {
    let onMessageCallback: any;
    mockInitialize.mockImplementation(async (config: any) => {
      onMessageCallback = config.onMessageReceived;
      return true;
    });

    renderHook(() => useNotificationContext(), { wrapper });
    await waitFor(() => expect(onMessageCallback).toBeDefined());

    mockToast.mockClear();

    // Send data with nested .data property — tests pushData?.data branch
    act(() => {
      onMessageCallback({
        data: {
          data: { type: 'prescription', patientName: 'Nested Patient' },
        },
      });
    });

    expect(mockToast).toHaveBeenCalled();
  });

  it('should fallback to prescription config for unknown type', async () => {
    let onMessageCallback: any;
    mockInitialize.mockImplementation(async (config: any) => {
      onMessageCallback = config.onMessageReceived;
      return true;
    });

    renderHook(() => useNotificationContext(), { wrapper });
    await waitFor(() => expect(onMessageCallback).toBeDefined());

    mockToast.mockClear();
    act(() => {
      onMessageCallback({ data: { type: 'unknown_type' } });
    });

    expect(mockToast.mock.calls[0][0].props.title).toBe('Prescription Ready');
  });

  it('should handle toggle OFF with provider lookup failure silently', async () => {
    mockToggleNotificationStatus.mockResolvedValue({ data: { notification_status: false } });
    mockGetProvider.mockRejectedValue(new Error('Provider error'));

    const { result } = renderHook(() => useNotificationContext(), { wrapper });

    await waitFor(() => {
      expect(mockInitialize).toHaveBeenCalled();
    });

    await act(async () => {
      await result.current.toggleNotifications();
    });

    // Should still clear user token despite provider error
    expect(mockClearFCMToken).toHaveBeenCalledWith('user-uuid-123');
  });
});
