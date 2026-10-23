/**
 * AI Provider Interface
 * All AI providers (Gemini, curated fallback, or future hosted providers) must implement this contract.
 */

export class IAIProvider {
  /**
   * Generates a batch of structured learning questions.
   * @param {Object} params
   * @param {string} params.topic
   * @param {string} params.difficulty
   * @param {string} [params.learningObjective]
   * @param {number} [params.count]
   * @returns {Promise<{ topic: string, difficulty: string, questions: Array }>}
   */
  async generateQuestions(params) {
    throw new Error('generateQuestions() must be implemented');
  }

  /**
   * Generates a detailed educational explanation for a mistake.
   * @param {Object} params
   * @param {string} params.concept
   * @param {string} params.chosenAnswer
   * @param {string} params.correctAnswer
   * @returns {Promise<{ explanation: string, keyTakeaway: string }>}
   */
  async generateExplanation(params) {
    throw new Error('generateExplanation() must be implemented');
  }

  /**
   * Generates a helpful hint without giving away the full answer.
   * @param {Object} params
   * @param {string} params.concept
   * @param {string} params.question
   * @returns {Promise<{ hint: string }>}
   */
  async generateHint(params) {
    throw new Error('generateHint() must be implemented');
  }

  /**
   * Generates an alternative remedial question testing the same concept after failure.
   * @param {Object} params
   * @param {string} params.concept
   * @param {string} params.difficulty
   * @returns {Promise<Object>}
   */
  async generateRemedialQuestion(params) {
    throw new Error('generateRemedialQuestion() must be implemented');
  }
}
