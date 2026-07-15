import { memoryStore } from '../memory/store';
import { EngagementComposer } from './composer/EngagementComposer';

const composer = new EngagementComposer();

export class TickService {
  private getAvailableKeys(scope: string) {
    // debug-only; ContextStore provides helpers
    const ctxs: any = memoryStore.contexts as any;
    if (typeof ctxs.debugKeysForScope === 'function') return ctxs.debugKeysForScope(scope);
    return [];
  }

  private printInvalidTrigger(trigger: any) {
    console.log('--------------------------------------------------');
    console.log('Invalid Trigger Payload:');
    console.log(JSON.stringify(trigger, null, 2));
    console.log('--------------------------------------------------');
  }

  private validateTriggerPayload(trigger: any) {
    const missing: string[] = [];
    if (trigger?.id === undefined) missing.push('id');
    if (trigger?.kind === undefined) missing.push('kind');
    if (trigger?.scope === undefined) missing.push('scope');
    if (trigger?.merchant_id === undefined) missing.push('merchant_id');

    if (missing.length > 0) {
      this.printInvalidTrigger(trigger);
      return { ok: false, missing };
    }

    return { ok: true, missing: [] as string[] };
  }

  tick(nowIso: string, availableTriggers: string[]) {
    const actions: any[] = [];

    for (const triggerId of availableTriggers) {
      console.log('--------------------------------------------------');
      console.log(`Processing Trigger: ${triggerId}`);

      const triggerStored = memoryStore.contexts.get('trigger', triggerId);
      const trigger = triggerStored?.payload;
      if (!trigger) {
        console.log('Trigger not found.');
        console.log('Expected context key:');
        console.log(`trigger:${triggerId}`);
        console.log('Available trigger keys:');
        console.log(this.getAvailableKeys('trigger'));
        console.log('--------------------------------------------------');
        continue;
      }

      console.log('Trigger Found:');
      console.log(JSON.stringify(trigger, null, 2));

      const valid = this.validateTriggerPayload(trigger);
      if (!valid.ok) {
        // continue with same behavior (skip invalid)
        console.log('Trigger validation failed. Skipping trigger.');
        console.log('--------------------------------------------------');
        continue;
      }

      const merchantId = trigger.merchant_id;
      console.log('Merchant ID:');
      console.log(merchantId);

      const merchantStored = merchantId
        ? memoryStore.contexts.get('merchant', merchantId)
        : undefined;
      const merchant = merchantStored?.payload ?? null;
      if (!merchant) {
        console.log('Merchant not found.');
        console.log('Expected context key:');
        console.log(`merchant:${merchantId}`);
        console.log('Available merchant keys:');
        console.log(this.getAvailableKeys('merchant'));
        console.log('--------------------------------------------------');
        continue;
      }

      console.log('Merchant Found:');
      console.log(JSON.stringify(merchant, null, 2));

      const categorySlug = merchant?.category_slug;
      if (!categorySlug) {
        console.log('Merchant missing category_slug');
        console.log('--------------------------------------------------');
        continue;
      }

      console.log('Category Slug:');
      console.log(categorySlug);

      const categoryStored = memoryStore.contexts.get('category', categorySlug);
      const category = categoryStored?.payload ?? null;
      if (!category) {
        console.log('Category context not loaded:');
        console.log(categorySlug);
        console.log('--------------------------------------------------');
        continue;
      }

      console.log('Category Found:');
      console.log(JSON.stringify(category, null, 2));

      const customerId = trigger.customer_id ?? null;
      const customerStored = customerId
        ? memoryStore.contexts.get('customer', customerId)
        : undefined;
      const customer = customerStored?.payload ?? null;

      if (trigger.scope === 'customer') {
        console.log('Customer lookup required (trigger.scope === customer)');
        if (!customer) {
          console.log('Customer not found.');
          console.log('Expected context key:');
          console.log(`customer:${customerId}`);
          console.log('Available customer keys:');
          console.log(this.getAvailableKeys('customer'));
          console.log('--------------------------------------------------');
          continue;
        }
      }

      if (customer) {
        console.log('Customer Found:');
        console.log(JSON.stringify(customer, null, 2));
      } else {
        console.log('Customer Found:');
        console.log(null);
      }

      const suppressionKey = trigger.suppression_key ?? '';
      if (suppressionKey) {
        console.log('Suppression Key:');
        console.log(suppressionKey);
        const suppressed = memoryStore.suppression.shouldSuppress(suppressionKey);
        console.log(`Suppression check: ${suppressed ? 'SUPPRESSED' : 'NOT_SUPPRESSED'}`);
        if (suppressed) {
          console.log('Skipping due to suppression.');
          console.log('--------------------------------------------------');
          continue;
        }
      } else {
        console.log('Suppression Key:');
        console.log('');
        console.log('Suppression check: NOT_SUPPRESSED (empty key)');
      }

      const composed = composer.compose(category, merchant, trigger, customer);
      console.log('Composer Result:');
      console.log(JSON.stringify(composed, null, 2));
      console.log(`Decision: ${composed.decision}`);

      if (composed.decision !== 'SEND_MESSAGE') {
        console.log('No action generated because decision is not SEND_MESSAGE.');
        console.log('--------------------------------------------------');
        continue;
      }

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
        rationale: composed.rationale,
        // State hints for /v1/reply routing (used by ReplyService).
        state_hint: {
          cta_type: composed.cta,
          trigger_kind: trigger.kind,
          slot1_label: trigger?.payload?.available_slots?.[0]?.label,
          slot2_label: trigger?.payload?.available_slots?.[1]?.label,
          awaitingSlotChoice: composed.cta === 'multi_choice_slot'
        },
        // Convenience flattened for ReplyService.
        awaiting_slot_choice: composed.cta === 'multi_choice_slot'
      });

      console.log('Action Added Successfully');
      console.log('--------------------------------------------------');
    }

    console.log(`Total Actions Generated: ${actions.length}`);
    void nowIso;
    return { actions };
  }
}



