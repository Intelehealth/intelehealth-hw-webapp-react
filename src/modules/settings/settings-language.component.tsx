import React, { useEffect, useState } from 'react';
import iconLanguageWhite from '../../assets/icons/icon-language-white.svg';
import iconProtocolsWhite from '../../assets/icons/icon-protocols-white.svg';
import iconHourglass from '../../assets/icons/icon-hourglass.svg';
import iconWarningDiamond from '../../assets/icons/icon-warning-diamond.svg';
import { Button, Dropdown, Input } from '../../components/common';
import { ConfirmationModal } from '../../components/modal/confirmation.modal';
import { useGlobalModal } from '../../components/modal/global-modal-context';
import { LANGUAGE_OPTIONS } from '../../utils/constant';
import { useLanguageSettings } from './settings.hooks';

const SettingsLanguage: React.FC = () => {
  const { language, setLanguage, handleReset, handleUpdateProtocols } =
    useLanguageSettings();
  const { showConfirmModal } = useGlobalModal();

  const [isProtocolFormOpen, setIsProtocolFormOpen] = useState(false);
  const [isUpdatingProtocols, setIsUpdatingProtocols] = useState(false);
  const [serverUrl, setServerUrl] = useState('');
  const [licenseKey, setLicenseKey] = useState('');

  useEffect(() => {
    if (!isProtocolFormOpen) {
      setServerUrl('');
      setLicenseKey('');
    }
  }, [isProtocolFormOpen]);

  const requestLanguageChange = (code: string) => {
    if (code === language) return;
    const label = LANGUAGE_OPTIONS.find(o => o.value === code)?.label ?? code;
    showConfirmModal({
      open: true,
      type: 'confirm',
      size: 'sm',
      title: 'Change language?',
      description: `Are you sure you want to change language to ${label}?`,
      icon: iconWarningDiamond,
      cancelText: 'No',
      confirmText: 'Yes',
      onConfirm: () => setLanguage(code, label),
    });
  };

  const submitProtocolUpdate = async () => {
    if (!serverUrl.trim() || !licenseKey.trim()) return;
    setIsProtocolFormOpen(false);
    setIsUpdatingProtocols(true);
    try {
      await handleUpdateProtocols({
        serverUrl: serverUrl.trim(),
        licenseKey: licenseKey.trim(),
      });
    } finally {
      setIsUpdatingProtocols(false);
    }
  };

  const greenCircleIcon = (src: string, alt: string) => (
    <div className="w-14 h-14 rounded-full bg-[#0fd197] flex items-center justify-center">
      <img src={src} alt={alt} className="w-7 h-7" />
    </div>
  );

  return (
    <div className="flex-1 min-h-0">
      <h2 className="text-heading-5 text-(--color-dark) mb-3">
        Language & protocol
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 lg:gap-x-12 gap-y-4 max-w-[750px]">
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-[#0fd197] flex items-center justify-center flex-shrink-0">
              <img
                src={iconLanguageWhite}
                alt="Language"
                className="w-5 h-5 sm:w-6 sm:h-6"
              />
            </div>
            <span className="text-body-large text-(--color-dark) font-semibold">
              Language
            </span>
          </div>

          <div className="flex items-center gap-8 sm:gap-10">
            <span className="w-[130px] flex-shrink-0 text-sm sm:text-body-normal text-(--color-muted)">
              App language
            </span>
            <div className="w-[160px]">
              <Dropdown
                options={LANGUAGE_OPTIONS}
                value={language}
                onChange={v =>
                  requestLanguageChange(Array.isArray(v) ? v[0] : (v as string))
                }
                size="md"
              />
            </div>
          </div>

          <div className="flex items-center gap-8 sm:gap-10">
            <span className="w-[130px] flex-shrink-0 text-sm sm:text-body-normal text-(--color-muted)">
              Reset to English
            </span>
            <Button
              type="button"
              variant="primarylight"
              size="sm"
              onClick={handleReset}
              leftIcon={<i className="fa-solid fa-arrows-rotate text-sm" />}
            >
              Reset
            </Button>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-[#0fd197] flex items-center justify-center flex-shrink-0">
              <img
                src={iconProtocolsWhite}
                alt="Protocols"
                className="w-5 h-5 sm:w-6 sm:h-6"
              />
            </div>
            <span className="text-body-large text-(--color-dark) font-semibold">
              Protocols
            </span>
          </div>

          <div className="flex items-center gap-4 sm:gap-6">
            <span className="text-sm sm:text-body-normal text-(--color-muted)">
              Update app protocols
            </span>
            <Button
              type="button"
              variant="primarylight"
              size="sm"
              onClick={() => setIsProtocolFormOpen(true)}
              isLoading={isUpdatingProtocols}
              loadingText="Updating..."
            >
              Update
            </Button>
          </div>
        </div>
      </div>

      <ConfirmationModal
        open={isProtocolFormOpen}
        type="confirm"
        title="Update app Protocol!"
        description="Please enter the server URL with license key to download the protocols?"
        cancelText="Cancel"
        confirmText="Update"
        iconElement={greenCircleIcon(iconProtocolsWhite, 'Protocols')}
        onClose={() => setIsProtocolFormOpen(false)}
        onConfirm={submitProtocolUpdate}
      >
        <div className="flex flex-col gap-3">
          <Input
            type="text"
            value={serverUrl}
            onChange={e => setServerUrl(e.target.value)}
            placeholder="Server URL"
            variant="default"
            size="default"
          />
          <Input
            type="text"
            value={licenseKey}
            onChange={e => setLicenseKey(e.target.value)}
            placeholder="License Key"
            variant="default"
            size="default"
          />
        </div>
      </ConfirmationModal>

      <ConfirmationModal
        open={isUpdatingProtocols}
        type="confirm"
        title="Changing protocols"
        description="Please wait while the protocols are being changed."
        iconElement={
          <img src={iconHourglass} alt="" className="w-16 h-16 animate-pulse" />
        }
        hideActions
        onClose={() => {}}
      />
    </div>
  );
};

export default SettingsLanguage;
