import React, { useState } from 'react';
import iconSettingsFilled from '../../assets/icons/icon-settings-filled.svg';
import iconNotification from '../../assets/icons/icon-notification.svg';
import iconLock from '../../assets/icons/icon-security-filled.svg';
import iconAccount from '../../assets/icons/icon-account-outline.svg';
import iconSliders from '../../assets/icons/icon-sliders.svg';
import { cn } from '../../utils/cn';
import SettingsAccount from './settings-account.component';
import SettingsNotification from './settings-notification.component';
import SettingsSecurity from './settings-security.component';
import SettingsLanguage from './settings-language.component';

type SettingsTab = 'account' | 'notification' | 'security' | 'language';

const navItems: { id: SettingsTab; label: string; icon: string }[] = [
  { id: 'account', label: 'Account', icon: iconAccount },
  { id: 'notification', label: 'Notification', icon: iconNotification },
  { id: 'security', label: 'Security', icon: iconLock },
  { id: 'language', label: 'Language & protocol', icon: iconSliders },
];

const SettingsLayout: React.FC = () => {
  const [activeTab, setActiveTab] = useState<SettingsTab>('account');

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2 px-4 sm:px-6 py-2 sm:py-3 border-b border-gray-200">
        <div className="w-8 h-8 rounded-full bg-(--color-primary-light) flex items-center justify-center flex-shrink-0">
          <img src={iconSettingsFilled} alt="Settings" className="w-4 h-4" />
        </div>
        <h1 className="text-sm sm:text-base font-semibold text-(--color-dark)">
          Settings
        </h1>
      </div>

      <div className="flex flex-col md:flex-row flex-1 min-h-0 overflow-hidden">
        <aside className="w-full md:w-52 lg:w-56 flex-shrink-0 border-b md:border-b-0 md:border-r border-gray-200 py-3 md:py-4 px-2 md:px-3">
          <p className="text-label text-(--color-muted) px-3 mb-2 hidden md:block">
            Personal
          </p>
          <nav
            className="flex md:flex-col gap-1 md:space-y-1 overflow-x-auto md:overflow-visible [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none]"
            style={{ scrollbarWidth: 'none' }}
          >
            {navItems.map(item => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveTab(item.id)}
                  className={cn(
                    'flex md:w-full items-center gap-2 md:gap-3 px-3 py-2 md:py-2.5 rounded-lg text-left transition whitespace-nowrap cursor-pointer',
                    'text-sm md:text-body-normal',
                    isActive
                      ? 'bg-gray-100 text-(--color-dark) font-semibold'
                      : 'text-(--color-muted) hover:bg-gray-50 hover:text-(--color-dark)'
                  )}
                >
                  <img
                    src={item.icon}
                    alt={item.label}
                    className={cn(
                      'w-4 h-4 md:w-5 md:h-5 flex-shrink-0 transition',
                      !isActive && 'opacity-60'
                    )}
                  />
                  {item.label}
                </button>
              );
            })}
          </nav>
        </aside>

        <main className="flex-1 overflow-hidden px-3 sm:px-5 py-2 sm:py-3">
          {activeTab === 'account' && <SettingsAccount />}
          {activeTab === 'notification' && <SettingsNotification />}
          {activeTab === 'security' && <SettingsSecurity />}
          {activeTab === 'language' && <SettingsLanguage />}
        </main>
      </div>
    </div>
  );
};

export default SettingsLayout;
