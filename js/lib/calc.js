// Pure calculation helpers — no DOM access, so they can be unit-tested with `node --test`.

/** Parses a user-typed number, accepting Spanish ("1.234,5") and plain ("1234.5") formats. */
export function parseNumber(value) {
  if (typeof value === "number") return Number.isFinite(value) ? value : NaN;
  if (value == null) return NaN;
  let s = String(value).trim().replace(/\s|€|%/g, "");
  if (s === "") return NaN;
  const hasComma = s.includes(",");
  const hasDot = s.includes(".");
  if (hasComma && hasDot) {
    // The last separator is the decimal one.
    s = s.lastIndexOf(",") > s.lastIndexOf(".") ? s.replace(/\./g, "").replace(",", ".") : s.replace(/,/g, "");
  } else if (hasComma) {
    s = s.replace(",", ".");
  } else if (hasDot && /^[1-9]\d{0,2}(\.\d{3})+$/.test(s)) {
    s = s.replace(/\./g, ""); // "1.234" → thousands separator
  }
  const n = Number(s);
  return Number.isFinite(n) ? n : NaN;
}

/**
 * Contribution analysis for one product line.
 * Ingresos = unidades × precio · Coste variable total = unidades × coste unitario
 * Contribución = ingresos − coste variable total · Margen (%) = contribución / ingresos
 */
export function lineResult({ unidades, precio, coste }) {
  const u = parseNumber(unidades), p = parseNumber(precio), c = parseNumber(coste);
  if ([u, p, c].some(Number.isNaN)) return null;
  const ingresos = u * p;
  const costeTotal = u * c;
  const contribucion = ingresos - costeTotal;
  const margen = ingresos === 0 ? null : contribucion / ingresos;
  return { ingresos, costeTotal, contribucion, margen };
}

export function totals(rows) {
  const valid = rows.map(lineResult).filter(Boolean);
  const ingresos = valid.reduce((a, r) => a + r.ingresos, 0);
  const costeTotal = valid.reduce((a, r) => a + r.costeTotal, 0);
  const contribucion = ingresos - costeTotal;
  return { count: valid.length, ingresos, costeTotal, contribucion, margen: ingresos === 0 ? null : contribucion / ingresos };
}

/** Compares a figure claimed by the AI with the computed one. Tolerance is relative (default 0.5 %). */
export function checkClaim(claimed, actual, tolerance = 0.005) {
  const c = parseNumber(claimed);
  if (Number.isNaN(c) || actual == null) return null;
  const diff = c - actual;
  const scale = Math.max(Math.abs(actual), 1e-9);
  return { ok: Math.abs(diff) / scale <= tolerance || Math.abs(diff) < 0.005, diff };
}

/**
 * Weighted decision matrix. Scores are 1–5; weights are any non-negative numbers
 * (normalised by their sum). Returns options sorted by score, best first.
 */
export function rankOptions(options, criteria) {
  const wSum = criteria.reduce((a, c) => a + Math.max(0, parseNumber(c.weight) || 0), 0);
  return options
    .map((o, index) => {
      const score = wSum === 0 ? 0 : criteria.reduce((a, c) => {
        const w = Math.max(0, parseNumber(c.weight) || 0);
        const s = Math.min(5, Math.max(0, parseNumber(o.scores[c.id]) || 0));
        return a + (w * s) / wSum;
      }, 0);
      return { ...o, index, score };
    })
    .sort((a, b) => b.score - a.score || a.index - b.index);
}

/** Builds a C-O-D-F-V prompt from its parts; empty parts are skipped. */
export function buildPrompt(parts, limits = []) {
  const sections = [
    ["Contexto", parts.contexto],
    ["Objetivo", parts.objetivo],
    ["Datos", parts.datos],
    ["Formato", parts.formato],
    ["Verificación", parts.verificacion],
  ];
  const out = [];
  for (const [label, value] of sections) {
    const v = (value || "").trim();
    if (!v) continue;
    out.push(v.includes("\n") ? `${label}:\n${v}` : `${label}: ${v}`);
  }
  const lim = limits.map((l) => l.trim()).filter(Boolean);
  if (lim.length) out.push("Límites:\n" + lim.map((l) => `- ${l}`).join("\n"));
  return out.join("\n\n");
}

/** 0–6 quality score: one point per filled C-O-D-F-V part plus one for at least one limit. */
export function promptScore(parts, limits = []) {
  const filled = ["contexto", "objetivo", "datos", "formato", "verificacion"].filter((k) => (parts[k] || "").trim().length >= 3).length;
  return filled + (limits.some((l) => l.trim()) ? 1 : 0);
}

export function formatClock(totalSeconds) {
  const s = Math.max(0, Math.round(totalSeconds));
  return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
}
