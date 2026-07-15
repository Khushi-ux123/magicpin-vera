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
});

