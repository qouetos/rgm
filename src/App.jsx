import { useEffect, useState } from 'react';
import { subscribeAuth, signInWithGoogle } from './firebase.js';
import { watchProfile, watchRecentWeighIns, watchRecentDays, todayKey } from './lib/store.js';
import { HomeIcon, EncodeIcon, HistoryIcon, SettingsIcon, TargetIcon } from './icons.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Encode from './pages/Encode.jsx';
import History from './pages/History.jsx';
import Settings from './pages/Settings.jsx';

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

  useEffect(() => {
    return subscribeAuth((user) => setAuthState(user ?? 'signed-out'));
  }, []);

  const uid = authState && authState !== 'loading' && authState !== 'signed-out' ? authState.uid : null;

  useEffect(() => {
    if (!uid) return;
    const unsubs = [
      watchProfile(uid, setProfile),
      watchRecentWeighIns(uid, 60, setWeighIns),
      watchRecentDays(uid, 30, setDays),
    ];
    return () => unsubs.forEach((u) => u());
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
    return (
      <div className="app-shell">
        <div className="screen" style={{ alignItems: 'center', justifyContent: 'center', gap: 20, textAlign: 'center' }}>
          <div style={{
            width: 64, height: 64, borderRadius: 18,
            background: 'linear-gradient(160deg, oklch(66% 0.1 150) 0%, oklch(52% 0.09 150) 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <TargetIcon color="white" size={30} />
          </div>
          <div>
            <div style={{ fontSize: 20, fontWeight: 800 }}>Cap</div>
            <div style={{ fontSize: 13.5, color: 'var(--text-soft)', marginTop: 4 }}>Connecte-toi pour retrouver ton suivi.</div>
          </div>
          <button className="btn-primary" style={{ width: 'auto', padding: '14px 28px' }} onClick={signInWithGoogle}>
            Se connecter avec Google
          </button>
        </div>
      </div>
    );
  }

  const todayDay = days.find((d) => d.date === todayKey());
  const todayWeighIn = weighIns.find((w) => w.date === todayKey());

  return (
    <div className="app-shell">
      {tab === 'dashboard' && <Dashboard profile={profile} weighIns={weighIns} days={days} />}
      {tab === 'encode' && <Encode uid={uid} todayDay={todayDay} todayWeighIn={todayWeighIn} />}
      {tab === 'history' && <History weighIns={weighIns} days={days} />}
      {tab === 'settings' && <Settings uid={uid} profile={profile} />}

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
