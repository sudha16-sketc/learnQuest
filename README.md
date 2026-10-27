# LearnQuest 🎮 🌐
### AI-Powered 3D Learning Game + MST Blockchain + Utility Token

[![MST Blockchain](https://img.shields.io/badge/MST%20Blockchain-Testnet%20Verified-blue.svg)](https://testnet.mstscan.com)
[![OpenZeppelin](https://img.shields.io/badge/OpenZeppelin-Contracts%20v5.2-green.svg)](https://openzeppelin.com)
[![Google Gemini](https://img.shields.io/badge/AI%20Engine-Google%20Gemini-4285F4.svg)](https://ai.google.dev)
[![React Three Fiber](https://img.shields.io/badge/3D%20Rendering-Three.js%20%2B%20R3F-purple.svg)](https://docs.pmnd.rs/react-three-fiber)
[![Expo](https://img.shields.io/badge/Mobile-Expo%20SDK%2051-black.svg)](https://expo.dev)

LearnQuest transforms computer science and blockchain education into an interactive 3D adventure. Players navigate procedural floating islands, jump across moving platforms, solve AI-crafted challenges at knowledge beacons, and claim verifiable ERC-20 utility tokens (`LQST`) on the **MST Blockchain**.

---

## 🚀 Key Features

- **Playable 3D Adventure:** Controllable explorer with jump physics, collision detection, fall recovery respawns, procedural floating islands, knowledge checkpoints, and exit mastery portals.
- **Adaptive AI Engine:** Backend-only **Google Gemini** inference via `@google/genai`, strict JSON schema runtime validation, server-side answer keys, bounded retries/timeouts, and an automatic verified curated-curriculum fallback.
- **MST Blockchain Integration:** Verified EVM testnet integration (Chain ID: `91562037`, RPC: `https://testnetrpc.mstblockchain.com`) with OpenZeppelin smart contracts.
- **Dual-Token Reward Economy:** Clean separation between off-chain durable Gameplay XP and on-chain Utility Tokens (`LQST`), protected by cryptographic **EIP-712** signed reward vouchers.
- **Cosmetics & Store:** Token-priced in-game store featuring Cyber Neon Auras, Cosmic Scholar Hats, and Stardust Jump Trails that visibly render on your 3D explorer.
- **Cross-Platform:** Shared Express API backend powering both the React Web app and the Expo React Native mobile app.
- **Expo Android Build Config:** EAS profiles for `.apk` and `.aab` output. Building requires an authenticated Expo account and an EAS project ID.

---

## 🏛️ Monorepo Architecture

```
learnquest/
  apps/
    web/                  # React, Vite, Three.js, React Three Fiber, GSAP, Tailwind
    mobile/               # React Native, Expo SDK 58, Three.js R3F, EAS Build config
    api/                  # Express.js REST API, Prisma, AI Service, Voucher Signer
  packages/
    shared/               # Network configs, game states, XP economy constants
    game-core/            # Pure game state machine, physics, course generator
    contracts-client/     # Contract ABIs, EIP-712 typed voucher utilities
    validation/           # Zod schemas for auth, AI outputs, learning sessions
  contracts/              # Hardhat, Solidity 0.8.24, OpenZeppelin 5.2, Tests
  prisma/
    schema.prisma         # Normalized database models & relationships
  docs/                   # Architecture, MST Blockchain, Gemini, EAS Build guides
  docker-compose.yml      # PostgreSQL and API container definitions
  .env.example            # Environment variables template
  package.json            # Monorepo npm workspaces definition
  README.md               # Main onboarding and project overview
```

---

## 🌐 MST Blockchain Verified Network Details

*Verified on 2026-10-23 via [chainlist.org](https://chainlist.org) & [mstblockchain.com](https://mstblockchain.com)*

| Parameter | Value |
|---|---|
| **Network Name** | MST Testnet |
| **Chain ID** | `91562037` (`0x5752035`) *(Supports configurable variant `4545`)* |
| **RPC Endpoint** | `https://testnetrpc.mstblockchain.com` |
| **Currency Symbol** | `tMSTC` (18 Decimals) |
| **Block Explorer** | [https://testnet.mstscan.com](https://testnet.mstscan.com) |
| **Hardhat Target** | `evmVersion: "cancun"` |

### Smart Contracts

- **LearnQuestUtilityToken (`LQST`):** Capped supply ERC-20 utility token with role-based minting.
- **LearnQuestRewards:** EIP-712 cryptographic voucher verification contract with anti-replay nonces.
- **LearnQuestGameStore:** Safe ERC-20 store for hint packs and cosmetic accessories.
- **LearnQuestAchievements:** On-chain registry for verifiable course completion diplomas.

---

## 🛠️ Quick Start & Local Development

### 1. Clone & Install Dependencies

```bash
git clone https://github.com/sudha16-sketc/learnQuest.git
cd learnquest
cp .env.example .env
npm install
```

### 2. Run Database & Seed (Optional Docker)

```bash
# If running with Docker:
docker compose up -d postgres
npx prisma generate
npx prisma db push
npm run db:seed
```

> **Resilient Fallback:** If Docker or PostgreSQL is not started, the API automatically operates with an in-memory local data store for zero-friction standalone development and testing!

### 3. Run Smart Contract Tests

```bash
npm --workspace=@learnquest/contracts run compile
npm --workspace=@learnquest/contracts run test
```

### 4. Configure Google Gemini (Backend AI)

Create a Gemini API key at [Google AI Studio](https://aistudio.google.com/apikey) and set it in the root `.env`:

```env
AI_PROVIDER=gemini
GEMINI_API_KEY=your_google_gemini_api_key
GEMINI_MODEL=gemini-3.8-flash
```

Never place the key in a `VITE_*` or `EXPO_PUBLIC_*` variable. See [`docs/GEMINI_AI.md`](docs/GEMINI_AI.md). If no key is configured, the API automatically serves the verified curated curriculum and marks responses as degraded.

For the Android emulator, set `EXPO_PUBLIC_API_BASE_URL=http://10.0.2.2:4000`. For a physical Android device, use your computer's LAN IP instead of `localhost`.

### 5. Launch Full Stack Services

```bash
# Start Express Backend API (Port 4000)
npm run dev:api

# Start Web 3D Frontend (Port 3000)
npm run dev:web

# Start Mobile Expo App
npm run dev:mobile
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📱 Mobile Build Instructions (Expo EAS)

Detailed guide available at [`docs/MOBILE_EAS_BUILD.md`](docs/MOBILE_EAS_BUILD.md). You must run `eas login` and configure an EAS project ID before these commands can produce artifacts.

### 1. Generate Installable Android APK (Direct Physical Device Testing)

```bash
cd apps/mobile
eas build -p android --profile preview
```
Download the resulting `.apk` from the Expo dashboard and install directly onto your Android device.

### 2. Generate Android App Bundle (AAB) for Google Play Store

```bash
cd apps/mobile
eas build -p android --profile production
```

---

## 🧪 Acceptance Testing & Evidence

| Component | Test Suite | Result | Evidence |
|---|---|---|---|
| **Smart Contracts** | Hardhat Unit Tests | **PASS** | 11/11 tests passing (Token, Rewards EIP-712, Store, Achievements) |
| **API + AI Provider** | Node Test Runner | **PASS** | 30 tests passing, including auth, sessions, answer verification, idempotency, rewards, wallet linking, and mocked Gemini provider behavior |
| **Curated AI Fallback** | Node Test Runner | **PASS** | Degraded responses are labeled `curated_curriculum` with answer keys held server-side |
| **Live Gemini Inference** | Real API call | **NOT RUN** | Requires a valid `GEMINI_API_KEY`, which is not present in this environment |
| **Web Production Build** | Vite | **PASS** | `npm run build:web` succeeds (large-chunk warning only) |
| **Mobile Android Bundle** | Expo/Metro | **PASS** | `npx expo export --platform android` succeeds; native APK/AAB not built here |
| **MetaMask / On-Chain Claims** | Live wallet + MST RPC | **NOT RUN** | Requires a funded browser wallet and deployed contracts |
| **EAS APK/AAB Build** | EAS Build | **NOT RUN** | Requires Expo login, EAS project ID, and build credentials |

---

## 🔒 Security Model

- **No Secrets in Frontend:** Private keys and backend credentials reside exclusively in server `.env`.
- **EIP-712 Typed Signing:** Reward vouchers display clear recipient, amount, nonce, and reason fields in MetaMask.
- **Anti-Replay Nonces:** Nonces prevent duplicate reward vouchers from being executed twice on-chain.
- **Independent On-Chain Verification:** Store purchases and achievements are verified against live MST RPC receipts before server confirmation.
- **Rate Limiting & Helmet:** Backend API routes are rate-limited to prevent abuse.

---

## 📜 License
MIT © 2026 LearnQuest Team
