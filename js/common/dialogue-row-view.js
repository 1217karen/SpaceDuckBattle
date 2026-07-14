//dialogue-row-view.js

import { getNoImageUrl } from "./icon-picker.js";
import { renderRichText } from "./rich-text.js";
import { bindRichTextToolbar } from "./rich-text-toolbar.js";
import { createRichTextToolbarButtons } from "./rich-text-toolbar-ui.js";
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

export function readDialogueRow(row, { trimText = false } = {}) {
  const iconButton =
    row?.querySelector(".dialogueIconButton");

  const nameInput =
    row?.querySelector(".dialogueNameInput");

  const textInput =
    row?.querySelector(".dialogueTextInput");

  const iconId =
    Number(iconButton?.dataset.selectedId || 0);

  const rawText =
    textInput?.value ?? "";

  return {
    name: nameInput?.value.trim() || "",
    text: trimText ? rawText.trim() : rawText,
    iconId: iconId || null
  };
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
  nameMaxLength = 10,
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
  iconButton.className = "dialogueIconButton commonIcon60 commIconPickerButton button-box";
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

  const nameToolRow = document.createElement("div");
  nameToolRow.className = "dialogueNameToolRow";

  const richTextToolWrap = document.createElement("div");
  richTextToolWrap.className = "dialogueRichTextToolWrap";

  const richTextToggleButton = document.createElement("button");
  richTextToggleButton.type = "button";
  richTextToggleButton.className = "dialogueRichTextToggleButton button-box";
  richTextToggleButton.textContent = "装飾";
  richTextToggleButton.setAttribute("aria-label", "文字装飾を開く");
  richTextToggleButton.setAttribute("aria-expanded", "false");

  const richTextPopup = document.createElement("div");
  richTextPopup.className = "dialogueRichTextPopup";
  richTextPopup.hidden = true;
  richTextPopup.appendChild(
    createRichTextToolbarButtons({ includeLineBreak: true })
  );

  richTextToolWrap.appendChild(richTextToggleButton);
  richTextToolWrap.appendChild(richTextPopup);
  nameToolRow.appendChild(nameInput);
  nameToolRow.appendChild(richTextToolWrap);

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

  inputArea.appendChild(nameToolRow);
  inputArea.appendChild(textInput);

  function closeRichTextPopup() {
    richTextPopup.hidden = true;
    richTextToggleButton.setAttribute("aria-expanded", "false");
  }

  function toggleRichTextPopup() {
    const shouldOpen = richTextPopup.hidden;
    richTextPopup.hidden = !shouldOpen;
    richTextToggleButton.setAttribute(
      "aria-expanded",
      shouldOpen ? "true" : "false"
    );
  }

  richTextToggleButton.addEventListener("click", event => {
    event.stopPropagation();
    toggleRichTextPopup();
  });

  richTextPopup.addEventListener("click", event => {
    event.stopPropagation();

    const clickedToolbarButton = event.target.closest(
      "[data-insert-open-tag], [data-insert-text], [data-ruby-template]"
    );

    if (clickedToolbarButton) {
      closeRichTextPopup();
    }
  });

  document.addEventListener("click", event => {
    if (!row.contains(event.target)) {
      closeRichTextPopup();
    }
  });

  document.addEventListener("keydown", event => {
    if (event.key === "Escape") {
      closeRichTextPopup();
    }
  });

  bindRichTextToolbar(richTextPopup, textInput);

  function refreshPreview() {
    const hasText = textInput.value.length > 0;
    preview.hidden = !hasText;

    if (!hasText) return;

    previewIcon.src = resolvePreviewIconUrl(iconButton);
    previewName.textContent = resolvePreviewName({
      nameInput,
      iconButton,
      getIcons,
      getDefaultName,
      fallbackName
    });
    renderRichText(previewMessage, textInput.value, { preset: "message" });
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
  row.appendChild(preview);

  refreshPreview();

  return row;
}
