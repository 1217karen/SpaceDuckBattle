// js/text-preview.js

import { renderRichText } from "./rich-text.js";

export function bindTextPreview(inputEl, previewEl, options = {}) {
  if (!inputEl || !previewEl) return null;

  const {
    preset = "message",
    getText = null
  } = options;

  function resolveText() {
    if (typeof getText === "function") {
      return getText(inputEl);
    }

    return inputEl.value ?? "";
  }

  function refresh() {
    renderRichText(
      previewEl,
      resolveText(),
      { preset }
    );
  }

  inputEl.addEventListener("input", refresh);
  refresh();

  return {
    refresh
  };
}
