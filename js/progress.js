import { h, store } from "./ui.js";
import { promptScore, totals } from "./lib/calc.js";

const filled = (v) => typeof v === "string" && v.trim().length >= 3;
const countTrue = (obj, n) => Array.from({ length: n }, (_, i) => !!obj?.[i]).filter(Boolean).length;

/** Reads what the participant has done (all from localStorage) and returns one entry per tool. */
export function computeProgress() {
  const rules = store.get("rules", {}), review = store.get("review", {}), week = store.get("week", {});
  const mini = store.get("minireto", {});
  const miniDone = ["problema", "dato", "opciones", "decision", "indicador"].filter((k) => filled(mini[k])).length;

  const pr = store.get("prompt", { parts: {}, limits: [], custom: "" });
  const limits = [...(pr.limits || []).map(String), pr.custom || ""].filter((l) => l.trim());
  const parts = promptScore(pr.parts || {}, []);

  const rows = store.get("rows", null);
  const tableOk = rows ? totals(rows).count > 0 : true; // sample data is loaded by default
  const matrix = store.get("matrix", null);
  const scored = !!matrix?.options?.some((o) => Object.values(o.scores || {}).some((v) => Number(v) !== 3));
  const reco = store.get("reco", {});

  const tools = [
    {
      id: "guia", icon: "i-clock", name: "Guía",
      items: [
        ["Reglas de oro revisadas", countTrue(rules, 4) / 4],
        ["Checklist antes de enviar", countTrue(review, 4) / 4],
        ["Mini-reto en 5 líneas", miniDone / 5],
        ["Plan de 7 días", countTrue(week, 4) / 4],
      ],
    },
    {
      id: "prompt", icon: "i-message", name: "Prompt",
      items: [
        [`Partes C-O-D-F-V (${parts}/5)`, parts / 5],
        ["Al menos un límite", limits.length ? 1 : 0],
        ["Prompt copiado", store.get("promptCopied", false) ? 1 : 0],
      ],
    },
    {
      id: "margen", icon: "i-calc", name: "Margen",
      items: [
        ["Tabla con datos completos", tableOk ? 1 : 0],
        ["Cifra de la IA verificada", store.get("verified", false) ? 1 : 0],
      ],
    },
    {
      id: "decision", icon: "i-scale", name: "Decisión",
      items: [
        ["Opciones puntuadas", scored ? 1 : 0],
        ["Recomendación «si…, entonces…»", filled(reco.si) && filled(reco.entonces) ? 1 : 0],
        ["Riesgo y datos que faltan", filled(reco.riesgo) && filled(reco.faltan) ? 1 : 0],
      ],
    },
  ];
  for (const t of tools) t.pct = Math.round((100 * t.items.reduce((a, [, v]) => a + v, 0)) / t.items.length);
  return tools;
}

function ring(pct) {
  const ns = "http://www.w3.org/2000/svg";
  const r = 19, c = 2 * Math.PI * r;
  const svg = document.createElementNS(ns, "svg");
  svg.setAttribute("viewBox", "0 0 46 46");
  svg.setAttribute("class", "ring" + (pct >= 100 ? " done" : ""));
  svg.setAttribute("aria-hidden", "true");
  const mk = (cls) => { const e = document.createElementNS(ns, "circle"); e.setAttribute("cx", 23); e.setAttribute("cy", 23); e.setAttribute("r", r); e.setAttribute("class", cls); return e; };
  const val = mk("val");
  val.setAttribute("stroke-dasharray", `${(c * pct) / 100} ${c}`);
  const text = document.createElementNS(ns, "text");
  text.setAttribute("x", 23); text.setAttribute("y", 23);
  text.textContent = pct >= 100 ? "✓" : `${pct}%`;
  svg.append(mk("track"), val, text);
  return svg;
}

export function renderProgress() {
  const el = document.getElementById("progress");
  if (!el) return;
  el.replaceChildren(...computeProgress().map((t) => {
    const ns = "http://www.w3.org/2000/svg";
    const ic = document.createElementNS(ns, "svg");
    const use = document.createElementNS(ns, "use");
    use.setAttribute("href", `#${t.icon}`);
    ic.setAttribute("aria-hidden", "true");
    ic.append(use);
    return h("a", { class: "pcard", href: `#${t.id}`, "aria-label": `${t.name}: ${t.pct} % completado` },
      h("div", { class: "pcard-head" }, h("span", { class: "pcard-title" }, ic, t.name), ring(t.pct)),
      h("ul", {}, t.items.map(([label, v]) => h("li", { class: v >= 1 ? "ok" : "" }, label))),
      h("span", { class: "go" }, t.pct === 0 ? "Empezar →" : t.pct >= 100 ? "Revisar →" : "Continuar →"));
  }));
}
