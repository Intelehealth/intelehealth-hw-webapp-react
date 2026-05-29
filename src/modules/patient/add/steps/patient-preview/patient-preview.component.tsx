import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import iconEdit from '../../../../../assets/icons/edit.svg';
import iconAddress from '../../../../../assets/icons/icon-location-green-rounded-bordered.svg';
import iconOther from '../../../../../assets/icons/icon-three-dot-green-rounded-bordered.svg';
import iconPersonal from '../../../../../assets/icons/icon-user-green-rounded-bordered.svg';
import defaultUserImg from '../../../../../assets/images/default-user-img.svg';
import { Button } from '../../../../../components/common';
import type { PatientFormData } from '../../../../../types/patient/add/add-patient.types';
import type { OpenMRSPatient } from '../../../../../types/patient/profile/patient-profile.types';
import { storage } from '../../../../../utils/storage';
import { patientService } from '../../add-patient.service';

interface PatientPreviewComponentProps {
  data: PatientFormData;
  patientUuid: string | null;
}

const na = 'Not provided';
const fmt = (v: string | null | undefined, fallback = na) =>
  v?.trim() ? v.trim() : fallback;

interface DetailItem {
  label: string;
  value: string;
}

const DetailRow = ({ label, value }: DetailItem) => (
  <div className="flex items-start gap-2 py-1.5 text-sm">
    <span className="flex items-center gap-2 w-44 shrink-0 text-gray-400">
      <span className="w-1 h-1 rounded-full bg-gray-300 shrink-0" />
      {label}
    </span>
    <span className="font-medium text-gray-800">{value}</span>
  </div>
);

const DetailSection = ({
  icon,
  title,
  items,
}: {
  icon: string;
  title: string;
  items: DetailItem[];
}) => {
  const mid = Math.ceil(items.length / 2);
  const columns = [items.slice(0, mid), items.slice(mid)];

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
      <div className="flex items-center gap-3 px-4 py-3">
        <img src={icon} alt="" className="w-8 h-8 shrink-0" />
        <span className="text-base font-semibold text-gray-800">{title}</span>
      </div>
      <hr className="border-t border-gray-200" />
      <div className="px-4 py-3">
        <p className="text-sm font-semibold text-gray-500 mb-2">Details</p>
        <div className="grid grid-cols-1 md:grid-cols-2 md:gap-x-10">
          {columns.map((column, colIdx) => (
            <div key={colIdx}>
              {column.map(item => (
                <DetailRow
                  key={item.label}
                  label={item.label}
                  value={item.value}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default function PatientPreviewComponent({
  data,
  patientUuid,
}: PatientPreviewComponentProps) {
  const navigate = useNavigate();
  const [patientIdentifier, setPatientIdentifier] = useState('');

  useEffect(() => {
    if (!patientUuid) return;
    patientService
      .getPatient(patientUuid)
      .then((p: OpenMRSPatient) => {
        setPatientIdentifier(p.identifiers?.[0]?.identifier ?? '');
      })
      .catch(() => {});
  }, [patientUuid]);

  const fullName = [
    data.personalInfo.firstName,
    data.personalInfo.middleName,
    data.personalInfo.lastName,
  ]
    .filter(Boolean)
    .join(' ');

  const handleStartVisit = () => {
    const patientAge = data.personalInfo.age || data.personalInfo.dateOfBirth;

    // Persist patient display info so it survives Ayu page refresh
    storage.set('patientName', fullName);
    storage.set('patientAge', patientAge);
    storage.set('patientGender', data.personalInfo.gender);

    // Clear patient temp data — patient creation is complete, visit flow takes over
    storage.remove('temp_patient_id');
    storage.remove('temp_visit_id');

    navigate('/ayu', {
      state: {
        patientUuid,
      },
    });
  };

  const genderInitial = data.personalInfo.gender
    ? data.personalInfo.gender.charAt(0).toUpperCase()
    : '';
  const ageNumber = data.personalInfo.age.match(/\d+/)?.[0] ?? '';
  const headerMeta = [genderInitial, ageNumber].filter(Boolean).join(' ');

  const phoneValue = data.personalInfo.phoneNumber
    ? `${data.personalInfo.phoneNumberCountryCode} ${data.personalInfo.phoneNumber}`
    : '';

  const personalItems: DetailItem[] = [
    { label: 'Name', value: fmt(fullName) },
    { label: 'Gender', value: fmt(data.personalInfo.gender) },
    { label: 'Date of birth', value: fmt(data.personalInfo.dateOfBirth) },
    { label: 'Age', value: fmt(data.personalInfo.age) },
    { label: 'Phone number', value: fmt(phoneValue) },
  ];

  const addressItems: DetailItem[] = [
    { label: 'Postal code', value: fmt(data.addressInfo.postalCode) },
    { label: 'Country', value: fmt(data.addressInfo.country) },
    { label: 'State', value: fmt(data.addressInfo.state) },
    { label: 'District', value: fmt(data.addressInfo.district) },
    { label: 'Village/Town/City', value: fmt(data.addressInfo.city) },
    {
      label: 'Corresponding Address 1',
      value: fmt(data.addressInfo.correspondingAddress1),
    },
  ];

  const otherItems: DetailItem[] = [
    {
      label: 'Son/Daughter/Wife of',
      value: fmt(data.otherInfo.sonDaughterWifeOf),
    },
    { label: 'Occupation', value: fmt(data.otherInfo.occupation) },
    { label: 'Caste', value: fmt(data.otherInfo.caste) },
    { label: 'Education', value: fmt(data.otherInfo.education) },
    { label: 'Economic status', value: fmt(data.otherInfo.economicStatus) },
  ];

  return (
    <div className="w-full flex flex-col h-full">
      <div className="flex-1 overflow-y-auto bg-gray-50">
        <div className="max-w-4xl w-full mx-auto p-4 md:p-6 space-y-4">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm px-4 py-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <img
                src={data.personalInfo.profilePhoto || defaultUserImg}
                alt={fullName}
                className="w-12 h-12 rounded-full object-cover border border-gray-200 shrink-0"
              />
              <div>
                <p className="font-semibold text-gray-900 text-base">
                  {fullName}
                  {headerMeta && (
                    <span className="ml-2 text-sm font-normal text-gray-400">
                      {headerMeta}
                    </span>
                  )}
                </p>
                {patientIdentifier && (
                  <p className="text-xs text-gray-400">
                    ID: {patientIdentifier}
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="secondary"
                size="sm"
                type="button"
                leftIcon={<img src={iconEdit} alt="" className="w-4 h-4" />}
              >
                Edit
              </Button>
              <Button
                variant="primary"
                size="sm"
                type="button"
                onClick={handleStartVisit}
              >
                Start visit
              </Button>
            </div>
          </div>

          <DetailSection
            icon={iconPersonal}
            title="Personal"
            items={personalItems}
          />
          <DetailSection
            icon={iconAddress}
            title="Address"
            items={addressItems}
          />
          <DetailSection icon={iconOther} title="Other" items={otherItems} />
        </div>
      </div>
    </div>
  );
}
