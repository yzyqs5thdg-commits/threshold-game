// THRESHOLD fx: "ambient" — the full-viewport background behind the whole desk.
//
// Purely decorative. This module receives no information about the participant, the condition
// or any decision; it only knows its own theme and renders identically for everyone. Nothing it
// draws carries meaning: unlabeled drifting points, faint links between neighbours, soft light
// pulses travelling along a few long lines, slow wireframe orbit rings in the corners and a
// vertical scan band that drifts across the screen.
//
// Budget: ~60–90 particles, 4 data lines, 2 ring clusters. Capped at 30 fps, paused while the
// document is hidden, DPR-aware resize, and under prefers-reduced-motion it paints ONE static frame
// and stops. All element alphas stay <= ~0.18 so the layer never competes with text.

const PALETTE = {
  ink: [232, 237, 248],     // --ink
  ink2: [170, 182, 208],    // --ink-2
  amber: [233, 185, 76],    // --amber
  amber2: [243, 207, 122],  // --amber-2
  signal: [127, 179, 255],  // --signal
  line2: [47, 65, 105],     // --line-2
};

const rgba = (c, a) => `rgba(${c[0]},${c[1]},${c[2]},${a.toFixed(3)})`;
const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
const lerp = (a, b, t) => a + (b - a) * t;
const TAU = Math.PI * 2;

/** Small deterministic PRNG so the field looks the same on every mount (seeded, not condition-dependent). */
function makeRng(seed) {
  let s = seed >>> 0 || 1;
  return () => {
    s ^= s << 13; s >>>= 0;
    s ^= s >>> 17;
    s ^= s << 5; s >>>= 0;
    return s / 4294967296;
  };
}

/**
 * Mount the ambient background on a <canvas>.
 * @param {HTMLCanvasElement} canvas  Positioned by the integrator (fixed, full viewport, z-index 0).
 * @param {object} [opts]
 * @param {number} [opts.maxFps=30]      Frame cap.
 * @param {number} [opts.density=1]      Particle density multiplier (count still clamped to 60–90).
 * @param {number} [opts.maxDpr=2]       Device pixel ratio cap.
 * @param {number} [opts.seed=7]         PRNG seed for the layout.
 * @returns {{ stop(): void }}
 */
export function mountAmbient(canvas, opts = {}) {
  if (!canvas || typeof canvas.getContext !== 'function') return { stop() {} };
  const ctx = canvas.getContext('2d', { alpha: true });
  if (!ctx) return { stop() {} };

  const maxFps = clamp(Number(opts.maxFps) || 30, 1, 30);
  const frameMs = 1000 / maxFps;
  const density = clamp(Number(opts.density) || 1, 0.25, 2);
  const maxDpr = clamp(Number(opts.maxDpr) || 2, 1, 3);
  const rng = makeRng(Number(opts.seed) || 7);

  const mq = typeof matchMedia === 'function' ? matchMedia('(prefers-reduced-motion: reduce)') : null;
  let reduced = !!(mq && mq.matches);

  // ---- state -------------------------------------------------------------------------------
  let w = 0, h = 0, dpr = 1;
  let particles = [];
  let lines = [];
  let rings = [];
  let raf = 0;
  let running = false;
  let stopped = false;
  let lastFrame = 0;
  let simTime = 0;            // ms of simulated time (does not advance while hidden)
  let lastTick = 0;

  // ---- layout -----------------------------------------------------------------------------
  function measure() {
    const rect = canvas.getBoundingClientRect();
    const cw = Math.max(1, Math.round(rect.width || canvas.clientWidth || window.innerWidth || 1));
    const ch = Math.max(1, Math.round(rect.height || canvas.clientHeight || window.innerHeight || 1));
    const ndpr = clamp(window.devicePixelRatio || 1, 1, maxDpr);
    if (cw === w && ch === h && ndpr === dpr) return false;
    w = cw; h = ch; dpr = ndpr;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return true;
  }

  function buildParticles() {
    const area = w * h;
    const target = Math.round(clamp((area / (1280 * 800)) * 80 * density, 60, 90));
    const prev = particles;
    particles = [];
    for (let i = 0; i < target; i++) {
      const p = prev[i];
      if (p) {
        // keep existing motion, re-fit position into new bounds
        p.x = clamp(p.x, 0, w); p.y = clamp(p.y, 0, h);
        particles.push(p);
        continue;
      }
      const ang = rng() * TAU;
      const spd = lerp(5, 13, rng()); // px per second
      const roll = rng();
      const tint = roll < 0.72 ? PALETTE.ink : roll < 0.9 ? PALETTE.signal : PALETTE.amber2;
      particles.push({
        x: rng() * w, y: rng() * h,
        vx: Math.cos(ang) * spd, vy: Math.sin(ang) * spd,
        r: lerp(0.7, 1.8, rng()),
        phase: rng() * TAU,
        twinkle: lerp(0.25, 0.6, rng()), // rad per second
        tint,
        bright: tint === PALETTE.ink ? 1 : 1.15,
      });
    }
  }

  function buildLines() {
    // Long, gently curved paths spanning the viewport in normalized coords. Quadratic beziers.
    const defs = [
      { a: [-0.05, 0.22], c: [0.45, 0.08], b: [1.05, 0.34], tint: PALETTE.signal },
      { a: [-0.05, 0.78], c: [0.40, 0.92], b: [1.05, 0.58], tint: PALETTE.amber },
      { a: [0.18, -0.05], c: [0.30, 0.55], b: [0.12, 1.05], tint: PALETTE.ink2 },
      { a: [0.86, -0.05], c: [0.74, 0.45], b: [0.92, 1.05], tint: PALETTE.signal },
    ];
    lines = defs.map((d, i) => {
      const old = lines[i];
      return {
        ...d,
        pulses: old ? old.pulses : [],
        nextSpawn: old ? old.nextSpawn : simTime + lerp(600, 3500, rng()),
        speed: lerp(0.10, 0.16, rng()), // fraction of path per second
      };
    });
  }

  function buildRings() {
    rings = [
      { cx: 0.93, cy: 0.10, scale: 0.34, spin: 1, tint: PALETTE.signal },
      { cx: 0.06, cy: 0.94, scale: 0.28, spin: -1, tint: PALETTE.amber },
    ];
  }

  function layout(force) {
    const changed = measure();
    if (changed || force) {
      buildParticles();
      buildLines();
      buildRings();
    }
    return changed;
  }

  // ---- geometry helpers ---------------------------------------------------------------------
  function bezierPoint(l, t) {
    const mt = 1 - t;
    const ax = l.a[0] * w, ay = l.a[1] * h;
    const cx = l.c[0] * w, cy = l.c[1] * h;
    const bx = l.b[0] * w, by = l.b[1] * h;
    return [
      mt * mt * ax + 2 * mt * t * cx + t * t * bx,
      mt * mt * ay + 2 * mt * t * cy + t * t * by,
    ];
  }

  // ---- simulation -----------------------------------------------------------------------------
  function step(dtMs) {
    const dt = dtMs / 1000;
    for (const p of particles) {
      p.x += p.vx * dt; p.y += p.vy * dt;
      p.phase += p.twinkle * dt;
      // wrap with a margin so links don't snap at the edge
      if (p.x < -12) p.x = w + 12; else if (p.x > w + 12) p.x = -12;
      if (p.y < -12) p.y = h + 12; else if (p.y > h + 12) p.y = -12;
    }
    for (const l of lines) {
      for (let i = l.pulses.length - 1; i >= 0; i--) {
        l.pulses[i].t += l.speed * dt;
        if (l.pulses[i].t > 1.12) l.pulses.splice(i, 1);
      }
      if (simTime >= l.nextSpawn && l.pulses.length < 2) {
        l.pulses.push({ t: -0.08, len: lerp(0.07, 0.13, rng()), strength: lerp(0.7, 1, rng()) });
        l.nextSpawn = simTime + lerp(4500, 11000, rng());
      }
    }
  }

  // ---- drawing --------------------------------------------------------------------------------
  function drawScanBand(t) {
    const period = 12000;
    const bandW = Math.max(120, w * 0.18);
    const u = (t % period) / period;
    const x = lerp(-bandW, w + bandW, u);
    const g = ctx.createLinearGradient(x - bandW / 2, 0, x + bandW / 2, 0);
    g.addColorStop(0, rgba(PALETTE.signal, 0));
    g.addColorStop(0.5, rgba(PALETTE.signal, 0.07));
    g.addColorStop(1, rgba(PALETTE.signal, 0));
    ctx.fillStyle = g;
    ctx.fillRect(x - bandW / 2, 0, bandW, h);
    // hairline core
    ctx.strokeStyle = rgba(PALETTE.ink, 0.07);
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(x + 0.5, 0); ctx.lineTo(x + 0.5, h); ctx.stroke();
  }

  function drawRings(t) {
    const base = Math.min(w, h);
    ctx.lineWidth = 1;
    for (const r of rings) {
      const cx = r.cx * w, cy = r.cy * h;
      const R = r.scale * base;
      const rot = (t / 90000) * TAU * r.spin; // one revolution per 90s
      // concentric rings
      ctx.strokeStyle = rgba(r.tint, 0.10);
      for (const k of [1, 0.78, 0.56, 0.3]) {
        ctx.beginPath(); ctx.arc(cx, cy, R * k, 0, TAU); ctx.stroke();
      }
      // crosshair hairlines
      ctx.strokeStyle = rgba(r.tint, 0.07);
      ctx.beginPath();
      ctx.moveTo(cx - R * 1.08, cy); ctx.lineTo(cx + R * 1.08, cy);
      ctx.moveTo(cx, cy - R * 1.08); ctx.lineTo(cx, cy + R * 1.08);
      ctx.stroke();
      // radar sweep (slow wedge of light, no needle)
      const sweep = (t / 14000) * TAU * r.spin;
      const sg = ctx.createConicGradient ? ctx.createConicGradient(sweep, cx, cy) : null;
      if (sg) {
        sg.addColorStop(0, rgba(r.tint, 0.11));
        sg.addColorStop(0.22, rgba(r.tint, 0));
        sg.addColorStop(1, rgba(r.tint, 0));
        ctx.fillStyle = sg;
        ctx.beginPath(); ctx.arc(cx, cy, R * 0.78, 0, TAU); ctx.fill();
      }
      // tick marks on the outer ring (abstract, unlabeled)
      ctx.strokeStyle = rgba(r.tint, 0.14);
      const ticks = 72;
      for (let i = 0; i < ticks; i++) {
        const a = rot + (i / ticks) * TAU;
        const long = i % 6 === 0;
        const r0 = R * 1.0, r1 = R * (long ? 1.045 : 1.022);
        ctx.beginPath();
        ctx.moveTo(cx + Math.cos(a) * r0, cy + Math.sin(a) * r0);
        ctx.lineTo(cx + Math.cos(a) * r1, cy + Math.sin(a) * r1);
        ctx.stroke();
      }
      // dashed arc segments that crawl (two on different radii, opposite directions)
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = rgba(r.tint, 0.17);
      ctx.setLineDash([R * 0.18, R * 0.42]);
      ctx.lineDashOffset = -rot * R;
      ctx.beginPath(); ctx.arc(cx, cy, R * 0.9, 0, TAU); ctx.stroke();
      ctx.strokeStyle = rgba(PALETTE.ink, 0.11);
      ctx.setLineDash([R * 0.07, R * 0.16]);
      ctx.lineDashOffset = rot * R * 1.6;
      ctx.beginPath(); ctx.arc(cx, cy, R * 0.67, 0, TAU); ctx.stroke();
      ctx.setLineDash([]);
      ctx.lineWidth = 1;
      // soft centre glow
      const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, R * 0.56);
      g.addColorStop(0, rgba(r.tint, 0.08));
      g.addColorStop(1, rgba(r.tint, 0));
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(cx, cy, R * 0.56, 0, TAU); ctx.fill();
    }
  }

  function drawLines() {
    ctx.lineWidth = 1;
    for (const l of lines) {
      ctx.strokeStyle = rgba(l.tint, 0.09);
      ctx.beginPath();
      ctx.moveTo(l.a[0] * w, l.a[1] * h);
      ctx.quadraticCurveTo(l.c[0] * w, l.c[1] * h, l.b[0] * w, l.b[1] * h);
      ctx.stroke();
      // junction marks (small hollow diamonds at fixed fractions, purely abstract)
      ctx.strokeStyle = rgba(l.tint, 0.16);
      for (const jt of [0.22, 0.5, 0.78]) {
        const [jx, jy] = bezierPoint(l, jt);
        ctx.beginPath();
        ctx.moveTo(jx, jy - 4); ctx.lineTo(jx + 4, jy); ctx.lineTo(jx, jy + 4); ctx.lineTo(jx - 4, jy); ctx.closePath();
        ctx.stroke();
      }
      for (const pu of l.pulses) drawPulse(l, pu);
    }
  }

  function drawPulse(l, pu) {
    const segs = 14;
    const t1 = clamp(pu.t, 0, 1);
    const t0 = clamp(pu.t - pu.len, 0, 1);
    if (t1 <= t0) return;
    // tail: fades toward the back
    ctx.lineCap = 'round';
    for (let i = 0; i < segs; i++) {
      const ta = lerp(t0, t1, i / segs);
      const tb = lerp(t0, t1, (i + 1) / segs);
      const [xa, ya] = bezierPoint(l, ta);
      const [xb, yb] = bezierPoint(l, tb);
      const f = (i + 1) / segs;
      ctx.strokeStyle = rgba(l.tint, 0.16 * f * f * pu.strength);
      ctx.lineWidth = 0.6 + 1.6 * f;
      ctx.beginPath(); ctx.moveTo(xa, ya); ctx.lineTo(xb, yb); ctx.stroke();
    }
    ctx.lineCap = 'butt';
    // head glow
    if (pu.t >= 0 && pu.t <= 1) {
      const [hx, hy] = bezierPoint(l, pu.t);
      const g = ctx.createRadialGradient(hx, hy, 0, hx, hy, 18);
      g.addColorStop(0, rgba(l.tint, 0.18 * pu.strength));
      g.addColorStop(0.35, rgba(l.tint, 0.07 * pu.strength));
      g.addColorStop(1, rgba(l.tint, 0));
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(hx, hy, 18, 0, TAU); ctx.fill();
      ctx.fillStyle = rgba(PALETTE.ink, 0.18 * pu.strength);
      ctx.beginPath(); ctx.arc(hx, hy, 1.4, 0, TAU); ctx.fill();
    }
  }

  function drawConstellation() {
    const linkDist = clamp(Math.min(w, h) * 0.17, 90, 140);
    const ld2 = linkDist * linkDist;
    ctx.lineWidth = 1;
    const n = particles.length;
    for (let i = 0; i < n; i++) {
      const p = particles[i];
      for (let j = i + 1; j < n; j++) {
        const q = particles[j];
        const dx = p.x - q.x, dy = p.y - q.y;
        const d2 = dx * dx + dy * dy;
        if (d2 > ld2) continue;
        const f = 1 - Math.sqrt(d2) / linkDist;
        ctx.strokeStyle = rgba(PALETTE.ink2, 0.14 * f * f);
        ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(q.x, q.y); ctx.stroke();
      }
    }
    for (const p of particles) {
      const tw = 0.5 + 0.5 * Math.sin(p.phase);
      const a = lerp(0.09, 0.18, tw) * p.bright;
      // halo
      if (p.r > 1.3) {
        const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 5);
        g.addColorStop(0, rgba(p.tint, a * 0.35));
        g.addColorStop(1, rgba(p.tint, 0));
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r * 5, 0, TAU); ctx.fill();
      }
      ctx.fillStyle = rgba(p.tint, Math.min(0.18, a));
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, TAU); ctx.fill();
    }
  }

  let scanPattern = null;
  function drawScanlines() {
    // CRT-style horizontal hairlines, built once as a pattern (no per-frame cost).
    if (!scanPattern) {
      const pc = document.createElement('canvas');
      pc.width = 1; pc.height = 4;
      const pctx = pc.getContext('2d');
      if (!pctx) return;
      pctx.fillStyle = rgba(PALETTE.ink, 0.03);
      pctx.fillRect(0, 0, 1, 1);
      scanPattern = ctx.createPattern(pc, 'repeat');
    }
    if (!scanPattern) return;
    ctx.fillStyle = scanPattern;
    ctx.fillRect(0, 0, w, h);
  }

  function drawGlyphs(t) {
    // Decorative monospace glyphs that mean nothing; they breathe slowly and never change text.
    // Anchored in pixels just inside the corner brackets so they never sit under the content column.
    const labels = [
      { s: 'SYS', x: w - 30, y: 34, al: 'right' },
      { s: 'TELEMETRY', x: w - 30, y: h - 34, al: 'right' },
      { s: 'LINK', x: 30, y: h - 34, al: 'left' },
      { s: 'ORBIT', x: 30, y: 34, al: 'left' },
    ];
    ctx.font = '600 10px ui-monospace, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace';
    ctx.textBaseline = 'middle';
    labels.forEach((g, i) => {
      const breathe = 0.5 + 0.5 * Math.sin(t / 3200 + i * 1.7);
      ctx.textAlign = g.al;
      ctx.fillStyle = rgba(PALETTE.amber, lerp(0.09, 0.17, breathe));
      const gx = g.x, gy = g.y;
      // letter-spaced by drawing char by char
      const chars = g.s.split('');
      const adv = 8.5;
      const total = adv * chars.length;
      let x0 = g.al === 'right' ? gx - total : gx;
      ctx.textAlign = 'left';
      for (const ch of chars) { ctx.fillText(ch, x0, gy); x0 += adv; }
      // tiny status pip beside the label
      const px = g.al === 'right' ? gx - total - 10 : gx + total + 4;
      ctx.fillStyle = rgba(PALETTE.signal, lerp(0.08, 0.18, 1 - breathe));
      ctx.beginPath(); ctx.arc(px, gy, 1.6, 0, TAU); ctx.fill();
    });
  }

  function drawCornerBrackets() {
    // Thin HUD corner marks: pure frame decoration, no content.
    const m = 18, len = Math.max(28, Math.min(w, h) * 0.05);
    ctx.strokeStyle = rgba(PALETTE.amber, 0.18);
    ctx.lineWidth = 1.25;
    const corners = [[m, m, 1, 1], [w - m, m, -1, 1], [m, h - m, 1, -1], [w - m, h - m, -1, -1]];
    for (const [x, y, sx, sy] of corners) {
      ctx.beginPath();
      ctx.moveTo(x, y + sy * len); ctx.lineTo(x, y); ctx.lineTo(x + sx * len, y);
      ctx.stroke();
    }
  }

  function frame(t) {
    ctx.clearRect(0, 0, w, h);
    drawScanBand(t);
    drawRings(t);
    drawLines();
    drawConstellation();
    drawScanlines();
    drawGlyphs(t);
    drawCornerBrackets();
  }

  // ---- loop -----------------------------------------------------------------------------------
  function tick(now) {
    raf = 0;
    if (!running || stopped) return;
    raf = requestAnimationFrame(tick);
    if (now - lastFrame < frameMs - 1) return; // cap fps
    const dt = Math.min(100, lastTick ? now - lastTick : frameMs);
    lastFrame = now; lastTick = now;
    simTime += dt;
    if (layout(false)) { /* re-laid out on size change */ }
    step(dt);
    frame(simTime);
  }

  function start() {
    if (stopped || running || reduced) return;
    if (typeof document !== 'undefined' && document.hidden) return;
    running = true;
    lastTick = 0;
    raf = requestAnimationFrame(tick);
  }

  function pause() {
    running = false;
    if (raf) { cancelAnimationFrame(raf); raf = 0; }
  }

  function renderStatic() {
    // One complete, legible frame for reduced motion: advance the sim so links/pulses exist.
    layout(true);
    for (let i = 0; i < 90; i++) { simTime += 100; step(100); }
    frame(simTime);
  }

  // ---- events ---------------------------------------------------------------------------------
  let ro = null;
  const onResize = () => {
    if (stopped) return;
    if (layout(false) && reduced) renderStatic();
  };
  const onVisibility = () => {
    if (stopped) return;
    if (document.hidden) pause(); else start();
  };
  const onMotionChange = () => {
    if (stopped) return;
    reduced = !!(mq && mq.matches);
    if (reduced) { pause(); renderStatic(); } else start();
  };

  if (typeof ResizeObserver === 'function') {
    ro = new ResizeObserver(onResize);
    ro.observe(canvas);
  }
  window.addEventListener('resize', onResize);
  document.addEventListener('visibilitychange', onVisibility);
  if (mq) {
    if (typeof mq.addEventListener === 'function') mq.addEventListener('change', onMotionChange);
    else if (typeof mq.addListener === 'function') mq.addListener(onMotionChange);
  }

  // ---- boot -----------------------------------------------------------------------------------
  layout(true);
  if (reduced) renderStatic();
  else { frame(0); start(); }

  return {
    stop() {
      if (stopped) return;
      stopped = true;
      pause();
      if (ro) ro.disconnect();
      window.removeEventListener('resize', onResize);
      document.removeEventListener('visibilitychange', onVisibility);
      if (mq) {
        if (typeof mq.removeEventListener === 'function') mq.removeEventListener('change', onMotionChange);
        else if (typeof mq.removeListener === 'function') mq.removeListener(onMotionChange);
      }
      try { ctx.clearRect(0, 0, w, h); } catch { /* ignore */ }
    },
  };
}
