import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import iconLanguageWhite from '../../assets/icons/icon-language-white.svg';
import iconWarningDiamond from '../../assets/icons/icon-warning-diamond.svg';
import { Button, Dropdown } from '../../components/common';
import { useGlobalModal } from '../../components/modal/global-modal-context';
import { useConfig } from '../../hooks/useConfig';
import { LANGUAGE_OPTIONS } from '../../utils/constant';
import { useLanguageSettings } from './settings.hooks';

const SettingsLanguage: React.FC = () => {
  const { t } = useTranslation();
  const { language, setLanguage, handleReset } = useLanguageSettings();
  const { showConfirmModal } = useGlobalModal();
  const { config } = useConfig();

  // --- Protocol state hidden for now ---
  // const [isProtocolFormOpen, setIsProtocolFormOpen] = useState(false);
  // const [isUpdatingProtocols, setIsUpdatingProtocols] = useState(false);
  // const [serverUrl, setServerUrl] = useState('');
  // const [licenseKey, setLicenseKey] = useState('');

  // useEffect(() => {
  //   if (!isProtocolFormOpen) {
  //     setServerUrl('');
  //     setLicenseKey('');
  //   }
  // }, [isProtocolFormOpen]);

  const languageOptions = useMemo(() => {
    const apiLanguages = config?.language?.filter(
      lang =>
        lang.is_enabled && (lang.platform === 'Both' || lang.platform === 'Web')
    );
    if (apiLanguages && apiLanguages.length > 0) {
      return apiLanguages.map(lang => ({
        value: lang.code,
        label: lang.name,
      }));
    }
    return LANGUAGE_OPTIONS;
  }, [config?.language]);

  const requestLanguageChange = (code: string) => {
    if (code === language) return;
    const label = languageOptions.find(o => o.value === code)?.label ?? code;
    showConfirmModal({
      open: true,
      type: 'confirm',
      size: 'sm',
      title: t('Settings.Change_Language'),
      description: t('Settings.Change_Language_Confirm', { language: label }),
      icon: iconWarningDiamond,
      cancelText: t('Settings.No'),
      confirmText: t('Settings.Yes'),
      onConfirm: () => setLanguage(code, label),
    });
  };

  // const submitProtocolUpdate = async () => {
  //   if (!serverUrl.trim() || !licenseKey.trim()) return;
  //   setIsProtocolFormOpen(false);
  //   setIsUpdatingProtocols(true);
  //   try {
  //     await Promise.all([
  //       handleUpdateProtocols({
  //         serverUrl: serverUrl.trim(),
  //         licenseKey: licenseKey.trim(),
  //       }),
  //       new Promise(resolve => setTimeout(resolve, 1500)),
  //     ]);
  //   } finally {
  //     setIsUpdatingProtocols(false);
  //   }
  // };

  // const greenCircleIcon = (src: string, alt: string) => (
  //   <div className="w-14 h-14 rounded-full bg-[#0fd197] flex items-center justify-center">
  //     <img src={src} alt={alt} className="w-7 h-7" />
  //   </div>
  // );

  return (
    <div className="flex-1 min-h-0">
      <h2 className="text-heading-5 text-(--color-dark) mb-3">
        {t('Settings.Language')}
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
              {t('Settings.Language')}
            </span>
          </div>

          <div className="flex items-center gap-8 sm:gap-10">
            <span className="w-[130px] flex-shrink-0 text-sm sm:text-body-normal text-(--color-muted)">
              {t('Settings.App_Language')}
            </span>
            <div className="w-[160px]">
              <Dropdown
                options={languageOptions}
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
              {t('Settings.Reset_To_English')}
            </span>
            <Button
              type="button"
              variant="primarylight"
              size="sm"
              onClick={handleReset}
              leftIcon={<i className="fa-solid fa-arrows-rotate text-sm" />}
            >
              {t('Settings.Reset')}
            </Button>
          </div>
        </div>

        {/* Protocols section hidden for now */}
      </div>
    </div>
  );
};

export default SettingsLanguage;
