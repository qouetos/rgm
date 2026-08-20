import { useEffect, useState } from 'react';
import { subscribeAuth } from './firebase.js';
import { watchProfile, watchRecentWeighIns, watchRecentDays } from './lib/store.js';
import { watchForegroundMessages } from './lib/notifications.js';
import { HomeIcon, EncodeIcon, HistoryIcon, SettingsIcon } from './icons.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Encode from './pages/Encode.jsx';
import History from './pages/History.jsx';
import Settings from './pages/Settings.jsx';
import SignIn from './pages/SignIn.jsx';

const TABS = [
  { id: 'dashboard', label: 'Accueil', Icon: HomeIcon },
  { id: 'encode', label: 'Encoder', Icon: EncodeIcon },
  { id: 'history', label: 'Historique', Icon: HistoryIcon },
  { id: 'settings', label: 'Réglages', Icon: SettingsIcon },
];

export default function App() {
  const [authState, setAuthState] = useState('loading'); // 'loading' | 'signed-out' | user
  const [tab, setTab] = useState('dashboard');
  const [profile, setProfile] = useState(null);
  const [weighIns, setWeighIns] = useState([]);
  const [days, setDays] = useState([]);
  const [dataError, setDataError] = useState('');

  useEffect(() => {
    return subscribeAuth((user) => setAuthState(user ?? 'signed-out'));
  }, []);

  const uid = authState && authState !== 'loading' && authState !== 'signed-out' ? authState.uid : null;

  useEffect(() => {
    if (!uid) return;
    const onError = (err) => setDataError(`${err.code || 'erreur'}: ${err.message}`);
    const unsubs = [
      watchProfile(uid, setProfile, onError),
      watchRecentWeighIns(uid, 60, setWeighIns, onError),
      watchRecentDays(uid, 30, setDays, onError),
    ];
    return () => unsubs.forEach((u) => u());
  }, [uid]);

  // FCM delivers a push through the service worker's background handler
  // ONLY when no client has the app focused — while the PWA is open (e.g.
  // testing from Réglages), it comes through here instead. Without this,
  // that case is silently dropped: no error, no notification.
  useEffect(() => {
    if (!uid) return;
    let unsub = () => {};
    let cancelled = false;
    watchForegroundMessages((payload) => {
      const { title, body } = payload.notification || {};
      if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
        new Notification(title || 'Cap', { body, icon: '/icons/icon-192.png' });
      }
    }).then((fn) => { if (cancelled) fn(); else unsub = fn; });
    return () => { cancelled = true; unsub(); };
  }, [uid]);

  if (authState === 'loading') {
    return (
      <div className="app-shell">
        <div className="screen" style={{ alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ color: 'var(--text-soft)', fontSize: 14 }}>Chargement...</div>
        </div>
      </div>
    );
  }

  if (authState === 'signed-out') {
    return <SignIn />;
  }

  return (
    <div className="app-shell">
      {dataError && (
        <div style={{ margin: '0 20px 12px', padding: '10px 14px', borderRadius: 12, background: 'oklch(94% 0.04 30)', color: 'oklch(40% 0.15 30)', fontSize: 12.5 }}>
          Lecture des données impossible : {dataError}
        </div>
      )}
      {tab === 'dashboard' && <Dashboard profile={profile} weighIns={weighIns} days={days} />}
      {tab === 'encode' && <Encode uid={uid} days={days} weighIns={weighIns} />}
      {tab === 'history' && <History weighIns={weighIns} days={days} />}
      {tab === 'settings' && <Settings uid={uid} email={authState.email} profile={profile} />}

      <nav className="bottom-nav">
        {TABS.map(({ id, label, Icon }) => (
          <button key={id} className={tab === id ? 'active' : ''} onClick={() => setTab(id)}>
            <Icon color={tab === id ? 'var(--accent-dark)' : 'var(--text-soft)'} />
            {label}
          </button>
        ))}
      </nav>
    </div>
  );
}
