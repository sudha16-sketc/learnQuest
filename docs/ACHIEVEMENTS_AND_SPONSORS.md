# Achievements and Sponsored Challenges

## Achievement System
Achievements distinguish between:
- **Game Progress/XP**: Remains off-chain (routine gameplay)
- **Assessed Mastery Achievements**: Earned by meeting explicit mastery criteria (not just level completion)
- **Verifiable Credentials**: Qualifying achievements can be recorded on MST Blockchain via LearnQuestAchievements contract

### Achievement Types (Examples)
- Solidity Fundamentals Mastery
- Smart Contract Security Challenge Completed
- Rust Programming Challenge Completed
- Blockchain Development Quest Completed

### Mastery Criteria
Achievements require meeting defined criteria (assessment performance, challenge completion) - not automatic on quiz completion alone.

## Credential Lifecycle
1. User meets mastery criteria for a qualifying achievement
2. Backend validates eligibility (authorization + assessment rules)
3. If verified on-chain, achievement recorded via RECORDER_ROLE or authorized flow
4. Credential can be independently verified by checking on-chain record
5. Only minimal data on-chain (no PII, no answers, no keys)

## Sponsored Challenges
### Flow
1. Sponsor/admin publishes challenge with eligibility criteria and rewards
2. Learner attempts challenge (AI-assisted generation/hints/assessment)
3. Backend evaluates completion per explicit rules
4. Eligible participants receive achievement/reward
5. Transactions verifiable on MST explorer

### Permissions
- Only authorized admins/sponsors can create challenges
- Ordinary users cannot issue trusted credentials
- All issuances go through authorization checks

## MVP Implementation
- Admin-controlled challenge creation
- Achievement verification API
- On-chain recording for qualifying achievements via existing LearnQuestAchievements contract
