/** Backend codes → display labels (English for rider cabinet). */
export const EQUESTRIAN_CLUBS = [
  { value: 'lisi_lake', label: 'Lisi Lake' },
  { value: 'menes', label: 'Menes' },
  { value: 'ambasadori', label: 'Ambasadori' },
  { value: 'poti_school', label: 'Poti School' },
  { value: 'black_horse', label: 'Black Horse' },
  { value: 'other', label: 'Other' },
];

export function getEquestrianClubLabel(code, clubText = '', t) {
  if (!code) return '—';
  const found = EQUESTRIAN_CLUBS.find((c) => c.value === code);
  if (!found) return code;
  if (code === 'other' && clubText?.trim()) {
    return clubText.trim();
  }
  if (code === 'other' && typeof t === 'function') {
    return t('profile.otherClub', { defaultValue: found.label });
  }
  return found.label;
}
