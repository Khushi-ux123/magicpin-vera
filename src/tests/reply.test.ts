import { ReplyService } from '../engine/ReplyService';

describe('ReplyService', () => {
  const svc = new ReplyService();

  test('detects stop and ends conversation', () => {
    const res = svc.reply({ conversation_id: 'c1', merchant_id: 'm1', customer_id: null, from_role: 'merchant', message: 'Please stop contacting me', received_at: new Date().toISOString(), turn_number: 2 });
    expect(res.action).toBe('end');
  });

  test('detects yes intent and sends', () => {
    const res = svc.reply({ conversation_id: 'c2', merchant_id: 'm1', customer_id: null, from_role: 'merchant', message: 'Yes, send me the draft', received_at: new Date().toISOString(), turn_number: 2 });
    expect(res.action).toBe('send');
  });

  test('customer slot pick supports "1" and ends slot waiting', () => {
    const conversation_id = 'c_slot_1';

    // Mark conversation as awaiting slot choice via hint.
    const r0 = svc.reply({
      conversation_id,
      merchant_id: 'm1',
      customer_id: null,
      from_role: 'merchant',
      message: 'irrelevant',
      received_at: new Date().toISOString(),
      turn_number: 1,
      awaiting_slot_choice: true
    } as any);
    void r0;

    const res = svc.reply({
      conversation_id,
      merchant_id: 'm1',
      customer_id: null,
      from_role: 'customer',
      message: '1',
      received_at: new Date().toISOString(),
      turn_number: 2
    } as any);

    expect(res.action).toBe('send');
    expect(String((res as any).body ?? '')).toContain('slot 1');
  });

  test('customer slot pick supports "slot 2"', () => {
    const conversation_id = 'c_slot_2';

    svc.reply({
      conversation_id,
      merchant_id: 'm1',
      customer_id: null,
      from_role: 'merchant',
      message: 'irrelevant',
      received_at: new Date().toISOString(),
      turn_number: 1,
      awaiting_slot_choice: true
    } as any);

    const res = svc.reply({
      conversation_id,
      merchant_id: 'm1',
      customer_id: null,
      from_role: 'customer',
      message: 'slot 2',
      received_at: new Date().toISOString(),
      turn_number: 2
    } as any);

    expect(res.action).toBe('send');
    expect(String((res as any).body ?? '')).toContain('slot 2');
  });


  test('allows restarting on same conversation_id after stop when sender uses restart keyword', () => {
    const stopRes = svc.reply({
      conversation_id: 'c3',
      merchant_id: 'm1',
      customer_id: null,
      from_role: 'merchant',
      message: 'Please stop contacting me',
      received_at: new Date().toISOString(),
      turn_number: 2
    });
    expect(stopRes.action).toBe('end');

    const restartRes = svc.reply({
      conversation_id: 'c3',
      merchant_id: 'm1',
      customer_id: null,
      from_role: 'merchant',
      message: 'start',
      received_at: new Date().toISOString(),
      turn_number: 3
    });

    // With restart keyword, conversation should reopen and not be stuck in end-loop.
    expect(restartRes.action).not.toBe('end');
  });

  test('does not print (unknown) for trigger/category when off-topic is detected', () => {
    const res = svc.reply({
      conversation_id: 'c_unknown',
      merchant_id: null,
      customer_id: null,
      from_role: 'merchant',
      message: 'Can you help me file GST?',
      received_at: new Date().toISOString(),
      turn_number: 1
    });

    // Off-topic should be refused with a safe redirect.
    expect(res.action).toBe('send');
    expect(String((res as any).body ?? '')).not.toContain('(unknown)');
    expect(String((res as any).body ?? '')).not.toContain('unknown');
  });


  test('auto-reply sequence: #1 WAIT, #2 WAIT, #3 END', () => {
    const conversation_id = 'c_auto_1';
    const merchant_id = 'm_auto';

    const r1 = svc.reply({
      conversation_id,
      merchant_id,
      customer_id: null,
      from_role: 'customer',
      message: 'Thank you for contacting, our team will respond shortly.',
      received_at: new Date().toISOString(),
      turn_number: 1
    });
    expect(r1.action).toBe('wait');

    const r2 = svc.reply({
      conversation_id,
      merchant_id,
      customer_id: null,
      from_role: 'customer',
      message: 'Thank you for contacting, our team will respond shortly.',
      received_at: new Date().toISOString(),
      turn_number: 2
    });
    expect(r2.action).toBe('wait');

    const r3 = svc.reply({
      conversation_id,
      merchant_id,
      customer_id: null,
      from_role: 'customer',
      message: 'Thank you for contacting, our team will respond shortly.',
      received_at: new Date().toISOString(),
      turn_number: 3
    });
    expect(r3.action).toBe('end');
  });

});



