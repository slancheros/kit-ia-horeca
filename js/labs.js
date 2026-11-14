import { h, store } from "./ui.js";

// Step-by-step lab instructions shown at the top of the Margen and Decisión tabs.
// Example figures refer to the fictitious sample data loaded by default.
const LABS = {
  margen: {
    title: "Laboratorio Margen · Analiza primero; decide después",
    minutes: 30,
    goal: "Obtén tres hallazgos cuantificables de la tabla y comprueba al menos dos cifras antes de usarlas.",
    steps: [
      { min: 5, title: "Explora la tabla", text: "Mira qué línea aporta más contribución y cuál tiene el margen más bajo.", example: "La cerveza en barril aporta 3.240 € de 5.606,50 € (58 %); el refresco cola tiene el margen más bajo, 29,2 %." },
      { min: 2, title: "Copia la tabla", text: "Pulsa «Copiar tabla»: copia encabezados y filas listos para pegar." },
      { min: 8, title: "Pide hallazgos a la IA", text: "En Prompt, elige la plantilla «Análisis de datos · Lab 2», pega la tabla en Datos, copia el prompt y pégalo en tu IA.", link: ["#prompt", "Ir a Prompt"] },
      { min: 8, title: "Verifica dos cifras", text: "En «Verifica la cifra de la IA», elige la cifra y escribe el valor que te dio la IA. La app te dice si coincide.", example: "Referencia del ejemplo: contribución total 5.606,50 €, margen total 37,6 %." },
      { min: 5, title: "Clasifica cada hallazgo", text: "Marca si es un hecho (sale de la tabla), una hipótesis (explicación posible) o un dato que falta." },
    ],
    deliverable: "Tres hallazgos con su cifra comprobada y una frase sobre qué decisión comercial o financiera podría cambiar.",
    watch: "Vigila que la IA no confunda contribución con beneficio neto ni calcule el margen total como media de márgenes (37,5 % ≠ 37,6 %).",
  },
  decision: {
    title: "Laboratorio Decisión · Matriz de decisión",
    minutes: 25,
    goal: "Compara tres alternativas con criterios explícitos y escribe una recomendación condicionada.",
    steps: [
      { min: 2, title: "Lee las tres opciones", text: "A · Recuperación de clientes del canal bares. B · Renegociación de un proveedor. C · Revisión del mix de vinos." },
      { min: 8, title: "Puntúa de 1 a 5", text: "Impacto (5 = gran impacto), Facilidad (5 = poco esfuerzo) y Riesgo (5 = riesgo bajo). Anota por qué pones cada nota.", example: "A con 5 · 3 · 3 obtiene 4,00 con los pesos 50/30/20." },
      { min: 3, title: "Revisa el ranking", text: "Comprueba qué opción queda primera y si alguna empata." },
      { min: 4, title: "Cambia un peso y observa", text: "Mueve un deslizador y mira si cambia el orden.", example: "A = 5·3·3 y B = 3·5·5 empatan a 4,00; con Impacto en 100, A sube a 4,33 y B baja a 3,67." },
      { min: 4, title: "Segunda opinión de la IA (opcional)", text: "En Prompt, usa la plantilla «Decisiones · Lab 2» y compara su análisis con tu matriz.", link: ["#prompt", "Ir a Prompt"] },
      { min: 4, title: "Escribe la recomendación", text: "Completa «Si…, entonces…», el riesgo, un argumento en contra, los datos que faltan y un indicador. Pulsa «Copiar resumen»." },
    ],
    deliverable: "El resumen copiado (pesos, ranking y recomendación), compartido en el chat.",
    watch: "La puntuación de una matriz no equivale a rentabilidad financiera demostrada. No estimes ahorros sin datos de costes.",
  },
};

export function initLabs() {
  for (const [id, lab] of Object.entries(LABS)) {
    const host = document.getElementById(`lab-${id}`);
    if (!host) continue;
    const done = store.get(`lab-${id}`, {});
    const openState = store.get(`lab-${id}-open`, true);
    const count = h("span", { class: "count" });
    const update = () => { count.textContent = `${lab.steps.filter((_, i) => done[i]).length}/${lab.steps.length} pasos`; };

    const details = h("details", { class: "lab" });
    details.open = openState;
    details.addEventListener("toggle", () => store.set(`lab-${id}-open`, details.open));

    const steps = lab.steps.map((s, i) => {
      const cb = h("input", { type: "checkbox", id: `lab-${id}-${i}`, "aria-label": `Paso ${i + 1} hecho` });
      cb.checked = !!done[i];
      cb.addEventListener("change", () => { done[i] = cb.checked; store.set(`lab-${id}`, done); update(); });
      return h("li", { class: "lab-step" },
        cb,
        h("div", {},
          h("label", { for: `lab-${id}-${i}`, class: "lab-step-title" }, h("span", { class: "lab-num" }, String(i + 1).padStart(2, "0")), s.title, h("span", { class: "lab-min" }, `${s.min} min`)),
          h("p", {}, s.text, s.link ? [" ", h("a", { href: s.link[0] }, `${s.link[1]} →`)] : null),
          s.example ? h("p", { class: "lab-example" }, h("strong", {}, "Ejemplo: "), s.example) : null));
    });

    details.append(
      h("summary", {},
        h("span", { class: "lab-sum" }, h("span", { class: "eyebrow" }, `Instrucciones · ${lab.minutes} min`), h("strong", {}, lab.title)),
        count),
      h("div", { class: "lab-body" },
        h("p", { class: "lab-goal" }, h("strong", {}, "Objetivo: "), lab.goal),
        h("ol", { class: "lab-steps" }, steps),
        h("div", { class: "lab-foot" },
          h("p", { class: "callout info" }, h("span", {}, h("strong", {}, "Entregable: "), lab.deliverable)),
          h("p", { class: "callout warn" }, h("span", {}, lab.watch)))));
    host.replaceChildren(details);
    update();
  }
}
