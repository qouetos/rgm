const stroke = { fill: 'none', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' };

export const HomeIcon = ({ color = 'currentColor', size = 22 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...stroke} stroke={color}>
    <path d="M4 11 12 4l8 7M6 10v9h12v-9" />
  </svg>
);

export const EncodeIcon = ({ color = 'currentColor', size = 22 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...stroke} stroke={color}>
    <circle cx="12" cy="12" r="9" strokeWidth={2} />
    <path d="M12 8v8M8 12h8" />
  </svg>
);

export const HistoryIcon = ({ color = 'currentColor', size = 22 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...stroke} stroke={color}>
    <path d="M4 19V10M11 19V5M18 19v-7" />
  </svg>
);

export const SettingsIcon = ({ color = 'currentColor', size = 22 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...stroke} stroke={color}>
    <circle cx="12" cy="12" r="3.2" strokeWidth={2} />
    <path d="M12 3v2.5M12 18.5V21M4.6 4.6l1.8 1.8M17.6 17.6l1.8 1.8M3 12h2.5M18.5 12H21M4.6 19.4l1.8-1.8M17.6 6.4l1.8-1.8" />
  </svg>
);

export const TargetIcon = ({ color = 'var(--accent-dark)', size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...stroke} stroke={color}>
    <path d="M6 15 L11 9 L15 12 L19 6" />
    <path d="M14 6 H19 V11" />
  </svg>
);

export const FlameIcon = ({ color = 'var(--accent2)', size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...stroke} stroke={color} strokeLinejoin="round">
    <path d="M12 2c1 4-3 5-3 9a3 3 0 0 0 6 0c0-1.5-1-2.5-1-2.5s2 1 2 4.5a5 5 0 0 1-10 0C6 8 9 6 12 2Z" />
  </svg>
);

export const CalendarIcon = ({ color = 'var(--text-soft)', size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...stroke} stroke={color}>
    <rect x="3" y="4" width="18" height="17" rx="3" />
    <path d="M3 9h18M8 2v4M16 2v4" />
  </svg>
);

export const WalkIcon = ({ color = 'currentColor', size = 17 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <circle cx="13" cy="4" r="2" fill={color} />
    <path d="M10 22l2-7-3-2 1-5 4 2 1 4 3 2M9 13l-4 2" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const CheckIcon = ({ color = 'currentColor', size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...stroke} stroke={color}>
    <path d="M20 6 9 17l-5-5" />
  </svg>
);

export const CoachIcon = ({ color = 'var(--accent-dark)', size = 36 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
    <circle cx="12" cy="12.5" r="9" fill="var(--accent-soft)" stroke={color} strokeWidth="1.5" />
    <circle cx="9" cy="11.5" r="1.15" fill={color} />
    <circle cx="15" cy="11.5" r="1.15" fill={color} />
    <path d="M8.5 15c1 1.1 6 1.1 7 0" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
    <path d="M12 3.3V2" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    <circle cx="12" cy="1.4" r="1" fill={color} />
  </svg>
);
