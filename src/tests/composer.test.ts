import { EngagementComposer } from '../engine/composer/EngagementComposer';

describe('EngagementComposer', () => {
  const composer = new EngagementComposer();

  test('composes research digest for merchant', () => {
    const category = { slug: 'dentists', digest: [{ id: 'd1', title: 'Study A', summary: 'S' }] };
    const merchant = { identity: { name: "Dr. Meera", city: 'Delhi' }, offers: [] };
    const trigger: any = { id: 't1', kind: 'research_digest', scope: 'merchant', payload: { top_item_id: 'd1' }, suppression_key: 'k1' };
    const out = composer.compose(category, merchant, trigger, null as any);
    expect(out.decision).toBe('SEND_MESSAGE');
    expect(out.body.toLowerCase()).toContain('dr. meera');
    expect(out.composerVersion).toBe('composer_v1');
    expect(out.contextHash).toBeTruthy();
  });

  test('composes recall for customer', () => {
    const category = { slug: 'dentists' };
    const merchant = { identity: { name: "Dr. Meera" }, offers: [{ id: 'o1', title: 'Dental Cleaning @ ₹299', status: 'active' }] };
    const trigger: any = { id: 't2', kind: 'recall_due', scope: 'customer', payload: { service_due: '6_month_cleaning', due_date: '2026-11-12', available_slots: [{ label: 'A' }, { label: 'B' }] }, suppression_key: 'k2' };
    const customer = { identity: { name: 'Priya' } };
    const out = composer.compose(category, merchant, trigger, customer as any);
    expect(out.decision).toBe('SEND_MESSAGE');
    expect(out.sender).toBe('merchant_on_behalf');
    expect(out.composerVersion).toBe('composer_v1');
  });
});
