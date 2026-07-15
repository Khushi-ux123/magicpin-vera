# TODO

## Completed
- [x] Analyzed early guard in `src/engine/ReplyService.ts` that always returns `{ action: 'end' }` when `conv.ended === true`.
- [x] Implemented “restart chat on same conversation_id” when the sender explicitly sends a restart/resume keyword (e.g., `start`, `resume`, `restart`, `continue`, `new chat`, `begin`).
- [x] Extended unit tests in `src/tests/reply.test.ts` to cover: STOP -> restart -> conversation should not stay stuck in end-loop.
- [x] Ran `npm test` (all test suites passed).

## Notes
- The restart behavior is intentionally keyword-driven to avoid re-opening conversations after an explicit STOP unless the sender asks to restart.


