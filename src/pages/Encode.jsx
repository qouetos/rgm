import { useEffect, useState } from 'react';
import { FAVORITES, searchFood, legacyToItems } from '../lib/foodDb.js';
import { saveDay, saveWeighIn, todayKey, watchCustomItems, saveCustomItem } from '../lib/store.js';
import { WalkIcon } from '../icons.jsx';

const inputStyle = {
  border: '1.5px solid var(--border)', borderRadius: 12, padding: '9px 12px',
  fontSize: 13, fontFamily: 'inherit', background: 'var(--card)', color: 'var(--text)', flex: 1, minWidth: 0,
};

function addItem(setter, item) {
  setter((cur) => (cur.some((c) => c.id === item.id) ? cur : [...cur, item]));
}
function toggleItem(setter, item) {
  setter((cur) => (cur.some((c) => c.id === item.id) ? cur.filter((c) => c.id !== item.id) : [...cur, item]));
}

function OtherFoodSearch({ onPick }) {
  const [open, setOpen] = useState(false);
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

  if (!open) {
    return (
      <button className="chip" style={{ borderStyle: 'dashed', alignSelf: 'flex-start' }} onClick={() => setOpen(true)}>
        🔍 Chercher un aliment
      </button>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <input
        autoFocus
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Chercher un aliment (Open Food Facts)..."
        style={{ ...inputStyle, padding: '10px 14px', fontSize: 13.5 }}
      />
      {loading && <div style={{ fontSize: 12.5, color: 'var(--text-soft)' }}>Recherche...</div>}
      {results.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 160, overflowY: 'auto' }}>
          {results.map((r) => (
            <button
              key={r.code}
              className="chip"
              style={{ textAlign: 'left', display: 'block' }}
              onClick={() => {
                onPick({ id: `off:${r.code}`, label: r.brand ? `${r.name} · ${r.brand}` : r.name, kcal: null });
                setOpen(false); setQ(''); setResults([]);
              }}
            >
              {r.name}{r.brand ? ` · ${r.brand}` : ''}{r.kcalPer100g ? ` (${Math.round(r.kcalPer100g)} kcal/100g)` : ''}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// Multi-select chip group backed by favorites + the user's own catalog
// (customItems, filtered to `kind` by the caller). "+ Nouveau" saves
// straight into that catalog and selects it immediately.
function MultiChipGroup({ label, favorites, customItems, selected, onToggle, onCreate, withSearch }) {
  const [creating, setCreating] = useState(false);
  const [newLabel, setNewLabel] = useState('');
  const [newKcal, setNewKcal] = useState('');

  const options = [...favorites, ...customItems];
  const extraSelected = selected.filter((s) => !options.some((o) => o.id === s.id));

  function submitCreate() {
    const trimmed = newLabel.trim();
    if (!trimmed) return;
    onCreate({ label: trimmed, kcal: newKcal.trim() === '' ? null : Number(newKcal) });
    setNewLabel(''); setNewKcal(''); setCreating(false);
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
      <div className="section-label">{label}</div>
      <div className="chip-row">
        {options.map((o) => {
          const isSel = selected.some((s) => s.id === o.id);
          return (
            <button
              key={o.id}
              className={`chip${isSel ? ' selected' : ''}`}
              onClick={() => onToggle({ id: o.id, label: o.label, kcal: o.kcal ?? null })}
            >
              {o.label}{typeof o.kcal === 'number' && o.kcal > 0 ? ` · ${o.kcal} kcal` : ''}
            </button>
          );
        })}
        {extraSelected.map((s) => (
          <button key={s.id} className="chip selected" onClick={() => onToggle(s)}>
            {s.label}
          </button>
        ))}
        <button className="chip" style={{ borderStyle: 'dashed' }} onClick={() => setCreating((c) => !c)}>
          {creating ? 'Annuler' : '+ Nouveau'}
        </button>
      </div>
      {creating && (
        <div style={{ display: 'flex', gap: 8 }}>
          <input placeholder="Nom..." value={newLabel} onChange={(e) => setNewLabel(e.target.value)} style={inputStyle} />
          <input placeholder="kcal (optionnel)" type="number" inputMode="numeric" value={newKcal} onChange={(e) => setNewKcal(e.target.value)} style={{ ...inputStyle, flex: '0 0 100px' }} />
          <button className="chip selected" onClick={submitCreate}>Ajouter</button>
        </div>
      )}
      {withSearch && <OtherFoodSearch onPick={(item) => onToggle(item)} />}
    </div>
  );
}

// Keyed by date in the parent so switching days remounts fresh, seeded from
// that day's existing entry (or blank if none) — no manual state syncing.
function DayForm({ uid, date, dayData, weighInData, customItems, onCreateCustom }) {
  const [weight, setWeight] = useState(weighInData?.weight ?? '');
  const [morning, setMorning] = useState(() => legacyToItems(FAVORITES.morning, dayData?.morning));
  const [lunch, setLunch] = useState(() => legacyToItems(FAVORITES.lunch, dayData?.lunch));
  const [snack, setSnack] = useState(() => legacyToItems(FAVORITES.snack, dayData?.snack));
  const [evening, setEvening] = useState(() => {
    const raw = dayData?.evening === 'other' ? null : dayData?.evening;
    const items = legacyToItems(FAVORITES.evening, raw);
    if (dayData?.eveningOther) {
      return [...items, { id: `legacy:${dayData.eveningOther}`, label: dayData.eveningOther, kcal: null }];
    }
    return items;
  });
  const [drinks, setDrinks] = useState(() => (Array.isArray(dayData?.drinks) ? dayData.drinks : []));
  const [walked, setWalked] = useState(dayData?.walked ?? false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState('');

  const foodCustom = customItems.filter((c) => c.kind === 'food');
  const drinkCustom = customItems.filter((c) => c.kind === 'drink');

  const allItems = [...morning, ...lunch, ...snack, ...evening, ...drinks];
  const totalKcal = allItems.reduce((sum, i) => sum + (typeof i.kcal === 'number' ? i.kcal : 0), 0);
  const hasUnknownKcal = allItems.some((i) => typeof i.kcal !== 'number');

  async function createCustom(kind, { label, kcal }) {
    const id = await onCreateCustom(kind, { label, kcal });
    return { id, label, kcal };
  }

  async function handleSave() {
    setSaving(true);
    setSaveError('');
    try {
      if (weight !== '' && !Number.isNaN(Number(weight))) {
        await saveWeighIn(uid, Number(weight), date);
      }
      await saveDay(uid, { morning, lunch, snack, evening, eveningOther: '', drinks, walked }, date);
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

      <MultiChipGroup label="Matin" favorites={FAVORITES.morning} customItems={foodCustom} selected={morning}
        onToggle={(item) => toggleItem(setMorning, item)} onCreate={async (d) => addItem(setMorning, await createCustom('food', d))} withSearch />
      <MultiChipGroup label="Midi" favorites={FAVORITES.lunch} customItems={foodCustom} selected={lunch}
        onToggle={(item) => toggleItem(setLunch, item)} onCreate={async (d) => addItem(setLunch, await createCustom('food', d))} withSearch />
      <MultiChipGroup label="Grignote" favorites={FAVORITES.snack} customItems={foodCustom} selected={snack}
        onToggle={(item) => toggleItem(setSnack, item)} onCreate={async (d) => addItem(setSnack, await createCustom('food', d))} withSearch />
      <MultiChipGroup label="Soir" favorites={FAVORITES.evening} customItems={foodCustom} selected={evening}
        onToggle={(item) => toggleItem(setEvening, item)} onCreate={async (d) => addItem(setEvening, await createCustom('food', d))} withSearch />
      <MultiChipGroup label="Boissons" favorites={FAVORITES.drinks} customItems={drinkCustom} selected={drinks}
        onToggle={(item) => toggleItem(setDrinks, item)} onCreate={async (d) => addItem(setDrinks, await createCustom('drink', d))} />

      {allItems.length > 0 && (
        <div className="card" style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-soft)' }}>Estimation calorique</div>
          <div style={{ fontSize: 16, fontWeight: 800 }}>≈ {totalKcal} kcal{hasUnknownKcal ? '+' : ''}</div>
        </div>
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
  const [customItems, setCustomItems] = useState([]);
  const isToday = selectedDate === todayKey();
  const dayData = days.find((d) => d.date === selectedDate);
  const weighInData = weighIns.find((w) => w.date === selectedDate);

  useEffect(() => watchCustomItems(uid, setCustomItems), [uid]);

  async function handleCreateCustom(kind, { label, kcal }) {
    return saveCustomItem(uid, { kind, label, kcal });
  }

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

      <DayForm
        key={selectedDate}
        uid={uid}
        date={selectedDate}
        dayData={dayData}
        weighInData={weighInData}
        customItems={customItems}
        onCreateCustom={handleCreateCustom}
      />
    </div>
  );
}
