import { transformFhirToAyu } from '../../ayu-library/utils/fhir-to-ayu.util';
import fhirJson from './abdominal-distention_fhir_questionnaire.json';
import { AyuRenderer } from './ayu-renderer.component';

const ayuSchema = transformFhirToAyu(fhirJson);

export default function DemoPage() {
  if (!ayuSchema) {
    return <div>No questionnaire available</div>;
  }
  return (
    <div className="mx-auto p-6 space-y-6">
      <AyuRenderer question={ayuSchema} />
    </div>
  );
}
