//character-controller.js

import { createIconPicker, getNoImageUrl, normalizeCommIcons } from "../common/icon-picker.js";
import { bindTextPreview } from "../common/text-preview.js";
import { bindSpeakerNameSync, updateSpeakerNameField } from "../common/speaker-name-sync.js";
import { requireLogin, getCurrentAccount, loadCharacter, loadUnit, saveCharacter, saveUnit } from "../services/storage-service.js";

requireLogin();

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

  bindSpeakerNameSync({
    nameInput,
    button,
    getIcons: () => currentCommIcons,
    getDefaultName: () =>
      document.getElementById("defaultCharacterName")?.value.trim() || "",
    mode: "placeholder"
  });
  
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

function loadCharacterForm() {
  const account = getCurrentAccount();

  if (!account?.eno) {
    alert("ログイン中のアカウント情報を確認できません");
    return;
  }

  const eno = account.eno;

  const character =
    loadCharacter(eno);

  const unit =
    loadUnit(eno, 1);

  document.getElementById("characterFullName").value =
    character?.fullName ?? "";

  document.getElementById("defaultCharacterName").value =
    character?.defaultName ?? "";

  document.getElementById("unitName").value =
    unit?.name ?? "";

  currentCommIcons =
    normalizeCommIcons(character?.commIcons);

  renderCommList(
    "battleStart",
    character?.commDialogues?.battleStart
  );

  renderCommList(
    "turnChangeAdvantage",
    character?.commDialogues?.turnChangeAdvantage
  );

  renderCommList(
    "turnChangeNeutral",
    character?.commDialogues?.turnChangeNeutral
  );

  renderCommList(
    "turnChangeDisadvantage",
    character?.commDialogues?.turnChangeDisadvantage
  );

  renderCommList(
    "turnChangePinch",
    character?.commDialogues?.turnChangePinch
  );

  renderCommList(
    "critical",
    character?.commDialogues?.critical
  );

  renderCommList(
    "kill",
    character?.commDialogues?.kill
  );

  renderCommList(
    "battleEndWin",
    character?.commDialogues?.battleEndWin
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
    const account = getCurrentAccount();

    if (!account?.eno) {
      alert("ログイン中のアカウント情報を確認できません");
      return;
    }

    const eno = account.eno;

    const oldCharacter =
      loadCharacter(eno) || {};

    const oldUnit =
      loadUnit(eno, 1) || {};

    const fullName =
      document.getElementById("characterFullName").value;

    const defaultName =
      document.getElementById("defaultCharacterName").value;

    const unitName =
      document.getElementById("unitName").value;

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

    const character = {
      ...oldCharacter,
      eno,
      fullName,
      defaultName,
      commIcons: currentCommIcons,

      commDialogues: {
        ...(oldCharacter.commDialogues || {}),
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

    const unit = {
      ...oldUnit,
      eno,
      unitNo: oldUnit.unitNo ?? 1,
      name: unitName
    };

    saveCharacter(eno, character);
    saveUnit(eno, 1, unit);

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

      updateSpeakerNameField({
        nameInput,
        button,
        icons: currentCommIcons,
        getDefaultName: () =>
          document.getElementById("defaultCharacterName")?.value.trim() || "",
        mode: "placeholder"
      });
    });
  });

loadCharacterForm();
