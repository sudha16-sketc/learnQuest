import { IAIProvider } from './ai-provider.interface.js';
import { QuestionGenerationResponseSchema } from '@learnquest/validation';

export class OllamaProvider extends IAIProvider {
  constructor({ baseUrl, model, timeoutMs = 15000 }) {
    super();
    this.baseUrl = baseUrl.replace(/\/+$/, '');
    this.model = model;
    this.timeoutMs = timeoutMs;
  }

  /**
   * Sanitizes user input to prevent prompt injection.
   */
  sanitizeInput(text) {
    if (!text || typeof text !== 'string') return '';
    return text.replace(/[\r\n]+/g, ' ').slice(0, 150).trim();
  }

  async callOllama(prompt, systemPrompt) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const response = await fetch(`${this.baseUrl}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: this.model,
          prompt,
          system: systemPrompt,
          stream: false,
          format: 'json',
          options: {
            temperature: 0.3,
            num_predict: 800
          }
        }),
        signal: controller.signal
      });

      if (!response.ok) {
        throw new Error(`Ollama API responded with status ${response.status}`);
      }

      const data = await response.json();
      return JSON.parse(data.response);
    } finally {
      clearTimeout(timeoutId);
    }
  }

  async generateQuestions({ topic, difficulty = 'beginner', learningObjective = '', count = 3 }) {
    const cleanTopic = this.sanitizeInput(topic);
    const cleanObjective = this.sanitizeInput(learningObjective);

    const systemPrompt = `You are an expert interactive educational game AI.
You generate structured multiple choice questions strictly according to the specified JSON schema.
Output ONLY valid JSON matching this exact structure:
{
  "topic": "${cleanTopic}",
  "difficulty": "${difficulty}",
  "questions": [
    {
      "id": "q-1",
      "concept": "concise_concept_name",
      "type": "multiple_choice",
      "question": "clear, engaging question text?",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctOptionIndex": 0,
      "explanation": "concise explanation of why the correct option is true",
      "hint": "helpful hint without revealing the exact answer",
      "difficultyScore": 2
    }
  ]
}
DO NOT include markdown, backticks, or preamble. Options array MUST have exactly 4 strings. correctOptionIndex must be an integer between 0 and 3.`;

    const userPrompt = `Generate ${count} engaging questions on the topic "${cleanTopic}" at "${difficulty}" level.
Objective: ${cleanObjective || 'Master core concepts through interactive gaming'}.`;

    const rawJson = await this.callOllama(userPrompt, systemPrompt);

    // Validate structured output with Zod
    const validated = QuestionGenerationResponseSchema.parse(rawJson);
    return {
      ...validated,
      source: `ollama:${this.model}`
    };
  }

  async generateExplanation({ concept, chosenAnswer, correctAnswer }) {
    const cleanConcept = this.sanitizeInput(concept);
    const prompt = `A student answered a question about "${cleanConcept}".
They incorrectly selected: "${this.sanitizeInput(chosenAnswer)}".
The correct answer is: "${this.sanitizeInput(correctAnswer)}".
Explain in 2 friendly, educational sentences why their answer is incorrect and clarify the core concept. Output JSON: {"explanation": "...", "keyTakeaway": "..."}`;

    const rawJson = await this.callOllama(prompt, 'You are an encouraging educational coach. Output only valid JSON.');
    return rawJson;
  }

  async generateHint({ concept, question }) {
    const cleanConcept = this.sanitizeInput(concept);
    const cleanQuestion = this.sanitizeInput(question);
    const prompt = `Give a short 1-sentence hint for this question on "${cleanConcept}": "${cleanQuestion}". Do not give away the exact answer. Output JSON: {"hint": "..."}`;

    const rawJson = await this.callOllama(prompt, 'You are a helpful educational tutor. Output only valid JSON.');
    return rawJson;
  }

  async generateRemedialQuestion({ concept, difficulty = 'beginner' }) {
    const cleanConcept = this.sanitizeInput(concept);
    const prompt = `Create 1 alternative multiple-choice question testing the concept "${cleanConcept}" at "${difficulty}" difficulty. Output JSON matching the Question schema with fields id, concept, type, question, options (4 items), correctOptionIndex (0-3), explanation, hint, difficultyScore.`;

    const rawJson = await this.callOllama(prompt, 'You are an educational AI. Output only valid JSON.');
    return rawJson;
  }
}
