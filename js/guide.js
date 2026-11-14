import { h, icon, store, toast, copyText, checklist } from "./ui.js";
import { formatClock } from "./lib/calc.js";

const AGENDA = [
  { time: "00:00–00:30", label: "Conceptos esenciales + diagnóstico", min: 30 },
  { time: "00:30–01:05", label: "Laboratorio 1: productividad", min: 35 },
  { time: "01:05–01:35", label: "Laboratorio 2: análisis de datos", min: 30 },
  { time: "01:35–01:45", label: "Pausa", min: 10, pause: true },
  { time: "01:45–02:10", label: "Laboratorio 2: decisiones", min: 25 },
  { time: "02:10–03:00", label: "Priorización, mini-reto y cierre", min: 50 },
];

const PRESETS = [
  { label: "Debate", min: 5 },
  { label: "Pausa", min: 10 },
  { label: "Mini-reto", min: 17 },
  { label: "Práctica", min: 25 },
  { label: "Análisis", min: 30 },
  { label: "Actividad autónoma", min: 40 },
];

const RULES = [
  "Usa información pública, ficticia o expresamente autorizada.",
  "Anonimiza datos personales y comerciales sensibles.",
  "Verifica fórmulas, porcentajes y afirmaciones relevantes.",
  "No delegues decisiones con consecuencias reales sin supervisión.",
];

const REVIEW = [
  "¿La IA asignó responsables que nadie había definido?",
  "¿Confundió un retraso posible con uno confirmado?",
  "¿Creó plazos o importes ausentes de las notas?",
  "¿Qué pregunta harías al equipo antes de ejecutar?",
];

const WEEK = [
  { day: "Día 1", text: "Identifica una tarea o decisión real (sin compartir datos sensibles)." },
  { day: "Días 2–4", text: "Define indicador, prepara datos seguros y prueba." },
  { day: "Días 5–6", text: "Verifica, compara y ajusta." },
  { day: "Día 7", text: "Decide si merece la pena mantener el nuevo método." },
];

const MINI = [
  ["problema", "1. Problema observado"],
  ["dato", "2. Dato que lo respalda"],
  ["opciones", "3. Dos opciones de intervención"],
  ["decision", "4. Una decisión condicionada y su riesgo"],
  ["indicador", "5. Indicador para revisar el resultado"],
];

// ---------- timer ----------
const timer = { total: 25 * 60, left: 25 * 60, running: false, endAt: 0, tick: null, label: "Práctica · 25 min" };

function renderTimer() {
  const clock = document.getElementById("timer-clock");
  clock.textContent = formatClock(timer.left);
  clock.classList.toggle("done", timer.left <= 0);
  document.getElementById("timer-label").textContent = timer.label;
  document.getElementById("timer-bar").style.width = `${100 * (1 - timer.left / timer.total)}%`;
  const btn = document.getElementById("timer-toggle");
  btn.replaceChildren(icon(timer.running ? "pause" : "play"), h("span", {}, timer.running ? "Pausar" : timer.left <= 0 ? "Repetir" : "Iniciar"));
  document.title = timer.running ? `${formatClock(timer.left)} · Kit IA HORECA` : "Kit IA HORECA · Módulo 1";
}

function stopTimer() {
  timer.running = false;
  clearInterval(timer.tick);
}

function startTimer() {
  if (timer.left <= 0) timer.left = timer.total;
  timer.running = true;
  timer.endAt = Date.now() + timer.left * 1000;
  clearInterval(timer.tick);
  timer.tick = setInterval(() => {
    timer.left = Math.max(0, (timer.endAt - Date.now()) / 1000);
    if (timer.left <= 0) {
      stopTimer();
      document.getElementById("timer-announce").textContent = `Tiempo terminado: ${timer.label}`;
      toast("⏱ ¡Tiempo!");
      beep();
    }
    renderTimer();
  }, 250);
  renderTimer();
}

function setTimer(minutes, label) {
  stopTimer();
  timer.total = timer.left = minutes * 60;
  timer.label = `${label} · ${minutes} min`;
  renderTimer();
}

function beep() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    [0, 0.25, 0.5].forEach((t) => {
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.frequency.value = 880; g.gain.value = 0.08;
      o.connect(g).connect(ctx.destination);
      o.start(ctx.currentTime + t); o.stop(ctx.currentTime + t + 0.15);
    });
  } catch { /* audio not available */ }
}

export function initGuide() {
  // agenda
  document.getElementById("agenda").replaceChildren(...AGENDA.map((a) =>
    h("li", { class: "tl-item" + (a.pause ? " pause" : "") },
      h("span", { class: "tl-time" }, a.time),
      h("span", {}, a.label),
      h("button", {
        class: "btn ghost", type: "button", "aria-label": `Cronometrar: ${a.label} (${a.min} min)`, title: `Cronometrar ${a.min} min`,
        onclick: () => { setTimer(a.min, a.label); startTimer(); document.getElementById("timer").scrollIntoView({ behavior: "smooth", block: "center" }); },
      }, icon("play"), `${a.min}′`),
    )));

  // timer
  document.getElementById("timer-presets").replaceChildren(...PRESETS.map((p) =>
    h("button", { class: "chip", type: "button", onclick: () => setTimer(p.min, p.label) }, `${p.min}′ ${p.label}`)));
  document.getElementById("timer-toggle").addEventListener("click", () => (timer.running ? (stopTimer(), renderTimer()) : startTimer()));
  document.getElementById("timer-reset").addEventListener("click", () => { stopTimer(); timer.left = timer.total; renderTimer(); });
  renderTimer();

  // checklists
  checklist(document.getElementById("rules"), document.getElementById("rules-count"), "rules", RULES);
  checklist(document.getElementById("review"), document.getElementById("review-count"), "review", REVIEW);

  // week plan
  const weekState = store.get("week", {});
  const weekCount = document.getElementById("week-count");
  const updateWeek = () => { weekCount.textContent = `${WEEK.filter((_, i) => weekState[i]).length}/${WEEK.length}`; };
  document.getElementById("week").replaceChildren(...WEEK.map((w, i) => {
    const input = h("input", { type: "checkbox", id: `week-${i}` });
    input.checked = !!weekState[i];
    input.addEventListener("change", () => { weekState[i] = input.checked; store.set("week", weekState); updateWeek(); });
    return h("div", { class: "day" }, h("div", { class: "day-title" }, w.day), h("label", { class: "check", for: `week-${i}` }, input, h("span", {}, w.text)));
  }));
  updateWeek();

  // mini-reto
  const mini = store.get("minireto", {});
  const form = document.getElementById("minireto");
  form.replaceChildren(...MINI.map(([key, label]) => {
    const input = h("input", { id: `mini-${key}`, name: key });
    input.value = mini[key] || "";
    input.addEventListener("input", () => { mini[key] = input.value; store.set("minireto", mini); });
    return h("div", { class: "field", style: "margin:0" }, h("label", { for: `mini-${key}` }, label), input);
  }));
  document.getElementById("minireto-copy").addEventListener("click", () => {
    const text = MINI.filter(([k]) => (mini[k] || "").trim()).map(([k, label]) => `${label}: ${mini[k].trim()}`).join("\n");
    copyText(text, "Recomendación copiada");
  });
  document.getElementById("minireto-clear").addEventListener("click", () => {
    MINI.forEach(([k]) => { mini[k] = ""; document.getElementById(`mini-${k}`).value = ""; });
    store.set("minireto", mini);
  });
}
