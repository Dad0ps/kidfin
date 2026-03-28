const KEYS = {
  SERVER_URL: 'kidfin_serverUrl',
  ACCESS_TOKEN: 'kidfin_accessToken',
  ADMIN_USER_ID: 'kidfin_adminUserId',
  CHILD_PROFILES: 'kidfin_childProfiles',
  PARENT_PIN: 'kidfin_parentPin',
  PARENT_SETTINGS: 'kidfin_parentSettings',
};

export function getServerUrl() {
  return localStorage.getItem(KEYS.SERVER_URL) || '';
}

export function setServerUrl(url) {
  localStorage.setItem(KEYS.SERVER_URL, url);
}

export function getAccessToken() {
  return localStorage.getItem(KEYS.ACCESS_TOKEN) || '';
}

export function setAccessToken(token) {
  localStorage.setItem(KEYS.ACCESS_TOKEN, token);
}

export function getAdminUserId() {
  return localStorage.getItem(KEYS.ADMIN_USER_ID) || '';
}

export function setAdminUserId(id) {
  localStorage.setItem(KEYS.ADMIN_USER_ID, id);
}

export function getChildProfiles() {
  try {
    return JSON.parse(localStorage.getItem(KEYS.CHILD_PROFILES)) || [];
  } catch {
    return [];
  }
}

export function setChildProfiles(profiles) {
  localStorage.setItem(KEYS.CHILD_PROFILES, JSON.stringify(profiles));
}

export function getParentPin() {
  return localStorage.getItem(KEYS.PARENT_PIN) || '1234';
}

export function setParentPin(pin) {
  localStorage.setItem(KEYS.PARENT_PIN, pin);
}

export function getParentSettings() {
  try {
    return JSON.parse(localStorage.getItem(KEYS.PARENT_SETTINGS)) || {
      allowScrubbing: false,
      autoplayNext: true,
    };
  } catch {
    return { allowScrubbing: false, autoplayNext: true };
  }
}

export function setParentSettings(settings) {
  localStorage.setItem(KEYS.PARENT_SETTINGS, JSON.stringify(settings));
}

export function clearSetup() {
  localStorage.removeItem(KEYS.SERVER_URL);
  localStorage.removeItem(KEYS.ACCESS_TOKEN);
  localStorage.removeItem(KEYS.ADMIN_USER_ID);
}

export function isSetupComplete() {
  return !!getServerUrl() && !!getAccessToken();
}
