// Curated regulars from the actual meal-planning conversation — these are
// the one-tap chips. Anything else goes through Open Food Facts search.
export const FAVORITES = {
  morning: [
    { id: 'eggs3', label: '3 œufs' },
    { id: 'eggs2', label: '2 œufs' },
    { id: 'coffee', label: 'Café seulement' },
  ],
  lunch: [
    { id: 'tupperware', label: 'Tupperware poulet-riz-courgette' },
    { id: 'saladskyr', label: 'Salade + skyr' },
    { id: 'skipped', label: "Pas eu le temps" },
  ],
  snack: [
    { id: 'skyr', label: 'Skyr + fruit' },
    { id: 'fruit', label: 'Pomme / orange' },
    { id: 'none', label: "Rien aujourd'hui" },
  ],
  evening: [
    { id: 'chicken', label: 'Poulet + légumes + riz' },
    { id: 'omelette', label: 'Omelette légumes' },
    { id: 'other', label: 'Autre' },
  ],
};

// Open Food Facts: free, open, no API key. Used only for the "Autre" free-text
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
