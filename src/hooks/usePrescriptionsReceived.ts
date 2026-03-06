import { useEffect, useState } from 'react';
import { useProfileContext } from '../context/ProfileContext';
import {
  patientService,
  type PrescriptionReceivedVisit,
} from '../services/patient.service';

export const usePrescriptionsReceived = () => {
  const { profile } = useProfileContext();
  const [data, setData] = useState<PrescriptionReceivedVisit[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!profile?.id) return;
    setLoading(true);
    setError(null);
    patientService
      .getPrescriptionsReceived(profile.id)
      .then(setData)
      .catch(() => setError('Failed to fetch prescriptions'))
      .finally(() => setLoading(false));
  }, [profile?.id]);

  return { data, loading, error, totalCount: data.length };
};
