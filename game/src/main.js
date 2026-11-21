// Boot, input, and game state: click a difference on either panel to mark it.
import { makeScene, drawScene, W, H, DIFF_COUNT } from './scene.js';

const leftCanvas = document.getElementById('left');
const rightCanvas = document.getElementById('right');
const left = leftCanvas.getContext('2d');
const right = rightCanvas.getContext('2d');
const statusEl = document.getElementById('status');
const counterEl = document.getElementById('counter');
const hintBtn = document.getElementById('hint');
const newBtn = document.getElementById('new');

let seed = (Math.random() * 4294967296) >>> 0;
const params = new URLSearchParams(location.search);
if (params.get('seed')) seed = Number(params.get('seed')) >>> 0;

let model = null;
let found = new Set();
let hints = 3;
let marks = []; // transient click/hint markers: {x, y, ok, hint}

function load() {
  model = makeScene(seed);
  found = new Set();
  marks = [];
  hints = 3;
  hintBtn.textContent = `Hint (${hints})`;
  hintBtn.disabled = false;
  statusEl.style.color = '';
  counterEl.textContent = `Remaining: ${DIFF_COUNT}`;
  statusEl.textContent = 'Click a difference on either picture.';
  paint();
}

function paint() {
  drawScene(left, model.scene, model.diffs, 'left', found);
  drawScene(right, model.scene, model.diffs, 'right', found);
  // green rings on both panels for found differences
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
  // transient markers
  for (const m of marks) {
    for (const ctx of [left, right]) {
      ctx.strokeStyle = m.ok ? '#06d6a0' : '#e5534b';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(m.x, m.y, m.hint ? m.hintRadius : 10, 0, Math.PI * 2);
      ctx.stroke();
      if (!m.ok && !m.hint) {
        ctx.beginPath();
        ctx.moveTo(m.x - 7, m.y - 7);
        ctx.lineTo(m.x + 7, m.y + 7);
        ctx.moveTo(m.x + 7, m.y - 7);
        ctx.lineTo(m.x - 7, m.y + 7);
        ctx.stroke();
      }
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

function handleClick(ev) {
  if (found.size === DIFF_COUNT) return;
  const p = canvasPos(ev.currentTarget, ev);
  let hit = -1;
  for (let i = 0; i < model.diffs.length; i++) {
    if (found.has(i)) continue;
    const d = model.diffs[i];
    if (Math.hypot(p.x - d.x, p.y - d.y) <= d.r + 8) { hit = i; break; }
  }
  if (hit >= 0) {
    found.add(hit);
    marks.push({ x: p.x, y: p.y, ok: true });
    counterEl.textContent = `Remaining: ${DIFF_COUNT - found.size}`;
    if (found.size === DIFF_COUNT) {
      statusEl.textContent = 'All five found! Press New scene for another round.';
      statusEl.style.color = '#06d6a0';
    } else {
      statusEl.textContent = 'Found one! Keep hunting.';
      statusEl.style.color = '';
    }
  } else {
    marks.push({ x: p.x, y: p.y, ok: false });
    statusEl.textContent = 'Nothing there. Look closer.';
    statusEl.style.color = '';
  }
  paint();
}

leftCanvas.addEventListener('click', handleClick);
rightCanvas.addEventListener('click', handleClick);

hintBtn.addEventListener('click', () => {
  if (hints <= 0) return;
  const remaining = model.diffs.map((d, i) => i).filter((i) => !found.has(i));
  if (!remaining.length) return;
  const i = remaining[Math.floor(Math.random() * remaining.length)];
  const d = model.diffs[i];
  hints--;
  hintBtn.textContent = `Hint (${hints})`;
  if (hints === 0) hintBtn.disabled = true;
  marks.push({ x: d.x, y: d.y, ok: true, hint: true, hintRadius: d.r + 10 });
  statusEl.textContent = 'Hint: a difference is circled on both pictures.';
  statusEl.style.color = '';
  paint();
  setTimeout(() => { marks = marks.filter((m) => !m.hint); paint(); }, 1500);
});

newBtn.addEventListener('click', () => {
  seed = (Math.random() * 4294967296) >>> 0;
  load();
});

load();
