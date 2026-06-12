import { Route, Routes, useLocation, useParams } from 'react-router-dom';
import { storage } from '../../../utils/storage';
import { StartVisit } from '../components/start-visit/start-visit.component';
import { StartVisitProvider } from '../context/start-visit.context';
import { PATIENT_UUID_KEY, UUID_REGEX } from '../utils/ayu.constants';
import VisitSummaryPage from './visit-summary.page';

const AyuPage = () => {
  const { patientUuid: paramUuid } = useParams<{ patientUuid: string }>();
  const location = useLocation();
  const stateUuid = (location.state as { patientUuid?: string })?.patientUuid;

  // Priority: state (from patient creation) > valid URL param > localStorage
  const validParamUuid =
    paramUuid && UUID_REGEX.test(paramUuid) ? paramUuid : undefined;
  const resolvedUuid =
    stateUuid || validParamUuid || storage.get(PATIENT_UUID_KEY) || null;

  return (
    <StartVisitProvider initialPatientUuid={resolvedUuid}>
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
