import { Route, Routes } from 'react-router-dom';
import { transformFhirToAyu } from '../../ayu-library/utils/fhir-to-ayu.util';
import type { FhirQuestionnaire } from '../../ayu-library/types/fhir-raw.types';
import { StartVisit } from '../components/start-visit/start-visit.component';
import { AyuRenderer } from '../components/start-visit/visit-reason/ayu-renderer.component';
import fhirJson from './Cough.questionnaire.json';

const ayuSchema = transformFhirToAyu(fhirJson as unknown as FhirQuestionnaire);
const AyuPage = () => {
  if (!ayuSchema) {
    return <div>No questionnaire available</div>;
  }
  return (
    <div className="mx-auto p-6 space-y-6">
      <Routes>
        <Route path="/" element={<StartVisit />} />
        <Route path="/renders" element={<AyuRenderer question={ayuSchema} />} />
      </Routes>
    </div>
  );
};

export default AyuPage;
