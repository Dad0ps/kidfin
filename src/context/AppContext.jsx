import { createContext, useContext, useState, useCallback } from 'react';
import {
  getServerUrl, getAccessToken, getAdminUserId,
  getChildProfiles, setChildProfiles as saveChildProfiles,
  getParentPin, setParentPin as saveParentPin,
  getParentSettings, setParentSettings as saveParentSettings,
  isSetupComplete,
} from '../utils/storage';

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [serverUrl] = useState(getServerUrl);
  const [accessToken] = useState(getAccessToken);
  const [adminUserId] = useState(getAdminUserId);
  const [childProfiles, setChildProfilesState] = useState(getChildProfiles);
  const [currentProfile, setCurrentProfile] = useState(null);
  const [parentPin, setParentPinState] = useState(getParentPin);
  const [parentSettings, setParentSettingsState] = useState(getParentSettings);

  const updateChildProfiles = useCallback((profiles) => {
    setChildProfilesState(profiles);
    saveChildProfiles(profiles);
  }, []);

  const updateParentPin = useCallback((pin) => {
    setParentPinState(pin);
    saveParentPin(pin);
  }, []);

  const updateParentSettings = useCallback((settings) => {
    setParentSettingsState(settings);
    saveParentSettings(settings);
  }, []);

  const value = {
    serverUrl,
    accessToken,
    adminUserId,
    setupComplete: isSetupComplete(),
    childProfiles,
    updateChildProfiles,
    currentProfile,
    setCurrentProfile,
    parentPin,
    updateParentPin,
    parentSettings,
    updateParentSettings,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
