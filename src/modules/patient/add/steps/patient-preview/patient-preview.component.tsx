import { Button } from '../../../../../components/common';
import type { PatientFormData } from '../../../../../types/patient/add/add-patient.types';

interface PatientPreviewComponentProps {
  data: PatientFormData;
}

const Card = ({
  title,
  details,
}: {
  title: string;
  details: Record<string, string>;
}) => (
  <div className="bg-white shadow-sm border rounded-xl p-5 flex-1">
    <div className="flex items-center justify-between mb-3">
      <h2 className="font-semibold text-gray-800 flex items-center gap-2">
        {title}
      </h2>
      <button className="text-sm text-indigo-600 hover:underline flex items-center gap-1">
        Change
      </button>
    </div>
    <ul className="text-sm text-gray-700 space-y-1">
      {Object.entries(details).map(([key, value]) =>
        value ? (
          <li key={key} className="flex">
            <span className="w-40 text-gray-500">{key}</span>
            <span className="font-medium">{value as string}</span>
          </li>
        ) : null
      )}
    </ul>
  </div>
);

export default function PatientPreviewComponent({
  data,
}: PatientPreviewComponentProps) {
  return (
    <div className="w-full flex flex-col h-full">
      <div className="bg-gray-50 flex justify-center items-start p-8">
        <div className="max-w-6xl w-full grid md:grid-cols-3 gap-6">
          <Card
            title="Personal"
            details={{
              'First Name': data.personalInfo.firstName,
              'Middle Name': data.personalInfo.middleName,
              'Last Name': data.personalInfo.lastName,
              'Date of Birth': data.personalInfo.dateOfBirth,
              Gender: data.personalInfo.gender,
              Phone:
                data.personalInfo.phoneNumberCountryCode +
                ' ' +
                data.personalInfo.phoneNumber,
              'Contact Type': data.personalInfo.contactType,
              'Emergency Contact Name': data.personalInfo.emergencyContactName,
              'Emergency Contact Number':
                data.personalInfo.emergencyContactNumber,
            }}
          />
          <Card
            title="Address"
            details={{
              'Postal Code': data.addressInfo.postalCode,
              City: data.addressInfo.city,
              State: data.addressInfo.state,
              Country: data.addressInfo.country,
              District: data.addressInfo.district,
              'Corresponding Address 1': data.addressInfo.correspondingAddress1,
              'Corresponding Address 2': data.addressInfo.correspondingAddress2,
            }}
          />
          <Card
            title="Other"
            details={{
              'Son/Daughter/Wife Of': data.otherInfo.sonDaughterWifeOf,
              Occupation: data.otherInfo.occupation,
              Caste: data.otherInfo.caste,
              Education: data.otherInfo.education,
              'Economic Status': data.otherInfo.economicStatus,
            }}
          />
        </div>
      </div>
      {/* Buttons */}
      <div className="flex flex-col md:flex-row justify-center gap-3 pb-6">
        <Button variant="primary" className="w-auto px-8" type="button">
          Start Visit
        </Button>
      </div>
    </div>
  );
}
