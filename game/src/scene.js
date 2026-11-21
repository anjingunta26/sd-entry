// Scene generation and rendering for "Find the Five".
// One base landscape is generated from a seed; then DIFF_COUNT differences
// are placed on it. Each difference is one of:
//   { type: 'extra',   ... } — shape drawn only on the right canvas
//   { type: 'missing', ... } — shape drawn only on the left canvas
//   { type: 'recolor', ... } — same shape on both, altColor on the right
// drawScene(ctx, scene, diffs, side, found) renders one panel; differences
// whose index is in `found` are skipped on BOTH sides (already solved).
import { makeHelpers } from './random.js';

export const W = 480;
export const H = 360;
export const DIFF_COUNT = 5;

const SKY_COLORS = ['#87ceeb', '#f7d794', '#b8e0d2', '#f6b8b8', '#c3b8e8'];
const HILL_COLORS = ['#5aa469', '#8a9a5b', '#4d8f6f', '#7a9e4f', '#6b9e78'];
const SUN_COLORS = ['#ffd93d', '#ffb347', '#ffe066', '#ff9f43', '#ffd32a'];
const SHAPE_COLORS = ['#ff6b6b', '#48dbfb', '#1dd1a1', '#feca57', '#ff9ff3', '#ffffff'];
const ALT_COLORS = ['#48dbfb', '#ff6b6b', '#feca57', '#1dd1a1', '#ff9ff3', '#f368e0'];
const FLOWER_COLORS = ['#ff6b6b', '#feca57', '#f368e0', '#ffffff'];

export function makeScene(seed) {
  const r = makeHelpers(seed);
  const scene = {
    sky: r.pick(SKY_COLORS),
    hill: r.pick(HILL_COLORS),
    sun: r.pick(SUN_COLORS),
    sunX: r.range(60, W - 60),
    sunY: r.range(40, 100),
    clouds: [],
    trees: [],
    house: { x: r.range(150, 330), y: r.range(190, 230), w: 90, h: 70 },
    flowers: [],
  };

  const nClouds = r.int(2, 3);
  for (let i = 0; i < nClouds; i++) {
    scene.clouds.push({ x: r.range(40, W - 90), y: r.range(30, 100), s: r.range(0.7, 1.3) });
  }
  const nTrees = r.int(3, 5);
  for (let i = 0; i < nTrees; i++) {
    scene.trees.push({ x: r.range(20, W - 20), y: r.range(235, 290), s: r.range(0.8, 1.3) });
  }
  const nFlowers = r.int(6, 10);
  for (let i = 0; i < nFlowers; i++) {
    scene.flowers.push({ x: r.range(15, W - 15), y: r.range(305, H - 15), c: r.pick(FLOWER_COLORS) });
  }

  // Place exactly DIFF_COUNT differences, kept well apart so they are fair.
  const diffs = [];
  let guard = 0;
  while (diffs.length < DIFF_COUNT && guard++ < 1000) {
    const d = {
      type: r.pick(['extra', 'missing', 'recolor']),
      x: r.range(30, W - 30),
      y: r.range(95, H - 30),
      r: r.range(10, 18),
      color: r.pick(SHAPE_COLORS),
      altColor: r.pick(ALT_COLORS),
    };
    if (diffs.every((o) => Math.hypot(o.x - d.x, o.y - d.y) > 70)) diffs.push(d);
  }
  return { seed, scene, diffs };
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
  // this side's differences (skip already-found ones)
  for (let i = 0; i < diffs.length; i++) {
    if (found.has(i)) continue;
    const d = diffs[i];
    if (d.type === 'extra' && side === 'right') drawDiffShape(ctx, d, d.color);
    else if (d.type === 'missing' && side === 'left') drawDiffShape(ctx, d, d.color);
    else if (d.type === 'recolor') drawDiffShape(ctx, d, side === 'right' ? d.altColor : d.color);
  }
}
