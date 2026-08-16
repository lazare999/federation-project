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

/** Remove bilingual "(ქართული)" suffixes from API display labels. */
export function toEnglishLevelLabel(value) {
  if (value == null || value === '') return '';
  const raw = String(value).trim();
  if (!raw) return '';

  const code = raw.toLowerCase();
  const byCode = HORSE_LEVELS.find((l) => l.value === code);
  if (byCode) return byCode.label;

  const withoutParens = raw.replace(/\s*\([^)]*\)\s*/g, ' ').replace(/\s+/g, ' ').trim();
  const byEnglish = HORSE_LEVELS.find(
    (l) => l.label.toLowerCase() === withoutParens.toLowerCase()
  );
  if (byEnglish) return byEnglish.label;

  return withoutParens || raw;
}

export function getHorseLevelLabel(code) {
  if (!code) return '—';
  return toEnglishLevelLabel(code) || '—';
}

/** Prefer mapped English from `horse_level`, else clean API display. */
export function getHorseLevelDisplay(horse) {
  if (horse?.horse_level) {
    const fromCode = toEnglishLevelLabel(horse.horse_level);
    if (fromCode) return fromCode;
  }
  if (horse?.horse_level_display) {
    return toEnglishLevelLabel(horse.horse_level_display);
  }
  return '—';
}

export function formatAllowedTours(tours) {
  if (!tours?.length) return '';
  return tours.map((code) => getHorseLevelLabel(code)).join(', ');
}

export function getAllowedToursForLevel(level) {
  return ALLOWED_TOURS_BY_LEVEL[level] ?? ALLOWED_TOURS_BY_LEVEL.bronze;
}
