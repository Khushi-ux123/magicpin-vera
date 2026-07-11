export class SuppressionStore {
  private sent = new Map<string, { lastSentAt: number }>();
  private defaultWindowMs: number;

  constructor(opts: { defaultWindowMs: number }) {
    this.defaultWindowMs = opts.defaultWindowMs;
  }

  shouldSuppress(key: string, windowMs: number = this.defaultWindowMs) {
    const cur = this.sent.get(key);
    if (!cur) return false;
    const now = Date.now();
    return now - cur.lastSentAt < windowMs;
  }

  markSent(key: string) {
    this.sent.set(key, { lastSentAt: Date.now() });
  }
}

