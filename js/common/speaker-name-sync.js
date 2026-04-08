// js/speaker-name-sync.js

function normalizeName(value) {
  if (typeof value !== "string") return "";
  return value.trim();
}

function findIconById(icons, iconId) {
  if (!Array.isArray(icons)) return null;
  if (!iconId) return null;

  return icons.find(item => item.id === iconId) || null;
}

function resolveSpeakerNameCandidate({
  button,
  icons = [],
  getDefaultName = null
} = {}) {
  const selectedId =
    Number(button?.dataset.selectedId || 0);

  const selectedIcon =
    findIconById(icons, selectedId);

  const iconName =
    normalizeName(selectedIcon?.name);

  if (iconName !== "") {
    return iconName;
  }

  const defaultName =
    typeof getDefaultName === "function"
      ? normalizeName(getDefaultName())
      : "";

  return defaultName;
}

function applyResolvedName(nameInput, resolvedName, mode) {
  if (!nameInput) return;

  const fallbackText = "発言者名";
  const finalName = resolvedName || "";

  if (mode === "value") {
    nameInput.value = finalName;
    nameInput.placeholder = fallbackText;
    return;
  }

  nameInput.placeholder = finalName || fallbackText;
}

export function updateSpeakerNameField({
  nameInput,
  button,
  icons = [],
  getDefaultName = null,
  mode = "placeholder"
} = {}) {
  const resolvedName =
    resolveSpeakerNameCandidate({
      button,
      icons,
      getDefaultName
    });

  applyResolvedName(nameInput, resolvedName, mode);
}

export function bindSpeakerNameSync({
  nameInput,
  button,
  getIcons,
  getDefaultName,
  mode = "placeholder"
} = {}) {
  if (!nameInput || !button) return null;

  function resolveIcons() {
    if (typeof getIcons === "function") {
      const result = getIcons();
      return Array.isArray(result) ? result : [];
    }

    return [];
  }

  function refresh() {
    updateSpeakerNameField({
      nameInput,
      button,
      icons: resolveIcons(),
      getDefaultName,
      mode
    });
  }

  button.addEventListener("iconchange", refresh);
  refresh();

  return {
    refresh
  };
}
