import { test } from "node:test";
import assert from "node:assert/strict";
import { parseNumber, lineResult, totals, checkClaim, rankOptions, buildPrompt, promptScore, formatClock } from "../js/lib/calc.js";

test("parseNumber accepts Spanish and plain formats", () => {
  assert.equal(parseNumber("1.234,5"), 1234.5);
  assert.equal(parseNumber("1,234.5"), 1234.5);
  assert.equal(parseNumber("12,5"), 12.5);
  assert.equal(parseNumber("1.234"), 1234);
  assert.equal(parseNumber("3.5"), 3.5);
  assert.equal(parseNumber("0.376"), 0.376);
  assert.equal(parseNumber(0.376), 0.376);
  assert.equal(parseNumber("42 €"), 42);
  assert.ok(Number.isNaN(parseNumber("")));
  assert.ok(Number.isNaN(parseNumber("abc")));
});

test("lineResult follows the slide formulas", () => {
  const r = lineResult({ unidades: 100, precio: 12, coste: 7.5 });
  assert.equal(r.ingresos, 1200);
  assert.equal(r.costeTotal, 750);
  assert.equal(r.contribucion, 450);
  assert.equal(r.margen, 0.375);
  assert.equal(lineResult({ unidades: "", precio: 1, coste: 1 }), null);
  assert.equal(lineResult({ unidades: 0, precio: 0, coste: 0 }).margen, null);
});

test("totals ignore incomplete rows", () => {
  const t = totals([{ unidades: 10, precio: 10, coste: 4 }, { unidades: 5, precio: 20, coste: 10 }, { unidades: "x", precio: 1, coste: 1 }]);
  assert.equal(t.count, 2);
  assert.equal(t.ingresos, 200);
  assert.equal(t.contribucion, 110);
  assert.equal(t.margen, 0.55);
});

test("checkClaim compares with tolerance", () => {
  assert.equal(checkClaim("450", 450).ok, true);
  assert.equal(checkClaim("451", 450).ok, true);
  assert.equal(checkClaim("500", 450).ok, false);
  assert.equal(checkClaim("", 450), null);
});

test("rankOptions applies normalised weights", () => {
  const criteria = [{ id: "a", weight: 50 }, { id: "b", weight: 30 }, { id: "c", weight: 20 }];
  const ranked = rankOptions([
    { name: "X", scores: { a: 5, b: 1, c: 1 } },
    { name: "Y", scores: { a: 3, b: 5, c: 5 } },
  ], criteria);
  assert.equal(ranked[0].name, "Y");
  assert.equal(ranked[0].score.toFixed(2), "4.00");
  assert.equal(ranked[1].score.toFixed(2), "3.00");
  const flipped = rankOptions(ranked, [{ id: "a", weight: 100 }, { id: "b", weight: 0 }, { id: "c", weight: 0 }]);
  assert.equal(flipped[0].name, "X");
});

test("buildPrompt skips empty parts and lists limits", () => {
  const p = buildPrompt({ contexto: "Distribuidora", objetivo: "", datos: "a\nb", formato: "Tabla", verificacion: "" }, ["No inventes cifras", " "]);
  assert.equal(p, "Contexto: Distribuidora\n\nDatos:\na\nb\n\nFormato: Tabla\n\nLímites:\n- No inventes cifras");
  assert.equal(promptScore({ contexto: "Distribuidora", datos: "abc" }, ["x"]), 3);
});

test("formatClock", () => {
  assert.equal(formatClock(0), "00:00");
  assert.equal(formatClock(25 * 60), "25:00");
  assert.equal(formatClock(61.4), "01:01");
});
