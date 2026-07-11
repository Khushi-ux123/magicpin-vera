export function sanitizeText(s: string) {
  return s.replace(/[\u0000-\u001F]/g, ' ').trim();
}

