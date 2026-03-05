import axios from 'axios';
import { useEffect, useRef, useState } from 'react';
import { PatientSearchService } from './patient-search.service';
export interface Patient {
  uuid: string;
  identifiers: {
    identifier: string;
    identifierType: {
      name: string;
    };
  }[];
  person: {
    display: string;
    gender: string;
    age: number;
    attributes: {
      display: string;
    }[];
  };
}

export const usePatientSearch = (searchTerm: string) => {
  const [patients, setPatients] = useState<Patient[]>([]);

  const [loading, setLoading] = useState(false);
  const cancelTokenRef = useRef<ReturnType<
    typeof axios.CancelToken.source
  > | null>(null);

  useEffect(() => {
    if (!searchTerm.trim()) {
      setPatients([]);
      return;
    }

    const delayDebounce = setTimeout(() => {
      fetchPatients(searchTerm);
    }, 500);

    return () => clearTimeout(delayDebounce);
  }, [searchTerm]);

  const fetchPatients = async (query: string) => {
    try {
      if (cancelTokenRef.current) {
        cancelTokenRef.current.cancel();
      }

      cancelTokenRef.current = axios.CancelToken.source();
      setLoading(true);
      const response = (await PatientSearchService.searchPatient(query)) as {
        results?: Array<Patient>;
      };

      setPatients(response.results || []);
    } catch (error: unknown) {
      if (!axios.isCancel(error)) {
        console.error(error);
      }
    } finally {
      setLoading(false);
    }
  };

  return { patients, loading };
};
