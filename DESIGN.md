# DESIGN.md — Binding Technical Contract

This document is the **binding contract** for the VR Interview Trainer (면접관). Implementation must match these facts exactly; nothing here is aspirational. Task 3-2 "Meta Quest 2 VR-Based Physical AI Agent", Gyeongsang National University Glocal Project, stage 1.

## 1. Stack and runtime

- three.js **r160**, vendored at `vendor/three.module.js`, loaded as ES modules via an **import map**. **No build step.**
- Vanilla JS. Single-page app.
- Desktop dev run: `python3 -m http.server 8123` → open `http://localhost:8123` in Chrome (mouse-drag look).
- Quest 2: host the folder on any static host, open the URL in Meta Quest Browser, click **'VR 입장'** (own WebXR session button; `immersive-vr`, `local-floor` reference space).

## 2. State machine

Exactly three top-level states: **`DRESS` → `INTERVIEW` → `REPORT`**.

```
DRESS ──confirm──▶ INTERVIEW ──after follow-up 3 scored──▶ REPORT
```

`INTERVIEW` internal sequence (fixed order):

```
GREETING            interviewer TTS greeting; system waits for the greeting bow
                   (pitch ≤ −35° registers on the debounced bow counter)
Q1 ASK → LISTEN → EVALUATE          jagisogae  (자기소개, self-introduction)
FU1 ASK → LISTEN → EVALUATE         adaptive follow-up generated from answer 1
Q2 ASK → LISTEN → EVALUATE          jiwondonggi (지원동기, motivation for applying)
FU2 ASK → LISTEN → EVALUATE         adaptive follow-up generated from answer 2
Q3 ASK → LISTEN → EVALUATE          jangdanjeom (장단점, strengths and weaknesses)
FU3 ASK → LISTEN → EVALUATE         adaptive follow-up generated from answer 3
```

- `LISTEN` = push-to-talk toggle; the user answers by voice.
- Each of the 6 answers (3 questions + 3 follow-ups) yields one score in `[0,100]` plus feedback.
- `REPORT` renders the report board: 내용 (content) / 태도·시선 (attitude·gaze) / 복장 (attire) scores, weighted total, S/A/B/C grade, feedback.

### DRESS options (exact)

| Slot | Options |
|------|---------|
| Hair | 검정 (black) / 갈색 (brown) / 금발 (blond) / 파랑 (blue) |
| Outfit | 정장 (suit) / 캐주얼 (casual) / 트레이닝 (training) |
| Industry | 대기업 (large corporation) / 스타트업 (startup) / 공기업 (public sector) |

On confirm, the attire score is computed immediately (mock: rubric; live: gpt-4o vision on avatar screenshot).

## 3. Module APIs (signatures only)

### `js/ai.js` — AI adapter (mock ↔ live)

```js
initAI({ mode, apiKey })                 // mode: 'mock' | 'live'; key from localStorage
getMode()                                // -> 'mock' | 'live' (configured mode)
transcribe(audioBlob)                    // -> Promise<string>  live: whisper-1 (ko)
                                         //    mock: next canned transcript from 6-queue
evaluateAnswer(question, answer, index)  // -> Promise<{ score, feedback }>
generateFollowUp(question, answer)       // -> Promise<string>  Korean follow-up
evaluateAttire({ outfit, hair, industry, screenshotBlob })
                                         // -> Promise<{ score, feedback }>
speak(text)                              // -> Promise<void>  live: tts-1 voice 'nova'
                                         //    mock: Korean speechSynthesis
resetMockQueue()                         // re-arm canned transcripts + canned scores
```

### `js/telemetry.js` — head-pose body-language metrics

```js
createTelemetry()                        // -> telemetry
telemetry.update(dtSeconds, camera, interviewerHead)
telemetry.getMetrics()                   // -> { eyePct, fidget, bows, bodyScore }
telemetry.reset()
```

### `js/world.js` — three.js scene

```js
initWorld(renderer)                      // -> { scene, camera, panel, interviewer, avatar }
setAvatarAppearance({ hair, outfit })
setInterviewerSpeaking(active)           // jaw bob on/off
panel.setButtons([{ id, label }])
panel.setLines([string])                 // question / prompt text on the canvas panel
panel.onButtonClick(callback(id))        // raycast button clicks
getInterviewerHead()                     // -> Object3D (telemetry target)
captureAvatarScreenshot(renderer)        // -> Promise<Blob> (live attire eval input)
```

### `js/main.js` — application core (entry point, no export contract)

```js
boot()                                   // renderer, drag-look camera rig, raycasting,
                                         // state machine, HUD loop, WebXR button 'VR 입장'
setState('DRESS' | 'INTERVIEW' | 'REPORT')
```

`main.js` owns **MediaRecorder** microphone capture — started in **live mode only** (mock never requests the mic).

### `index.html` — overlay contract

DOM ids: `#hud` (telemetry), `#sub` (subtitles), `#badge` (MOCK/LIVE), plus the API-key modal and the import map binding `three` → `./vendor/three.module.js`.

## 4. Evaluation contract

### 4.1 Attire rubric (deterministic)

Base score **70**, then:

| Slot | Adjustment |
|------|------------|
| Outfit | suit +20 / casual +5 / training **−15** |
| Hair | black +10 / brown +5 / blond **−5** / blue **−15** |

Modifiers:

- **Startup** industry: negative adjustments are **halved**.
- **Public sector**: additional **−5** for blond or blue hair.
- Clamp to `[0, 100]`.

**Verified examples (binding):**

| Outfit | Hair | Industry | Computation | Score |
|--------|------|----------|-------------|-------|
| suit | black | large corp | 70 + 20 + 10 | **100** |
| casual | brown | startup | 70 + 5 + 5 | **80** |
| training | blue | large corp | 70 − 15 − 15 | **40** |

Derived (arithmetic consequences of the rubric): training/blue/startup = 70 + (−15−15)/2 = **55**; suit/blond/public = 70 + 20 − 5 − 5 = **80**.

### 4.2 Body language (real, deterministic, from camera/HMD pose)

| Metric | Definition |
|--------|------------|
| `eyePct` | fraction of interview time the angle between camera-forward and the direction to the interviewer's head is **≤ 15°** |
| `fidget` | rolling std-dev of yaw/pitch angular speed, normalized so **0.5 rad/s → 1.0** |
| `bows` | count of **pitch ≤ −35°** events, debounced |

```
bodyScore = clamp( eyePct*100 − fidget*40 + min(bows, 2)*5 , 0, 100 )
```

Worked example: eyePct 0.80, fidget 0.20, bows 1 → 80 − 8 + 5 = **77**.

### 4.3 Content and total

- `content` = **mean of the 6 per-answer scores** (3 questions + 3 follow-ups).
- `total = 0.5·content + 0.3·body + 0.2·attire`
- Grade: **S ≥ 90, A ≥ 80, B ≥ 70, else C**.

Worked example: content 80, body 77, attire 100 → 40.0 + 23.1 + 20.0 = **83.1 → grade A**.

## 5. Mock data tables (default mode, zero network)

### Canned per-answer scores (consumed in interview order)

| # | Answer | Score |
|---|--------|-------|
| 1 | Q1 jagisogae | 82 |
| 2 | FU1 follow-up | 85 |
| 3 | Q2 jiwondonggi | 74 |
| 4 | FU2 follow-up | 78 |
| 5 | Q3 jangdanjeom | 81 |
| 6 | FU3 follow-up | 80 |

Content = (82+85+74+78+81+80) / 6 = **80**.

### Canned transcripts and voice

- **6-queue of canned Korean transcripts**, consumed one per `LISTEN` in interview order (Q1, FU1, Q2, FU2, Q3, FU3). Representative examples — exact strings live in `js/ai.js`:
  - Q1: "안녕하십니까. 성실함과 책임감으로 팀에 기여해 온 지원자입니다."
  - Q2: "귀사의 기술 방향성이 제 성장 목표와 일치한다고 판단했습니다."
  - Q3: "장점은 끈기이고, 단점은 서두르는 경향이 있어 체크리스트로 관리합니다."
- Canned follow-ups, one per fixed question.
- Interviewer voice: **Korean `speechSynthesis`** (no network).
- Attire: deterministic rubric (§4.1).

## 6. Error-fallback policy (never hard-fail)

1. **Mock is the default** and performs zero network calls; the demo always works.
2. Live mode reads the OpenAI API key from **localStorage** (entered via the API-key modal).
3. **Every** live API call (whisper-1, gpt-4o-mini, gpt-4o, tts-1) is wrapped: on *any* network/API error it logs a warning and uses the **mock implementation for that call only**, then the session continues.
4. `#badge` shows the configured mode (MOCK/LIVE). There is no user-facing hard failure path.

## 7. Stage-2 roadmap (out of scope for stage 1)

Unity port (the competition's "typical" stack) · on-device Quest 2 verification · hand tracking · real lip-sync · multi-interviewer panel · backend proxy for API keys.

**Honest status:** developed and verified on the macOS desktop simulator; Quest 2 deployment path implemented via WebXR, on-device test pending (no hardware access during stage 1).