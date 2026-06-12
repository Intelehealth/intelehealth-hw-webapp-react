import { useEffect, useState } from 'react';
import { storage } from '../utils/storage';

export interface StoredUser {
  uuid: string;
  username?: string;
  name?: string;
  person?: { uuid: string; display?: string };
}

const read = (): StoredUser | null => {
  try {
    const raw = storage.getUser();
    return raw ? (JSON.parse(raw) as StoredUser) : null;
  } catch {
    return null;
  }
};

export const useStoredUser = (): StoredUser | null => {
  const [user, setUser] = useState<StoredUser | null>(read);
  useEffect(() => {
    const sync = () => setUser(read());
    window.addEventListener('ih:user-changed', sync);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener('ih:user-changed', sync);
      window.removeEventListener('storage', sync);
    };
  }, []);
  return user;
};

export default useStoredUser;
