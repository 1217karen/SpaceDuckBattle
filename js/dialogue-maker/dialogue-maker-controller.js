// dialogue-maker-controller.js

import { renderGuideDialogue } from "../common/guide-dialogue-view.js";
import { getNoImageUrl } from "../common/icon-picker.js";
import { bindRichTextToolbar } from "../common/rich-text-toolbar.js";
import { createRichTextToolbarButtons } from "../common/rich-text-toolbar-ui.js";
import {
  loadDialogueMakerDraft,
  loadDialogueMakerIcons,
  saveDialogueMakerDraft,
  saveDialogueMakerIcons
} from "../services/dialogue-maker-storage-service.js";

const iconForm = document.getElementById("dialogueMakerIconForm");
const iconNameInput = document.getElementById("dialogueMakerIconName");
const iconUrlInput = document.getElementById("dialogueMakerIconUrl");
const iconMessage = document.getElementById("dialogueMakerIconMessage");
const iconList = document.getElementById("dialogueMakerIconList");
const linesContainer = document.getElementById("dialogueMakerLines");
const addLineButton = document.getElementById("dialogueMakerAddLine");
const preview = document.getElementById("dialogueMakerPreview");

let icons = loadDialogueMakerIcons();
let draft = loadDialogueMakerDraft();

function makeId(prefix) {
  if (typeof globalThis.crypto?.randomUUID === "function") {
    return `${prefix}_${globalThis.crypto.randomUUID()}`;
  }

  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function makeEmptyLine() {
  return {
    id: makeId("line"),
    iconId: "",
    speakerName: "",
    text: ""
  };
}

if (draft.lines.length === 0) {
  draft.lines.push(makeEmptyLine());
  saveDialogueMakerDraft(draft);
}

function setIconMessage(message) {
  if (iconMessage) {
    iconMessage.textContent = message || "";
  }
}

function saveDraftAndPreview() {
  saveDialogueMakerDraft(draft);
  renderPreview();
}

function getIcon(iconId) {
  return icons.find(icon => icon.id === iconId) || null;
}

function getIconLabel(icon) {
  return icon.name.trim() || icon.url;
}

function renderPreview() {
  const lines = draft.lines.map(line => {
    const icon = getIcon(line.iconId);

    return {
      iconUrl: icon?.url || getNoImageUrl(),
      speakerName: line.speakerName,
      text: line.text
    };
  });

  renderGuideDialogue(preview, {
    mode: "all",
    lines,
    emptyText: "セリフを入力すると、ここにプレビューが表示されます。"
  });
}

function createSafePreviewImage(url, alt) {
  const image = document.createElement("img");
  image.src = url || getNoImageUrl();
  image.alt = alt;
  image.addEventListener("error", () => {
    if (image.src !== getNoImageUrl()) {
      image.src = getNoImageUrl();
    }
  });
  return image;
}

function renderIconList() {
  if (!iconList) return;

  iconList.innerHTML = "";

  if (icons.length === 0) {
    const empty = document.createElement("p");
    empty.className = "dialogueMakerEmpty text-muted";
    empty.textContent = "登録済みのアイコンはありません。No Imageは常に選択できます。";
    iconList.appendChild(empty);
    return;
  }

  icons.forEach(icon => {
    const card = document.createElement("div");
    card.className = "dialogueMakerIconCard";

    const image = createSafePreviewImage(icon.url, getIconLabel(icon));

    const name = document.createElement("span");
    name.className = "dialogueMakerIconCardName";
    name.textContent = getIconLabel(icon);

    const removeButton = document.createElement("button");
    removeButton.type = "button";
    removeButton.className = "button-box dialogueMakerButton";
    removeButton.textContent = "削除";
    removeButton.addEventListener("click", () => {
      icons = icons.filter(item => item.id !== icon.id);
      draft.lines.forEach(line => {
        if (line.iconId === icon.id) {
          line.iconId = "";
        }
      });
      saveDialogueMakerIcons(icons);
      saveDialogueMakerDraft(draft);
      renderIconList();
      renderLineEditors();
      renderPreview();
    });

    card.appendChild(image);
    card.appendChild(name);
    card.appendChild(removeButton);
    iconList.appendChild(card);
  });
}

function createIconSelect(line) {
  const select = document.createElement("select");

  const noImageOption = document.createElement("option");
  noImageOption.value = "";
  noImageOption.textContent = "No Image";
  select.appendChild(noImageOption);

  icons.forEach(icon => {
    const option = document.createElement("option");
    option.value = icon.id;
    option.textContent = getIconLabel(icon);
    select.appendChild(option);
  });

  select.value = getIcon(line.iconId) ? line.iconId : "";
  select.addEventListener("change", () => {
    line.iconId = select.value;
    saveDraftAndPreview();
  });
  return select;
}

function moveLine(index, offset) {
  const destination = index + offset;
  if (destination < 0 || destination >= draft.lines.length) return;

  const [line] = draft.lines.splice(index, 1);
  draft.lines.splice(destination, 0, line);
  saveDialogueMakerDraft(draft);
  renderLineEditors();
  renderPreview();
}

function removeLine(index) {
  draft.lines.splice(index, 1);

  if (draft.lines.length === 0) {
    draft.lines.push(makeEmptyLine());
  }

  saveDialogueMakerDraft(draft);
  renderLineEditors();
  renderPreview();
}

function createActionButton(text, label, onClick, disabled = false) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "button-box dialogueMakerButton";
  button.textContent = text;
  button.title = label;
  button.setAttribute("aria-label", label);
  button.disabled = disabled;
  button.addEventListener("click", onClick);
  return button;
}

function createLineEditor(line, index) {
  const editor = document.createElement("article");
  editor.className = "dialogueMakerLineEditor";

  const header = document.createElement("div");
  header.className = "dialogueMakerLineHeader";

  const number = document.createElement("span");
  number.className = "dialogueMakerLineNumber";
  number.textContent = `${index + 1}行目`;

  const actions = document.createElement("div");
  actions.className = "dialogueMakerLineActions";
  actions.appendChild(createActionButton("↑", "上へ移動", () => moveLine(index, -1), index === 0));
  actions.appendChild(createActionButton("↓", "下へ移動", () => moveLine(index, 1), index === draft.lines.length - 1));
  actions.appendChild(createActionButton("削除", `${index + 1}行目を削除`, () => removeLine(index)));

  header.appendChild(number);
  header.appendChild(actions);

  const grid = document.createElement("div");
  grid.className = "dialogueMakerLineGrid";

  const iconField = document.createElement("label");
  iconField.className = "dialogueMakerLineField";
  iconField.append("アイコン");
  iconField.appendChild(createIconSelect(line));

  const speakerField = document.createElement("label");
  speakerField.className = "dialogueMakerLineField";
  speakerField.append("発言者名");
  const speakerInput = document.createElement("input");
  speakerInput.value = line.speakerName;
  speakerInput.maxLength = 50;
  speakerInput.placeholder = "例：案内役";
  speakerInput.addEventListener("input", () => {
    line.speakerName = speakerInput.value;
    saveDraftAndPreview();
  });
  speakerField.appendChild(speakerInput);

  const textField = document.createElement("label");
  textField.className = "dialogueMakerLineField dialogueMakerLineTextField";
  textField.append("セリフ");

  const textarea = document.createElement("textarea");
  textarea.value = line.text;
  textarea.maxLength = 2000;
  textarea.placeholder = "セリフを入力してください。装飾タグも使用できます。";
  textarea.addEventListener("input", () => {
    line.text = textarea.value;
    saveDraftAndPreview();
  });

  const toolbar = document.createElement("div");
  toolbar.className = "dialogueMakerToolbar";
  toolbar.appendChild(createRichTextToolbarButtons({ includeLineBreak: true }));
  bindRichTextToolbar(toolbar, textarea);

  textField.appendChild(textarea);
  textField.appendChild(toolbar);

  grid.appendChild(iconField);
  grid.appendChild(speakerField);
  grid.appendChild(textField);
  editor.appendChild(header);
  editor.appendChild(grid);
  return editor;
}

function renderLineEditors() {
  if (!linesContainer) return;

  linesContainer.innerHTML = "";
  draft.lines.forEach((line, index) => {
    linesContainer.appendChild(createLineEditor(line, index));
  });
}

iconForm?.addEventListener("submit", event => {
  event.preventDefault();

  const url = iconUrlInput?.value.trim() || "";
  const name = iconNameInput?.value.trim() || "";

  if (!url) {
    setIconMessage("アイコンURLを入力してください。");
    return;
  }

  icons.push({
    id: makeId("icon"),
    name,
    url
  });
  saveDialogueMakerIcons(icons);

  if (iconNameInput) iconNameInput.value = "";
  if (iconUrlInput) iconUrlInput.value = "";
  setIconMessage("アイコンを追加しました。");
  renderIconList();
  renderLineEditors();
});

addLineButton?.addEventListener("click", () => {
  draft.lines.push(makeEmptyLine());
  saveDialogueMakerDraft(draft);
  renderLineEditors();
  renderPreview();
});

renderIconList();
renderLineEditors();
renderPreview();
