export type ConversationTurn = {
  turn_number: number;
  from_role: 'merchant' | 'customer' | 'vera';
  message: string;
  received_at: string;
};

export type ConversationState = {
  conversation_id: string;
  merchant_id: string | null;
  customer_id: string | null;
  lastBotBodyByTrigger?: Record<string, string>;
  lastActionByConversation?: any;
  ended?: boolean;
  autoReplyCount?: number;
  optOut?: boolean;

  // CTA / reply-state tracking to enable slot parsing & YES/STOP routing.
  lastCtaType?: string;
  lastTriggerKind?: string;
  awaitingSlotChoice?: boolean;
  lastSlot1Label?: string;
  lastSlot2Label?: string;

  // Optional reschedule date/time hint emitted by TickService/composer and echoed in ReplyService.
  rescheduleAtHint?: string;


  // When merchant asked for multi-choice slot, we store that state here.
  // TickService emits `awaiting_slot_choice` in its action response; ReplyService should
  // persist it so customer replies can be interpreted correctly.
  lastAwaitingSlotChoiceHint?: boolean;

  turns: ConversationTurn[];
};



export class ConversationStore {
  private map = new Map<string, ConversationState>();

  getOrCreate(conversation_id: string, merchant_id: string | null, customer_id: string | null) {
    const cur = this.map.get(conversation_id);
    if (cur) return cur;
    const fresh: ConversationState = {
      conversation_id,
      merchant_id,
      customer_id,
      turns: [],
      autoReplyCount: 0
    };
    this.map.set(conversation_id, fresh);
    return fresh;
  }

  get(conversation_id: string) {
    return this.map.get(conversation_id);
  }

  end(conversation_id: string) {
    const cur = this.map.get(conversation_id);
    if (cur) cur.ended = true;
  }
}

