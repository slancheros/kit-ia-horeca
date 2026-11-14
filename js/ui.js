// Small shared helpers: persistence, DOM building, clipboard, formatting.

const PREFIX = "kit-ia-horeca:v1:";

export const store = {
  get(key, fallback) {
    try {
      const raw = localStorage.getItem(PREFIX + key);
      return raw == null ? fallback : JSON.parse(raw);
    } catch {
      return fallback;
    }
  },
  set(key, value) {
    try { localStorage.setItem(PREFIX + key, JSON.stringify(value)); } catch { /* private mode or quota: keep working in memory */ }
  },
};

/** Tiny element factory: h("div", { class: "x", onclick }, child, "text"). */
export function h(tag, attrs = {}, ...children) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v == null || v === false) continue;
    if (k.startsWith("on") && typeof v === "function") el.addEventListener(k.slice(2), v);
    else if (k === "class") el.className = v;
    else if (k === "text") el.textContent = v;
    else if (v === true) el.setAttribute(k, "");
    else el.setAttribute(k, v);
  }
  for (const c of children.flat()) if (c != null) el.append(c instanceof Node ? c : document.createTextNode(String(c)));
  return el;
}

export function icon(name) {
  const ns = "http://www.w3.org/2000/svg";
  const svg = document.createElementNS(ns, "svg");
  svg.setAttribute("aria-hidden", "true");
  const use = document.createElementNS(ns, "use");
  use.setAttribute("href", `#i-${name}`);
  svg.append(use);
  return svg;
}

let toastTimer;
export function toast(message) {
  const t = document.getElementById("toast");
  t.textContent = message;
  t.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove("show"), 2200);
}

export async function copyText(text, okMessage = "Copiado al portapapeles") {
  if (!text.trim()) { toast("No hay nada que copiar todavía"); return; }
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    const ta = h("textarea", { style: "position:fixed;opacity:0" });
    ta.value = text;
    document.body.append(ta);
    ta.select();
    document.execCommand("copy");
    ta.remove();
  }
  toast(okMessage);
}

const eur = new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR", maximumFractionDigits: 2, useGrouping: "always" });
const pct = new Intl.NumberFormat("es-ES", { style: "percent", minimumFractionDigits: 1, maximumFractionDigits: 1 });
const num = new Intl.NumberFormat("es-ES", { maximumFractionDigits: 2, useGrouping: "always" });
export const fmt = {
  eur: (v) => (v == null || Number.isNaN(v) ? "—" : eur.format(v)),
  pct: (v) => (v == null || Number.isNaN(v) ? "—" : pct.format(v)),
  num: (v) => (v == null || Number.isNaN(v) ? "—" : num.format(v)),
};

/** Renders a checklist bound to localStorage. Returns nothing; updates `countEl` with "n/m". */
export function checklist(container, countEl, key, items) {
  const state = store.get(key, {});
  const update = () => { countEl.textContent = `${items.filter((_, i) => state[i]).length}/${items.length}`; };
  container.replaceChildren(...items.map((text, i) => {
    const input = h("input", { type: "checkbox", id: `${key}-${i}` });
    input.checked = !!state[i];
    input.addEventListener("change", () => { state[i] = input.checked; store.set(key, state); update(); });
    return h("label", { class: "check", for: `${key}-${i}` }, input, h("span", {}, text));
  }));
  update();
}
