import { useState } from 'react';
import { signIn, signUp } from '../firebase.js';
import { TargetIcon } from '../icons.jsx';

export default function SignIn() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function handle(action) {
    setError('');
    setBusy(true);
    try {
      await action(email, password);
    } catch (err) {
      setError(`${err.code || 'erreur'}: ${err.message}`);
    } finally {
      setBusy(false);
    }
  }

  const inputStyle = {
    border: '1.5px solid var(--border)', borderRadius: 12, padding: '12px 14px',
    fontSize: 15, fontFamily: 'inherit', color: 'var(--text)', width: '100%',
  };

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

        <div style={{ width: '100%', maxWidth: 300, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <input
            type="email"
            inputMode="email"
            autoCapitalize="none"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={inputStyle}
          />
          <input
            type="password"
            placeholder="Mot de passe"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={inputStyle}
          />
          <button className="btn-primary" disabled={busy || !email || !password} onClick={() => handle(signIn)}>
            {busy ? '...' : 'Se connecter'}
          </button>
          <button
            className="chip"
            style={{ textAlign: 'center', padding: '12px 14px' }}
            disabled={busy || !email || !password}
            onClick={() => handle(signUp)}
          >
            Première fois — créer le compte
          </button>
          {error && (
            <div style={{ fontSize: 12, color: 'oklch(50% 0.15 30)', wordBreak: 'break-word' }}>{error}</div>
          )}
        </div>
      </div>
    </div>
  );
}
