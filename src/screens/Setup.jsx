import { useState } from 'react';
import { authenticateByName } from '../api/jellyfin';
import { setServerUrl, setAccessToken, setAdminUserId, setParentPin } from '../utils/storage';
import styles from './Setup.module.css';

export default function Setup() {
  const [step, setStep] = useState('connect');
  const [serverUrl, setServerUrlInput] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleConnect(e) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const url = serverUrl.replace(/\/+$/, '');
      let parsed;
      try {
        parsed = new URL(url);
      } catch {
        throw new Error('Invalid server URL.');
      }
      if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
        throw new Error('Server URL must use http or https.');
      }
      const data = await authenticateByName(url, username, password);
      setServerUrl(url);
      setAccessToken(data.AccessToken);
      setAdminUserId(data.User.Id);
      setStep('pin');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function handlePinSubmit(e) {
    e.preventDefault();
    if (pin.length === 4 && /^\d{4}$/.test(pin)) {
      setParentPin(pin);
    }
    window.location.href = '/profiles';
  }

  if (step === 'pin') {
    return (
      <div className={styles.container}>
        <div className={styles.card}>
          <div className={styles.logo}>🐠</div>
          <h1 className={styles.title}>KidFin</h1>
          <p className={styles.subtitle}>Set your parent dashboard PIN</p>

          <form onSubmit={handlePinSubmit} className={styles.form}>
            <label className={styles.label}>
              Parent PIN (4 digits)
              <input
                className="input-field"
                type="password"
                inputMode="numeric"
                pattern="[0-9]*"
                autoComplete="off"
                maxLength={4}
                placeholder="Enter a 4-digit PIN"
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
              />
              <span className={styles.hint}>This PIN protects the parent dashboard. Default is 1234 if skipped.</span>
            </label>

            <button type="submit" className="btn-primary" style={{ width: '100%' }}>
              {pin.length === 4 ? 'Set PIN' : 'Skip (use default 1234)'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.logo}>🐠</div>
        <h1 className={styles.title}>KidFin</h1>
        <p className={styles.subtitle}>Connect to your Jellyfin server</p>
        <p className={styles.hint}>For security, create a dedicated Jellyfin user for KidFin with playback-only permissions instead of using your admin account.</p>

        <form onSubmit={handleConnect} className={styles.form}>
          <label className={styles.label}>
            Server URL
            <input
              className="input-field"
              type="url"
              placeholder="http://192.168.1.10:8096"
              value={serverUrl}
              onChange={(e) => setServerUrlInput(e.target.value)}
              required
            />
          </label>

          <label className={styles.label}>
            Username
            <input
              className="input-field"
              type="text"
              placeholder="Jellyfin username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </label>

          <label className={styles.label}>
            Password
            <input
              className="input-field"
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </label>

          {error && <div className={styles.error}>{error}</div>}

          <button type="submit" className="btn-primary" disabled={loading} style={{ width: '100%' }}>
            {loading ? 'Connecting...' : 'Connect'}
          </button>
        </form>
      </div>
    </div>
  );
}
