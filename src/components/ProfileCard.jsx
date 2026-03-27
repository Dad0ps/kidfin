import styles from './ProfileCard.module.css';

const COLORS = ['#ff6b6b', '#5ce0d8', '#a78bfa', '#ff8a5c', '#6ee7b7', '#fbbf24'];

export default function ProfileCard({ profile, onClick }) {
  const bgColor = COLORS[profile.name.length % COLORS.length];

  return (
    <button className={styles.card} onClick={onClick}>
      <div className={styles.avatar} style={{ background: bgColor }}>
        <span className={styles.emoji}>{profile.avatar || '😊'}</span>
      </div>
      <div className={styles.name}>{profile.name}</div>
    </button>
  );
}
