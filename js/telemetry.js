// telemetry.js — camera-derived body-language telemetry for the VR interview.
// Tracks eye contact, head fidgeting, and bows from the camera pose each frame.
// No DOM access; all math via THREE.

import * as THREE from 'three';

const EYE_CONTACT_ANGLE = THREE.MathUtils.degToRad(15); // forward within 15° of target = contact
const BOW_DOWN_PITCH = THREE.MathUtils.degToRad(-35);   // pitch below this = bowing
const BOW_UP_PITCH = THREE.MathUtils.degToRad(-15);     // pitch back above this = bow finished
const BOW_DEBOUNCE_S = 1.0;
const FIDGET_FULL_SCALE = 0.5;  // angular-speed stddev (rad/s) that maps to fidget 1.0
const RING_SIZE = 120;          // ~2s of samples at 60 fps

const clamp01 = (x) => Math.max(0, Math.min(1, x));

export class Telemetry {
  constructor() {
    // Scratch objects reused every frame (no per-frame allocation).
    this._q = new THREE.Quaternion();
    this._prevQ = new THREE.Quaternion();
    this._dq = new THREE.Quaternion();
    this._euler = new THREE.Euler();
    this._forward = new THREE.Vector3();
    this._camPos = new THREE.Vector3();
    this._toTarget = new THREE.Vector3();
    // Ring buffer of angular speeds with running sums for O(1) rolling stddev.
    this._ring = new Float64Array(RING_SIZE);
    this.start(); // initialise counters; active flag set false right after
    this._active = false;
  }

  // Begin a sampling window; reset all counters.
  start() {
    this._active = true;
    this._frames = 0;
    this._contactFrames = 0;
    this._time = 0;
    this._hasPrev = false;
    this._ringIdx = 0;
    this._ringCount = 0;
    this._sum = 0;
    this._sumSq = 0;
    this._fidget = 0;
    this._bowing = false;
    this._lastBowTime = -Infinity;
    this._bows = 0;
  }

  stop() {
    this._active = false;
  }

  // Per-frame update. camera = THREE camera, targetPos = interviewer head world
  // position (THREE.Vector3), dt = seconds since last frame.
  sample(camera, targetPos, dt) {
    if (!this._active) return;
    this._time += dt;
    this._frames += 1;

    camera.getWorldQuaternion(this._q);
    camera.getWorldPosition(this._camPos);

    // --- Eye contact: camera world-forward vs direction to the interviewer ---
    this._forward.set(0, 0, -1).applyQuaternion(this._q);
    this._toTarget.copy(targetPos).sub(this._camPos);
    if (this._toTarget.lengthSq() > 1e-12) {
      this._toTarget.normalize();
      if (this._forward.angleTo(this._toTarget) <= EYE_CONTACT_ANGLE) {
        this._contactFrames += 1;
      }
    }

    // --- Fidget: per-frame yaw+pitch angular speed into the ring buffer ---
    if (this._hasPrev && dt > 0) {
      // Delta rotation since last frame, decomposed to yaw (y) + pitch (x).
      this._dq.copy(this._prevQ).invert().multiply(this._q);
      this._euler.setFromQuaternion(this._dq, 'YXZ');
      const speed = (Math.abs(this._euler.y) + Math.abs(this._euler.x)) / dt;
      this._pushSpeed(speed);
      this._fidget = clamp01(this._rollingStdDev() / FIDGET_FULL_SCALE);
    }
    this._prevQ.copy(this._q);
    this._hasPrev = true;

    // --- Bow: pitch dips below -35° and returns above -15° ---
    const pitch = Math.asin(THREE.MathUtils.clamp(this._forward.y, -1, 1));
    if (!this._bowing && pitch < BOW_DOWN_PITCH) {
      this._bowing = true;
    } else if (this._bowing && pitch > BOW_UP_PITCH) {
      this._bowing = false;
      if (this._time - this._lastBowTime >= BOW_DEBOUNCE_S) {
        this._bows += 1;
        this._lastBowTime = this._time;
      }
    }
  }

  // -> {eyePct: 0..1, fidget: 0..1, bows: int}
  results() {
    return {
      eyePct: this._frames > 0 ? this._contactFrames / this._frames : 0,
      fidget: this._fidget,
      bows: this._bows,
    };
  }

  // Composite body-language score, 0..100.
  bodyScore() {
    const { eyePct, fidget, bows } = this.results();
    const raw = eyePct * 100 - fidget * 40 + Math.min(bows, 2) * 5;
    return Math.round(THREE.MathUtils.clamp(raw, 0, 100));
  }

  // Live HUD two-liner (Korean + English), e.g. '시선 62% · 움직임 0.31 · 인사 1'.
  hudText() {
    const { eyePct, fidget, bows } = this.results();
    const eye = Math.round(eyePct * 100), f = fidget.toFixed(2);
    return `시선 ${eye}% · 움직임 ${f} · 인사 ${bows}\nEye ${eye}% · Fidget ${f} · Bows ${bows}`;
  }

  // ---- internals -------------------------------------------------------------

  _pushSpeed(speed) {
    if (this._ringCount < RING_SIZE) {
      this._ring[this._ringIdx] = speed;
      this._sum += speed;
      this._sumSq += speed * speed;
      this._ringCount += 1;
    } else {
      const old = this._ring[this._ringIdx];
      this._ring[this._ringIdx] = speed;
      this._sum += speed - old;
      this._sumSq += speed * speed - old * old;
    }
    this._ringIdx = (this._ringIdx + 1) % RING_SIZE;
  }

  _rollingStdDev() {
    const n = this._ringCount;
    if (n < 2) return 0;
    const mean = this._sum / n;
    const variance = Math.max(0, this._sumSq / n - mean * mean);
    return Math.sqrt(variance);
  }
}