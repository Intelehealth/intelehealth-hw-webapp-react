import { useEffect, useState } from 'react';
import { useProfileContext } from '../context/ProfileContext';
import {
  patientService,
  type PrescriptionReceivedVisit,
} from '../services/patient.service';

export const usePrescriptionsReceived = (
  fromDate?: string,
  toDate?: string
) => {
  const { locationUuid } = useProfileContext();
  const [data, setData] = useState<PrescriptionReceivedVisit[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!locationUuid) return;
    setLoading(true);
    setError(null);
    patientService
      .getPrescriptionsReceived(locationUuid, 0, 50, fromDate, toDate)
      .then(setData)
      .catch(() => setError('Failed to fetch prescriptions'))
      .finally(() => setLoading(false));
  }, [locationUuid, fromDate, toDate]);

  return { data, loading, error, totalCount: data.length };
};
