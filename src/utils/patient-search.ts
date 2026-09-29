/** Case-insensitive, trimmed match of a search term against patient name or OpenMRS ID. */
export const matchesPatientSearch = (
  patient: { patientName: string; openMrsId?: string },
  search: string
): boolean => {
  const term = search.trim().toLowerCase();
  return (
    patient.patientName.toLowerCase().includes(term) ||
    (patient.openMrsId ?? '').toLowerCase().includes(term)
  );
};
