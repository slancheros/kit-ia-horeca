import { h, icon, store, fmt, copyText } from "./ui.js";
import { lineResult, totals, checkClaim, parseNumber } from "./lib/calc.js";

// Fictitious figures for practice only.
const SAMPLE = [
  { producto: "Cerveza lager barril 30 L", canal: "Bares", unidades: "120", precio: "68", coste: "41" },
  { producto: "Agua mineral 1 L (caja 12)", canal: "Restaurantes", unidades: "300", precio: "6,5", coste: "3,9" },
  { producto: "Vino tinto crianza", canal: "Restaurantes", unidades: "85", precio: "9,8", coste: "6,1" },
  { producto: "Refresco cola (caja 24)", canal: "Tiendas", unidades: "210", precio: "14,4", coste: "10,2" },
  { producto: "Café en grano 1 kg", canal: "Hoteles", unidades: "60", precio: "16", coste: "9,5" },
];
const EMPTY = () => ({ producto: "", canal: "", unidades: "", precio: "", coste: "" });

export function initMargin() {
  let rows = store.get("rows", SAMPLE.map((r) => ({ ...r })));
  const body = document.getElementById("rows");
  const foot = document.getElementById("rows-total");
  const stats = document.getElementById("stats");
  const metric = document.getElementById("claim-metric");
  const claim = document.getElementById("claim-value");
  const verdict = document.getElementById("claim-verdict");

  const save = () => store.set("rows", rows);

  function computedCells(r) {
    const res = lineResult(r);
    return [
      h("td", { class: "num" }, fmt.eur(res?.ingresos)),
      h("td", { class: "num" }, fmt.eur(res?.costeTotal)),
      h("td", { class: "num" + (res && res.contribucion < 0 ? " neg" : "") }, fmt.eur(res?.contribucion)),
      h("td", { class: "num" + (res && res.margen < 0 ? " neg" : "") }, fmt.pct(res?.margen)),
    ];
  }

  function renderRows() {
    body.replaceChildren(...rows.map((r, i) => {
      const tr = h("tr");
      const input = (key, label, numeric) => {
        const el = h("input", { "aria-label": `${label}, fila ${i + 1}`, class: numeric ? "n" : key === "producto" ? "name" : "", inputmode: numeric ? "decimal" : null });
        el.value = r[key];
        el.addEventListener("input", () => {
          r[key] = el.value;
          save();
          tr.querySelectorAll("td.num").forEach((td) => td.remove());
          tr.lastElementChild.before(...computedCells(r));
          renderTotals();
        });
        return h("td", {}, el);
      };
      tr.append(
        input("producto", "Producto"), input("canal", "Canal"),
        input("unidades", "Unidades", true), input("precio", "Precio unitario", true), input("coste", "Coste variable unitario", true),
        ...computedCells(r),
        h("td", {}, h("button", { class: "btn ghost", type: "button", "aria-label": `Eliminar fila ${i + 1}`, onclick: () => { rows.splice(i, 1); save(); renderAll(); } }, icon("trash"))),
      );
      return tr;
    }));
  }

  function renderTotals() {
    const t = totals(rows);
    foot.replaceChildren(h("tr", {},
      h("td", { colspan: 5 }, `Total (${t.count} ${t.count === 1 ? "línea" : "líneas"} completas)`),
      h("td", { class: "num" }, fmt.eur(t.ingresos)),
      h("td", { class: "num" }, fmt.eur(t.costeTotal)),
      h("td", { class: "num" + (t.contribucion < 0 ? " neg" : "") }, fmt.eur(t.contribucion)),
      h("td", { class: "num" }, fmt.pct(t.margen)),
      h("td"),
    ));
    const stat = (label, value, hl) => h("div", { class: "stat" + (hl ? " hl" : "") }, h("div", { class: "label" }, label), h("div", { class: "value" }, value));
    stats.replaceChildren(
      stat("Ingresos", fmt.eur(t.ingresos)),
      stat("Coste variable", fmt.eur(t.costeTotal)),
      stat("Contribución", fmt.eur(t.contribucion), true),
      stat("Margen", fmt.pct(t.margen)),
    );
    renderVerdict(t);
  }

  function renderVerdict(t = totals(rows)) {
    const key = metric.value;
    let actual = t[key];
    let claimed = claim.value;
    if (key === "margen" && actual != null) {
      // Accept "37,5", "37,5 %" or "0,375".
      const n = parseNumber(claimed);
      if (!Number.isNaN(n)) claimed = Math.abs(n) > 1 ? n / 100 : n;
    }
    const res = checkClaim(claimed, actual, 0.005);
    verdict.className = "verdict";
    if (!claim.value.trim()) { verdict.textContent = ""; return; }
    if (!res) { verdict.textContent = "Introduce un número válido."; verdict.classList.add("bad"); return; }
    const show = key === "margen" ? fmt.pct : fmt.eur;
    if (res.ok) {
      verdict.textContent = `✓ Coincide con el cálculo (${show(actual)}).`;
      verdict.classList.add("ok");
    } else {
      verdict.textContent = `✗ No coincide: el cálculo da ${show(actual)} (diferencia ${show(res.diff)}). Pide a la IA que muestre sus operaciones.`;
      verdict.classList.add("bad");
    }
  }

  function renderAll() { renderRows(); renderTotals(); }

  document.getElementById("row-add").addEventListener("click", () => {
    rows.push(EMPTY()); save(); renderAll();
    body.lastElementChild?.querySelector("input")?.focus();
  });
  document.getElementById("rows-sample").addEventListener("click", () => { rows = SAMPLE.map((r) => ({ ...r })); save(); renderAll(); });
  document.getElementById("rows-clear").addEventListener("click", () => { rows = [EMPTY()]; save(); renderAll(); });
  document.getElementById("rows-copy").addEventListener("click", () => {
    const head = ["Producto", "Canal", "Unidades", "Precio unitario (€)", "Coste variable unitario (€)"];
    const lines = rows.filter((r) => Object.values(r).some((v) => String(v).trim())).map((r) => [r.producto, r.canal, r.unidades, r.precio, r.coste].join("\t"));
    copyText(lines.length ? [head.join("\t"), ...lines].join("\n") : "", "Tabla copiada (datos ficticios)");
  });
  metric.addEventListener("change", () => renderVerdict());
  claim.addEventListener("input", () => renderVerdict());

  renderAll();
}
