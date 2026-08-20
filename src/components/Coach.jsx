import { useMemo, useState } from 'react';
import { CoachIcon } from '../icons.jsx';
import { pickCoachMessage } from '../lib/coach.js';

export default function Coach({ loggedToday, walked, streak, delta }) {
  const [seed, setSeed] = useState(0);
  const message = useMemo(
    () => pickCoachMessage({ loggedToday, walked, streak, delta }),
    [loggedToday, walked, streak, delta, seed]
  );

  return (
    <div className="card" style={{ display: 'flex', gap: 12, alignItems: 'flex-start', padding: '16px 18px' }}>
      <CoachIcon />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8, minWidth: 0 }}>
        <div style={{ fontSize: 13.5, lineHeight: 1.45, fontWeight: 600 }}>{message}</div>
        <button
          className="chip"
          style={{ alignSelf: 'flex-start', padding: '6px 12px', fontSize: 11.5 }}
          onClick={() => setSeed((s) => s + 1)}
        >
          Un autre conseil
        </button>
      </div>
    </div>
  );
}
