import { getThemeForProfile } from '../utils/themes';
import styles from './ProfileCard.module.css';

export default function ProfileCard({ profile, onClick }) {
  const theme = getThemeForProfile(profile);

  return (
    <button className={styles.card} onClick={onClick}>
      <div className={styles.avatar} style={{ background: `linear-gradient(135deg, ${theme.primary}, ${theme.secondary})` }}>
        <span className={styles.emoji}>{profile.avatar || '😊'}</span>
      </div>
      <div className={styles.name}>{profile.name}</div>
    </button>
  );
}
