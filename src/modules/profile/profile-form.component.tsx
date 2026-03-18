import { yupResolver } from '@hookform/resolvers/yup';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useSelector } from 'react-redux';
import { Button, Loader, PhotoUploadModal } from '../../components/common';
import Card from '../../components/common/card.component';
import { useGlobalModal } from '../../components/modal/global-modal-context';
import type { RootState } from '../../store/store';
import ProfileFormFields from './profile-form-fields.component';
import ProfileHeader from './profile-header.component';
import { useProfileContext } from '../../context/ProfileContext';
import { profileSchema, type ProfileFormValues } from './profile.validation';

interface ProfileFormProps {
  className?: string;
}

const ProfileForm: React.FC<ProfileFormProps> = ({ className = '' }) => {
  const { profile, updateProfile, uploadPhoto, locations } =
    useProfileContext();
  const { showConfirmModal } = useGlobalModal();

  const isSaving = useSelector(
    (state: RootState) => state.loader.sections['profile-save'] > 0
  );

  // const [passwordData, setPasswordData] = useState<PasswordChangeRequest>({
  //   currentPassword: '',
  //   newPassword: '',
  //   confirmPassword: '',
  // });

  const [isPhotoModalOpen, setIsPhotoModalOpen] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
    watch,
    reset,
    trigger,
  } = useForm<ProfileFormValues>({
    resolver: yupResolver(profileSchema),
  });

  // Reset form ONLY when profile or locations change
  useEffect(() => {
    if (!profile) return;

    // Resolve setupLocation to location name
    const locationName =
      locations.find(
        loc =>
          loc.value === profile.setupLocation ||
          loc.label === profile.setupLocation
      )?.value ||
      profile.setupLocation ||
      '';

    reset({
      username: profile.username || '',
      firstName: profile.firstName || '',
      middleName: profile.middleName || '',
      lastName: profile.lastName || '',
      email: profile.email || '',
      phone: profile.phone || '',
      dateOfBirth: profile.dateOfBirth || '',
      gender: (profile.gender as 'male' | 'female' | 'other') || 'male',
      setupLocation: locationName,
    });
  }, [profile, locations, reset]);

  const profileImage = useMemo<string | undefined>(() => {
    return profile?.avatar || undefined;
  }, [profile?.avatar]);

  const saveProfile = useCallback(
    async (data: ProfileFormValues) => {
      try {
        await updateProfile(data);
      } catch (error) {
        console.error('Failed to save profile:', error);
      }
    },
    [updateProfile]
  );

  const onSubmitForm = useCallback(
    async (data: ProfileFormValues) => {
      const locationChanged =
        data.setupLocation &&
        profile?.setupLocation &&
        data.setupLocation !== profile.setupLocation;

      if (locationChanged) {
        showConfirmModal({
          open: true,
          type: 'confirm',
          size: 'lg',
          title: 'Change Location',
          description: `Are you sure you want to change your location to ${data.setupLocation} ?`,
          note: 'Changing the location will affect the visit data and patient upload location.',
          confirmText: 'Confirm',
          cancelText: 'Cancel',
          onConfirm: () => {
            saveProfile(data);
          },
        });
      } else {
        await saveProfile(data);
      }
    },
    [profile?.setupLocation, locations, showConfirmModal, saveProfile]
  );

  // const generatePassword = useCallback(() => {
  //   const newPassword = 'GeneratedPassword123!';
  //   setPasswordData(prev => ({
  //     ...prev,
  //     newPassword,
  //     confirmPassword: newPassword,
  //   }));
  // }, []);

  const handleUploadPhoto = useCallback(
    (file: File) => {
      uploadPhoto(file);
      setIsPhotoModalOpen(false);
    },
    [uploadPhoto]
  );

  if (!profile) return null;

  return (
    <Card
      className={`w-full bg-white md:bg-inherit min-h-0 p-0 md:p-inherit border-0 md:border shadow-none md:shadow-md rounded-none md:rounded-xl ${className}`}
      contentClassName="p-2 md:p-6"
    >
      <ProfileHeader />

      <form
        onSubmit={handleSubmit(onSubmitForm)}
        className="space-y-2 md:space-y-6"
      >
        <ProfileFormFields
          register={register}
          errors={errors}
          watch={watch}
          setValue={setValue}
          trigger={trigger}
          onPhotoModalOpen={() => setIsPhotoModalOpen(true)}
          onCountryChange={() => {}}
          profileImage={profileImage}
          locationOptions={locations}
        />

        {/* <PasswordSection
          passwordData={passwordData}
          onPasswordChange={setPasswordData}
          onGeneratePassword={generatePassword}
        /> */}

        <div className="flex justify-end gap-3 pt-2 md:pt-6">
          <Button
            type="submit"
            variant="primary"
            size="md"
            disabled={isSubmitting || isSaving}
            className="w-full md:w-auto bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-4 py-4 md:py-2 text-base md:text-sm font-semibold cursor-pointer mt-6 md:mt-0 disabled:bg-gray-400 disabled:cursor-not-allowed md:!px-6"
          >
            {isSaving ? (
              <span className="flex items-center gap-2">
                <Loader id="profile-save" mode="inline" />
                <span>Saving...</span>
              </span>
            ) : (
              'Save'
            )}
          </Button>
        </div>
      </form>

      {isPhotoModalOpen && (
        <PhotoUploadModal
          isOpen={isPhotoModalOpen}
          onClose={() => setIsPhotoModalOpen(false)}
          onTakePhoto={() => {}}
          onUploadPhoto={handleUploadPhoto}
        />
      )}
    </Card>
  );
};

export default ProfileForm;
