import { ContextStore } from './contextStore';
import { ConversationStore } from './conversationStore';
import { SuppressionStore } from './suppressionStore';

export const memoryStore = {
  contexts: new ContextStore(),
  conversations: new ConversationStore(),
  suppression: new SuppressionStore({ defaultWindowMs: 24 * 60 * 60 * 1000 })
};

