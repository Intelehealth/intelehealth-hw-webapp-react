import { Route, Routes, useParams, useLocation } from 'react-router-dom';
import { storage } from '../../../utils/storage';
import { transformFhirToAyu } from '../../ayu-library/utils/fhir-to-ayu.util';
import type { FhirQuestionnaire } from '../../ayu-library/types/fhir-raw.types';
import { StartVisit } from '../components/start-visit/start-visit.component';
import { AyuRenderer } from '../components/start-visit/visit-reason/ayu-renderer.component';
import { StartVisitProvider } from '../context/start-visit.context';
import { UUID_REGEX } from '../utils/ayu.constants';
import VisitSummaryPage from './visit-summary.page';
import fhirJson from './Cough.questionnaire.json';

const ayuSchema = transformFhirToAyu(fhirJson as unknown as FhirQuestionnaire);
const AyuPage = () => {
  const { patientUuid: paramUuid } = useParams<{ patientUuid: string }>();
  const location = useLocation();
  const stateUuid = (location.state as { patientUuid?: string })?.patientUuid;

  // Priority: state (from patient creation) > valid URL param > localStorage
  const validParamUuid =
    paramUuid && UUID_REGEX.test(paramUuid) ? paramUuid : undefined;
  const resolvedUuid =
    stateUuid || validParamUuid || storage.get('patientUuid') || null;

  if (!ayuSchema) {
    return <div>No questionnaire available</div>;
  }
  return (
    <StartVisitProvider initialPatientUuid={resolvedUuid}>
      <div className="mx-auto p-6 space-y-6">
        <Routes>
          <Route path="/" element={<StartVisit />} />
          <Route
            path="/renders"
            element={<AyuRenderer question={ayuSchema} />}
          />
          <Route path="/visit-summary" element={<VisitSummaryPage />} />
        </Routes>
      </div>
    </StartVisitProvider>
  );
};

export default AyuPage;
