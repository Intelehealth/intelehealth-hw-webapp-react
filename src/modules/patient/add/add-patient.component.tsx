import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import iconUserPlusGreenRounded from '../../../assets/icons/icon-user-plus-green-rounded.svg';
import ROUTES from '../../../routes/paths';
import type { PatientFormData } from '../../../types/patient/add/add-patient.types';
import { storage } from '../../../utils/storage';
import {
  getResource,
  upsertResource,
} from '../../ayu/services/temp-storage.service';

import {
  ADD_PATIENT_LABEL,
  PATIENT_DETAILS_LABEL,
} from '../../../utils/constant';
import { useAddPatient } from './add-patient.hooks';
import PatientInfo from './steps/patient-info/patient-info.component';
import Preview from './steps/patient-preview/patient-preview.component';
import PrivacyPolicy from './steps/privacy-policy/patient-privacy-policy.component';
import Terms from './steps/terms/terms.component';

interface TempPatientData {
  formData: PatientFormData;
  step: number;
  patientUuid: string | null;
}

const TEMP_PATIENT_ID_KEY = 'temp_patient_id';

function getOrCreateTempPatientId(): string {
  const existing = storage.get(TEMP_PATIENT_ID_KEY);
  if (existing) return existing;
  const id = crypto.randomUUID();
  storage.set(TEMP_PATIENT_ID_KEY, id);
  return id;
}

const EMPTY_FORM_DATA: PatientFormData = {
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
};

export default function AddPatientComponent() {
  const { handleAddPatient } = useAddPatient();
  const navigate = useNavigate();
  const [tempPatientId] = useState(getOrCreateTempPatientId);
  const [step, setStep] = useState(0);
  const [patientUuid, setPatientUuid] = useState<string | null>(null);
  const [formData, setFormData] = useState<PatientFormData>(EMPTY_FORM_DATA);
  const [, setIsRestoring] = useState(true);
  const formDataRef = useRef(formData);
  formDataRef.current = formData;

  // Restore from temp-storage on mount
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await getResource<TempPatientData>(
          'patient',
          tempPatientId
        );
        if (cancelled || !res.data) return;
        const saved = res.data.data;
        if (saved.formData) setFormData(saved.formData);
        if (saved.step != null) setStep(saved.step);
        if (saved.patientUuid) setPatientUuid(saved.patientUuid);
      } catch {
        // No existing record — start fresh
      } finally {
        if (!cancelled) setIsRestoring(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [tempPatientId]);

  // Save patient form data to temp-storage
  const savePatientToTemp = useCallback(
    async (overrides: Partial<TempPatientData> = {}) => {
      const payload: TempPatientData = {
        formData: formDataRef.current,
        step: step,
        patientUuid,
        ...overrides,
      };
      try {
        let createdBy = null;
        try {
          const u = storage.getUser();
          if (u) createdBy = JSON.parse(u).uuid ?? u;
        } catch {
          /* fallback */
        }
        await upsertResource<TempPatientData>({
          resource_type: 'patient',
          resource_id: tempPatientId,
          data: payload,
          created_by: createdBy,
        });
      } catch {
        // Save failed — form state is still the source of truth
      }
    },
    [tempPatientId, step, patientUuid]
  );

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const nextStep = (data: any) => {
    const merged = { ...formDataRef.current, ...data };
    setFormData(merged);
    if (step > 1) {
      handleSubmit(data);
    } else {
      const nextIdx = step + 1;
      setStep(nextIdx);
      savePatientToTemp({ formData: merged, step: nextIdx });
    }
  };

  const prevStep = () => {
    if (step > 0) {
      const prevIdx = step - 1;
      setStep(prevIdx);
      savePatientToTemp({ step: prevIdx });
      return;
    }
    navigate(ROUTES.DASHBOARD, { replace: true });
  };

  /**
   * Scroll to the top of the main container content when the step changes
   */
  useEffect(() => {
    const mainContainerContent = document.getElementById(
      'main-container-content'
    );
    if (mainContainerContent) {
      mainContainerContent.scrollTo(0, 0);
    }
  }, [step]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleSubmit = async (data: any) => {
    const mergedData = { ...formData, ...data };
    const result = await handleAddPatient(mergedData);
    if (result) {
      setPatientUuid(result);
      const nextIdx = step + 1;
      setStep(nextIdx);
      savePatientToTemp({ step: nextIdx, patientUuid: result });
    }
  };

  return (
    <div className="flex p-6 flex-col h-full">
      <div className="hidden md:flex items-center gap-3">
        <img src={iconUserPlusGreenRounded} />
        <label className="text-base font-semibold">
          {step === 3 ? PATIENT_DETAILS_LABEL : ADD_PATIENT_LABEL}
        </label>
      </div>
      <hr className="hidden md:block border-t border-[#DFDEE3] my-3" />
      <h2 className="text-lg font-semibold mb-6 md:hidden">Add New Patient</h2>

      {/* Step Components */}
      {step === 0 && <PrivacyPolicy onNext={nextStep} onPrev={prevStep} />}
      {step === 1 && <Terms onNext={nextStep} onPrev={prevStep} />}
      {step === 2 && (
        <PatientInfo
          defaultValues={{
            ...formData.personalInfo,
            profilePhoto:
              typeof formData.personalInfo.profilePhoto === 'string'
                ? formData.personalInfo.profilePhoto
                : null,
            ...formData.addressInfo,
            ...formData.otherInfo,
          }}
          onNext={nextStep}
          onPrev={prevStep}
        />
      )}
      {step === 3 && <Preview data={formData} patientUuid={patientUuid} />}
    </div>
  );
}
