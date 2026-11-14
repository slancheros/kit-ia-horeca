import { h, icon, store, copyText } from "./ui.js";
import { rankOptions, parseNumber } from "./lib/calc.js";

const DEFAULT_CRITERIA = [
  { id: "impacto", name: "Impacto", hint: "5 = gran impacto", weight: 50, color: "var(--primary)" },
  { id: "facilidad", name: "Facilidad", hint: "5 = poco esfuerzo", weight: 30, color: "var(--teal)" },
  { id: "riesgo", name: "Riesgo", hint: "5 = riesgo bajo", weight: 20, color: "var(--coral)" },
];
const DEFAULT_OPTIONS = [
  { name: "A · Recuperación de clientes del canal bares", scores: { impacto: 3, facilidad: 3, riesgo: 3 } },
  { name: "B · Renegociación de un proveedor", scores: { impacto: 3, facilidad: 3, riesgo: 3 } },
  { name: "C · Revisión del mix de vinos", scores: { impacto: 3, facilidad: 3, riesgo: 3 } },
];
const RECO = [
  ["si", "Si…", "p. ej. la recuperación del canal bares se confirma con datos de pedidos"],
  ["entonces", "…entonces", "p. ej. priorizar la opción A durante un mes"],
  ["riesgo", "Riesgo principal", "¿Qué puede salir mal?"],
  ["contra", "Argumento en contra", "Defiende la opción ganadora y después argumenta en su contra"],
  ["faltan", "Datos que faltan", "¿Qué supuestos debes comprobar antes de ejecutar?"],
  ["indicador", "Indicador de seguimiento", "¿Cómo sabrás si funcionó?"],
];

export function initDecision() {
  const saved = store.get("matrix", null);
  const criteria = DEFAULT_CRITERIA.map((c) => ({ ...c, weight: saved?.weights?.[c.id] ?? c.weight }));
  let options = saved?.options ?? DEFAULT_OPTIONS.map((o) => ({ ...o, scores: { ...o.scores } }));
  const reco = store.get("reco", {});

  const save = () => store.set("matrix", { weights: Object.fromEntries(criteria.map((c) => [c.id, c.weight])), options });

  // ---------- weights ----------
  const weightsEl = document.getElementById("weights");
  function renderWeights() {
    weightsEl.replaceChildren(...criteria.map((c) => {
      const val = h("span", { class: "w-val" }, `${c.weight}`);
      const range = h("input", { type: "range", min: 0, max: 100, step: 5, id: `w-${c.id}`, "aria-label": `Peso de ${c.name}` });
      range.value = c.weight;
      range.addEventListener("input", () => { c.weight = Number(range.value); val.textContent = `${c.weight}`; save(); renderWeightSummary(); renderRanking(); });
      return h("div", { class: "weight" },
        h("div", { style: "display:flex;justify-content:space-between;align-items:baseline" }, h("label", { for: `w-${c.id}` }, c.name), val),
        h("div", { class: "hint" }, c.hint), range);
    }));
    renderWeightSummary();
  }
  function renderWeightSummary() {
    const sum = criteria.reduce((a, c) => a + c.weight, 0);
    document.getElementById("weight-bar").replaceChildren(...criteria.map((c) =>
      h("span", { style: `width:${sum ? (100 * c.weight) / sum : 0}%;background:${c.color}` })));
    document.getElementById("weight-sum").textContent = sum === 100
      ? `Suma de pesos: 100 ✓`
      : `Suma de pesos: ${sum} · se normalizan automáticamente (${criteria.map((c) => `${c.name} ${sum ? Math.round((100 * c.weight) / sum) : 0} %`).join(" · ")})`;
  }
  document.getElementById("weights-reset").addEventListener("click", () => {
    criteria.forEach((c, i) => { c.weight = DEFAULT_CRITERIA[i].weight; });
    save(); renderWeights(); renderRanking();
  });

  // ---------- options table ----------
  document.getElementById("opt-head").replaceChildren(h("tr", {},
    h("th", {}, "Opción"), ...criteria.map((c) => h("th", { class: "num" }, c.name)), h("th", { class: "num" }, "Puntuación"), h("th", {}, h("span", { class: "sr-only" }, "Acciones"))));
  const bodyEl = document.getElementById("opt-body");
  function renderOptions() {
    const ranked = rankOptions(options, criteria);
    const scoreOf = new Map(ranked.map((r) => [r.index, r.score]));
    bodyEl.replaceChildren(...options.map((o, i) => {
      const name = h("input", { class: "name", "aria-label": `Nombre de la opción ${i + 1}` });
      name.value = o.name;
      name.addEventListener("input", () => { o.name = name.value; save(); renderRanking(); });
      const scoreCell = h("td", { class: "num mono", style: "font-weight:700" }, scoreOf.get(i).toFixed(2));
      return h("tr", {},
        h("td", {}, name),
        ...criteria.map((c) => {
          const inp = h("input", { type: "number", min: 1, max: 5, step: 1, class: "score-input", "aria-label": `${c.name} de ${o.name || `opción ${i + 1}`}` });
          inp.value = o.scores[c.id] ?? "";
          inp.addEventListener("input", () => {
            const n = parseNumber(inp.value);
            o.scores[c.id] = Number.isNaN(n) ? "" : Math.min(5, Math.max(1, n));
            save(); renderRanking();
            scoreCell.textContent = rankOptions(options, criteria).find((r) => r.index === i).score.toFixed(2);
          });
          inp.addEventListener("change", () => { inp.value = o.scores[c.id]; });
          return h("td", { class: "num" }, inp);
        }),
        scoreCell,
        h("td", {}, options.length > 2 ? h("button", { class: "btn ghost", type: "button", "aria-label": `Eliminar opción ${i + 1}`, onclick: () => { options.splice(i, 1); save(); renderOptions(); renderRanking(); } }, icon("trash")) : null),
      );
    }));
  }
  document.getElementById("opt-add").addEventListener("click", () => {
    const letter = String.fromCharCode(65 + options.length);
    options.push({ name: `${letter} · Nueva opción`, scores: { impacto: 3, facilidad: 3, riesgo: 3 } });
    save(); renderOptions(); renderRanking();
  });

  // ---------- ranking ----------
  const rankEl = document.getElementById("ranking");
  function renderRanking() {
    const ranked = rankOptions(options, criteria);
    rankEl.replaceChildren(...ranked.map((r, pos) =>
      h("div", { class: "rank-row" },
        h("span", { class: "rank-pos" }, `#${pos + 1}`),
        h("div", {}, h("div", { class: "rank-name" }, r.name || `Opción ${r.index + 1}`), h("div", { class: "rank-track" }, h("div", { class: "rank-fill", style: `width:${(r.score / 5) * 100}%` }))),
        h("span", { class: "rank-score" }, r.score.toFixed(2)))));
    // keep the table's score column in sync
    bodyEl.querySelectorAll("tr").forEach((tr, i) => {
      const cell = tr.children[criteria.length + 1];
      if (cell) cell.textContent = ranked.find((r) => r.index === i).score.toFixed(2);
    });
  }

  // ---------- recommendation ----------
  const recoForm = document.getElementById("reco");
  recoForm.replaceChildren(...RECO.map(([key, label, ph]) => {
    const ta = h("textarea", { id: `reco-${key}`, rows: 2, placeholder: ph });
    ta.value = reco[key] || "";
    ta.addEventListener("input", () => { reco[key] = ta.value; store.set("reco", reco); });
    return h("div", { class: "field", style: "margin:0" }, h("label", { for: `reco-${key}` }, label), ta);
  }));
  document.getElementById("reco-copy").addEventListener("click", () => {
    const ranked = rankOptions(options, criteria);
    const lines = [
      `Pesos: ${criteria.map((c) => `${c.name} ${c.weight}`).join(" / ")}`,
      "Ranking:",
      ...ranked.map((r, i) => `  ${i + 1}. ${r.name} — ${r.score.toFixed(2)}`),
      "",
      `Recomendación: si ${(reco.si || "…").trim()}, entonces ${(reco.entonces || "…").trim()}.`,
      ...RECO.slice(2).filter(([k]) => (reco[k] || "").trim()).map(([k, label]) => `${label}: ${reco[k].trim()}`),
      "",
      "Nota: la puntuación de la matriz no equivale a rentabilidad financiera demostrada.",
    ];
    copyText(lines.join("\n"), "Resumen copiado");
  });

  renderWeights();
  renderOptions();
  renderRanking();
}
