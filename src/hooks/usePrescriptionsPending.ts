import { useEffect, useState } from 'react';
import { useProfileContext } from '../context/ProfileContext';
import {
  patientService,
  type PrescriptionPendingVisit,
} from '../services/patient.service';

export const usePrescriptionsPending = () => {
  const { profile } = useProfileContext();
  const [data, setData] = useState<PrescriptionPendingVisit[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!profile?.id) return;
    setLoading(true);
    setError(null);
    patientService
      .getPrescriptionsPending(profile.id)
      .then(setData)
      .catch(() => setError('Failed to fetch pending prescriptions'))
      .finally(() => setLoading(false));
  }, [profile?.id]);

  return { data, loading, error, totalCount: data.length };
};
