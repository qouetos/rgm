// Curated regulars from the actual meal-planning conversation — these are
// the one-tap chips. Anything else goes through Open Food Facts search or
// gets saved as a custom dish/drink (see store.js customItems).
// kcal values are rough portion estimates, not measured — good enough for a
// ballpark daily total, not a nutrition-tracking app.
export const FAVORITES = {
  morning: [
    { id: 'eggs3', label: '3 œufs', kcal: 210 },
    { id: 'eggs2', label: '2 œufs', kcal: 140 },
    { id: 'coffee', label: 'Café seulement', kcal: 5 },
  ],
  lunch: [
    { id: 'tupperware', label: 'Tupperware poulet-riz-courgette', kcal: 550 },
    { id: 'saladskyr', label: 'Salade + skyr', kcal: 250 },
    { id: 'skipped', label: "Pas eu le temps", kcal: 0 },
  ],
  snack: [
    { id: 'skyr', label: 'Skyr + fruit', kcal: 150 },
    { id: 'fruit', label: 'Pomme / orange', kcal: 80 },
    { id: 'none', label: "Rien aujourd'hui", kcal: 0 },
  ],
  evening: [
    { id: 'chicken', label: 'Poulet + légumes + riz', kcal: 500 },
    { id: 'omelette', label: 'Omelette légumes', kcal: 300 },
  ],
  drinks: [
    { id: 'water', label: 'Eau', kcal: 0 },
    { id: 'coffee-d', label: 'Café', kcal: 5 },
    { id: 'tea', label: 'Thé', kcal: 2 },
    { id: 'soda', label: 'Soda', kcal: 140 },
    { id: 'juice', label: 'Jus de fruit', kcal: 110 },
    { id: 'alcohol', label: 'Bière / vin', kcal: 150 },
  ],
};

// Turns an old single-id (or single free-text string) day field into the
// current item-array shape, so days encoded before the multi-select rewrite
// still render and still count toward the calorie total where possible.
export function legacyToItems(slotFavorites, value) {
  if (Array.isArray(value)) return value;
  if (!value) return [];
  const fav = slotFavorites.find((f) => f.id === value);
  return fav ? [{ id: fav.id, label: fav.label, kcal: fav.kcal ?? null }] : [{ id: value, label: value, kcal: null }];
}

export function computeDayKcal(day) {
  if (!day) return { total: 0, hasUnknown: false, count: 0 };
  const items = [
    ...legacyToItems(FAVORITES.morning, day.morning),
    ...legacyToItems(FAVORITES.lunch, day.lunch),
    ...legacyToItems(FAVORITES.snack, day.snack),
    ...legacyToItems(FAVORITES.evening, day.evening),
    ...(Array.isArray(day.drinks) ? day.drinks : []),
  ];
  const total = items.reduce((sum, i) => sum + (typeof i.kcal === 'number' ? i.kcal : 0), 0);
  const hasUnknown = items.some((i) => typeof i.kcal !== 'number');
  return { total, hasUnknown, count: items.length };
}

// Open Food Facts: free, open, no API key. Used only for the free-text
// search — the favorites above stay the fast path so the app never forces
// weighing food or counting calories.
const OFF_SEARCH_URL = 'https://world.openfoodfacts.org/cgi/search.pl';

export async function searchFood(query, { pageSize = 15, signal } = {}) {
  if (!query || query.trim().length < 2) return [];
  const params = new URLSearchParams({
    search_terms: query,
    search_simple: '1',
    action: 'process',
    json: '1',
    page_size: String(pageSize),
    fields: 'code,product_name,brands,nutriments',
  });
  const res = await fetch(`${OFF_SEARCH_URL}?${params}`, { signal });
  if (!res.ok) throw new Error(`Open Food Facts: ${res.status}`);
  const data = await res.json();
  return (data.products || [])
    .filter((p) => p.product_name)
    .map((p) => ({
      code: p.code,
      name: p.product_name,
      brand: p.brands || '',
      kcalPer100g: p.nutriments?.['energy-kcal_100g'] ?? null,
      proteinPer100g: p.nutriments?.proteins_100g ?? null,
    }));
}
