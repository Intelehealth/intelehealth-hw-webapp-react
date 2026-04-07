import { useEffect, useState } from 'react';
import { useProfileContext } from '../context/ProfileContext';
import { patientService } from '../services/patient.service';

export interface FollowupVisit {
  visitUuid: string;
  patientName: string;
  age: number;
  visitCreatedDate: string;
  clinicName: string;
  gender: string;
}

export const useFollowupVisits = () => {
  const { locationUuid } = useProfileContext();
  const [data, setData] = useState<FollowupVisit[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!locationUuid) return;
    setLoading(true);
    setError(null);
    patientService
      .getFollowupVisits(locationUuid)
      .then(res => setData(res.visits))
      .catch(() => setError('Failed to fetch follow-up visits'))
      .finally(() => setLoading(false));
  }, [locationUuid]);

  return { data, loading, error };
};
