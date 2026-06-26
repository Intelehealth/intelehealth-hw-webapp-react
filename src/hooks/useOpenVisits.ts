import { useEffect, useState } from 'react';
import { useProfileContext } from '../context/ProfileContext';
import { patientService, type OpenVisit } from '../services/patient.service';

export const useOpenVisits = (fromDate?: string, toDate?: string) => {
  const { locationUuid } = useProfileContext();
  const [data, setData] = useState<OpenVisit[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!locationUuid) return;
    setLoading(true);
    setError(null);
    patientService
      .getOpenVisits(locationUuid, 0, 50, fromDate, toDate)
      .then(({ visits, totalCount: count }) => {
        setData(visits);
        setTotalCount(count);
      })
      .catch(() => setError('Failed to fetch open visits'))
      .finally(() => setLoading(false));
  }, [locationUuid, fromDate, toDate]);

  return { data, loading, error, totalCount };
};
