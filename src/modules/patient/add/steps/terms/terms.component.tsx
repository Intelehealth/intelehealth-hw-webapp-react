import { Button } from '../../../../../components/common';

interface PatientTermsComponentProps {
  onNext(data: { termsAccepted: boolean }): void;
  onPrev(): void;
}

export default function PatientTermsComponent({
  onNext,
  onPrev,
}: PatientTermsComponentProps) {
  return (
    <div className="w-full flex flex-col h-full">
      <div className="">
        <h1 className="text-lg font-semibold text-gray-900 mb-6">
          Processing Personal Data
        </h1>
        <p className="text-sm mb-6">
          Please read through the following statements and signify your consent,
          if you agree with the statement:
        </p>
        <section className="mb-6">
          <ul className="list-decimal list-inside text-sm mt-1 space-y-1">
            <li className="mb-5">
              I am availing teleconsultation services from registered medical
              practitioners (RMP) with the help of health workers and using the
              platform of Intelehealth.
            </li>
            <li className="mb-5">
              RMP, health worker, and Intelehealth will ask for my personal data
              including medical history, laboratory reports, test findings,
              health data, and other information for teleconsultation and
              providing me with telemedicine and telehealth services, that I
              wish to undertake for my medical condition.
            </li>
            <li className="mb-5">
              Additionally, my personal data collected shall be processed by
              Intelehealth for creating medical records, communicating with me
              for reminders, prescriptions, and other matters connected with
              teleconsultation and services availed by me, and compliance with
              applicable law.
            </li>
            <li className="mb-5">
              Further, my personal data will be deidentified or anonymized by
              Intelehealth to undertake research, disease monitoring, and
              analysis to improve their products and services.
            </li>
            <li className="mb-5">
              The details of what and how my personal data would be processed by
              Intelehealth has been provided for in its terms of use
              www.intelehealth.org/terms-of-use/ and privacy policy –
              www.intelehealth.org/privacy-policy.
            </li>
            <li className="mb-5">
              Intelehealth, RMP, health worker may make notes during the
              consultation, prepare written reports and prescriptions, and other
              documents containing my personal data; all of such documents will
              be treated as my personal data.
            </li>
            <li className="mb-5">
              I shall have a right to access, review, and rectify my personal
              data, and for repeated requests, Intelehealth may charge a
              reasonable fee.
            </li>
            <li className="mb-5">
              I shall have a right to receive a copy of my personal data, and
              for repeated requests, Intelehealth may charge a reasonable fee.
            </li>
            <li className="mb-5">
              I shall have a right to withdraw your consent. If I withdraw my
              consent, RMP, health worker, and Intelehealth shall have no
              obligation to provide me with teleconsultation as the same would
              not be possible without processing my personal data. Any
              processing done prior to withdrawal of consent shall remain as-is.
            </li>
            <li className="mb-5">
              Processing of my personal data will be as per applicable law.
            </li>
            <li className="mb-5">
              No information in an identifiable format will be disclosed to any
              third-party without my consent, except disclosure that is
              essential for providing me teleconsultation services or compliance
              with applicable law.
            </li>
            <li className="mb-5">
              Intelehealth provides physical, electronic, and procedural
              safeguards to protect the personal data that it processes and I
              have been made aware of such measures, which are also captured in
              the privacy policy.
            </li>
            <li className="mb-5">
              I can reach out to Intelehealth if I have any queries regarding
              the processing of my personal data at support@intelehealth.org and
              Intelehealth will respond in a reasonable time.
            </li>
          </ul>
        </section>
        <section className="mb-6">
          <h2 className="text-base mb-1 text-(--color-primary-dark) font-semibold">
            Concent:
          </h2>
          <p className="text-sm">
            I have read and understood the notice for consent. The details have
            been explained to me and I am aware of the consequences. With all
            required information, I hereby give my explicit, free,
            unconditional, and informed consent to the processing of my personal
            data for the stated purposes.
          </p>
        </section>
      </div>
      {/* Buttons */}
      <div className="flex flex-col md:flex-row justify-center gap-3 pb-6">
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
          onClick={() => onNext({ termsAccepted: true })}
        >
          Accept
        </Button>
      </div>
    </div>
  );
}
