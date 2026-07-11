import json
from pathlib import Path
import importlib.util

# Dynamically load bot.py from repository root
ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location('bot', str(ROOT / 'bot.py'))
bot = importlib.util.module_from_spec(spec)
spec.loader.exec_module(bot)
compose = bot.compose

DATASET_DIR = ROOT / 'dataset'
OUT = ROOT / 'submission.jsonl'

with open(DATASET_DIR / 'triggers_seed.json') as f:
    triggers_doc = json.load(f)
with open(DATASET_DIR / 'merchants_seed.json') as f:
    merchants_doc = json.load(f)
with open(DATASET_DIR / 'categories' / 'dentists.json') as f:
    dentists = json.load(f)

merchants = {m['merchant_id']: m for m in merchants_doc.get('merchants', [])}
triggers = triggers_doc.get('triggers', [])

lines = []
count = 0
idx = 0
max_needed = 30
total_triggers = len(triggers)
if total_triggers == 0:
    print('No triggers found in dataset')
    raise SystemExit(1)
while count < max_needed:
    trg = triggers[idx % total_triggers]
    idx += 1
    merchant = merchants.get(trg.get('merchant_id'))
    category = dentists if merchant and merchant.get('category_slug') == 'dentists' else {}
    customer = None
    # try to find a matching customer in dataset/customers_seed.json
    try:
        with open(DATASET_DIR / 'customers_seed.json') as f:
            customers_doc = json.load(f)
            customers = {c['customer_id']: c for c in customers_doc.get('customers', [])}
            customer = customers.get(trg.get('customer_id'))
    except Exception:
        customer = None

    composed = compose(category, merchant or {}, trg, customer)
    count += 1
    lines.append(json.dumps({
        'test_id': f'T{count:02d}',
        'body': composed['body'],
        'cta': composed.get('cta'),
        'send_as': composed.get('send_as'),
        'suppression_key': composed.get('suppression_key'),
        'rationale': composed.get('rationale')
    }))

OUT.write_text('\n'.join(lines))
print(f'Wrote {len(lines)} lines to {OUT}')
