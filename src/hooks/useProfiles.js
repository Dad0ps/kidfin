import { useCallback } from 'react';
import { useApp } from '../context/AppContext';

export function useProfiles() {
  const { childProfiles, updateChildProfiles } = useApp();

  const addProfile = useCallback((profile) => {
    const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 9);
    const newProfile = {
      id,
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

  const clearProfiles = useCallback(() => {
    updateChildProfiles([]);
  }, [updateChildProfiles]);

  return { profiles: childProfiles, addProfile, editProfile, deleteProfile, clearProfiles };
}
