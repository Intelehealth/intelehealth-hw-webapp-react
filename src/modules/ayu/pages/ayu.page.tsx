import { useCallback, useEffect } from 'react';
import {
  Route,
  Routes,
  useBlocker,
  useLocation,
  useParams,
} from 'react-router-dom';
import type { BlockerFunction } from 'react-router-dom';
import iconVisitSummary from '../../../assets/icons/icon-visit-summery.svg';
import { ConfirmationModal } from '../../../components/modal/confirmation.modal';
import { storage } from '../../../utils/storage';
import { StartVisit } from '../components/start-visit/start-visit.component';
import {
  StartVisitProvider,
  useStartVisitData,
} from '../context/start-visit.context';
import {
  EXIT_ASSESSMENT_MODAL,
  PATIENT_GENDER_KEY,
  PATIENT_UUID_KEY,
  UUID_REGEX,
} from '../utils/ayu.constants';
import VisitSummaryPage from './visit-summary.page';

const AyuLeaveGuard = () => {
  const { data, isUploaded } = useStartVisitData();

  const hasProgress = !!(
    data.vitals ||
    data.visitReason ||
    data.physicalExam ||
    data.medicalHistory
  );

  const shouldGuard = hasProgress && !isUploaded;

  const blocker = useBlocker(
    useCallback<BlockerFunction>(
      ({ currentLocation, nextLocation }) => {
        if (!shouldGuard) return false;
        return (
          currentLocation.pathname.startsWith('/ayu') &&
          !nextLocation.pathname.startsWith('/ayu')
        );
      },
      [shouldGuard]
    )
  );

  // Warn on hard navigation too (tab close / refresh / external URL).
  useEffect(() => {
    if (!shouldGuard) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [shouldGuard]);

  if (blocker.state !== 'blocked') return null;

  return (
    <ConfirmationModal
      open
      type="confirm"
      icon={iconVisitSummary}
      title={EXIT_ASSESSMENT_MODAL.TITLE}
      description={EXIT_ASSESSMENT_MODAL.DESCRIPTION}
      cancelText={EXIT_ASSESSMENT_MODAL.EXIT}
      confirmText={EXIT_ASSESSMENT_MODAL.CONTINUE}
      onClose={() => blocker.proceed?.()}
      onConfirm={() => blocker.reset?.()}
    />
  );
};

const AyuPage = () => {
  const { patientUuid: paramUuid } = useParams<{ patientUuid: string }>();
  const location = useLocation();
  const stateUuid = (location.state as { patientUuid?: string })?.patientUuid;

  // Priority: state (from patient creation) > valid URL param > localStorage
  const validParamUuid =
    paramUuid && UUID_REGEX.test(paramUuid) ? paramUuid : undefined;
  const resolvedUuid =
    stateUuid || validParamUuid || storage.get(PATIENT_UUID_KEY) || null;
  const resolvedGender = storage.get(PATIENT_GENDER_KEY) ?? null;

  return (
    <StartVisitProvider
      initialPatientUuid={resolvedUuid}
      initialGender={resolvedGender}
    >
      <AyuLeaveGuard />
      <div className="mx-auto p-2 space-y-6">
        <Routes>
          <Route path="/" element={<StartVisit />} />
          <Route path="/visit-summary" element={<VisitSummaryPage />} />
        </Routes>
      </div>
    </StartVisitProvider>
  );
};

export default AyuPage;
