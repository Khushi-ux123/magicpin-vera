export function sanitizeText(s: string) {
  return s.replace(/[\u0000-\u001F]/g, ' ').trim();
}

// Hard limit enforced by judge for outgoing message bodies.
export function enforceMaxChars(text: string, maxChars: number = 320) {
  // Normalize whitespace first to avoid weird length due to control chars.
  const normalized = sanitizeText(text);
  if (normalized.length <= maxChars) return normalized;
  // Trim end. Avoid adding new characters that may increase limit.
  return normalized.slice(0, maxChars).trimEnd();
}


