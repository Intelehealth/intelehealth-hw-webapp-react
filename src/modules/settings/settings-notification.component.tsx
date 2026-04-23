import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Toggle } from '../../components/common';
import { useNotificationSettings } from './settings.hooks';

const SettingsNotification: React.FC = () => {
  const navigate = useNavigate();
  const {
    notificationAlerts,
    blackoutEnabled,
    isSaving,
    toggleNotificationAlerts,
    toggleBlackout,
    handleSave,
  } = useNotificationSettings();

  return (
    <div className="flex-1 min-h-0">
      <h2 className="text-heading-5 text-(--color-dark) mb-3">Notifications</h2>

      <div
        className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 lg:gap-x-12 max-w-[650px]"
        style={
          { ['--color-accent' as string]: '#34cc8b' } as React.CSSProperties
        }
      >
        <div className="flex flex-col gap-3.5">
          <p className="text-[13px] text-(--color-muted)">
            Notification alerts
          </p>
          <Toggle
            checked={notificationAlerts}
            onChange={toggleNotificationAlerts}
            size="sm"
            variant="primary"
          />
          <p className="text-[11px] text-(--color-muted) leading-snug">
            Turning off notifications, you will not receive any notifications.
          </p>
        </div>

        <div className="flex flex-col gap-3.5">
          <p className="text-[13px] text-(--color-muted)">
            Blackout (From 9:00 pm to 6:00 am)
          </p>
          <Toggle
            checked={blackoutEnabled}
            onChange={toggleBlackout}
            size="sm"
            variant="primary"
          />
          <p className="text-[11px] text-(--color-muted) leading-snug">
            To disable notification between below time period, switch on the
            blackout period.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 lg:gap-x-12 max-w-[650px] mt-4">
        <div className="hidden sm:block" />
        <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center gap-3 sm:ml-16 lg:ml-20">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => navigate(-1)}
          >
            Back
          </Button>
          <Button
            type="button"
            variant="primary"
            size="sm"
            onClick={handleSave}
            isLoading={isSaving}
            loadingText="Saving..."
            rightIcon={<i className="fa-solid fa-arrow-right text-xs" />}
          >
            Save changes
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SettingsNotification;
