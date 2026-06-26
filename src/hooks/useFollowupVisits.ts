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

export const useFollowupVisits = (fromDate?: string, toDate?: string) => {
  const { locationUuid } = useProfileContext();
  const [data, setData] = useState<FollowupVisit[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!locationUuid) return;
    setLoading(true);
    setError(null);
    patientService
      .getFollowupVisits(locationUuid, 0, 50, fromDate, toDate)
      .then(res => setData(res.visits))
      .catch(() => setError('Failed to fetch follow-up visits'))
      .finally(() => setLoading(false));
  }, [locationUuid, fromDate, toDate]);

  return { data, loading, error };
};
