import React from 'react';
import iconQuestionMark from '../../assets/icons/icon-rounded-question-mark.svg';
import { Input } from '../../components/common';
import type { PasswordChangeRequest } from '../../types/profile.types';

interface PasswordSectionProps {
  passwordData: PasswordChangeRequest;
  onPasswordChange: (data: PasswordChangeRequest) => void;
  onGeneratePassword: () => void;
}

const PasswordSection: React.FC<PasswordSectionProps> = ({
  passwordData,
  onPasswordChange,
  onGeneratePassword,
}) => {
  return (
    <div className="space-y-2">
      <h3
        className="text-lg font-bold pb-2"
        style={{ color: 'var(--color-primary)' }}
      >
        Change Password
      </h3>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Input
          label="Current password"
          type="password"
          value={passwordData.currentPassword}
          onChange={e =>
            onPasswordChange({
              ...passwordData,
              currentPassword: e.target.value,
            })
          }
          placeholder="Enter current password"
          variant="default"
          size="md"
        />
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="form-label block">New password</label>
            <button
              type="button"
              onClick={onGeneratePassword}
              className="text-sm font-bold inline-flex items-center gap-1 hover:underline cursor-pointer"
              style={{ color: 'var(--color-primary)' }}
            >
              <span>Generate a new password</span>
              <img src={iconQuestionMark} alt="help" className="w-4 h-4" />
            </button>
          </div>
          <Input
            type="password"
            value={passwordData.newPassword}
            onChange={e =>
              onPasswordChange({ ...passwordData, newPassword: e.target.value })
            }
            placeholder="Enter new password"
            variant="default"
            size="md"
          />
        </div>
        <Input
          label="Confirm new password"
          type="password"
          value={passwordData.confirmPassword}
          onChange={e =>
            onPasswordChange({
              ...passwordData,
              confirmPassword: e.target.value,
            })
          }
          placeholder="Confirm password"
          variant="default"
          size="md"
        />
      </div>
    </div>
  );
};

export default PasswordSection;
