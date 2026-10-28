import { aiService } from '../services/ai/index.js';
import {
  QuestionGenerationRequestSchema,
  BossQuestionRequestSchema,
  ExplanationRequestSchema,
  HintRequestSchema,
  RemedialQuestionRequestSchema
} from '@learnquest/validation';

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

export async function generateBossQuestion(req, res, next) {
  try {
    const parse = BossQuestionRequestSchema.safeParse(req.body);
    if (!parse.success) {
      return res.status(400).json({ success: false, error: parse.error.errors[0].message });
    }

    const question = await aiService.generateBossQuestion(parse.data);
    res.json({ success: true, data: { question } });
  } catch (err) {
    next(err);
  }
}

export async function generateExplanation(req, res, next) {
  try {
    const parse = ExplanationRequestSchema.safeParse(req.body);
    if (!parse.success) {
      return res.status(400).json({ success: false, error: parse.error.errors[0].message });
    }

    const explanation = await aiService.generateExplanation(parse.data);
    res.json({ success: true, data: explanation });
  } catch (err) {
    next(err);
  }
}

export async function generateHint(req, res, next) {
  try {
    const parse = HintRequestSchema.safeParse(req.body);
    if (!parse.success) {
      return res.status(400).json({ success: false, error: parse.error.errors[0].message });
    }

    const hint = await aiService.generateHint(parse.data);
    res.json({ success: true, data: hint });
  } catch (err) {
    next(err);
  }
}

export async function generateRemedialQuestion(req, res, next) {
  try {
    const parse = RemedialQuestionRequestSchema.safeParse(req.body);
    if (!parse.success) {
      return res.status(400).json({ success: false, error: parse.error.errors[0].message });
    }

    const remedial = await aiService.generateRemedialQuestion(parse.data);
    res.json({ success: true, data: remedial });
  } catch (err) {
    next(err);
  }
}

export function getAIStatus(req, res) {
  res.json({
    success: true,
    ai: aiService.getStatus()
  });
}
