import { useCallback } from 'react';
import { useApp } from '../context/AppContext';

export function useProfiles() {
  const { childProfiles, updateChildProfiles } = useApp();

  const addProfile = useCallback((profile) => {
    const newProfile = {
      id: crypto.randomUUID(),
      ...profile,
    };
    updateChildProfiles([...childProfiles, newProfile]);
    return newProfile;
  }, [childProfiles, updateChildProfiles]);

  const editProfile = useCallback((id, updates) => {
    updateChildProfiles(
      childProfiles.map((p) => (p.id === id ? { ...p, ...updates } : p))
    );
  }, [childProfiles, updateChildProfiles]);

  const deleteProfile = useCallback((id) => {
    updateChildProfiles(childProfiles.filter((p) => p.id !== id));
  }, [childProfiles, updateChildProfiles]);

  return { profiles: childProfiles, addProfile, editProfile, deleteProfile };
}
