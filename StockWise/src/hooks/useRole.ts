import { useState, useEffect } from 'react';
import { auth } from '../../firebaseConfig';
import { getUserRole } from '../firestoreService';
import type { UserRole } from '../types/roles';

export const useRole = () => {
  const [role, setRole] = useState<UserRole>('employee');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        const userRole = await getUserRole(user.uid);
        setRole(userRole);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return { role, loading };
};