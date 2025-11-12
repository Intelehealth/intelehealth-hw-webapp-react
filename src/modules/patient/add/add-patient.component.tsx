import React, { useEffect, useState } from 'react';
import iconLocationGreenRoundedBordered from '../../../assets/icons/icon-location-green-rounded-bordered.svg';
import iconLocationGreenRoundedFilled from '../../../assets/icons/icon-location-green-rounded-filled.svg';
import iconLocationGreenRounded from '../../../assets/icons/icon-location-green-rounded.svg';
import iconThreeDotGreenRoundedBordered from '../../../assets/icons/icon-three-dot-green-rounded-bordered.svg';
import iconThreeDotGreenRounded from '../../../assets/icons/icon-three-dot-green-rounded.svg';
import iconUserGreenRoundedBordered from '../../../assets/icons/icon-user-green-rounded-bordered.svg';
import iconUserGreenRoundedFilled from '../../../assets/icons/icon-user-green-rounded-filled.svg';
import iconUserPlusGreenRounded from '../../../assets/icons/icon-user-plus-green-rounded.svg';
import AddressInfo from './steps/address-info/patient-address-info.component';
import PersonalInfo from './steps/personal-info/patient-personal-info.component';

export default function AddPatientComponent() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
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
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const nextStep = (data: any) => {
    setFormData(prev => ({ ...prev, ...data }));
    setStep(s => s + 1);
  };

  const prevStep = () => {
    if (step > 0) setStep(s => s - 1);
    else setStep(0);
  };

  const stepsArray = [
    {
      label: 'Personal',
      icon: iconUserGreenRoundedBordered,
      borderedIcon: iconUserGreenRoundedBordered,
      filledIcon: iconUserGreenRoundedFilled,
      isFilled: step > 0,
    },
    {
      label: 'Address',
      icon: iconLocationGreenRounded,
      borderedIcon: iconLocationGreenRoundedBordered,
      filledIcon: iconLocationGreenRoundedFilled,
      isFilled: step > 1,
    },
    {
      label: 'Other',
      icon: iconThreeDotGreenRounded,
      borderedIcon: iconThreeDotGreenRoundedBordered,
      filledIcon: iconThreeDotGreenRoundedBordered,
    },
  ];

  // // eslint-disable-next-line @typescript-eslint/no-explicit-any
  // const handleSubmit = (data: any) => {
  //   const mergedData = { ...formData, ...data };
  //   console.log('✅ Final Data:', mergedData);
  // };

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
      <div className="flex justify-center items-center mb-10 md:space-x-8 mt-5">
        {stepsArray.map((s, i) => (
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
            {i < stepsArray.length - 1 && (
              <hr
                key={s.label + '-divider'}
                className="w-10 border-t border-dashed border-[#D6D5DC]"
              />
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Step Components */}
      {step === 0 && (
        <PersonalInfo defaultValues={formData} onNext={nextStep} />
      )}
      {step === 1 && <AddressInfo onNext={nextStep} onPrev={prevStep} />}
      {step === 2 && <div>test3</div>}
    </div>
  );
}
