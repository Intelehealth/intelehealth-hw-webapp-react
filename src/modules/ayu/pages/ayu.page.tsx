import { transformFhirToAyu } from '../../ayu-library/utils/fhir-to-ayu.util';
import { AyuRenderer } from './ayu-renderer.component';
import fhirJson from './Cough.questionnaire.json';

const ayuSchema = transformFhirToAyu(fhirJson);

export default function DemoPage() {
  if (!ayuSchema) {
    return <div>No questionnaire available</div>;
  }
  return (
    <div className="mx-auto p-6 space-y-6">
      {/* <Loader type="question" />
      <Loader type="section" currentSectionIndex={0} /> */}
      <AyuRenderer question={ayuSchema} />
    </div>
  );
}
