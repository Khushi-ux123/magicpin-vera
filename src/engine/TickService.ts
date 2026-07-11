import { memoryStore } from '../memory/store';
import { EngagementComposer } from './composer/EngagementComposer';

const composer = new EngagementComposer();

export class TickService {
  tick(nowIso: string, availableTriggers: string[]) {
    const actions: any[] = [];
    for (const triggerId of availableTriggers) {
      const trigger = memoryStore.contexts.get('trigger', triggerId)?.payload;
      if (!trigger) continue;

      const merchantId = trigger.merchant_id;
      const merchant = merchantId ? memoryStore.contexts.get('merchant', merchantId)?.payload : null;
      if (!merchant) continue;

      const category = merchant.category_slug
        ? memoryStore.contexts.get('category', merchant.category_slug)?.payload
        : null;
      if (!category) continue;

      const customerId = trigger.customer_id ?? null;
      const customer = customerId ? memoryStore.contexts.get('customer', customerId)?.payload : null;
      if (trigger.scope === 'customer' && !customer) continue;

      const suppressionKey = trigger.suppression_key ?? '';
      if (suppressionKey && memoryStore.suppression.shouldSuppress(suppressionKey)) continue;

      const composed = composer.compose(category, merchant, trigger, customer);
      if (composed.decision !== 'SEND_MESSAGE') continue;

      if (suppressionKey) memoryStore.suppression.markSent(suppressionKey);
      actions.push({
        conversation_id: `conv_${merchantId}_${triggerId}`,
        merchant_id: merchantId,
        customer_id: customerId,
        send_as: composed.sender,
        trigger_id: triggerId,
        template_name: composed.templateName,
        template_params: composed.templateParams,
        body: composed.body,
        cta: composed.cta,
        suppression_key: composed.suppressionKey,
        rationale: composed.rationale
      });
    }
    void nowIso;
    return { actions };
  }
}

