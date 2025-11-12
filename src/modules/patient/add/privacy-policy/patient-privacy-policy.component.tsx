import { useNavigate } from 'react-router-dom';
import { Button } from '../../../../components/common';

interface PatientPrivacyPolicyComponentProps {
  onAccept(): void;
}

export default function PatientPrivacyPolicyComponent({
  onAccept,
}: PatientPrivacyPolicyComponentProps) {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
      <div className="max-w-2xl w-full bg-white shadow-md rounded-lg p-8">
        <h1 className="text-lg font-semibold text-gray-900 mb-6">
          Privacy Policy
        </h1>

        {/* Personal Information */}
        <section className="mb-6">
          <h2 className="text-indigo-600 font-medium mb-1">
            Personal Information
          </h2>
          <p className="text-gray-700 text-sm leading-relaxed">
            Health Worker will collect personal information and health
            information from you for your medical records.
          </p>
        </section>

        {/* Use */}
        <section className="mb-6">
          <h2 className="text-indigo-600 font-medium mb-1">Use</h2>
          <p className="text-gray-700 text-sm leading-relaxed">
            Your information is:
          </p>
          <ul className="list-disc list-inside text-gray-700 text-sm mt-1 space-y-1">
            <li>used for diagnosing and treating you.</li>
            <li>
              used to send you reminders, prescription information, and other
              related communication.
            </li>
          </ul>
          <p className="text-gray-700 text-sm leading-relaxed mt-2">
            Your personal information will be anonymized for use in research,
            disease monitoring, and analysis to help us improve our products and
            services. We may disclose your personal information in certain
            specific circumstances given here{' '}
            <a
              href="https://www.intelehealth.org/privacy-policy"
              className="text-indigo-600 underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              https://www.intelehealth.org/privacy-policy
            </a>
            .
          </p>
        </section>

        {/* Protection Measures */}
        <section className="mb-6">
          <h2 className="text-indigo-600 font-medium mb-1">
            Protection Measures
          </h2>
          <p className="text-gray-700 text-sm leading-relaxed">
            We provide physical, electronic, and procedural safeguards to
            protect information we process and maintain.
          </p>
        </section>

        {/* Access and Correction */}
        <section className="mb-6">
          <h2 className="text-indigo-600 font-medium mb-1">
            Access and Correction
          </h2>
          <p className="text-gray-700 text-sm leading-relaxed">
            You have the right to ask for a copy of any personal information we
            hold about you, as well as to ask for it to be corrected if you
            think it is wrong.
          </p>
          <p className="text-gray-700 text-sm leading-relaxed mt-2">
            If you’d like us to delete or modify your personal data that you
            have provided to us, please contact the Data Privacy Officer at{' '}
            <a
              href="mailto:support@intelehealth.io"
              className="text-indigo-600 underline"
            >
              support@intelehealth.io
            </a>{' '}
            and we will respond in a reasonable time.
          </p>
          <p className="text-gray-700 text-sm leading-relaxed mt-2">
            On clicking “Accept”, I consent to the collection and use of my
            personal data, including health information, and to give access to
            the above-mentioned entities.
          </p>
        </section>

        {/* Buttons */}
        <div className="flex justify-end gap-3 mt-8">
          <Button
            variant="secondary"
            className="w-full"
            type="button"
            onClick={() => navigate(-1)}
          >
            Decline
          </Button>
          <Button
            variant="primary"
            className="w-full"
            type="button"
            onClick={onAccept}
          >
            Accept
          </Button>
        </div>
      </div>
    </div>
  );
}
