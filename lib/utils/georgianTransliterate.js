/**
 * Phonetic Latin → Georgian (Mkhedruli) letter map.
 * Type with a Latin keyboard; letters convert as on a Georgian phonetic layout.
 * Shift variants: T→თ, S→შ, C→ჩ, Z→ძ, R/G→ღ, J→ჟ, W→ჭ, K→ქ, P→ფ.
 * Existing Georgian letters pass through unchanged.
 */

const SINGLE = {
  a: 'ა',
  A: 'ა',
  b: 'ბ',
  B: 'ბ',
  g: 'გ',
  G: 'ღ',
  d: 'დ',
  D: 'დ',
  e: 'ე',
  E: 'ე',
  v: 'ვ',
  V: 'ვ',
  z: 'ზ',
  Z: 'ძ',
  t: 'ტ',
  T: 'თ',
  i: 'ი',
  I: 'ი',
  k: 'კ',
  K: 'ქ',
  l: 'ლ',
  L: 'ლ',
  m: 'მ',
  M: 'მ',
  n: 'ნ',
  N: 'ნ',
  o: 'ო',
  O: 'ო',
  p: 'პ',
  P: 'ფ',
  j: 'ჯ',
  J: 'ჟ',
  r: 'რ',
  R: 'ღ',
  s: 'ს',
  S: 'შ',
  u: 'უ',
  U: 'უ',
  f: 'ფ',
  F: 'ფ',
  q: 'ქ',
  Q: 'ქ',
  y: 'ყ',
  Y: 'ყ',
  c: 'ც',
  C: 'ჩ',
  w: 'წ',
  W: 'ჭ',
  x: 'ხ',
  X: 'ხ',
  h: 'ჰ',
  H: 'ჰ',
};

const GEORGIAN_CHAR = /[\u10D0-\u10FF]/;

export function toGeorgianScript(input) {
  if (input == null || input === '') return '';

  let result = '';
  for (const ch of String(input)) {
    if (GEORGIAN_CHAR.test(ch)) {
      result += ch;
      continue;
    }
    result += SINGLE[ch] ?? ch;
  }
  return result;
}
