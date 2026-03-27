import { getImageUrl } from '../api/jellyfin';
import styles from './Card.module.css';

export default function Card({ item, onClick }) {
  const imageUrl = getImageUrl(item.Id, 'Primary');

  return (
    <button className={styles.card} onClick={onClick}>
      <div className={styles.imageWrap}>
        <img
          src={imageUrl}
          alt={item.Name}
          className={styles.image}
          loading="lazy"
          onError={(e) => { e.target.style.display = 'none'; }}
        />
        {!item.ImageTags?.Primary && (
          <div className={styles.placeholder}>🎬</div>
        )}
      </div>
      <div className={styles.title}>{item.Name}</div>
    </button>
  );
}
