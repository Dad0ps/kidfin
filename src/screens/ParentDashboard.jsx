import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { useProfiles } from '../hooks/useProfiles';
import { useVirtualFolders } from '../hooks/useJellyfin';
import { useUpdateCheck } from '../hooks/useUpdateCheck';
import PinPad from '../components/PinPad';
import { getAllRatings } from '../utils/ratings';
import { THEMES, applyTheme, getThemeForProfile, clearTheme } from '../utils/themes';
import { FONTS, applyFont, applyFontSize, clearFont, DEFAULT_FONT_SIZE, MIN_FONT_SIZE, MAX_FONT_SIZE } from '../utils/fonts';
import Modal from '../components/Modal';
import styles from './ParentDashboard.module.css';

const AVATARS = ['😊', '🦊', '🐻', '🦁', '🐰', '🐸', '🦄', '🐼', '🐶', '🐱', '🦋', '🌟', '🚀', '🎨'];
const THEME_ENTRIES = Object.entries(THEMES);

const SESSION_OPTIONS = [
  { value: 0, label: 'No Limit' },
  { value: 30, label: '30 min' },
  { value: 60, label: '1 hr' },
  { value: 90, label: '1.5 hr' },
  { value: 120, label: '2 hr' },
  { value: 180, label: '3 hr' },
];

function ProfileCard({ profile, folders, onSave, onDelete }) {
  const [expanded, setExpanded] = useState(false);
  const [name, setName] = useState(profile.name);
  const [avatar, setAvatar] = useState(profile.avatar || '😊');
  const [allowedLibraryId, setAllowedLibraryId] = useState(profile.allowedLibraryId || '');
  const [maxRating, setMaxRating] = useState(profile.maxRating || '');
  const [theme, setTheme] = useState(profile.theme || '');
  const [font, setFont] = useState(profile.font || 'nunito');
  const [fontSize, setFontSize] = useState(profile.fontSize || DEFAULT_FONT_SIZE);
  const [sessionLimit, setSessionLimit] = useState(profile.sessionLimit || 0);
  const [bedtimeStart, setBedtimeStart] = useState(profile.bedtimeStart || '');
  const [bedtimeEnd, setBedtimeEnd] = useState(profile.bedtimeEnd || '');
  const [profilePin, setProfilePin] = useState(profile.profilePin || '');
  const nameTimer = useRef(null);

  function save(overrides = {}) {
    const data = {
      name, avatar, allowedLibraryId, maxRating, theme, font,
      fontSize: Number(fontSize),
      sessionLimit: Number(sessionLimit),
      bedtimeStart, bedtimeEnd, profilePin,
      ...overrides,
    };
    onSave(profile.id, data);
  }

  function handleChange(setter, key) {
    return (val) => {
      setter(val);
      save({ [key]: key === 'sessionLimit' ? Number(val) : val });
    };
  }

  function handleNameChange(val) {
    setName(val);
    if (nameTimer.current) clearTimeout(nameTimer.current);
    nameTimer.current = setTimeout(() => save({ name: val }), 500);
  }

  function handleThemeChange(val) {
    setTheme(val);
    save({ theme: val });
    applyTheme(getThemeForProfile({ avatar, theme: val }));
  }

  function handleFontChange(val) {
    setFont(val);
    save({ font: val });
    applyFont(val);
  }

  function handleFontSizeChange(val) {
    const size = Number(val);
    setFontSize(size);
    save({ fontSize: size });
    applyFontSize(size);
  }

  function handleAvatarChange(val) {
    setAvatar(val);
    save({ avatar: val });
    if (!theme) {
      applyTheme(getThemeForProfile({ avatar: val, theme: '' }));
    }
  }

  function handleToggle(nowExpanded) {
    setExpanded(nowExpanded);
    if (!nowExpanded) {
      clearTheme();
      clearFont();
    }
  }

  const themeName = theme ? THEMES[theme]?.name : THEMES[avatar]?.name || 'Default';
  const fontName = FONTS.find((f) => f.id === font)?.name || 'Default';
  const libraryName = folders.find((f) => f.ItemId === allowedLibraryId)?.Name || 'All';

  return (
    <div className={`${styles.card} ${expanded ? styles.cardExpanded : ''}`}>
      {/* Summary row — always visible */}
      <button className={styles.cardHeader} onClick={() => handleToggle(!expanded)}>
        <span className={styles.cardEmoji}>{avatar}</span>
        <div className={styles.cardInfo}>
          <div className={styles.cardName}>{name}</div>
          <div className={styles.cardMeta}>
            {maxRating || 'No limit'}
            {sessionLimit > 0 && ` · ${sessionLimit}min`}
            {bedtimeStart && bedtimeEnd && ` · ${bedtimeStart}-${bedtimeEnd}`}
            {` · ${libraryName}`}
            {profilePin && ' · PIN set'}
          </div>
        </div>
        <span className={styles.cardChevron}>{expanded ? '▲' : '▼'}</span>
      </button>

      {/* Expanded settings */}
      {expanded && (
        <div className={styles.cardBody}>
          {/* Row 1: Name + Profile PIN */}
          <div className={styles.row}>
            <label className={styles.field}>
              <span className={styles.fieldLabel}>Name</span>
              <input className="input-field" value={name} onChange={(e) => handleNameChange(e.target.value)} required />
            </label>
            <label className={styles.field}>
              <span className={styles.fieldLabel}>Profile PIN (2 digits, optional)</span>
              <input
                className="input-field"
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                autoComplete="off"
                maxLength={2}
                placeholder="No PIN"
                value={profilePin}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, '').slice(0, 2);
                  setProfilePin(val);
                  save({ profilePin: val });
                }}
                style={{ maxWidth: 120 }}
              />
            </label>
          </div>

          <div className={styles.field}>
            <span className={styles.fieldLabel}>Avatar</span>
            <div className={styles.avatarGrid}>
              {AVATARS.map((a) => (
                <button
                  key={a}
                  type="button"
                  className={`${styles.avatarBtn} ${avatar === a ? styles.avatarActive : ''}`}
                  onClick={() => handleAvatarChange(a)}
                >
                  {a}
                </button>
              ))}
            </div>
          </div>

          {/* Row 2: Content controls */}
          <div className={styles.row}>
            <label className={styles.field}>
              <span className={styles.fieldLabel}>Library</span>
              <select className="input-field" value={allowedLibraryId} onChange={(e) => handleChange(setAllowedLibraryId, 'allowedLibraryId')(e.target.value)}>
                <option value="">All Libraries</option>
                {folders.map((f) => (
                  <option key={f.ItemId} value={f.ItemId}>{f.Name}</option>
                ))}
              </select>
            </label>
            <label className={styles.field}>
              <span className={styles.fieldLabel}>Max Rating</span>
              <select className="input-field" value={maxRating} onChange={(e) => handleChange(setMaxRating, 'maxRating')(e.target.value)}>
                <option value="">No Limit</option>
                {getAllRatings().map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </label>
          </div>

          {/* Row 3: Time controls */}
          <div className={styles.row}>
            <label className={styles.field}>
              <span className={styles.fieldLabel}>Session Limit</span>
              <select className="input-field" value={sessionLimit} onChange={(e) => handleChange(setSessionLimit, 'sessionLimit')(e.target.value)}>
                {SESSION_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </label>
            <label className={styles.field}>
              <span className={styles.fieldLabel}>Font</span>
              <select className="input-field" value={font} onChange={(e) => handleFontChange(e.target.value)}>
                {FONTS.map((f) => (
                  <option key={f.id} value={f.id}>{f.name}</option>
                ))}
              </select>
            </label>
          </div>

          {/* Font size */}
          <div className={styles.field}>
            <span className={styles.fieldLabel}>Text Size ({fontSize}px)</span>
            <div className={styles.fontSizeRow}>
              <span className={styles.fontSizeLabel}>A</span>
              <input
                type="range"
                min={MIN_FONT_SIZE}
                max={MAX_FONT_SIZE}
                value={fontSize}
                onChange={(e) => handleFontSizeChange(e.target.value)}
                className={styles.fontSizeSlider}
              />
              <span className={styles.fontSizeLabelLg}>A</span>
            </div>
          </div>

          {/* Bedtime */}
          <div className={styles.field}>
            <span className={styles.fieldLabel}>Bedtime</span>
            <div className={styles.bedtimeRow}>
              <input className="input-field" type="time" value={bedtimeStart} onChange={(e) => handleChange(setBedtimeStart, 'bedtimeStart')(e.target.value)} />
              <span className={styles.bedtimeTo}>to</span>
              <input className="input-field" type="time" value={bedtimeEnd} onChange={(e) => handleChange(setBedtimeEnd, 'bedtimeEnd')(e.target.value)} />
              {(bedtimeStart || bedtimeEnd) && (
                <button type="button" className={styles.clearBtn} onClick={() => { setBedtimeStart(''); setBedtimeEnd(''); save({ bedtimeStart: '', bedtimeEnd: '' }); }}>
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* Theme */}
          <div className={styles.field}>
            <span className={styles.fieldLabel}>Theme ({themeName})</span>
            <div className={styles.themeGrid}>
              <button
                type="button"
                className={`${styles.themeBtn} ${!theme ? styles.themeActive : ''}`}
                onClick={() => handleThemeChange('')}
              >
                <div className={styles.themeAuto}>Auto</div>
              </button>
              {THEME_ENTRIES.map(([id, t]) => (
                <button
                  key={id}
                  type="button"
                  className={`${styles.themeBtn} ${theme === id ? styles.themeActive : ''}`}
                  onClick={() => handleThemeChange(id)}
                  title={t.name}
                >
                  <div className={styles.themeSwatch} style={{ background: `linear-gradient(135deg, ${t.primary}, ${t.secondary})` }} />
                  <span className={styles.themeLabel}>{t.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className={styles.cardActions}>
            <button className={`${styles.actionBtn} ${styles.deleteBtn}`} onClick={() => onDelete(profile.id)}>
              Delete Profile
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function AddProfileForm({ folders, onSave, onCancel }) {
  const [name, setName] = useState('');
  const [avatar, setAvatar] = useState('😊');

  function handleSubmit(e) {
    e.preventDefault();
    onSave({ name, avatar, allowedLibraryId: '', maxRating: 'G', theme: '', font: 'nunito', fontSize: DEFAULT_FONT_SIZE, sessionLimit: 0, bedtimeStart: '', bedtimeEnd: '', profilePin: '' });
  }

  return (
    <form onSubmit={handleSubmit} className={styles.addForm}>
      <label className={styles.field}>
        <span className={styles.fieldLabel}>Name</span>
        <input className="input-field" value={name} onChange={(e) => setName(e.target.value)} required />
      </label>
      <div className={styles.field}>
        <span className={styles.fieldLabel}>Avatar</span>
        <div className={styles.avatarGrid}>
          {AVATARS.map((a) => (
            <button key={a} type="button" className={`${styles.avatarBtn} ${avatar === a ? styles.avatarActive : ''}`} onClick={() => setAvatar(a)}>
              {a}
            </button>
          ))}
        </div>
      </div>
      <div className={styles.formActions}>
        <button type="button" className="btn-secondary" onClick={onCancel}>Cancel</button>
        <button type="submit" className="btn-primary">Create</button>
      </div>
      <p className={styles.muted}>You can configure all other settings after creating the profile.</p>
    </form>
  );
}

export default function ParentDashboard() {
  const navigate = useNavigate();
  const { parentPin, updateParentPin, parentSettings, updateParentSettings, parentUnlocked, setParentUnlocked } = useApp();
  const { profiles, addProfile, editProfile, deleteProfile } = useProfiles();
  const { folders } = useVirtualFolders();
  const { updateAvailable, applyUpdate } = useUpdateCheck();

  const [showAdd, setShowAdd] = useState(false);
  const [newPin, setNewPin] = useState('');
  const [pinMessage, setPinMessage] = useState('');

  // Require PIN if navigated directly (not via profile select PIN flow)
  if (!parentUnlocked) {
    return (
      <PinPad
        title="Enter Parent PIN"
        onSubmit={(entered) => {
          if (entered === parentPin) {
            setParentUnlocked(true);
            return true;
          }
          return false;
        }}
        onCancel={() => navigate('/profiles')}
      />
    );
  }

  function handleAddProfile(data) {
    addProfile(data);
    setShowAdd(false);
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
            <ProfileCard
              key={p.id}
              profile={p}
              folders={folders}
              onSave={(id, data) => editProfile(id, data)}
              onDelete={deleteProfile}
            />
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
          {updateAvailable && (
            <button className={styles.updateBanner} onClick={applyUpdate}>
              A new version of KidFin is available — tap to update
            </button>
          )}
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

      {/* Add Profile Modal */}
      {showAdd && (
        <Modal title="Add Profile" onClose={() => setShowAdd(false)}>
          <AddProfileForm folders={folders} onSave={handleAddProfile} onCancel={() => setShowAdd(false)} />
        </Modal>
      )}
    </div>
  );
}
