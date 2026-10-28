import { getDb } from '../../db/index.js';

const challenges = new Map();

export function createChallenge(adminUserId, challengeData) {
  const challenge = {
    id: `challenge-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    sponsorId: challengeData.sponsorId || adminUserId,
    title: challengeData.title,
    description: challengeData.description,
    type: challengeData.type || 'skill-challenge',
    difficulty: challengeData.difficulty || 'intermediate',
    eligibilityCriteria: challengeData.eligibilityCriteria || {},
    rewards: challengeData.rewards || { xp: 100, tokens: '10', achievementType: null },
    status: 'active',
    startDate: challengeData.startDate || new Date(),
    endDate: challengeData.endDate || null,
    createdBy: adminUserId,
    createdAt: new Date()
  };
  challenges.set(challenge.id, challenge);
  return challenge;
}

export function getChallenges(filters = {}) {
  let result = Array.from(challenges.values());
  if (filters.status) {
    result = result.filter(c => c.status === filters.status);
  }
  if (filters.type) {
    result = result.filter(c => c.type === filters.type);
  }
  result.sort((a, b) => b.createdAt - a.createdAt);
  return result;
}

export function getChallenge(challengeId) {
  return challenges.get(challengeId) || null;
}

export function checkEligibility(userId, challengeId, userData = {}) {
  const challenge = challenges.get(challengeId);
  if (!challenge) {
    return { eligible: false, reason: 'Challenge not found' };
  }
  if (challenge.status !== 'active') {
    return { eligible: false, reason: 'Challenge not active' };
  }

  const criteria = challenge.eligibilityCriteria;
  if (criteria.minLevel && (userData.level || 0) < criteria.minLevel) {
    return { eligible: false, reason: `Minimum level ${criteria.minLevel} required` };
  }
  if (criteria.requiredTopic && userData.topic !== criteria.requiredTopic) {
    return { eligible: false, reason: `Topic ${criteria.requiredTopic} required` };
  }

  return { eligible: true, challenge };
}

const submissions = new Map();

export function submitChallenge(userId, challengeId, submissionData) {
  const eligibility = checkEligibility(userId, challengeId, submissionData.userData || {});
  if (!eligibility.eligible) {
    throw new Error(eligibility.reason);
  }

  const submission = {
    id: `sub-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    challengeId,
    userId,
    submissionData,
    status: 'pending',
    submittedAt: new Date()
  };
  submissions.set(submission.id, submission);
  return submission;
}

export function evaluateSubmission(submissionId, evaluatorId, evaluation) {
  const submission = submissions.get(submissionId);
  if (!submission) {
    throw new Error('Submission not found');
  }

  submission.status = evaluation.approved ? 'approved' : 'rejected';
  submission.evaluatedBy = evaluatorId;
  submission.evaluatedAt = new Date();
  submission.evaluation = evaluation;
  submissions.set(submissionId, submission);
  return submission;
}

export function getSubmissions(filters = {}) {
  let result = Array.from(submissions.values());
  if (filters.challengeId) {
    result = result.filter(s => s.challengeId === filters.challengeId);
  }
  if (filters.userId) {
    result = result.filter(s => s.userId === filters.userId);
  }
  if (filters.status) {
    result = result.filter(s => s.status === filters.status);
  }
  result.sort((a, b) => b.submittedAt - a.submittedAt);
  return result;
}
