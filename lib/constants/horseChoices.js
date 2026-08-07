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

export function getHorseColorLabel(code) {
  return HORSE_COLORS.find((c) => c.value === code)?.label ?? code ?? '—';
}

export function getHorseGenderLabel(code) {
  return HORSE_GENDERS.find((g) => g.value === code)?.label ?? code ?? '—';
}

export function getHorseCategoryLabel(code) {
  return HORSE_CATEGORIES.find((c) => c.value === code)?.label ?? code ?? '—';
}
