import { CheckIcon } from '../icons.jsx';

function WeightChart({ weighIns }) {
  const points = weighIns.filter((w) => typeof w.weight === 'number');
  const W = 316, H = 130, pad = 8;
  if (points.length < 2) {
    return <div style={{ fontSize: 13, color: 'var(--text-soft)', padding: '24px 0' }}>Pas encore assez de pesées pour un graphique.</div>;
  }
  const values = points.map((p) => p.weight);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const coords = points.map((p, i) => {
    const x = (i / (points.length - 1)) * W;
    const y = pad + (1 - (p.weight - min) / range) * (H - pad * 2);
    return [x, y];
  });
  const path = coords.map(([x, y]) => `${x},${y}`).join(' ');
  const [lx, ly] = coords[0];
  const [rx, ry] = coords[coords.length - 1];
  return (
    <svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`} fill="none" style={{ overflow: 'visible' }}>
      <line x1="0" y1={H - pad} x2={W} y2={H - pad} stroke="var(--border)" strokeWidth="1" />
      <polyline points={path} stroke="var(--accent)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={lx} cy={ly} r="4" fill="var(--accent-soft)" stroke="var(--accent)" strokeWidth="2" />
      <circle cx={rx} cy={ry} r="5" fill="var(--accent)" />
    </svg>
  );
}

export default function History({ weighIns, days }) {
  const week = weighIns.slice(-7).map((w) => w.weight).filter((w) => typeof w === 'number');
  const avg = week.length ? (week.reduce((a, b) => a + b, 0) / week.length).toFixed(1) : null;
  const dayByDate = Object.fromEntries(days.map((d) => [d.date, d]));
  const weighInByDate = Object.fromEntries(weighIns.map((w) => [w.date, w]));
  const allDates = [...new Set([...days.map((d) => d.date), ...weighIns.map((w) => w.date)])]
    .sort()
    .reverse()
    .slice(0, 14);

  return (
    <div className="screen">
      <div style={{ fontSize: 20, fontWeight: 800 }}>Historique</div>

      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
          <div className="section-label">Moyenne cette semaine</div>
          <div style={{ fontSize: 16, fontWeight: 800 }}>{avg ? `${avg} kg` : '—'}</div>
        </div>
        <WeightChart weighIns={weighIns} />
      </div>

      <div className="section-label">Derniers jours</div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {allDates.length === 0 && (
          <div style={{ fontSize: 13, color: 'var(--text-soft)' }}>Aucune journée encodée pour le moment.</div>
        )}
        {allDates.map((date) => {
          const logged = Boolean(dayByDate[date]);
          const w = weighInByDate[date]?.weight;
          const label = new Date(date + 'T00:00:00').toLocaleDateString('fr-BE', { weekday: 'long', day: 'numeric', month: 'short' });
          return (
            <div
              key={date}
              className="card"
              style={{
                borderRadius: 16, padding: '13px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                border: logged ? '1px solid var(--border)' : '1px dashed var(--border)', opacity: logged ? 1 : 0.6,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 11, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: logged ? 'var(--accent-soft)' : 'oklch(94% 0.01 95)',
                }}>
                  {logged && <CheckIcon color="var(--accent-dark)" />}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <div style={{ fontSize: 13.5, fontWeight: 700, textTransform: 'capitalize' }}>{label}</div>
                  {!logged && <div style={{ fontSize: 11.5, color: 'var(--text-soft)' }}>journée non encodée</div>}
                </div>
              </div>
              {w != null && <div style={{ fontSize: 15, fontWeight: 800 }}>{w} kg</div>}
            </div>
          );
        })}
      </div>
    </div>
  );
}
