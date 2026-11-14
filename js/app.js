import { initGuide } from "./guide.js";
import { initPrompt } from "./prompt.js";
import { initMargin } from "./margin.js";
import { initDecision } from "./decision.js";
import { renderProgress } from "./progress.js";
import { initLabs } from "./labs.js";
import { initAiLinks } from "./ai-links.js";

const VIEWS = ["inicio", "guia", "prompt", "margen", "decision"];

function show(view, focus = false) {
  if (!VIEWS.includes(view)) view = VIEWS[0];
  for (const id of VIEWS) {
    document.getElementById(id).hidden = id !== view;
    const tab = document.getElementById(`tab-${id}`);
    tab.setAttribute("aria-selected", String(id === view));
    tab.tabIndex = id === view ? 0 : -1;
  }
  if (view === "inicio") renderProgress();
  if (focus) document.getElementById(`tab-${view}`).focus();
}

function initTabs() {
  const tabs = [...document.querySelectorAll(".tab")];
  tabs.forEach((tab, i) => {
    tab.addEventListener("click", () => { history.replaceState(null, "", `#${tab.dataset.view}`); show(tab.dataset.view); window.scrollTo({ top: 0 }); });
    tab.addEventListener("keydown", (e) => {
      const d = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
      if (!d) return;
      const next = tabs[(i + d + tabs.length) % tabs.length];
      history.replaceState(null, "", `#${next.dataset.view}`);
      show(next.dataset.view, true);
    });
  });
  window.addEventListener("hashchange", () => show(location.hash.slice(1)));
  show(location.hash.slice(1));
}

initTabs();
initGuide();
initPrompt();
initMargin();
initDecision();
initLabs();
initAiLinks();
renderProgress();
