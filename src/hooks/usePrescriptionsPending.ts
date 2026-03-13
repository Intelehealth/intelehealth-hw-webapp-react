import { useEffect, useState } from 'react';
import { useProfileContext } from '../context/ProfileContext';
import {
  patientService,
  type PrescriptionPendingVisit,
} from '../services/patient.service';

export const usePrescriptionsPending = () => {
  const { locationUuid } = useProfileContext();
  const [data, setData] = useState<PrescriptionPendingVisit[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!locationUuid) return;
    setLoading(true);
    setError(null);
    patientService
      .getPrescriptionsPending(locationUuid)
      .then(setData)
      .catch(() => setError('Failed to fetch pending prescriptions'))
      .finally(() => setLoading(false));
  }, [locationUuid]);

  return { data, loading, error, totalCount: data.length };
};
