//character-controller.js

import {createIconPicker,getNoImageUrl,normalizeCommIcons} from "./icon-picker.js";
import { bindTextPreview } from "./text-preview.js";

function normalizeDialogueList(dialogue) {
  if (Array.isArray(dialogue)) {
    return dialogue.map(item => ({
      text:
        typeof item?.text === "string"
          ? item.text
          : "",
      name:
        typeof item?.name === "string"
          ? item.name
          : "",
      iconId:
        typeof item?.iconId === "number" && item.iconId > 0
          ? item.iconId
          : null,
      iconUrl:
        typeof item?.iconUrl === "string"
          ? item.iconUrl
          : ""
    }));
  }

  if (dialogue && typeof dialogue === "object") {
    return [{
      text:
        typeof dialogue.text === "string"
          ? dialogue.text
          : "",
      name:
        typeof dialogue.name === "string"
          ? dialogue.name
          : "",
      iconId:
        typeof dialogue.iconId === "number" && dialogue.iconId > 0
          ? dialogue.iconId
          : null,
      iconUrl:
        typeof dialogue.iconUrl === "string"
          ? dialogue.iconUrl
          : ""
    }];
  }

  return [{
    text: "",
    name: "",
    iconId: null,
    iconUrl: ""
  }];
}

let currentCommIcons = [];
let nextCommRowId = 1;

const iconPicker = createIconPicker();

function getDefaultCharacterName() {
  return (
    document.getElementById("defaultCharacterName")?.value.trim() ||
    ""
  );
}

function findCommIconById(iconId) {
  if (!iconId) return null;

  return currentCommIcons.find(item => item.id === iconId) || null;
}

function resolveCommSpeakerPlaceholderName(button) {
  const selectedId =
    Number(button?.dataset.selectedId || 0);

  const selectedIcon =
    findCommIconById(selectedId);

  if (selectedIcon?.name?.trim()) {
    return selectedIcon.name.trim();
  }

  return getDefaultCharacterName();
}

function updateCommNamePlaceholder(nameInput, button) {
  if (!nameInput) return;

  const resolvedName =
    resolveCommSpeakerPlaceholderName(button);

  nameInput.placeholder =
    resolvedName || "発言者名";
}

function createCommRowElement(typeKey, rowData = {}) {
  const rowId = nextCommRowId++;
  const row = document.createElement("div");
  row.className = "commRow";
  row.dataset.type = typeKey;
  row.dataset.rowId = String(rowId);

  const button = document.createElement("button");
  button.type = "button";
  button.className = "commIconPickerButton";
  button.dataset.selectedId =
    rowData.iconId ? String(rowData.iconId) : "";
  button.dataset.selectedUrl =
    rowData.iconUrl || "";

  const img = document.createElement("img");
  img.src = rowData.iconUrl || getNoImageUrl();
  img.alt = `${typeKey} icon`;

  button.appendChild(img);

  button.addEventListener("click", () => {
    iconPicker.open(button, currentCommIcons);
  });

  button.addEventListener("iconchange", () => {
    updateCommNamePlaceholder(nameInput, button);
  });

  const inputArea = document.createElement("div");
  inputArea.className = "commInputArea";

  const nameInput = document.createElement("input");
  nameInput.className = "commNameInput";
  nameInput.value = rowData.name || "";

  const input = document.createElement("input");
  input.className = "commTextInput";
  input.value = rowData.text || "";

  const preview = document.createElement("div");
  preview.className = "commTextPreview";
  preview.dataset.previewFor = String(rowId);

  inputArea.appendChild(nameInput);
  inputArea.appendChild(input);
  inputArea.appendChild(preview);

  bindTextPreview(input, preview, { preset: "message" });


  const removeButton = document.createElement("button");
  removeButton.type = "button";
  removeButton.textContent = "×";

  removeButton.addEventListener("click", () => {
    const list = document.getElementById(`${typeKey}List`);
    if (!list) return;

    row.remove();

    if (list.children.length === 0) {
      addCommRow(typeKey);
    }
  });

  row.appendChild(button);
  row.appendChild(inputArea);
  row.appendChild(removeButton);

  return row;
}

function addCommRow(typeKey, rowData = {}) {
  const list = document.getElementById(`${typeKey}List`);
  if (!list) return;

  list.appendChild(createCommRowElement(typeKey, rowData));
}

function renderIconPicker() {
  const list =
    document.getElementById("iconPickerList");

  list.innerHTML = "";

  if (currentCommIcons.length === 0) {
    const empty = document.createElement("div");
    empty.className = "iconPickerEmpty";
    empty.textContent = "assets に登録されたキャラアイコンがありません";
    list.appendChild(empty);
    return;
  }

  currentCommIcons.forEach(item => {
    list.appendChild(createIconCard(item));
  });
}

function closeIconPicker() {
  document.getElementById("iconPickerModal")
    .classList.add("hidden");

  currentPickerButton = null;
}

function getCommRows(typeKey) {
  const list = document.getElementById(`${typeKey}List`);
  if (!list) return [];

  return [...list.querySelectorAll(".commRow")];
}

function collectDialogueList(typeKey) {
  const rows = getCommRows(typeKey);

  return rows
    .map(row => {
      const button =
        row.querySelector(".commIconPickerButton");

      const nameInput =
        row.querySelector(".commNameInput");

      const input =
        row.querySelector(".commTextInput");

      const iconId =
        Number(button?.dataset.selectedId || 0);

      const iconUrl =
        button?.dataset.selectedUrl || "";

      const name =
        nameInput?.value.trim() || "";

      const text =
        input?.value.trim() || "";

      return {
        name,
        text,
        iconId: iconId || null,
        iconUrl
      };
    })
    .filter(item =>
      item.name !== "" ||
      item.text !== "" ||
      item.iconUrl !== ""
    );
}

function renderCommList(typeKey, dialogues) {
  const list = document.getElementById(`${typeKey}List`);
  if (!list) return;

  list.innerHTML = "";

  const normalized =
    normalizeDialogueList(dialogues);

  normalized.forEach(item => {
    addCommRow(typeKey, item);
  });
}

function loadCharacter() {
  const data =
    localStorage.getItem("duck");

  if (!data) {
    currentCommIcons = [];
    renderCommList("battleStart", null);
    renderCommList("turnChangeAdvantage", null);
    renderCommList("turnChangeNeutral", null);
    renderCommList("turnChangeDisadvantage", null);
    renderCommList("turnChangePinch", null);
    renderCommList("critical", null);
    renderCommList("kill", null);
    renderCommList("battleEndWin", null);
    return;
  }

  const duck =
    JSON.parse(data);

  document.getElementById("defaultCharacterName").value =
    duck.defaultCharacterName ?? duck.name ?? "";

  document.getElementById("defaultUnitName").value =
    duck.defaultUnitName ?? duck.name ?? "";

  currentCommIcons =
    normalizeCommIcons(duck.commIcons);

  renderCommList(
    "battleStart",
    duck.commDialogues?.battleStart
  );

renderCommList(
  "turnChangeAdvantage",
  duck.commDialogues?.turnChangeAdvantage
);

renderCommList(
  "turnChangeNeutral",
  duck.commDialogues?.turnChangeNeutral
);

renderCommList(
  "turnChangeDisadvantage",
  duck.commDialogues?.turnChangeDisadvantage
);

renderCommList(
  "turnChangePinch",
  duck.commDialogues?.turnChangePinch
);

  renderCommList(
    "critical",
    duck.commDialogues?.critical
  );

  renderCommList(
    "kill",
    duck.commDialogues?.kill
  );

  renderCommList(
  "battleEndWin",
  duck.commDialogues?.battleEndWin
);

  
}

document.getElementById("addBattleStartLine")
  .addEventListener("click", () => {
    addCommRow("battleStart");
  });

document.getElementById("addTurnChangeAdvantageLine")
  .addEventListener("click", () => {
    addCommRow("turnChangeAdvantage");
  });

document.getElementById("addTurnChangeNeutralLine")
  .addEventListener("click", () => {
    addCommRow("turnChangeNeutral");
  });

document.getElementById("addTurnChangeDisadvantageLine")
  .addEventListener("click", () => {
    addCommRow("turnChangeDisadvantage");
  });

document.getElementById("addTurnChangePinchLine")
  .addEventListener("click", () => {
    addCommRow("turnChangePinch");
  });

document.getElementById("addCriticalLine")
  .addEventListener("click", () => {
    addCommRow("critical");
  });

document.getElementById("addKillLine")
  .addEventListener("click", () => {
    addCommRow("kill");
  });

document.getElementById("addBattleEndWinLine")
  .addEventListener("click", () => {
    addCommRow("battleEndWin");
  });

document.getElementById("saveCharacter")
  .addEventListener("click", () => {
    const oldData =
      localStorage.getItem("duck");

    const oldDuck =
      oldData ? JSON.parse(oldData) : {};

    const defaultCharacterName =
      document.getElementById("defaultCharacterName").value;

    const defaultUnitName =
      document.getElementById("defaultUnitName").value;

    const battleStartList =
      collectDialogueList("battleStart");

const turnChangeAdvantageList =
  collectDialogueList("turnChangeAdvantage");

const turnChangeNeutralList =
  collectDialogueList("turnChangeNeutral");

const turnChangeDisadvantageList =
  collectDialogueList("turnChangeDisadvantage");

const turnChangePinchList =
  collectDialogueList("turnChangePinch");

    const criticalList =
      collectDialogueList("critical");

    const killList =
      collectDialogueList("kill");

    const battleEndWinList =
  collectDialogueList("battleEndWin");

    const duck = {
      ...oldDuck,
      id: oldDuck.id ?? "player_duck",
      name: defaultCharacterName,
      defaultCharacterName,
      defaultUnitName,
      
commDialogues: {
  ...(oldDuck.commDialogues || {}),
  battleStart: battleStartList,
  turnChangeAdvantage: turnChangeAdvantageList,
  turnChangeNeutral: turnChangeNeutralList,
  turnChangeDisadvantage: turnChangeDisadvantageList,
  turnChangePinch: turnChangePinchList,
  critical: criticalList,
  kill: killList,
  battleEndWin: battleEndWinList
}
    };

    localStorage.setItem(
      "duck",
      JSON.stringify(duck)
    );

    alert("キャラ設定を保存しました");
  });

document.getElementById("defaultCharacterName")
  .addEventListener("input", () => {
    const rows = document.querySelectorAll(".commRow");

    rows.forEach(row => {
      const button =
        row.querySelector(".commIconPickerButton");

      const nameInput =
        row.querySelector(".commNameInput");

      updateCommNamePlaceholder(nameInput, button);
    });
  });

loadCharacter();
