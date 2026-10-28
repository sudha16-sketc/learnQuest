# Security Considerations

## Authorization Boundaries
- Backend validates all achievement issuances
- RECORDER_ROLE on contracts controls who can record achievements
- Admin-only for sponsored challenge creation (MVP)
- Users cannot self-issue trusted credentials

## Secret Handling
- API keys (GEMINI_API_KEY), private keys (REWARD_SIGNER_PRIVATE_KEY) stay in backend .env
- Never exposed to frontend
- No wallet seed phrases stored

## Assessment Integrity
- AI-generated assessments validated with schemas
- Answer keys stored server-side
- Deterministic checks/rubrics where appropriate
- Mastery requires meeting explicit criteria

## Contract Security
- AccessControl for role-based permissions
- Anti-replay nonces in Rewards contract
- No PII or sensitive data on-chain
- Only minimal identifiers/commitments on-chain
- Tests cover authorization, duplicates, invalid cases

## On-Chain Data Minimization
- No personal information
- No assessment answers
- No API keys or secrets
- Only achievement type, timestamp, minimal metadata as needed
