import { TargetIcon, FlameIcon, CalendarIcon } from '../icons.jsx';
import { todayKey } from '../lib/store.js';
import Coach from '../components/Coach.jsx';

function daysUntil(targetDate) {
  if (!targetDate) return null;
  const ms = new Date(targetDate + 'T00:00:00') - new Date(new Date().toDateString());
  return Math.max(0, Math.round(ms / 86400000));
}

function computeStreak(days) {
  const set = new Set(days.map((d) => d.date));
  let streak = 0;
  const cursor = new Date();
  while (set.has(cursor.toISOString().slice(0, 10))) {
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

function Sparkline({ weighIns }) {
  const points = weighIns.filter((w) => typeof w.weight === 'number');
  if (points.length < 2) return null;
  const values = points.map((p) => p.weight);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const W = 108, H = 56, pad = 6;
  const coords = points.map((p, i) => {
    const x = pad + (i / (points.length - 1)) * (W - pad * 2);
    const y = pad + (1 - (p.weight - min) / range) * (H - pad * 2);
    return [x, y];
  });
  const path = coords.map(([x, y]) => `${x},${y}`).join(' ');
  const [lx, ly] = coords[0];
  const [rx, ry] = coords[coords.length - 1];
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} fill="none">
      <polyline points={path} stroke="var(--accent)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={lx} cy={ly} r="4" fill="var(--accent-soft)" stroke="var(--accent)" strokeWidth="2" />
      <circle cx={rx} cy={ry} r="4.5" fill="var(--accent)" />
    </svg>
  );
}

export default function Dashboard({ profile, weighIns, days }) {
  const latest = weighIns[weighIns.length - 1];
  const start = weighIns[0];
  const delta = latest && start ? +(latest.weight - start.weight).toFixed(1) : null;
  const remaining = daysUntil(profile?.targetDate);
  const streak = computeStreak(days);
  const today = new Date().toLocaleDateString('fr-BE', { weekday: 'long', day: 'numeric', month: 'long' });
  const todayData = days.find((d) => d.date === todayKey());

  return (
    <div className="screen">
      <div>
        <div style={{ fontSize: 13, color: 'var(--text-soft)', fontWeight: 500, textTransform: 'capitalize' }}>{today}</div>
        <div style={{ fontSize: 22, fontWeight: 800 }}>Bonjour</div>
      </div>

      <Coach loggedToday={Boolean(todayData)} walked={Boolean(todayData?.walked)} streak={streak} delta={delta} />

      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <div className="section-label">Poids actuel</div>
            {latest ? (
              <>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                  <div style={{ fontSize: 40, fontWeight: 800, lineHeight: 1 }}>{latest.weight}</div>
                  <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-soft)' }}>kg</div>
                </div>
                {delta !== null && (
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--accent-dark)' }}>
                    {delta <= 0 ? `${delta} kg` : `+${delta} kg`} depuis le début
                  </div>
                )}
              </>
            ) : (
              <div style={{ fontSize: 15, color: 'var(--text-soft)' }}>Pas encore de pesée</div>
            )}
          </div>
          <Sparkline weighIns={weighIns} />
        </div>

        {profile?.goalWeight && (
          <>
            <div style={{ height: 1, background: 'var(--border)' }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 34, height: 34, borderRadius: 10, background: 'var(--accent-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <TargetIcon />
              </div>
              <div style={{ fontSize: 13.5, color: 'var(--text-soft)', lineHeight: 1.4 }}>
                Objectif <strong style={{ color: 'var(--text)' }}>{profile.goalWeight} kg</strong> au{' '}
                <strong style={{ color: 'var(--text)' }}>
                  {new Date(profile.targetDate + 'T00:00:00').toLocaleDateString('fr-BE', { day: 'numeric', month: 'long', year: 'numeric' })}
                </strong>
              </div>
            </div>
          </>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <div className="card" style={{ borderRadius: 20, display: 'flex', flexDirection: 'column', gap: 6 }}>
          <CalendarIcon />
          <div style={{ fontSize: 24, fontWeight: 800 }}>{remaining ?? '—'}</div>
          <div style={{ fontSize: 12.5, color: 'var(--text-soft)', fontWeight: 500 }}>jours restants</div>
        </div>
        <div className="card" style={{ borderRadius: 20, background: 'var(--accent2-soft)', borderColor: 'oklch(88% 0.04 45)', display: 'flex', flexDirection: 'column', gap: 6 }}>
          <FlameIcon />
          <div style={{ fontSize: 24, fontWeight: 800, color: 'oklch(38% 0.09 45)' }}>{streak} jour{streak > 1 ? 's' : ''}</div>
          <div style={{ fontSize: 12.5, color: 'oklch(45% 0.07 45)', fontWeight: 500 }}>d'affilée</div>
        </div>
      </div>
    </div>
  );
}
