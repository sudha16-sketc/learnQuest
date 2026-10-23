import { aiService } from '../services/ai/index.js';
import { QuestionGenerationRequestSchema } from '@learnquest/validation';

export async function generateQuestions(req, res, next) {
  try {
    const parse = QuestionGenerationRequestSchema.safeParse(req.body);
    if (!parse.success) {
      return res.status(400).json({ success: false, error: parse.error.errors[0].message });
    }

    const { topic, difficulty, learningObjective, count } = parse.data;
    const result = await aiService.generateQuestions({
      topic,
      difficulty,
      learningObjective,
      count
    });

    res.json({
      success: true,
      data: result
    });
  } catch (err) {
    next(err);
  }
}

export async function generateExplanation(req, res, next) {
  try {
    const { concept, chosenAnswer, correctAnswer } = req.body;
    if (!concept || !chosenAnswer || !correctAnswer) {
      return res.status(400).json({ success: false, error: 'concept, chosenAnswer, and correctAnswer are required' });
    }

    const explanation = await aiService.generateExplanation({ concept, chosenAnswer, correctAnswer });
    res.json({ success: true, data: explanation });
  } catch (err) {
    next(err);
  }
}

export async function generateHint(req, res, next) {
  try {
    const { concept, question } = req.body;
    if (!concept || !question) {
      return res.status(400).json({ success: false, error: 'concept and question are required' });
    }

    const hint = await aiService.generateHint({ concept, question });
    res.json({ success: true, data: hint });
  } catch (err) {
    next(err);
  }
}

export async function generateRemedialQuestion(req, res, next) {
  try {
    const { concept, difficulty } = req.body;
    if (!concept) {
      return res.status(400).json({ success: false, error: 'concept is required' });
    }

    const remedial = await aiService.generateRemedialQuestion({ concept, difficulty });
    res.json({ success: true, data: remedial });
  } catch (err) {
    next(err);
  }
}
