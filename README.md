# 면접관 — VR Interview Trainer

A WebXR / three.js single-page VR app that simulates a **strict Korean job interview** on Meta Quest 2 (and desktop Chrome). Built for **Task 3-2 "Meta Quest 2 VR-Based Physical AI Agent"**, Gyeongsang National University Glocal Project.

The AI interviewer judges you the Korean way — on three axes at once:

1. **Answer content (내용)** — what you say
2. **Body language (태도·시선)** — eye contact, fidgeting, greeting bow
3. **Appearance / attire (복장)** — hair and outfit vs. the norms of your target industry

## Five core functions

| # | Function | How it works |
|---|----------|--------------|
| F1 | Avatar dressing + AI attire evaluation | Pick hair (검정/갈색/금발/파랑), outfit (정장/캐주얼/트레이닝), target industry (대기업/스타트업/공기업); attire is scored by a deterministic rubric (mock) or a gpt-4o vision call on an avatar screenshot (live) |
| F2 | Korean voice Q&A loop | STT (whisper-1, ko) → LLM evaluation → TTS interviewer voice (tts-1, nova); offline fallback: canned transcripts + Korean `speechSynthesis` |
| F3 | Adaptive follow-up questions | Each of the 3 fixed questions (자기소개, 지원동기, 장단점) is followed by exactly 1 follow-up generated from your answer |
| F4 | Real-time body-language telemetry + live HUD | Head pose (camera/HMD) → eye-contact %, fidget index, bow count, shown live in the HUD |
| F5 | Weighted evaluation report with feedback | Report board: 내용 / 태도·시선 / 복장 scores, weighted total, S/A/B/C grade, per-answer feedback |

**One complete E2E workflow:** dress → greeting bow → 3-question voice interview (with follow-ups) → report board.

## Screenshots

> Placeholders — final captures to be added before submission.

| # | Planned screenshot | Status |
|---|--------------------|--------|
| S1 | Dressing room: avatar at the fake mirror + selection panel | TODO |
| S2 | Interview scene: interviewer + subtitle line + question panel | TODO |
| S3 | Live HUD close-up (eye-contact %, fidget, bows) | TODO |
| S4 | Report board with total + grade | TODO |

## Quickstart — mock mode (no API key, zero network)

```bash
cd vr-interview-trainer
python3 -m http.server 8123
# open http://localhost:8123 in Chrome (desktop)
```

- Mock mode is the **default** and never touches the network or the microphone.
- Desktop: drag the mouse to look around, click the in-world panel buttons, hold **push-to-talk** to "answer" (a canned Korean transcript is used as your speech).
- The `#badge` overlay shows **MOCK**.

## Live mode (OpenAI)

1. Click the API-key button on the overlay and paste an OpenAI API key. The key is stored in `localStorage` **only** and is sent nowhere except to OpenAI.
2. The `#badge` flips to **LIVE**. The app now calls:
   - `whisper-1` — speech-to-text (Korean)
   - `gpt-4o-mini` — per-answer evaluation JSON + adaptive follow-ups
   - `gpt-4o` — vision attire evaluation from an avatar screenshot
   - `tts-1` (voice `nova`) — interviewer voice
3. **Never-hard-fail policy:** any network/API error automatically falls back to the mock implementation *for that call only*. The session always completes.

## Meta Quest 2 deployment

1. Host this folder on any static host (e.g. GitHub Pages) — there is no build step.
2. Open the URL in the **Meta Quest Browser** on the headset.
3. Click **'VR 입장'** (the app's own WebXR session button) to start an `immersive-vr` session with a `local-floor` reference space.

> Honest status: developed and verified on the macOS desktop simulator (Chrome mouse-drag look). The Quest 2 deployment path is implemented via WebXR; **on-device testing is pending** (no hardware access during stage 1).

## Project structure

```
vr-interview-trainer/
├── index.html            # UI overlay: #hud telemetry, #sub subtitles,
│                         # #badge MOCK/LIVE, API-key modal, import map
├── js/
│   ├── main.js           # renderer, drag-look camera, raycast panel clicks,
│   │                     # state machine DRESS→INTERVIEW→REPORT,
│   │                     # MediaRecorder mic capture (live mode only)
│   ├── world.js          # three.js scene: room, primitive interviewer (jaw bob),
│   │                     # primitive player avatar at fake mirror,
│   │                     # canvas-texture UI panel with raycast buttons
│   ├── ai.js             # AI adapter: mock ↔ live (whisper-1 / gpt-4o-mini / gpt-4o / tts-1)
│   └── telemetry.js      # head-pose body-language metrics (eye contact, fidget, bows)
├── vendor/
│   └── three.module.js   # three.js r160 (vendored, ES modules + import map, no build step)
└── docs/                 # report.tex, spec.tex, slides.tex, video_script.md
```

## API cost note

Live mode costs on the order of **a few US cents per full run** (short whisper-1 clips, small gpt-4o-mini evaluations, one gpt-4o vision call, a few hundred characters of tts-1). Mock mode costs nothing and uses zero network.

## Disclaimer

This is a **practice tool**. Scores and feedback are generated for self-training only and must **not** be used as a hiring decision tool or to evaluate real candidates.
