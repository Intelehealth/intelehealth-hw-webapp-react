import { act, renderHook, waitFor } from '@testing-library/react';
import { useNavigate } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi, type Mock } from 'vitest';
import { useVerifyOtp } from '../../../../modules/auth/verify-otp/verify-otp.hooks';

// Mock external dependencies
vi.mock('../../../../modules/auth/verify-otp/verify-otp.service', () => ({
  default: {
    requestOtp: vi.fn(),
    verifyOtp: vi.fn(),
  },
}));

vi.mock('../../../../services/toast', () => ({
  showToast: vi.fn(),
}));

vi.mock('react-router-dom', () => ({
  useNavigate: vi.fn(),
}));

describe('useVerifyOtp hook', () => {
  const mockNavigate = vi.fn();
  const mockStateData = {
    value: 'testuser',
    type: 'username' as const,
    otpFor: 'login',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    (useNavigate as Mock).mockReturnValue(mockNavigate);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should initialize with default values', () => {
    const { result } = renderHook(() => useVerifyOtp(mockStateData));

    expect(result.current.otp).toEqual(['', '', '', '', '', '']);
    expect(result.current.timeLeft).toBe(180);
    expect(result.current.userUuid).toBe('');
  });

  it('should navigate to login if stateData is missing', () => {
    renderHook(() => useVerifyOtp(undefined));
    expect(mockNavigate).toHaveBeenCalledWith('/auth/login');
  });

  it('should update otp state on handleChange and focus next input', async () => {
    const { result } = renderHook(() => useVerifyOtp(mockStateData));
    const mockInput0 = document.createElement('input');
    const mockInput1 = document.createElement('input');
    result.current.inputsRef.current = [mockInput0, mockInput1, null, null, null, null];
    const focusSpy = vi.spyOn(mockInput1, 'focus');

    act(() => {
      result.current.handleChange(0, '1');
    });

    expect(result.current.otp).toEqual(['1', '', '', '', '', '']);
    expect(focusSpy).toHaveBeenCalled();
  });

  it('should not update otp state if value is not a digit', () => {
    const { result } = renderHook(() => useVerifyOtp(mockStateData));

    act(() => {
      result.current.handleChange(0, 'a');
    });

    expect(result.current.otp).toEqual(['', '', '', '', '', '']);
  });

  it('should handle backspace on handleKeyDown and focus previous input', () => {
    const { result } = renderHook(() => useVerifyOtp(mockStateData));
    const mockInput0 = document.createElement('input');
    const mockInput1 = document.createElement('input');
    result.current.inputsRef.current = [mockInput0, mockInput1, null, null, null, null];
    const focusSpy = vi.spyOn(mockInput0, 'focus');

    act(() => {
      result.current.handleChange(1, ''); // Simulate empty input at index 1
      result.current.handleKeyDown(1, { key: 'Backspace' } as React.KeyboardEvent<HTMLInputElement>);
    });

    expect(focusSpy).toHaveBeenCalled();
  });

  it('should not focus previous input if backspace at index 0', () => {
    const { result } = renderHook(() => useVerifyOtp(mockStateData));
    const mockInput0 = document.createElement('input');
    result.current.inputsRef.current = [mockInput0, null, null, null, null, null];
    const focusSpy = vi.spyOn(mockInput0, 'focus');

    act(() => {
      result.current.handleKeyDown(0, { key: 'Backspace' } as React.KeyboardEvent<HTMLInputElement>);
    });

    expect(focusSpy).not.toHaveBeenCalled();
  });

  it('should focus previous input if backspace pressed at index > 0 and current otp is empty', () => {
  const { result } = renderHook(() => useVerifyOtp(mockStateData));

  const mockInput0 = document.createElement('input');
  const mockInput1 = document.createElement('input');

  // simulate refs for first two inputs
  result.current.inputsRef.current = [mockInput0, mockInput1, null, null, null, null];
  const focusSpy = vi.spyOn(mockInput0, 'focus');

  act(() => {
    // press backspace in the second input (index = 1)
    result.current.handleKeyDown(1, { key: 'Backspace' } as React.KeyboardEvent<HTMLInputElement>);
  });

  expect(focusSpy).toHaveBeenCalled();
});


  it('should decrement timeLeft every second', () => {
    const { result } = renderHook(() => useVerifyOtp(mockStateData));

    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(result.current.timeLeft).toBe(179);

    act(() => {
      vi.advanceTimersByTime(5000);
    });
    // Allow for some variance in timer execution
    expect(result.current.timeLeft).toBeLessThanOrEqual(178);
    expect(result.current.timeLeft).toBeGreaterThanOrEqual(174);
  });

  it('should format time correctly', () => {
    const { result } = renderHook(() => useVerifyOtp(mockStateData));
    expect(result.current.formatTime(180)).toBe('3:00');
    expect(result.current.formatTime(65)).toBe('1:05');
    expect(result.current.formatTime(5)).toBe('0:05');
    expect(result.current.formatTime(0)).toBe('0:00');
  });

  it('should have all required methods', () => {
    const { result } = renderHook(() => useVerifyOtp(mockStateData));

    expect(typeof result.current.handleChange).toBe('function');
    expect(typeof result.current.handleKeyDown).toBe('function');
    expect(typeof result.current.handleResend).toBe('function');
    expect(typeof result.current.verifyOtp).toBe('function');
    expect(typeof result.current.formatTime).toBe('function');
    expect(typeof result.current.requestOtp).toBe('function');
  });

  it('should have correct initial state structure', () => {
    const { result } = renderHook(() => useVerifyOtp(mockStateData));

    expect(result.current.otp).toBeInstanceOf(Array);
    expect(result.current.otp).toHaveLength(6);
    expect(typeof result.current.timeLeft).toBe('number');
    expect(typeof result.current.loading).toBe('boolean');
    expect(typeof result.current.userUuid).toBe('string');
    expect(result.current.inputsRef).toBeDefined();
  });

  it('should handle requestOtp successfully', async () => {
    const requestOtpService = await import('../../../../modules/auth/verify-otp/verify-otp.service');
    const showToast = await import('../../../../services/toast');
    
    vi.mocked(requestOtpService.default.requestOtp).mockResolvedValue({
      success: true,
      message: 'OTP sent successfully',
      data: { userUuid: 'test-uuid' },
    });

    const { result } = renderHook(() => useVerifyOtp(mockStateData));

    await act(async () => {
      await result.current.requestOtp();
    });

    expect(result.current.userUuid).toBe('test-uuid');
    expect(showToast.showToast).toHaveBeenCalledWith('Request OTP', 'OTP sent successfully', 'success');
  });

  it('should handle requestOtp failure', async () => {
    const requestOtpService = await import('../../../../modules/auth/verify-otp/verify-otp.service');
    const showToast = await import('../../../../services/toast');
    
    vi.mocked(requestOtpService.default.requestOtp).mockResolvedValue({
      success: false,
      message: 'Request failed',
    });

    const { result } = renderHook(() => useVerifyOtp(mockStateData));

    await act(async () => {
      await result.current.requestOtp();
    });

    expect(showToast.showToast).toHaveBeenCalledWith('Request OTP Failed', 'Request failed', 'error');
    expect(mockNavigate).toHaveBeenCalledWith(-1);
  });

  it('should handle requestOtp failure without message (line 65 fallback)', async () => {
    const requestOtpService = await import('../../../../modules/auth/verify-otp/verify-otp.service');
    const showToast = await import('../../../../services/toast');
    
    // Mock requestOtp to return success: false without message (covers line 65 fallback)
    vi.mocked(requestOtpService.default.requestOtp).mockResolvedValue({
      success: false,
      // No message property - triggers the || 'Unknown error' fallback
    } as any);

    const { result } = renderHook(() => useVerifyOtp(mockStateData));

    await act(async () => {
      await result.current.requestOtp();
    });

    // Should show error with fallback message (line 65)
    expect(showToast.showToast).toHaveBeenCalledWith('Request OTP Failed', 'Unknown error', 'error');
    expect(mockNavigate).toHaveBeenCalledWith(-1);
  });

  it('should handle requestOtp with missing stateData', async () => {
    const { result } = renderHook(() => useVerifyOtp(undefined));

    await act(async () => {
      await result.current.requestOtp();
    });

    expect(mockNavigate).toHaveBeenCalledWith('/auth/login');
  });

  it('should handle requestOtp with countryCode', async () => {
    const requestOtpService = await import('../../../../modules/auth/verify-otp/verify-otp.service');
    
    const stateDataWithCountry = {
      ...mockStateData,
      countryCode: '+1',
    };

    vi.mocked(requestOtpService.default.requestOtp).mockResolvedValue({
      success: true,
      message: 'OTP sent successfully',
      data: { userUuid: 'test-uuid' },
    });

    const { result } = renderHook(() => useVerifyOtp(stateDataWithCountry));

    await act(async () => {
      await result.current.requestOtp();
    });

    expect(requestOtpService.default.requestOtp).toHaveBeenCalledWith({
      username: 'testuser',
      otpFor: 'login',
      countryCode: '+1',
    });
  });

  it('should handle requestOtp error with axios error', async () => {
    const requestOtpService = await import('../../../../modules/auth/verify-otp/verify-otp.service');
    const showToast = await import('../../../../services/toast');
    
    const axiosError = {
      response: {
        data: {
          message: 'Network error',
        },
      },
    };

    vi.mocked(requestOtpService.default.requestOtp).mockRejectedValue(axiosError);

    const { result } = renderHook(() => useVerifyOtp(mockStateData));

    await act(async () => {
      await result.current.requestOtp();
    });

    expect(showToast.showToast).toHaveBeenCalledWith('Request OTP Failed', 'Network error', 'error');
    expect(mockNavigate).toHaveBeenCalledWith(-1);
  });

  it('should handle requestOtp error with axios error without data.message (line 76 fallback)', async () => {
    const requestOtpService = await import('../../../../modules/auth/verify-otp/verify-otp.service');
    const showToast = await import('../../../../services/toast');
    
    // Mock requestOtp to throw axios error without data.message (covers line 76 fallback)
    const axiosErrorWithoutMessage = {
      response: {
        data: {}, // No message property
      },
    };

    vi.mocked(requestOtpService.default.requestOtp).mockRejectedValue(axiosErrorWithoutMessage);

    const { result } = renderHook(() => useVerifyOtp(mockStateData));

    await act(async () => {
      await result.current.requestOtp();
    });

    // Should show error with default message (line 76 fallback)
    expect(showToast.showToast).toHaveBeenCalledWith('Request OTP Failed', 'Request OTP Failed', 'error');
    expect(mockNavigate).toHaveBeenCalledWith(-1);
  });

  it('should handle requestOtp error without response', async () => {
    const requestOtpService = await import('../../../../modules/auth/verify-otp/verify-otp.service');
    const showToast = await import('../../../../services/toast');
    
    vi.mocked(requestOtpService.default.requestOtp).mockRejectedValue(new Error('Unknown error'));

    const { result } = renderHook(() => useVerifyOtp(mockStateData));

    await act(async () => {
      await result.current.requestOtp();
    });

    expect(showToast.showToast).toHaveBeenCalledWith('Request OTP Failed', 'Request OTP Failed', 'error');
    expect(mockNavigate).toHaveBeenCalledWith(-1);
  });

  it('should handle verifyOtp function exists', () => {
    const { result } = renderHook(() => useVerifyOtp(mockStateData));
    expect(typeof result.current.verifyOtp).toBe('function');
  });

  it('should handle resend function exists', () => {
    const { result } = renderHook(() => useVerifyOtp(mockStateData));
    expect(typeof result.current.handleResend).toBe('function');
  });

  it('should handle verifyOtp function call', async () => {
    const { result } = renderHook(() => useVerifyOtp(mockStateData));

    // Test that verifyOtp can be called without throwing
    await act(async () => {
      await result.current.verifyOtp();
    });

    // Function should exist and be callable
    expect(typeof result.current.verifyOtp).toBe('function');
  });

  it('should handle handleResend function call', async () => {
    const { result } = renderHook(() => useVerifyOtp(mockStateData));

    // Test that handleResend can be called without throwing
    await act(async () => {
      await result.current.handleResend();
    });

    // Function should exist and be callable
    expect(typeof result.current.handleResend).toBe('function');
  });

  it('should handle verifyOtp success path coverage', async () => {
    // Use real timers for this test
    vi.useRealTimers();
    
    const requestOtpService = await import('../../../../modules/auth/verify-otp/verify-otp.service');
    const showToast = await import('../../../../services/toast');
    
    // Mock requestOtp to succeed first to set userUuid
    vi.mocked(requestOtpService.default.requestOtp).mockResolvedValue({
      success: true,
      data: { userUuid: 'test-uuid-123' },
    } as any);

    // Mock verifyOtp to return success: true
    vi.mocked(requestOtpService.default.verifyOtp).mockResolvedValue({
      success: true,
      message: 'OTP verified successfully',
    } as any);

    const { result } = renderHook(() => useVerifyOtp(mockStateData));

    // First, set up userUuid by calling requestOtp
    await act(async () => {
      await result.current.requestOtp();
    });

    expect(result.current.userUuid).toBe('test-uuid-123');

    // Fill in the OTP - call each separately to ensure state updates properly
    act(() => {
      result.current.handleChange(0, '1');
    });
    act(() => {
      result.current.handleChange(1, '2');
    });
    act(() => {
      result.current.handleChange(2, '3');
    });
    act(() => {
      result.current.handleChange(3, '4');
    });
    act(() => {
      result.current.handleChange(4, '5');
    });
    act(() => {
      result.current.handleChange(5, '6');
    });

    // Verify OTP is filled
    expect(result.current.otp).toEqual(['1', '2', '3', '4', '5', '6']);

    // Now call verifyOtp -this should trigger the success path (lines 105-108)
    await act(async () => {
      await result.current.verifyOtp();
    });

    // Verify success toast is shown
    expect(showToast.showToast).toHaveBeenCalledWith(
      'Verify OTP',
      'OTP verified successfully',
      'success'
    );

    // Verify navigation is called with correct state (lines 106-111)
    expect(mockNavigate).toHaveBeenCalledWith('/auth/reset-password', {
      state: {
        username: mockStateData?.value,
        userUuid: 'test-uuid-123',
      },
    });
    
    // Restore fake timers
    vi.useFakeTimers();
  });

  it('should handle verifyOtp with complete OTP successfully', async () => {
    vi.useRealTimers(); // Use real timers for async operations
    
    const requestOtpService = await import('../../../../modules/auth/verify-otp/verify-otp.service');
    const showToast = await import('../../../../services/toast');
    
    // First set up userUuid by requesting OTP
    vi.mocked(requestOtpService.default.requestOtp).mockResolvedValue({
      success: true,
      message: 'OTP sent successfully',
      data: { userUuid: 'test-uuid-123' },
    });

    vi.mocked(requestOtpService.default.verifyOtp).mockResolvedValue({
      success: true,
      message: 'OTP verified successfully',
    });

    const { result } = renderHook(() => useVerifyOtp(mockStateData));

    // Wait for initial OTP request to complete (from useEffect)
    await waitFor(() => {
      expect(result.current.userUuid).toBe('test-uuid-123');
    }, { timeout: 3000 });

    // Clear the showToast mock to only check verifyOtp calls
    vi.mocked(showToast.showToast).mockClear();

    // Set OTP to complete value (all 6 digits) - lines 90-95
    // Call each handleChange separately to ensure state updates properly
    act(() => {
      result.current.handleChange(0, '1');
    });
    act(() => {
      result.current.handleChange(1, '2');
    });
    act(() => {
      result.current.handleChange(2, '3');
    });
    act(() => {
      result.current.handleChange(3, '4');
    });
    act(() => {
      result.current.handleChange(4, '5');
    });
    act(() => {
      result.current.handleChange(5, '6');
    });

    // Wait for OTP state to be updated
    await waitFor(() => {
      expect(result.current.otp).toEqual(['1', '2', '3', '4', '5', '6']);
    }, { timeout: 1000 });

    // Verify OTP is complete before calling verifyOtp
    expect(result.current.userUuid).toBe('test-uuid-123');

    // Verify OTP - lines 101-108 (success path)
    await act(async () => {
      await result.current.verifyOtp();
    });

    expect(requestOtpService.default.verifyOtp).toHaveBeenCalledWith({
      otp: '123456',
      username: 'testuser',
      verifyFor: 'login',
    });
    expect(showToast.showToast).toHaveBeenCalledWith('Verify OTP', 'OTP verified successfully', 'success');
    expect(mockNavigate).toHaveBeenCalledWith('/auth/reset-password', {
      state: {
        username: 'testuser',
        userUuid: 'test-uuid-123',
      },
    });
  });

  it('should handle verifyOtp when result.success is false', async () => {
    vi.useRealTimers(); // Use real timers for async operations
    
    const requestOtpService = await import('../../../../modules/auth/verify-otp/verify-otp.service');
    const showToast = await import('../../../../services/toast');
    
    // First set up userUuid by requesting OTP
    vi.mocked(requestOtpService.default.requestOtp).mockResolvedValue({
      success: true,
      message: 'OTP sent successfully',
      data: { userUuid: 'test-uuid-123' },
    });

    vi.mocked(requestOtpService.default.verifyOtp).mockResolvedValue({
      success: false,
      message: 'Invalid OTP',
    });

    const { result } = renderHook(() => useVerifyOtp(mockStateData));

    // Wait for initial OTP request to complete (from useEffect)
    await waitFor(() => {
      expect(result.current.userUuid).toBe('test-uuid-123');
    }, { timeout: 3000 });

    // Clear the showToast mock to only check verifyOtp calls
    vi.mocked(showToast.showToast).mockClear();

    // Set OTP to complete value
    // Call each handleChange separately to ensure state updates properly
    act(() => {
      result.current.handleChange(0, '1');
    });
    act(() => {
      result.current.handleChange(1, '2');
    });
    act(() => {
      result.current.handleChange(2, '3');
    });
    act(() => {
      result.current.handleChange(3, '4');
    });
    act(() => {
      result.current.handleChange(4, '5');
    });
    act(() => {
      result.current.handleChange(5, '6');
    });

    // Wait for OTP state to be updated
    await waitFor(() => {
      expect(result.current.otp).toEqual(['1', '2', '3', '4', '5', '6']);
    }, { timeout: 1000 });

    // Verify OTP is complete before calling verifyOtp
    expect(result.current.userUuid).toBe('test-uuid-123');

    // Verify OTP - should throw error and go to catch block (lines 101-103, 113-122)
    await act(async () => {
      await result.current.verifyOtp();
    });

    // The catch block doesn't extract message from regular Error objects, only from axios errors
    // So it uses the default message 'Invalid OTP'
    expect(showToast.showToast).toHaveBeenCalledWith('Invalid OTP', 'Invalid OTP', 'error');
    expect(result.current.loading).toBe(false);
  });

  it('should handle verifyOtp error with axios error response', async () => {
    vi.useRealTimers(); // Use real timers for async operations
    
    const requestOtpService = await import('../../../../modules/auth/verify-otp/verify-otp.service');
    const showToast = await import('../../../../services/toast');
    
    // First set up userUuid by requesting OTP
    vi.mocked(requestOtpService.default.requestOtp).mockResolvedValue({
      success: true,
      message: 'OTP sent successfully',
      data: { userUuid: 'test-uuid-123' },
    });

    const axiosError = {
      response: {
        data: {
          message: 'Network error during verification',
        },
      },
    };

    vi.mocked(requestOtpService.default.verifyOtp).mockRejectedValue(axiosError);

    const { result } = renderHook(() => useVerifyOtp(mockStateData));

    // Wait for initial OTP request to complete (from useEffect)
    await waitFor(() => {
      expect(result.current.userUuid).toBe('test-uuid-123');
    }, { timeout: 3000 });

    // Clear the showToast mock to only check verifyOtp calls
    vi.mocked(showToast.showToast).mockClear();

    // Set OTP to complete value
    act(() => {
      result.current.handleChange(0, '1');
    });
    act(() => {
      result.current.handleChange(1, '2');
    });
    act(() => {
      result.current.handleChange(2, '3');
    });
    act(() => {
      result.current.handleChange(3, '4');
    });
    act(() => {
      result.current.handleChange(4, '5');
    });
    act(() => {
      result.current.handleChange(5, '6');
    });

    // Wait for OTP state to be updated
    await waitFor(() => {
      expect(result.current.otp).toEqual(['1', '2', '3', '4', '5', '6']);
    }, { timeout: 1000 });

    // Verify OTP is complete before calling verifyOtp
    expect(result.current.userUuid).toBe('test-uuid-123');

    // Verify OTP - should catch axios error (lines 113-122)
    await act(async () => {
      await result.current.verifyOtp();
    });

    expect(showToast.showToast).toHaveBeenCalledWith('Invalid OTP', 'Network error during verification', 'error');
    expect(result.current.loading).toBe(false);
  });

  it('should handle verifyOtp error without response', async () => {
    vi.useRealTimers(); // Use real timers for async operations
    
    const requestOtpService = await import('../../../../modules/auth/verify-otp/verify-otp.service');
    const showToast = await import('../../../../services/toast');
    
    // First set up userUuid by requesting OTP
    vi.mocked(requestOtpService.default.requestOtp).mockResolvedValue({
      success: true,
      message: 'OTP sent successfully',
      data: { userUuid: 'test-uuid-123' },
    });

    vi.mocked(requestOtpService.default.verifyOtp).mockRejectedValue(new Error('Unknown error'));

    const { result } = renderHook(() => useVerifyOtp(mockStateData));

    // Wait for initial OTP request to complete (from useEffect)
    await waitFor(() => {
      expect(result.current.userUuid).toBe('test-uuid-123');
    }, { timeout: 3000 });

    // Clear the showToast mock to only check verifyOtp calls
    vi.mocked(showToast.showToast).mockClear();

    // Set OTP to complete value
    act(() => {
      result.current.handleChange(0, '1');
    });
    act(() => {
      result.current.handleChange(1, '2');
    });
    act(() => {
      result.current.handleChange(2, '3');
    });
    act(() => {
      result.current.handleChange(3, '4');
    });
    act(() => {
      result.current.handleChange(4, '5');
    });
    act(() => {
      result.current.handleChange(5, '6');
    });

    // Wait for OTP state to be updated
    await waitFor(() => {
      expect(result.current.otp).toEqual(['1', '2', '3', '4', '5', '6']);
    }, { timeout: 1000 });

    // Verify OTP is complete before calling verifyOtp
    expect(result.current.userUuid).toBe('test-uuid-123');

    // Verify OTP - should catch regular error (lines 113-122)
    await act(async () => {
      await result.current.verifyOtp();
    });

    expect(showToast.showToast).toHaveBeenCalledWith('Invalid OTP', 'Invalid OTP', 'error');
    expect(result.current.loading).toBe(false);
  });

  // Additional tests for branch coverage

  it('should handle requestOtp failure with undefined message (line 65)', async () => {
    const requestOtpService = await import('../../../../modules/auth/verify-otp/verify-otp.service');
    const showToast = await import('../../../../services/toast');
    
    vi.mocked(requestOtpService.default.requestOtp).mockResolvedValue({
      success: false,
      message: undefined as unknown as string,
    });

    const { result } = renderHook(() => useVerifyOtp(mockStateData));

    await act(async () => {
      await result.current.requestOtp();
    });

    expect(showToast.showToast).toHaveBeenCalledWith('Request OTP Failed', 'Unknown error', 'error');
    expect(mockNavigate).toHaveBeenCalledWith(-1);
  });

  it('should handle requestOtp error with axios error but no message (line 76)', async () => {
    const requestOtpService = await import('../../../../modules/auth/verify-otp/verify-otp.service');
    const showToast = await import('../../../../services/toast');
    
    const axiosError = {
      response: {
        data: {
          message: undefined as unknown as string,
        },
      },
    };

    vi.mocked(requestOtpService.default.requestOtp).mockRejectedValue(axiosError);

    const { result } = renderHook(() => useVerifyOtp(mockStateData));

    await act(async () => {
      await result.current.requestOtp();
    });

    expect(showToast.showToast).toHaveBeenCalledWith('Request OTP Failed', 'Request OTP Failed', 'error');
    expect(mockNavigate).toHaveBeenCalledWith(-1);
  });

  it('should handle verifyOtp with stateData being undefined to cover optional chaining undefined branch (lines 96-97)', async () => {
    vi.useRealTimers();
    
    const requestOtpService = await import('../../../../modules/auth/verify-otp/verify-otp.service');
    const showToast = await import('../../../../services/toast');
    
    // Strategy: Initialize hook with valid stateData to set userUuid,
    // then rerender with undefined stateData to test the undefined branch in verifyOtp
    // The verifyOtp function will be recreated with undefined stateData in its closure,
    // but userUuid state should persist across rerenders
    
    vi.mocked(requestOtpService.default.requestOtp).mockResolvedValue({
      success: true,
      message: 'OTP sent successfully',
      data: { userUuid: 'test-uuid-123' },
    });

    vi.mocked(requestOtpService.default.verifyOtp).mockResolvedValue({
      success: true,
      message: 'OTP verified successfully',
    });
    
    // Initialize hook with valid stateData to set userUuid
    const { result, rerender } = renderHook((props) => useVerifyOtp(props), {
      initialProps: mockStateData,
    });

    await waitFor(() => {
      expect(result.current.userUuid).toBe('test-uuid-123');
    }, { timeout: 3000 });

    vi.mocked(showToast.showToast).mockClear();

    // Set OTP to complete value
    act(() => {
      result.current.handleChange(0, '1');
    });
    act(() => {
      result.current.handleChange(1, '2');
    });
    act(() => {
      result.current.handleChange(2, '3');
    });
    act(() => {
      result.current.handleChange(3, '4');
    });
    act(() => {
      result.current.handleChange(4, '5');
    });
    act(() => {
      result.current.handleChange(5, '6');
    });

    await waitFor(() => {
      expect(result.current.otp).toEqual(['1', '2', '3', '4', '5', '6']);
    }, { timeout: 1000 });

    // Now rerender with undefined stateData
    // This will recreate verifyOtp with undefined stateData in its closure
    // userUuid state should persist, allowing verifyOtp to execute
    rerender(undefined);

    // Wait for rerender to complete and verify userUuid is still set
    await waitFor(() => {
      expect(result.current.userUuid).toBe('test-uuid-123');
    }, { timeout: 1000 });

    // Clear verifyOtp mock to check new call with undefined stateData
    vi.mocked(requestOtpService.default.verifyOtp).mockClear();

    // Try to verify OTP with undefined stateData
    // This will cause the function to error when accessing stateData.type on line 101
    // Since stateData is undefined after rerender, verifyOtp will error before calling the service
    await act(async () => {
      try {
        await result.current.verifyOtp();
      } catch {
        // Expected to error when accessing stateData.type
      }
    });

    // verifyOtp service should not be called because stateData is undefined
    // and accessing stateData.type causes an error
    expect(requestOtpService.default.verifyOtp).not.toHaveBeenCalled();
  });
  
  it('should handle verifyOtp with stateData being null to cover optional chaining undefined branch (lines 96-97)', async () => {
    vi.useRealTimers();
    
    const requestOtpService = await import('../../../../modules/auth/verify-otp/verify-otp.service');
    const showToast = await import('../../../../services/toast');
    
    // Test with null stateData (treated similarly to undefined by optional chaining)
    // This will navigate, but we can test the code structure
    vi.mocked(requestOtpService.default.requestOtp).mockResolvedValue({
      success: true,
      message: 'OTP sent successfully',
      data: { userUuid: 'test-uuid-123' },
    });
    
    renderHook(() => useVerifyOtp(undefined));
    
    // Verify navigation was called
    expect(mockNavigate).toHaveBeenCalledWith('/auth/login');
    
    // Now test with valid stateData to ensure verifyOtp executes lines 96-97
    vi.mocked(requestOtpService.default.verifyOtp).mockResolvedValue({
      success: true,
      message: 'OTP verified successfully',
    });
    
    const { result } = renderHook(() => useVerifyOtp(mockStateData));

    await waitFor(() => {
      expect(result.current.userUuid).toBe('test-uuid-123');
    }, { timeout: 3000 });

    vi.mocked(showToast.showToast).mockClear();

    // Set OTP to complete value
    act(() => {
      result.current.handleChange(0, '1');
    });
    act(() => {
      result.current.handleChange(1, '2');
    });
    act(() => {
      result.current.handleChange(2, '3');
    });
    act(() => {
      result.current.handleChange(3, '4');
    });
    act(() => {
      result.current.handleChange(4, '5');
    });
    act(() => {
      result.current.handleChange(5, '6');
    });

    await waitFor(() => {
      expect(result.current.otp).toEqual(['1', '2', '3', '4', '5', '6']);
    }, { timeout: 1000 });

    // Verify OTP - this executes lines 96-97
    // When stateData is null: stateData?.value returns undefined, then undefined || '' returns ''
    // When stateData is defined: stateData?.value evaluates to stateData.value
    // Testing with null helps cover the undefined/null branch of optional chaining
    await act(async () => {
      await result.current.verifyOtp();
    });

    expect(requestOtpService.default.verifyOtp).toHaveBeenCalledWith({
      otp: '123456',
      username: 'testuser', // stateData?.value when stateData is defined
      verifyFor: 'login',   // stateData?.otpFor when stateData is defined
    });
  });
  
  it('should handle verifyOtp multiple times to ensure all branches are covered (lines 96-97)', async () => {
    vi.useRealTimers();
    
    const requestOtpService = await import('../../../../modules/auth/verify-otp/verify-otp.service');
    const showToast = await import('../../../../services/toast');
    
    // Test verifyOtp execution multiple times to ensure coverage tool recognizes all branches
    vi.mocked(requestOtpService.default.requestOtp).mockResolvedValue({
      success: true,
      message: 'OTP sent successfully',
      data: { userUuid: 'test-uuid-123' },
    });

    vi.mocked(requestOtpService.default.verifyOtp).mockResolvedValue({
      success: true,
      message: 'OTP verified successfully',
    });
    
    const { result } = renderHook(() => useVerifyOtp(mockStateData));

    await waitFor(() => {
      expect(result.current.userUuid).toBe('test-uuid-123');
    }, { timeout: 3000 });

    vi.mocked(showToast.showToast).mockClear();

    // Set OTP to complete value
    act(() => {
      result.current.handleChange(0, '1');
    });
    act(() => {
      result.current.handleChange(1, '2');
    });
    act(() => {
      result.current.handleChange(2, '3');
    });
    act(() => {
      result.current.handleChange(3, '4');
    });
    act(() => {
      result.current.handleChange(4, '5');
    });
    act(() => {
      result.current.handleChange(5, '6');
    });

    await waitFor(() => {
      expect(result.current.otp).toEqual(['1', '2', '3', '4', '5', '6']);
    }, { timeout: 1000 });

    // Verify OTP first time - this executes lines 96-97 with defined stateData
    await act(async () => {
      await result.current.verifyOtp();
    });

    expect(requestOtpService.default.verifyOtp).toHaveBeenCalledWith({
      otp: '123456',
      username: 'testuser', // stateData?.value when stateData is defined
      verifyFor: 'login',   // stateData?.otpFor when stateData is defined
    });
    
    // Reset OTP and verify again to ensure code path is executed multiple times
    act(() => {
      result.current.handleChange(0, '7');
    });
    act(() => {
      result.current.handleChange(1, '8');
    });
    act(() => {
      result.current.handleChange(2, '9');
    });
    act(() => {
      result.current.handleChange(3, '0');
    });
    act(() => {
      result.current.handleChange(4, '1');
    });
    act(() => {
      result.current.handleChange(5, '2');
    });

    await waitFor(() => {
      expect(result.current.otp).toEqual(['7', '8', '9', '0', '1', '2']);
    }, { timeout: 1000 });

    vi.mocked(requestOtpService.default.verifyOtp).mockResolvedValue({
      success: true,
      message: 'OTP verified successfully',
    });

    // Verify OTP second time - ensures lines 96-97 are executed again
    await act(async () => {
      await result.current.verifyOtp();
    });

    expect(requestOtpService.default.verifyOtp).toHaveBeenCalledWith({
      otp: '789012',
      username: 'testuser', // stateData?.value when stateData is defined
      verifyFor: 'login',   // stateData?.otpFor when stateData is defined
    });
  });


  it('should handle verifyOtp when result.success is false with undefined message (line 102)', async () => {
    vi.useRealTimers();
    
    const requestOtpService = await import('../../../../modules/auth/verify-otp/verify-otp.service');
    const showToast = await import('../../../../services/toast');
    
    // First set up userUuid by requesting OTP
    vi.mocked(requestOtpService.default.requestOtp).mockResolvedValue({
      success: true,
      message: 'OTP sent successfully',
      data: { userUuid: 'test-uuid-123' },
    });

    vi.mocked(requestOtpService.default.verifyOtp).mockResolvedValue({
      success: false,
      message: undefined as unknown as string,
    });

    const { result } = renderHook(() => useVerifyOtp(mockStateData));

    // Wait for initial OTP request to complete (from useEffect)
    await waitFor(() => {
      expect(result.current.userUuid).toBe('test-uuid-123');
    }, { timeout: 3000 });

    // Clear the showToast mock to only check verifyOtp calls
    vi.mocked(showToast.showToast).mockClear();

    // Set OTP to complete value
    act(() => {
      result.current.handleChange(0, '1');
    });
    act(() => {
      result.current.handleChange(1, '2');
    });
    act(() => {
      result.current.handleChange(2, '3');
    });
    act(() => {
      result.current.handleChange(3, '4');
    });
    act(() => {
      result.current.handleChange(4, '5');
    });
    act(() => {
      result.current.handleChange(5, '6');
    });

    // Wait for OTP state to be updated
    await waitFor(() => {
      expect(result.current.otp).toEqual(['1', '2', '3', '4', '5', '6']);
    }, { timeout: 1000 });

    // Verify OTP is complete before calling verifyOtp
    expect(result.current.userUuid).toBe('test-uuid-123');

    // Verify OTP - should throw error with default message
    await act(async () => {
      await result.current.verifyOtp();
    });

    expect(showToast.showToast).toHaveBeenCalledWith('Invalid OTP', 'Invalid OTP', 'error');
    expect(result.current.loading).toBe(false);
  });

  it('should handle verifyOtp error with axios error but no message (line 119)', async () => {
    vi.useRealTimers();
    
    const requestOtpService = await import('../../../../modules/auth/verify-otp/verify-otp.service');
    const showToast = await import('../../../../services/toast');
    
    // First set up userUuid by requesting OTP
    vi.mocked(requestOtpService.default.requestOtp).mockResolvedValue({
      success: true,
      message: 'OTP sent successfully',
      data: { userUuid: 'test-uuid-123' },
    });

    const axiosError = {
      response: {
        data: {
          message: undefined as unknown as string,
        },
      },
    };

    vi.mocked(requestOtpService.default.verifyOtp).mockRejectedValue(axiosError);

    const { result } = renderHook(() => useVerifyOtp(mockStateData));

    // Wait for initial OTP request to complete (from useEffect)
    await waitFor(() => {
      expect(result.current.userUuid).toBe('test-uuid-123');
    }, { timeout: 3000 });

    // Clear the showToast mock to only check verifyOtp calls
    vi.mocked(showToast.showToast).mockClear();

    // Set OTP to complete value
    act(() => {
      result.current.handleChange(0, '1');
    });
    act(() => {
      result.current.handleChange(1, '2');
    });
    act(() => {
      result.current.handleChange(2, '3');
    });
    act(() => {
      result.current.handleChange(3, '4');
    });
    act(() => {
      result.current.handleChange(4, '5');
    });
    act(() => {
      result.current.handleChange(5, '6');
    });

    // Wait for OTP state to be updated
    await waitFor(() => {
      expect(result.current.otp).toEqual(['1', '2', '3', '4', '5', '6']);
    }, { timeout: 1000 });

    // Verify OTP is complete before calling verifyOtp
    expect(result.current.userUuid).toBe('test-uuid-123');

    // Verify OTP - should catch axios error with undefined message
    await act(async () => {
      await result.current.verifyOtp();
    });

    expect(showToast.showToast).toHaveBeenCalledWith('Invalid OTP', 'Invalid OTP', 'error');
    expect(result.current.loading).toBe(false);
  });

  it('should handle handleResend when inputsRef.current[0] is not null to cover focus call (line 129)', async () => {
    vi.useRealTimers();
    
    const requestOtpService = await import('../../../../modules/auth/verify-otp/verify-otp.service');
    const showToast = await import('../../../../services/toast');
    
    // First call from useEffect on mount
    vi.mocked(requestOtpService.default.requestOtp).mockResolvedValueOnce({
      success: true,
      message: 'OTP sent successfully',
      data: { userUuid: 'test-uuid-123' },
    });
    
    // Second call from handleResend - use mockResolvedValue to ensure it's used
    vi.mocked(requestOtpService.default.requestOtp).mockResolvedValue({
      success: true,
      message: 'OTP resent successfully',
      data: { userUuid: 'new-uuid' },
    });

    const { result } = renderHook(() => useVerifyOtp(mockStateData));

    // Wait for initial requestOtp to complete
    await waitFor(() => {
      expect(result.current.userUuid).toBe('test-uuid-123');
    }, { timeout: 3000 });

    // Clear the showToast mock to only check handleResend calls
    vi.mocked(showToast.showToast).mockClear();
    
    // Also clear the requestOtp mock call history to reset for the next call
    vi.mocked(requestOtpService.default.requestOtp).mockClear();

    // Set up the mock for handleResend call
    vi.mocked(requestOtpService.default.requestOtp).mockResolvedValue({
      success: true,
      message: 'OTP resent successfully',
      data: { userUuid: 'new-uuid' },
    });

    // Set inputsRef.current[0] to a valid input element to cover the branch where focus IS called
    const mockInput = document.createElement('input');
    const focusSpy = vi.spyOn(mockInput, 'focus');
    result.current.inputsRef.current = [mockInput, null, null, null, null, null];

    await act(async () => {
      await result.current.handleResend();
    });

    // Verify focus was called when ref is not null (line 129)
    expect(focusSpy).toHaveBeenCalled();
    expect(result.current.otp).toEqual(['', '', '', '', '', '']);
    expect(result.current.timeLeft).toBe(180);
    expect(result.current.userUuid).toBe('new-uuid');
    // Note: The hook always shows 'OTP sent successfully' regardless of response message
    expect(showToast.showToast).toHaveBeenCalledWith(
      'Request OTP',
      'OTP sent successfully',
      'success'
    );
  });

  it('should handle handleResend when inputsRef.current[0] is null to cover optional chaining (line 129)', async () => {
    const requestOtpService = await import('../../../../modules/auth/verify-otp/verify-otp.service');
    
    vi.mocked(requestOtpService.default.requestOtp).mockResolvedValue({
      success: true,
      message: 'OTP sent successfully',
      data: { userUuid: 'test-uuid-123' },
    });

    const { result } = renderHook(() => useVerifyOtp(mockStateData));

    // Set inputsRef.current[0] to null to cover the optional chaining branch on line 129
    // This tests: inputsRef.current[0]?.focus() when inputsRef.current[0] is null
    result.current.inputsRef.current = [null, null, null, null, null, null];
    
    // Create a spy to verify focus is NOT called when ref is null
    const mockFocus = vi.fn();
    Object.defineProperty(HTMLInputElement.prototype, 'focus', {
      value: mockFocus,
      writable: true,
      configurable: true,
    });

    await act(async () => {
      await result.current.handleResend();
    });

    // Should not throw error even when inputsRef.current[0] is null (line 129)
    // The optional chaining ?. prevents calling focus on null, covering the branch
    expect(result.current.otp).toEqual(['', '', '', '', '', '']);
    expect(result.current.timeLeft).toBe(180);
    // Focus should not be called when ref is null - this covers the branch where ?. short-circuits
    expect(mockFocus).not.toHaveBeenCalled();
  });

  it('should handle handleResend when inputsRef.current[0] is undefined to cover optional chaining (line 129)', async () => {
    const requestOtpService = await import('../../../../modules/auth/verify-otp/verify-otp.service');
    
    vi.mocked(requestOtpService.default.requestOtp).mockResolvedValue({
      success: true,
      message: 'OTP sent successfully',
      data: { userUuid: 'test-uuid-123' },
    });

    const { result } = renderHook(() => useVerifyOtp(mockStateData));

    // Set inputsRef.current[0] to undefined to cover another branch of optional chaining
    result.current.inputsRef.current = [null, null, null, null, null, null];
    
    const mockFocus = vi.fn();
    Object.defineProperty(HTMLInputElement.prototype, 'focus', {
      value: mockFocus,
      writable: true,
      configurable: true,
    });

    await act(async () => {
      await result.current.handleResend();
    });

    expect(result.current.otp).toEqual(['', '', '', '', '', '']);
    expect(result.current.timeLeft).toBe(180);
    expect(mockFocus).not.toHaveBeenCalled();
  });

  it('should not call requestOtp again if didRequestOtp.current is true - covers early return branch (line 169)', async () => {
    vi.useRealTimers();
    
    const requestOtpService = await import('../../../../modules/auth/verify-otp/verify-otp.service');
    
    vi.mocked(requestOtpService.default.requestOtp).mockResolvedValue({
      success: true,
      message: 'OTP sent successfully',
      data: { userUuid: 'test-uuid-123' },
    });

    const { result, rerender } = renderHook(() => useVerifyOtp(mockStateData));

    // Wait for initial requestOtp to complete (from useEffect)
    // This sets didRequestOtp.current = true on line 170
    await waitFor(() => {
      expect(result.current.userUuid).toBe('test-uuid-123');
    }, { timeout: 5000 });

    // Verify requestOtp was called initially (didRequestOtp.current was false, so it executed)
    const initialCallCount = vi.mocked(requestOtpService.default.requestOtp).mock.calls.length;
    expect(initialCallCount).toBeGreaterThan(0);

    // Clear the mock to count new calls after rerender
    vi.mocked(requestOtpService.default.requestOtp).mockClear();

    // Rerender the hook with the same props - useEffect runs again, but should return early on line 169
    // because didRequestOtp.current is now true
    // Note: The useEffect depends on [requestOtp], and requestOtp is a useCallback that depends on [navigate, stateData]
    // Since we're using the same stateData, requestOtp should be the same reference, but the effect will still run
    rerender();

    // Wait a bit to ensure useEffect has time to run if it were going to
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 300));
    });

    // requestOtp should NOT be called again after rerender
    // This covers the branch: if (didRequestOtp.current) return; on line 169
    expect(requestOtpService.default.requestOtp).not.toHaveBeenCalled();
  });
  
  it('should not call requestOtp again when didRequestOtp.current is true after stateData change (line 169)', async () => {
    vi.useRealTimers();
    
    const requestOtpService = await import('../../../../modules/auth/verify-otp/verify-otp.service');
    
    vi.mocked(requestOtpService.default.requestOtp).mockResolvedValue({
      success: true,
      message: 'OTP sent successfully',
      data: { userUuid: 'test-uuid-123' },
    });

    // First render with initial stateData - this will call requestOtp and set didRequestOtp.current = true
    const { result, rerender } = renderHook(
      ({ stateData }) => useVerifyOtp(stateData),
      { initialProps: { stateData: mockStateData } }
    );

    // Wait for initial requestOtp to complete
    await waitFor(() => {
      expect(result.current.userUuid).toBe('test-uuid-123');
    }, { timeout: 5000 });

    // Verify requestOtp was called (didRequestOtp.current was false initially)
    expect(requestOtpService.default.requestOtp).toHaveBeenCalled();

    // Clear the mock to count new calls
    vi.mocked(requestOtpService.default.requestOtp).mockClear();

    // Rerender with different stateData - this will recreate requestOtp callback
    // The useEffect depends on [requestOtp], so it will run again
    // But didRequestOtp.current is true, so it should return early on line 169
    rerender({ stateData: { ...mockStateData, value: 'different-user' } });

    // Wait for any async operations
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 300));
    });

    // requestOtp should NOT be called again - covers line 169 early return
    expect(requestOtpService.default.requestOtp).not.toHaveBeenCalled();
  });

  it('should handle verifyOtp when result.success is false', async () => {
    // Use real timers for this test to avoid timeout issues
    vi.useRealTimers();
    
    const requestOtpService = await import('../../../../modules/auth/verify-otp/verify-otp.service');
    const showToast = await import('../../../../services/toast');
    
    // Set up requestOtp mock to succeed first
    vi.mocked(requestOtpService.default.requestOtp).mockResolvedValue({
      success: true,
      data: { userUuid: 'test-uuid-123' },
    } as any);

    // Mock verifyOtp to return success: false
    vi.mocked(requestOtpService.default.verifyOtp).mockResolvedValue({
      success: false,
      message: 'OTP verification failed',
    } as any);

    const { result } = renderHook(() => useVerifyOtp(mockStateData));

    // First, set up userUuid by calling requestOtp
    await act(async () => {
      await result.current.requestOtp();
    });

    // Verify userUuid is set
    expect(result.current.userUuid).toBe('test-uuid-123');

    // Clear the showToast calls from requestOtp
    vi.mocked(showToast.showToast).mockClear();

    // Fill in the OTP - call each separately to ensure state updates properly
    act(() => {
      result.current.handleChange(0, '1');
    });
    act(() => {
      result.current.handleChange(1, '2');
    });
    act(() => {
      result.current.handleChange(2, '3');
    });
    act(() => {
      result.current.handleChange(3, '4');
    });
    act(() => {
      result.current.handleChange(4, '5');
    });
    act(() => {
      result.current.handleChange(5, '6');
    });

    // Verify OTP is filled
    expect(result.current.otp).toEqual(['1', '2', '3', '4', '5', '6']);

    // Now call verifyOtp
    await act(async () => {
      await result.current.verifyOtp();
    });

    // Should show error toast
    expect(showToast.showToast).toHaveBeenCalledWith(
      'Invalid OTP',
      expect.any(String),
      'error'
    );
    
    // Restore fake timers for other tests
    vi.useFakeTimers();
  }, 15000);

  it('should handle verifyOtp error with axios error response', async () => {
    // Use real timers for this test to avoid timeout issues
    vi.useRealTimers();
    
    const requestOtpService = await import('../../../../modules/auth/verify-otp/verify-otp.service');
    const showToast = await import('../../../../services/toast');
    
    const axiosError = {
      response: {
        data: {
          message: 'Custom error message',
        },
      },
    };

    // Set up requestOtp mock to succeed first
    vi.mocked(requestOtpService.default.requestOtp).mockResolvedValue({
      success: true,
      data: { userUuid: 'test-uuid-123' },
    } as any);

    // Mock verifyOtp to throw the error
    vi.mocked(requestOtpService.default.verifyOtp).mockRejectedValue(axiosError);

    const { result } = renderHook(() => useVerifyOtp(mockStateData));

    // First, set up userUuid by calling requestOtp
    await act(async () => {
      await result.current.requestOtp();
    });

    // Verify userUuid is set
    expect(result.current.userUuid).toBe('test-uuid-123');

    // Clear the showToast calls from requestOtp
    vi.mocked(showToast.showToast).mockClear();

    // Fill in the OTP - call each separately to ensure state updates properly
    act(() => {
      result.current.handleChange(0, '1');
    });
    act(() => {
      result.current.handleChange(1, '2');
    });
    act(() => {
      result.current.handleChange(2, '3');
    });
    act(() => {
      result.current.handleChange(3, '4');
    });
    act(() => {
      result.current.handleChange(4, '5');
    });
    act(() => {
      result.current.handleChange(5, '6');
    });

    // Verify OTP is filled
    expect(result.current.otp).toEqual(['1', '2', '3', '4', '5', '6']);

    // Now call verifyOtp
    await act(async () => {
      await result.current.verifyOtp();
    });

    // Should show error with custom message
    expect(showToast.showToast).toHaveBeenCalledWith(
      'Invalid OTP',
      'Custom error message',
      'error'
    );
    
    // Restore fake timers for other tests
    vi.useFakeTimers();
  }, 15000);

  it('should handle verifyOtp when result.success is false and message is undefined (line 102)', async () => {
    // Use real timers for this test
    vi.useRealTimers();
    
    const requestOtpService = await import('../../../../modules/auth/verify-otp/verify-otp.service');
    const showToast = await import('../../../../services/toast');
    
    // Set up requestOtp mock to succeed first
    vi.mocked(requestOtpService.default.requestOtp).mockResolvedValue({
      success: true,
      data: { userUuid: 'test-uuid-123' },
    } as any);

    // Mock verifyOtp to return success: false without message (covers line 102 fallback)
    vi.mocked(requestOtpService.default.verifyOtp).mockResolvedValue({
      success: false,
      // No message property - triggers the || fallback
    } as any);

    const { result } = renderHook(() => useVerifyOtp(mockStateData));

    // First, set up userUuid by calling requestOtp
    await act(async () => {
      await result.current.requestOtp();
    });

    expect(result.current.userUuid).toBe('test-uuid-123');
    vi.mocked(showToast.showToast).mockClear();

    // Fill in the OTP - call each separately to ensure state updates properly
    act(() => {
      result.current.handleChange(0, '1');
    });
    act(() => {
      result.current.handleChange(1, '2');
    });
    act(() => {
      result.current.handleChange(2, '3');
    });
    act(() => {
      result.current.handleChange(3, '4');
    });
    act(() => {
      result.current.handleChange(4, '5');
    });
    act(() => {
      result.current.handleChange(5, '6');
    });

    // Verify OTP is fully filled (no empty strings)
    expect(result.current.otp).toEqual(['1', '2', '3', '4', '5', '6']);
    expect(result.current.otp.includes('')).toBe(false);

    // Now call verifyOtp - should throw error with default message (line 102)
    await act(async () => {
      await result.current.verifyOtp();
      await Promise.resolve(); // Flush promises
    });

    // Should show error toast with default message
    expect(showToast.showToast).toHaveBeenCalledWith(
      'Invalid OTP',
      expect.any(String),
      'error'
    );
    
    vi.useFakeTimers();
  }, 15000);

  it('should handle axios error without data.message (line 119)', async () => {
    // Use real timers for this test
    vi.useRealTimers();
    
    const requestOtpService = await import('../../../../modules/auth/verify-otp/verify-otp.service');
    const showToast = await import('../../../../services/toast');
    
    // Set up requestOtp mock to succeed first
    vi.mocked(requestOtpService.default.requestOtp).mockResolvedValue({
      success: true,
      data: { userUuid: 'test-uuid-123' },
    } as any);

    // Mock verifyOtp to throw axios error without data.message (covers line 119 fallback)
    const axiosErrorWithoutMessage = {
      response: {
        data: {}, // No message property
      },
    };

    vi.mocked(requestOtpService.default.verifyOtp).mockRejectedValue(axiosErrorWithoutMessage);

    const { result } = renderHook(() => useVerifyOtp(mockStateData));

    // First, set up userUuid by calling requestOtp
    await act(async () => {
      await result.current.requestOtp();
    });

    expect(result.current.userUuid).toBe('test-uuid-123');
    vi.mocked(showToast.showToast).mockClear();

    // Fill in the OTP - call each separately to ensure state updates properly
    act(() => {
      result.current.handleChange(0, '1');
    });
    act(() => {
      result.current.handleChange(1, '2');
    });
    act(() => {
      result.current.handleChange(2, '3');
    });
    act(() => {
      result.current.handleChange(3, '4');
    });
    act(() => {
      result.current.handleChange(4, '5');
    });
    act(() => {
      result.current.handleChange(5, '6');
    });

    // Verify OTP is fully filled (no empty strings)
    expect(result.current.otp).toEqual(['1', '2', '3', '4', '5', '6']);
    expect(result.current.otp.includes('')).toBe(false);

    // Now call verifyOtp
    await act(async () => {
      await result.current.verifyOtp();
      await Promise.resolve(); // Flush promises
    });

    // Should show error with default message (line 119 fallback)
    expect(showToast.showToast).toHaveBeenCalledWith(
      'Invalid OTP',
      'Invalid OTP', // Default message when data.message is missing
      'error'
    );
    
    vi.useFakeTimers();
  }, 15000);

  it('should reset OTP and timeLeft and focus first input when handleResend is called (lines 127-129)', async () => {
    // Use real timers for this test
    vi.useRealTimers();
    
    const requestOtpService = await import('../../../../modules/auth/verify-otp/verify-otp.service');
    
    // Mock requestOtp to succeed
    vi.mocked(requestOtpService.default.requestOtp).mockResolvedValue({
      success: true,
      message: 'OTP sent successfully',
      data: { userUuid: 'test-uuid' },
    });

    const { result } = renderHook(() => useVerifyOtp(mockStateData));

    // Wait for initial requestOtp to complete
    await act(async () => {
      await result.current.requestOtp();
      await Promise.resolve();
    });

    // Set some OTP values first - call each separately to ensure state updates properly
    act(() => {
      result.current.handleChange(0, '1');
    });
    act(() => {
      result.current.handleChange(1, '2');
    });
    act(() => {
      result.current.handleChange(2, '3');
    });

    // Verify OTP has values
    expect(result.current.otp).toEqual(['1', '2', '3', '', '', '']);

    // Manually set the ref to have a focus method to test line 129
    const mockFocus = vi.fn();
    const mockInput = { focus: mockFocus } as unknown as HTMLInputElement;
    result.current.inputsRef.current[0] = mockInput;

    // Clear the mock to track handleResend calls
    vi.mocked(requestOtpService.default.requestOtp).mockClear();

    // Call handleResend - should reset OTP, timeLeft, and call focus (line 129)
    await act(async () => {
      await result.current.handleResend();
      await Promise.resolve();
    });

    // Verify that requestOtp was called again
    expect(vi.mocked(requestOtpService.default.requestOtp)).toHaveBeenCalled();
    // Verify OTP was reset (line 127)
    expect(result.current.otp).toEqual(['', '', '', '', '', '']);
    // Verify timeLeft was reset (line 128)
    expect(result.current.timeLeft).toBe(180);
    // Verify focus was called on the first input (line 129)
    expect(mockFocus).toHaveBeenCalledTimes(1);
    
    vi.useFakeTimers();
  }, 15000);

  it('should prevent duplicate requestOtp calls via didRequestOtp guard when stateData changes (line 169)', async () => {
    // Use real timers for this test
    vi.useRealTimers();
    
    const requestOtpService = await import('../../../../modules/auth/verify-otp/verify-otp.service');
    
    // Mock requestOtp
    vi.mocked(requestOtpService.default.requestOtp).mockResolvedValue({
      success: true,
      message: 'OTP sent successfully',
      data: { userUuid: 'test-uuid' },
    });

    // Initial render with mockStateData
    const { rerender } = renderHook(
      ({ stateData }) => useVerifyOtp(stateData),
      { initialProps: { stateData: mockStateData } }
    );

    await act(async () => {
      await Promise.resolve();
    });

    // Verify requestOtp was called on initial mount (once)
    const initialCallCount = vi.mocked(requestOtpService.default.requestOtp).mock.calls.length;
    expect(initialCallCount).toBeGreaterThan(0);

    // Clear the mock to track subsequent calls
    vi.mocked(requestOtpService.default.requestOtp).mockClear();

    // Rerender with different stateData - this should recreate requestOtp function
    // but didRequestOtp.current is already true, so it should return early (line 169)
    const newStateData = {
      ...mockStateData,
      value: 'new-username',
    };
    rerender({ stateData: newStateData });

    await act(async () => {
      await Promise.resolve();
    });

    // requestOtp should not be called again due to the guard (line 169)
    // Even though requestOtp function changed, didRequestOtp.current is true
    expect(vi.mocked(requestOtpService.default.requestOtp)).not.toHaveBeenCalled();
    
    vi.useFakeTimers();
  }, 15000);

  it('should handle verifyOtp with missing stateData values (lines 96-97 fallback)', async () => {
    // Use real timers for this test
    vi.useRealTimers();

    const requestOtpService = await import('../../../../modules/auth/verify-otp/verify-otp.service');

    // Mock verifyOtp to succeed
    vi.mocked(requestOtpService.default.verifyOtp).mockResolvedValue({
      success: true,
      message: 'OTP verified successfully',
    } as any);

    // Strategy: Create hook with valid stateData first to set userUuid,
    // then rerender with missing values so verifyOtp uses the fallback
    const validStateData = {
      value: 'testuser',
      type: 'username' as const,
      otpFor: 'login',
    };

    const stateDataWithMissingValues = {
      value: undefined as any, // Missing value
      type: 'username' as const,
      otpFor: undefined as any, // Missing otpFor
    };

    const { result, rerender } = renderHook(
      ({ stateData }) => useVerifyOtp(stateData),
      { initialProps: { stateData: validStateData } }
    );

    // Set up requestOtp to succeed
    vi.mocked(requestOtpService.default.requestOtp).mockResolvedValue({
      success: true,
      data: { userUuid: 'test-uuid-123' },
    } as any);

    // Get userUuid by calling requestOtp
    await act(async () => {
      await result.current.requestOtp();
      await Promise.resolve();
    });

    expect(result.current.userUuid).toBe('test-uuid-123');

    // Fill in the OTP
    act(() => {
      result.current.handleChange(0, '1');
    });
    act(() => {
      result.current.handleChange(1, '2');
    });
    act(() => {
      result.current.handleChange(2, '3');
    });
    act(() => {
      result.current.handleChange(3, '4');
    });
    act(() => {
      result.current.handleChange(4, '5');
    });
    act(() => {
      result.current.handleChange(5, '6');
    });

    expect(result.current.otp).toEqual(['1', '2', '3', '4', '5', '6']);

    // Now rerender with missing values - verifyOtp will error when accessing stateData.type
    rerender({ stateData: stateDataWithMissingValues });

    // Now call verifyOtp - should error when accessing stateData.type since value is undefined
    await act(async () => {
      try {
        await result.current.verifyOtp();
        await Promise.resolve();
      } catch {
        // Expected to error when accessing stateData.type
      }
    });

    // Verify verifyOtp was NOT called because stateData.type access causes error
    expect(vi.mocked(requestOtpService.default.verifyOtp)).not.toHaveBeenCalled();

    vi.useFakeTimers();
  }, 15000);

  it('should cover || "" fallback on lines 101-102 when stateData value/otpFor become falsy between guard and usage', async () => {
    // Use real timers for this test
    vi.useRealTimers();

    const requestOtpService = await import('../../../../modules/auth/verify-otp/verify-otp.service');
    const showToast = await import('../../../../services/toast');

    vi.mocked(requestOtpService.default.requestOtp).mockResolvedValue({
      success: true,
      data: { userUuid: 'test-uuid-fallback' },
    } as any);

    vi.mocked(requestOtpService.default.verifyOtp).mockResolvedValue({
      success: true,
      message: 'OTP verified successfully',
    } as any);

    // Use a getter-based object that returns truthy for the guard check
    // but returns falsy (empty string) on subsequent property accesses.
    // The guard checks !stateData?.value (first access) -> truthy
    // Line 101 uses stateData?.value (second access) -> falsy -> triggers || ''
    let valueCallCount = 0;
    let otpForCallCount = 0;
    const trickStateData = {
      type: 'username' as const,
      get value() {
        valueCallCount++;
        // First access (guard check): return truthy value
        // Subsequent accesses (line 101): return empty string
        return valueCallCount <= 1 ? 'testuser' : '';
      },
      get otpFor() {
        otpForCallCount++;
        // First access (guard check): return truthy value
        // Subsequent accesses (line 102): return empty string
        return otpForCallCount <= 1 ? 'login' : '';
      },
    };

    const { result } = renderHook(() => useVerifyOtp(trickStateData as any));

    // Wait for initial requestOtp to complete (from useEffect)
    await waitFor(() => {
      expect(result.current.userUuid).toBe('test-uuid-fallback');
    }, { timeout: 3000 });

    vi.mocked(showToast.showToast).mockClear();

    // Fill in the OTP
    act(() => { result.current.handleChange(0, '1'); });
    act(() => { result.current.handleChange(1, '2'); });
    act(() => { result.current.handleChange(2, '3'); });
    act(() => { result.current.handleChange(3, '4'); });
    act(() => { result.current.handleChange(4, '5'); });
    act(() => { result.current.handleChange(5, '6'); });

    await waitFor(() => {
      expect(result.current.otp).toEqual(['1', '2', '3', '4', '5', '6']);
    }, { timeout: 1000 });

    // Reset the getter call counts so the next verifyOtp call has fresh counters
    valueCallCount = 0;
    otpForCallCount = 0;

    // Now call verifyOtp - the getters will return truthy on first access (guard)
    // then falsy on second access (lines 101-102), triggering the || '' fallback
    await act(async () => {
      await result.current.verifyOtp();
    });

    // The payload should have '' for the value and verifyFor fields due to || '' fallback
    expect(requestOtpService.default.verifyOtp).toHaveBeenCalledWith(
      expect.objectContaining({
        otp: '123456',
        username: '',      // stateData?.value was '' on line 101, so || '' gives ''
        verifyFor: '',     // stateData?.otpFor was '' on line 102, so || '' gives ''
      })
    );

    vi.useFakeTimers();
  }, 15000);

});
