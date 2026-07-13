//dialogue-row-view.js

import { getNoImageUrl } from "./icon-picker.js";
import { renderRichText } from "./rich-text.js";
import { bindSpeakerNameSync } from "./speaker-name-sync.js";

function normalizeName(value) {
  return typeof value === "string" ? value.trim() : "";
}

function findIconById(icons, iconId) {
  const safeIconId = Number(iconId || 0);
  if (!safeIconId || !Array.isArray(icons)) return null;

  return icons.find(icon => Number(icon?.id || 0) === safeIconId) || null;
}

function resolvePreviewName({
  nameInput,
  iconButton,
  getIcons,
  getDefaultName,
  fallbackName
}) {
  const manualName = normalizeName(nameInput?.value);
  if (manualName !== "") return manualName;

  const icons = typeof getIcons === "function" ? getIcons() : [];
  const selectedIcon = findIconById(icons, iconButton?.dataset.selectedId);
  const iconName = normalizeName(selectedIcon?.name);
  if (iconName !== "") return iconName;

  const defaultName =
    typeof getDefaultName === "function"
      ? normalizeName(getDefaultName())
      : "";
  if (defaultName !== "") return defaultName;

  return normalizeName(fallbackName) || "発言者名";
}

function resolvePreviewIconUrl(iconButton) {
  return iconButton?.dataset.selectedUrl || getNoImageUrl();
}

export function refreshDialogueRowPreview(row) {
  if (!row) return;

  const refresh = row.dialogueRowPreviewRefresh;
  if (typeof refresh === "function") {
    refresh();
  }
}

export function createDialogueRow({
  rowClassName = "",
  rowDataset = {},
  inputAreaClassName = "",
  nameInputClassName = "",
  textInputClassName = "",
  removeButtonClassName = "",
  textPlaceholder = "セリフを入力",
  iconAlt = "dialogue icon",
  nameMaxLength = null,
  rowData = {},
  iconPicker,
  getIcons,
  getDefaultName,
  fallbackName = "発言者名",
  onRemove
} = {}) {
  const row = document.createElement("div");
  row.className = ["dialogueRow", rowClassName].filter(Boolean).join(" ");

  Object.entries(rowDataset).forEach(([key, value]) => {
    row.dataset[key] = String(value);
  });

  const removeButton = document.createElement("button");
  removeButton.type = "button";
  removeButton.className = [
    "dialogueRemoveButton",
    removeButtonClassName,
    "button-icon"
  ]
    .filter(Boolean)
    .join(" ");
  removeButton.textContent = "×";

  const iconButton = document.createElement("button");
  iconButton.type = "button";
  iconButton.className = "commonIcon60 commIconPickerButton button-box";
  iconButton.dataset.selectedId = rowData.iconId ? String(rowData.iconId) : "";
  iconButton.dataset.selectedUrl = rowData.iconUrl || "";

  const iconImage = document.createElement("img");
  iconImage.src = iconButton.dataset.selectedUrl || getNoImageUrl();
  iconImage.alt = iconAlt;
  iconButton.appendChild(iconImage);

  iconButton.addEventListener("click", () => {
    if (!iconPicker || typeof iconPicker.open !== "function") return;
    const icons = typeof getIcons === "function" ? getIcons() : [];
    iconPicker.open(iconButton, icons);
  });

  const inputArea = document.createElement("div");
  inputArea.className = ["dialogueInputArea", inputAreaClassName]
    .filter(Boolean)
    .join(" ");

  const nameInput = document.createElement("input");
  nameInput.type = "text";
  nameInput.className = ["dialogueNameInput", nameInputClassName]
    .filter(Boolean)
    .join(" ");
  nameInput.value = rowData.name || "";
  if (nameMaxLength) {
    nameInput.maxLength = nameMaxLength;
  }

  const textInput = document.createElement("input");
  textInput.type = "text";
  textInput.className = ["dialogueTextInput", textInputClassName]
    .filter(Boolean)
    .join(" ");
  textInput.placeholder = textPlaceholder;
  textInput.value = rowData.text || "";

  const preview = document.createElement("div");
  preview.className = "dialoguePreviewPanel";

  const previewLeft = document.createElement("div");
  previewLeft.className = "dialoguePreviewLeft";

  const previewIconFrame = document.createElement("div");
  previewIconFrame.className = "dialoguePreviewIconFrame";

  const previewIcon = document.createElement("img");
  previewIcon.className = "dialoguePreviewIcon";
  previewIcon.alt = "preview icon";

  previewIconFrame.appendChild(previewIcon);
  previewLeft.appendChild(previewIconFrame);

  const previewRight = document.createElement("div");
  previewRight.className = "dialoguePreviewRight";

  const previewName = document.createElement("div");
  previewName.className = "dialoguePreviewName";

  const previewMessage = document.createElement("div");
  previewMessage.className = "dialoguePreviewMessage";

  previewRight.appendChild(previewName);
  previewRight.appendChild(previewMessage);
  preview.appendChild(previewLeft);
  preview.appendChild(previewRight);

  inputArea.appendChild(nameInput);
  inputArea.appendChild(textInput);
  inputArea.appendChild(preview);

  function refreshPreview() {
    previewIcon.src = resolvePreviewIconUrl(iconButton);
    previewName.textContent = resolvePreviewName({
      nameInput,
      iconButton,
      getIcons,
      getDefaultName,
      fallbackName
    });
    renderRichText(previewMessage, textInput.value || "", { preset: "message" });
  }

  bindSpeakerNameSync({
    nameInput,
    button: iconButton,
    getIcons,
    getDefaultName,
    mode: "placeholder"
  });

  nameInput.addEventListener("input", refreshPreview);
  textInput.addEventListener("input", refreshPreview);
  iconButton.addEventListener("iconchange", refreshPreview);

  removeButton.addEventListener("click", () => {
    if (typeof onRemove === "function") {
      onRemove(row);
      return;
    }
    row.remove();
  });

  row.dialogueRowPreviewRefresh = refreshPreview;

  row.appendChild(removeButton);
  row.appendChild(iconButton);
  row.appendChild(inputArea);

  refreshPreview();

  return row;
}
