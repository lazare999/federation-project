export const DEFAULT_COUNTRY_CODE = 'GE';

export const COUNTRIES = [
  { code: 'GE', en: 'Georgia', ka: 'საქართველო' },
  { code: 'AM', en: 'Armenia', ka: 'სომხეთი' },
  { code: 'AZ', en: 'Azerbaijan', ka: 'აზერბაიჯანი' },
  { code: 'TR', en: 'Turkey', ka: 'თურქეთი' },
  { code: 'UA', en: 'Ukraine', ka: 'უკრაინა' },
  { code: 'RU', en: 'Russia', ka: 'რუსეთი' },
  { code: 'BY', en: 'Belarus', ka: 'ბელარუსი' },
  { code: 'MD', en: 'Moldova', ka: 'მოლდოვა' },
  { code: 'KZ', en: 'Kazakhstan', ka: 'ყაზახეთი' },
  { code: 'UZ', en: 'Uzbekistan', ka: 'უზბეკეთი' },
  { code: 'DE', en: 'Germany', ka: 'გერმანია' },
  { code: 'FR', en: 'France', ka: 'საფრანგეთი' },
  { code: 'IT', en: 'Italy', ka: 'იტალია' },
  { code: 'ES', en: 'Spain', ka: 'ესპანეთი' },
  { code: 'GB', en: 'United Kingdom', ka: 'გაერთიანებული სამეფო' },
  { code: 'IE', en: 'Ireland', ka: 'ირლანდია' },
  { code: 'NL', en: 'Netherlands', ka: 'ნიდერლანდები' },
  { code: 'BE', en: 'Belgium', ka: 'ბელგია' },
  { code: 'AT', en: 'Austria', ka: 'ავსტრია' },
  { code: 'CH', en: 'Switzerland', ka: 'შვეიცარია' },
  { code: 'PL', en: 'Poland', ka: 'პოლონეთი' },
  { code: 'CZ', en: 'Czechia', ka: 'ჩეხეთი' },
  { code: 'SK', en: 'Slovakia', ka: 'სლოვაკეთი' },
  { code: 'HU', en: 'Hungary', ka: 'უნგრეთი' },
  { code: 'RO', en: 'Romania', ka: 'რუმინეთი' },
  { code: 'BG', en: 'Bulgaria', ka: 'ბულგარეთი' },
  { code: 'GR', en: 'Greece', ka: 'საბერძნეთი' },
  { code: 'RS', en: 'Serbia', ka: 'სერბეთი' },
  { code: 'HR', en: 'Croatia', ka: 'ხორვატია' },
  { code: 'SI', en: 'Slovenia', ka: 'სლოვენია' },
  { code: 'ME', en: 'Montenegro', ka: 'მონტენეგრო' },
  { code: 'MK', en: 'North Macedonia', ka: 'ჩრდილოეთი მაკედონია' },
  { code: 'AL', en: 'Albania', ka: 'ალბანეთი' },
  { code: 'LT', en: 'Lithuania', ka: 'ლიტვა' },
  { code: 'LV', en: 'Latvia', ka: 'ლატვია' },
  { code: 'EE', en: 'Estonia', ka: 'ესტონეთი' },
  { code: 'SE', en: 'Sweden', ka: 'შვედეთი' },
  { code: 'NO', en: 'Norway', ka: 'ნორვეგია' },
  { code: 'DK', en: 'Denmark', ka: 'დანია' },
  { code: 'FI', en: 'Finland', ka: 'ფინეთი' },
  { code: 'PT', en: 'Portugal', ka: 'პორტუგალია' },
  { code: 'US', en: 'United States', ka: 'აშშ' },
  { code: 'CA', en: 'Canada', ka: 'კანადა' },
  { code: 'BR', en: 'Brazil', ka: 'ბრაზილია' },
  { code: 'AR', en: 'Argentina', ka: 'არგენტინა' },
  { code: 'AU', en: 'Australia', ka: 'ავსტრალია' },
  { code: 'NZ', en: 'New Zealand', ka: 'ახალი ზელანდია' },
  { code: 'CN', en: 'China', ka: 'ჩინეთი' },
  { code: 'JP', en: 'Japan', ka: 'იაპონია' },
  { code: 'KR', en: 'South Korea', ka: 'სამხრეთი კორეა' },
  { code: 'IN', en: 'India', ka: 'ინდოეთი' },
  { code: 'IL', en: 'Israel', ka: 'ისრაელი' },
  { code: 'AE', en: 'United Arab Emirates', ka: 'არაბთა გაერთიანებული საამიროები' },
  { code: 'QA', en: 'Qatar', ka: 'კატარი' },
  { code: 'SA', en: 'Saudi Arabia', ka: 'საუდის არაბეთი' },
  { code: 'IR', en: 'Iran', ka: 'ირანი' },
  { code: 'EG', en: 'Egypt', ka: 'ეგვიპტე' },
  { code: 'ZA', en: 'South Africa', ka: 'სამხრეთი აფრიკა' },
];

export function getCountryByCode(code) {
  return (
    COUNTRIES.find((country) => country.code === code) ||
    COUNTRIES.find((country) => country.code === DEFAULT_COUNTRY_CODE)
  );
}

export function resolveCountryCode(country, countryKa) {
  const values = [country, countryKa]
    .filter(Boolean)
    .map((value) => String(value).trim().toLowerCase());

  if (!values.length) return DEFAULT_COUNTRY_CODE;

  const match = COUNTRIES.find((item) => {
    const code = item.code.toLowerCase();
    const en = item.en.toLowerCase();
    const ka = item.ka.toLowerCase();
    return values.some(
      (value) => value === code || value === en || value === ka
    );
  });

  return match?.code || DEFAULT_COUNTRY_CODE;
}

export function getCountryLabel(country, countryKa, language = 'en') {
  const found = getCountryByCode(resolveCountryCode(country, countryKa));
  if (!found) return country || countryKa || '—';
  return String(language || '')
    .toLowerCase()
    .startsWith('ka')
    ? found.ka
    : found.en;
}
