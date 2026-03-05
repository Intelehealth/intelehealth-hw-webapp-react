import { type Patient } from './patient-search.hook';

interface Props {
  patients: Patient[];
  loading: boolean;
  activeIndex: number;
  onSelect: (patient: Patient) => void;
  setActiveIndex: (index: number) => void;
}

const PatientSearchDropdown = ({
  patients,
  loading,
  activeIndex,
  onSelect,
  setActiveIndex,
}: Props) => {
  return (
    <div
      className="absolute mt-2 w-full bg-white shadow-lg rounded-xl max-h-120 overflow-y-auto  z-50 border-[rgba(178, 175, 190, 0.2)]"
      style={{ scrollbarWidth: 'none' }}
      id="patient-search-list"
      role="listbox"
    >
      <div className="px-4 py-2 text-s text-gray-600 border-b border-b-gray-200">
        Patients ({patients.length} results)
      </div>

      {loading ? (
        <div className="p-4 text-center text-gray-500">Searching...</div>
      ) : patients.length === 0 ? (
        <div className="p-4 text-center text-gray-500">No results found</div>
      ) : (
        patients.map((patient, index) => {
          const identifier = patient.identifiers?.[0]?.identifier || 'N/A';
          const isActive = index === activeIndex;
          return (
            <div
              key={patient.uuid}
              className={`flex items-start gap-3 border-b border-b-gray-200 p-3 cursor-pointer border-b last:border-none
        ${isActive ? 'bg-blue-100' : 'hover:bg-gray-100'}
      `}
              onMouseEnter={() => setActiveIndex(index)}
              onClick={() => onSelect(patient)}
              role="option"
              aria-selected={isActive}
            >
              <div className="flex flex-col">
                <div className="text-xs text-gray-500">OpenMRS ID</div>

                <div className="font-medium">{identifier}</div>
              </div>
              <div className="pt-4">
                {patient.person.display} ({patient.person.gender},{' '}
                {patient.person.age})
              </div>
            </div>
          );
        })
      )}
    </div>
  );
};

export default PatientSearchDropdown;
