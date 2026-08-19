import { useState } from 'react';
import { saveProfile, requestTestNotification, watchTestRequest, deleteTestRequest } from '../lib/store.js';
import { enableReminders } from '../lib/notifications.js';

const TEST_STATUS_LABEL = {
  sent: 'Envoyée ✓ — elle devrait arriver à l\'instant',
  'no-token': "Le worker n'a pas trouvé de token — réactive les rappels",
  error: "Le worker a essayé mais l'envoi a échoué",
  timeout: "Aucune réponse du worker en 15s — a-t-il bien été redéployé ?",
};

export default function Settings({ uid, email, profile }) {
  const [goalWeight, setGoalWeight] = useState(profile?.goalWeight ?? '');
  const [targetDate, setTargetDate] = useState(profile?.targetDate ?? '');
  const [reminderHour, setReminderHour] = useState(profile?.reminderHour ?? 19);
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileError, setProfileError] = useState('');
  const [notifStatus, setNotifStatus] = useState(profile?.fcmToken ? 'on' : 'off');
  const [notifError, setNotifError] = useState('');
  const [testStatus, setTestStatus] = useState('idle'); // 'idle' | 'sending' | one of TEST_STATUS_LABEL
  const [testDetail, setTestDetail] = useState('');

  async function handleSaveProfile() {
    setSavingProfile(true);
    setProfileError('');
    try {
      await saveProfile(uid, {
        goalWeight: goalWeight === '' ? null : Number(goalWeight),
        targetDate: targetDate || null,
      });
    } catch (err) {
      setProfileError(`${err.code || 'erreur'}: ${err.message}`);
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

      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <div className="section-label">Compte</div>
        <div style={{ fontSize: 13.5 }}>{email}</div>
        <div style={{ fontSize: 11, color: 'var(--text-soft)', wordBreak: 'break-all' }}>uid: {uid}</div>
      </div>

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
        {profileError && (
          <div style={{ fontSize: 12, color: 'oklch(50% 0.15 30)', wordBreak: 'break-word' }}>{profileError}</div>
        )}
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

        {notifStatus === 'on' && (
          <>
            <button
              className="chip"
              style={{ textAlign: 'center', padding: '12px 14px' }}
              disabled={testStatus === 'sending'}
              onClick={async () => {
                setTestStatus('sending');
                setTestDetail('');
                let requestId;
                try {
                  requestId = await requestTestNotification(uid);
                } catch (err) {
                  setTestStatus('idle');
                  setTestDetail(`Écriture impossible — ${err.code || 'erreur'}: ${err.message}`);
                  return;
                }

                let unsub = () => {};
                const result = await new Promise((resolve) => {
                  const timeout = setTimeout(() => resolve({ status: 'timeout' }), 15000);
                  unsub = watchTestRequest(
                    uid,
                    requestId,
                    (data) => {
                      if (data?.status) {
                        clearTimeout(timeout);
                        resolve(data);
                      }
                    },
                    (err) => {
                      clearTimeout(timeout);
                      resolve({ status: 'error', error: err.message });
                    }
                  );
                });
                unsub();
                deleteTestRequest(uid, requestId).catch(() => {});

                setTestStatus(result.status);
                setTestDetail(result.error || '');
                setTimeout(() => setTestStatus('idle'), 6000);
              }}
            >
              {testStatus === 'sending' ? 'Envoi...' : testStatus !== 'idle' ? TEST_STATUS_LABEL[testStatus] : 'Tester une notification'}
            </button>
            {testDetail && (
              <div style={{ fontSize: 12, color: 'oklch(50% 0.15 30)', wordBreak: 'break-word' }}>{testDetail}</div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
