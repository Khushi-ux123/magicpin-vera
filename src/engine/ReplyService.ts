﻿import { memoryStore } from '../memory/store';
import { enforceMaxChars } from '../utils/sanitizeText';

const has = (text: string, words: string[]) => words.some((word) => text.includes(word));
const isAuto = (text: string) =>
  has(text.toLowerCase(), ['thank you for contacting', 'our team will respond', 'automated assistant', 'auto-reply']);
const isStop = (text: string) =>
  has(text.toLowerCase(), ['stop', 'unsubscribe', 'not interested', 'do not contact', 'useless spam']);

function safeTrim(s: string) {
  return s.replace(/\s+/g, ' ').trim();
}

function mentionTriggerAndCategory(triggerKind: string | undefined, merchantCategorySlug: string | undefined) {
  const parts: string[] = [];
  if (triggerKind) parts.push(triggerKind);
  if (merchantCategorySlug) parts.push(merchantCategorySlug);
  return parts.length ? safeTrim(parts.join(' • ')) : '';
}

function detectMerchantYes(lower: string) {
  return has(lower, ['yes', 'ok', "let''s do it", "lets do it", 'proceed', 'join', 'send me', 'go ahead']);
}

function isTechnicalIntent(message: string) {
  return has(message.toLowerCase(), [
    'x-ray',
    'xray',
    'x ray',
    'xray setup',
    'setup',
    'scan',
    'scanner',
    'radiology',
    'film',
    'd-speed',
    'meter',
    'calibration',
    'auditing'
  ]);
}

function detectOffTopic(lower: string) {
  return has(lower, ['gst', 'tax return', 'income tax', 'pan', 'aadhaar', 'passport', 'visa']);
}

export class ReplyService {
  reply(body: any) {
    const conv = memoryStore.conversations.getOrCreate(body.conversation_id, body.merchant_id ?? null, body.customer_id ?? null);

    const message = String(body.message ?? '');
    const lower = message.toLowerCase();

    const isRestartIntent = has(lower, ['start', 'resume', 'restart', 'continue', 'new chat', 'begin']);

    if (conv.ended) {
      if (isRestartIntent) {
        conv.ended = false;
        conv.optOut = false;
        conv.autoReplyCount = 0;
      } else {
        return { action: 'end', rationale: 'Conversation is already closed.' };
      }
    }

    conv.turns.push({ turn_number: body.turn_number, from_role: body.from_role, message: body.message, received_at: body.received_at });

    if (isStop(message)) {
      conv.ended = true;
      conv.optOut = true;
      return { action: 'end', rationale: 'The recipient explicitly opted out (STOP), so no further messages will be sent.' };
    }

    if (isAuto(message)) {
      const normalized = message.trim().toLowerCase();
      const crossKey = `auto_${conv.merchant_id ?? 'm_unknown'}_${normalized}`;

      const prev = conv.autoReplyCount ?? 0;
      const prevSent = memoryStore.suppression.shouldSuppress(crossKey, 365 * 24 * 60 * 60 * 1000);
      const repeats = prev + (prevSent ? 1 : 0);

      if (repeats >= 2) {
        conv.ended = true;
        return { action: 'end', rationale: 'Auto Reply #3 detected — END conversation.' };
      }

      conv.autoReplyCount = repeats;
      memoryStore.suppression.markSent(crossKey);

      return { action: 'wait', wait_seconds: 14400, rationale: repeats === 0 ? 'Auto Reply #1 detected — WAIT 4 hours.' : 'Auto Reply #2 detected — WAIT 4 hours.' };
    }

    const role: 'merchant' | 'customer' = body.from_role === 'customer' ? 'customer' : 'merchant';

    const parseIdsFromConversationId = (conversationId: string) => {
      const parts = String(conversationId).split('_');
      if (parts.length < 3) return { merchantId: undefined, triggerId: undefined };
      const merchantId = parts.slice(1, 2).join('_') || undefined;
      const triggerId = parts.slice(2).join('_') || undefined;
      return { merchantId, triggerId };
    };

    const { merchantId: inferredMerchantId, triggerId: inferredTriggerId } = parseIdsFromConversationId(body.conversation_id);

    const merchantId = body.merchant_id ?? inferredMerchantId ?? null;
    const triggerId = body.trigger_id ?? inferredTriggerId ?? null;

    const triggerPayload: any | null = triggerId ? memoryStore.contexts.get('trigger', triggerId)?.payload ?? null : null;
    const merchantPayload: any | null = merchantId ? memoryStore.contexts.get('merchant', merchantId)?.payload ?? null : null;

    const normalizePossiblyUnknown = (v: any): string | undefined => {
      if (v === undefined || v === null) return undefined;
      const s = String(v).trim();
      if (!s) return undefined;
      if (s.toLowerCase() === 'unknown' || s === '(unknown)') return undefined;
      return s;
    };

    const categorySlug: string | undefined = normalizePossiblyUnknown(merchantPayload?.category_slug);
    const categoryPayload: any | null = categorySlug ? memoryStore.contexts.get('category', categorySlug)?.payload ?? null : null;
    const merchantCategorySlug: string | undefined = categorySlug;

    const triggerKindFromPayload = normalizePossiblyUnknown(triggerPayload?.kind as string | undefined);
    const triggerKind = triggerKindFromPayload ?? normalizePossiblyUnknown(conv.lastTriggerKind);

    const requestedPatientOrPost = (() => {
      const k = (triggerKind ?? '').toLowerCase();

      const merchantName: string | null = merchantPayload?.identity?.name ?? merchantPayload?.name ?? null;

      const offerText: string | null =
        (Array.isArray(merchantPayload?.offers)
          ? merchantPayload.offers.find((o: any) => o?.status === 'active' && typeof o?.title === 'string')?.title
          : null) ??
        (Array.isArray(categoryPayload?.offer_catalog) ? categoryPayload.offer_catalog?.[0]?.title : null) ??
        null;

      const prefix = merchantName ? `${merchantName} recommends:` : 'Patient communication draft:';

      if (k === 'research_digest' || k === 'research_digest_release' || k.includes('research')) {
        return `${prefix} Regular preventive dental visits help detect problems early and keep your smile healthy. If it’s time for your next check-up, contact us to schedule an appointment.`;
      }

      if (k === 'recall_due' || k.includes('recall')) {
        return `${prefix} It’s time for your routine dental check-up. Regular preventive visits help maintain healthy teeth and gums. Contact us to book your preferred appointment.`;
      }

      if (k.includes('performance') || k.includes('perf') || k.includes('seasonal_perf_dip')) {
        const offerPart = offerText ? `Book “${offerText}” today and stay ahead of oral health issues.` : 'Book your next dental visit and stay ahead of oral health issues.';
        return `Google Business Profile post: Healthy smiles start with preventive care. ${offerPart}`;
      }

      if (k.includes('seasonal')) {
        return `${prefix} Seasonal weather can increase the risk of oral infections. A preventive dental check-up helps keep your smile healthy. Contact us to schedule your visit.`;
      }

      if (k.includes('regulation')) {
        return 'Summary: A new compliance update has been released. Review your current workflow and ensure your patient communication follows the latest guidance.';
      }

      return `${prefix} Preventive dental visits help catch issues early and keep treatment simple. Contact us to schedule your next appointment.`;
    })();

    // Slot picking (customer state).
    if (conv.awaitingSlotChoice === true && role === 'customer') {
      const wants1 = has(lower, [' 1', '1st', 'first', 'slot 1', 'slot1', 'choose 1']);
      const wants2 = has(lower, [' 2', '2nd', 'second', 'slot 2', 'slot2', 'choose 2']);

      if (wants1 || wants2) {
        const chosen = wants1 ? 1 : 2;
        const slotLabel = chosen === 1 ? conv.lastSlot1Label : conv.lastSlot2Label;
        conv.awaitingSlotChoice = false;

        const chosenText = slotLabel ? ` ${slotLabel}` : '';
        const replyBody = `Done — slot ${chosen} selected.${chosenText}`;
        return { action: 'send', body: enforceMaxChars(replyBody), cta: 'open_ended', rationale: 'Customer picked a valid slot (1/2) while waiting for slot choice.' };
      }

      const clarify = 'Please reply “1” or “2” to pick the slot you want.';
      return { action: 'send', body: enforceMaxChars(clarify), cta: 'open_ended', rationale: 'Awaiting explicit slot choice (1/2).' };
    }

    if (role === 'merchant' && isTechnicalIntent(message)) {
      return {
        action: 'send',
        body: enforceMaxChars(
          `I can help with patient communication, recall campaigns, offers, and customer engagement. I can’t advise on clinic equipment. Please consult your equipment supplier.`
        ),
        cta: 'open_ended',
        rationale: 'Merchant technical question: refused equipment advice; will provide patient communication content instead.'
      };
    }

    if (role === 'merchant' && detectMerchantYes(lower)) {
      return { action: 'send', body: enforceMaxChars(requestedPatientOrPost), cta: 'open_ended', rationale: 'Merchant confirmation received; delivered trigger-specific content immediately.' };
    }

    if (role === 'merchant' && detectOffTopic(lower)) {
      const safeTrigger = mentionTriggerAndCategory(triggerKind, merchantCategorySlug);
      const offBody = `I can help with your magicpin profile, campaigns, offers, and customer engagement. I can’t assist with GST/income tax or unrelated business services.${safeTrigger ? ` ${safeTrigger}` : ''}`
        .replace(/\(unknown\)/g, '')
        .replace(/\bunknown\b/gi, '')
        .trim();

      return { action: 'send', body: enforceMaxChars(offBody), cta: 'open_ended', rationale: 'Off-topic detected; refused within Vera scope.' };
    }

    if (has(lower, ['later', 'busy', 'tomorrow'])) {
      return { action: 'wait', wait_seconds: 1800, rationale: 'Merchant asked for time; backing off for 30 minutes.' };
    }

    const defaultMerchant = 'Got it. I’ll tailor the next message to your current update.';
    return { action: 'send', body: enforceMaxChars(defaultMerchant), cta: 'open_ended', rationale: 'Fallback: no specialized handler matched.' };
  }
}

