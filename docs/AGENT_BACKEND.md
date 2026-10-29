# Provider-independent agent backend

The files in `lib/ai/` provide the first backend components for the eventual private job-search application.

- `providers.js` exposes `generateText({prompt, system, provider, model, maxOutputTokens})`. It supports OpenAI Responses and Anthropic Messages through a shared interface. Choose with `AI_PROVIDER=openai` or `AI_PROVIDER=anthropic`.
- `score.js` exposes `evaluateJob({job, applicantProfile})`, an initial structured, validated **heuristic fit** evaluation for already verified postings.
- The implementation is **server-side only**. Neither module is loaded by the static demo dashboard.
- This is **not** a production-ready agent. Discovery, auth, Google Sheets OAuth, browser API routes, hard filters, retries, budget limits, persistence, tailoring, and scheduler remain future work.
- Do **not** deploy a public endpoint wrapping `generateText` until authentication, authorization, quotas and rate limits are implemented.
- Never put actual applicant information or credentials into public repository files.

## Local tests

Run `npm test` (Node 18+). Tests use mocked requests: they do not call providers or spend tokens.

## Production secret variables (not needed for tests)

`AI_PROVIDER`: `openai` or `anthropic`; defaults to `openai`.

`AI_MODEL`: optional provider-specific model name. Must be compatible with the selected provider.

`OPENAI_API_KEY`: required for OpenAI requests.

`ANTHROPIC_API_KEY`: required for Anthropic requests.

Keep these in a server-side environment-variable store, never in the browser or git.
