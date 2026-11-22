/** Check a value against a built-in format rule. */
export function checkFormat(value, format) {
  if (format === 'email') return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  if (format === 'url') {
    try { const url = new URL(value); return url.protocol === 'http:' || url.protocol === 'https:'; } catch { return false; }
  }
  if (format === 'port') return Number.isInteger(Number(value)) && Number(value) >= 1 && Number(value) <= 65535;
  return false;
}
