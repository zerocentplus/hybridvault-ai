# 🔐 HybridVault AI

**Hybrid AI Document & Note Studio**
*Google #BuildHybridAI 2026 Hackathon — Web / Chrome category*

[![Firebase AI Logic](https://img.shields.io/badge/Firebase_AI_Logic-11.10.0-orange)](https://firebase.google.com/docs/ai-logic)
[![Gemini 2.5 Flash](https://img.shields.io/badge/Gemini-2.5_Flash-blue)](https://ai.google.dev/)
[![License](https://img.shields.io/badge/License-Apache_2.0-green)](LICENSE)
[![Build](https://img.shields.io/badge/Build-Zero_Step-purple)](https://pages.github.com/)

---

## Overview

HybridVault AI is a privacy-first document and note studio that routes AI inference dynamically between **on-device Gemini Nano** (Chrome Built-in AI) and **Cloud Gemini 2.5 Flash** (Firebase AI Logic) based on content sensitivity, user preference, and hardware capability. It runs entirely from static files — no build step, no bundler, no server.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                        HybridVault AI                               │
│                   Firebase AI Logic SDK 11.10.0                     │
│                   Pure HTML5 / CSS3 / ES Modules                    │
└──────────────────────────┬──────────────────────────────────────────┘
                           │
               ┌───────────▼───────────┐
               │      Hybrid Router     │
               │   InferenceMode enum  │
               │   Firebase AI Logic   │
               └────┬──────────────────┘
                    │
        ┌───────────┴────────────┐
        │                        │
        ▼                        ▼
┌───────────────────┐   ┌────────────────────────┐
│   ON-DEVICE        │   │   CLOUD                │
│   Gemini Nano      │   │   Gemini 2.5 Flash     │
│   Chrome Built-in  │   │   Firebase AI Logic    │
│   Zero network     │   │   App Check verified   │
│   Max privacy      │   │   Complex reasoning    │
└───────────────────┘   └────────────────────────┘
         │                        │
         └───────────┬────────────┘
                     ▼
         response.inferenceSource
         → Live telemetry badge (header)
```

### Key Components

| Component | Description |
|-----------|-------------|
| **InferenceRouter** | Maps UI mode selector → Firebase `InferenceMode` enum, with auto-fallback |
| **DocumentVault** | `localStorage`-backed JSON vault, 800ms debounce auto-save |
| **TelemetryCollector** | Session-local tracking of source, latency, char counts |
| **SensitivityAnalyzer** | Keyword heuristic flags HIGH / MEDIUM / LOW sensitivity content |
| **App Check** | `CustomProvider` with debug token for hackathon judges & CI/CD |

---

## Features

### Hybrid AI Routing
- **Auto Hybrid (Prefer On-Device)** — `InferenceMode.PREFER_ON_DEVICE`: tries Gemini Nano first, falls back to cloud
- **Strict On-Device** — `InferenceMode.ONLY_ON_DEVICE`: Gemini Nano, zero network calls
- **Cloud Deep Reasoning** — `InferenceMode.PREFER_IN_CLOUD`: Gemini 2.5 Flash for complex tasks
- **Cloud Only** — `InferenceMode.ONLY_IN_CLOUD`: always cloud, maximum capability

### Live Telemetry Header
- Active inference source badge: **ON-DEVICE GEMINI NANO** vs **CLOUD GEMINI 2.5 FLASH**
- Last inference latency (ms)
- Response character count
- Firebase App Check verification status

### Document Vault
- 4 pre-loaded realistic sample documents:
  - 📁 Confidential M&A Memo (legal/financial)
  - 🧬 Medical Research Field Notes (clinical trial)
  - ⚙️ Product Architecture Spec (technical)
  - 🌐 Multilingual Customer Feedback (6 languages)
- **+ New Note** creates blank documents
- Full-text search across title and content
- Auto-save with save-state indicator
- Privacy sensitivity indicator (HIGH / MEDIUM / LOW)

### AI Actions (Right Panel)
| Action | Default Mode | Description |
|--------|-------------|-------------|
| 🔒 Private Local Summary | `PREFER_ON_DEVICE` | 4–6 bullet summary, zero-cloud |
| 📋 Extract Action Items (JSON) | Hybrid | Structured JSON task list |
| ☁️ Deep Cloud Synthesis | `PREFER_IN_CLOUD` | Full executive analysis |
| 🌐 Translate & Tone Polish | Hybrid | Language detection + professional rewrite |
| ✦ Custom Prompt | Per global selector | Free-form document question |

### Diagnostics Modal (🔬 button)
- Firebase SDK version, app initialization, App Check status
- Chrome `window.ai` and `LanguageModel` API detection
- Gemini Nano hardware availability check
- Session telemetry: total inferences, on-device vs cloud split, average latency
- Live hybrid architecture diagram

---

## Running Locally

No build step required. Serve the directory with any static file server:

```bash
# Python 3
python -m http.server 8080

# Node.js (npx)
npx serve .

# VS Code
# Install "Live Server" extension → right-click index.html → Open with Live Server
```

Then open `http://localhost:8080` in Chrome.

> **Note:** Opening `index.html` directly as a `file://` URL will block ES module imports due to CORS restrictions. Use a local server.

---

## Enabling On-Device Gemini Nano (Chrome)

For the `ONLY_ON_DEVICE` / `PREFER_ON_DEVICE` modes to run inference locally:

1. Use **Chrome 127+** (Chrome Canary recommended for latest APIs)
2. Navigate to `chrome://flags`
3. Enable: **Prompt API for Gemini Nano** (`#prompt-api-for-gemini-nano`)
4. Enable: **Optimization Guide On Device Model** (`#optimization-guide-on-device-model`)
5. Relaunch Chrome
6. Wait for the Gemini Nano model to download (check `chrome://components` → "Optimization Guide On Device Model")

Without these flags, `PREFER_ON_DEVICE` automatically falls back to Cloud Gemini 2.5 Flash.

---

## Deploying to Firebase Hosting / GitHub Pages

### Firebase Hosting
```bash
npm install -g firebase-tools
firebase login
firebase init hosting   # public directory = "." (or current folder)
firebase deploy
```

### GitHub Pages
1. Push all files to a GitHub repository
2. Go to **Settings → Pages**
3. Set source to **Deploy from a branch → main / (root)**
4. Your app is live at `https://<username>.github.io/<repo>/`

---

## Firebase Configuration

The app uses the following Firebase project:

```js
const firebaseConfig = {
  apiKey:            "AIzaSyC8v8yw6X69mcunOsm-S90TAOhhuh07zEE",
  authDomain:        "hybridvault-ai.firebaseapp.com",
  projectId:         "hybridvault-ai",
  storageBucket:     "hybridvault-ai.firebasestorage.app",
  messagingSenderId: "1078494999071",
  appId:             "1:1078494999071:web:146645630d3715f9615b2a",
  measurementId:     "G-X342ERBS2C"
};
```

### App Check

App Check is initialized with a `CustomProvider` using a debug token:

```js
self.FIREBASE_APPCHECK_DEBUG_TOKEN = "11111111-2222-4333-8444-555555555555";
```

This token must be registered in the Firebase console under
**App Check → Apps → [your app] → Debug tokens** to allow requests from development and judge preview environments.

For production, replace `CustomProvider` with `ReCaptchaEnterpriseProvider` and your reCAPTCHA Enterprise site key.

---

## Project Structure

```
hybridvault-ai/
├── index.html      # App shell, HTML structure, diagnostics modal
├── styles.css      # Dark-mode design system (CSS custom properties)
├── app.js          # Firebase init, hybrid AI engine, vault, UI logic
├── README.md       # This file
└── LICENSE         # Apache-2.0
```

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Runtime | Pure Vanilla ES Modules (no bundler) |
| AI SDK | Firebase AI Logic 11.10.0 (gstatic CDN) |
| On-Device AI | Chrome Built-in AI / Gemini Nano |
| Cloud AI | Gemini 2.5 Flash via Google AI Backend |
| App Security | Firebase App Check (CustomProvider + debug token) |
| Storage | Browser `localStorage` |
| Hosting | Firebase Hosting / GitHub Pages |
| Fonts | Google Fonts (Inter + JetBrains Mono) |

---

## License

Apache License 2.0 — see [LICENSE](LICENSE)

---

## Hackathon Submission

- **Contest:** Google #BuildHybridAI 2026
- **Category:** Web / Chrome
- **Core APIs used:** `firebase-ai.js` · `firebase-app-check.js` · `InferenceMode` · `GoogleAIBackend` · `getGenerativeModel` · `window.ai` / `LanguageModel`
