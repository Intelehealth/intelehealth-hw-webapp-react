import React, { useEffect, useState } from 'react';
import iconLocationGreenRoundedBordered from '../../../assets/icons/icon-location-green-rounded-bordered.svg';
import iconLocationGreenRoundedFilled from '../../../assets/icons/icon-location-green-rounded-filled.svg';
import iconLocationGreenRounded from '../../../assets/icons/icon-location-green-rounded.svg';
import iconThreeDotGreenRoundedBordered from '../../../assets/icons/icon-three-dot-green-rounded-bordered.svg';
import iconThreeDotGreenRounded from '../../../assets/icons/icon-three-dot-green-rounded.svg';
import iconUserGreenRoundedBordered from '../../../assets/icons/icon-user-green-rounded-bordered.svg';
import iconUserGreenRoundedFilled from '../../../assets/icons/icon-user-green-rounded-filled.svg';
import iconUserPlusGreenRounded from '../../../assets/icons/icon-user-plus-green-rounded.svg';
import type { PatientFormData } from '../../../types/patient/add/add-patient.types';
import { useAddPatient } from './add-patient.hooks';
import AddressInfo from './steps/address-info/patient-address-info.component';
import OtherInfo from './steps/other-info/patient-other-info.component';
import Preview from './steps/patient-preview/patient-preview.component';
import PersonalInfo from './steps/personal-info/patient-personal-info.component';
import PrivacyPolicy from './steps/privacy-policy/patient-privacy-policy.component';
import Terms from './steps/terms/terms.component';

export default function AddPatientComponent() {
  const { handleAddPatient } = useAddPatient();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<PatientFormData>({
    personalInfo: {
      firstName: '',
      middleName: '',
      lastName: '',
      gender: '',
      dateOfBirth: '',
      age: '',
      phoneNumber: '',
      phoneNumberCountryCode: '+91',
      contactType: '',
      emergencyContactName: '',
      emergencyContactNumber: '',
      emergencyContactNumberCountryCode: '+91',
      profilePhoto: null,
    },
    addressInfo: {
      postalCode: '',
      city: '',
      state: '',
      country: '',
      district: '',
      correspondingAddress1: '',
      correspondingAddress2: '',
    },
    otherInfo: {
      sonDaughterWifeOf: '',
      occupation: '',
      caste: '',
      education: '',
      economicStatus: '',
    },
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const nextStep = (data: any) => {
    setFormData(prev => ({ ...prev, ...data }));
    if (step > 3) {
      handleSubmit(data);
    } else {
      setStep(s => s + 1);
    }
  };

  const prevStep = () => {
    if (step > 0) setStep(s => s - 1);
    else setStep(0);
  };

  const stepsArray = [
    {
      label: 'Privacy Policy',
    },
    {
      label: 'Terms',
    },
    {
      label: 'Personal',
      icon: iconUserGreenRoundedBordered,
      borderedIcon: iconUserGreenRoundedBordered,
      filledIcon: iconUserGreenRoundedFilled,
      isFilled: step > 2,
    },
    {
      label: 'Address',
      icon: iconLocationGreenRounded,
      borderedIcon: iconLocationGreenRoundedBordered,
      filledIcon: iconLocationGreenRoundedFilled,
      isFilled: step > 3,
    },
    {
      label: 'Other',
      icon: iconThreeDotGreenRounded,
      borderedIcon: iconThreeDotGreenRoundedBordered,
      filledIcon: iconThreeDotGreenRoundedBordered,
    },
    {
      label: 'Preview',
    },
  ];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleSubmit = async (data: any) => {
    const mergedData = { ...formData, ...data };
    const result = await handleAddPatient(mergedData);
    if (result) {
      setStep(s => s + 1);
    }
  };

  useEffect(() => {
    setStep(0);
  }, []);

  return (
    <div className="flex p-6 flex-col h-full">
      <div className="hidden md:flex items-center gap-3">
        <img src={iconUserPlusGreenRounded} />
        <label className="text-base">Add Patient</label>
      </div>
      <hr className="hidden md:block border-t border-[#DFDEE3] my-3" />
      <h2 className="text-lg font-semibold mb-6 md:hidden">Add New Patient</h2>

      {/* Step Indicator */}
      {step > 1 && step < 5 && (
        <div className="flex justify-center items-center mb-10 md:space-x-8 mt-5">
          {stepsArray.map((s, i) => {
            return i > 1 && i < 5 ? (
              <React.Fragment key={s.label}>
                <div
                  key={s.label + '-step'}
                  className={`flex flex-col gap-2 md:flex-row items-center ${step === i ? 'text-green-600' : 'text-gray-400'}`}
                >
                  <img
                    src={
                      s.isFilled
                        ? s.filledIcon
                        : step === i
                          ? s.borderedIcon
                          : s.icon
                    }
                    alt={s.label}
                    className="w-8 h-8"
                  />
                  <p className="text-sm mt-2">{s.label}</p>
                </div>
                {i < 4 && (
                  <hr
                    key={s.label + '-divider'}
                    className="w-10 border-t border-dashed border-[#D6D5DC]"
                  />
                )}
              </React.Fragment>
            ) : null;
          })}
        </div>
      )}

      {/* Step Components */}
      {step === 0 && <PrivacyPolicy onNext={nextStep} onPrev={prevStep} />}
      {step === 1 && <Terms onNext={nextStep} onPrev={prevStep} />}
      {step === 2 && (
        <PersonalInfo
          defaultValues={{
            ...formData.personalInfo,
            profilePhoto:
              typeof formData.personalInfo.profilePhoto === 'string'
                ? formData.personalInfo.profilePhoto
                : null,
          }}
          onNext={nextStep}
          onPrev={prevStep}
        />
      )}
      {step === 3 && (
        <AddressInfo
          defaultValues={formData.addressInfo}
          onNext={nextStep}
          onPrev={prevStep}
        />
      )}
      {step === 4 && (
        <OtherInfo
          defaultValues={formData.otherInfo}
          onNext={nextStep}
          onPrev={prevStep}
        />
      )}
      {step === 5 && <Preview data={formData} />}
    </div>
  );
}
