import Card from './Card';
import styles from './Shelf.module.css';

export default function Shelf({ title, items, loading }) {
  if (!loading && items.length === 0) return null;

  return (
    <section className={styles.shelf}>
      <h2 className={styles.title}>{title}</h2>
      <div className={styles.row}>
        {loading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className={styles.skeleton} />
          ))
        ) : (
          items.map((item) => <Card key={item.Id} item={item} />)
        )}
      </div>
    </section>
  );
}
