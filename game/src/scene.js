// Scene generation: one base landscape, then DIFF_COUNT differences applied
// to one side or the other. A difference is:
//   { type, x, y, r, color, altColor }
//   type 'extra'    — shape exists only on the right
//   type 'missing'  — shape exists only on the left
//   type 'recolor'  — same shape on both sides, different color on the right
import { createRandom } from './random.js';

export const W = 480;
export const H = 360;
export const DIFF_COUNT = 5;

const PALETTE = {
  sky: ['#87ceeb', '#f7d794', '#b8e0d2', '#f6b8b8', '#c3b8e8'],
  hill: ['#5aa469', '#8a9a5b', '#4d8f6f', '#7a9e4f', '#6b9e78'],
  sun: ['#ffd93d', '#ffb347', '#ffe066', '#ff9f43', '#ffd32a'],
};
const SHAPE_COLORS = ['#ff6b6b', '#48dbfb', '#1dd1a1', '#feca57', '#ff9ff3', '#ffffff'];
const ALT_COLORS = ['#48dbfb', '#ff6b6b', '#feca57', '#1dd1a1', '#ff9ff3', '#f368e0'];

export function makeScene(seed) {
  const rnd = createRandom(seed);
  const pick = (arr) => arr[Math.floor(rnd() * arr.length)];
  const scene = {
    sky: pick(PALETTE.sky),
    hill: pick(PALETTE.hill),
    sun: pick(PALETTE.sun),
    sunX: 60 + rnd() * (W - 120),
    sunY: 40 + rnd() * 60,
    clouds: [],
    trees: [],
    house: { x: 150 + rnd() * 180, y: 190 + rnd() * 40, w: 90, h: 70 },
    flowers: [],
  };
  const nClouds = 2 + Math.floor(rnd() * 2);
  for (let i = 0; i < nClouds; i++) {
    scene.clouds.push({ x: 30 + rnd() * (W - 100), y: 30 + rnd() * 70, s: 0.7 + rnd() * 0.6 });
  }
  const nTrees = 3 + Math.floor(rnd() * 3);
  for (let i = 0; i < nTrees; i++) {
    scene.trees.push({ x: 20 + rnd() * (W - 40), y: 230 + rnd() * 60, s: 0.8 + rnd() * 0.5 });
  }
  const nFlowers = 6 + Math.floor(rnd() * 5);
  for (let i = 0; i < nFlowers; i++) {
    scene.flowers.push({ x: 15 + rnd() * (W - 30), y: 300 + rnd() * 45, c: pick(['#ff6b6b', '#feca57', '#f368e0', '#ffffff']) });
  }
  // Choose DIFF_COUNT well-separated difference spots.
  const diffs = [];
  let guard = 0;
  while (diffs.length < DIFF_COUNT && guard++ < 500) {
    const d = {
      type: ['extra', 'missing', 'recolor'][Math.floor(rnd() * 3)],
      x: 30 + rnd() * (W - 60),
      y: 90 + rnd() * (H - 130),
      r: 10 + rnd() * 8,
      color: pick(SHAPE_COLORS),
      altColor: pick(ALT_COLORS),
    };
    if (diffs.every((o) => Math.hypot(o.x - d.x, o.y - d.y) > 70)) diffs.push(d);
  }
  return { scene, diffs, seed };
}

function drawDiffShape(ctx, d, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = 'rgba(0,0,0,0.35)';
  ctx.lineWidth = 2;
  ctx.stroke();
}

// Draw the base scene plus the differences that belong to `side`.
// Differences already in `found` are omitted (both sides look identical there).
export function drawScene(ctx, scene, diffs, side, found) {
  // sky
  ctx.fillStyle = scene.sky;
  ctx.fillRect(0, 0, W, H);
  // sun
  ctx.fillStyle = scene.sun;
  ctx.beginPath();
  ctx.arc(scene.sunX, scene.sunY, 24, 0, Math.PI * 2);
  ctx.fill();
  // clouds
  ctx.fillStyle = 'rgba(255,255,255,0.9)';
  for (const c of scene.clouds) {
    ctx.beginPath();
    ctx.ellipse(c.x, c.y, 26 * c.s, 12 * c.s, 0, 0, Math.PI * 2);
    ctx.ellipse(c.x + 18 * c.s, c.y + 3, 18 * c.s, 10 * c.s, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  // hill
  ctx.fillStyle = scene.hill;
  ctx.beginPath();
  ctx.moveTo(0, H);
  ctx.quadraticCurveTo(W * 0.3, H - 110, W * 0.6, H - 60);
  ctx.quadraticCurveTo(W * 0.8, H - 30, W, H - 70);
  ctx.lineTo(W, H);
  ctx.fill();
  // house
  const h = scene.house;
  ctx.fillStyle = '#8d6e63';
  ctx.fillRect(h.x, h.y, h.w, h.h);
  ctx.fillStyle = '#5d4037';
  ctx.beginPath();
  ctx.moveTo(h.x - 8, h.y);
  ctx.lineTo(h.x + h.w / 2, h.y - 34);
  ctx.lineTo(h.x + h.w + 8, h.y);
  ctx.fill();
  ctx.fillStyle = '#ffe082';
  ctx.fillRect(h.x + 12, h.y + 18, 18, 18);
  ctx.fillRect(h.x + h.w - 30, h.y + 18, 18, 18);
  ctx.fillStyle = '#4e342e';
  ctx.fillRect(h.x + h.w / 2 - 10, h.y + h.h - 30, 20, 30);
  // trees
  for (const t of scene.trees) {
    ctx.fillStyle = '#6d4c41';
    ctx.fillRect(t.x - 3 * t.s, t.y - 18 * t.s, 6 * t.s, 18 * t.s);
    ctx.fillStyle = '#2e7d32';
    ctx.beginPath();
    ctx.arc(t.x, t.y - 26 * t.s, 14 * t.s, 0, Math.PI * 2);
    ctx.fill();
  }
  // flowers
  for (const f of scene.flowers) {
    ctx.fillStyle = f.c;
    ctx.beginPath();
    ctx.arc(f.x, f.y, 4, 0, Math.PI * 2);
    ctx.fill();
  }
  // differences for this side (skip ones already found)
  for (let i = 0; i < diffs.length; i++) {
    if (found.has(i)) continue;
    const d = diffs[i];
    if (d.type === 'extra' && side === 'right') drawDiffShape(ctx, d, d.color);
    else if (d.type === 'missing' && side === 'left') drawDiffShape(ctx, d, d.color);
    else if (d.type === 'recolor') drawDiffShape(ctx, d, side === 'right' ? d.altColor : d.color);
  }
}
