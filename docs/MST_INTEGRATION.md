# MST Blockchain Integration

## Network Configuration
**MST Testnet (Primary for development):**
- RPC: `https://testnetrpc.mstblockchain.com`
- Chain ID: `91562037` (0x5752035)
- Currency Symbol: `tMSTC` (18 decimals)
- Explorer: `https://testnet.mstscan.com`

**MST Mainnet:**
- RPC: `https://mariorpc.mstblockchain.com/`
- Chain ID: `4646` (0x1222)
- Currency Symbol: `MSTC` (18 decimals)
- Explorer: `https://mstscan.com`

Network configuration is centralized in `packages/shared/src/config/networks.js` and backend `apps/api/src/config/index.js`. Environment variables control which network to use.

## MST Vibe Kit
- Package: `@mstblockchain/mst-vibe-kit` (CLI scaffolder) - documented at https://docs.mstblockchain.com/developer-docs/foundation/vibe-kit
- For integration into existing project, refer to official docs. This project uses existing ethers-based integration; Vibe Kit patterns inform configuration.

## MST SDK
- Package: `@mstblockchain/mst-sdk` (v1.0.0) - provides Client/Provider/Signer abstractions built on ethers
- Can be used alongside existing ethers patterns

## Wallet Integration
- Primary: MetaMask with MST network added/switched automatically
- BridgeKey recommended by buildathon guide (to be evaluated for compatibility)
- Existing MetaMask flow preserved with network switching to MST Testnet

## Smart Contracts (Existing)
- `LearnQuestUtilityToken` (LQST) - ERC20 utility token
- `LearnQuestRewards` - EIP-712 voucher claims
- `LearnQuestGameStore` - Store purchases
- `LearnQuestAchievements` - Achievement registry (RECORDER_ROLE)

## On-Chain vs Off-Chain
**Off-chain (backend/DB):** Game progress, XP, streaks, quest completion, most gameplay, AI interactions
**On-chain:** Qualifying achievement records (via LearnQuestAchievements), reward voucher claims (via LearnQuestRewards), store purchases (via LearnQuestGameStore)

## Transaction Verification
All on-chain transactions can be verified via MST explorer using transaction hashes.
