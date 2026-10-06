// world.js — VR Interview Trainer: room, avatars, and canvas-UI panel.
// Consumed by js/main.js through the public API of `World`. Only dependency: three (import map).
import * as THREE from 'three';

const HAIR_COLORS = { black: '#1a1a1a', brown: '#6b4423', blond: '#d9b45b', blue: '#2b6fd6' };
const OUTFIT_COLORS = { suit: '#1f2a44', casual: '#3e7d4e', training: '#777777' };
const CANVAS_W = 1024;
const CANVAS_H = 640;
const SKIN = '#e6b48c';

function stdMat(color, roughness = 0.9, metalness = 0) {
  return new THREE.MeshStandardMaterial({ color, roughness, metalness });
}

function box(w, h, d, material, x = 0, y = 0, z = 0) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material);
  m.position.set(x, y, z);
  return m;
}

function buildChair(color) {
  const g = new THREE.Group();
  const m = stdMat(color, 0.8);
  g.add(box(0.5, 0.06, 0.48, m, 0, 0.45, 0));                 // seat
  g.add(box(0.5, 0.55, 0.06, m, 0, 0.75, -0.21));             // backrest
  for (const sx of [-1, 1]) for (const sz of [-1, 1])
    g.add(box(0.05, 0.45, 0.05, m, sx * 0.2, 0.225, sz * 0.19));
  return g;
}

// Primitive human, faces +Z. Returns refs used for animation and recoloring.
function buildHuman({ seated = false, torsoShape = 'box', cloth = '#3a3f47', hair = '#26221f' } = {}) {
  const g = new THREE.Group();
  const skinM = stdMat(SKIN, 0.7);
  const clothM = stdMat(cloth, 0.85);
  const hairM = stdMat(hair, 0.6);
  const darkM = stdMat('#222222', 0.5);

  let torsoY;
  if (seated) {
    for (const s of [-1, 1]) {
      g.add(box(0.12, 0.1, 0.42, clothM, s * 0.1, 0.52, 0.12));   // thigh
      g.add(box(0.1, 0.5, 0.1, clothM, s * 0.1, 0.25, 0.3));      // shin
    }
    torsoY = 0.92;
  } else {
    for (const s of [-1, 1]) g.add(box(0.12, 0.78, 0.13, clothM, s * 0.1, 0.39, 0));
    torsoY = 1.06;
  }

  let torso;
  if (torsoShape === 'capsule') torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.17, 0.36, 6, 14), clothM);
  else torso = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.56, 0.22), clothM);
  torso.position.y = torsoY;
  g.add(torso);
  for (const s of [-1, 1]) g.add(box(0.09, 0.52, 0.1, clothM, s * 0.27, torsoY, 0)); // arms

  const head = new THREE.Group();
  head.position.y = torsoY + 0.42;
  head.add(new THREE.Mesh(new THREE.SphereGeometry(0.13, 20, 16), skinM));
  const hairCap = new THREE.Mesh(
    new THREE.SphereGeometry(0.137, 20, 12, 0, Math.PI * 2, 0, Math.PI / 2), hairM);
  hairCap.position.y = 0.012;
  head.add(hairCap);
  for (const s of [-1, 1]) {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.016, 8, 8), darkM);
    eye.position.set(s * 0.046, 0.01, 0.118);
    head.add(eye);
  }
  const jaw = box(0.1, 0.05, 0.08, skinM, 0, -0.08, 0.05);      // bobs while speaking
  head.add(jaw);
  g.add(head);
  return { group: g, head, jaw, torso, hairCap };
}

export class World {
  constructor(scene) {
    this.scene = scene;
    this.sel = { hair: 'black', outfit: 'suit', industry: 'corp' };
    this.mode = 'dress';
    this._question = '';
    this._recording = false;
    this._report = null;
    this._t = 0;
    this._jawT = 0;
    this._rects = [];
    this._buildRoom();
    this._buildFurniture();
    this._buildActors();
    this._buildPanel();
    this._draw();
  }

  _buildRoom() {
    const s = this.scene;
    s.add(box(7, 0.1, 7, stdMat('#d7d3ca', 0.95), 0, -0.05, 0));      // floor
    s.add(box(7, 0.1, 7, stdMat('#f0ede6', 0.95), 0, 4.05, 0));       // ceiling
    s.add(box(7, 4, 0.1, stdMat('#e7e3da', 0.95), 0, 2, -3.55));      // back wall
    s.add(box(0.1, 4, 7, stdMat('#ebe7de', 0.95), -3.55, 2, 0));      // left wall
    s.add(box(0.1, 4, 7, stdMat('#ebe7de', 0.95), 3.55, 2, 0));       // right wall
    s.add(new THREE.AmbientLight(0xfff1dd, 0.65));
    const sun = new THREE.DirectionalLight(0xffe9c9, 1.2);
    sun.position.set(2.5, 3.8, 2.5);
    s.add(sun);
  }

  _buildFurniture() {
    const s = this.scene;
    s.add(box(1.7, 0.74, 0.8, stdMat('#c9c2b4', 0.8), 0, 0.37, -0.6));        // desk body
    s.add(box(1.82, 0.05, 0.92, stdMat('#b9b09e', 0.7), 0, 0.765, -0.6));     // desk top
    const chairA = buildChair('#8f8678');                                     // interviewer chair
    chairA.position.set(0, 0, -1.25);
    s.add(chairA);
    const chairB = buildChair('#8f8678');                                     // guest chair, opposite
    chairB.position.set(0, 0, 0.45);
    chairB.rotation.y = Math.PI;
    s.add(chairB);
    const rug = new THREE.Mesh(new THREE.CircleGeometry(1.7, 40), stdMat('#ded7c6', 1));
    rug.rotation.x = -Math.PI / 2;
    rug.position.set(0, 0.006, 0);
    s.add(rug);
    // fake mirror on the left wall: gold frame + slightly reflective plane
    s.add(box(0.06, 1.9, 1.1, stdMat('#c9a227', 0.35, 0.6), -3.5, 1.6, 0.5));
    const glass = new THREE.Mesh(new THREE.PlaneGeometry(0.94, 1.74), stdMat('#cfd6dd', 0.18, 0.85));
    glass.rotation.y = Math.PI / 2;
    glass.position.set(-3.46, 1.6, 0.5);
    s.add(glass);
    // marked standing spot for the player
    const spot = new THREE.Mesh(new THREE.RingGeometry(0.32, 0.42, 40),
      new THREE.MeshBasicMaterial({ color: '#c9a227' }));
    spot.rotation.x = -Math.PI / 2;
    spot.position.set(-2.4, 0.008, 0.5);
    s.add(spot);
  }

  _buildActors() {
    this._interviewer = buildHuman({ seated: true, torsoShape: 'capsule', cloth: '#3a3f47' });
    this._interviewer.group.position.set(0, 0, -1.2);
    this.scene.add(this._interviewer.group);
    this._player = buildHuman({
      seated: false, torsoShape: 'box',
      cloth: OUTFIT_COLORS[this.sel.outfit], hair: HAIR_COLORS[this.sel.hair],
    });
    this._player.group.position.set(-2.4, 0, 0.5);
    this._player.group.rotation.y = Math.PI / 2;                              // face room center
    this.scene.add(this._player.group);
  }

  _buildPanel() {
    this._canvas = document.createElement('canvas');
    this._canvas.width = CANVAS_W;
    this._canvas.height = CANVAS_H;
    this._ctx = this._canvas.getContext('2d');
    this._texture = new THREE.CanvasTexture(this._canvas);
    this._texture.colorSpace = THREE.SRGBColorSpace;
    this._texture.generateMipmaps = false;                                    // NPOT-safe on WebGL1
    this._texture.minFilter = THREE.LinearFilter;
    this.panel = new THREE.Mesh(
      new THREE.PlaneGeometry(2.6, 1.6),
      new THREE.MeshBasicMaterial({ map: this._texture }));
    this.panel.position.set(1.8, 1.7, -1.0);
    this.panel.lookAt(0, 1.6, 2.2);
    this.scene.add(this.panel);
  }

  update(dt, speaking) {
    this._t += dt;
    const jaw = this._interviewer.jaw;
    if (speaking) {
      this._jawT += dt;
      jaw.rotation.x = 0.12 + 0.12 * Math.sin(this._jawT * Math.PI * 2 * 8);  // ~8 Hz bob
    } else {
      this._jawT = 0;
      jaw.rotation.x += (0 - jaw.rotation.x) * Math.min(1, dt * 12);
    }
    this._interviewer.head.rotation.y = Math.sin(this._t * 0.7) * 0.08;       // idle sway
    this._player.head.rotation.y = Math.sin(this._t * 0.5 + 1.3) * 0.06;
    this._player.group.position.y = 0.008 * Math.sin(this._t * 1.4);          // breathing
  }

  interviewerHead() {
    return this._interviewer.head.getWorldPosition(new THREE.Vector3());
  }

  setAvatar(sel) {
    if (!sel) return;
    if (sel.hair && HAIR_COLORS[sel.hair]) this.sel.hair = sel.hair;
    if (sel.outfit && OUTFIT_COLORS[sel.outfit]) this.sel.outfit = sel.outfit;
    this._applyAvatar();
    if (this.mode === 'dress') this._draw();
  }

  showPanel(mode, data) {
    if (!['dress', 'interview', 'report', 'hidden'].includes(mode)) return;
    this.mode = mode;
    if (data !== undefined) this._report = data;
    this.panel.visible = mode !== 'hidden';
    this._draw();
  }

  setInterview(questionText, recording) {
    this._question = questionText || '';
    this._recording = !!recording;
    this.showPanel('interview');
  }

  clickAt(uv) {
    if (!uv || this.mode === 'hidden') return null;
    const x = uv.x * CANVAS_W;
    const y = (1 - uv.y) * CANVAS_H;
    for (const r of this._rects) {
      if (x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h) {
        const [kind, value] = r.id.split(':');
        if (this.mode === 'dress' && (kind === 'hair' || kind === 'outfit' || kind === 'industry')) {
          this.sel[kind] = value;
          this._applyAvatar();
          this._draw();
        }
        return r.id;
      }
    }
    return null;
  }

  _applyAvatar() {
    this._player.hairCap.material.color.set(HAIR_COLORS[this.sel.hair]);
    this._player.torso.material.color.set(OUTFIT_COLORS[this.sel.outfit]);
  }

  // ---- canvas UI ----

  _draw() {
    const c = this._ctx;
    this._rects = [];
    c.clearRect(0, 0, CANVAS_W, CANVAS_H);
    if (this.mode === 'hidden') { this._texture.needsUpdate = true; return; }
    c.fillStyle = '#f7f4ee';
    c.fillRect(0, 0, CANVAS_W, CANVAS_H);
    c.strokeStyle = '#d8d2c4';
    c.lineWidth = 4;
    c.strokeRect(2, 2, CANVAS_W - 4, CANVAS_H - 4);
    if (this.mode === 'dress') this._drawDress();
    else if (this.mode === 'interview') this._drawInterview();
    else if (this.mode === 'report') this._drawReport();
    this._texture.needsUpdate = true;
  }

  _roundRect(x, y, w, h, r) {
    const c = this._ctx;
    c.beginPath();
    c.moveTo(x + r, y);
    c.arcTo(x + w, y, x + w, y + h, r);
    c.arcTo(x + w, y + h, x, y + h, r);
    c.arcTo(x, y + h, x, y, r);
    c.arcTo(x, y, x + w, y, r);
    c.closePath();
  }

  _drawButton(id, x, y, w, h, label, opts = {}) {
    const c = this._ctx;
    this._rects.push({ id, x, y, w, h });
    this._roundRect(x, y, w, h, opts.radius ?? 14);
    c.fillStyle = opts.bg ?? '#ffffff';
    c.fill();
    c.lineWidth = opts.selected ? 6 : 2;
    c.strokeStyle = opts.selected ? '#ffb400' : (opts.border ?? '#c9c3b6');
    c.stroke();
    let tx = x + w / 2;
    if (opts.swatch) {
      c.beginPath();
      c.arc(x + 26, y + h / 2, 12, 0, Math.PI * 2);
      c.fillStyle = opts.swatch;
      c.fill();
      tx += 12;
    }
    c.fillStyle = opts.fg ?? '#333333';
    c.font = opts.font ?? '28px sans-serif';
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    c.fillText(label, tx, y + h / 2 + 1);
    c.textBaseline = 'alphabetic';
  }

  _drawDress() {
    const c = this._ctx;
    c.fillStyle = '#222222';
    c.font = 'bold 42px sans-serif';
    c.textAlign = 'left';
    c.fillText('면접 준비', 48, 76);
    const rows = [
      { label: '머리', kind: 'hair', y: 118, w: 140,
        items: [['black', '검정'], ['brown', '갈색'], ['blond', '금발'], ['blue', '파랑']] },
      { label: '복장', kind: 'outfit', y: 228, w: 160,
        items: [['suit', '정장'], ['casual', '캐주얼'], ['training', '트레이닝']] },
      { label: '지원 분야', kind: 'industry', y: 338, w: 170,
        items: [['corp', '대기업'], ['startup', '스타트업'], ['public', '공기업']] },
    ];
    for (const row of rows) {
      c.fillStyle = '#555049';
      c.font = 'bold 26px sans-serif';
      c.textAlign = 'left';
      c.fillText(row.label, 48, row.y + 42);
      row.items.forEach(([value, label], i) => {
        const opts = { selected: this.sel[row.kind] === value };
        if (row.kind === 'hair') opts.swatch = HAIR_COLORS[value];
        this._drawButton(`${row.kind}:${value}`, 230 + i * (row.w + 16), row.y, row.w, 64, label, opts);
      });
    }
    this._drawButton('start', CANVAS_W - 48 - 280, CANVAS_H - 48 - 84, 280, 84, '면접 시작',
      { bg: '#2e8b57', fg: '#ffffff', font: 'bold 34px sans-serif', radius: 18, border: '#2e8b57' });
  }

  _drawInterview() {
    const c = this._ctx;
    c.fillStyle = '#8a8478';
    c.font = 'bold 24px sans-serif';
    c.textAlign = 'left';
    c.fillText('면접 질문', 48, 60);
    if (this._recording) {
      c.fillStyle = '#d64545';
      c.beginPath();
      c.arc(CANVAS_W - 64, 52, 12, 0, Math.PI * 2);
      c.fill();
      c.font = 'bold 26px sans-serif';
      c.textAlign = 'right';
      c.fillText('REC', CANVAS_W - 88, 61);
    }
    c.fillStyle = '#222222';
    c.font = '32px sans-serif';
    c.textAlign = 'left';
    this._wrapText(this._question, 48, 116, CANVAS_W - 96, 46);
    const rec = this._recording;
    this._drawButton('answer', (CANVAS_W - 340) / 2, 330, 340, 110, rec ? '답변 중지' : '답변 시작', {
      bg: rec ? '#d64545' : '#2e8b57', fg: '#ffffff',
      font: 'bold 36px sans-serif', radius: 55, border: rec ? '#d64545' : '#2e8b57',
    });
    c.fillStyle = '#9a948a';
    c.font = '22px sans-serif';
    c.textAlign = 'center';
    c.fillText('클릭하여 답변', CANVAS_W / 2, 486);
  }

  _drawReport() {
    const c = this._ctx;
    const d = this._report || { content: 0, body: 0, attire: 0, total: 0, grade: '-', lines: [] };
    const GRADE_COLORS = { S: '#c9a227', A: '#3aa17e', B: '#4a90d9', C: '#b0553f' };
    // header
    c.fillStyle = '#222222';
    c.font = 'bold 46px sans-serif';
    c.textAlign = 'left';
    c.fillText('면접 결과', 48, 72);
    c.fillStyle = '#8a857b';
    c.font = '20px sans-serif';
    c.fillText('INTERVIEW REPORT', 50, 100);
    // grade badge + total (right column)
    c.fillStyle = GRADE_COLORS[d.grade] || '#777777';
    this._roundRect(838, 36, 148, 148, 24);
    c.fill();
    c.fillStyle = '#ffffff';
    c.font = 'bold 96px sans-serif';
    c.textAlign = 'center';
    c.fillText(String(d.grade ?? '-'), 912, 148);
    c.fillStyle = '#333333';
    c.font = '22px sans-serif';
    c.fillText('총점 / TOTAL', 912, 224);
    c.font = 'bold 52px sans-serif';
    c.fillText(String(d.total ?? 0), 912, 274);
    // category bars (color-coded, weighted)
    const rows = [
      ['내용 · 50%', d.content, '#4a90d9'],
      ['태도·시선 · 30%', d.body, '#3aa17e'],
      ['복장 · 20%', d.attire, '#c9a227'],
    ];
    rows.forEach(([label, v, color], i) => {
      const y = 140 + i * 64;
      c.fillStyle = '#44403a';
      c.font = '25px sans-serif';
      c.textAlign = 'left';
      c.fillText(label, 60, y + 24);
      c.fillStyle = '#e3ded2';
      this._roundRect(300, y, 380, 30, 15);
      c.fill();
      const w = Math.max(0, Math.min(100, v || 0)) / 100 * 380;
      if (w > 0) {
        c.fillStyle = color;
        this._roundRect(300, y, Math.max(w, 30), 30, 15);
        c.fill();
      }
      c.fillStyle = '#333333';
      c.font = 'bold 28px sans-serif';
      c.fillText(String(v ?? 0), 696, y + 25);
    });
    // per-answer score chart (optional: d.scores = six answer scores)
    const sc = Array.isArray(d.scores) ? d.scores : [];
    if (sc.length) {
      c.fillStyle = '#b3ac9d';
      c.fillRect(48, 326, 720, 2);
      c.fillStyle = '#44403a';
      c.font = '22px sans-serif';
      c.textAlign = 'left';
      c.fillText('답변별 점수 / PER-ANSWER SCORES', 60, 358);
      const base = 442, maxH = 66, bw = 56, gap = 26, x0 = 76;
      sc.slice(0, 8).forEach((v, i) => {
        const h = Math.max(0, Math.min(100, v || 0)) / 100 * maxH;
        const x = x0 + i * (bw + gap);
        c.fillStyle = v >= 80 ? '#3aa17e' : v >= 70 ? '#d9a441' : '#b0553f';
        c.fillRect(x, base - h, bw, h);
        c.fillStyle = '#333333';
        c.font = 'bold 20px sans-serif';
        c.textAlign = 'center';
        c.fillText(String(v), x + bw / 2, base - h - 8);
        c.fillStyle = '#8a857b';
        c.font = '18px sans-serif';
        c.fillText(i % 2 === 0 ? `Q${i / 2 + 1}` : '꼬리', x + bw / 2, base + 24);
      });
    }
    // feedback lines
    c.fillStyle = '#5a554d';
    c.font = '23px sans-serif';
    c.textAlign = 'left';
    (d.lines || []).slice(0, 4).forEach((ln, i) => {
      c.fillText(`• ${ln}`, 60, 500 + i * 32, 620);
    });
    this._drawButton('restart', CANVAS_W - 48 - 260, CANVAS_H - 48 - 80, 260, 80, '다시 하기',
      { bg: '#4a6fa5', fg: '#ffffff', font: 'bold 32px sans-serif', radius: 18, border: '#4a6fa5' });
  }

  _wrapText(text, x, y, maxW, lineH) {
    const c = this._ctx;
    let line = '';
    for (const ch of String(text)) {
      if (ch === '\n' || c.measureText(line + ch).width > maxW) {
        c.fillText(line, x, y);
        y += lineH;
        line = ch === '\n' ? '' : ch;
      } else line += ch;
    }
    if (line) c.fillText(line, x, y);
  }
}