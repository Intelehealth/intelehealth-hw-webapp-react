/**
 * Case-insensitive, trimmed match of a search term against patient name or
 * OpenMRS ID. A missing name or ID (undefined, or null from the backend) never
 * throws; that field just cannot match.
 */
export const matchesPatientSearch = (
  patient: { patientName?: string | null; openMrsId?: string | null },
  search: string
): boolean => {
  const term = search.trim().toLowerCase();
  return (
    (patient.patientName ?? '').toLowerCase().includes(term) ||
    (patient.openMrsId ?? '').toLowerCase().includes(term)
  );
};
