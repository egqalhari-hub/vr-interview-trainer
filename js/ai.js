// ai.js — AI question/answer, STT/TTS, evaluation and attire scoring.
// Two modes: MOCK (offline, deterministic) and LIVE (OpenAI API, key in localStorage).
// Every public async method NEVER throws: any network/parse failure warns once and
// falls back to the mock path for that call.

export const QUESTIONS = [
  '간단히 자기소개를 해주세요.',
  '우리 회사에 지원한 동기가 무엇인가요?',
  '본인의 장점과 단점을 말해주세요.',
];

export const FOLLOWUPS = [
  '그 경험을 한 가지 사례로 구체적으로 말씀해 주세요.',
  '입사 후 우리 회사에서 가장 기여하고 싶은 일은 무엇입니까?',
  '그 단점을 극복한 구체적인 경험이 있습니까?',
];

// English subtitle lines (display only — audio stays Korean).
export const QUESTIONS_EN = [
  'Please briefly introduce yourself.',
  'Why did you apply to our company?',
  'Tell me your strengths and weaknesses.',
];
export const FOLLOWUPS_EN = [
  'Could you give one concrete example of that experience?',
  'What would you most like to contribute after joining us?',
  'Do you have a specific experience of overcoming that weakness?',
];
const MOCK_TRANSCRIPTS_EN = [
  'Hello. I am, um, Kim Ji-hun, a computer-engineering graduate of Gyeongsang National University. I built teamwork and problem-solving skills in several team projects.',
  'I gained hands-on experience developing a robot control system for my capstone project.',
  'Uh, I applied after seeing your technology and growth potential. I especially relate to your vision in AI.',
  'First, um, I communicate with my teammates and always finish what I take on.',
  'My strength is attention to detail. My weakness is, um, being too much of a perfectionist at times, which I am fixing by setting priorities.',
  'That perfectionism has actually led to higher-quality outcomes before.',
];
// English line for a mock transcript; '' when unknown (e.g. live Whisper output).
export function enForTranscript(t) {
  const i = MOCK_TRANSCRIPTS.indexOf(t);
  return i >= 0 ? MOCK_TRANSCRIPTS_EN[i] : '';
}

const KEY_STORE = 'vrit_key';
const API_BASE = 'https://api.openai.com/v1';

// ---- Mock data ---------------------------------------------------------------

const MOCK_TRANSCRIPTS = [
  '안녕하십니까. 저는, 음, 경남대학교 컴퓨터공학과를 졸업한 김지훈입니다. 여러 팀 프로젝트에서 협업과 문제 해결 능력을 길렀습니다.',
  '캡스톤 프로젝트에서 로봇 제어 시스템을 개발하며 실무 역량을 쌓았습니다.',
  '어, 귀사의 기술력과 성장 가능성을 보고 지원했습니다. 특히 AI 분야 비전에 깊이 공감합니다.',
  '우선, 음, 팀원들과 소통하며 맡은 일을 끝까지 합니다.',
  '장점은 꼼꼼함입니다. 단점은, 음, 가끔 완벽주의가 지나치다는 점인데, 우선순위를 정해 개선하고 있습니다.',
  '완벽주의 성향이 오히려 품질을 높이는 결과로 이어진 적이 있습니다.',
];

const MOCK_SCORES = [82, 85, 74, 78, 81, 80];

// Strict-interviewer tone feedback; mentions fillers (음/어) where the mock
// transcript for the same index contains them.
const MOCK_FEEDBACK = [
  '전반적으로 무난한 자기소개입니다만, "음" 같은 군말이 신뢰를 깎습니다. 핵심 경력부터 또박또박 말씀해 주십시오.',
  '프로젝트 경험을 구체적으로 잘 짚으셨습니다. 다만 그 역량이 우리 회사 직무와 어떻게 연결되는지 한마디가 부족합니다.',
  '지원 동기가 다소 추상적이고 "어" 같은 군말이 눈에 띕니다. 회사의 어떤 점에 공감했는지 근거를 대십시오.',
  '성실한 태도는 전달됩니다만, "음"이 잦고 사례가 빈약합니다. 맡은 일의 성과를 수치로 보강하십시오.',
  '장단점의 균형은 좋으나 "음"이 반복되어 준비가 덜 된 인상입니다. 단점 극복 방안은 좋은 접근입니다.',
  '논리적인 답변입니다. 다만 결과의 규모를 구체적으로 제시했다면 더 설득력이 있었을 것입니다.',
];

// Shared cycling index for the mock STT queue and the mock score table.
let mockIndex = 0;
let lastSttIndex = -1; // transcript index of the most recent mock stt() call
const nextMockIndex = () => {
  const i = mockIndex % MOCK_TRANSCRIPTS.length;
  mockIndex += 1;
  return i;
};

// ---- Helpers -----------------------------------------------------------------

let speaking = false;

// Warn only once per failure kind so a dead network doesn't spam the console.
const warned = new Set();
function warnOnce(kind, err) {
  if (warned.has(kind)) return;
  warned.add(kind);
  console.warn(`[ai] live ${kind} failed, falling back to mock:`, err && err.message ? err.message : err);
}

function getKey() {
  try {
    return typeof localStorage !== 'undefined' ? localStorage.getItem(KEY_STORE) : null;
  } catch (_) {
    return null;
  }
}

function clampScore(n) {
  n = Math.round(Number(n) || 0);
  return Math.max(0, Math.min(100, n));
}

// ---- Attire rubric -----------------------------------------------------------

const OUTFIT_ADJ = { suit: 20, casual: 5, training: -15 };
const HAIR_ADJ = { black: 10, brown: 5, blond: -5, blue: -15 };
const OUTFIT_LABEL = { suit: '정장', casual: '캐주얼 차림', training: '트레이닝복' };
const HAIR_LABEL = { black: '검은 머리', brown: '갈색 머리', blond: '금발 머리', blue: '파란 머리' };
const INDUSTRY_LABEL = { corp: '대기업', startup: '스타트업', public: '공공기관' };

export const AI = {
  live: false,

  setKey(key) {
    try {
      if (typeof localStorage !== 'undefined') localStorage.setItem(KEY_STORE, key);
    } catch (_) { /* storage unavailable — keep in-memory live flag anyway */ }
    this.live = true;
  },

  clearKey() {
    try {
      if (typeof localStorage !== 'undefined') localStorage.removeItem(KEY_STORE);
    } catch (_) { /* ignore */ }
    this.live = false;
  },

  isSpeaking() {
    return speaking;
  },

  // TTS. Resolves when audio/utterance ends; never throws.
  async speak(text) {
    if (this.live) {
      try {
        const res = await fetch(`${API_BASE}/audio/speech`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getKey()}` },
          body: JSON.stringify({ model: 'tts-1', voice: 'nova', input: text }),
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        if (typeof Audio === 'undefined' || typeof URL === 'undefined' || !URL.createObjectURL) {
          throw new Error('Audio playback unavailable');
        }
        const blob = await res.blob();
        await new Promise((resolve) => {
          const audio = new Audio(URL.createObjectURL(blob));
          speaking = true;
          audio.addEventListener('ended', () => { speaking = false; resolve(); });
          audio.addEventListener('error', () => { speaking = false; resolve(); });
          audio.play().catch(() => { speaking = false; resolve(); });
        });
        return;
      } catch (err) {
        warnOnce('speak', err); // fall through to mock path
      }
    }
    // Mock path: browser speech synthesis, else a duration-matched timer.
    const synth = typeof window !== 'undefined' ? window.speechSynthesis : null;
    if (synth && typeof SpeechSynthesisUtterance !== 'undefined') {
      await new Promise((resolve) => {
        const u = new SpeechSynthesisUtterance(text);
        u.lang = 'ko-KR';
        speaking = true;
        u.onend = () => { speaking = false; resolve(); };
        u.onerror = () => { speaking = false; resolve(); };
        synth.speak(u);
      });
    } else {
      speaking = true;
      await new Promise((resolve) => setTimeout(resolve, String(text).length * 80));
      speaking = false;
    }
  },

  // STT. -> transcript string; never throws.
  async stt(blob) {
    if (this.live) {
      try {
        const fd = new FormData();
        fd.append('model', 'whisper-1');
        fd.append('language', 'ko');
        fd.append('file', blob, 'audio.webm');
        const res = await fetch(`${API_BASE}/audio/transcriptions`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${getKey()}` },
          body: fd,
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        return String(json.text || '');
      } catch (err) {
        warnOnce('stt', err); // fall through to mock path
      }
    }
    lastSttIndex = nextMockIndex();
    return MOCK_TRANSCRIPTS[lastSttIndex];
  },

  // -> {score: int 0..100, feedback: string}; never throws.
  async evaluateAnswer(question, answer) {
    if (this.live) {
      try {
        const res = await fetch(`${API_BASE}/chat/completions`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getKey()}` },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            response_format: { type: 'json_object' },
            messages: [
              { role: 'system', content: '당신은 엄격한 한국 대기업 면접관입니다. 지원자의 답변을 냉정하게 평가하되 예의를 지키십시오. 군말(음, 어), 구체성, 논리성을 기준으로 0~100점을 매기고, 반드시 {"score": number, "feedback": string} 형식의 JSON 한국어로만 답하십시오. feedback은 한두 문장.' },
              { role: 'user', content: `질문: ${question}\n답변: ${answer}` },
            ],
          }),
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        const parsed = JSON.parse(json.choices[0].message.content);
        return { score: clampScore(parsed.score), feedback: String(parsed.feedback || '') };
      } catch (err) {
        warnOnce('evaluateAnswer', err); // fall through to mock path
      }
    }
    // Score the answer stt() just returned, so transcript i pairs with score i.
    const i = lastSttIndex >= 0 ? lastSttIndex : nextMockIndex();
    lastSttIndex = -1;
    return { score: MOCK_SCORES[i], feedback: MOCK_FEEDBACK[i] };
  },

  // -> Korean follow-up question string; never throws.
  async followUp(qIndex, answer) {
    if (this.live) {
      try {
        const res = await fetch(`${API_BASE}/chat/completions`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getKey()}` },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: [
              { role: 'system', content: '당신은 엄격한 한국 대기업 면접관입니다. 지원자의 답변을 듣고 예의를 지키되 날카로운 후속 질문을 한국어 한 문장으로만 하십시오.' },
              { role: 'user', content: `원래 질문: ${QUESTIONS[qIndex] || ''}\n답변: ${answer}` },
            ],
          }),
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        return String(json.choices[0].message.content || '').trim();
      } catch (err) {
        warnOnce('followUp', err); // fall through to mock path
      }
    }
    return FOLLOWUPS[qIndex];
  },

  // sel = {outfit, hair, industry}. -> {score, feedback}; never throws.
  async attireScore(sel, pngDataUrl) {
    if (this.live) {
      try {
        const res = await fetch(`${API_BASE}/chat/completions`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getKey()}` },
          body: JSON.stringify({
            model: 'gpt-4o',
            messages: [
              { role: 'system', content: '당신은 엄격한 한국 면접관입니다. 사진 속 지원자의 복장과 헤어가 해당 업계 면접에 적합한지 평가하십시오. 기준: 정장/단정한 머리 고득점, 트레이닝복·탈색·염색 감점. 반드시 {"score": number(0~100), "feedback": string} JSON 한국어 한 문장 피드백으로만 답하십시오.' },
              { role: 'user', content: [
                { type: 'text', text: `업계: ${INDUSTRY_LABEL[sel.industry] || sel.industry}. 이 지원자의 면접 복장을 평가해 주십시오.` },
                { type: 'image_url', image_url: { url: pngDataUrl } },
              ] },
            ],
          }),
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        let parsed;
        try {
          parsed = JSON.parse(json.choices[0].message.content);
        } catch (_) {
          // Parse failure: keep the deterministic local score.
          return { score: this.scoreAttireLocal(sel), feedback: '면접 복장 평가를 해석하지 못해 기본 기준으로 채점했습니다.' };
        }
        return { score: clampScore(parsed.score), feedback: String(parsed.feedback || '') };
      } catch (err) {
        warnOnce('attireScore', err); // fall through to mock path
      }
    }
    // Mock: local rubric plus feedback assembled from the worst attribute(s).
    const score = this.scoreAttireLocal(sel);
    const bad = [];
    if ((OUTFIT_ADJ[sel.outfit] || 0) < 0) bad.push(OUTFIT_LABEL[sel.outfit]);
    if ((HAIR_ADJ[sel.hair] || 0) < 0) bad.push(HAIR_LABEL[sel.hair]);
    const industry = INDUSTRY_LABEL[sel.industry] || '해당 업계';
    const feedback = bad.length === 0
      ? '면접에 적합한 단정한 복장입니다.'
      : `${bad.join('과 ')}는 ${industry} 면접에 부적합합니다.`;
    return { score, feedback };
  },

  // Pure deterministic rubric -> int 0..100.
  scoreAttireLocal(sel) {
    let score = 70;
    const adjustments = [OUTFIT_ADJ[sel.outfit] || 0, HAIR_ADJ[sel.hair] || 0];
    for (let adj of adjustments) {
      if (sel.industry === 'startup' && adj < 0) adj = Math.trunc(adj / 2); // halved, toward zero
      score += adj;
    }
    if (sel.industry === 'public' && (sel.hair === 'blond' || sel.hair === 'blue')) score -= 5;
    return Math.max(0, Math.min(100, Math.round(score)));
  },
};