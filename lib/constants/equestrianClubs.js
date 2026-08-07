/** Backend codes → display labels (English for rider cabinet). */
export const EQUESTRIAN_CLUBS = [
  { value: 'lisi_lake', label: 'Lisi Lake' },
  { value: 'menes', label: 'Menes' },
  { value: 'ambasadori', label: 'Ambasadori' },
  { value: 'poti_school', label: 'Poti School' },
  { value: 'black_horse', label: 'Black Horse' },
  { value: 'other', label: 'Other' },
];

export function getEquestrianClubLabel(code) {
  if (!code) return '—';
  const found = EQUESTRIAN_CLUBS.find((c) => c.value === code);
  return found ? found.label : code;
}
