# LearnQuest Mobile — Android APK & AAB Build Guide (Expo EAS)

LearnQuest Mobile is built with React Native and Expo (SDK 51). It authenticates against the shared LearnQuest API, loads server-scored questions, tracks the same XP ledger and reward entitlements as the web app, and renders a native 3D floating-island preview. Wallet linking and on-chain claims are intentionally performed through the web wallet flow rather than simulated in the mobile app.

Both the web and mobile frontends connect to the same Express.js online API backend. The Gemini API key remains on that backend; the mobile bundle never contains it.

---

## 1. Prerequisites
Install the Expo Application Services (EAS) CLI globally:

```bash
npm install -g eas-cli
```

Log in to your Expo account:

```bash
eas login
```

Configure your project ID (first time setup):

```bash
cd apps/mobile
eas project:init
```

> No APK/AAB is produced merely by having `eas.json`. A successful build requires Expo authentication, an EAS project ID, and acceptance of any Android signing credentials.

---

## 2. Generate Installable Android APK (Direct Testing on Physical Device)

The `preview` profile in `apps/mobile/eas.json` is pre-configured with `"buildType": "apk"` to produce a standalone APK that can be directly installed on any physical Android device via USB, direct download, or sideloading.

### Command:
```bash
cd apps/mobile
eas build -p android --profile preview
```

### Alternatively, local build on your machine (requires Android SDK & Java 17):
```bash
eas build -p android --profile preview --local
```

### Installation Steps on Physical Android Phone:
1. Once the EAS build completes, download the generated `.apk` file from the provided Expo build dashboard URL.
2. Transfer or download the APK directly onto your Android device.
3. Open the file on your device and select **Install**. (If prompted, enable *"Install unknown apps"* in Android Settings).
4. Launch **LearnQuest** and experience the 3D learning adventure!

---

## 3. Generate Android App Bundle (AAB) for Google Play Store Publishing

The `production` profile in `apps/mobile/eas.json` is configured with `"buildType": "app-bundle"` to generate an optimized `.aab` file ready for upload to the Google Play Developer Console.

### Command:
```bash
cd apps/mobile
eas build -p android --profile production
```

---

## 4. EAS Configuration Reference (`apps/mobile/eas.json`)

```json
{
  "cli": {
    "version": ">= 9.0.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal",
      "android": {
        "buildType": "apk"
      },
      "env": {
        "EXPO_PUBLIC_API_BASE_URL": "https://api.learnquest.io",
        "EXPO_PUBLIC_MST_CHAIN_ID": "91562037",
        "EXPO_PUBLIC_MST_RPC_URL": "https://testnetrpc.mstblockchain.com"
      }
    },
    "production": {
      "android": {
        "buildType": "app-bundle"
      },
      "env": {
        "EXPO_PUBLIC_API_BASE_URL": "https://api.learnquest.io",
        "EXPO_PUBLIC_MST_CHAIN_ID": "91562037",
        "EXPO_PUBLIC_MST_RPC_URL": "https://testnetrpc.mstblockchain.com"
      }
    }
  }
}
```

---

## 5. Local Mobile Development Server

To run the app locally on an Android emulator or with Expo Go:

```bash
# From workspace root
EXPO_PUBLIC_API_BASE_URL=http://YOUR_LAN_IP:4000 npm run dev:mobile
```

For the Android emulator use `http://10.0.2.2:4000`. For a physical device use the computer's LAN IP; `localhost` points at the phone itself. Scan the displayed QR code with Expo Go.

The `preview` and `production` profiles in `eas.json` currently use `https://api.learnquest.io`; replace that with your deployed API URL before building. A successful Android bundle export can be checked locally with:

```bash
cd apps/mobile
EXPO_PUBLIC_API_BASE_URL=http://10.0.2.2:4000 npx expo export --platform android --output-dir /tmp/learnquest-mobile-export
```
