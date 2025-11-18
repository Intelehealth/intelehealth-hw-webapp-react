import { Button } from '../../../../../components/common';

interface PatientPrivacyPolicyComponentProps {
  onNext(data: { privacyPolicyAccepted: boolean }): void;
  onPrev(): void;
}

export default function PatientPrivacyPolicyComponent({
  onNext,
  onPrev,
}: PatientPrivacyPolicyComponentProps) {
  return (
    <div className="w-full">
      <h1 className="text-lg font-semibold text-gray-900 mb-6">
        Privacy Policy
      </h1>

      {/* Personal Information */}
      <section className="mb-6">
        <h2 className="text-base mb-1 text-(--color-primary-dark) font-semibold">
          Personal Information
        </h2>
        <p className="text-sm">
          Health Worker will collect personal information and health information
          from you for your medical records.
        </p>
      </section>

      {/* Use */}
      <section className="mb-6">
        <h2 className="text-base mb-1 text-(--color-primary-dark) font-semibold">
          Use
        </h2>
        <p className="text-sm">Your information is:</p>
        <ul className="list-none text-sm mt-1 space-y-1">
          <li>- used for diagnosing and treating you.</li>
          <li>
            - used to send you reminders, prescription information, and other
            related communication.
          </li>
        </ul>
        <p className="text-sm mt-2">
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
        <h2 className="text-base mb-1 text-(--color-primary-dark) font-semibold">
          Protection Measures
        </h2>
        <p className="text-sm">
          We provide physical, electronic, and procedural safeguards to protect
          information we process and maintain.
        </p>
      </section>

      {/* Access and Correction */}
      <section className="mb-6">
        <h2 className="text-base mb-1 text-(--color-primary-dark) font-semibold">
          Access and Correction
        </h2>
        <p className="text-sm">
          You have the right to ask for a copy of any personal information we
          hold about you, as well as to ask for it to be corrected if you think
          it is wrong.
        </p>
        <p className="text-sm mt-2">
          If you’d like us to delete or modify your personal data that you have
          provided to us, please contact the Data Privacy Officer at{' '}
          <a
            href="mailto:support@intelehealth.io"
            className="text-indigo-600 underline"
          >
            support@intelehealth.io
          </a>{' '}
          and we will respond in a reasonable time.
        </p>
        <p className="text-sm mt-2">
          On clicking “Accept”, I consent to the collection and use of my
          personal data, including health information, and to give access to the
          above-mentioned entities.
        </p>
      </section>

      {/* Buttons */}
      <div className="flex flex-col md:flex-row justify-center gap-3 mt-8">
        <Button
          variant="secondary"
          className="w-auto px-8"
          type="button"
          onClick={onPrev}
        >
          Decline
        </Button>
        <Button
          variant="primary"
          className="w-auto px-8"
          type="button"
          onClick={() => onNext({ privacyPolicyAccepted: true })}
        >
          Accept
        </Button>
      </div>
    </div>
  );
}
