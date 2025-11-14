import { yupResolver } from '@hookform/resolvers/yup';
import React from 'react';
import { useForm } from 'react-hook-form';
import { Button, PhotoUploadModal } from '../../components/common';
import Card from '../../components/common/card.component';
import type { PasswordChangeRequest } from '../../types/profile.types';
import PasswordSection from './password-section.component';
import ProfileFormFields from './profile-form-fields.component';
import ProfileHeader from './profile-header.component';
import './profile-mobile.css';
import { useProfile } from './profile.hooks';
import { profileSchema, type ProfileFormValues } from './profile.validation';

interface ProfileFormProps {
  className?: string;
}

const ProfileForm: React.FC<ProfileFormProps> = ({ className = '' }) => {
  const { profile, loading, updateProfile, uploadPhoto, takePhoto } =
    useProfile();

  const [passwordData, setPasswordData] = React.useState<PasswordChangeRequest>(
    {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    }
  );
  const [notificationsEnabled, setNotificationsEnabled] = React.useState(true);
  const [isPhotoModalOpen, setIsPhotoModalOpen] = React.useState(false);

  // Initialize form with validation
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
    defaultValues: {
      username: profile?.username || '',
      firstName: profile?.firstName || '',
      middleName: profile?.middleName || '',
      lastName: profile?.lastName || '',
      email: profile?.email || '',
      phone: profile?.phone || '',
      dateOfBirth: profile?.dateOfBirth || '',
      gender: (profile?.gender as 'male' | 'female' | 'other') || 'male',
      setupLocation: profile?.setupLocation || '',
    },
  });

  // Form submission handler with validation
  const onSubmitForm = async (data: ProfileFormValues) => {
    try {
      // Call the updateProfile function from hooks (which calls profile.service)
      await updateProfile(data);
    } catch (error) {
      console.error('Failed to save profile:', error);
    }
  };

  // Reset form when profile data changes
  React.useEffect(() => {
    if (profile) {
      reset({
        username: profile.username || '',
        firstName: profile.firstName || '',
        middleName: profile.middleName || '',
        lastName: profile.lastName || '',
        email: profile.email || '',
        phone: profile.phone || '',
        dateOfBirth: profile.dateOfBirth || '',
        gender: (profile.gender as 'male' | 'female' | 'other') || 'male',
        setupLocation: profile.setupLocation || '',
      });
    }
  }, [profile, reset]);

  const generatePassword = () => {
    const newPassword = 'GeneratedPassword123!';
    setPasswordData(prev => ({
      ...prev,
      newPassword: newPassword,
      confirmPassword: newPassword,
    }));
  };

  const handleTakePhoto = () => {
    takePhoto();
    setIsPhotoModalOpen(false);
  };

  const handleUploadPhoto = (file: File) => {
    uploadPhoto(file);
    setIsPhotoModalOpen(false);
  };

  // Show loading state while profile data is being fetched
  if (!profile && loading) {
    return (
      <Card className={`w-full ${className}`} contentClassName="p-4 md:p-4">
        <div className="flex items-center justify-center py-8">
          <div
            className="animate-spin rounded-full h-8 w-8 border-b-2"
            style={{ borderColor: 'var(--color-primary)' }}
          ></div>
          <span className="ml-2 text-body-medium text-[--color-dark]">
            Loading profile...
          </span>
        </div>
      </Card>
    );
  }

  return (
    <Card
      className={`w-full mobile-profile-form ${className}`}
      contentClassName="p-4 md:p-4 lg:p-6"
    >
      <ProfileHeader
        notificationsEnabled={notificationsEnabled}
        onNotificationsChange={setNotificationsEnabled}
      />

      <form
        onSubmit={handleSubmit(onSubmitForm)}
        className="space-y-4 lg:space-y-6"
      >
        <ProfileFormFields
          register={register}
          errors={errors}
          watch={watch}
          setValue={setValue}
          trigger={trigger}
          onPhotoModalOpen={() => setIsPhotoModalOpen(true)}
          onCountryChange={() => {}}
          profileUrl={profile?.avatar}
        />

        <PasswordSection
          passwordData={passwordData}
          onPasswordChange={setPasswordData}
          onGeneratePassword={generatePassword}
        />

        <div className="flex justify-end gap-3 pt-4 lg:pt-6">
          <Button
            type="submit"
            variant="primary"
            size="md"
            isLoading={isSubmitting || loading}
            loadingText="Saving..."
            className="px-6 mobile-save-button lg:px-6"
          >
            Save
          </Button>
        </div>
      </form>
      {isPhotoModalOpen && (
        <PhotoUploadModal
          isOpen={isPhotoModalOpen}
          onClose={() => setIsPhotoModalOpen(false)}
          onTakePhoto={handleTakePhoto}
          onUploadPhoto={handleUploadPhoto}
        />
      )}
    </Card>
  );
};

export default ProfileForm;
