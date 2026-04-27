import React from 'react';
import { useNavigate } from 'react-router-dom';
import iconQuestionMark from '../../assets/icons/icon-rounded-question-mark.svg';
import { Button, Input } from '../../components/common';
import { useChangePassword } from './settings.hooks';

const SettingsSecurity: React.FC = () => {
  const navigate = useNavigate();
  const {
    values,
    errors,
    isSaving,
    setCurrentPassword,
    setNewPassword,
    setConfirmPassword,
    handleGenerate,
    handleSave,
  } = useChangePassword();

  return (
    <div className="flex-1 min-h-0 w-full max-w-[600px]">
      <h2 className="text-heading-5 text-(--color-dark) mb-3">Security</h2>

      <h3 className="text-sm sm:text-base font-bold text-(--color-primary) mb-4">
        Change Password
      </h3>

      <div className="flex flex-col gap-3 sm:gap-4">
        <Input
          label="Current password"
          type="password"
          value={values.currentPassword}
          onChange={e => setCurrentPassword(e.target.value)}
          placeholder="Enter current password"
          error={errors.currentPassword}
          variant="default"
          size="default"
          autoComplete="current-password"
        />

        <div>
          <label className="form-label block mb-1">New password</label>
          <button
            type="button"
            onClick={handleGenerate}
            className="text-sm font-semibold inline-flex items-center gap-1 hover:underline cursor-pointer text-(--color-primary) mb-2"
          >
            <span>Generate a new password</span>
            <img src={iconQuestionMark} alt="help" className="w-4 h-4" />
          </button>
          <Input
            type="password"
            value={values.newPassword}
            onChange={e => setNewPassword(e.target.value)}
            placeholder="Enter new password"
            error={errors.newPassword}
            variant="default"
            size="default"
            autoComplete="new-password"
          />
        </div>

        <Input
          label="Confirm new password"
          type="password"
          value={values.confirmPassword}
          onChange={e => setConfirmPassword(e.target.value)}
          placeholder="Confirm password"
          error={errors.confirmPassword}
          variant="default"
          size="default"
        />
      </div>

      <div className="flex flex-col-reverse sm:flex-row sm:justify-end items-stretch sm:items-center gap-3 mt-5 sm:mt-6">
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
  );
};

export default SettingsSecurity;
