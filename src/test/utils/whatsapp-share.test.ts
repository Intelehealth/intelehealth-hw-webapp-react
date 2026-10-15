import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { openWhatsAppShare } from '../../utils/whatsapp-share';
import { POPUP_BLOCKED_MESSAGE } from '../../utils/pdf-window';

const { mockShowToast } = vi.hoisted(() => ({ mockShowToast: vi.fn() }));
vi.mock('../../services/toast', () => ({ showToast: mockShowToast }));

describe('openWhatsAppShare', () => {
  const openSpy = vi.spyOn(window, 'open');
  let tab: { opener: unknown };

  beforeEach(() => {
    vi.clearAllMocks();
    tab = { opener: window };
    openSpy.mockReturnValue(tab as unknown as Window);
  });

  afterEach(() => {
    openSpy.mockReset();
  });

  it('opens WhatsApp for the number in a new tab, and reports success', () => {
    expect(openWhatsAppShare('919876543210')).toBe(true);

    expect(openSpy).toHaveBeenCalledTimes(1);
    expect(openSpy).toHaveBeenCalledWith(
      expect.stringMatching(/^https:\/\/wa\.me\/919876543210\?text=/),
      '_blank'
    );
    expect(mockShowToast).not.toHaveBeenCalled();
  });

  it('puts the prescription link in the message', () => {
    openWhatsAppShare('11234567890');

    const url = openSpy.mock.calls[0][0] as string;
    const message = decodeURIComponent(url.split('?text=')[1]);
    expect(message).toContain('Thank you for using Intelehealth');
    expect(message).toContain('Download here: https://');
  });

  it('cuts the new tab off from this app, so WhatsApp cannot redirect it', () => {
    openWhatsAppShare('919876543210');

    expect(tab.opener).toBeNull();
  });

  it('tells the user to allow pop-ups, and reports failure, when the browser blocks the tab', () => {
    openSpy.mockReturnValue(null);

    expect(openWhatsAppShare('919876543210')).toBe(false);

    expect(mockShowToast).toHaveBeenCalledTimes(1);
    expect(mockShowToast).toHaveBeenCalledWith('Error', POPUP_BLOCKED_MESSAGE, 'error');
  });
});
