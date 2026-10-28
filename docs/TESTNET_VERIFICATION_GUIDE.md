# MST Testnet Verification Guide

## Prerequisites
1. Get tMSTC from MST faucet (https://faucet.mstblockchain.com or official sources)
2. Have a wallet with private key for deployment/recording
3. Configure environment variables

## Environment Setup
Add to `.env`:
```bash
MST_NETWORK_NAME=MST Testnet
MST_CHAIN_ID=91562037
MST_RPC_URL=https://testnetrpc.mstblockchain.com
MST_EXPLORER_URL=https://testnet.mstscan.com
MST_CURRENCY_SYMBOL=tMSTC
REWARD_SIGNER_PRIVATE_KEY=<your-private-key>
MST_ACHIEVEMENTS_ADDRESS=<deployed-address>
ACHIEVEMENT_STUDENT_ADDRESS=<student-wallet-address>
```

## Deploy Contracts
```bash
cd contracts
npm run compile
npm run deploy:mst
```
Save the deployed addresses from output.

## Issue Achievement (Requires RECORDER_ROLE)
```bash
cd contracts
MST_ACHIEVEMENTS_ADDRESS=0x... ACHIEVEMENT_STUDENT_ADDRESS=0x... npm run issue:achievement
```

## Verify Achievement On-Chain
```bash
cd contracts
MST_ACHIEVEMENTS_ADDRESS=0x... ACHIEVEMENT_STUDENT_ADDRESS=0x... npm run verify:achievement
```

## Verify on Explorer
Open `https://testnet.mstscan.com/tx/<TX_HASH>` to verify transaction.

## Current Status
- Contract code: Ready (LearnQuestAchievements with RECORDER_ROLE)
- Tests: 11/11 passing
- Deployment to mstTestnet: BLOCKED - insufficient funds in deployer wallet (0 balance)
- Real transaction: NOT PERFORMED (no funds/authorization)
- Vibe Kit: Installed as CLI package (@mstblockchain/mst-vibe-kit@0.1.1) - scaffolding tool, not runtime import
- SDK: Installed (@mstblockchain/mst-sdk@1.0.0)
