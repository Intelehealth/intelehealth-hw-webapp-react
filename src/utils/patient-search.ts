/**
 * Case-insensitive, trimmed match of a search term against patient name or
 * OpenMRS ID. A missing ID (undefined, or null from the backend) never throws;
 * it just cannot match.
 */
export const matchesPatientSearch = (
  patient: { patientName: string; openMrsId?: string | null },
  search: string
): boolean => {
  const term = search.trim().toLowerCase();
  return (
    patient.patientName.toLowerCase().includes(term) ||
    (patient.openMrsId ?? '').toLowerCase().includes(term)
  );
};
