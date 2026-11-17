import { h, store, copyText } from "./ui.js";
import { buildPrompt, promptScore } from "./lib/calc.js";

const FIELDS = [
  { key: "contexto", letter: "C", label: "Contexto", hint: "¿Para qué empresa, proceso y destinatario?", rows: 2 },
  { key: "objetivo", letter: "O", label: "Objetivo", hint: "¿Qué decisión o producto necesitas?", rows: 2 },
  { key: "datos", letter: "D", label: "Datos", hint: "¿Qué hechos y cifras proporcionas?", rows: 4 },
  { key: "formato", letter: "F", label: "Formato", hint: "¿Tabla, correo, pasos o resumen?", rows: 2 },
  { key: "verificacion", letter: "V", label: "Verificación", hint: "¿Qué debe comprobar y qué falta?", rows: 2 },
];

const LIMITS = [
  "No inventes fechas, cifras ni responsables.",
  "Marca como pendiente cualquier responsable o fecha no confirmados.",
  "No conviertas posibilidades en hechos ni inventes compromisos.",
  "No estimes ahorros sin datos de costes suficientes.",
  "Si te falta información, dilo en lugar de suponerla.",
];

const TEMPLATES = {
  "Productividad · Lab 1": {
    parts: {
      contexto: "Actúa como asistente de operaciones de una distribuidora HORECA (bebidas para bares, restaurantes, hoteles y tiendas). El resultado lo leerán el equipo y la dirección.",
      objetivo: "Convierte estas notas en un acta, tabla de tareas y correo.",
      datos: "6 reclamaciones por entregas incompletas.\nEl proveedor menciona un posible retraso, sin fecha confirmada.\nComercial pide revisar pedidos del canal bares.\nFinanzas debe hacer seguimiento de abonos.",
      formato: "Acta breve + tabla de tareas (tarea, responsable, fecha, estado) + correo al equipo. Después, una versión de 120 palabras para dirección.",
      verificacion: "Separa hechos, tareas y dudas. Indica qué información falta antes de ejecutar.",
    },
    limits: [0, 1, 2],
  },
  "Análisis de datos · Lab 2": {
    parts: {
      contexto: "Distribuidora HORECA ficticia. Analizo la pestaña Ventas del libro 04_Datos_HORECA.xlsx para el equipo comercial y de finanzas.",
      objetivo: "Obtén tres hallazgos cuantificables de la tabla.",
      datos: "[Pega aquí los encabezados y unas filas de la tabla]",
      formato: "Tabla con: hallazgo, cifra, cálculo utilizado y posible acción.",
      verificacion: "Diferencia hechos, hipótesis y datos ausentes. Muestra las operaciones para que pueda comprobar al menos dos.",
    },
    limits: [0, 4],
  },
  "Decisiones · Lab 2": {
    parts: {
      contexto: "Distribuidora HORECA ficticia que debe priorizar una intervención.",
      objetivo: "Compara estas tres opciones según impacto, facilidad y riesgo.",
      datos: "Opción A · Recuperación de clientes del canal bares.\nOpción B · Renegociación de un proveedor.\nOpción C · Revisión del mix de vinos.\nPesos: impacto 50 %, facilidad 30 %, riesgo 20 %.",
      formato: "Muéstrame una tabla, una recomendación condicionada («si…, entonces…») y dos riesgos.",
      verificacion: "Explica qué significan los pesos, su origen y limitaciones. Indica qué datos faltan.",
    },
    limits: [3, 4],
  },
  "En blanco": { parts: {}, limits: [0] },
};

export function initPrompt() {
  const state = store.get("prompt", { parts: {}, limits: [0], custom: "" });
  const form = document.getElementById("codfv");
  const out = document.getElementById("prompt-out");
  const meter = document.getElementById("meter");
  const meterLabel = document.getElementById("meter-label");
  const limitBox = document.getElementById("limits");
  const custom = document.getElementById("limit-custom");

  const activeLimits = () => [...state.limits.map((i) => LIMITS[i]), state.custom || ""].filter((l) => l && l.trim());

  function render() {
    const limits = activeLimits();
    out.textContent = buildPrompt(state.parts, limits);
    const score = promptScore(state.parts, limits);
    meter.replaceChildren(...Array.from({ length: 6 }, (_, i) => h("span", { class: i < score ? "on" : "" })));
    meter.dataset.level = score === 6 ? "good" : "";
    const missing = FIELDS.filter((f) => (state.parts[f.key] || "").trim().length < 3).map((f) => f.letter);
    meterLabel.textContent = `Completitud ${score}/6` + (missing.length ? ` · falta: ${missing.join(" ")}` : "") + (limits.length ? "" : " · sin límites");
    store.set("prompt", state);
  }

  form.replaceChildren(...FIELDS.map((f) => {
    const ta = h("textarea", { id: `f-${f.key}`, rows: f.rows, placeholder: f.hint });
    ta.value = state.parts[f.key] || "";
    ta.addEventListener("input", () => { state.parts[f.key] = ta.value; render(); });
    return h("div", { class: "field" },
      h("div", { class: "field-head" }, h("span", { class: "letter", "aria-hidden": "true" }, f.letter),
        h("label", { for: `f-${f.key}` }, f.label, " ", h("span", { class: "hint" }, `· ${f.hint}`))),
      ta);
  }));

  function renderLimits() {
    limitBox.replaceChildren(...LIMITS.map((text, i) => {
      const input = h("input", { type: "checkbox", id: `lim-${i}` });
      input.checked = state.limits.includes(i);
      input.addEventListener("change", () => {
        state.limits = input.checked ? [...new Set([...state.limits, i])].sort() : state.limits.filter((x) => x !== i);
        render();
      });
      return h("label", { class: "check", for: `lim-${i}` }, input, h("span", {}, text));
    }));
  }
  renderLimits();
  custom.value = state.custom || "";
  custom.addEventListener("input", () => { state.custom = custom.value; render(); });

  document.getElementById("templates").replaceChildren(...Object.entries(TEMPLATES).map(([name, t]) =>
    h("button", {
      class: "chip", type: "button",
      onclick: () => {
        state.parts = { ...t.parts };
        state.limits = [...t.limits];
        FIELDS.forEach((f) => { document.getElementById(`f-${f.key}`).value = state.parts[f.key] || ""; });
        renderLimits();
        render();
      },
    }, name)));

  document.getElementById("prompt-copy").addEventListener("click", () => {
    if (out.textContent.trim()) store.set("promptCopied", true);
    copyText(out.textContent, "Prompt copiado");
  });
  document.getElementById("lab1-context-copy").addEventListener("click", () => {
    copyText(document.getElementById("lab1-context").value, "Contexto copiado");
  });
  document.getElementById("prompt-clear").addEventListener("click", () => {
    state.parts = {}; state.limits = []; state.custom = ""; custom.value = "";
    FIELDS.forEach((f) => { document.getElementById(`f-${f.key}`).value = ""; });
    renderLimits();
    render();
  });
  render();
}
