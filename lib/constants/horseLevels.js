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

export function getHorseLevelLabel(code, t) {
  if (!code) return '—';
  const english = toEnglishLevelLabel(code) || '—';
  const matched = HORSE_LEVELS.find(
    (l) => l.value === String(code).toLowerCase() || l.label === english
  );
  if (matched && typeof t === 'function') {
    return t(`horses.levels.${matched.value}`, { defaultValue: matched.label });
  }
  return english;
}

/** Prefer mapped label from `horse_level`, else clean API display. */
export function getHorseLevelDisplay(horse, t) {
  if (horse?.horse_level) {
    const fromCode = getHorseLevelLabel(horse.horse_level, t);
    if (fromCode && fromCode !== '—') return fromCode;
  }
  if (horse?.horse_level_display) {
    return getHorseLevelLabel(horse.horse_level_display, t);
  }
  return '—';
}

export function formatAllowedTours(tours, t) {
  if (!tours?.length) return '';
  return tours.map((code) => getHorseLevelLabel(code, t)).join(', ');
}

export function getAllowedToursForLevel(level) {
  return ALLOWED_TOURS_BY_LEVEL[level] ?? ALLOWED_TOURS_BY_LEVEL.bronze;
}
