const DESK_EMAIL = "hello@courtlight.com";

const nav = document.querySelector(".nav");
const toggle = document.querySelector(".nav-toggle");
const menu = document.querySelector(".nav-links");

function closeMenu() {
  if (!menu || !toggle) return;
  menu.classList.remove("is-open");
  toggle.setAttribute("aria-expanded", "false");
  document.body.classList.remove("nav-open");
}

if (toggle && menu) {
  toggle.addEventListener("click", () => {
    const open = !menu.classList.contains("is-open");
    menu.classList.toggle("is-open", open);
    toggle.setAttribute("aria-expanded", String(open));
    document.body.classList.toggle("nav-open", open);
  });
  menu.addEventListener("click", (event) => {
    if (event.target.closest("a")) closeMenu();
  });
}

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") closeMenu();
});

function onScroll() {
  if (!nav) return;
  nav.classList.toggle("is-solid", window.scrollY > 12);
}

if (nav) {
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });
}

function nextSaturday() {
  const now = new Date();
  const slot = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 9, 0, 0, 0);
  let delta = (6 - slot.getDay() + 7) % 7;
  if (delta === 0 && now.getTime() > slot.getTime()) delta = 7;
  slot.setDate(slot.getDate() + delta);
  return slot;
}

const assess = nextSaturday();
const assessLabel = new Intl.DateTimeFormat("en-US", {
  weekday: "long",
  month: "long",
  day: "numeric"
}).format(assess);
const assessNode = document.getElementById("next-assess");
if (assessNode) assessNode.textContent = `${assessLabel} · 9:00a`;
document.querySelectorAll("[data-year]").forEach((node) => {
  node.textContent = String(new Date().getFullYear());
});

const shotReel = document.querySelector("[data-shot]");
if (shotReel) {
  const frames = [...shotReel.querySelectorAll("img")];
  const label = shotReel.querySelector("[data-shot-label]");
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  let index = 0;
  const show = (next) => {
    frames.forEach((frame, i) => frame.classList.toggle("is-on", i === next));
    if (label) label.textContent = frames[next].dataset.label || "";
    index = next;
  };
  if (reduce) show(frames.length - 1);
  else {
    const play = () => {
      window.setTimeout(() => {
        show((index + 1) % frames.length);
        play();
      }, index === frames.length - 1 ? 1900 : 820);
    };
    show(0);
    play();
  }
}

document.querySelectorAll("[data-share]").forEach((node) => {
  const page = location.href;
  const title = document.title;
  const kind = node.dataset.share;
  if (kind === "copy") {
    node.addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(page);
      } catch {
        window.prompt("Copy this link", page);
      }
      node.classList.add("is-done");
      node.setAttribute("aria-label", "Link copied");
    });
    return;
  }
  const links = {
    x: `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(page)}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(page)}`,
    whatsapp: `https://wa.me/?text=${encodeURIComponent(`${title} ${page}`)}`
  };
  if (links[kind]) node.href = links[kind];
});

function bindTabs(tablist) {
  const tabs = [...tablist.querySelectorAll('[role="tab"]')];
  tabs.forEach((tab, index) => {
    tab.addEventListener("click", () => selectTab(tabs, index));
    tab.addEventListener("keydown", (event) => {
      const vertical = tablist.getAttribute("aria-orientation") === "vertical";
      const prev = vertical ? "ArrowUp" : "ArrowLeft";
      const next = vertical ? "ArrowDown" : "ArrowRight";
      if (event.key !== prev && event.key !== next && event.key !== "Home" && event.key !== "End") return;
      event.preventDefault();
      let nextIndex = index;
      if (event.key === prev) nextIndex = (index - 1 + tabs.length) % tabs.length;
      if (event.key === next) nextIndex = (index + 1) % tabs.length;
      if (event.key === "Home") nextIndex = 0;
      if (event.key === "End") nextIndex = tabs.length - 1;
      selectTab(tabs, nextIndex);
      tabs[nextIndex].focus();
    });
  });
}

function selectTab(tabs, index) {
  tabs.forEach((tab, i) => {
    const selected = i === index;
    tab.classList.toggle("is-active", selected);
    tab.setAttribute("aria-selected", String(selected));
    tab.tabIndex = selected ? 0 : -1;
    const panel = document.getElementById(tab.getAttribute("aria-controls"));
    if (!panel) return;
    panel.classList.toggle("is-active", selected);
    panel.hidden = !selected;
  });
}

document.querySelectorAll('[role="tablist"]').forEach(bindTabs);

document.querySelectorAll("[data-program]").forEach((link) => {
  link.addEventListener("click", () => {
    const select = document.getElementById("program");
    if (!select) return;
    select.value = link.dataset.program;
    select.removeAttribute("aria-invalid");
  });
});

const week = document.getElementById("week");
const weekCount = document.getElementById("week-count");
const filters = document.querySelector(".filters");

function applyFilter(kind) {
  let shown = 0;
  week.querySelectorAll(".slot").forEach((slot) => {
    const match = kind === "all" || slot.dataset.kind === kind;
    slot.hidden = !match;
    if (match) shown += 1;
  });
  weekCount.textContent = kind === "all" ? `${shown} on the board` : `${shown} ${kind}`;
}

if (filters && week && weekCount) {
  filters.addEventListener("click", (event) => {
    const button = event.target.closest("[data-filter]");
    if (!button) return;
    filters.querySelectorAll(".chip").forEach((chip) => {
      const on = chip === button;
      chip.classList.toggle("is-active", on);
      chip.setAttribute("aria-pressed", String(on));
    });
    applyFilter(button.dataset.filter);
  });
  applyFilter("all");
}

const priceRoot = document.querySelector(".toggle");
if (priceRoot) priceRoot.addEventListener("click", (event) => {
  const button = event.target.closest("[data-price]");
  if (!button) return;
  const mode = button.dataset.price;
  priceRoot.querySelectorAll("button").forEach((item) => {
    const on = item === button;
    item.classList.toggle("is-active", on);
    item.setAttribute("aria-pressed", String(on));
  });
  document.querySelectorAll("[data-single]").forEach((node) => {
    node.textContent = node.dataset[mode];
  });
});

const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const canvas = document.getElementById("hoop");
const ctx = canvas ? canvas.getContext("2d") : null;
const shotBar = document.getElementById("shot-bar");
const shotPhase = document.getElementById("shot-phase");

const SCENE = { w: 560, h: 320 };
const RIM = { x: 392, y: 176, rx: 98, ry: 18 };
const COLS = 12;
const ROWS = 7;
const CYCLE = 3.5;

let sway = 0;
let swayV = 0;
let kicked = false;
let last = 0;
let running = true;
let raf = 0;

function resizeCanvas() {
  const rect = canvas.getBoundingClientRect();
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = Math.max(1, Math.round(rect.width * dpr));
  canvas.height = Math.max(1, Math.round(rect.height * dpr));
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

function netPoint(c, r) {
  const u = c / COLS;
  const v = r / ROWS;
  const taper = 1 - v * 0.5;
  const width = RIM.rx * 2 * taper;
  const wave = sway * v * Math.sin(u * Math.PI);
  const x = RIM.x - width / 2 + width * u + wave * 16 + sway * (u - 0.5) * v * 26;
  const y = RIM.y + 8 + v * 112 + Math.abs(sway) * v * 8 + Math.sin(u * Math.PI) * v * 6;
  return { x, y };
}

function stepSway(dt, p) {
  if (p < 0.42) kicked = false;
  if (!kicked && p >= 0.5 && p < 0.6) {
    swayV += 14;
    kicked = true;
  }
  swayV = (swayV + -sway * 42 * dt) * Math.max(0, 1 - 2.2 * dt);
  sway += swayV * dt;
}

function ballAt(p) {
  const x0 = 34;
  const y0 = 246;
  const x1 = RIM.x;
  const y1 = RIM.y - 2;
  if (p < 0.08) return { x: x0, y: y0, alpha: 1, spin: 0, squash: 1 };
  if (p < 0.5) {
    const u = (p - 0.08) / 0.42;
    const x = x0 + (x1 - x0) * ease(u);
    const y = y0 + (y1 - y0) * u - Math.sin(u * Math.PI) * 124;
    return { x, y, alpha: 1, spin: u * 5.4, squash: 1 };
  }
  if (p < 0.84) {
    const u = (p - 0.5) / 0.34;
    let squash = 1;
    if (u < 0.28) squash = 1 - Math.sin((u / 0.28) * Math.PI) * 0.2;
    return {
      x: x1 + Math.sin(u * Math.PI) * 7,
      y: y1 + u * u * 148,
      alpha: 1,
      spin: 5.4 + u * 2.2,
      squash
    };
  }
  const u = (p - 0.84) / 0.16;
  return { x: x1, y: y1 + 148, alpha: 1 - u, spin: 7.6, squash: 1 };
}

function ease(u) {
  return 1 - Math.pow(1 - u, 1.35);
}

function drawBackboard() {
  const x = 268;
  const y = 22;
  const w = 250;
  const h = 148;
  ctx.save();
  roundRect(x, y, w, h, 8);
  ctx.fillStyle = "rgba(243, 238, 230, 0.06)";
  ctx.fill();
  ctx.strokeStyle = "rgba(243, 238, 230, 0.88)";
  ctx.lineWidth = 2.4;
  ctx.stroke();
  ctx.strokeStyle = "rgba(243, 238, 230, 0.45)";
  ctx.lineWidth = 1.4;
  ctx.strokeRect(x + 78, y + 18, 96, 86);
  ctx.beginPath();
  ctx.moveTo(x + w / 2, y + h);
  ctx.lineTo(RIM.x - 20, RIM.y);
  ctx.strokeStyle = "rgba(243, 238, 230, 0.55)";
  ctx.lineWidth = 3;
  ctx.stroke();
  ctx.restore();
}

function roundRect(x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function strokeRim(which, glow) {
  ctx.save();
  ctx.lineWidth = 6;
  ctx.lineCap = "round";
  ctx.strokeStyle = glow > 0.4 ? "#ffd7ad" : "#f0b27a";
  ctx.shadowColor = `rgba(224, 122, 47, ${0.35 + glow * 0.6})`;
  ctx.shadowBlur = 8 + glow * 26;
  ctx.beginPath();
  if (which === "back") ctx.ellipse(RIM.x, RIM.y, RIM.rx, RIM.ry, 0, Math.PI, Math.PI * 2);
  else ctx.ellipse(RIM.x, RIM.y, RIM.rx, RIM.ry, 0, 0, Math.PI);
  ctx.stroke();
  ctx.restore();
}

function drawNet() {
  ctx.save();
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.lineWidth = 1.25;
  ctx.strokeStyle = "rgba(243, 238, 230, 0.88)";
  for (let c = 0; c <= COLS; c += 1) {
    const start = netPoint(c, 0);
    ctx.moveTo(start.x, start.y);
    for (let r = 1; r <= ROWS; r += 1) {
      const point = netPoint(c, r);
      ctx.lineTo(point.x, point.y);
    }
  }
  ctx.stroke();
  ctx.beginPath();
  ctx.lineWidth = 1;
  ctx.strokeStyle = "rgba(243, 238, 230, 0.55)";
  for (const r of [2, 4, 6]) {
    const start = netPoint(0, r);
    ctx.moveTo(start.x, start.y);
    for (let c = 1; c <= COLS; c += 1) {
      const point = netPoint(c, r);
      ctx.lineTo(point.x, point.y);
    }
  }
  ctx.stroke();
  ctx.restore();
}

function drawBall(ball) {
  const { x, y, alpha, spin, squash } = ball;
  if (alpha <= 0.02) return;
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.translate(x, y);
  ctx.scale(1 + (1 - squash) * 0.7, squash);
  ctx.rotate(spin);
  const radius = 30;
  const gradient = ctx.createRadialGradient(-radius * 0.35, -radius * 0.42, radius * 0.1, 0, 0, radius);
  gradient.addColorStop(0, "#ffe0c2");
  gradient.addColorStop(0.38, "#ef8a3a");
  gradient.addColorStop(0.74, "#c94f16");
  gradient.addColorStop(1, "#6d2a0e");
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(0, 0, radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "rgba(58, 22, 8, 0.85)";
  ctx.lineWidth = 1.6;
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(-radius, 0);
  ctx.lineTo(radius, 0);
  ctx.stroke();
  ctx.beginPath();
  ctx.ellipse(0, 0, radius * 0.42, radius * 0.9, 0.35, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

function drawTrail(ball, p) {
  if (p < 0.08 || p > 0.5) return;
  for (let i = 1; i <= 4; i += 1) {
    const ghost = ballAt(Math.max(0.08, p - i * 0.025));
    ctx.save();
    ctx.globalAlpha = 0.1 * (5 - i) * ball.alpha;
    ctx.fillStyle = "#f0b27a";
    ctx.beginPath();
    ctx.arc(ghost.x, ghost.y, 10 - i, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

function render(p) {
  const viewW = canvas.clientWidth;
  const viewH = canvas.clientHeight;
  ctx.clearRect(0, 0, viewW, viewH);
  const scale = Math.min(viewW / SCENE.w, viewH / SCENE.h);
  ctx.save();
  ctx.translate((viewW - SCENE.w * scale) / 2, (viewH - SCENE.h * scale) / 2 + 4);
  ctx.scale(scale, scale);

  const ball = ballAt(p);
  const glow = p > 0.48 && p < 0.7 ? Math.sin(((p - 0.48) / 0.22) * Math.PI) : 0;

  ctx.strokeStyle = "rgba(243, 238, 230, 0.18)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(20, 308);
  ctx.lineTo(540, 308);
  ctx.stroke();

  const lift = Math.max(0, Math.min(1, 1 - (308 - ball.y) / 180));
  ctx.fillStyle = `rgba(243, 220, 190, ${0.18 * lift * ball.alpha})`;
  ctx.beginPath();
  ctx.ellipse(ball.x, 306, 22 + lift * 10, 6, 0, 0, Math.PI * 2);
  ctx.fill();

  drawBackboard();
  strokeRim("back", glow);
  drawNet();
  drawTrail(ball, p);

  const rel = ball.y - RIM.y;
  if (rel >= -6 && rel < 34) {
    drawBall(ball);
    strokeRim("front", glow);
  } else {
    strokeRim("front", glow);
    drawBall(ball);
  }

  ctx.restore();
}

function phaseName(p) {
  if (p < 0.1) return "Release";
  if (p < 0.5) return "Arc";
  if (p < 0.84) return "Net";
  return "Reset";
}

function frame(now) {
  raf = 0;
  if (!running) return;
  const dt = Math.min(0.033, (now - last) / 1000 || 0.016);
  last = now;
  const p = (now / 1000 % CYCLE) / CYCLE;
  stepSway(dt, p);
  shotBar.style.transform = `scaleX(${p})`;
  shotPhase.textContent = phaseName(p);
  render(p);
  raf = requestAnimationFrame(frame);
}

function startLoop() {
  if (reducedMotion || raf) return;
  last = performance.now();
  raf = requestAnimationFrame(frame);
}

function drawStill() {
  sway = 0.35;
  shotBar.style.transform = "scaleX(0.66)";
  shotPhase.textContent = "Net";
  render(0.66);
}

if (canvas && ctx) {
  resizeCanvas();
  if (reducedMotion) drawStill();
  else startLoop();
  new ResizeObserver(() => {
    resizeCanvas();
    if (reducedMotion) drawStill();
    else render((performance.now() / 1000 % CYCLE) / CYCLE);
  }).observe(canvas);
}

function pressedValues(id) {
  return [...document.querySelectorAll(`#${id} .chip[aria-pressed="true"]`)].map((chip) => chip.textContent.trim());
}

document.querySelectorAll(".chips").forEach((group) => {
  if (group.classList.contains("is-radio")) return;
  group.addEventListener("click", (event) => {
    const chip = event.target.closest(".chip");
    if (!chip) return;
    const on = chip.getAttribute("aria-pressed") !== "true";
    chip.setAttribute("aria-pressed", String(on));
    chip.classList.toggle("is-active", on);
  });
});

const programSelect = document.getElementById("program");
const requested = new URLSearchParams(location.search).get("program");
if (programSelect && requested) programSelect.value = requested;
const form = document.getElementById("book-form");
const formError = document.getElementById("form-error");
const success = document.getElementById("book-success");

function setInvalid(id, invalid) {
  const field = document.getElementById(id);
  if (!field) return;
  if (invalid) field.setAttribute("aria-invalid", "true");
  else field.removeAttribute("aria-invalid");
}

if (form) form.addEventListener("submit", (event) => {
  event.preventDefault();
  const player = document.getElementById("player").value.trim();
  const age = document.getElementById("age").value;
  const guardian = document.getElementById("guardian").value.trim();
  const email = document.getElementById("email").value.trim();
  const phone = document.getElementById("phone").value.trim();
  const program = document.getElementById("program").value;
  const note = document.getElementById("note").value.trim();
  const days = pressedValues("days");
  const focus = pressedValues("focus");
  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const phoneOk = phone.replace(/\D/g, "").length >= 7;

  setInvalid("player", player.length < 2);
  setInvalid("age", !age);
  setInvalid("guardian", guardian.length < 2);
  setInvalid("email", !emailOk);
  setInvalid("phone", !phoneOk);
  setInvalid("program", !program);

  const problems = [];
  if (player.length < 2) problems.push("the player's name");
  if (!age) problems.push("an age band");
  if (guardian.length < 2) problems.push("a guardian");
  if (!emailOk) problems.push("a real email");
  if (!phoneOk) problems.push("a phone number");
  if (!program) problems.push("a program");
  if (!days.length) problems.push("at least one day");
  if (!focus.length) problems.push("at least one focus");

  if (problems.length) {
    formError.hidden = false;
    formError.textContent = `Add ${problems.join(", ")} before sending.`;
    return;
  }

  formError.hidden = true;
  const lines = [
    `Player: ${player}`,
    `Age band: ${age}`,
    `Guardian: ${guardian}`,
    `Email: ${email}`,
    `Phone: ${phone}`,
    `Program: ${program}`,
    `Days: ${days.join(", ")}`,
    `Focus: ${focus.join(", ")}`,
    `Payment: ${(document.querySelector("input[name='pay']:checked") || {}).value || "desk"}`,
    note ? `Note: ${note}` : "Note: —"
  ];
  const body = encodeURIComponent(lines.join("\n"));
  const subject = encodeURIComponent(`Courtlight request — ${player}`);
  const href = `mailto:${DESK_EMAIL}?subject=${subject}&body=${body}`;
  if (window.CourtlightStore) {
    const pay = document.querySelector("input[name='pay']:checked");
    window.CourtlightStore.addRequest({ player, age, guardian, email, phone, program, days, focus, note, pay: pay ? pay.value : "desk" });
  }
  document.getElementById("success-title").textContent = `${player} is on the desk.`;
  const payLabel = document.querySelector("input[name='pay']:checked");
  const payText = payLabel ? payLabel.parentElement.textContent.trim() : "Pay when the visit is confirmed";
  document.getElementById("success-copy").textContent = `${program} for the ${age} band. Days: ${days.join(", ")}. Focus: ${focus.join(", ")}. Payment: ${payText}. It is waiting in the office. Open the email if you also want a copy in your sent mail.`;
  document.getElementById("send-mail").href = href;
  form.hidden = true;
  success.hidden = false;
});

const resetForm = document.getElementById("reset-form");
if (resetForm) resetForm.addEventListener("click", () => {
  form.reset();
  document.querySelectorAll("#days .chip, #focus .chip").forEach((chip) => {
    chip.setAttribute("aria-pressed", "false");
    chip.classList.remove("is-active");
  });
  form.querySelectorAll("[aria-invalid]").forEach((field) => field.removeAttribute("aria-invalid"));
  success.hidden = true;
  form.hidden = false;
});

const newsForm = document.getElementById("news-form");
const newsNote = document.getElementById("news-note");
const newsEmail = document.getElementById("news-email");
const savedList = localStorage.getItem("courtlight-list");

if (newsForm && savedList) {
  newsEmail.value = savedList;
  newsNote.textContent = `You're on the list as ${savedList}.`;
}

function buildCutout(img) {
  const cut = document.createElement("canvas");
  const w = img.naturalWidth;
  const h = img.naturalHeight;
  cut.width = w;
  cut.height = h;
  const g = cut.getContext("2d", { willReadFrequently: true });
  g.drawImage(img, 0, 0);
  const frame = g.getImageData(0, 0, w, h);
  const data = frame.data;
  const bg = new Uint8Array(w * h);
  const stack = [];
  const dark = (i) => {
    const o = i * 4;
    return Math.max(data[o], data[o + 1], data[o + 2]) <= 16;
  };
  const push = (x, y) => {
    if (x < 0 || y < 0 || x >= w || y >= h) return;
    const i = y * w + x;
    if (bg[i] || !dark(i)) return;
    bg[i] = 1;
    stack.push(i);
  };
  for (let x = 0; x < w; x += 1) {
    push(x, 0);
    push(x, h - 1);
  }
  for (let y = 0; y < h; y += 1) {
    push(0, y);
    push(w - 1, y);
  }
  while (stack.length) {
    const i = stack.pop();
    const x = i % w;
    const y = (i - x) / w;
    push(x + 1, y);
    push(x - 1, y);
    push(x, y + 1);
    push(x, y - 1);
  }
  for (let i = 0; i < bg.length; i += 1) {
    if (!bg[i]) continue;
    const o = i * 4;
    const max = Math.max(data[o], data[o + 1], data[o + 2]);
    data[o + 3] = max <= 8 ? 0 : Math.round(((max - 8) / 8) * 255);
  }
  g.putImageData(frame, 0, 0);
  return cut;
}

function upgradeFigure(root) {
  const shot = root.querySelector("img:not(.figure-glow)");
  if (!shot) return;
  const run = () => {
    if (!shot.naturalWidth) return;
    try {
      const cut = buildCutout(shot);
      const bloom = document.createElement("canvas");
      const sharp = document.createElement("canvas");
      [bloom, sharp].forEach((node) => {
        node.width = cut.width;
        node.height = cut.height;
        node.getContext("2d").drawImage(cut, 0, 0);
      });
      bloom.className = "cut cut-glow";
      bloom.setAttribute("aria-hidden", "true");
      sharp.className = "cut cut-shot";
      sharp.setAttribute("role", "img");
      sharp.setAttribute("aria-label", shot.alt);
      root.insertBefore(bloom, shot);
      root.insertBefore(sharp, shot);
      root.classList.add("is-cut");
    } catch (error) {
      root.classList.add("is-blend");
    }
  };
  if (shot.complete && shot.naturalWidth) run();
  else shot.addEventListener("load", run, { once: true });
}

document.querySelectorAll(".hero-visual, .coach-photo").forEach(upgradeFigure);

if (newsForm) newsForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const value = newsEmail.value.trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
    newsNote.textContent = "Use a full email address.";
    newsEmail.setAttribute("aria-invalid", "true");
    return;
  }
  newsEmail.removeAttribute("aria-invalid");
  localStorage.setItem("courtlight-list", value);
  newsNote.textContent = `You're on the list as ${value}.`;
});

const STORE_KEY = "courtlight-office-v1";
const DEFAULT_SLOTS = [
  { id: "mon-found", day: "Mon", time: "4:00p", name: "Foundations", detail: "Ages 8–11. Stops, weak hand, and a finish they can land.", kind: "group", meta: "6 spots", held: false },
  { id: "mon-lab", day: "Mon", time: "5:30p", name: "Shooting lab", detail: "Catch, one-dribble, contest. Makes and misses both get written down.", kind: "lab", meta: "8 spots", held: false },
  { id: "tue-priv", day: "Tue", time: "4:00p", name: "Private block", detail: "Three chairs, fifty minutes each. The card is the plan.", kind: "private", meta: "Private", held: false },
  { id: "tue-hs", day: "Tue", time: "7:00p", name: "High school group", detail: "Ages 15–18. Late clock and a shell that has to talk.", kind: "group", meta: "6 spots", held: false },
  { id: "wed-film", day: "Wed", time: "5:00p", name: "Film room", detail: "Two chairs. Bring a game, even if the angle is imperfect.", kind: "film", meta: "40 min", held: false },
  { id: "wed-dec", day: "Wed", time: "6:00p", name: "Decision group", detail: "Ages 12–14. Advantage reads in a small-sided game.", kind: "group", meta: "6 spots", held: false },
  { id: "thu-lab", day: "Thu", time: "4:00p", name: "Shooting lab", detail: "Same stations as Monday, so the numbers mean something.", kind: "lab", meta: "8 spots", held: false },
  { id: "thu-priv", day: "Thu", time: "7:00p", name: "Private block", detail: "Evening chairs for players who train after practice.", kind: "private", meta: "Private", held: false },
  { id: "fri-priv", day: "Fri", time: "4:00p", name: "Private block", detail: "Shorter week, same standard. No new topics on a Friday.", kind: "private", meta: "Private", held: false },
  { id: "sat-assess", day: "Sat", time: "9:00a", name: "Assessments", detail: "Two players, fifty minutes each. This is the front door.", kind: "assess", meta: "2 chairs", held: false },
  { id: "sat-clinic", day: "Sat", time: "11:30a", name: "Team clinic", detail: "Open for a roster that booked ahead.", kind: "clinic", meta: "90 min", held: false }
];
const DEFAULT_FEES = {
  assessment: 90,
  private: 95,
  privateBlock: 720,
  lab: 35,
  labMonth: 120,
  group: 40,
  groupBlock: 300,
  film: 70,
  filmBlock: 260,
  clinic: 400
};

const DEFAULT_GATEWAYS = {
  desk: { enabled: true, label: "Pay when the visit is confirmed" },
  stripe: { enabled: false, publishable: "", test: true },
  paypal: { enabled: false, client: "" }
};

function loadOffice() {
  try {
    const raw = JSON.parse(localStorage.getItem(STORE_KEY));
    if (!raw || !Array.isArray(raw.slots)) {
      return { requests: [], slots: DEFAULT_SLOTS, fees: { ...DEFAULT_FEES }, gateways: structuredClone(DEFAULT_GATEWAYS) };
    }
    return {
      requests: Array.isArray(raw.requests) ? raw.requests : [],
      slots: raw.slots,
      fees: { ...DEFAULT_FEES, ...(raw.fees || {}) },
      gateways: {
        desk: { ...DEFAULT_GATEWAYS.desk, ...(raw.gateways?.desk || {}) },
        stripe: { ...DEFAULT_GATEWAYS.stripe, ...(raw.gateways?.stripe || {}) },
        paypal: { ...DEFAULT_GATEWAYS.paypal, ...(raw.gateways?.paypal || {}) }
      }
    };
  } catch (error) {
    return { requests: [], slots: DEFAULT_SLOTS, fees: { ...DEFAULT_FEES }, gateways: structuredClone(DEFAULT_GATEWAYS) };
  }
}

function saveOffice(state) {
  localStorage.setItem(STORE_KEY, JSON.stringify(state));
}

window.CourtlightStore = {
  load: loadOffice,
  save: saveOffice,
  addRequest(entry) {
    const state = loadOffice();
    const row = {
      id: (crypto.randomUUID && crypto.randomUUID()) || String(Date.now()),
      created: new Date().toISOString(),
      status: "new",
      ...entry
    };
    state.requests.unshift(row);
    saveOffice(state);
    return row;
  }
};

function money(value) {
  return `$${value}`;
}

const poster = document.getElementById("poster-price");
if (poster) {
  const fees = loadOffice().fees;
  const paintPrice = (mode) => {
    const key = mode === "block" ? poster.dataset.block : poster.dataset.single;
    poster.textContent = money(fees[key]);
    const note = document.getElementById("poster-note");
    if (note) note.textContent = mode === "block" ? poster.dataset.blockNote : poster.dataset.singleNote;
    document.querySelectorAll("[data-fee]").forEach((node) => {
      const feeKey = mode === "block" ? node.dataset.feeBlock : node.dataset.fee;
      if (fees[feeKey] != null) node.textContent = money(fees[feeKey]);
    });
    document.querySelectorAll("[data-fee-note]").forEach((node) => {
      node.textContent = mode === "block" ? node.dataset.block : node.dataset.single;
    });
  };
  paintPrice("single");
  const switcher = document.querySelector(".price-switch");
  if (switcher) {
    switcher.addEventListener("click", (event) => {
      const button = event.target.closest("[data-mode]");
      if (!button) return;
      switcher.querySelectorAll("button").forEach((item) => {
        const on = item === button;
        item.classList.toggle("is-active", on);
        item.setAttribute("aria-pressed", String(on));
      });
      paintPrice(button.dataset.mode);
    });
  }
}

const publicBoard = document.getElementById("public-board");
if (publicBoard) {
  const paintBoard = (kind) => {
    const slots = loadOffice().slots.filter((slot) => kind === "all" || slot.kind === kind);
    const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const cells = days.map((day) => {
      const mine = slots.filter((slot) => slot.day === day);
      const cards = mine.map((slot) => `
        <article class="sess${slot.held ? " is-held" : ""}">
          <time>${slot.time}</time>
          <h3>${slot.name}</h3>
          <p>${slot.detail}</p>
          <span>${slot.held ? "Held" : slot.meta}</span>
        </article>`).join("");
      const marks = mine.map((slot) => slot.time).join(",");
      return `<section class="day-col"><header>${day}</header>${cards || '<p class="day-quiet">Clear</p>'}<canvas class="film day-film" data-film="day" data-times="${marks}" aria-hidden="true"></canvas></section>`;
    });
    cells.push(`<aside class="sunday-col"><span>Sun</span><strong>Dark</strong><p>The gym is closed. Players who want seven days hear that from us directly.</p><canvas class="film day-film" data-film="dark" aria-hidden="true"></canvas></aside>`);
    publicBoard.innerHTML = `<div class="week-row">${cells.slice(0, 4).join("")}</div><div class="week-row week-row-rest">${cells.slice(4).join("")}</div>`;
    const count = document.getElementById("board-count");
    if (count) count.textContent = kind === "all" ? `${loadOffice().slots.length} on the board` : `${slots.length} ${kind}`;
    if (window.CourtlightFilm) window.CourtlightFilm.scan();
  };
  paintBoard("all");
  const boardFilters = document.querySelector(".board-filters");
  if (boardFilters) {
    boardFilters.addEventListener("click", (event) => {
      const button = event.target.closest("[data-filter]");
      if (!button) return;
      boardFilters.querySelectorAll("button").forEach((item) => {
        const on = item === button;
        item.classList.toggle("is-active", on);
        item.setAttribute("aria-pressed", String(on));
      });
      paintBoard(button.dataset.filter);
    });
  }
}

function savedPages() {
  try { return JSON.parse(localStorage.getItem("courtlight-pages-v1")) || {}; }
  catch (error) { return {}; }
}

const pageKey = document.body.dataset.page;
if (pageKey && savedPages()[pageKey]) {
  const copy = savedPages()[pageKey];
  const heading = document.querySelector("main h1");
  const lede = document.querySelector("main .lede");
  if (heading && copy.title) heading.textContent = copy.title;
  if (lede && copy.lede) lede.textContent = copy.lede;
}

const payBox = document.getElementById("pay-methods");
if (payBox) {
  const gates = loadOffice().gateways;
  const options = [];
  if (gates.desk.enabled) options.push(["desk", gates.desk.label]);
  if (gates.stripe.enabled) options.push(["stripe", "Card. Taken when the visit is confirmed."]);
  if (gates.paypal.enabled) options.push(["paypal", "PayPal. Taken when the visit is confirmed."]);
  if (!options.length) options.push(["desk", "Pay when the visit is confirmed"]);
  payBox.innerHTML = options.map(([id, label], index) => `
    <label class="pay-choice"><input type="radio" name="pay" value="${id}" ${index === 0 ? "checked" : ""}> ${label}</label>
  `).join("");
}
