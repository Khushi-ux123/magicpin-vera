import { memoryStore } from '../memory/store';

const has = (text: string, words: string[]) => words.some((word) => text.includes(word));
const isAuto = (text: string) => has(text.toLowerCase(), ['thank you for contacting', 'our team will respond', 'automated assistant', 'auto-reply']);
const isStop = (text: string) => has(text.toLowerCase(), ['stop', 'unsubscribe', 'not interested', 'do not contact', 'useless spam']);
const isYes = (text: string) => has(text.toLowerCase(), ['yes', 'go ahead', "let''s do it", 'lets do it', 'ok lets do it', 'proceed', 'join', 'send me']);

export class ReplyService {
  reply(body: any) {
    const conv = memoryStore.conversations.getOrCreate(body.conversation_id, body.merchant_id ?? null, body.customer_id ?? null);
    if (conv.ended) return { action: 'end', rationale: 'Conversation is already closed.' };
    conv.turns.push({ turn_number: body.turn_number, from_role: body.from_role, message: body.message, received_at: body.received_at });
    const message = String(body.message ?? '');
    if (isStop(message)) { conv.ended = true; return { action: 'end', rationale: 'The recipient explicitly opted out, so no further messages will be sent.' }; }
    if (isAuto(message)) {
      const repeats = conv.turns.filter((turn) => turn.from_role !== 'vera' && turn.message.trim().toLowerCase() === message.trim().toLowerCase()).length;
      if (repeats >= 3) { conv.ended = true; return { action: 'end', rationale: 'The same WhatsApp Business auto-reply repeated three times with no owner engagement.' }; }
      return { action: 'wait', wait_seconds: repeats === 1 ? 14400 : 86400, rationale: 'Likely WhatsApp Business auto-reply; backing off for an owner response.' };
    }
    if (has(message.toLowerCase(), ['idiot', 'stupid', 'fraud', 'scam'])) return { action: 'send', body: 'I’m sorry this has been frustrating. I’ll keep this focused on your business account; say STOP anytime to end updates.', cta: 'open_ended', rationale: 'Acknowledges hostility, de-escalates, and stays within scope.' };
    if (isYes(message)) return { action: 'send', body: 'Done — I’m preparing the requested draft now. I’ll keep it specific to the details already shared; reply STOP anytime to pause.', cta: 'open_ended', rationale: 'Explicit intent detected, so the conversation moves to action rather than qualification.' };
    if (has(message.toLowerCase(), ['gst', 'tax return', 'loan'])) return { action: 'send', body: 'I can help with your magicpin profile, offers, customer messages, and campaign drafts. For GST filing, please use a qualified tax professional.', cta: 'open_ended', rationale: 'Politely declines an unrelated request and stays on mission.' };
    if (has(message.toLowerCase(), ['later', 'busy', 'tomorrow'])) return { action: 'wait', wait_seconds: 1800, rationale: 'Merchant asked for time; backing off for 30 minutes.' };
    return { action: 'send', body: 'Got it. I can make the next step specific to your profile and the active update. Reply YES to continue, or STOP to pause.', cta: 'binary_yes_no_stop', rationale: 'Clarifies the available next step without inventing information.' };
  }
}
