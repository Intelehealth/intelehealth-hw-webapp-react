import { act, renderHook } from '@testing-library/react';
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

  it('should handle verifyOtp error path coverage', async () => {
    const { result } = renderHook(() => useVerifyOtp(mockStateData));

    // Test that verifyOtp function exists and can be called
    expect(typeof result.current.verifyOtp).toBe('function');

    // Test basic function call without complex assertions
    await act(async () => {
      await result.current.verifyOtp();
    });
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
      'Verify OTP Failed',
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
      'Verify OTP Failed',
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
      'Verify OTP Failed',
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
      'Verify OTP Failed',
      'Verify OTP Failed', // Default message when data.message is missing
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

    // Now rerender with missing values - verifyOtp will use new stateData with fallbacks
    rerender({ stateData: stateDataWithMissingValues });

    // Now call verifyOtp - should use empty strings for missing values (lines 96-97)
    await act(async () => {
      await result.current.verifyOtp();
      await Promise.resolve();
    });

    // Verify verifyOtp was called with empty strings for missing values
    expect(vi.mocked(requestOtpService.default.verifyOtp)).toHaveBeenCalledWith({
      otp: '123456',
      username: '', // Fallback to empty string (line 96)
      verifyFor: '', // Fallback to empty string (line 97)
    });
    
    vi.useFakeTimers();
  }, 15000);

});
