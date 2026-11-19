/** Backend codes → display labels (English for rider cabinet). */
export const EQUESTRIAN_CLUBS = [
  // Official club names (codes unchanged so existing data keeps working).
  { value: 'lisi_lake', label: 'Lisi Hippodrome' },
  { value: 'menes', label: 'MENES Equestrian Club Georgia' },
  { value: 'ambasadori', label: 'Ambassadori Equestrian Club' },
  { value: 'poti_school', label: 'Poti Equestrian School' },
  { value: 'black_horse', label: 'Horse riding club “Black horse”' },
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
