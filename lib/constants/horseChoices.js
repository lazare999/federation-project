/** Horse field choices for cabinet forms (backend codes → English labels). */

export const HORSE_COLORS = [
  { value: 'white', label: 'White' },
  { value: 'black', label: 'Black' },
  { value: 'base', label: 'Base' },
  { value: 'bay', label: 'Bay' },
  { value: 'chestnut', label: 'Chestnut' },
  { value: 'gray', label: 'Gray' },
  { value: 'dun', label: 'Dun' },
  { value: 'buckskin', label: 'Buckskin' },
  { value: 'palomino', label: 'Palomino' },
  { value: 'roan', label: 'Roan' },
  { value: 'pinto', label: 'Pinto' },
  { value: 'appaloosa', label: 'Appaloosa' },
  { value: 'cremello', label: 'Cremello' },
  { value: 'perlino', label: 'Perlino' },
  { value: 'grulla', label: 'Grulla' },
  { value: 'champagne', label: 'Champagne' },
  { value: 'silver_dapple', label: 'Silver dapple' },
];

export const HORSE_GENDERS = [
  { value: 'mare', label: 'Mare' },
  { value: 'stallion', label: 'Stallion' },
  { value: 'gelding', label: 'Gelding' },
];

export const HORSE_CATEGORIES = [
  { value: 'show', label: 'Show' },
  { value: 'school', label: 'School' },
  { value: 'retired', label: 'Retired' },
];

export function getHorseColorLabel(code, t) {
  if (!code) return '—';
  const fallback = HORSE_COLORS.find((c) => c.value === code)?.label ?? code;
  return typeof t === 'function'
    ? t(`horses.colors.${code}`, { defaultValue: fallback })
    : fallback;
}

export function getHorseGenderLabel(code, t) {
  if (!code) return '—';
  const fallback = HORSE_GENDERS.find((g) => g.value === code)?.label ?? code;
  return typeof t === 'function'
    ? t(`horses.genders.${code}`, { defaultValue: fallback })
    : fallback;
}

export function getHorseCategoryLabel(code, t) {
  if (!code) return '—';
  const fallback =
    HORSE_CATEGORIES.find((c) => c.value === code)?.label ?? code;
  return typeof t === 'function'
    ? t(`horses.categories.${code}`, { defaultValue: fallback })
    : fallback;
}
