import { showToast } from '../services/toast';
import { POPUP_BLOCKED_MESSAGE } from './pdf-window';

// TODO: Replace dummy link with actual upload URL once backend API is ready
const PRESCRIPTION_LINK =
  'https://pathqa.intelehealth.org/intelehealth/index.html#/i/2vpa';

/**
 * Opens WhatsApp in a new tab with the prescription message for `phoneNumber`.
 * It must be called synchronously inside the user's click, or the browser's
 * pop-up blocker refuses the tab. Returns false, after telling the user, when
 * the browser blocks the pop-up.
 */
export function openWhatsAppShare(phoneNumber: string): boolean {
  const message = encodeURIComponent(
    `Hello, Thank you for using Intelehealth. To download your prescription click here\nDownload here: ${PRESCRIPTION_LINK}`
  );
  const win = window.open(
    `https://wa.me/${phoneNumber}?text=${message}`,
    '_blank'
  );
  if (!win) {
    showToast('Error', POPUP_BLOCKED_MESSAGE, 'error');
    return false;
  }
  // WhatsApp is a third-party page. Cut its link back to this app so it cannot
  // redirect the EMR tab (reverse tabnabbing).
  win.opener = null;
  return true;
}
