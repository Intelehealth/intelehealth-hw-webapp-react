import { useEffect, useState } from 'react';
import { getCountryCode } from '../../utils/countries';

interface WhatsAppShareModalProps {
  open: boolean;
  onClose: () => void;
  /**
   * Called with the digits to share to. If it returns a promise that rejects,
   * the modal stays open and shows a failure message so the user can retry.
   */
  onShare: (fullPhoneNumber: string) => void | Promise<void>;
  isLoading?: boolean;
}

export const SHARE_FAILED_MESSAGE =
  'Failed to share the prescription. Please try again.';

const WhatsAppShareModal: React.FC<WhatsAppShareModalProps> = ({
  open,
  onClose,
  onShare,
  isLoading = false,
}) => {
  const [phoneNumber, setPhoneNumber] = useState('+91');
  const [error, setError] = useState('');

  // A failure from an earlier attempt must not greet the user on reopen.
  useEffect(() => {
    if (open) setError('');
  }, [open]);

  if (!open) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value;
    if (!val.startsWith('+')) val = '+' + val;
    let digits = val.slice(1).replace(/[^\d]/g, '');
    // Limit to country code + 10 digits
    const code = getCountryCode(digits);
    if (code) {
      const maxLen = code.length + 10;
      digits = digits.slice(0, maxLen);
    }
    setPhoneNumber('+' + digits);
    if (error) setError('');
  };

  const handleShare = async () => {
    const digits = phoneNumber.replace(/[^\d]/g, '');

    const code = getCountryCode(digits);
    if (!code) {
      setError('Please enter a valid country code');
      return;
    }

    const number = digits.slice(code.length);
    if (number.length !== 10) {
      setError('Please enter a valid 10-digit phone number');
      return;
    }

    setError('');
    try {
      await onShare(digits);
    } catch {
      setError(SHARE_FAILED_MESSAGE);
    }
  };

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/40 flex justify-center items-center"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-xl shadow-lg p-5 w-[320px] max-sm:w-[290px]">
        <p className="text-sm text-gray-700 mb-3">
          Enter the mobile number to which you want to share the prescription.
        </p>

        <input
          type="tel"
          value={phoneNumber}
          onChange={handleChange}
          placeholder="+918179987770"
          className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm text-gray-800 focus:outline-none focus:border-[var(--color-primary)]"
        />
        {error && <p className="text-xs text-red-500 mt-1">{error}</p>}

        <div className="flex justify-end mt-3">
          <button
            type="button"
            onClick={handleShare}
            disabled={isLoading}
            className="rounded-lg bg-[var(--color-primary,#2E1E91)] px-5 py-2 text-sm font-semibold text-white hover:opacity-90 transition disabled:opacity-50"
          >
            {isLoading ? 'Sharing...' : 'Share'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default WhatsAppShareModal;
