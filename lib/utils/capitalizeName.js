/** Capitalize the first letter of each Latin word. Georgian text is unchanged. */
export function capitalizeName(value) {
  if (value == null || value === '') return '';
  const text = String(value);
  if (text === '—') return text;

  return text.replace(/[A-Za-zÀ-ÿ]+/g, (word) => {
    return word.charAt(0).toUpperCase() + word.slice(1);
  });
}
