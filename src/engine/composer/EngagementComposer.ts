import { sanitizeText } from '../../utils/sanitizeText';

export type Composed = {
  decision: 'SEND_MESSAGE' | 'WAIT' | 'NO_ACTION';
  reason: string;
  body: string;
  cta: any;
  sender: 'vera' | 'merchant_on_behalf';
  suppressionKey: string;
  confidence: number;
  templateName: string;
  templateParams: string[];
  composerVersion?: string;
  contextHash?: string;
  rationale: string;
};

function pickPrimaryOffer(category: any, merchant: any) {
  const activeOffers = Array.isArray(merchant?.offers)
    ? merchant.offers.filter((o: any) => o.status === 'active' && typeof o.title === 'string')
    : [];
  if (activeOffers.length > 0) return activeOffers[0].title;

  const catalog = Array.isArray(category?.offer_catalog) ? category.offer_catalog : [];
  if (catalog.length > 0 && catalog[0].title) return catalog[0].title;

  return null;
}

function languageFromMerchant(merchant: any): 'en' | 'hi_en_mix' {
  const langs = merchant?.identity?.languages;
  if (!Array.isArray(langs)) return 'en';
  const hasHi = langs.includes('hi');
  const hasEn = langs.includes('en');
  if (hasHi && hasEn) return 'hi_en_mix';
  if (hasHi) return 'hi_en_mix';
  return 'en';
}

function yesText(lang: 'en' | 'hi_en_mix') {
  return lang === 'hi_en_mix' ? 'Yes' : 'Yes';
}

export class EngagementComposer {
  compose(category: any, merchant: any, trigger: any, customer: any | null): Composed {
    // compute a simple stable context hash for audit/replay
    let contextHash = '';
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const crypto = require('crypto');
      const ctx = JSON.stringify({ category, merchant, trigger, customer });
      contextHash = crypto.createHash('sha256').update(ctx).digest('hex');
    } catch (e) {
      contextHash = '';
    }
    const categorySlug = category?.slug;
    const merchantName = merchant?.identity?.name ?? 'there';

    const suppressionKey = trigger?.suppression_key ?? `no_supp_${trigger?.id ?? 'unknown'}`;

    const langPref = languageFromMerchant(merchant);

    // Hard safety: if trigger missing/expired decision
    if (!trigger?.id || !trigger?.kind) {
      return {
        decision: 'NO_ACTION',
        reason: 'Missing trigger kind/id; cannot safely compose.',
        body: '',
        cta: 'none',
        sender: 'vera',
        suppressionKey,
        confidence: 0.1,
        templateName: 'none',
        templateParams: [],
        rationale: 'Validation failed.'
      };
    }

    const offer = pickPrimaryOffer(category, merchant);

    const title = merchant?.identity?.city ? `${merchant.identity.city}` : '';
    void title;

    // Customer-facing triggers
    const isCustomerScoped = trigger?.scope === 'customer' || customer;
    const sender = isCustomerScoped ? 'merchant_on_behalf' : 'vera';

    const actionTriggerKind = trigger.kind;

    if (actionTriggerKind === 'research_digest' || actionTriggerKind === 'research_digest_release') {
      const topItem = trigger?.payload?.top_item_id ?? trigger?.payload?.top_item ?? null;
      const digestItem = this.findDigestItem(category, topItem);
      const reason = `External research digest (${digestItem?.title ?? topItem}) is available for this category.`;

      const body = isCustomerScoped
        ? `Hi ${customer?.identity?.name ?? 'there'}, ${merchantName} here. Research digest relevant to ${categorySlug} landed. Want me to share the key point?`
        : `${merchantName}, ${digestItem?.title ?? 'a new research item'} is out. ${digestItem?.summary ? `One key takeaway: ${digestItem.summary}` : 'Want me to draft a short patient-friendly WhatsApp you can share?'} Reply YES to get the draft, or STOP.`;

      const cleaned = sanitizeText(body);

      return {
        decision: 'SEND_MESSAGE',
        reason,
        body: cleaned,
        cta: 'binary_yes_no',
        sender,
        suppressionKey,
        confidence: 0.85,
        templateName: 'vera_research_digest_v1',
        templateParams: [merchantName, digestItem?.title ?? 'Research digest item', 'Draft a patient WhatsApp', 'Reply YES to receive'],
        composerVersion: 'composer_v1',
        contextHash,
        rationale: reason + ' Category voice + merchant specificity (name, category).'
      };
    }

    if (actionTriggerKind === 'perf_dip' || actionTriggerKind === 'perf_spike' || actionTriggerKind === 'seasonal_perf_dip') {
      const metric = trigger?.payload?.metric ?? 'calls/views';
      const delta = trigger?.payload?.delta_pct;
      const deltaText = typeof delta === 'number' ? `${Math.abs(delta * 100).toFixed(0)}% ${delta < 0 ? 'drop' : 'lift'}` : 'recent change';
      const reason = `Trigger ${actionTriggerKind}: ${deltaText} for this merchant vs baseline.`;

      const body = offer
        ? `${merchantName}, quick check: your ${metric} saw ${deltaText} recently. Want to highlight your offer â€” ${offer} â€” in a simple GBP post this week? Reply YES to draft it, or STOP.`
        : `${merchantName}, quick check: your ${metric} saw ${deltaText} recently. Want me to suggest a service+price post idea for this week (no % discounts)? Reply YES, or STOP.`;

      return {
        decision: 'SEND_MESSAGE',
        reason,
        body: sanitizeText(body),
        cta: 'binary_yes_no',
        sender,
        suppressionKey,
        confidence: 0.7,
        templateName: 'vera_perf_change_v1',
        templateParams: [merchantName, deltaText, offer ?? 'service+price offer', 'Reply YES to draft'],
        composerVersion: 'composer_v1',
        contextHash,
        rationale: reason + ' Uses specific metric change + single CTA.'
      };
    }

    if (actionTriggerKind === 'regulation_change') {
      const digestItem = this.findDigestItem(category, trigger?.payload?.top_item_id ?? trigger?.payload?.digest_item_id);
      const deadline = trigger?.payload?.deadline_iso ? ` Effective ${trigger.payload.deadline_iso}.` : '';
      const source = digestItem?.source ? ` — ${digestItem.source}` : '';
      const action = digestItem?.actionable ? ` ${digestItem.actionable}` : '';
      const body = `${merchantName}, compliance update: ${digestItem?.title ?? 'a regulatory change'}${deadline}${action} Want a concise audit checklist? Reply YES or STOP.${source}`;
      return {
        decision: 'SEND_MESSAGE', reason: 'Regulatory trigger matched to the supplied category digest item and deadline.',
        body: sanitizeText(body), cta: 'binary_yes_no', sender, suppressionKey, confidence: 0.95,
        templateName: 'vera_compliance_update_v1', templateParams: [merchantName, digestItem?.title ?? 'Compliance update', String(trigger?.payload?.deadline_iso ?? ''), 'Reply YES for checklist'],
        composerVersion: 'composer_v1',
        contextHash,
        rationale: 'Uses the supplied regulation headline, deadline, source, and actionable instruction without adding unsupported compliance claims.'
      };
    }
    if (actionTriggerKind === 'recall_due') {
      const customerName = customer?.identity?.name ?? 'there';
      const serviceDue = trigger?.payload?.service_due ?? 'service';
      const due = trigger?.payload?.due_date;
      const slots = trigger?.payload?.available_slots ?? [];
      const slot1 = slots[0]?.label;
      const slot2 = slots[1]?.label;

      const body = `Hi ${customerName}, ${merchantName} here ðŸ—“ï¸ ${serviceDue} recall is due${due ? ` (by ${due})` : ''}. Apke liye 2 slots ready hain: ${slot1 ?? 'slot A'} or ${slot2 ?? 'slot B'}. ${offer ? `${offer}. ` : ''}Reply 1 for first slot, 2 for second, or STOP.`;

      return {
        decision: 'SEND_MESSAGE',
        reason: `Customer-scoped recall reminder (${serviceDue}) with available slots in trigger payload.`,
        body: sanitizeText(body),
        cta: 'multi_choice_slot',
        sender: 'merchant_on_behalf',
        suppressionKey,
        confidence: 0.9,
        templateName: 'merchant_recall_reminder_v1',
        templateParams: [customerName, merchantName, `Recall due${due ? ` by ${due}` : ''}`, `${slot1 ?? ''} or ${slot2 ?? ''}`, offer ?? 'Offer if applicable'],
        composerVersion: 'composer_v1',
        contextHash,
        rationale: 'Uses exact slots from trigger payload, single-purpose booking CTA.'
      };
    }

    // Fallback: still send something deterministic but avoid fabricating offer/metrics
    const body = offer
      ? `${merchantName}, quick idea for this moment (${trigger.kind}): promote ${offer} with one crisp message. Reply YES to draft, or STOP.`
      : `${merchantName}, I noticed a relevant event (${trigger.kind}). Want me to draft a WhatsApp message specific to your category + trigger, without inventing details? Reply YES, or STOP.`;

    return {
      decision: 'SEND_MESSAGE',
      reason: `Trigger ${trigger.kind} is active and we can compose using available merchant/category info without hallucination.`,
      body: sanitizeText(body),
      cta: 'binary_yes_no',
      sender,
      suppressionKey,
      confidence: 0.45,
      templateName: 'vera_generic_v1',
      templateParams: [merchantName, trigger.kind, offer ?? 'category-relevant offer', 'Reply YES to draft'],
      composerVersion: 'composer_v1',
      contextHash,
      rationale: 'Deterministic fallback strategy anchored on existing merchant/category fields.'
    };
  }

  private findDigestItem(category: any, topItemId: any) {
    const digest = Array.isArray(category?.digest) ? category.digest : [];
    if (!topItemId) return digest[0] ?? null;
    return digest.find((d: any) => d.id === topItemId) ?? digest[0] ?? null;
  }
}


