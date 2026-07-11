type Key = string;

export type StoredContext = { version: number; payload: Record<string, any>; delivered_at: string };

export class ContextStore {
  private map = new Map<Key, StoredContext>();

  private key(scope: string, context_id: string) {
    return `${scope}:${context_id}`;
  }

  upsert(scope: string, context_id: string, version: number, payload: Record<string, any>, delivered_at: string) {
    const k = this.key(scope, context_id);
    const cur = this.map.get(k);
    if (cur && cur.version >= version) {
      return { accepted: false, reason: 'stale_version', current_version: cur.version };
    }
    this.map.set(k, { version, payload, delivered_at });
    return { accepted: true, ack_id: `ack_${context_id}_v${version}`, stored_at: new Date().toISOString() };
  }

  get(scope: string, context_id: string) {
    return this.map.get(this.key(scope, context_id));
  }

  counts() {
    const out: Record<string, number> = { category: 0, merchant: 0, customer: 0, trigger: 0 };
    for (const k of this.map.keys()) {
      const [scope] = k.split(':');
      if (out[scope] === undefined) out[scope] = 0;
      out[scope] += 1;
    }
    return out;
  }
}

