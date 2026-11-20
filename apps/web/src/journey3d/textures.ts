import * as THREE from 'three';

/**
 * Procedural canvas textures for the 3D journey (no image downloads). All are generated once on
 * the client. Units: the road tile is 13 m wide × 24 m long at 40 px per metre.
 */

function makeCanvas(w: number, h: number) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const ctx = c.getContext('2d');
  if (!ctx) throw new Error('2D canvas unavailable');
  return { c, ctx };
}

export function rng(seed: number) {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => (s = (s * 16807) % 2147483647) / 2147483647;
}

function finish(c: HTMLCanvasElement, rx = 1, ry = 1) {
  const t = new THREE.CanvasTexture(c);
  t.wrapS = THREE.RepeatWrapping;
  t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(rx, ry);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}

/** One carriageway: yellow left edge, two dashed lane lines (3 lanes), white right edge. */
export function roadTexture(lengthM: number) {
  const { c, ctx } = makeCanvas(520, 960);
  const r = rng(7);
  ctx.fillStyle = '#3e3f43';
  ctx.fillRect(0, 0, 520, 960);
  for (let i = 0; i < 70000; i++) {
    const v = (40 + r() * 46) | 0;
    ctx.fillStyle = `rgb(${v},${v},${v + 3})`;
    ctx.fillRect(r() * 520, r() * 960, 1.6, 1.6);
  }
  // Polished wheel paths in each lane, and a few repair patches.
  ctx.fillStyle = 'rgba(0,0,0,0.13)';
  for (const cx of [120, 264, 408]) {
    ctx.fillRect(cx - 46, 0, 20, 960);
    ctx.fillRect(cx + 26, 0, 20, 960);
  }
  for (let i = 0; i < 7; i++) {
    ctx.fillStyle = `rgba(18,18,20,${0.12 + r() * 0.16})`;
    ctx.fillRect(r() * 470, r() * 880, 30 + r() * 70, 40 + r() * 140);
  }
  const paint = (x: number, y: number, w: number, h: number, col: string) => {
    ctx.fillStyle = col;
    ctx.fillRect(x, y, w, h);
    ctx.fillStyle = 'rgba(70,70,72,0.35)';
    for (let i = 0; i < (w * h) / 26; i++) ctx.fillRect(x + r() * w, y + r() * h, 1.5, 1.5);
  };
  paint(45, 0, 7, 960, '#E8C33A');
  for (const x of [192, 336]) {
    paint(x - 3, 0, 6, 120, '#EDEDED');
    paint(x - 3, 480, 6, 120, '#EDEDED');
  }
  paint(476, 0, 7, 960, '#EDEDED');
  return finish(c, 1, lengthM / 24);
}

/** Wind-rippled desert sand. */
export function sandTexture(repeat: number) {
  const { c, ctx } = makeCanvas(512, 512);
  const r = rng(11);
  const g = ctx.createLinearGradient(0, 0, 512, 512);
  g.addColorStop(0, '#DDB37E');
  g.addColorStop(1, '#D3A56E');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 50000; i++) {
    const v = r();
    ctx.fillStyle = v > 0.5 ? `rgba(255,236,200,${v * 0.25})` : `rgba(140,96,52,${v * 0.3})`;
    ctx.fillRect(r() * 512, r() * 512, 1.5, 1.5);
  }
  ctx.strokeStyle = 'rgba(150,104,58,0.18)';
  ctx.lineWidth = 2;
  for (let y = 0; y < 512; y += 9) {
    ctx.beginPath();
    for (let x = 0; x <= 512; x += 8) ctx.lineTo(x, y + Math.sin(x / 26 + y) * 3);
    ctx.stroke();
  }
  return finish(c, repeat, repeat);
}

/** Port quay concrete with slab joints. */
export function concreteTexture(repeat: number) {
  const { c, ctx } = makeCanvas(256, 256);
  const r = rng(3);
  ctx.fillStyle = '#9A9DA3';
  ctx.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 20000; i++) {
    const v = (130 + r() * 50) | 0;
    ctx.fillStyle = `rgba(${v},${v},${v + 2},0.5)`;
    ctx.fillRect(r() * 256, r() * 256, 1.5, 1.5);
  }
  ctx.strokeStyle = 'rgba(40,40,44,0.45)';
  ctx.lineWidth = 2;
  ctx.strokeRect(1, 1, 254, 254);
  return finish(c, repeat, repeat);
}

/** Corrugated steel container side with a little logo plate. */
export function containerTexture(color: string, logo = false) {
  const { c, ctx } = makeCanvas(512, 220);
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, 512, 220);
  for (let x = 0; x < 512; x += 12) {
    ctx.fillStyle = 'rgba(255,255,255,0.12)';
    ctx.fillRect(x, 0, 3, 220);
    ctx.fillStyle = 'rgba(0,0,0,0.22)';
    ctx.fillRect(x + 7, 0, 4, 220);
  }
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  ctx.fillRect(0, 0, 512, 8);
  ctx.fillRect(0, 212, 512, 8);
  if (logo) {
    ctx.fillStyle = 'rgba(11,27,58,0.85)';
    ctx.fillRect(40, 70, 170, 60);
    ctx.fillStyle = '#FFC62B';
    ctx.fillRect(56, 92, 138, 16);
  }
  const t = finish(c);
  t.wrapS = THREE.ClampToEdgeWrapping;
  return t;
}

/** Plywood crate. */
export function crateTexture() {
  const { c, ctx } = makeCanvas(256, 256);
  const r = rng(5);
  ctx.fillStyle = '#C99357';
  ctx.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 300; i++) {
    ctx.strokeStyle = `rgba(120,78,36,${0.1 + r() * 0.2})`;
    ctx.beginPath();
    const y = r() * 256;
    ctx.moveTo(0, y);
    ctx.bezierCurveTo(80, y + r() * 10, 170, y - r() * 10, 256, y + r() * 6);
    ctx.stroke();
  }
  ctx.strokeStyle = '#8E5E2C';
  ctx.lineWidth = 14;
  ctx.strokeRect(7, 7, 242, 242);
  ctx.beginPath();
  ctx.moveTo(14, 14);
  ctx.lineTo(242, 242);
  ctx.stroke();
  return finish(c);
}

/** Corrugated cladding for sheds. */
export function claddingTexture(repeatX: number) {
  const { c, ctx } = makeCanvas(256, 64);
  ctx.fillStyle = '#C9CED6';
  ctx.fillRect(0, 0, 256, 64);
  for (let x = 0; x < 256; x += 8) {
    ctx.fillStyle = 'rgba(0,0,0,0.12)';
    ctx.fillRect(x + 5, 0, 3, 64);
  }
  return finish(c, repeatX, 1);
}

/** Tower facade: window grid, some windows lit. */
export function facadeTexture(seed: number, tint = '#5D7186') {
  const { c, ctx } = makeCanvas(128, 256);
  const r = rng(seed);
  ctx.fillStyle = tint;
  ctx.fillRect(0, 0, 128, 256);
  for (let y = 4; y < 256; y += 10)
    for (let x = 4; x < 128; x += 9) {
      const lit = r() > 0.82;
      ctx.fillStyle = lit ? 'rgba(255,214,150,0.9)' : `rgba(20,30,44,${0.35 + r() * 0.3})`;
      ctx.fillRect(x, y, 6, 6);
    }
  return finish(c, 1, 1);
}

/** UAE-style green overhead sign. */
export function signTexture(en: string, ar: string, sub: string) {
  const { c, ctx } = makeCanvas(1024, 400);
  ctx.fillStyle = '#0B6B3A';
  ctx.fillRect(0, 0, 1024, 400);
  ctx.strokeStyle = '#FFFFFF';
  ctx.lineWidth = 12;
  ctx.strokeRect(16, 16, 992, 368);
  ctx.fillStyle = '#FFFFFF';
  ctx.font = '600 104px Inter, Arial, sans-serif';
  ctx.textBaseline = 'middle';
  ctx.fillText(en, 60, 150);
  ctx.font = '600 96px "IBM Plex Sans Arabic", Arial, sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText(ar, 964, 150);
  ctx.textAlign = 'left';
  ctx.font = '500 52px Inter, Arial, sans-serif';
  ctx.fillText(sub, 60, 300);
  ctx.fillRect(820, 270, 120, 12);
  ctx.beginPath();
  ctx.moveTo(940, 252);
  ctx.lineTo(980, 276);
  ctx.lineTo(940, 300);
  ctx.fill();
  const t = finish(c);
  t.wrapS = THREE.ClampToEdgeWrapping;
  t.wrapT = THREE.ClampToEdgeWrapping;
  return t;
}
