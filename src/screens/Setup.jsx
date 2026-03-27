import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authenticateByName } from '../api/jellyfin';
import { setServerUrl, setAccessToken, setAdminUserId } from '../utils/storage';
import styles from './Setup.module.css';

export default function Setup() {
  const navigate = useNavigate();
  const [serverUrl, setServerUrlInput] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
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
      window.location.href = '/profiles';
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.logo}>🐠</div>
        <h1 className={styles.title}>KidFin</h1>
        <p className={styles.subtitle}>Connect to your Jellyfin server</p>

        <form onSubmit={handleSubmit} className={styles.form}>
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
              placeholder="Admin username"
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
