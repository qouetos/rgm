import { useEffect, useState } from 'react';
import { FAVORITES, searchFood } from '../lib/foodDb.js';
import { saveDay, saveWeighIn, todayKey } from '../lib/store.js';
import { WalkIcon } from '../icons.jsx';

function ChipGroup({ label, options, value, onChange }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
      <div className="section-label">{label}</div>
      <div className="chip-row">
        {options.map((o) => (
          <button
            key={o.id}
            className={`chip${value === o.id ? ' selected' : ''}`}
            onClick={() => onChange(o.id)}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function OtherFoodSearch({ onPick }) {
  const [q, setQ] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (q.trim().length < 2) { setResults([]); return; }
    const ctrl = new AbortController();
    setLoading(true);
    const t = setTimeout(() => {
      searchFood(q, { signal: ctrl.signal })
        .then(setResults)
        .catch(() => {})
        .finally(() => setLoading(false));
    }, 350);
    return () => { clearTimeout(t); ctrl.abort(); };
  }, [q]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Chercher un aliment (Open Food Facts)..."
        style={{
          border: '1.5px solid var(--border)', borderRadius: 14, padding: '10px 14px',
          fontSize: 13.5, fontFamily: 'inherit', background: 'var(--card)', color: 'var(--text)',
        }}
      />
      {loading && <div style={{ fontSize: 12.5, color: 'var(--text-soft)' }}>Recherche...</div>}
      {results.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 160, overflowY: 'auto' }}>
          {results.map((r) => (
            <button
              key={r.code}
              className="chip"
              style={{ textAlign: 'left', display: 'block' }}
              onClick={() => onPick(r.name)}
            >
              {r.name}{r.brand ? ` · ${r.brand}` : ''}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// Keyed by date in the parent so switching days remounts fresh, seeded from
// that day's existing entry (or blank if none) — no manual state syncing.
function DayForm({ uid, date, dayData, weighInData }) {
  const [weight, setWeight] = useState(weighInData?.weight ?? '');
  const [morning, setMorning] = useState(dayData?.morning ?? null);
  const [lunch, setLunch] = useState(dayData?.lunch ?? null);
  const [snack, setSnack] = useState(dayData?.snack ?? null);
  const [evening, setEvening] = useState(dayData?.evening ?? null);
  const [eveningOther, setEveningOther] = useState(dayData?.eveningOther ?? '');
  const [walked, setWalked] = useState(dayData?.walked ?? false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState('');

  async function handleSave() {
    setSaving(true);
    setSaveError('');
    try {
      if (weight !== '' && !Number.isNaN(Number(weight))) {
        await saveWeighIn(uid, Number(weight), date);
      }
      await saveDay(uid, { morning, lunch, snack, evening, eveningOther, walked }, date);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      setSaveError(`${err.code || 'erreur'}: ${err.message}`);
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <div className="card" style={{ borderRadius: 18, padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-soft)' }}>Poids</div>
          <div style={{ fontSize: 11.5, color: 'var(--text-soft)' }}>optionnel</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, background: 'var(--accent-soft)', borderRadius: 12, padding: '8px 14px' }}>
          <input
            type="number"
            step="0.1"
            inputMode="decimal"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            placeholder="—"
            style={{ width: 64, background: 'transparent', border: 'none', outline: 'none', fontSize: 20, fontWeight: 800, color: 'var(--accent-dark)', fontFamily: 'inherit' }}
          />
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--accent-dark)' }}>kg</div>
        </div>
      </div>

      <ChipGroup label="Matin" options={FAVORITES.morning} value={morning} onChange={setMorning} />
      <ChipGroup label="Midi" options={FAVORITES.lunch} value={lunch} onChange={setLunch} />
      <ChipGroup label="Grignote" options={FAVORITES.snack} value={snack} onChange={setSnack} />
      <ChipGroup label="Soir" options={FAVORITES.evening} value={evening} onChange={setEvening} />
      {evening === 'other' && <OtherFoodSearch onPick={setEveningOther} />}
      {evening === 'other' && eveningOther && (
        <div style={{ fontSize: 12.5, color: 'var(--text-soft)' }}>Sélectionné : {eveningOther}</div>
      )}

      <button
        className={`chip${walked ? ' selected' : ''}`}
        style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 14px' }}
        onClick={() => setWalked((w) => !w)}
      >
        <WalkIcon color={walked ? 'white' : 'var(--text-soft)'} />
        Marche du midi (~30 min)
      </button>

      <div style={{ flex: 1 }} />

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <button className="btn-primary" disabled={saving} onClick={handleSave}>
          {saving ? 'Enregistrement...' : saved ? 'Enregistré ✓' : 'Valider cette journée'}
        </button>
        <div style={{ textAlign: 'center', fontSize: 12.5, color: 'var(--text-soft)' }}>
          Pas besoin d'être parfait, juste présent.
        </div>
        {saveError && (
          <div style={{ fontSize: 12, color: 'oklch(50% 0.15 30)', textAlign: 'center', wordBreak: 'break-word' }}>
            {saveError}
          </div>
        )}
      </div>
    </>
  );
}

export default function Encode({ uid, days, weighIns }) {
  const [selectedDate, setSelectedDate] = useState(todayKey());
  const isToday = selectedDate === todayKey();
  const dayData = days.find((d) => d.date === selectedDate);
  const weighInData = weighIns.find((w) => w.date === selectedDate);

  return (
    <div className="screen">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <div>
          <div style={{ fontSize: 13, color: 'var(--text-soft)', fontWeight: 500 }}>
            {isToday ? "Aujourd'hui" : new Date(selectedDate + 'T00:00:00').toLocaleDateString('fr-BE', { weekday: 'long', day: 'numeric', month: 'long' })}
          </div>
          <div style={{ fontSize: 20, fontWeight: 800 }}>Ta journée</div>
        </div>
        <input
          type="date"
          value={selectedDate}
          max={todayKey()}
          onChange={(e) => setSelectedDate(e.target.value)}
          style={{
            border: '1.5px solid var(--border)', borderRadius: 12, padding: '8px 10px',
            fontSize: 13, fontFamily: 'inherit', color: 'var(--text)', background: 'var(--card)',
          }}
        />
      </div>

      <DayForm key={selectedDate} uid={uid} date={selectedDate} dayData={dayData} weighInData={weighInData} />
    </div>
  );
}
