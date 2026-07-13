//character-controller.js

import { createIconPicker, normalizeCommIcons } from "../common/icon-picker.js";
import { createDialogueRow, refreshDialogueRowPreview } from "../common/dialogue-row-view.js";
import { updateSpeakerNameField } from "../common/speaker-name-sync.js";
import { requireLogin, getCurrentAccount, loadCharacter, loadUnit, saveCharacter, saveUnit } from "../services/storage-service.js";

requireLogin();

function findIconIdByUrl(icons, iconUrl) {
  if (!Array.isArray(icons)) return null;
  if (typeof iconUrl !== "string" || iconUrl.trim() === "") return null;

  const matchedIcon =
    icons.find(icon => icon?.url === iconUrl);

  return matchedIcon?.id || null;
}

function getExistingCommIconId(iconId) {
  const safeIconId =
    Number(iconId || 0);

  if (!safeIconId) return null;

  const matchedIcon =
    currentCommIcons.find(icon => icon?.id === safeIconId);

  return matchedIcon?.id || null;
}

function normalizeDialogueItem(item) {
  const text =
    typeof item?.text === "string"
      ? item.text
      : "";

  if (text === "") return null;

  const iconId =
    getExistingCommIconId(item?.iconId) ||
    findIconIdByUrl(currentCommIcons, item?.iconUrl);

  return {
    text,
    name:
      typeof item?.name === "string"
        ? item.name
        : "",
    iconId: iconId || null
  };
}

function normalizeDialogueList(dialogue) {
  const source = Array.isArray(dialogue)
    ? dialogue
    : dialogue && typeof dialogue === "object"
      ? [dialogue]
      : [];

  const normalized = source
    .map(item => normalizeDialogueItem(item))
    .filter(Boolean);

  if (normalized.length > 0) {
    return normalized;
  }

  return [{
    text: "",
    name: "",
    iconId: null
  }];
}

let currentCommIcons = [];
let nextCommRowId = 1;

const iconPicker = createIconPicker();

function getCommIconUrlById(iconId) {
  const safeIconId =
    Number(iconId || 0);

  if (!safeIconId) return "";

  const matchedIcon =
    currentCommIcons.find(icon => icon?.id === safeIconId);

  return matchedIcon?.url || "";
}

function createCommRowElement(typeKey, rowData = {}) {
  const rowId = nextCommRowId++;
  
   return createDialogueRow({
    rowClassName: "commRow",
    rowDataset: {
      type: typeKey,
      rowId
    },
    inputAreaClassName: "commInputArea",
    nameInputClassName: "commNameInput",
    textInputClassName: "commTextInput",
    removeButtonClassName: "commRemoveButton",
    textPlaceholder: "セリフを入力",
    iconAlt: `${typeKey} icon`,
    nameMaxLength: 10,
    rowData: {
      ...rowData,
      iconUrl: getCommIconUrlById(rowData.iconId) || ""
    },
    iconPicker,
    getIcons: () => currentCommIcons,
    getDefaultName: () =>
      document.getElementById("defaultCharacterName")?.value.trim() || "",
    onRemove: row => {
      const list = document.getElementById(`${typeKey}List`);
      if (!list) return;

      row.remove();

      if (list.children.length === 0) {
        addCommRow(typeKey);
      }
    }
  });
}


function addCommRow(typeKey, rowData = {}) {
  const list = document.getElementById(`${typeKey}List`);
  if (!list) return;

  list.appendChild(createCommRowElement(typeKey, rowData));
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

      const name =
        nameInput?.value.trim() || "";

      const text =
        input?.value ?? "";

      return {
        name,
        text,
        iconId: iconId || null
      };
    })
    .filter(item => item.text !== "");
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
  
  document.getElementById("unitName").value =
    unit?.name ?? "";

  document.getElementById("characterProfileText").value =
    character?.profileText ?? "";

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
      document.getElementById("characterFullName").value.trim();

    const defaultName =
      document.getElementById("defaultCharacterName").value.trim();

    const unitName =
      document.getElementById("unitName").value.trim();

    const unitDescription =
      document.getElementById("unitDescription").value;

    const profileText =
      document.getElementById("characterProfileText").value;

    if (!fullName) {
      alert("フルネームを入力してください");
      return;
    }

    if (!defaultName) {
      alert("ニックネームを入力してください");
      return;
    }

    if (!unitName) {
      alert("アヒル名を入力してください");
      return;
    }

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
      profileText,
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
      name: unitName,
      description: unitDescription
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
    
      refreshDialogueRowPreview(row);
  });

loadCharacterForm();
