import * as achievementService from '../services/achievements/achievementService.js';
import { getDb } from '../db/index.js';

export async function getAvailableAchievements(req, res, next) {
  try {
    const achievements = achievementService.getAvailableAchievements();
    res.json({ success: true, achievements });
  } catch (err) {
    next(err);
  }
}

export async function getMyAchievements(req, res, next) {
  try {
    const userId = req.user.id;
    const achievements = await achievementService.getUserAchievements(userId);
    res.json({ success: true, achievements });
  } catch (err) {
    next(err);
  }
}

export async function checkEligibility(req, res, next) {
  try {
    const userId = req.user.id;
    const { achievementType, assessmentData } = req.body;
    const result = await achievementService.checkMasteryEligibility(userId, achievementType, assessmentData || {});
    res.json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
}

export async function issueAchievement(req, res, next) {
  try {
    const userId = req.user.id;
    const { achievementType, assessmentData, transactionHash } = req.body;
    
    if (!achievementType) {
      return res.status(400).json({ success: false, error: 'achievementType is required' });
    }

    const achievement = await achievementService.issueAchievement(
      userId,
      achievementType,
      assessmentData || {},
      { transactionHash }
    );

    res.json({ success: true, achievement });
  } catch (err) {
    next(err);
  }
}

export async function verifyAchievement(req, res, next) {
  try {
    const { achievementType, studentAddress, transactionHash } = req.body;
    const result = await achievementService.verifyAchievementOnChain(achievementType, studentAddress, transactionHash);
    res.json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
}
