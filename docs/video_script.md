# Demo Video Script — VR Interview Trainer (면접관), 3:00 total

## 0. Pre-flight checklist (do this BEFORE recording)

- [x] Server running: in the project folder, `python3 -m http.server 8123` (leave it running).
- [x] Open **Brave** at `http://127.0.0.1:8123` (any Chromium browser works).
- [ ] Top-right badge reads **MOCK** — correct. Mock mode needs no API key, no mic permission, no network, and is fully deterministic. Do NOT open the ⚙ API modal.
- [ ] Window fullscreen (hide bookmarks bar, ⌘⇧B).
- [x] Do ONE practice run end-to-end (~2 min) so you know the rhythm, then refresh the page for the real take. Refreshing resets everything deterministically.
- [x] Recording: **⌘⇧5 → record entire screen**, microphone ON if narrating live (narration can also be added later as voiceover — full text below).
- [x] **English subtitles appear automatically** under every Korean line — you do not need to read English aloud; pick ONE narration language (KO or EN) from the blocks below.
- [x] If a take goes wrong: refresh the page and start that block again. The report screen has a **[다시 하기]** button that reloads.

**Expected scores on the report board (mock mode):** 내용(Content) **80** (fixed: mean of 82/85/74/78/81/80), 복장(Attire) **100** (정장+검정+대기업), 태도·시선(Body) **varies with your actual mouse/head movement** (~65–90 if you keep looking at the interviewer and bow once). Total = 0.5·80 + 0.3·Body + 0.2·100 → expect **~80–87, grade A**. Say the body/total numbers you actually got — do not read 80/100 as the total.

---

## Block 1 — Title / intro (0:00–0:18)

**Shot:** Fresh-loaded dressing-room view. Badge reads MOCK.

**Actions:** none. Hold still for 3 s, then slow drag to show the room, the mirror with the avatar, and the panel.

**Narration KO:**
> "안녕하십니까. 경상국립대학교 글로컬 프로젝트, 과제 3-2 'Meta Quest 2 기반 피지컬 AI 에이전트' 결과물, VR 면접 트레이너 '면접관'입니다. 면접 코칭은 비싸고, 기회는 불균등합니다. 이 트레이너는 누구에게나 무료로, 무제한의 실전 연습과 측정 가능한 피드백을 제공합니다. 답변 내용, 몸짓과 시선, 복장 — 세 가지를 동시에 평가하는 엄격한 한국식 면접 시뮬레이터입니다."

**Narration EN:**
> "Hello. This is 'Myeonjeopgwan', a VR interview trainer for Task 3-2, 'Meta Quest 2 VR-Based Physical AI Agent', Gyeongsang National University Glocal Project. Interview coaching is expensive and unequally available — this trainer gives anyone free, unlimited practice with measurable feedback. A strict Korean-style simulator evaluating three axes at once: answer content, body language and gaze, and attire."

---

## Block 2 — Dressing room, F1 (0:18–0:45)

**Shot:** Panel + avatar in the fake mirror.

**Actions (exact clicks):**
1. Click **정장** (suit) in the 복장 row — avatar torso turns navy.
2. Click **검정** (black) in the 머리 row — avatar hair turns black.
3. Click **대기업** (large corporation) in the 지원 분야 row.
4. Drag the view toward the mirror to show the updated avatar (0:25–0:35).
5. Do NOT start yet — stop here at 0:45 boundary; narration explains scoring.

**Narration KO:**
> "먼저 드레싱 룸입니다. 지원자는 헤어와 복장, 지원 업종을 고릅니다. 정장, 검정 머리, 대기업을 선택하겠습니다. 거울 속 아바타가 즉시 바뀝니다. 이 조합은 AI 복장 평가에서 만점인 100점을 받습니다. 트레이닝복에 파란 머리였다면 40점입니다."

**Narration EN:**
> "First, the dressing room. The candidate picks outfit, hair, and target industry. Suit, black hair, large corporation. The avatar in the mirror updates instantly. This combination earns a perfect attire score of 100 from the AI evaluation — training wear with blue hair would score 40."

---

## Block 3 — Interview, Q1 full cycle, F2+F3+F4 (0:45–1:52)

**Shot:** Interview view, interviewer centered. **HUD top-left is always visible** (시선/Eye %, 움직임/Fidget, 인사/Bows — bilingual).

**Actions (exact):**
1. Click the big green **면접 시작** button (panel bottom-right).
2. Interviewer greets you (jaw animates, Korean audio, bilingual subtitle). **Bow now:** drag the mouse DOWN until the view tilts clearly down, hold 1 s, release — watch HUD 인사/Bows tick 0 → 1.
3. Q1 appears on panel + subtitle (자기소개), interviewer speaks it.
4. Prompt says 답변 시작 — press **Space** (or click 답변 시작). Red **● 녹음 중 / Recording** shows. Wait 3–5 s like you're speaking. Press **Space** again to stop. (Toggle, not hold.)
5. "인식 중… / Recognizing…" → your answer transcript appears (KO + EN subtitle). In mock this is a canned answer scored **82**; in live mode this is your real voice via Whisper.
6. The **adaptive follow-up** is asked (Q1 → 구체적 사례 요청). Answer it the same way (Space, 3–5 s, Space). Scored 85.
7. "면접관: 잘 들었습니다." — Q2 begins. **During Q2**, once: shake the view left-right briefly to show the Fidget index react, then re-center so Eye % recovers.
8. **Jump-cut (editing):** Q2/Q3 use the identical cycle. Insert a 1-s text card: "Q2·Q3 — 동일한 흐름 / identical flow, cut for time", then cut to the moment after the last answer.

**Narration KO:**
> "면접이 시작됩니다. 인사에 고개 숙여 답례하면 HUD의 인사 횟수가 올라갑니다. 첫 질문, 자기소개. 스페이스 바로 답변을 시작하고, 다시 눌러 끝냅니다. 답변은 즉시 채점되고 — 첫 답변은 82점 — 내용에 따라 꼬리질문이 이어집니다. 왼쪽 위 HUD를 보십시오. 시선 접촉, 몸떨림, 인사가 실시간으로 계산됩니다. 이 수치는 헤드셋 자세에서 직접 측정되며 AI가 아닌 결정론적 지표입니다. 두 번째, 세 번째 질문은 같은 흐름이라 편집으로 생략합니다."

**Narration EN:**
> "The interview begins. Bow to return the greeting — the HUD bow counter rises. Question one: self-introduction. Press Space to answer, Space again to stop. The answer is scored instantly — 82 for this one — and an adaptive follow-up is generated from it. Watch the top-left HUD: eye contact, fidget index, bows — computed in real time, deterministically, from the headset pose itself, not from an AI guess. Questions two and three follow the identical cycle and are cut for time."

---

## Block 4 — Report board, F5 (1:52–2:32)

**Shot:** Report board fills the view (after "수고하셨습니다. 결과를 정리하겠습니다.").

**Actions (exact):**
1. Hold on the board. Point the view at each row as you read it: **내용 80 · 태도·시선 [your number] · 복장 100**.
2. Point at the big total + grade (expect **~80–87, A** — say your actual numbers).
3. Tilt down slightly to the feedback lines at the bottom (strict-interviewer comments + attire feedback + "시선 접촉 N% · 인사 N회").
4. Optionally end the block by hovering [다시 하기] — do not click it.

**Narration KO:**
> "결과 보드입니다. 내용은 여섯 답변의 평균 80점, 복장 100점, 그리고 방금 제 몸짓으로 만든 태도·시선 점수. 색깔 막대가 세 항목, 가운데 막대그래프가 답변별 점수, 오른쪽 배지가 등급입니다. 총점은 내용 50, 태도 30, 복장 20의 가중 평균이고, 90 이상 S, 80 이상 A, 70 이상 B, 그 아래는 C입니다. 아래에는 답변별 피드백이 엄격한 면접관의 어조로 표시됩니다."

**Narration EN:**
> "The report board. Content: 80, the mean of six answers. Attire: 100. Attitude and gaze: computed from my actual movement during this take. The colored bars are the three categories, the middle chart is the six answer scores, and the badge on the right is the grade. The total is a weighted mean — 50 content, 30 attitude, 20 attire — graded S at 90, A at 80, B at 70, C below. Below, per-answer feedback is written in the voice of a strict Korean interviewer."

---

## Block 5 — Architecture + honest status + close (2:32–3:00)

**Shot:** Cut to slide 5 (architecture) of the deck, fullscreen (open `docs/slides.pdf`, page 5). End on project name.

**Actions:** pointer follows the narration: state machine → three modules → mock/live adapter.

**Narration KO:**
> "구조는 단순합니다. 빌드 없는 싱글 페이지 WebXR 앱이고, main.js의 상태머신이 월드, AI 어댑터, 텔레메트리를 지휘합니다. 지금 보신 모의 모드는 네트워크 없이 동작하고, 라이브 모드는 Whisper, GPT-4o-mini, GPT-4o 비전, TTS를 사용하되 어떤 오류도 모의 모드로 자동 대체되어 시연이 멈추지 않습니다. 퀘스트 2에서는 메타 브라우저의 WebXR 세션으로 그대로 실행되며, 실기기 검증과 Unity 포팅이 2단계 계획입니다. 감사합니다."

**Narration EN:**
> "The architecture is simple: a single-page WebXR app with no build step; a state machine in main.js drives the world, the AI adapter, and the telemetry. The mock mode you just watched runs with zero network; live mode uses Whisper, GPT-4o-mini, GPT-4o vision, and TTS — and any failure falls back to mock automatically, so the demo can never break. On Quest 2 the same app runs as an immersive WebXR session in the Meta Browser; on-device verification and a Unity port are our stage-2 plan. Thank you."

---

## Editing notes

- Cuts only: Block boundaries are natural cuts; no transitions needed.
- The Q2/Q3 jump-cut card is the only added graphic (any editor; plain white text on black, 1 s).
- If total runtime lands at 3:10–3:20, trim Block 1 to 10 s and the Block 3 recording pauses to 3 s.
- Do not speed-ramp the interview — the real-time HUD updates are the proof it works.
