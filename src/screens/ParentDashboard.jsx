import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { useProfiles } from '../hooks/useProfiles';
import { useVirtualFolders, useWatchHistory } from '../hooks/useJellyfin';
import { getAllRatings } from '../utils/ratings';
import { THEMES } from '../utils/themes';
import { FONTS } from '../utils/fonts';
import Modal from '../components/Modal';
import styles from './ParentDashboard.module.css';

const AVATARS = ['😊', '🦊', '🐻', '🦁', '🐰', '🐸', '🦄', '🐼', '🐶', '🐱', '🦋', '🌟', '🚀', '🎨'];
const THEME_ENTRIES = Object.entries(THEMES);

const SESSION_OPTIONS = [
  { value: 0, label: 'No Limit' },
  { value: 30, label: '30 minutes' },
  { value: 60, label: '1 hour' },
  { value: 90, label: '1.5 hours' },
  { value: 120, label: '2 hours' },
  { value: 180, label: '3 hours' },
];

function ProfileForm({ initial, folders, onSave, onCancel }) {
  const [name, setName] = useState(initial?.name || '');
  const [avatar, setAvatar] = useState(initial?.avatar || '😊');
  const [allowedLibraryId, setAllowedLibraryId] = useState(initial?.allowedLibraryId || '');
  const [maxRating, setMaxRating] = useState(initial?.maxRating || '');
  const [theme, setTheme] = useState(initial?.theme || '');
  const [font, setFont] = useState(initial?.font || 'nunito');
  const [sessionLimit, setSessionLimit] = useState(initial?.sessionLimit || 0);
  const [bedtimeStart, setBedtimeStart] = useState(initial?.bedtimeStart || '');
  const [bedtimeEnd, setBedtimeEnd] = useState(initial?.bedtimeEnd || '');

  function handleSubmit(e) {
    e.preventDefault();
    onSave({
      name, avatar, allowedLibraryId, maxRating, theme, font,
      sessionLimit: Number(sessionLimit),
      bedtimeStart, bedtimeEnd,
    });
  }

  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      <label className={styles.label}>
        Name
        <input className="input-field" value={name} onChange={(e) => setName(e.target.value)} required />
      </label>

      <div className={styles.label}>
        Avatar
        <div className={styles.avatarGrid}>
          {AVATARS.map((a) => (
            <button
              key={a}
              type="button"
              className={`${styles.avatarBtn} ${avatar === a ? styles.avatarActive : ''}`}
              onClick={() => setAvatar(a)}
            >
              {a}
            </button>
          ))}
        </div>
      </div>

      <div className={styles.label}>
        Theme {theme ? `(${THEMES[theme]?.name})` : '(auto from avatar)'}
        <div className={styles.themeGrid}>
          <button
            type="button"
            className={`${styles.themeBtn} ${!theme ? styles.themeActive : ''}`}
            onClick={() => setTheme('')}
          >
            <div className={styles.themeAuto}>Auto</div>
          </button>
          {THEME_ENTRIES.map(([id, t]) => (
            <button
              key={id}
              type="button"
              className={`${styles.themeBtn} ${theme === id ? styles.themeActive : ''}`}
              onClick={() => setTheme(id)}
              title={t.name}
            >
              <div
                className={styles.themeSwatch}
                style={{ background: `linear-gradient(135deg, ${t.primary}, ${t.secondary})` }}
              />
              <span className={styles.themeLabel}>{t.name}</span>
            </button>
          ))}
        </div>
      </div>

      <label className={styles.label}>
        Font
        <select className="input-field" value={font} onChange={(e) => setFont(e.target.value)}>
          {FONTS.map((f) => (
            <option key={f.id} value={f.id}>{f.name}</option>
          ))}
        </select>
      </label>

      <label className={styles.label}>
        Allowed Library
        <select className="input-field" value={allowedLibraryId} onChange={(e) => setAllowedLibraryId(e.target.value)}>
          <option value="">All Libraries</option>
          {folders.map((f) => (
            <option key={f.ItemId} value={f.ItemId}>{f.Name}</option>
          ))}
        </select>
      </label>

      <label className={styles.label}>
        Max Age Rating
        <select className="input-field" value={maxRating} onChange={(e) => setMaxRating(e.target.value)}>
          <option value="">No Limit</option>
          {getAllRatings().map((r) => (
            <option key={r} value={r}>{r}</option>
          ))}
        </select>
      </label>

      <label className={styles.label}>
        Session Time Limit
        <select className="input-field" value={sessionLimit} onChange={(e) => setSessionLimit(e.target.value)}>
          {SESSION_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </label>

      <div className={styles.label}>
        Bedtime (unavailable from / to)
        <div className={styles.bedtimeRow}>
          <input
            className="input-field"
            type="time"
            value={bedtimeStart}
            onChange={(e) => setBedtimeStart(e.target.value)}
          />
          <span className={styles.bedtimeTo}>to</span>
          <input
            className="input-field"
            type="time"
            value={bedtimeEnd}
            onChange={(e) => setBedtimeEnd(e.target.value)}
          />
          {(bedtimeStart || bedtimeEnd) && (
            <button
              type="button"
              className={styles.clearBtn}
              onClick={() => { setBedtimeStart(''); setBedtimeEnd(''); }}
            >
              Clear
            </button>
          )}
        </div>
      </div>

      <div className={styles.formActions}>
        <button type="button" className="btn-secondary" onClick={onCancel}>Cancel</button>
        <button type="submit" className="btn-primary">Save</button>
      </div>
    </form>
  );
}

function WatchHistoryPanel({ profile }) {
  const { items, loading } = useWatchHistory(profile.allowedLibraryId);
  if (loading) return <p className={styles.muted}>Loading...</p>;
  if (items.length === 0) return <p className={styles.muted}>No watch history yet.</p>;
  return (
    <div className={styles.historyList}>
      {items.slice(0, 50).map((item) => (
        <div key={item.Id} className={styles.historyItem}>
          <span className={styles.historyName}>{item.Name}</span>
          <span className={styles.historyType}>{item.Type}</span>
        </div>
      ))}
    </div>
  );
}

export default function ParentDashboard() {
  const navigate = useNavigate();
  const { parentPin, updateParentPin, parentSettings, updateParentSettings } = useApp();
  const { profiles, addProfile, editProfile, deleteProfile } = useProfiles();
  const { folders } = useVirtualFolders();

  const [editingProfile, setEditingProfile] = useState(null);
  const [showAdd, setShowAdd] = useState(false);
  const [showHistory, setShowHistory] = useState(null);
  const [newPin, setNewPin] = useState('');
  const [pinMessage, setPinMessage] = useState('');

  function handleAddProfile(data) {
    addProfile(data);
    setShowAdd(false);
  }

  function handleEditProfile(data) {
    editProfile(editingProfile.id, data);
    setEditingProfile(null);
  }

  function handleDeleteProfile(id) {
    deleteProfile(id);
  }

  function handleChangePin(e) {
    e.preventDefault();
    if (newPin.length !== 4 || !/^\d{4}$/.test(newPin)) {
      setPinMessage('PIN must be exactly 4 digits');
      return;
    }
    updateParentPin(newPin);
    setNewPin('');
    setPinMessage('PIN updated!');
    setTimeout(() => setPinMessage(''), 2000);
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>Parent Dashboard</h1>
        <button className="btn-secondary" onClick={() => navigate('/profiles')}>
          ← Back to Profiles
        </button>
      </header>

      {/* Child Profiles */}
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Child Profiles</h2>
          <button className="btn-primary" onClick={() => setShowAdd(true)}>+ Add Profile</button>
        </div>

        <div className={styles.profileGrid}>
          {profiles.map((p) => (
            <div key={p.id} className={styles.profileItem}>
              <span className={styles.profileEmoji}>{p.avatar || '😊'}</span>
              <div className={styles.profileInfo}>
                <div className={styles.profileName}>{p.name}</div>
                <div className={styles.profileMeta}>
                  {p.maxRating ? `Max: ${p.maxRating}` : 'No rating limit'}
                  {p.sessionLimit > 0 && ` | ${p.sessionLimit}min limit`}
                  {p.bedtimeStart && p.bedtimeEnd && ` | Bedtime ${p.bedtimeStart}-${p.bedtimeEnd}`}
                </div>
              </div>
              <div className={styles.profileActions}>
                <button className={styles.actionBtn} onClick={() => setEditingProfile(p)}>Edit</button>
                {parentSettings.showWatchHistory && (
                  <button className={styles.actionBtn} onClick={() => setShowHistory(p)}>History</button>
                )}
                <button
                  className={`${styles.actionBtn} ${styles.deleteBtn}`}
                  onClick={() => handleDeleteProfile(p.id)}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
          {profiles.length === 0 && (
            <p className={styles.muted}>No profiles. Create one to get started!</p>
          )}
        </div>
      </section>

      {/* Settings */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Settings</h2>
        <div className={styles.settingsGrid}>
          <label className={styles.toggle}>
            <input
              type="checkbox"
              checked={parentSettings.allowScrubbing}
              onChange={(e) => updateParentSettings({ ...parentSettings, allowScrubbing: e.target.checked })}
            />
            <span className={styles.toggleLabel}>Allow scrubbing in player</span>
          </label>
          <label className={styles.toggle}>
            <input
              type="checkbox"
              checked={parentSettings.autoplayNext}
              onChange={(e) => updateParentSettings({ ...parentSettings, autoplayNext: e.target.checked })}
            />
            <span className={styles.toggleLabel}>Autoplay next episode</span>
          </label>
          <label className={styles.toggle}>
            <input
              type="checkbox"
              checked={parentSettings.showWatchHistory}
              onChange={(e) => updateParentSettings({ ...parentSettings, showWatchHistory: e.target.checked })}
            />
            <span className={styles.toggleLabel}>Show watch history per profile</span>
          </label>
        </div>
      </section>

      {/* Change PIN */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Change Parent PIN</h2>
        <form onSubmit={handleChangePin} className={styles.pinForm}>
          <input
            className="input-field"
            type="password"
            maxLength={4}
            placeholder="New 4-digit PIN"
            value={newPin}
            onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ''))}
            style={{ maxWidth: 200 }}
          />
          <button type="submit" className="btn-primary">Update PIN</button>
          {pinMessage && <span className={styles.pinMsg}>{pinMessage}</span>}
        </form>
      </section>

      {/* Modals */}
      {showAdd && (
        <Modal title="Add Profile" onClose={() => setShowAdd(false)}>
          <ProfileForm folders={folders} onSave={handleAddProfile} onCancel={() => setShowAdd(false)} />
        </Modal>
      )}

      {editingProfile && (
        <Modal title={`Edit ${editingProfile.name}`} onClose={() => setEditingProfile(null)}>
          <ProfileForm
            initial={editingProfile}
            folders={folders}
            onSave={handleEditProfile}
            onCancel={() => setEditingProfile(null)}
          />
        </Modal>
      )}

      {showHistory && (
        <Modal title={`${showHistory.name}'s Watch History`} onClose={() => setShowHistory(null)}>
          <WatchHistoryPanel profile={showHistory} />
        </Modal>
      )}
    </div>
  );
}
