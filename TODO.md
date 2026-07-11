# Magicpin VERA AI Merchant Assistant — Implementation Tracker

## Execution progress
- [ ] Step 0: align with judge contract (response shapes/actions/body/wait_seconds)
- [x] Step 1-4: existing scaffolding (TS + Express + routes + memory stores) verified
- [ ] Step A: align current implementation with judge_simulator contract (already partially reviewed in briefs)
- [ ] Step B: add domain Zod + TS types for contexts/composer decision
- [ ] Step C: refactor EngagementComposer into deterministic pipeline stages (single entrypoint compose(category, merchant, trigger, customer?))
- [ ] Step D: expand ReplyService for hostile/off-topic + replay scenario expectations (auto-reply hell/backoff, intent transition)
- [ ] Step E: add Jest + ts-jest + supertest setup and implement unit/API tests
- [ ] Step F: add Dockerfile + render.yaml + README.md with env vars and run/test instructions

## Notes
- Tools: ripgrep unavailable; use targeted read/search where possible.

