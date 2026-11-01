// ---------- Holat ----------
const fresh = () => ({ screen: "placement", p: { i: 0, s: { 1: 0, 2: 0, 3: 0 } }, level: 0, lesson: 0, i: 0, sc: {} });
function load() { try { return JSON.parse(localStorage.getItem(sk())) || fresh(); } catch (e) { return fresh(); } }
function save() { try { localStorage.setItem(sk(), JSON.stringify(s)); } catch (e) {} }
try { subj = localStorage.getItem("pydaraja-subj") || "python"; } catch (e) {}
if (!SUBJECTS[subj]) subj = "python";
PLACEMENT = SUBJECTS[subj].placement; LESSONS = SUBJECTS[subj].lessons;
let s = load();
let view = "home"; // "home" yoki "flow"
const app = document.getElementById("app");

const lessonsOf = (l) => LESSONS[l] || [];
const curLesson = () => lessonsOf(s.level)[s.lesson] || [];
const scoreOf = (l, n) => s.sc[l + "-" + n] || 0;

// ---------- Yordamchilar ----------
function h(tag, cls, text) { const n = document.createElement(tag); if (cls) n.className = cls; if (text !== undefined) n.textContent = text; return n; }
function btn(text, cls, fn) { const b = h("button", cls, text); b.addEventListener("click", fn); return b; }
function shuffle(a) { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
function go(next) { view = "flow"; s.screen = next; save(); render(); }

// Xato savollar, taymer va ball
let tick = null;
const TIME = 30; // har bir savolga soniya
let timerOn = true;
try { timerOn = localStorage.getItem("pydaraja-timer") !== "off"; } catch (e) {}
function addWrong(item) {
  s.wrong = s.wrong || [];
  if (!s.wrong.some((w) => w[0] === item[0])) s.wrong.push(item);
  if (s.wrong.length > 60) s.wrong.shift();
}
function dropWrong(item) { s.wrong = (s.wrong || []).filter((w) => w[0] !== item[0]); }

// Bitta savolni koʼrsatadi; javobdan keyin toʼgʼrisini belgilaydi.
// Savolning 4-elementi (ixtiyoriy) — izoh: ["Savol", [variantlar], 0, "Izoh matni"]
function ask(item, n, total, tag, lastLabel, onAnswer) {
  const [q, opts, ans, why] = item;
  app.append(h("p", "", tag + " · Savol " + n + " / " + total + " · Ball: " + (s.pts || 0)));
  const bar = h("div", "bar"), fill = h("span");
  fill.style.width = ((n - 1) * 100 / total) + "%";
  bar.append(fill); app.append(bar);
  const clock = h("div", "clock");
  if (timerOn) app.append(clock);
  app.append(h("h2", "", q));

  const items = shuffle(opts.map((label, i) => ({ label, ok: i === ans })));
  const right = items.findIndex((x) => x.ok);
  const note = h("p", "why"); note.hidden = true;
  const next = btn(n === total ? lastLabel : "Keyingisi", "btn", render);
  next.hidden = true;
  let left = TIME, done = false;

  function finish(i) {
    if (done) return;
    done = true; clearInterval(tick);
    bs.forEach((x) => (x.disabled = true));
    const ok = i !== null && items[i].ok;
    if (ok) {
      bs[i].classList.add("correct");
      s.pts = (s.pts || 0) + 10 + (timerOn ? Math.ceil(left / 3) : 0);
      dropWrong(item);
    } else {
      if (i !== null) bs[i].classList.add("wrong");
      bs[right].classList.add("correct"); // toʼgʼri javobni belgilash
      addWrong(item);
    }
    if (i === null) clock.textContent = "Vaqt tugadi";
    if (why) { note.textContent = "Izoh: " + why; note.hidden = false; }
    onAnswer(ok); save(); next.hidden = false; next.focus();
  }

  const bs = items.map((it, i) => {
    const b = h("button", "opt", it.label);
    b.addEventListener("click", () => finish(i));
    return b;
  });
  const box = h("div"); bs.forEach((b) => box.append(b));
  app.append(box, note, next);

  if (timerOn) {
    clock.textContent = left + " s";
    tick = setInterval(() => { left -= 1; clock.textContent = left + " s"; if (left <= 0) finish(null); }, 1000);
  }
}

// Xatolarni takrorlash
let rvQ = [], rvI = 0;
function startReview() {
  if (s.screen !== "review") s.prev = s.screen;
  rvQ = shuffle((s.wrong || []).slice(-10)); rvI = 0;
  go("review");
}
function review() {
  if (!rvQ.length) { if ((s.wrong || []).length) return startReview(); view = "home"; return render(); }
  if (rvI >= rvQ.length) {
    app.append(h("h1", "", "Takrorlash tugadi"), h("p", "", "Hali xato qolgan savollar: " + (s.wrong || []).length));
    app.append(btn("Bosh sahifa", "btn", () => { s.screen = s.prev || "placement"; rvQ = []; save(); view = "home"; render(); }));
    return;
  }
  ask(rvQ[rvI], rvI + 1, rvQ.length, "Xatolarni takrorlash", "Yakunlash", () => { rvI += 1; });
}

// Natijalar sahifasi
function statsPage() {
  app.append(h("h1", "", "Natijalarim"));
  const t = h("table");
  t.innerHTML = "<tr><th>Fan</th><th>Daraja</th><th>Toʼgʼri</th><th>Ball</th></tr>";
  let totalPts = 0, totalWrong = 0;
  Object.keys(SUBJECTS).forEach((k) => {
    let st = k === subj ? s : null;
    if (!st) { try { st = JSON.parse(localStorage.getItem(k === "python" ? KEY : KEY + "-" + k)); } catch (e) {} }
    const ok = st ? Object.values(st.sc || {}).reduce((a, b) => a + b, 0) : 0;
    const pts = st ? (st.pts || 0) : 0;
    totalPts += pts; totalWrong += st ? (st.wrong || []).length : 0;
    const r = h("tr");
    r.append(h("td", "", SUBJECTS[k].name), h("td", "", st && st.level ? LV[st.level] + " · " + (st.lesson + 1) + "-dars" : "—"), h("td", "", String(ok)), h("td", "", String(pts)));
    t.append(r);
  });
  app.append(h("p", "", "Jami ball: " + totalPts + " · Takrorlash kerak: " + totalWrong + " ta savol"), t);
  app.append(btn("Bosh sahifa", "btn", () => { view = "home"; render(); }));
}

// ---------- Ekranlar ----------
function render() {
  clearInterval(tick);
  app.innerHTML = "";
  const badge = document.getElementById("badge");
  badge.hidden = !s.level;
  if (s.level) badge.textContent = SUBJECTS[subj].name + " · " + LV[s.level] + " · " + (s.lesson + 1) + "-dars";
  if (view === "home") home();
  else if (view === "stats") statsPage();
  else ({ placement, pres, lesson, lres, final, review })[s.screen]();
  window.scrollTo(0, 0);
}

function home() {
  const row = h("div", "subjects");
  Object.keys(SUBJECTS).forEach((k) => row.append(btn(SUBJECTS[k].name, "chip" + (k === subj ? " on" : ""), () => { useSubject(k); view = "home"; render(); })));
  app.append(row);
  app.append(h("h1", "", SUBJECTS[subj].name + " darajangizni aniqlang"));
  app.append(h("p", "", "Avval qisqa test bilan darajangiz aniqlanadi. Keyin shu darajaga mos darslarni yechib, yuqoriga koʼtarilasiz."));
  const started = s.level > 0 || s.p.i > 0;
  app.append(btn(started ? "Davom ettirish" : "Darajamni aniqlash", "btn", () => go(s.screen)));
  if ((s.wrong || []).length) app.append(btn("Xatolarimni qayta yechish (" + s.wrong.length + ")", "btn ghost", startReview));
  app.append(h("p", "", "Testsiz boshlamoqchimisiz? Darajani oʼzingiz tanlang:"));
  const pick = h("div", "levels");
  [1, 2, 3].forEach((l) => pick.append(btn(LV[l], "btn", () => {
    if (l !== s.level) { s.level = l; s.lesson = 0; s.i = 0; }
    go("lesson");
  })));
  app.append(pick);

  const steps = h("ol", "steps");
  [["Daraja testi", "15 ta savol. Natijaga qarab Boshlangʼich, Oʼrta yoki Yuqori daraja belgilanadi."],
   ["Darslar", "Har bir darsda 10 ta savol. Xato qilsangiz, toʼgʼri javob yashil bilan koʼrsatiladi."],
   ["Yuqori daraja", "Darajadagi darslar tugagach, keyingi darajaga oʼtasiz. Toʼxtagan joyingiz saqlanadi."]]
    .forEach(([t, d]) => { const li = h("li"); li.append(h("h3", "", t), h("p", "", d)); steps.append(li); });
  app.append(steps);
}

function placement() {
  if (s.p.i >= PLACEMENT.length) return go("pres");
  const i = s.p.i, lvl = Math.floor(i / 5) + 1;
  ask(PLACEMENT[i], i + 1, PLACEMENT.length, "Daraja testi", "Natijani koʼrish", (ok) => {
    if (ok) s.p.s[lvl] += 1;
    s.p.i += 1;
  });
}

function pres() {
  let lv = 0;
  for (let l = 1; l <= 3 && s.p.s[l] >= PASS; l++) lv = l;
  const start = Math.max(lv, 1);
  app.append(h("p", "", "Sizning darajangiz"), h("div", "big", LV[start]));
  if (lv === 0) app.append(h("p", "", "Boshlangʼich darajadan boshlaymiz. Bu yaxshi boshlanish."));
  const t = h("table");
  t.innerHTML = "<tr><th>Daraja</th><th>Toʼgʼri javoblar</th></tr>";
  [1, 2, 3].forEach((l) => { const r = h("tr"); r.append(h("td", "", LV[l]), h("td", "", s.p.s[l] + " / 5")); t.append(r); });
  app.append(t);
  app.append(btn("Darslarni boshlash", "btn", () => { s.level = start; s.lesson = 0; s.i = 0; go("lesson"); }));
  app.append(btn("Testni qayta topshirish", "btn ghost", () => { s.p = fresh().p; s.level = 0; go("placement"); }));
}

function lesson() {
  const list = curLesson();
  if (s.i >= list.length) return go("lres");
  ask(list[s.i], s.i + 1, list.length, LV[s.level] + " · " + (s.lesson + 1) + "-dars", "Darsni yakunlash", (ok) => {
    if (ok) s.sc[s.level + "-" + s.lesson] = scoreOf(s.level, s.lesson) + 1;
    s.i += 1;
  });
}

function lres() {
  app.append(h("p", "", LV[s.level] + " · " + (s.lesson + 1) + "-dars yakunlandi"));
  app.append(h("div", "big", scoreOf(s.level, s.lesson) + " / " + curLesson().length));
  if (s.lesson + 1 < lessonsOf(s.level).length)
    app.append(btn("Keyingi dars", "btn", () => { s.lesson += 1; s.i = 0; go("lesson"); }));
  else if (s.level < 3 && lessonsOf(s.level + 1).length)
    app.append(btn(LV[s.level + 1] + " darajaga oʼtish", "btn", () => { s.level += 1; s.lesson = 0; s.i = 0; go("lesson"); }));
  else app.append(btn("Yakuniy natija", "btn", () => go("final")));
}

function final() {
  app.append(h("h1", "", "Tabriklaymiz!"), h("p", "", "Siz hozircha mavjud barcha darslarni yakunladingiz."));
  const t = h("table");
  t.innerHTML = "<tr><th>Daraja</th><th>Toʼgʼri javoblar</th></tr>";
  [1, 2, 3].forEach((l) => {
    const ls = lessonsOf(l); if (!ls.length) return;
    const tot = ls.reduce((a, x) => a + x.length, 0), sc = ls.reduce((a, _, i) => a + scoreOf(l, i), 0);
    const r = h("tr"); r.append(h("td", "", LV[l]), h("td", "", sc + " / " + tot)); t.append(r);
  });
  app.append(t, btn("Qaytadan boshlash", "btn ghost", resetAll));
}

function resetAll() {
  if (confirm("Hamma natijalar oʼchadi. Boshidan boshlaymizmi?")) { s = fresh(); view = "home"; save(); render(); }
}

document.getElementById("home").addEventListener("click", () => { view = "home"; render(); });
document.getElementById("reset").addEventListener("click", resetAll);
document.getElementById("stats").addEventListener("click", () => { view = "stats"; render(); });
function timerLabel() { document.getElementById("timer").textContent = "Taymer: " + (timerOn ? "yoqilgan" : "oʼchirilgan"); }
document.getElementById("timer").addEventListener("click", () => {
  timerOn = !timerOn;
  try { localStorage.setItem("pydaraja-timer", timerOn ? "on" : "off"); } catch (e) {}
  timerLabel(); render();
});
timerLabel();
render();
