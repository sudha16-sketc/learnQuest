import { z } from 'zod';

export const RegisterSchema = z.object({
  email: z.string().email('Valid email is required'),
  username: z.string().min(3, 'Username must be at least 3 characters').max(30),
  password: z.string().min(6, 'Password must be at least 6 characters')
});

export const LoginSchema = z.object({
  login: z.string().min(1, 'Email or username is required'),
  password: z.string().min(1, 'Password is required')
});

export const WalletLinkChallengeSchema = z.object({
  address: z.string().regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid EVM wallet address'),
  chainId: z.number().int().positive()
});

export const WalletLinkVerifySchema = z.object({
  address: z.string().regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid EVM wallet address'),
  signature: z.string().min(10, 'Signature is required'),
  challenge: z.string().min(10, 'Challenge string is required')
});

export const QuestionGenerationRequestSchema = z.object({
  topic: z.string().min(2),
  difficulty: z.enum(['beginner', 'intermediate', 'advanced']),
  learningObjective: z.string().optional(),
  count: z.number().int().min(1).max(10).default(3)
});

export const QuestionItemSchema = z.object({
  id: z.string(),
  concept: z.string(),
  type: z.literal('multiple_choice').default('multiple_choice'),
  question: z.string().min(5),
  options: z.array(z.string().min(1)).length(4, 'Must have exactly 4 options'),
  correctOptionIndex: z.number().int().min(0).max(3),
  explanation: z.string().min(5),
  hint: z.string().min(3),
  difficultyScore: z.number().min(1).max(10).default(1)
});

export const QuestionGenerationResponseSchema = z.object({
  topic: z.string(),
  difficulty: z.string(),
  questions: z.array(QuestionItemSchema).min(1)
});

export const AnswerSubmissionSchema = z.object({
  questionId: z.string().min(1),
  concept: z.string().min(1),
  chosenOption: z.number().int().min(0).max(3),
  hintsUsed: z.number().int().min(0).default(0),
  timeSpentMs: z.number().int().min(0).default(0),
  idempotencyKey: z.string().min(8)
});

export const ClaimVoucherRequestSchema = z.object({
  entitlementId: z.string().uuid()
});

export const StoreQuoteRequestSchema = z.object({
  sku: z.string().min(1)
});

export const StorePurchaseConfirmSchema = z.object({
  sku: z.string().min(1),
  transactionHash: z.string().regex(/^0x[a-fA-F0-9]{64}$/, 'Invalid transaction hash')
});

export const AchievementConfirmSchema = z.object({
  achievementType: z.string().min(1),
  transactionHash: z.string().regex(/^0x[a-fA-F0-9]{64}$/, 'Invalid transaction hash')
});
