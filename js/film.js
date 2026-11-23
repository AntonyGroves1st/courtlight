/* One motion per room. Each drawing uses the whole canvas. */
(function courtlightFilm() {
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const jobs = [];
  const seen = new WeakSet();
  let raf = 0;
  const AMBER = "#e07a2f";
  const CREAM = "rgba(244, 239, 230, 0.82)";
  const DIM = "rgba(244, 239, 230, 0.28)";

  const lerp = (a, b, t) => a + (b - a) * t;
  const ease = (t) => t * t * (3 - 2 * t);
  const wrap = (t, s) => ((t % s) + s) % s;

  function label(ctx, text, x, y, size, color, align) {
    ctx.font = `500 ${size}px "DM Mono", ui-monospace, monospace`;
    ctx.fillStyle = color || CREAM;
    ctx.textAlign = align || "center";
    ctx.textBaseline = "middle";
    ctx.fillText(text, x, y);
  }

  function fit(ctx, text, maxW, preferred, min) {
    let size = preferred;
    const floor = min || 8;
    while (size > floor) {
      ctx.font = `500 ${size}px "DM Mono", ui-monospace, monospace`;
      if (ctx.measureText(text).width <= maxW) break;
      size -= 1;
    }
    return size;
  }

  function ball(ctx, x, y, r) {
    ctx.fillStyle = "rgba(0,0,0,0.4)";
    ctx.beginPath();
    ctx.ellipse(x, y + r + 4, r * 0.8, r * 0.28, 0, 0, Math.PI * 2);
    ctx.fill();
    const g = ctx.createRadialGradient(x - r * 0.35, y - r * 0.4, 1, x, y, r);
    g.addColorStop(0, "#ffe0c2");
    g.addColorStop(0.55, "#e07a2f");
    g.addColorStop(1, "#9a3d12");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "rgba(90, 32, 8, 0.7)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(x, y, r * 0.72, 0.4, Math.PI - 0.2);
    ctx.stroke();
  }

  function warmup(ctx, w, h, t) {
    const gates = ["HIP", "INSIDE", "TWO-FOOT", "JUMP"];
    const top = 22;
    const bot = h - 18;
    const x = Math.min(w * 0.36, 120);
    ctx.strokeStyle = "rgba(244,239,230,0.22)";
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(x - 34, top);
    ctx.lineTo(x - 34, bot);
    ctx.moveTo(x + 34, top);
    ctx.lineTo(x + 34, bot);
    ctx.stroke();
    const p = wrap(t, 4.4) / 4.4;
    const travel = top + p * (bot - top);
    const hop = Math.abs(Math.sin(p * Math.PI * 8)) * 14;
    gates.forEach((name, i) => {
      const gy = top + ((i + 0.55) / gates.length) * (bot - top);
      const lit = travel >= gy;
      ctx.strokeStyle = lit ? AMBER : DIM;
      ctx.lineWidth = lit ? 2.4 : 1;
      ctx.beginPath();
      ctx.moveTo(x - 46, gy);
      ctx.lineTo(x + 46, gy);
      ctx.stroke();
      if (lit && travel - gy < 28) {
        ctx.globalAlpha = 1 - (travel - gy) / 28;
        ctx.beginPath();
        ctx.arc(x, gy, 16 + (travel - gy), 0, Math.PI * 2);
        ctx.stroke();
        ctx.globalAlpha = 1;
      }
      label(ctx, name, x + 78, gy, Math.max(11, Math.min(14, h * 0.04)), lit ? AMBER : DIM, "left");
    });
    ball(ctx, x, travel - hop, 9);
  }

  function shot(ctx, w, h, t) {
    const p = ease(wrap(t, 2.7) / 2.7);
    const x0 = w * 0.18;
    const y0 = h * 0.78;
    const x1 = w * 0.68;
    const y1 = h * 0.18;
    const lift = h * 0.16;
    ctx.strokeStyle = "rgba(224,122,47,0.35)";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    for (let i = 0; i <= 28; i += 1) {
      const u = (i / 28) * p;
      const px = lerp(x0, x1, u);
      const py = lerp(y0, y1, u) - Math.sin(u * Math.PI) * lift;
      if (i) ctx.lineTo(px, py);
      else ctx.moveTo(px, py);
    }
    ctx.stroke();
    const x = lerp(x0, x1, p);
    const y = lerp(y0, y1, p) - Math.sin(p * Math.PI) * lift;
    ctx.strokeStyle = AMBER;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.ellipse(x1, y1, 22, 7, 0, Math.PI, 0);
    ctx.stroke();
    if (p > 0.72) {
      const k = (p - 0.72) / 0.28;
      ctx.globalAlpha = 1 - k * 0.4;
      ctx.beginPath();
      ctx.moveTo(x1 - 14, y1 + 2);
      ctx.quadraticCurveTo(x1, y1 + 16 + k * h * 0.12, x1 + 14, y1 + 2);
      ctx.stroke();
      ctx.globalAlpha = 1;
    }
    if (p > 0.4) {
      const hand = Math.min(1, (p - 0.4) / 0.35);
      ctx.strokeStyle = CREAM;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x1 + 28, y1 + 30 - hand * 18);
      ctx.lineTo(x1 + 8, y1 + 4);
      ctx.stroke();
    }
    ball(ctx, x, y, 10);
    const made = Math.floor(wrap(t, 8) / 2.7);
    for (let i = 0; i < 5; i += 1) {
      const py = h * 0.22 + i * ((h * 0.6) / 5);
      ctx.fillStyle = i < made ? AMBER : DIM;
      ctx.fillRect(w * 0.84, py, 10, h * 0.06);
      label(ctx, i < made ? "MAKE" : "—", w * 0.9, py + h * 0.03, 10, i < made ? AMBER : DIM, "left");
    }
  }

  function live(ctx, w, h, t) {
    const p = wrap(t, 3.4) / 3.4;
    const close = p < 0.62 ? ease(p / 0.62) : 1 - (p - 0.62) * 0.15;
    const x = w * 0.4;
    const y0 = h * 0.1;
    const y1 = h * 0.82;
    ctx.strokeStyle = DIM;
    ctx.setLineDash([4, 7]);
    ctx.beginPath();
    ctx.moveTo(x, y0);
    ctx.lineTo(x, y1);
    ctx.stroke();
    ctx.setLineDash([]);
    for (let i = 0; i < 6; i += 1) {
      const y = lerp(y0, y1, i / 5);
      ctx.fillStyle = DIM;
      ctx.fillRect(x - 8, y, 16, 1);
      label(ctx, `${12 - i * 2}`, x - 22, y, 11, DIM, "right");
    }
    const defY = lerp(y0, y1 - 40, Math.min(1, close));
    ctx.strokeStyle = CREAM;
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.moveTo(x - 16, defY - 14);
    ctx.lineTo(x, defY + 16);
    ctx.lineTo(x + 16, defY - 14);
    ctx.stroke();
    ball(ctx, x, y1, 11);
    const feet = Math.max(2, Math.round(lerp(12, 2, Math.min(1, close))));
    label(ctx, `${feet} FT`, w * 0.72, h * 0.22, Math.max(18, Math.min(28, h * 0.07)), AMBER, "left");
    label(ctx, "HIGH HAND", w * 0.72, h * 0.22 + 26, 12, CREAM, "left");
  }

  function film(ctx, w, h, t) {
    const n = 5;
    const gap = 10;
    const tall = h >= w * 0.9;
    const play = Math.floor(wrap(t, 4) / 0.8);
    for (let i = 0; i < n; i += 1) {
      const fw = tall ? w - 28 : (w - gap * (n + 1)) / n;
      const fh = tall ? (h - gap * (n + 1)) / n : h * 0.62;
      const x = tall ? 14 : gap + i * (fw + gap);
      const y = tall ? gap + i * (fh + gap) : h * 0.12;
      const on = i === play;
      ctx.strokeStyle = on ? AMBER : DIM;
      ctx.lineWidth = on ? 2 : 1;
      ctx.strokeRect(x, y, fw, fh);
      if (on) {
        const word = i % 2 ? "KEEP" : "RETIRE";
        const size = fit(ctx, word, Math.max(8, fw - 8), Math.min(18, Math.max(10, fh * 0.42)), 8);
        label(ctx, word, x + fw / 2, y + fh / 2, size, AMBER);
        ctx.fillStyle = AMBER;
        ctx.fillRect(x, y + fh - 3, fw * wrap(t, 0.8) / 0.8, 3);
      }
    }
  }

  function assess(ctx, w, h, t) {
    const p = wrap(t, 3.6) / 3.6;
    const pad = Math.max(8, Math.min(w, h) * 0.06);
    ctx.strokeStyle = "rgba(244,239,230,0.7)";
    ctx.lineWidth = 2;
    ctx.strokeRect(pad, pad, w - pad * 2, h - pad * 2);
    ctx.strokeStyle = AMBER;
    ctx.lineWidth = Math.max(3, h * 0.02);
    [0.42, 0.62].forEach((at, i) => {
      const grow = ease(Math.min(1, Math.max(0, (p - i * 0.28) / 0.45)));
      ctx.beginPath();
      ctx.moveTo(pad + 16, h * at);
      ctx.lineTo(pad + 16 + (w - pad * 2 - 32) * grow, h * at);
      ctx.stroke();
    });
    label(ctx, "2", w - pad - 18, pad + 22, Math.max(22, h * 0.16), AMBER);
  }

  function chair(ctx, x, y, s) {
    ctx.strokeStyle = CREAM;
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(x - s * 0.15, y - s);
    ctx.lineTo(x - s * 0.15, y + s * 0.15);
    ctx.lineTo(x + s * 0.7, y + s * 0.15);
    ctx.moveTo(x - s * 0.15, y - s * 0.25);
    ctx.lineTo(x + s * 0.45, y - s * 0.25);
    ctx.moveTo(x, y + s * 0.15);
    ctx.lineTo(x, y + s * 0.7);
    ctx.moveTo(x + s * 0.45, y + s * 0.15);
    ctx.lineTo(x + s * 0.45, y + s * 0.7);
    ctx.stroke();
  }

  function privateHour(ctx, w, h, t) {
    const cx = w * 0.42;
    const cy = h * 0.52;
    const r = Math.min(w * 0.32, h * 0.4);
    const p = wrap(t, 5) / 5;
    ctx.strokeStyle = DIM;
    ctx.lineWidth = Math.max(10, r * 0.16);
    ctx.beginPath();
    ctx.arc(cx, cy, r, Math.PI * 0.72, Math.PI * 2.28);
    ctx.stroke();
    ctx.strokeStyle = AMBER;
    ctx.lineWidth = Math.max(10, r * 0.16);
    ctx.beginPath();
    ctx.arc(cx, cy, r, Math.PI * 0.72, Math.PI * 0.72 + p * Math.PI * 1.56);
    ctx.stroke();
    label(ctx, "50", cx, cy - 8, Math.max(36, r * 0.55), AMBER);
    label(ctx, "MIN", cx, cy + r * 0.42, 14, CREAM);
    chair(ctx, w * 0.78, cy, Math.min(h * 0.28, 70));
  }

  function lab(ctx, w, h, t) {
    const made = Math.floor(wrap(t, 6) * 1.4) % 9;
    const missed = Math.floor(wrap(t + 1.7, 7)) % 6;
    const rows = 4;
    const drawSide = (count, x0, word) => {
      label(ctx, word, x0 + 20, 16, 12, word === "MAKE" ? AMBER : CREAM);
      for (let i = 0; i < 8; i += 1) {
        const col = i % 4;
        const row = Math.floor(i / 4);
        const x = x0 + 16 + col * ((w * 0.42) / 4);
        const y = 36 + row * ((h - 48) / rows);
        ctx.fillStyle = i < count ? (word === "MAKE" ? AMBER : CREAM) : DIM;
        ctx.beginPath();
        ctx.arc(x, y + 10, Math.max(8, Math.min(h * 0.07, 16)), 0, Math.PI * 2);
        ctx.fill();
      }
    };
    drawSide(made, w * 0.06, "MAKE");
    drawSide(missed, w * 0.52, "MISS");
  }

  function group(ctx, w, h, t) {
    const count = 3 + Math.floor(wrap(t, 4.8) / 1.6);
    const cx = w * 0.5;
    const cy = h * 0.48;
    const rx = w * 0.34;
    const ry = h * 0.32;
    for (let i = 0; i < 6; i += 1) {
      const a = -Math.PI / 2 + (i / 6) * Math.PI * 2;
      const on = i < count;
      const x = cx + Math.cos(a) * rx;
      const y = cy + Math.sin(a) * ry;
      ctx.fillStyle = on ? AMBER : DIM;
      ctx.beginPath();
      ctx.arc(x, y, on ? Math.max(14, Math.min(w, h) * 0.07) : 7, 0, Math.PI * 2);
      ctx.fill();
      if (on) label(ctx, String(i + 1), x, y, 11, "#1a120c");
    }
    label(ctx, `${count} ON THE FLOOR`, cx, h - 18, 12, CREAM);
  }

  function clinic(ctx, w, h, t) {
    const n = 16;
    const head = Math.floor(wrap(t, 5) * 3.2) % n;
    const gap = Math.max(4, w * 0.008);
    const bw = (w - gap * (n + 1)) / n;
    const top = h * 0.12;
    const bh = h * 0.62;
    for (let i = 0; i < n; i += 1) {
      const on = i >= head && i < head + 4;
      ctx.fillStyle = on ? AMBER : "rgba(244,239,230,0.16)";
      ctx.fillRect(gap + i * (bw + gap), top, bw, bh);
    }
    label(ctx, "ONE PROBLEM", w / 2, h * 0.88, Math.max(13, h * 0.08), AMBER);
  }

  function habits(ctx, w, h, t) {
    const items = [
      ["KEEP", "The footwork that showed up live"],
      ["KEEP", "The shot that held with a hand up"],
      ["RETIRE", "The one habit named out loud"]
    ];
    const on = Math.floor(wrap(t, 3.9) / 1.3);
    items.forEach((item, i) => {
      const y = (h / 3) * i + h / 6;
      const hot = i === on;
      ctx.globalAlpha = hot ? 1 : 0.4;
      ctx.strokeStyle = item[0] === "RETIRE" ? AMBER : CREAM;
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      if (item[0] === "RETIRE") {
        ctx.moveTo(28, y - 10);
        ctx.lineTo(48, y + 10);
        ctx.moveTo(48, y - 10);
        ctx.lineTo(28, y + 10);
      } else {
        ctx.moveTo(24, y);
        ctx.lineTo(34, y + 10);
        ctx.lineTo(52, y - 12);
      }
      ctx.stroke();
      label(ctx, item[0], 78, y - 8, 13, hot ? AMBER : CREAM, "left");
      label(ctx, item[1], 78, y + 12, 12, CREAM, "left");
      ctx.globalAlpha = 1;
    });
  }

  function blocks(ctx, w, h, t) {
    const cx = w * 0.5;
    const cy = h * 0.46;
    const numSize = Math.max(14, Math.min(20, Math.min(w, h) * 0.055));
    const numGap = numSize + 14;
    const r = Math.max(78, Math.min(w * 0.5 - numGap - 6, h * 0.5 - numGap - 18));
    const sitting = 3.2;
    const turn = wrap(t, sitting * 8);
    const session = Math.min(7, Math.floor(turn / sitting));
    const local = (turn % sitting) / sitting;
    const minute = Math.min(50, Math.max(5, Math.round(local * 50 / 5) * 5));

    const glow = ctx.createRadialGradient(cx, cy, r * 0.2, cx, cy, r * 1.15);
    glow.addColorStop(0, "rgba(224, 122, 47, 0.2)");
    glow.addColorStop(1, "rgba(224, 122, 47, 0)");
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(cx, cy, r * 1.15, 0, Math.PI * 2);
    ctx.fill();

    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.strokeStyle = "rgba(244, 239, 230, 0.16)";
    ctx.lineWidth = Math.max(7, r * 0.04);
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(cx, cy, r, -Math.PI / 2, -Math.PI / 2 + local * Math.PI * 2);
    ctx.strokeStyle = AMBER;
    ctx.shadowColor = "rgba(224, 122, 47, 0.85)";
    ctx.shadowBlur = 14;
    ctx.stroke();
    ctx.shadowBlur = 0;

    for (let i = 0; i < 50; i += 1) {
      const a = -Math.PI / 2 + (i / 50) * Math.PI * 2;
      const tick = i % 5 === 0 ? r * 0.11 : r * 0.06;
      ctx.strokeStyle = "rgba(244, 239, 230, 0.28)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(a) * (r - tick), cy + Math.sin(a) * (r - tick));
      ctx.lineTo(cx + Math.cos(a) * (r - 4), cy + Math.sin(a) * (r - 4));
      ctx.stroke();
    }

    for (let i = 0; i < 8; i += 1) {
      const a = -Math.PI / 2 + (i / 8) * Math.PI * 2;
      const x = cx + Math.cos(a) * r;
      const y = cy + Math.sin(a) * r;
      const hot = i === session;
      const sealed = i < session;
      const dot = hot ? r * 0.07 : r * 0.045;
      ctx.beginPath();
      ctx.arc(x, y, dot, 0, Math.PI * 2);
      ctx.fillStyle = hot || sealed ? AMBER : "rgba(244, 239, 230, 0.18)";
      ctx.fill();
      if (hot) {
        ctx.beginPath();
        ctx.arc(x, y, dot + 8 + local * 10, 0, Math.PI * 2);
        ctx.strokeStyle = AMBER;
        ctx.lineWidth = 1.5;
        ctx.globalAlpha = 1 - local;
        ctx.stroke();
        ctx.globalAlpha = 1;
      }
      label(ctx, String(i + 1), cx + Math.cos(a) * (r + numGap * 0.72), cy + Math.sin(a) * (r + numGap * 0.72), numSize, hot ? "#fff4ea" : DIM);
    }

    ctx.save();
    ctx.translate(cx, cy + r + numGap + 8);
    ctx.scale(1.35, 0.22);
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.72, 0, Math.PI * 2);
    ctx.strokeStyle = "rgba(224, 122, 47, 0.45)";
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();

    const shot = ease(Math.min(1, Math.max(0, (local - 0.12) / 0.7)));
    const rimX = cx;
    const rimY = cy - r * 0.62;
    const y0 = cy - r * 0.22;
    const x = cx;
    const y = lerp(y0, rimY, shot) - Math.sin(shot * Math.PI) * r * 0.16;
    ctx.strokeStyle = "rgba(224, 122, 47, 0.35)";
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(cx, y0);
    ctx.quadraticCurveTo(cx + r * 0.16, cy - r * 0.5, rimX, rimY);
    ctx.stroke();
    ctx.strokeStyle = AMBER;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.ellipse(rimX, rimY, r * 0.16, r * 0.045, 0, Math.PI, 0);
    ctx.stroke();
    if (shot > 0.78) {
      const k = (shot - 0.78) / 0.22;
      ctx.globalAlpha = 1 - k * 0.65;
      ctx.beginPath();
      ctx.moveTo(rimX - r * 0.1, rimY + 2);
      ctx.quadraticCurveTo(rimX, rimY + r * 0.12 + k * 10, rimX + r * 0.1, rimY + 2);
      ctx.stroke();
      ctx.globalAlpha = 1;
    }
    ball(ctx, x, y, Math.max(6, r * 0.04));

    const ofSize = Math.max(13, r * 0.14);
    const big = Math.min(r * 0.42, 68);
    const minSize = Math.max(12, r * 0.12);
    const gap = Math.max(8, r * 0.07);
    const stack = ofSize + big + minSize + gap * 2;
    let top = cy - stack / 2 + r * 0.06;
    label(ctx, `${session + 1} OF 8`, cx, top + ofSize / 2, ofSize, "#f4efe6");
    top += ofSize + gap;
    label(ctx, String(minute), cx, top + big / 2, big, AMBER);
    top += big + gap;
    label(ctx, "MINUTES", cx, top + minSize / 2, minSize, CREAM);
  }

  function once(ctx, w, h, t) {
    const names = ["CATCH", "DRIBBLE", "CLOSEOUT", "FINISH"];
    const on = Math.floor(wrap(t, 3.6) / 0.9);
    const slot = w / names.length;
    const type = fit(ctx, "CLOSEOUT", slot * 0.9, Math.min(13, h * 0.18), 8);
    const r = Math.min(slot * 0.28, h * 0.22, 22);
    names.forEach((name, i) => {
      const x = slot * (i + 0.5);
      const y = h * 0.36;
      ctx.strokeStyle = i === on ? AMBER : DIM;
      ctx.lineWidth = i === on ? 2.4 : 1.4;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.stroke();
      label(ctx, String(i + 1), x, y, Math.max(11, type), i === on ? AMBER : CREAM);
      label(ctx, name, x, Math.min(h - type * 0.55, y + r + type * 0.95), type, i === on ? AMBER : CREAM);
    });
  }

  function month(ctx, w, h, t) {
    const on = Math.floor(wrap(t, 3.6) / 0.9);
    const slot = w / 4;
    const type = fit(ctx, "WK 4", slot * 0.62, Math.min(14, h * 0.18), 8);
    const cap = fit(ctx, "SAME SHEET", w * 0.92, Math.min(13, h * 0.16), 8);
    const top = h * 0.08;
    const bh = Math.max(18, h * 0.5);
    for (let i = 0; i < 4; i += 1) {
      const x = slot * (i + 0.5);
      const bw = slot * 0.62;
      ctx.strokeStyle = i === on ? AMBER : DIM;
      ctx.lineWidth = i === on ? 2.4 : 1.4;
      ctx.strokeRect(x - bw / 2, top, bw, bh);
      label(ctx, `WK ${i + 1}`, x, top + bh / 2, type, i === on ? AMBER : CREAM);
    }
    label(ctx, "SAME SHEET", w / 2, h - cap * 0.65, cap, AMBER);
  }

  function split(ctx, w, h, t) {
    const slices = [3, 4, 6][Math.floor(wrap(t, 4.5) / 1.5)];
    const type = fit(ctx, "6 PLAYERS", w * 0.48, Math.min(16, h * 0.2), 8);
    const sub = fit(ctx, "EACH PAYS", w * 0.48, type * 0.85, 8);
    const cx = w * 0.22;
    const cy = h * 0.48;
    const r = Math.min(h * 0.36, w * 0.16);
    for (let i = 0; i < slices; i += 1) {
      const a0 = -Math.PI / 2 + (i / slices) * Math.PI * 2;
      const a1 = a0 + (Math.PI * 2) / slices - 0.06;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, r, a0, a1);
      ctx.closePath();
      ctx.fillStyle = i % 2 ? AMBER : "rgba(224,122,47,0.4)";
      ctx.fill();
    }
    label(ctx, `${slices} PLAYERS`, w * 0.46, cy - sub * 0.7, type, CREAM, "left");
    label(ctx, "EACH PAYS", w * 0.46, cy + type * 0.65, sub, AMBER, "left");
  }

  function sittings(ctx, w, h, t) {
    const show = Math.min(4, 1 + Math.floor(wrap(t, 3.6) / 0.9));
    const words = ["ONE SITTING", "TWO SITTINGS", "THREE SITTINGS", "FOUR SITTINGS"];
    const slot = w / 4;
    const type = fit(ctx, "4", slot * 0.5, Math.min(16, h * 0.2), 8);
    const cap = fit(ctx, "THREE SITTINGS", w * 0.94, Math.min(13, h * 0.16), 8);
    const top = h * 0.1;
    const bh = Math.max(16, h * 0.46);
    for (let i = 0; i < 4; i += 1) {
      const x = slot * (i + 0.5);
      const bw = slot * 0.55;
      ctx.globalAlpha = i < show ? 1 : 0.28;
      ctx.strokeStyle = i < show ? AMBER : DIM;
      ctx.lineWidth = i < show ? 2.4 : 1.4;
      ctx.strokeRect(x - bw / 2, top, bw, bh);
      label(ctx, String(i + 1), x, top + bh / 2, type, i < show ? AMBER : CREAM);
      ctx.globalAlpha = 1;
    }
    label(ctx, words[show - 1], w / 2, h - cap * 0.65, cap, AMBER);
  }

  function quote(ctx, w, h, t) {
    const turnLen = 2.2;
    const turn = Math.floor(wrap(t, turnLen * 16) / turnLen);
    const p = wrap(t, turnLen) / turnLen;
    const type = fit(ctx, "ONE PROBLEM", w * 0.42, Math.min(13, h * 0.18), 8);
    const countSize = fit(ctx, "16 OF 16", w * 0.42, Math.min(14, h * 0.2), 8);
    ctx.font = `500 ${type}px "DM Mono", ui-monospace, monospace`;
    const gutter = Math.min(w * 0.46, ctx.measureText("ONE PROBLEM").width + 12);
    const playL = gutter;
    const playW = Math.max(40, w - playL - 6);
    const X = (u) => playL + u * playW;
    const ground = h * 0.72;
    const rimX = X(0.86);
    const rimY = h * 0.28;
    const rimW = Math.min(18, h * 0.22, playW * 0.12);

    ctx.strokeStyle = "rgba(244,239,230,0.35)";
    ctx.lineWidth = 2;
    ctx.strokeRect(rimX - rimW * 0.85, h * 0.06, rimW * 1.7, rimY - h * 0.06);
    ctx.strokeStyle = AMBER;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(rimX - rimW, rimY);
    ctx.lineTo(rimX + rimW, rimY);
    ctx.stroke();
    const kick = p > 0.66 && p < 0.94 ? Math.sin((p - 0.66) * 22) * 6 : 0;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    for (let i = -2; i <= 2; i += 1) {
      ctx.moveTo(rimX + i * rimW * 0.38, rimY);
      ctx.quadraticCurveTo(rimX + i * rimW * 0.12 + kick * 0.25, rimY + h * 0.18, rimX + i * rimW * 0.32 + kick, rimY + h * 0.28);
    }
    ctx.stroke();

    ctx.strokeStyle = "rgba(244,239,230,0.22)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(X(0.08), ground);
    ctx.lineTo(rimX + rimW, ground);
    ctx.stroke();

    [0.16, 0.4, 0.62].forEach((spot, i) => {
      const x = X(spot);
      const on = i === 0;
      const rise = on ? Math.sin(Math.min(p, 0.34) / 0.34 * Math.PI) * h * 0.1 : 0;
      ctx.fillStyle = on ? AMBER : "rgba(244,239,230,0.3)";
      ctx.beginPath();
      ctx.arc(x, ground - h * 0.18 - rise, on ? h * 0.1 : h * 0.075, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = on ? AMBER : "rgba(244,239,230,0.3)";
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      ctx.moveTo(x - h * 0.06, ground);
      ctx.lineTo(x, ground - h * 0.07 - rise * 0.3);
      ctx.lineTo(x + h * 0.06, ground);
      ctx.stroke();
    });

    const shoot = Math.min(1, Math.max(0, (p - 0.18) / 0.48));
    if (shoot > 0.02 && shoot < 0.98) {
      ball(
        ctx,
        lerp(X(0.2), rimX, shoot),
        lerp(ground - h * 0.32, rimY - 2, shoot) - Math.sin(shoot * Math.PI) * h * 0.2,
        Math.max(6, h * 0.08)
      );
    }

    label(ctx, `${turn + 1} OF 16`, 2, h * 0.34, countSize, "#f4efe6", "left");
    label(ctx, "ONE PROBLEM", 2, h * 0.34 + countSize * 1.15, type, AMBER, "left");
  }

  function hoursOf(raw) {
    if (!raw) return [];
    return raw.split(",").map((token) => {
      const m = token.trim().match(/(\d+):(\d+)(a|p)/i);
      if (!m) return null;
      let hour = Number(m[1]);
      const min = Number(m[2]);
      const ap = m[3].toLowerCase();
      if (ap === "p" && hour !== 12) hour += 12;
      if (ap === "a" && hour === 12) hour = 0;
      return hour + min / 60;
    }).filter((n) => n != null);
  }

  function day(ctx, w, h, t, times) {
    const start = 15;
    const end = 21;
    const tall = h > 110;
    const play = start + (wrap(t, 5) / 5) * (end - start);
    const mark = (hour, a, b) => a + ((hour - start) / (end - start)) * (b - a);
    const type = Math.max(22, Math.min(40, h * 0.12));
    if (tall) {
      const x = w * 0.36;
      const y0 = type * 0.8;
      const y1 = h - type * 0.8;
      ctx.strokeStyle = "rgba(244, 239, 230, 0.45)";
      ctx.lineWidth = Math.max(2.5, h * 0.01);
      ctx.beginPath();
      ctx.moveTo(x, y0);
      ctx.lineTo(x, y1);
      ctx.stroke();
      [16, 18, 20].forEach((hour) => {
        const y = mark(hour, y0, y1);
        ctx.fillStyle = "rgba(224, 122, 47, 0.85)";
        ctx.fillRect(x - 16, y - 2, 32, 4);
        label(ctx, hour > 12 ? `${hour - 12}P` : `${hour}P`, x - 28, y, type, "#f4efe6", "right");
      });
      const py = mark(play, y0, y1);
      const dot = Math.max(9, h * 0.035);
      ctx.fillStyle = AMBER;
      ctx.beginPath();
      ctx.arc(x, py, dot, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = AMBER;
      ctx.lineWidth = 2;
      ctx.globalAlpha = 0.45;
      ctx.beginPath();
      ctx.arc(x, py, dot * 2.1, 0, Math.PI * 2);
      ctx.stroke();
      ctx.globalAlpha = 1;
      times.forEach((hour) => {
        const y = mark(Math.max(start, Math.min(end, hour)), y0, y1);
        ctx.fillStyle = AMBER;
        const bar = Math.max(7, h * 0.022);
        ctx.fillRect(x - 8, y - bar / 2, 54, bar);
        const clockHour = Math.floor(hour);
        const mins = Math.round((hour - clockHour) * 60);
        const showH = clockHour > 12 ? clockHour - 12 : clockHour;
        label(ctx, `${showH}:${String(mins).padStart(2, "0")}`, x + 58, y, type, AMBER, "left");
      });
      return;
    }
    const y = h * 0.62;
    const x0 = 28;
    const x1 = w - 28;
    ctx.strokeStyle = DIM;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(x0, y);
    ctx.lineTo(x1, y);
    ctx.stroke();
    ctx.fillStyle = AMBER;
    ctx.beginPath();
    ctx.arc(mark(play, x0, x1), y, 8, 0, Math.PI * 2);
    ctx.fill();
    times.forEach((hour) => {
      const x = mark(Math.max(start, Math.min(end, hour)), x0, x1);
      ctx.fillStyle = AMBER;
      ctx.fillRect(x - 3, y - 16, 6, 32);
    });
  }

  function dark(ctx, w, h, t) {
    const p = wrap(t, 5) / 5;
    const tall = h > 110;
    const type = Math.max(20, Math.min(32, h * 0.09));
    const r = Math.max(12, h * 0.05);
    [0, 1, 2].forEach((i) => {
      const alive = i === 2 || p < 0.22 + i * 0.22;
      const x = tall ? w * 0.3 : w * (0.28 + i * 0.22);
      const y = tall ? h * (0.22 + i * 0.26) : h * 0.4;
      ctx.fillStyle = alive && i === 2 ? AMBER : "rgba(244, 239, 230, 0.35)";
      ctx.globalAlpha = alive ? 1 : 0.4;
      ctx.beginPath();
      ctx.arc(x, y, i === 2 ? r * 1.4 : r, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
      if (tall) label(ctx, i === 2 ? "ONE LIGHT" : "OUT", x + r * 1.4 + 18, y, type, i === 2 ? AMBER : "#f4efe6", "left");
    });
    if (!tall) label(ctx, "DARK", w / 2, h * 0.75, 22, AMBER);
  }

  const painters = {
    warmup, shot, live, film, assess, private: privateHour, lab, group, clinic, habits,
    blocks, once, month, split, sittings, quote, day, dark
  };

  function paint(job, now) {
    const canvas = job.canvas;
    const rect = canvas.getBoundingClientRect();
    if (rect.width < 8 || rect.height < 8) return;
    // The bitmap size must not become the layout size. A canvas taller than
    // the window is that feedback loop, so pin it and measure again.
    if (rect.height > window.innerHeight) {
      canvas.style.flex = "none";
      canvas.style.height = "128px";
      canvas.style.maxHeight = "128px";
      return;
    }
    const dpr = Math.min(window.devicePixelRatio || 1, 1.6);
    const w = Math.max(1, Math.round(rect.width * dpr));
    const h = Math.max(1, Math.round(rect.height * dpr));
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
    }
    const ctx = canvas.getContext("2d");
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, rect.width, rect.height);
    const time = reduce ? 1.4 : (now - job.born) / 1000;
    if (job.scene === "day") day(ctx, rect.width, rect.height, time, hoursOf(canvas.dataset.times));
    else (painters[job.scene] || dark)(ctx, rect.width, rect.height, time);
  }

  function tick(now) {
    for (let i = jobs.length - 1; i >= 0; i -= 1) {
      if (!jobs[i].canvas.isConnected) jobs.splice(i, 1);
    }
    jobs.forEach((job) => paint(job, now));
    if (!reduce) raf = requestAnimationFrame(tick);
  }

  function scan() {
    document.querySelectorAll("canvas.film").forEach((canvas) => {
      if (seen.has(canvas)) return;
      seen.add(canvas);
      jobs.push({ canvas, scene: canvas.dataset.film || "dark", born: performance.now() });
    });
    if (!raf) raf = requestAnimationFrame(tick);
    if (reduce) tick(performance.now());
  }

  window.CourtlightFilm = { scan };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", scan);
  else scan();
})();
