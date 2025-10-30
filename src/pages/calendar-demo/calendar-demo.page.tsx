import React, { useState } from 'react';
import { Calendar } from '../../components/common';

const CalendarDemo: React.FC = () => {
  const [basicDate, setBasicDate] = useState<string>('');
  const [advancedDate, setAdvancedDate] = useState<string>('');
  const [restrictedDate, setRestrictedDate] = useState<string>('');

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          React DatePicker Calendar Demo
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Basic Calendar */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              Basic Calendar
            </h2>
            <p className="text-sm text-gray-600 mb-4">
              Simple date picker with year/month dropdowns
            </p>
            <Calendar
              label="Basic Calendar"
              value={basicDate}
              onChange={setBasicDate}
              placeholder="Select date"
            />
            {basicDate && (
              <div className="mt-4 p-3 bg-blue-50 rounded">
                <p className="text-sm text-blue-800">
                  Selected: {new Date(basicDate).toLocaleDateString()}
                </p>
              </div>
            )}
          </div>

          {/* Advanced Calendar */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              Advanced Calendar
            </h2>
            <p className="text-sm text-gray-600 mb-4">
              With custom formatting and scrollable year dropdown
            </p>
            <Calendar
              label="Advanced Calendar"
              value={advancedDate}
              onChange={setAdvancedDate}
              placeholder="Select date"
              dateFormat="dd-MMM-yy"
            />
            {advancedDate && (
              <div className="mt-4 p-3 bg-green-50 rounded">
                <p className="text-sm text-green-800">
                  Selected: {new Date(advancedDate).toLocaleDateString()}
                </p>
              </div>
            )}
          </div>

          {/* Restricted Calendar */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              Restricted Calendar
            </h2>
            <p className="text-sm text-gray-600 mb-4">
              Only allows past dates (max date is today)
            </p>
            <Calendar
              label="Restricted Calendar"
              value={restrictedDate}
              onChange={setRestrictedDate}
              placeholder="Select past date"
              dateFormat="dd-MMM-yy"
              maxDate={new Date()}
              minDate={new Date('1900-01-01')}
            />
            {restrictedDate && (
              <div className="mt-4 p-3 bg-purple-50 rounded">
                <p className="text-sm text-purple-800">
                  Selected: {new Date(restrictedDate).toLocaleDateString()}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Usage Instructions */}
        <div className="mt-12 bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">
            Usage Instructions
          </h2>

          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-medium text-gray-700 mb-2">
                Basic Usage
              </h3>
              <p className="text-gray-600 mb-2">
                Simple date picker with default settings.
              </p>
              <pre className="bg-gray-100 p-3 rounded text-sm overflow-x-auto">
                {`import { Calendar } from '../../components/common';

<Calendar
  label="Date of Birth"
  value={date}
  onChange={setDate}
  isRequired={true}
  error={errors.date?.message}
/>`}
              </pre>
            </div>

            <div>
              <h3 className="text-lg font-medium text-gray-700 mb-2">
                Advanced Usage
              </h3>
              <p className="text-gray-600 mb-2">
                With custom formatting, year/month dropdowns, and date
                restrictions.
              </p>
              <pre className="bg-gray-100 p-3 rounded text-sm overflow-x-auto">
                {`<Calendar
  label="Date of Birth"
  value={date}
  onChange={setDate}
  placeholder="Select date of birth"
  showYearDropdown={false}
  showMonthDropdown={true}
  dropdownMode="select"
  dateFormat="dd-MMM-yy"
  maxDate={new Date()}
  minDate={new Date('1900-01-01')}
  isRequired={true}
  error={errors.date?.message}
/>`}
              </pre>
            </div>

            <div>
              <h3 className="text-lg font-medium text-gray-700 mb-2">
                Available Props
              </h3>
              <div className="text-gray-600 text-sm space-y-1">
                <p>
                  <strong>value:</strong> Selected date as string (YYYY-MM-DD
                  format)
                </p>
                <p>
                  <strong>onChange:</strong> Callback function when date changes
                </p>
                <p>
                  <strong>label:</strong> Label text for the input
                </p>
                <p>
                  <strong>placeholder:</strong> Placeholder text
                </p>
                <p>
                  <strong>showYearDropdown:</strong> Show year dropdown
                  (default: true)
                </p>
                <p>
                  <strong>showMonthDropdown:</strong> Show month dropdown
                  (default: true)
                </p>
                <p>
                  <strong>dropdownMode:</strong> 'scroll' or 'select' (default:
                  'select')
                </p>
                <p>
                  <strong>yearDropdownItemNumber:</strong> Number of years to
                  show (default: 50)
                </p>
                <p>
                  <strong>scrollableYearDropdown:</strong> Enable year scrolling
                  (default: true)
                </p>
                <p>
                  <strong>dateFormat:</strong> Date display format (default: 'dd
                  MMM, yyyy')
                </p>
                <p>
                  <strong>maxDate:</strong> Maximum selectable date
                </p>
                <p>
                  <strong>minDate:</strong> Minimum selectable date
                </p>
                <p>
                  <strong>disabled:</strong> Disable the input
                </p>
                <p>
                  <strong>error:</strong> Error message to display
                </p>
                <p>
                  <strong>isRequired:</strong> Mark as required field
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CalendarDemo;
