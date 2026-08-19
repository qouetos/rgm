import { useState } from 'react';
import { saveProfile } from '../lib/store.js';
import { enableReminders } from '../lib/notifications.js';

export default function Settings({ uid, profile }) {
  const [goalWeight, setGoalWeight] = useState(profile?.goalWeight ?? '');
  const [targetDate, setTargetDate] = useState(profile?.targetDate ?? '');
  const [reminderHour, setReminderHour] = useState(profile?.reminderHour ?? 19);
  const [savingProfile, setSavingProfile] = useState(false);
  const [notifStatus, setNotifStatus] = useState(profile?.fcmToken ? 'on' : 'off');
  const [notifError, setNotifError] = useState('');

  async function handleSaveProfile() {
    setSavingProfile(true);
    try {
      await saveProfile(uid, {
        goalWeight: goalWeight === '' ? null : Number(goalWeight),
        targetDate: targetDate || null,
      });
    } finally {
      setSavingProfile(false);
    }
  }

  async function handleEnableNotifs() {
    setNotifError('');
    setNotifStatus('requesting');
    try {
      await enableReminders(uid, Number(reminderHour));
      setNotifStatus('on');
    } catch (e) {
      setNotifStatus('off');
      setNotifError(
        e.message === 'denied'
          ? 'Notifications refusées dans le navigateur.'
          : e.message === 'unsupported'
          ? "Non supporté ici — sur iPhone, ajoute d'abord l'app à l'écran d'accueil."
          : 'Impossible d\'activer les notifications.'
      );
    }
  }

  return (
    <div className="screen">
      <div style={{ fontSize: 20, fontWeight: 800 }}>Réglages</div>

      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div className="section-label">Objectif</div>
        <label style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 13, fontWeight: 600, color: 'var(--text-soft)' }}>
          Poids cible (kg)
          <input
            type="number"
            step="0.1"
            value={goalWeight}
            onChange={(e) => setGoalWeight(e.target.value)}
            style={{ border: '1.5px solid var(--border)', borderRadius: 12, padding: '10px 12px', fontSize: 15, fontFamily: 'inherit', color: 'var(--text)' }}
          />
        </label>
        <label style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 13, fontWeight: 600, color: 'var(--text-soft)' }}>
          Date cible
          <input
            type="date"
            value={targetDate}
            onChange={(e) => setTargetDate(e.target.value)}
            style={{ border: '1.5px solid var(--border)', borderRadius: 12, padding: '10px 12px', fontSize: 15, fontFamily: 'inherit', color: 'var(--text)' }}
          />
        </label>
        <button className="btn-primary" disabled={savingProfile} onClick={handleSaveProfile}>
          {savingProfile ? 'Enregistrement...' : 'Enregistrer l\'objectif'}
        </button>
      </div>

      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div className="section-label">Rappel quotidien</div>
        <label style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 13, fontWeight: 600, color: 'var(--text-soft)' }}>
          Heure du rappel
          <input
            type="number"
            min="0"
            max="23"
            value={reminderHour}
            onChange={(e) => setReminderHour(e.target.value)}
            style={{ border: '1.5px solid var(--border)', borderRadius: 12, padding: '10px 12px', fontSize: 15, fontFamily: 'inherit', color: 'var(--text)', width: 90 }}
          />
        </label>
        <button className="btn-primary" disabled={notifStatus === 'requesting'} onClick={handleEnableNotifs}>
          {notifStatus === 'on' ? 'Rappels activés ✓' : notifStatus === 'requesting' ? 'Activation...' : 'Activer les rappels'}
        </button>
        {notifError && <div style={{ fontSize: 12.5, color: 'oklch(50% 0.15 30)' }}>{notifError}</div>}
      </div>
    </div>
  );
}
