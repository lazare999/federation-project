export function rewriteAgeBlockedReason(reason, t) {
  if (!reason) return '';
  const text = String(reason);
  if (
    text.includes('8 წლიდან') ||
    /from\s*8\s*years/i.test(text) ||
    /available from (the age of )?8/i.test(text)
  ) {
    return t('membership.enterAgeOrContact');
  }
  return text;
}
