import { h, icon, copyText, store } from "./ui.js";

// External AI assistants. Links open in a new tab; nothing from the app is sent to them.
export const AI_TOOLS = [
  { name: "ChatGPT", url: "https://chatgpt.com/" },
  { name: "Claude", url: "https://claude.ai/new" },
  { name: "Copilot", url: "https://copilot.microsoft.com/" },
  { name: "Gemini", url: "https://gemini.google.com/app" },
];

/**
 * Renders the links into every [data-ai-links] container.
 * mode "copy": clicking copies the current prompt first, then the browser opens the tool in a new tab.
 */
export function initAiLinks() {
  for (const box of document.querySelectorAll("[data-ai-links]")) {
    const copy = box.dataset.aiLinks === "copy";
    box.replaceChildren(...AI_TOOLS.map((t) => h("a", {
      class: "ai-link", href: t.url, target: "_blank", rel: "noopener noreferrer",
      "aria-label": copy ? `Copiar el prompt y abrir ${t.name} en una pestaña nueva` : `Abrir ${t.name} en una pestaña nueva`,
      onclick: copy ? () => {
        const text = document.getElementById("prompt-out")?.textContent || "";
        if (text.trim()) store.set("promptCopied", true);
        copyText(text, `Prompt copiado · pégalo en ${t.name}`);
      } : null,
    }, t.name, icon("external"))));
  }
}
