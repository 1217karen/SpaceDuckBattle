// dialogue-data.js

export function createEmptyDialogue() {
  return {
    text: "",
    name: "",
    iconId: null
  };
}

function defaultNormalizeIconId(iconId) {
  const safeIconId = Number(iconId || 0);
  return safeIconId > 0 ? safeIconId : null;
}

function normalizeDialogueItem(item, { normalizeIconId } = {}) {
  const text =
    typeof item?.text === "string"
      ? item.text
      : "";

  const normalizeId =
    typeof normalizeIconId === "function"
      ? normalizeIconId
      : defaultNormalizeIconId;

  return {
    text,
    name:
      typeof item?.name === "string"
        ? item.name
        : "",
    iconId: normalizeId(item?.iconId) || null
  };
}

export function normalizeDialogueList(
  dialogue,
  { dropEmptyText = false, normalizeIconId } = {}
) {
  const source = Array.isArray(dialogue)
    ? dialogue
    : dialogue && typeof dialogue === "object"
      ? [dialogue]
      : [];

  const normalized = source
    .map(item => normalizeDialogueItem(item, { normalizeIconId }))
    .filter(item => !dropEmptyText || item.text !== "");

  if (normalized.length > 0) {
    return normalized;
  }

  return [createEmptyDialogue()];
}
