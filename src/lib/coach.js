// Playful one-liners for the Dashboard mascot — grouped by the situation
// they react to. pickCoachMessage() pools every pool whose condition
// matches and draws randomly from that combined pool, falling back to
// GENERIC when nothing specific applies.
const GENERIC = [
  "Un jour à la fois, capitaine.",
  "Ton frigo a des secrets, ta motivation aussi.",
  "Respire, encode, recommence demain.",
  "Le poids c'est un nombre, la régularité c'est un art.",
  "Pas de médaille pour la perfection ici, juste pour la présence.",
  "Je suis un cercle avec des yeux et je crois quand même en toi.",
];

const NOT_LOGGED_TODAY = [
  "Toujours rien encodé aujourd'hui... je compte sur toi 👀",
  "30 secondes. Même juste le poids. Allez !",
  "Je m'ennuie tout seul ici, viens encoder ta journée.",
  "L'onglet Encoder ne va pas se remplir tout seul (j'ai vérifié).",
];

const WALKED = [
  "Une petite marche, une grande victoire. Bravo !",
  "Tu as marché ? Respect, mes jambes en SVG sont jalouses.",
  "30 minutes de marche, zéro minute de regret.",
];

const buildStreakHigh = (n) => [
  `${n} jours d'affilée, t'es en feu 🔥`,
  `${n} jours de suite ! À ce rythme je vais devoir te payer un salaire.`,
  `Série de ${n} jours. Impressionnant, même pour un cercle stoïque comme moi.`,
];

const STREAK_ZERO = [
  "Streak à zéro, tant pis, on en repart une nouvelle, là, maintenant.",
  "Pas de série en cours ? Aujourd'hui est un excellent jour pour en démarrer une.",
];

const WEIGHT_DOWN = [
  "Ça descend, la courbe te dit merci 📉",
  "Le poids baisse, ton moral peut monter.",
  "Progrès détecté. Je n'ai pas de confettis, mais l'intention y est 🎉",
];

const WEIGHT_UP = [
  "Ça remonte un peu, c'est pas grave, une pesée n'est pas un jugement.",
  "+quelques grammes, -aucune importance. On continue.",
  "Le corps fluctue, l'objectif reste. On ne panique pas.",
];

export function pickCoachMessage({ loggedToday, walked, streak, delta } = {}) {
  const pools = [];
  if (!loggedToday) pools.push(...NOT_LOGGED_TODAY);
  if (walked) pools.push(...WALKED);
  if (typeof streak === 'number' && streak >= 3) pools.push(...buildStreakHigh(streak));
  if (streak === 0) pools.push(...STREAK_ZERO);
  if (typeof delta === 'number') {
    if (delta < 0) pools.push(...WEIGHT_DOWN);
    if (delta > 0) pools.push(...WEIGHT_UP);
  }
  const pool = pools.length ? pools : GENERIC;
  return pool[Math.floor(Math.random() * pool.length)];
}
