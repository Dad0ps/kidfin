import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import ProfileCard from '../components/ProfileCard';
import PinPad from '../components/PinPad';
import styles from './ProfileSelect.module.css';

export default function ProfileSelect() {
  const navigate = useNavigate();
  const { childProfiles, setCurrentProfile, parentPin } = useApp();
  const [showPin, setShowPin] = useState(false);

  function handleProfileClick(profile) {
    setCurrentProfile(profile);
    navigate('/home');
  }

  function handlePinSubmit(entered) {
    if (entered === parentPin) {
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

      <button className={styles.parentBtn} onClick={() => setShowPin(true)}>
        🔒 Parent
      </button>

      {showPin && (
        <PinPad onSubmit={handlePinSubmit} onCancel={() => setShowPin(false)} />
      )}
    </div>
  );
}
