// dialogue-maker-storage-service.js

const ICONS_KEY = "dialogueMaker:icons";
const DRAFT_KEY = "dialogueMaker:draft";

function safeParse(json, fallback) {
  if (!json) return fallback;

  try {
    return JSON.parse(json);
  } catch {
    return fallback;
  }
}

function normalizeIcon(icon) {
  return {
    id: typeof icon?.id === "string" ? icon.id : "",
    name: typeof icon?.name === "string" ? icon.name : "",
    url: typeof icon?.url === "string" ? icon.url : ""
  };
}

function normalizeLine(line) {
  return {
    id: typeof line?.id === "string" ? line.id : "",
    iconId: typeof line?.iconId === "string" ? line.iconId : "",
    speakerName: typeof line?.speakerName === "string" ? line.speakerName : "",
    text: typeof line?.text === "string" ? line.text : ""
  };
}

export function loadDialogueMakerIcons() {
  const icons = safeParse(localStorage.getItem(ICONS_KEY), []);
  if (!Array.isArray(icons)) return [];

  return icons
    .map(normalizeIcon)
    .filter(icon => icon.id && icon.url.trim());
}

export function saveDialogueMakerIcons(icons) {
  const normalized = Array.isArray(icons)
    ? icons.map(normalizeIcon).filter(icon => icon.id && icon.url.trim())
    : [];

  localStorage.setItem(ICONS_KEY, JSON.stringify(normalized));
}

export function loadDialogueMakerDraft() {
  const draft = safeParse(localStorage.getItem(DRAFT_KEY), null);
  const lines = Array.isArray(draft?.lines)
    ? draft.lines.map(normalizeLine).filter(line => line.id)
    : [];

  return { lines };
}

export function saveDialogueMakerDraft(draft) {
  const lines = Array.isArray(draft?.lines)
    ? draft.lines.map(normalizeLine).filter(line => line.id)
    : [];

  localStorage.setItem(DRAFT_KEY, JSON.stringify({ lines }));
}
