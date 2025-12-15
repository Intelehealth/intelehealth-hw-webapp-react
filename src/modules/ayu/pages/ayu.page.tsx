import AyuRenderer from '../components/ayu-renderer.component';
import type { AyuSchema } from '../types/ayu.types';

const sampleSchema: AyuSchema = {
  questions: [
    {
      id: '1',
      title: 'Your Name',
      input_type: 'text',
      placeholder: 'Describe',
    },
    {
      id: '3',
      title: 'Country',
      input_type: 'select',
      options: ['India', 'USA'],
    },
  ],
};

const AyuPage = () => {
  return (
    <div className="h-screen w-full bg-white p-6">
      <h1>Ayu Page</h1>
      <AyuRenderer schema={sampleSchema} />
    </div>
  );
};

export default AyuPage;
