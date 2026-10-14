const MONTHS_EN = [
  'jan',
  'feb',
  'mar',
  'apr',
  'may',
  'jun',
  'jul',
  'aug',
  'sep',
  'oct',
  'nov',
  'dec',
];

const MONTHS_KA = [
  'იან',
  'თებ',
  'მარ',
  'აპრ',
  'მაი',
  'ივნ',
  'ივლ',
  'აგვ',
  'სექ',
  'ოქტ',
  'ნოე',
  'დეკ',
];

function parseDateParts(value) {
  if (value == null || value === '') return null;
  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) return null;
    return {
      year: value.getFullYear(),
      month: value.getMonth() + 1,
      day: value.getDate(),
    };
  }
  const text = String(value).trim();
  const iso = text.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (iso) {
    return {
      year: Number(iso[1]),
      month: Number(iso[2]),
      day: Number(iso[3]),
    };
  }

  const date = new Date(text);
  if (Number.isNaN(date.getTime())) return null;
  return {
    year: date.getFullYear(),
    month: date.getMonth() + 1,
    day: date.getDate(),
  };
}

export function toDateInputValue(value) {
  const parts = parseDateParts(value);
  if (!parts) return '';
  const month = String(parts.month).padStart(2, '0');
  const day = String(parts.day).padStart(2, '0');
  return `${parts.year}-${month}-${day}`;
}

export function ageFromBirthDate(value, now = new Date()) {
  const parts = parseDateParts(value);
  if (!parts) return '';
  let age = now.getFullYear() - parts.year;
  const hadBirthday =
    now.getMonth() + 1 > parts.month ||
    (now.getMonth() + 1 === parts.month && now.getDate() >= parts.day);
  if (!hadBirthday) age -= 1;
  return age >= 0 ? age : '';
}

export function formatDisplayDate(value, language = 'en') {
  const parts = parseDateParts(value);
  if (!parts) return value ? String(value) : '';

  const isKa = String(language || '').toLowerCase().startsWith('ka');
  const month = (isKa ? MONTHS_KA : MONTHS_EN)[parts.month - 1];
  if (!month) return String(value);

  return `${parts.day}-${month}-${parts.year}`;
}

const MONTHS_EN_LONG = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

const MONTHS_KA_LONG = [
  'იანვარი',
  'თებერვალი',
  'მარტი',
  'აპრილი',
  'მაისი',
  'ივნისი',
  'ივლისი',
  'აგვისტო',
  'სექტემბერი',
  'ოქტომბერი',
  'ნოემბერი',
  'დეკემბერი',
];

export function formatLongDate(value, language = 'en') {
  const parts = parseDateParts(value);
  if (!parts) return value ? String(value) : '';

  const isKa = String(language || '').toLowerCase().startsWith('ka');
  const month = (isKa ? MONTHS_KA_LONG : MONTHS_EN_LONG)[parts.month - 1];
  if (!month) return String(value);

  if (isKa) return `${parts.day} ${month}, ${parts.year}`;
  return `${month} ${parts.day}, ${parts.year}`;
}
