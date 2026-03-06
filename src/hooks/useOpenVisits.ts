import { useEffect, useState } from 'react';
import { useProfileContext } from '../context/ProfileContext';
import { patientService, type OpenVisit } from '../services/patient.service';

export const useOpenVisits = () => {
  const { profile } = useProfileContext();
  const [data, setData] = useState<OpenVisit[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!profile?.id) return;
    setLoading(true);
    setError(null);
    patientService
      .getOpenVisits(profile.id)
      .then(setData)
      .catch(() => setError('Failed to fetch open visits'))
      .finally(() => setLoading(false));
  }, [profile?.id]);

  return { data, loading, error, totalCount: data.length };
};
