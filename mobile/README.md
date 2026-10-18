# Shyraq Mobile

Expo + React Native + TypeScript native client for Shyraq. The web app remains in the repository root; this is a separate application under `mobile/`.

## Current implementation stage

- Native login screen calls `POST /api/auth/login` with `client: "native"`.
- The mobile API wrapper sends Supabase access tokens as `Authorization: Bearer ...`.
- The overview screen calls `GET /api/student/overview`.
- Supabase access/refresh tokens are persisted using Expo SecureStore; non-token auth metadata is kept in AsyncStorage.
- The first backend Bearer-auth integration is intentionally limited to the student overview endpoint.
- Tasks, reports, rankings, full lesson/test flows, registration deep links and password recovery remain later milestones.

**Important:** the mobile auth contract is introduced on branch `mobile/ios-starter` in the companion draft pull request. It is not merged into `main` and is not deployed to production yet. Do not expect native login to work against production until the backend change is reviewed, merged, and deliberately deployed.

## Requirements

- Node.js 22.13 or newer.
- npm.
- An Expo account for EAS cloud builds.
- iOS Simulator requires macOS and Xcode. Windows development can use Expo Go on a physical iPhone for the SDK version supported by Expo Go; EAS can build iOS binaries in the cloud.

## Local setup

1. From this directory, copy `.env.example` to `.env`.
2. Set `EXPO_PUBLIC_API_BASE_URL`, `EXPO_PUBLIC_SUPABASE_URL` and the Supabase **publishable** key.
3. Install dependencies with `npm install`.
4. Run `npx expo install --check` and `npm run typecheck`.
5. Start Metro with `npm start`, then scan the QR code with Expo Go if its bundled SDK matches this project's SDK.

Do not put `SUPABASE_SECRET_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, Google credentials, Kinescope API tokens or encryption keys into `EXPO_PUBLIC_*` variables. Anything prefixed with `EXPO_PUBLIC_` is bundled into the native app.

## Build profiles

`eas.json` contains development, internal preview and App Store production profiles. Before producing signed builds, initialize the project under the correct Expo account and confirm the final iOS bundle identifier.

## Brand

- Warm background: `#FAF9F7`
- Primary text: `#172235`
- Shyraq orange: `#FF8000`
- Secondary accent: `#C25100`

## Before TestFlight/App Store

- Implement native email confirmation and password-recovery deep links.
- Complete all student screens and API routes.
- Verify the Kinescope React Native player and server-enforced 85% test gate on a real iPhone.
- Add account deletion and a public privacy policy.
- Test each allowed and denied role/data access path.
- Commit and review the generated `package-lock.json` after running npm install on a network-enabled development machine.
