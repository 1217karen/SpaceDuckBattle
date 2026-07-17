// guide-dialogue-view.js

import { renderRichText } from "./rich-text.js";
import { getNoImageUrl } from "./icon-picker.js";

function normalizeMode(mode) {
  return mode === "click" ? "click" : "all";
}

function normalizeLine(line) {
  return {
    speakerName:
      typeof line?.speakerName === "string"
        ? line.speakerName.trim()
        : "",
    iconUrl:
      typeof line?.iconUrl === "string" && line.iconUrl.trim() !== ""
        ? line.iconUrl.trim()
        : getNoImageUrl(),
    text:
      typeof line?.text === "string"
        ? line.text
        : ""
  };
}

function normalizeLines(lines) {
  if (!Array.isArray(lines)) return [];

  return lines
    .map(normalizeLine)
    .filter(line => line.text.trim() !== "");
}

function createLineElement(line) {
  const item = document.createElement("div");
  item.className = "guideDialogueLine";

  const iconFrame = document.createElement("div");
  iconFrame.className = "guideDialogueIconFrame";

  const icon = document.createElement("img");
  icon.className = "guideDialogueIcon";
  icon.src = line.iconUrl;
  icon.alt = line.speakerName || "speaker icon";

  iconFrame.appendChild(icon);

  const bubble = document.createElement("div");
  bubble.className = "guideDialogueBubble";

  if (line.speakerName) {
    const name = document.createElement("div");
    name.className = "guideDialogueName";
    name.textContent = line.speakerName;
    bubble.appendChild(name);
  }

  const text = document.createElement("div");
  text.className = "guideDialogueText";
  renderRichText(text, line.text, { preset: "message" });
  bubble.appendChild(text);

  item.appendChild(iconFrame);
  item.appendChild(bubble);

  return item;
}

export function renderGuideDialogue(container, {
  lines = [],
  mode = "all",
  className = "",
  emptyText = "表示する会話がありません。",
  clickHint = "クリックで次へ",
  completeHint = "クリックで閉じる",
  onComplete
} = {}) {
  if (!container) return null;

  const normalizedLines = normalizeLines(lines);
  const normalizedMode = normalizeMode(mode);
  let visibleCount = 0;
  let isComplete = false;

  container.innerHTML = "";

  const root = document.createElement("div");
  root.className = ["guideDialogue", className].filter(Boolean).join(" ");
  root.dataset.mode = normalizedMode;

  const list = document.createElement("div");
  list.className = "guideDialogueList";

  const footer = document.createElement("div");
  footer.className = "guideDialogueFooter";

  function scrollToBottom() {
    list.scrollTop = list.scrollHeight;
  }

  function appendLine() {
    if (visibleCount >= normalizedLines.length) return;

    const line = normalizedLines[visibleCount];
    list.appendChild(createLineElement(line));
    visibleCount += 1;
    scrollToBottom();
  }

  function complete() {
    if (isComplete) return;

    isComplete = true;
    footer.textContent = completeHint;

    if (typeof onComplete === "function") {
      onComplete();
    }
  }

  function showAllLines() {
    while (visibleCount < normalizedLines.length) {
      appendLine();
    }
    complete();
  }

  if (normalizedLines.length === 0) {
    const empty = document.createElement("p");
    empty.className = "guideDialogueEmpty";
    empty.textContent = emptyText;
    list.appendChild(empty);
    footer.hidden = true;
  } else if (normalizedMode === "all") {
    showAllLines();
    footer.hidden = true;
  } else {
    footer.textContent = clickHint;
    root.tabIndex = 0;
    root.setAttribute("role", "button");
    root.setAttribute("aria-label", clickHint);
  }

  root.appendChild(list);
  root.appendChild(footer);
  container.appendChild(root);

  function advance() {
    if (normalizedMode !== "click") return;

    if (visibleCount < normalizedLines.length) {
      appendLine();

      if (visibleCount >= normalizedLines.length) {
        footer.textContent = completeHint;
      }
      return;
    }

    complete();
  }

  root.addEventListener("click", advance);
  root.addEventListener("keydown", event => {
    if (event.key !== "Enter" && event.key !== " ") return;
    event.preventDefault();
    advance();
  });

  return {
    root,
    list,
    showAll: showAllLines,
    advance,
    getVisibleCount: () => visibleCount,
    isComplete: () => isComplete
  };
}
