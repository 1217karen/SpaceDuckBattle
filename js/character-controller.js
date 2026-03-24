//character-controller.js

import {createIconPicker,getNoImageUrl,normalizeCommIcons} from "./icon-picker.js";

function getNoImageUrl() {
  return "https://placehold.co/60x60?text=NO+IMG";
}

function normalizeCommIcons(commIcons) {
  if (!Array.isArray(commIcons)) return [];

  return commIcons
    .map((item, index) => ({
      id:
        typeof item?.id === "number"
          ? item.id
          : index + 1,
      url:
        typeof item?.url === "string"
          ? item.url
          : ""
    }))
    .filter(item => item.url.trim() !== "");
}

function normalizeDialogueList(dialogue) {
  if (Array.isArray(dialogue)) {
    return dialogue.map(item => ({
      text:
        typeof item?.text === "string"
          ? item.text
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
    iconId: null,
    iconUrl: ""
  }];
}

let currentCommIcons = [];
let nextCommRowId = 1;

const iconPicker = createIconPicker();

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

  const inputArea = document.createElement("div");
  inputArea.className = "commInputArea";

  const input = document.createElement("input");
  input.className = "commTextInput";
  input.value = rowData.text || "";

  inputArea.appendChild(input);

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

function createIconCard(item) {
  const card = document.createElement("div");
  card.className = "iconPickerCard";
  card.dataset.id = String(item.id);
  card.dataset.url = item.url;

  const img = document.createElement("img");
  img.src = item.url;
  img.alt = `icon ${item.id}`;

  const label = document.createElement("div");
  label.className = "iconPickerCardId";
  label.textContent = `ID ${item.id}`;

  card.appendChild(img);
  card.appendChild(label);

  card.addEventListener("click", () => {
    if (!currentPickerButton) return;

    setButtonPreview(
      currentPickerButton,
      item.id,
      item.url
    );

    closeIconPicker();
  });

  return card;
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

      const input =
        row.querySelector(".commTextInput");

      const iconId =
        Number(button?.dataset.selectedId || 0);

      const iconUrl =
        button?.dataset.selectedUrl || "";

      const text =
        input?.value.trim() || "";

      return {
        text,
        iconId: iconId || null,
        iconUrl
      };
    })
    .filter(item => item.text !== "" || item.iconUrl !== "");
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
    renderCommList("turnChange", null);
    renderCommList("critical", null);
    renderCommList("kill", null);
    return;
  }

  const duck =
    JSON.parse(data);

  document.getElementById("duckName").value =
    duck.name ?? "";

  currentCommIcons =
    normalizeCommIcons(duck.commIcons);

  renderCommList(
    "battleStart",
    duck.commDialogues?.battleStart
  );

  renderCommList(
    "turnChange",
    duck.commDialogues?.turnChange
  );

  renderCommList(
    "critical",
    duck.commDialogues?.critical
  );

  renderCommList(
    "kill",
    duck.commDialogues?.kill
  );
}

document.getElementById("addBattleStartLine")
  .addEventListener("click", () => {
    addCommRow("battleStart");
  });

document.getElementById("addTurnChangeLine")
  .addEventListener("click", () => {
    addCommRow("turnChange");
  });

document.getElementById("addCriticalLine")
  .addEventListener("click", () => {
    addCommRow("critical");
  });

document.getElementById("addKillLine")
  .addEventListener("click", () => {
    addCommRow("kill");
  });

document.getElementById("saveCharacter")
  .addEventListener("click", () => {
    const oldData =
      localStorage.getItem("duck");

    const oldDuck =
      oldData ? JSON.parse(oldData) : {};

    const name =
      document.getElementById("duckName").value;

    const battleStartList =
      collectDialogueList("battleStart");

    const turnChangeList =
      collectDialogueList("turnChange");

    const criticalList =
      collectDialogueList("critical");

    const killList =
      collectDialogueList("kill");

    const duck = {
      ...oldDuck,
      id: oldDuck.id ?? "player_duck",
      name,
      commDialogues: {
        ...(oldDuck.commDialogues || {}),
        battleStart: battleStartList,
        turnChange: turnChangeList,
        critical: criticalList,
        kill: killList
      }
    };

    localStorage.setItem(
      "duck",
      JSON.stringify(duck)
    );

    alert("キャラ設定を保存しました");
  });

loadCharacter();
