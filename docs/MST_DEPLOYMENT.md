
## Deployed on MST Testnet (Real Deployment)

**Network:** MST Testnet (Chain ID: 91562037)  
**RPC:** https://testnetrpc.mstblockchain.com  
**Explorer:** https://testnet.mstscan.com  
**Deployer:** 0x0E370085799a51a1e437D34F5385032B2fBCeAA9  
**Deployer Balance:** 50.0 tMSTC  

### Contract Addresses
| Contract | Address | Explorer |
|----------|---------|----------|
| LearnQuestUtilityToken (LQST) | 0x51825657e00622B538B920551aE845F3f95faC95 | https://testnet.mstscan.com/address/0x51825657e00622B538B920551aE845F3f95faC95 |
| LearnQuestRewards | 0xBA1969Ff27F0e2cBD443B817f9d4c7b7d8449314 | https://testnet.mstscan.com/address/0xBA1969Ff27F0e2cBD443B817f9d4c7b7d8449314 |
| LearnQuestGameStore | 0xfF169521b09f77e7867B857511E79695C47348db | https://testnet.mstscan.com/address/0xfF169521b09f77e7867B857511E79695C47348db |
| LearnQuestAchievements | 0x14d2f7Ca4AD3725E384efD83DC0C598716b05B4C | https://testnet.mstscan.com/address/0x14d2f7Ca4AD3725E384efD83DC0C598716b05B4C |

### RECORDER_ROLE
- Granted to deployer (0x0E370085799a51a1e437D34F5385032B2fBCeAA9) on LearnQuestAchievements
- Verified via `hasRole(RECORDER_ROLE, deployer)` = true

### Achievement Transaction (Real)
- **Student:** 0x0E370085799a51a1e437D34F5385032B2fBCeAA9
- **Achievement:** SOLIDITY_FUNDAMENTALS_MASTERY "Solidity Fundamentals Mastery" (score 90)
- **Tx Hash:** 0x5f1fe81812b7a16062222b8965e2548c6af4abb85e00343156b70ff15b382dfa
- **Block:** 6645647
- **Status:** Success (1)
- **Explorer:** https://testnet.mstscan.com/tx/0x5f1fe81812b7a16062222b8965e2548c6af4abb85e00343156b70ff15b382dfa
- **Verified:** `getAchievement` returns exists=true, title="Solidity Fundamentals Mastery", score=90
