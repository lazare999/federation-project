/** Horse level (competition tier) — backend codes and allowed tours. */

export const HORSE_LEVELS = [
  { value: 'bronze', label: 'Bronze' },
  { value: 'silver', label: 'Silver' },
  { value: 'gold', label: 'Gold' },
];

export const ALLOWED_TOURS_BY_LEVEL = {
  bronze: ['bronze'],
  silver: ['bronze', 'silver'],
  gold: ['bronze', 'silver', 'gold'],
};

export function getHorseLevelLabel(code) {
  if (!code) return '—';
  return HORSE_LEVELS.find((l) => l.value === code)?.label ?? code;
}

/** Prefer API `horse_level_display`, else map from `horse_level`. */
export function getHorseLevelDisplay(horse) {
  if (horse?.horse_level_display) return horse.horse_level_display;
  return getHorseLevelLabel(horse?.horse_level);
}

export function formatAllowedTours(tours) {
  if (!tours?.length) return '';
  return tours.map((code) => getHorseLevelLabel(code)).join(', ');
}

export function getAllowedToursForLevel(level) {
  return ALLOWED_TOURS_BY_LEVEL[level] ?? ALLOWED_TOURS_BY_LEVEL.bronze;
}
