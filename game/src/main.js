// Boot, input, game loop: click a difference in the right panel to mark it.
import { makeScene, drawScene, W, H, DIFF_COUNT } from './scene.js';

const left = document.getElementById('left').getContext('2d');
const right = document.getElementById('right').getContext('2d');
const statusEl = document.getElementById('status');
const counterEl = document.getElementById('counter');
const hintBtn = document.getElementById('hint');
const newBtn = document.getElementById('new');

let seed = (Math.random() * 4294967296) >>> 0;
const params = new URLSearchParams(location.search);
if (params.get('seed')) seed = Number(params.get('seed')) >>> 0;
const prefound = (params.get('found') || '').split(',').filter(Boolean).map(Number);
let model = null;
let found = new Set();
let hints = 3;
let marks = []; // {x,y,ok}

function load() {
  model = makeScene(seed);
  found = new Set(prefound.filter((i) => model.diffs[i]));
  marks = [];
  hints = 3;
  hintBtn.textContent = `Hint (${hints})`;
  counterEl.textContent = `Remaining: ${DIFF_COUNT}`;
  statusEl.textContent = 'Click a difference in the right picture.';
  paint();
}

function paint() {
  drawScene(left, model.scene, model.diffs, 'left', new Set([...found].filter((i) => model.diffs[i].side === 'left')));
  drawScene(right, model.scene, model.diffs, 'right', new Set([...found].filter((i) => model.diffs[i].side === 'right')));
  // draw markers on both panels for found diffs
  for (const i of found) {
    const d = model.diffs[i];
    for (const ctx of [left, right]) {
      ctx.strokeStyle = '#06d6a0';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(d.x, d.y, d.r + 6, 0, Math.PI * 2);
      ctx.stroke();
    }
  }
  for (const m of marks) {
    const ctx = m.right ? right : left;
    ctx.strokeStyle = m.ok ? '#06d6a0' : '#e5534b';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(m.x, m.y, 10, 0, Math.PI * 2);
    ctx.stroke();
    if (!m.ok) {
      ctx.beginPath();
      ctx.moveTo(m.x - 7, m.y - 7);
      ctx.lineTo(m.x + 7, m.y + 7);
      ctx.moveTo(m.x + 7, m.y - 7);
      ctx.lineTo(m.x - 7, m.y + 7);
      ctx.stroke();
    }
  }
}

function canvasPos(canvas, ev) {
  const r = canvas.getBoundingClientRect();
  return {
    x: ((ev.clientX - r.left) / r.width) * W,
    y: ((ev.clientY - r.top) / r.height) * H,
  };
}

document.getElementById('right').addEventListener('click', (ev) => {
  const p = canvasPos(ev.currentTarget, ev);
  let hit = -1;
  for (let i = 0; i < model.diffs.length; i++) {
    if (found.has(i)) continue;
    const d = model.diffs[i];
    if (Math.hypot(p.x - d.x, p.y - d.y) <= d.r + 8) { hit = i; break; }
  }
  if (hit >= 0) {
    found.add(hit);
    marks.push({ x: p.x, y: p.y, ok: true, right: true });
    counterEl.textContent = `Remaining: ${DIFF_COUNT - found.size}`;
    if (found.size === DIFF_COUNT) {
      statusEl.textContent = 'All found! Press New scene for another round.';
      statusEl.style.color = '#06d6a0';
    } else {
      statusEl.textContent = 'Found one! Keep hunting.';
    }
  } else {
    marks.push({ x: p.x, y: p.y, ok: false, right: true });
    statusEl.textContent = 'Nothing there. Look closer.';
  }
  paint();
});

hintBtn.addEventListener('click', () => {
  if (hints <= 0) return;
  const left = model.diffs.map((d, i) => i).filter((i) => !found.has(i));
  if (!left.length) return;
  const i = left[Math.floor(Math.random() * left.length)];
  const d = model.diffs[i];
  hints--;
  hintBtn.textContent = `Hint (${hints})`;
  marks.push({ x: d.x, y: d.y, ok: true, right: true, hint: true });
  // reveal: pulse marker by drawing a ring (not counted as found)
  paint();
  setTimeout(paint, 400);
});

newBtn.addEventListener('click', () => {
  seed = (Math.random() * 4294967296) >>> 0;
  statusEl.style.color = '';
  load();
});

load();
