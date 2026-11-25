// Roman numerals in horse names ("Sultan II") stay uppercase.
const ROMAN_NUMERAL = /^(X{0,3})(IX|IV|V?I{0,3})$/i;

/**
 * Name case for riders and horses: first letter of each Latin word uppercase,
 * the rest lowercase ("JOHN SMITH" / "john smith" → "John Smith").
 * Georgian text is unchanged.
 */
export function capitalizeName(value) {
  if (value == null || value === '') return '';
  const text = String(value);
  if (text === '—') return text;

  return text.replace(/[A-Za-zÀ-ÿ]+/g, (word, offset) => {
    if (offset > 0 && ROMAN_NUMERAL.test(word) && word === word.toUpperCase()) {
      return word;
    }
    return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
  });
}
