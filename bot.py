import json
from typing import Optional

COMPOSER_VERSION = "composer_v1"


def compose(category: dict, merchant: dict, trigger: dict, customer: Optional[dict] = None) -> dict:
    merchant_name = merchant.get('identity', {}).get('name', 'there')
    suppression_key = trigger.get('suppression_key') or f"no_supp_{trigger.get('id','unknown')}"
    kind = trigger.get('kind')

    def pick_offer():
        offers = merchant.get('offers') or []
        for o in offers:
            if o.get('status') == 'active' and isinstance(o.get('title'), str):
                return o.get('title')
        cat_offers = category.get('offer_catalog') or []
        if cat_offers:
            return cat_offers[0].get('title') if isinstance(cat_offers[0], dict) else cat_offers[0]
        return None

    offer = pick_offer()

    if kind in ('research_digest', 'research_digest_release'):
        top = trigger.get('payload', {}).get('top_item_id') or trigger.get('payload', {}).get('top_item')
        title = 'a new research item' if not top else top
        body = f"{merchant_name}, {title} is out. Want me to draft a short patient-friendly WhatsApp you can share? Reply YES to get the draft, or STOP."
        return {
            'body': body,
            'cta': 'open_ended',
            'send_as': 'vera' if trigger.get('scope') != 'customer' else 'merchant_on_behalf',
            'suppression_key': suppression_key,
            'rationale': 'Research digest prompt, source-cited, merchant-specific',
            'composer_version': COMPOSER_VERSION
        }

    if kind in ('perf_dip', 'perf_spike', 'seasonal_perf_dip'):
        metric = trigger.get('payload', {}).get('metric', 'calls/views')
        delta = trigger.get('payload', {}).get('delta_pct')
        delta_text = f"{abs(int(delta*100))}% {'drop' if delta and delta<0 else 'lift' if delta else ''}" if isinstance(delta, (int,float)) else 'recent change'
        body = (f"{merchant_name}, quick check: your {metric} saw {delta_text} recently. "
                f"Want to highlight your offer — {offer} — in a simple GBP post this week? Reply YES to draft it, or STOP.") if offer else (
                    f"{merchant_name}, quick check: your {metric} saw {delta_text} recently. Want me to suggest a service+price post idea for this week (no % discounts)? Reply YES, or STOP.")
        return {
            'body': body,
            'cta': 'binary_yes_no',
            'send_as': 'vera',
            'suppression_key': suppression_key,
            'rationale': 'Performance change triggered; single CTA',
            'composer_version': COMPOSER_VERSION
        }

    if kind == 'regulation_change':
        title = trigger.get('payload', {}).get('top_item_id', 'a regulatory change')
        deadline = trigger.get('payload', {}).get('deadline_iso')
        body = f"{merchant_name}, compliance update: {title}{' Effective '+deadline if deadline else ''}. Want a concise audit checklist? Reply YES or STOP."
        return {
            'body': body,
            'cta': 'binary_yes_no',
            'send_as': 'vera',
            'suppression_key': suppression_key,
            'rationale': 'Regulation notice with deadline',
            'composer_version': COMPOSER_VERSION
        }

    if kind == 'recall_due':
        customer_name = (customer or {}).get('identity', {}).get('name', 'there')
        service_due = trigger.get('payload', {}).get('service_due', 'service')
        due = trigger.get('payload', {}).get('due_date')
        slots = trigger.get('payload', {}).get('available_slots', [])
        slot1 = slots[0].get('label') if len(slots) > 0 else 'slot A'
        slot2 = slots[1].get('label') if len(slots) > 1 else 'slot B'
        body = f"Hi {customer_name}, {merchant_name} here — {service_due} recall is due{(' (by '+due+')' if due else '')}. Apke liye 2 slots ready hain: {slot1} or {slot2}. {offer + '.' if offer else ''} Reply 1 for first slot, 2 for second, or STOP."
        return {
            'body': body,
            'cta': 'multi_choice_slot',
            'send_as': 'merchant_on_behalf',
            'suppression_key': suppression_key,
            'rationale': 'Recall reminder uses exact slots from payload',
            'composer_version': COMPOSER_VERSION
        }

    # fallback
    body = (f"{merchant_name}, quick idea for this moment ({kind}): promote {offer} with one crisp message. Reply YES to draft, or STOP.") if offer else (f"{merchant_name}, I noticed a relevant event ({kind}). Want me to draft a WhatsApp message specific to your category + trigger, without inventing details? Reply YES, or STOP.")
    return {
        'body': body,
        'cta': 'binary_yes_no',
        'send_as': 'vera',
        'suppression_key': suppression_key,
        'rationale': 'Deterministic fallback',
        'composer_version': COMPOSER_VERSION
    }


if __name__ == '__main__':
    print('bot.py shim loaded')
