import { useEffect } from 'react';
import { Route, Routes, useParams } from 'react-router-dom';
import { storage } from '../../../utils/storage';
import { transformFhirToAyu } from '../../ayu-library/utils/fhir-to-ayu.util';
import type { FhirQuestionnaire } from '../../ayu-library/types/fhir-raw.types';
import { StartVisit } from '../components/start-visit/start-visit.component';
import { AyuRenderer } from '../components/start-visit/visit-reason/ayu-renderer.component';
import { StartVisitProvider } from '../context/start-visit.context';
import VisitSummaryPage from './visit-summary.page';
import fhirJson from './Cough.questionnaire.json';

const ayuSchema = transformFhirToAyu(fhirJson as unknown as FhirQuestionnaire);
const AyuPage = () => {
  const { patientUuid } = useParams<{ patientUuid: string }>();

  // If patientUuid is passed via URL param, persist it to localStorage
  useEffect(() => {
    if (patientUuid) {
      storage.set('patientUuid', patientUuid);
    }
  }, [patientUuid]);

  if (!ayuSchema) {
    return <div>No questionnaire available</div>;
  }
  return (
    <StartVisitProvider>
      <div className="mx-auto p-6 space-y-6">
        <Routes>
          <Route path="/" element={<StartVisit />} />
          <Route path="/renders" element={<AyuRenderer question={ayuSchema} />} />
          <Route path="/visit-summary" element={<VisitSummaryPage />} />
        </Routes>
      </div>
    </StartVisitProvider>
  );
};

export default AyuPage;
