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
});
