# Task 3 report

Implemented the Agent service boundary on base `9de5345`.

- Added strict settings, timezone, model, limit, optimistic-version, and exact decimal USD-to-micro-USD validation.
- Added a server-only OpenAI factory and deterministic candidate verifier using one inference request, four output tokens, zero retries/temperature, and a five-second abort signal.
- Added the singleton repository and service for safe configuration DTOs, exact-model enablement, model-change disabling, encrypted credential registration/replacement/testing/deletion, atomic audit writes, and optimistic updates.
- Candidate verification and encryption complete before credential replacement; every failure preserves the prior row. Credential deletion disables Agent settings before removing the encrypted row.
- Installed only the requested `ai` and `@ai-sdk/openai` direct dependencies. No Models API, provider registry, catalog, pricing lookup, or live OpenAI credential was used.

Verification:

- `npm run test:unit -- tests/agent` — 40 passed.
- `npm test` — typecheck and lint passed, 475 unit tests passed, and the production build completed.

## Fix round 1

- Moved exact-model credential verification into the same locked, versioned SQL decision that enables AI, closing the credential-test TOCTOU window.
- Model changes now atomically disable AI, clear both prices and `pricingCheckedAt`, and clear credential verification evidence while preserving the encrypted credential. Migration `0006_invalidate_agent_verification` makes the evidence fields nullable.
- Added a safe typed verifier error that maps deterministic credential/model rejection to `credential_invalid` and timeout, rate-limit, server, abort, and network failures to `provider_unavailable` for both registration and retesting.
- Added exact five-second abort configuration, concurrent enablement, and A→B→A model round-trip coverage.
- Verification: `npm run test:unit -- tests/agent` passed 55 tests; `npm test` passed typecheck, lint, 490 unit tests, and the production build.
