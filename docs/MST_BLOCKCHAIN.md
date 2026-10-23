# MST Blockchain Integration Guide — LearnQuest

## Verified Network Parameters
All parameters verified on **2026-10-23** via [chainlist.org](https://chainlist.org) and [mstblockchain.com](https://mstblockchain.com).

### MST Testnet (Primary Target)
- **Network Name:** `MST Testnet`
- **Chain ID:** `91562037` (Configurable in `.env` via `MST_CHAIN_ID`, supports `4545` variant)
- **Chain ID Hex:** `0x5752035`
- **RPC URL:** `https://testnetrpc.mstblockchain.com`
- **WebSocket RPC:** `wss://testnetrpc.mstblockchain.com`
- **Currency Symbol:** `tMSTC`
- **Decimals:** `18`
- **Block Explorer:** [https://testnet.mstscan.com](https://testnet.mstscan.com)
- **Faucet:** Accessible via the developer portal at [https://mstblockchain.com](https://mstblockchain.com)

### MST Mainnet (Production Reference)
- **Network Name:** `MST Mainnet`
- **Chain ID:** `4646` (`0x1226`)
- **RPC URL:** `https://mariorpc.mstblockchain.com` or `https://craftrpc.mstblockchain.com`
- **Currency Symbol:** `MSTC`
- **Block Explorer:** [https://mstscan.com](https://mstscan.com)

---

## Deployed Smart Contracts

| Contract | Purpose | Standard / Pattern |
|---|---|---|
| **LearnQuestUtilityToken (`LQST`)** | In-game utility token | ERC-20, Capped Supply (100M), Role-based Minting |
| **LearnQuestRewards** | Claim reward tokens with EIP-712 signed vouchers | EIP-712, ECDSA, Anti-Replay Nonces, Expiry |
| **LearnQuestGameStore** | Purchase hint packs and cosmetics with LQST | SafeERC20, ReentrancyGuard, Price Validation |
| **LearnQuestAchievements** | Record course completions and credentials | Soulbound Educational Credential Registry |

---

## MetaMask Configuration

Users can automatically connect and add MST Testnet using the in-game **Connect** button or manually add:
- Network Name: `MST Testnet`
- New RPC URL: `https://testnetrpc.mstblockchain.com`
- Chain ID: `91562037`
- Currency Symbol: `tMSTC`
- Block Explorer URL: `https://testnet.mstscan.com`

---

## EIP-712 Cryptographic Reward Flow

```mermaid
sequenceDiagram
    autonumber
    actor Player
    participant Game as 3D Web/Mobile Game
    participant API as LearnQuest Backend
    participant Contract as LearnQuestRewards (MST)
    participant Token as LQST Token Contract

    Player->>Game: Solves Checkpoint / Completes Level
    Game->>API: POST /api/learning/sessions/:id/answers (with Idempotency Key)
    API->>API: Validates answer, credits XP ledger, creates Entitlement
    Player->>Game: Clicks "Claim Tokens on MST"
    Game->>API: POST /api/rewards/claim-voucher
    API->>API: Signs EIP-712 Voucher using Server Private Key
    API-->>Game: Returns { voucher, signature, nonce, expiry }
    Game->>Contract: claimReward(user, amount, nonce, expiry, reason, signature)
    Contract->>Contract: Verifies EIP-712 digest == signerAddress & !isNonceUsed
    Contract->>Token: mint(user, amount)
    Token-->>Player: Credits LQST tokens to player wallet
    Contract-->>Game: Emits RewardClaimed event
```
