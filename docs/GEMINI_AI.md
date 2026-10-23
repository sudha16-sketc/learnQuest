# Google Gemini AI Setup - LearnQuest

## Overview

The LearnQuest backend uses Google Gemini through the official `@google/genai` SDK for:

1. Structured question-batch generation for each topic and difficulty.
2. Diagnostic explanations after incorrect answers.
3. Progressive hints that do not reveal the answer.
4. Remedial questions for mastery retries.

The Gemini API key is read only by the Express API. It is never sent to the web bundle or the Expo mobile app. All AI routes are protected by JWT authentication.

## 1. Create a Gemini API Key

Create a key at [Google AI Studio](https://aistudio.google.com/apikey), then add it to the root `.env` file:

```env
AI_PROVIDER=gemini
GEMINI_API_KEY=your_google_gemini_api_key
GEMINI_MODEL=gemini-3.8-flash
AI_TIMEOUT_MS=20000
AI_MAX_RETRIES=2
AI_CACHE_TTL_MS=600000
AI_CACHE_MAX_ENTRIES=200
```

`gemini-3.8-flash` is the default. You can also select another model available to your API key, such as `gemini-3.5-flash-lite`.

To run without any external AI call, set `AI_PROVIDER=curated`. This serves the verified local curriculum directly.

## 2. Run the API

```bash
npm run dev:api
```

Startup logs show whether Gemini is configured. They never print the API key. You can also inspect the authenticated status endpoint:

```bash
curl -H "Authorization: Bearer $TOKEN" http://localhost:4000/api/ai/status
```

## 3. Runtime Safety

- The provider uses Gemini JSON schema output and Zod validation.
- Questions are validated before they are returned to clients.
- Correct answer indexes stay in a server-side registry and are stripped from public question responses.
- The API applies bounded retries for transient failures, plus request timeouts.
- Authentication and validation errors are not retried.
- If Gemini is unavailable, the service returns the curated curriculum with `source: "curated_curriculum"` and `degraded: true`.
- Generated question IDs are rewritten to unique server-side IDs so answer verification cannot be spoofed by clients.

## 4. Tests

Gemini provider tests use an injected fake client and never call the network:

```bash
npm run test:api
```

A live Gemini smoke test requires a real `GEMINI_API_KEY`, which is not stored in this repository.

## 5. Provider Pattern

`GeminiProvider` implements `IAIProvider` in `apps/api/src/services/ai/gemini-provider.js`. `AIService` in `apps/api/src/services/ai/index.js` owns caching, fallback, and the answer registry. Adding another provider requires implementing the same four methods and wiring it into `AIService`; no game or frontend code needs to change.
