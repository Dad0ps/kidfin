import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import ProfileCard from '../components/ProfileCard';
import PinPad from '../components/PinPad';
import { applyTheme, getThemeForProfile, clearTheme } from '../utils/themes';
import { applyFont, applyFontSize, clearFont } from '../utils/fonts';
import styles from './ProfileSelect.module.css';

function isInBedtime(profile) {
  const { bedtimeStart, bedtimeEnd } = profile;
  if (!bedtimeStart || !bedtimeEnd) return false;

  const now = new Date();
  const [startH, startM] = bedtimeStart.split(':').map(Number);
  const [endH, endM] = bedtimeEnd.split(':').map(Number);

  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const startMinutes = startH * 60 + startM;
  const endMinutes = endH * 60 + endM;

  if (startMinutes > endMinutes) {
    return nowMinutes >= startMinutes || nowMinutes < endMinutes;
  }
  return nowMinutes >= startMinutes && nowMinutes < endMinutes;
}

export default function ProfileSelect() {
  const navigate = useNavigate();
  const { childProfiles, setCurrentProfile, parentPin, setParentUnlocked } = useApp();
  const [showPin, setShowPin] = useState(false);
  const [profilePinTarget, setProfilePinTarget] = useState(null);
  const [bedtimeMessage, setBedtimeMessage] = useState(null);

  // Reset to defaults on profile select screen
  clearTheme();
  clearFont();
  setParentUnlocked(false);

  function enterProfile(profile) {
    setCurrentProfile(profile);
    applyTheme(getThemeForProfile(profile));
    if (profile.font) applyFont(profile.font);
    if (profile.fontSize) applyFontSize(profile.fontSize);
    navigate('/home');
  }

  function handleProfileClick(profile) {
    setShowPin(false);
    if (isInBedtime(profile)) {
      setBedtimeMessage(profile.name);
      setTimeout(() => setBedtimeMessage(null), 3000);
      return;
    }
    if (profile.profilePin) {
      setProfilePinTarget(profile);
    } else {
      enterProfile(profile);
    }
  }

  function handleProfilePinSubmit(entered) {
    if (entered === profilePinTarget.profilePin) {
      enterProfile(profilePinTarget);
      setProfilePinTarget(null);
      return true;
    }
    return false;
  }

  function handlePinSubmit(entered) {
    if (entered === parentPin) {
      setParentUnlocked(true);
      navigate('/parent');
      return true;
    }
    return false;
  }

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Who's watching?</h1>

      <div className={styles.profiles}>
        {childProfiles.length === 0 && (
          <p className={styles.empty}>
            No profiles yet! Tap the parent button to create one.
          </p>
        )}
        {childProfiles.map((profile) => (
          <ProfileCard
            key={profile.id}
            profile={profile}
            onClick={() => handleProfileClick(profile)}
          />
        ))}
      </div>

      {bedtimeMessage && (
        <div className={styles.bedtimeNotice}>
          It's bedtime for {bedtimeMessage}!
        </div>
      )}

      <button className={styles.parentBtn} onClick={() => setShowPin(true)}>
        Parent
      </button>

      {showPin && (
        <PinPad
          title="Enter Parent PIN"
          digits={4}
          onSubmit={handlePinSubmit}
          onCancel={() => setShowPin(false)}
        />
      )}

      {profilePinTarget && (
        <PinPad
          title={`Enter ${profilePinTarget.name}'s PIN`}
          digits={2}
          onSubmit={handleProfilePinSubmit}
          onCancel={() => setProfilePinTarget(null)}
        />
      )}
    </div>
  );
}
