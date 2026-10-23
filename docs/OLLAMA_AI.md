# AI Learning Engine & Ollama Setup — LearnQuest

## Overview
LearnQuest features an adaptive AI learning engine responsible for:
1. Batch generation of structured 3D level questions based on selected topics and difficulty tiers.
2. Generating diagnostic feedback and friendly explanations when an answer is incorrect.
3. Supplying intelligent hints without revealing the full answer.
4. Offering alternative remedial questions for mastery retries.

---

## 1. Local Development with Ollama

### Step 1: Install Ollama
Download and install Ollama from [https://ollama.com](https://ollama.com).

### Step 2: Pull the Recommended Lightweight Model
LearnQuest defaults to `qwen2.5:3b`, a fast, capable local model that excels at structured JSON generation:

```bash
ollama pull qwen2.5:3b
```

Other compatible small models: `llama3.2:3b`, `mistral:7b`, `phi3:mini`.

### Step 3: Run the Ollama Service
Ensure the Ollama daemon is running:

```bash
ollama serve
```
By default, it listens on `http://localhost:11434`.

---

## 2. Server Configuration (`.env`)

Configure the connection in your root `.env`:

```env
AI_PROVIDER=ollama
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=qwen2.5:3b
AI_TIMEOUT_MS=15000
```

> **Note:** Never hardcode `localhost` URLs in production. The backend reads all URLs through environment variables.

---

## 3. Strict Schema Validation & Security

1. **Structured Output Format:**
   Ollama is invoked with `format: "json"`.
2. **Runtime Schema Enforcement:**
   All model outputs are parsed and strictly validated against `QuestionGenerationResponseSchema` using Zod. Any malformed response, missing field, or invalid answer index is automatically rejected.
3. **Anti-Prompt-Injection:**
   User-provided topics and inputs are sanitized, line-breaks stripped, and length-capped to prevent prompt overriding.
4. **Resilient Curated Fallback:**
   If Ollama is unreachable, timing out, or the local model is downloading, the AI Service transparently engages the curated verified blockchain curriculum, accurately attributing the question source and maintaining 100% platform uptime.

---

## 4. Adding a Hosted Inference Provider

The application follows the Provider Pattern (`IAIProvider`). To add a cloud-hosted provider (such as Google Gemini, OpenAI, or Anthropic Claude):

1. Create `apps/api/src/services/ai/hosted-provider.js` implementing the four interface methods:
   - `generateQuestions({ topic, difficulty, count })`
   - `generateExplanation({ concept, chosenAnswer, correctAnswer })`
   - `generateHint({ concept, question })`
   - `generateRemedialQuestion({ concept, difficulty })`
2. Register the provider in `apps/api/src/services/ai/index.js`.
3. Set `AI_PROVIDER=hosted` in `.env`.
No game code, state machines, or frontend components need to be modified.
