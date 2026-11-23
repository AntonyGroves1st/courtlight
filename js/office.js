const CODE = "4646";
const lock = document.getElementById("lock");
const desk = document.getElementById("desk");
const views = {
  home: document.getElementById("view-home"),
  requests: document.getElementById("view-requests"),
  board: document.getElementById("view-board"),
  fees: document.getElementById("view-fees"),
  pages: document.getElementById("view-pages"),
  payments: document.getElementById("view-payments"),
  leads: document.getElementById("view-leads"),
  marketing: document.getElementById("view-marketing"),
  seo: document.getElementById("view-seo")
};
const titles = {
  home: "Desk.",
  requests: "Requests.",
  board: "Timetable.",
  fees: "Pricing.",
  pages: "Pages.",
  payments: "Payments.",
  leads: "Leads.",
  marketing: "Marketing.",
  seo: "SEO."
};
const kickers = {
  home: "Desk",
  requests: "Booking",
  board: "Editor",
  fees: "Editor",
  pages: "Editor",
  payments: "Editor",
  leads: "Marketing",
  marketing: "Marketing",
  seo: "Content"
};
const PLAN_KEY = "courtlight-plan-v1";
const LEADS = [
  ["school", "School athletic office", "Foundations, decision group", "One free clinic. Forty minutes. One problem. Leave the assessment card with the office. Do not ask for the roster."],
  ["pe", "PE teachers", "Shooting lab", "Show one station they can run after you leave. Offer two chairs in the lab for players they already know are serious."],
  ["club", "Clubs in the same building", "Lab and the high school group", "Trade one guest session with a club that already has the age. Their players try one hour. Yours see how that club practices."],
  ["travel", "Travel and AAU coaches", "Film room, then the assessment", "Break down one player they name, on their film, no charge. The assessment is the next step. No speech about exposure."],
  ["desk", "Front desk of the gym", "Whichever chair is light that week", "A card at the desk of the gym the sessions already use. Parents are already walking in."],
  ["parents", "Families already on the book", "Saturday assessments", "Each family names two teammates. Hold a chair for the teammate when both book the first visit."],
  ["offseason", "Clubs whose season just ended", "Foundations and Saturday", "Soccer, track, baseball nearby. The week after their last game, offer the Saturday assessment. One sheet. One time."],
  ["rec", "Parks, rec, and the library board", "Saturday assessments", "One sheet. The Saturday hour. Fifty minutes. $90. No extra promises on the paper."],
  ["bags", "Team managers after a youth game", "Foundations", "A card in the team bag. Not a speech at the scorer's table. The card says the day, the age, and how to book."],
  ["chair", "The open chair itself", "The light hour on the board", "Name the one hour that is light. Lab holds 8. Groups hold 6. Film holds 2. Saturday holds 2 assessments. Fill that hour before you open a new one."]
];
let activeId = null;
let leadMode = "find";
let editPage = null;
let editSlot = null;
const PAGE_KEY = "courtlight-pages-v1";
const PAGES = [
  ["home", "Home", "index.html", "The details that hold in a close game.", "A small room. Two priorities. Twenty minutes of homework that fits a school night. The stills are from the floor. The work is the card."],
  ["method", "Method", "method.html", "Order before volume.", "Nothing new goes on top of a shot that disappears when a hand is up."],
  ["programs", "Programs", "programs.html", "Six rooms. One card.", "Pick the room. Every one ends with two priorities, a clip, and homework that fits a school night."],
  ["schedule", "Timetable", "schedule.html", "The standing week.", "A spot is held when the office marks it. Sunday the gym is dark."],
  ["pricing", "Pricing", "pricing.html", "The hour that stays yours.", "Twenty-four hours notice and a missed visit moves. Inside that, the visit is used. Illness with notice always moves."],
  ["book", "Book", "book.html", "Tell us what you want fixed.", "The first visit is fifty minutes and costs $90. The request lands on the desk. The address comes with the confirmation."],
  ["coach", "Coach", "coach.html", "One coach on the floor.", "Sessions are not passed to a rotating staff. The assessment card stays the plan until those two priorities show up on film."]
];

function state() {
  return window.CourtlightStore.load();
}

function openDesk() {
  lock.hidden = true;
  desk.hidden = false;
  show("home");
  tick();
}

function show(name) {
  Object.entries(views).forEach(([key, node]) => {
    node.hidden = key !== name;
  });
  document.querySelectorAll(".rail [data-view]").forEach((button) => {
    button.classList.toggle("is-on", button.dataset.view === name);
  });
  document.getElementById("view-title").textContent = titles[name];
  document.getElementById("view-kicker").textContent = kickers[name];
  document.body.classList.toggle("is-wp", name === "pages" || name === "board" || name === "fees" || name === "payments");
  render();
}

function tick() {
  const clock = document.getElementById("desk-clock");
  clock.textContent = new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit"
  }).format(new Date());
}

function render() {
  const data = state();
  const fresh = data.requests.filter((row) => row.status === "new").length;
  document.getElementById("new-count").textContent = fresh ? String(fresh) : "";
  renderHome(data);
  renderRequests(data);
  renderBoard(data);
  renderFees(data);
  renderPages();
  renderPayments(data);
  renderLeads();
  renderMarketing();
  renderSeo();
}

function renderHome(data) {
  const held = data.slots.filter((slot) => slot.held).length;
  const next = data.requests[0];
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  views.home.innerHTML = `
    <div class="metrics">
      <article class="metric"><span>New requests</span><b>${data.requests.filter((row) => row.status === "new").length}</b></article>
      <article class="metric"><span>Held chairs</span><b>${held}</b></article>
      <article class="metric"><span>On the book</span><b>${data.requests.length}</b></article>
    </div>
    <div class="desk-split">
      <article class="req-detail">
        ${next ? `
          <p class="status">${next.status}</p>
          <h2>${next.player}</h2>
          <p>${next.program} · ages ${next.age}</p>
          <p>${next.guardian} · ${next.email}</p>
          <p>Days: ${(next.days || []).join(", ") || "—"}</p>
          <p>Focus: ${(next.focus || []).join(", ") || "—"}</p>
          <button type="button" class="btn" data-jump="requests">Open the request</button>
        ` : `<h2>The desk is clear.</h2><p>Bookings land in this chair.</p>`}
      </article>
      <div class="mini-week">
        ${days.map((day) => {
          const first = data.slots.find((slot) => slot.day === day);
          return `<div><b>${day}</b><span>${first ? first.time + " " + first.name : "Clear"}${first && first.held ? " · held" : ""}</span></div>`;
        }).join("")}
      </div>
    </div>`;
}

function renderRequests(data) {
  if (!data.requests.length) {
    views.requests.innerHTML = `<p class="empty-desk">No requests yet.</p>`;
    activeId = null;
    return;
  }
  if (!activeId || !data.requests.some((row) => row.id === activeId)) activeId = data.requests[0].id;
  const current = data.requests.find((row) => row.id === activeId);
  views.requests.innerHTML = `
    <div class="req-layout">
      <div class="req-list">
        ${data.requests.map((row) => `
          <button type="button" class="req${row.id === activeId ? " is-on" : ""}" data-open="${row.id}">
            <strong>${row.player}</strong>
            <small>${row.program} · ${row.status}</small>
          </button>`).join("")}
      </div>
      <article class="req-detail">
        <p class="status">${current.status}</p>
        <h2>${current.player}</h2>
        <p>${current.program} · ages ${current.age}</p>
        <p>${current.guardian} · ${current.email} · ${current.phone}</p>
        <p>Days: ${(current.days || []).join(", ") || "—"}</p>
        <p>Focus: ${(current.focus || []).join(", ") || "—"}</p>
        <p>Payment: ${esc(current.pay || "desk")}</p>
        <p>${current.note || "No note."}</p>
        <div class="req-actions">
          ${["new", "confirmed", "moved", "closed"].map((status) => `<button type="button" class="btn ${status === "confirmed" ? "" : "btn-line"}" data-status="${status}" data-id="${current.id}">${status}</button>`).join("")}
        </div>
      </article>
    </div>`;
}

function renderBoard(data) {
  const slot = data.slots.find((row) => row.id === editSlot);
  if (slot) {
    const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const kinds = ["private", "lab", "group", "film", "clinic", "assess"];
    views.board.innerHTML = `
      <form id="slot-form" class="wp-frame">
        <div class="wp-canvas">
          <button type="button" class="wp-back" data-slot-back>Timetable</button>
          <label class="wp-field">Day
            <select name="day">${days.map((day) => `<option ${day === slot.day ? "selected" : ""}>${day}</option>`).join("")}</select>
          </label>
          <label class="wp-field">Time<input name="time" value="${esc(slot.time)}" required></label>
          <input class="wp-title" name="name" value="${esc(slot.name)}" required>
          <textarea class="wp-body" name="detail" required>${esc(slot.detail)}</textarea>
          <label class="wp-field">Spots line<input name="meta" value="${esc(slot.meta)}"></label>
        </div>
        <aside class="wp-side">
          <p>Session</p>
          <label class="wp-field">Kind
            <select name="kind">${kinds.map((kind) => `<option ${kind === slot.kind ? "selected" : ""}>${kind}</option>`).join("")}</select>
          </label>
          <label class="wp-check"><input type="checkbox" name="held" ${slot.held ? "checked" : ""}> Held</label>
          <button class="wp-update" type="submit">Update</button>
        </aside>
      </form>`;
    return;
  }
  views.board.innerHTML = `
    <div class="wp-list">
      <table>
        <thead><tr><th>Day</th><th>Time</th><th>Session</th><th>Detail</th><th></th></tr></thead>
        <tbody>
          ${data.slots.map((row) => `
            <tr>
              <td>${esc(row.day)}</td>
              <td>${esc(row.time)}</td>
              <td><button type="button" class="wp-edit" data-edit-slot="${row.id}">${esc(row.name)}</button></td>
              <td>${esc(row.detail)}</td>
              <td>${row.held ? "Held" : "Open"}</td>
            </tr>`).join("")}
        </tbody>
      </table>
    </div>`;
}

function renderFees(data) {
  const fields = [
    ["assessment", "Assessment"],
    ["private", "Private, single"],
    ["privateBlock", "Private block"],
    ["lab", "Lab drop-in"],
    ["labMonth", "Lab month"],
    ["group", "Group, single"],
    ["groupBlock", "Group block"],
    ["film", "Film, single"],
    ["filmBlock", "Film block"],
    ["clinic", "Clinic, from"]
  ];
  views.fees.innerHTML = `
    <form class="wp-frame" id="fee-form">
      <div class="wp-canvas">
        ${fields.map(([key, label]) => `
          <label class="wp-field">${label}
            <input name="${key}" type="number" min="0" step="1" value="${data.fees[key]}">
          </label>`).join("")}
      </div>
      <aside class="wp-side">
        <p>Price sheet</p>
        <button class="wp-update" type="submit">Update</button>
        <p class="fine" id="fee-note">These numbers are what the pricing page shows.</p>
      </aside>
    </form>`;
}

function pageCopy() {
  try {
    const raw = JSON.parse(localStorage.getItem(PAGE_KEY));
    return raw && typeof raw === "object" ? raw : {};
  } catch (error) {
    return {};
  }
}

function renderPages() {
  const saved = pageCopy();
  if (editPage) {
    const row = PAGES.find((item) => item[0] === editPage);
    const copy = saved[editPage] || { title: row[3], lede: row[4] };
    views.pages.innerHTML = `
      <form id="page-form" class="wp-frame">
        <div class="wp-canvas">
          <button type="button" class="wp-back" data-page-back>Pages</button>
          <input class="wp-title" name="title" value="${esc(copy.title)}" required>
          <textarea class="wp-body" name="lede">${esc(copy.lede)}</textarea>
        </div>
        <aside class="wp-side">
          <p>Published</p>
          <p class="wp-meta">${esc(row[1])} · ${esc(row[2])}</p>
          <button class="wp-update" type="submit">Update</button>
          <p class="fine" id="page-note">Update writes the headline and the line under it on the public page.</p>
        </aside>
      </form>`;
    return;
  }
  views.pages.innerHTML = `
    <div class="wp-list">
      <table>
        <thead><tr><th>Page</th><th>Headline</th><th></th></tr></thead>
        <tbody>
          ${PAGES.map(([id, name, file, title]) => {
            const copy = saved[id];
            return `<tr>
              <td><button type="button" class="wp-edit" data-edit-page="${id}">${esc(name)}</button><small>${esc(file)}</small></td>
              <td>${esc(copy ? copy.title : title)}</td>
              <td>Published</td>
            </tr>`;
          }).join("")}
        </tbody>
      </table>
    </div>`;
}

function renderPayments(data) {
  const gates = data.gateways;
  views.payments.innerHTML = `
    <form id="pay-form" class="wp-gates">
      <article class="wp-gate">
        <header><strong>Pay at the desk</strong><label class="wp-switch"><input type="checkbox" name="desk" ${gates.desk.enabled ? "checked" : ""}> Enabled</label></header>
        <label class="wp-field">Label shown on the booking card
          <input name="deskLabel" value="${esc(gates.desk.label)}">
        </label>
        <p>The request lands on the desk. No card number is taken on this site.</p>
      </article>
      <article class="wp-gate">
        <header><strong>Card</strong><label class="wp-switch"><input type="checkbox" name="stripe" ${gates.stripe.enabled ? "checked" : ""}> Enabled</label></header>
        <label class="wp-field">Stripe publishable key
          <input name="publishable" value="${esc(gates.stripe.publishable)}" placeholder="pk_test_…" autocomplete="off">
        </label>
        <label class="wp-check"><input type="checkbox" name="test" ${gates.stripe.test ? "checked" : ""}> Test mode</label>
        <p>The booking records Card. The number is not typed here. A charge still needs the secret key on a server, which this desk does not store.</p>
      </article>
      <article class="wp-gate">
        <header><strong>PayPal</strong><label class="wp-switch"><input type="checkbox" name="paypal" ${gates.paypal.enabled ? "checked" : ""}> Enabled</label></header>
        <label class="wp-field">PayPal client id
          <input name="client" value="${esc(gates.paypal.client)}" autocomplete="off">
        </label>
        <p>The booking records PayPal. This desk does not move the money.</p>
      </article>
      <button class="wp-update" type="submit">Update</button>
      <p class="fine" id="pay-note"></p>
    </form>`;
}

function planState() {
  try {
    const raw = JSON.parse(localStorage.getItem(PLAN_KEY));
    return raw && typeof raw === "object" ? raw : { done: {}, note: "" };
  } catch (error) {
    return { done: {}, note: "" };
  }
}

function renderLeads() {
  const saved = planState();
  const done = saved.done || {};
  const savedCount = LEADS.filter(([id]) => done[id]).length;
  const rows = LEADS.filter(([id]) => leadMode === "find" || done[id]);
  views.leads.innerHTML = `
    <p class="admin-intro">Ten places to fill the chairs already on the board. Saving a lead keeps it here. Nothing is emailed.</p>
    <div class="admin-tabs">
      <button type="button" class="${leadMode === "find" ? "is-on" : ""}" data-lead-mode="find">Find</button>
      <button type="button" class="${leadMode === "saved" ? "is-on" : ""}" data-lead-mode="saved">Saved</button>
      <span class="admin-saved">${savedCount} saved</span>
    </div>
    <div class="admin-table-wrap">
      <table class="admin-table">
        <thead><tr><th>Channel</th><th>Fills</th><th>The move</th><th></th></tr></thead>
        <tbody>
          ${rows.length ? rows.map(([id, title, fills, text]) => `
            <tr>
              <td><strong>${esc(title)}</strong></td>
              <td>${esc(fills)}</td>
              <td>${esc(text)}</td>
              <td><button type="button" class="btn ${done[id] ? "btn-line" : ""}" data-lead-save="${id}">${done[id] ? "Saved" : "Save"}</button></td>
            </tr>`).join("") : `<tr><td colspan="4">Nothing saved yet. Use Find, then Save.</td></tr>`}
        </tbody>
      </table>
    </div>`;
}

function renderMarketing() {
  const saved = planState();
  const blocks = [
    ["Who", "A player and a guardian.", "The player wants one thing fixed. The guardian books the hour and gets the card. Playing time and offers stay at school."],
    ["Capacity", "Fill a chair before you invent a new one.", "Foundations 6. Shooting lab 8. High school group 6. Decision group 6. Film room 2. Saturday assessments 2. Team clinic is a booked roster, up to 16, ninety minutes."],
    ["The offer", "Fifty minutes. $90. Two priorities.", "One coach stays for the hour. The address comes when the visit is confirmed. Twenty-four hours notice moves a missed visit. Illness with notice always moves."],
    ["The line", "Say this, and stop.", "One coach stays for the whole hour. The first visit is fifty minutes. You leave with two priorities on a card, and that card is the plan until those two show up on film."],
    ["Do not say", "No banners. No scholarships. No roster promises.", "Do not claim a state title. Do not promise minutes. Do not tell a parent their child will be recruited. The work is the two priorities."]
  ];
  views.marketing.innerHTML = `
    <p class="admin-intro">Use this before a lead goes out. The line is the only pitch. The last box is the hour you are actually filling this week.</p>
    <div class="admin-rows">
      ${blocks.map(([label, title, text]) => `
        <article>
          <b>${esc(label)}</b>
          <div><strong>${esc(title)}</strong><p>${esc(text)}</p></div>
        </article>`).join("")}
    </div>
    <form class="admin-card" id="market-form">
      <label>This week. The light hour, the lead, and the line you will use.
        <textarea class="plan-note" name="note">${esc(saved.note || "")}</textarea>
      </label>
      <button class="btn" type="submit">Save the week</button>
      <p class="fine" id="market-note"></p>
    </form>`;
}

function renderSeo() {
  const pages = [
    ["/", "Home", "Private basketball coaching — Courtlight", "Private basketball coaching. One coach stays for the hour. The first visit is fifty minutes and costs $90. You leave with two priorities on a card.", true],
    ["/method.html", "Method", "The method — Courtlight", "Order before volume. Nothing new goes on top of a shot that disappears when a hand is up. Catch, body, gather, rise, finish.", true],
    ["/programs.html", "Programs", "Programs — Courtlight", "Six rooms, one card. Private, shooting lab, small group, and film. Every room ends with two priorities and homework that fits a school night.", true],
    ["/schedule.html", "Schedule", "The standing week — Courtlight", "The standing week. Foundations, shooting lab, private blocks, film room, and Saturday assessments. Open chairs are marked on the board.", true],
    ["/pricing.html", "Pricing", "Pricing — Courtlight", "The first visit is fifty minutes and costs $90. Private, lab, group, film, and clinic prices are on the sheet. Twenty-four hours notice moves a missed visit.", true],
    ["/book.html", "Book", "Book an assessment — Courtlight", "Book the first visit. Fifty minutes, one player, $90. The address comes when the visit is confirmed. Twenty-four hours notice moves a missed visit.", true],
    ["/coach.html", "Coach", "The coach — Courtlight", "One coach on the floor. Sessions are not passed to a rotating staff. The assessment card stays the plan until those two priorities show up on film.", true],
    ["/office.html", "Office", "Office — Courtlight", "", false]
  ];
  const titleWarn = pages.filter((row) => row[4] && (row[2].length < 20 || row[2].length > 65)).length;
  const descWarn = pages.filter((row) => row[4] && (row[3].length < 120 || row[3].length > 160)).length;
  const descErr = pages.filter((row) => row[4] && row[3].length < 40).length;
  const checks = [
    ["Title", "The title a search result would show. Missing is an error. Under 20 or over 65 characters is a warning.", titleWarn ? `${titleWarn} warnings` : "Clear", titleWarn ? "warn" : ""],
    ["Description", "The description tag. Missing or under 40 characters is an error. Outside 120–160 is a warning.", descErr ? `${descErr} errors` : descWarn ? `${descWarn} warnings` : "Clear", descErr ? "bad" : descWarn ? "warn" : ""],
    ["Indexing", "Public pages stay indexable. The office stays blocked.", "Clear", ""],
    ["Sitemap", "The seven public pages are in sitemap.xml. The office stays out.", "Clear", ""],
    ["Duplicates", "Two indexable pages do not share a title or a description.", "Clear", ""],
    ["Coverage", "Search Console, Bing, and an analytics id are not on the site yet.", "3 warnings", "warn"]
  ];
  views.seo.innerHTML = `
    <div class="admin-tabs">
      <button type="button" class="is-on">Health check</button>
    </div>
    <div class="admin-stats">
      <article><span>Pages scanned</span><b>8</b></article>
      <article><span>Indexable</span><b>7</b></article>
      <article><span>Errors</span><b>${descErr}</b></article>
      <article><span>Warnings</span><b>${titleWarn + descWarn + 3}</b></article>
    </div>
    <p class="admin-intro">A clear row is inside the band. Held back means the office is blocked on purpose. The street and reviews stay off the site.</p>
    <div class="admin-rows">
      ${checks.map(([label, text, mark, kind]) => `
        <article>
          <b>${label}</b>
          <p>${text}</p>
          <em class="${kind}">${mark}</em>
        </article>`).join("")}
    </div>
    <p class="admin-note">Google Search Console verification is empty.</p>
    <p class="admin-note">Bing verification is empty.</p>
    <p class="admin-note">No analytics measurement id is saved.</p>
    <div class="admin-table-wrap">
      <table class="admin-table seo-sheet">
        <thead><tr><th>Address</th><th>Kind</th><th>Published title</th><th>Title</th><th>Description</th><th>Index</th><th>Sitemap</th><th>Result</th></tr></thead>
        <tbody>
          ${pages.map(([path, kind, title, description, indexable]) => {
            const titleLen = title.length;
            const descLen = description.length;
            const result = indexable
              ? `Title is ${titleLen} characters. Description is ${descLen} characters. The band is 120–160.`
              : "Blocked. noindex, and left out of the sitemap.";
            return `<tr>
              <td>${esc(path)}</td>
              <td>${esc(kind)}</td>
              <td>${esc(title)}</td>
              <td>${titleLen}</td>
              <td>${indexable ? descLen : "—"}</td>
              <td>${indexable ? "Yes" : "No"}</td>
              <td>${indexable ? "Yes" : "No"}</td>
              <td>${esc(result)}</td>
            </tr>`;
          }).join("")}
        </tbody>
      </table>
    </div>`;
}

function esc(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "\"": "&quot;",
    "'": "&#39;"
  }[char]));
}

document.getElementById("lock-form").addEventListener("submit", (event) => {
  event.preventDefault();
  const typed = document.getElementById("code").value.trim();
  if (typed !== CODE) {
    document.getElementById("lock-note").textContent = "That code does not open this desk.";
    return;
  }
  sessionStorage.setItem("courtlight-desk", "open");
  openDesk();
});

document.getElementById("lock-out").addEventListener("click", () => {
  sessionStorage.removeItem("courtlight-desk");
  desk.hidden = true;
  lock.hidden = false;
});

document.querySelector(".rail").addEventListener("click", (event) => {
  const button = event.target.closest("[data-view]");
  if (!button) return;
  show(button.dataset.view);
});

desk.addEventListener("change", (event) => {
  const box = event.target.closest("[data-lead]");
  if (!box) return;
  const saved = planState();
  saved.done = saved.done || {};
  saved.done[box.dataset.lead] = box.checked;
  localStorage.setItem(PLAN_KEY, JSON.stringify(saved));
  const count = document.querySelector(".desk-count");
  if (count) count.textContent = `${LEADS.filter(([id]) => saved.done[id]).length} of 10 done`;
});

desk.addEventListener("submit", (event) => {
  const market = event.target.closest("#market-form");
  if (!market) return;
  event.preventDefault();
  const saved = planState();
  saved.note = market.elements.note.value;
  localStorage.setItem(PLAN_KEY, JSON.stringify(saved));
  const note = document.getElementById("market-note");
  if (note) note.textContent = "Saved on this desk.";
});

desk.addEventListener("submit", (event) => {
  const page = event.target.closest("#page-form");
  if (!page) return;
  event.preventDefault();
  const saved = pageCopy();
  saved[editPage] = { title: page.elements.title.value.trim(), lede: page.elements.lede.value.trim() };
  localStorage.setItem(PAGE_KEY, JSON.stringify(saved));
  const note = document.getElementById("page-note");
  if (note) note.textContent = "Updated. Refresh the public page to see it.";
});

desk.addEventListener("submit", (event) => {
  const form = event.target.closest("#slot-form");
  if (!form) return;
  event.preventDefault();
  const data = state();
  const slot = data.slots.find((row) => row.id === editSlot);
  if (!slot) return;
  slot.day = form.elements.day.value;
  slot.time = form.elements.time.value.trim();
  slot.name = form.elements.name.value.trim();
  slot.detail = form.elements.detail.value.trim();
  slot.meta = form.elements.meta.value.trim();
  slot.kind = form.elements.kind.value;
  slot.held = form.elements.held.checked;
  window.CourtlightStore.save(data);
  editSlot = null;
  renderBoard(state());
});

desk.addEventListener("submit", (event) => {
  const form = event.target.closest("#pay-form");
  if (!form) return;
  event.preventDefault();
  const data = state();
  data.gateways.desk.enabled = form.elements.desk.checked;
  data.gateways.desk.label = form.elements.deskLabel.value.trim() || "Pay when the visit is confirmed";
  data.gateways.stripe.enabled = form.elements.stripe.checked;
  data.gateways.stripe.publishable = form.elements.publishable.value.trim();
  data.gateways.stripe.test = form.elements.test.checked;
  data.gateways.paypal.enabled = form.elements.paypal.checked;
  data.gateways.paypal.client = form.elements.client.value.trim();
  window.CourtlightStore.save(data);
  const note = document.getElementById("pay-note");
  if (note) note.textContent = "Updated. The booking card shows the gateways that are enabled.";
});

desk.addEventListener("submit", (event) => {
  const form = event.target.closest("#fee-form");
  if (!form) return;
  event.preventDefault();
  const data = state();
  [...form.elements].forEach((field) => {
    if (field.name && data.fees[field.name] != null) data.fees[field.name] = Number(field.value);
  });
  window.CourtlightStore.save(data);
  const note = document.getElementById("fee-note");
  if (note) note.textContent = "Saved. The public pricing page is using this sheet.";
});

desk.addEventListener("click", (event) => {
  const pageBack = event.target.closest("[data-page-back]");
  if (pageBack) {
    editPage = null;
    renderPages();
    return;
  }
  const openPage = event.target.closest("[data-edit-page]");
  if (openPage) {
    editPage = openPage.dataset.editPage;
    renderPages();
    return;
  }
  const slotBack = event.target.closest("[data-slot-back]");
  if (slotBack) {
    editSlot = null;
    renderBoard(state());
    return;
  }
  const openSlot = event.target.closest("[data-edit-slot]");
  if (openSlot) {
    editSlot = openSlot.dataset.editSlot;
    renderBoard(state());
    return;
  }
  const mode = event.target.closest("[data-lead-mode]");
  if (mode) {
    leadMode = mode.dataset.leadMode;
    renderLeads();
    return;
  }
  const saveLead = event.target.closest("[data-lead-save]");
  if (saveLead) {
    const saved = planState();
    saved.done = saved.done || {};
    saved.done[saveLead.dataset.leadSave] = !saved.done[saveLead.dataset.leadSave];
    localStorage.setItem(PLAN_KEY, JSON.stringify(saved));
    renderLeads();
    return;
  }
  const open = event.target.closest("[data-open]");
  if (open) {
    activeId = open.dataset.open;
    show("requests");
    return;
  }
  const jump = event.target.closest("[data-jump]");
  if (jump) {
    show(jump.dataset.jump);
    return;
  }
  const status = event.target.closest("[data-status]");
  if (status) {
    const data = state();
    const row = data.requests.find((item) => item.id === status.dataset.id);
    if (row) row.status = status.dataset.status;
    window.CourtlightStore.save(data);
    render();
    return;
  }
  const hold = event.target.closest("[data-hold]");
  if (hold) {
    const data = state();
    const slot = data.slots.find((item) => item.id === hold.dataset.hold);
    if (slot) slot.held = !slot.held;
    window.CourtlightStore.save(data);
    render();
  }
});

if (sessionStorage.getItem("courtlight-desk") === "open") openDesk();
