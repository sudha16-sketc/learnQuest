import * as sponsorService from '../services/sponsors/sponsorService.js';

export async function createChallenge(req, res, next) {
  try {
    const adminUserId = req.user.id;
    const { title, description, type, difficulty, eligibilityCriteria, rewards, startDate, endDate, sponsorId } = req.body;

    if (!title || !description) {
      return res.status(400).json({ success: false, error: 'title and description are required' });
    }

    const challenge = sponsorService.createChallenge(adminUserId, {
      title,
      description,
      type,
      difficulty,
      eligibilityCriteria,
      rewards,
      startDate,
      endDate,
      sponsorId
    });

    res.json({ success: true, challenge });
  } catch (err) {
    next(err);
  }
}

export async function getChallenges(req, res, next) {
  try {
    const { status, type } = req.query;
    const challenges = sponsorService.getChallenges({ status, type });
    res.json({ success: true, challenges });
  } catch (err) {
    next(err);
  }
}

export async function getChallenge(req, res, next) {
  try {
    const { id } = req.params;
    const challenge = sponsorService.getChallenge(id);
    if (!challenge) {
      return res.status(404).json({ success: false, error: 'Challenge not found' });
    }
    res.json({ success: true, challenge });
  } catch (err) {
    next(err);
  }
}

export async function checkChallengeEligibility(req, res, next) {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const userData = req.body || {};
    const result = sponsorService.checkEligibility(userId, id, userData);
    res.json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
}

export async function submitChallenge(req, res, next) {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const submissionData = req.body || {};
    const submission = sponsorService.submitChallenge(userId, id, submissionData);
    res.json({ success: true, submission });
  } catch (err) {
    next(err);
  }
}

export async function getSubmissions(req, res, next) {
  try {
    const { challengeId, userId, status } = req.query;
    const submissions = sponsorService.getSubmissions({ challengeId, userId, status });
    res.json({ success: true, submissions });
  } catch (err) {
    next(err);
  }
}

export async function evaluateSubmission(req, res, next) {
  try {
    const evaluatorId = req.user.id;
    const { submissionId } = req.params;
    const evaluation = req.body || {};
    const submission = sponsorService.evaluateSubmission(submissionId, evaluatorId, evaluation);
    res.json({ success: true, submission });
  } catch (err) {
    next(err);
  }
}
