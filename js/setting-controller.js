//setting-controller.js

import { skillHandlers } from "./skills.js";
import {createIconPicker,getNoImageUrl,normalizeCommIcons} from "./icon-picker.js";
import { bindSpeakerNameSync, updateSpeakerNameField } from "./speaker-name-sync.js";
import {requireLogin,getCurrentAccount,loadCharacter,loadUnit,saveUnit} from "./storage-service.js";
import { getCurrentStats, isSkillUnlocked } from "./skill-unlock.js";

requireLogin();

let currentSlot = 0;

const MAX_SKILL_SLOTS = 8;
const BASE_SKILL_SLOTS = 3;
const TEC_PER_EXTRA_SLOT = 10;

const skillList = Object.keys(skillHandlers);
const skillArea = document.getElementById("skillArea");

function getAvailableSkillSlotCount(tec) {
  const safeTec = Math.max(0, Number(tec) || 0);

  return Math.min(
    MAX_SKILL_SLOTS,
    BASE_SKILL_SLOTS + Math.floor(safeTec / TEC_PER_EXTRA_SLOT)
  );
}

function getUnlockedSkillList() {
  const stats = getCurrentStats();

  return skillList.filter(skillId =>
    isSkillUnlocked(skillHandlers[skillId], stats)
  );
}

let currentCommIcons = [];
let nextDialogueRowId = 1;

const iconPicker = createIconPicker();

const patterns = [
  {
    name: "",
    public: true,
    skills: [
      { type: "" }, { type: "" }, { type: "" }, { type: "" },
      { type: "" }, { type: "" }, { type: "" }, { type: "" }
    ]
  },
  {
    name: "",
    public: false,
    skills: [
      { type: "" }, { type: "" }, { type: "" }, { type: "" },
      { type: "" }, { type: "" }, { type: "" }, { type: "" }
    ]
  },
  {
    name: "",
    public: false,
    skills: [
      { type: "" }, { type: "" }, { type: "" }, { type: "" },
      { type: "" }, { type: "" }, { type: "" }, { type: "" }
    ]
  }
];

const tabs = document.querySelectorAll(".patternTab");

tabs.forEach(tab => {
  tab.addEventListener("click", () => {
    saveCurrentPattern();
    currentSlot = Number(tab.dataset.slot);
    loadPattern(currentSlot);
  });
});

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

function normalizeSkill(skill) {
  if (typeof skill === "string") {
    return {
      type: skill,
      cutinUrl: "",
      dialogue: [{
        text: "",
        name: "",
        iconId: null,
        iconUrl: ""
      }]
    };
  }

  if (skill && typeof skill === "object") {
    return {
      type: skill.type ?? "",
      cutinUrl:
        typeof skill.cutinUrl === "string"
          ? skill.cutinUrl
          : "",
      dialogue: normalizeDialogueList(skill.dialogue)
    };
  }

  return {
    type: "",
    cutinUrl: "",
    dialogue: [{
      text: "",
      name: "",
      iconId: null,
      iconUrl: ""
    }]
  };
}

function normalizePattern(pattern) {
const normalizedSkills = Array.from({ length: MAX_SKILL_SLOTS }, (_, i) =>
  normalizeSkill(pattern?.skills?.[i])
);

  return {
    name: pattern?.name ?? "",
    public: !!pattern?.public,
    skills: normalizedSkills
  };
}

function createSkillDialogueRow(dialogueData = {}) {
  const rowId = nextDialogueRowId++;

  const row = document.createElement("div");
  row.className = "skillDialogueRow";
  row.dataset.rowId = String(rowId);

  const button = document.createElement("button");
  button.type = "button";
  button.className = "commIconPickerButton";
  button.dataset.selectedId =
    dialogueData.iconId ? String(dialogueData.iconId) : "";
  button.dataset.selectedUrl =
    dialogueData.iconUrl || "";

  const img = document.createElement("img");
  img.src = dialogueData.iconUrl || getNoImageUrl();
  img.alt = "dialogue icon";

  button.appendChild(img);

  button.addEventListener("click", () => {
    iconPicker.open(button, currentCommIcons);
  });

  const inputArea = document.createElement("div");
  inputArea.className = "skillDialogueInputArea";

  const nameInput = document.createElement("input");
  nameInput.type = "text";
  nameInput.className = "skillDialogueNameInput";
  nameInput.value = dialogueData.name || "";

  const input = document.createElement("input");
  input.type = "text";
  input.className = "skillDialogueInput";
  input.placeholder = "スキル使用時セリフ";
  input.value = dialogueData.text || "";

  inputArea.appendChild(nameInput);
  inputArea.appendChild(input);

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
    const list = row.parentElement;
    if (!list) return;

    row.remove();

    if (list.children.length === 0) {
      list.appendChild(createSkillDialogueRow());
    }
  });

  row.appendChild(button);
  row.appendChild(inputArea);
  row.appendChild(removeButton);

  return row;
}

function createSkillDialogueList(dialogues = []) {
  const list = document.createElement("div");
  list.className = "skillDialogueList";

  const normalized = normalizeDialogueList(dialogues);

  normalized.forEach(item => {
    list.appendChild(createSkillDialogueRow(item));
  });

  const addButton = document.createElement("button");
  addButton.type = "button";
  addButton.className = "addSkillDialogueLine";
  addButton.textContent = "＋";

  addButton.addEventListener("click", () => {
    list.insertBefore(
      createSkillDialogueRow(),
      addButton
    );
  });

  list.appendChild(addButton);

  return list;
}

function createSkillBlock(skillData, index) {
  const wrapper = document.createElement("div");
  wrapper.className = "skillBlock";
  wrapper.dataset.index = String(index);

  const select = document.createElement("select");
  select.className = "skillSelect";

  const emptyOption = document.createElement("option");
  emptyOption.value = "";
  emptyOption.textContent = "なし";
  select.appendChild(emptyOption);

  const unlockedSkillList = getUnlockedSkillList();

  for (const skillId of unlockedSkillList) {
    const option = document.createElement("option");
    option.value = skillId;
    option.textContent =
      skillHandlers[skillId]?.name || skillId;
    select.appendChild(option);
  }

    const currentSkillType = skillData?.type ?? "";

  if (
    currentSkillType &&
    !unlockedSkillList.includes(currentSkillType)
  ) {
    const lockedOption = document.createElement("option");
    lockedOption.value = currentSkillType;
    lockedOption.textContent =
      `${skillHandlers[currentSkillType]?.name || currentSkillType}（使用不可）`;
    select.appendChild(lockedOption);
  }

  select.value = currentSkillType;

  const detailArea = document.createElement("div");
  detailArea.className = "skillDetailArea";

  const skillInfo = document.createElement("div");
  skillInfo.className = "skillInfoBox";

  const skillRange = document.createElement("div");
  skillRange.className = "skillInfoRange";

  const skillDescription = document.createElement("div");
  skillDescription.className = "skillInfoDescription";

  const cutinLabel = document.createElement("div");
  cutinLabel.textContent = "カットインURL";

  const cutinInput = document.createElement("input");
  cutinInput.type = "text";
  cutinInput.className = "cutinUrlInput";
  cutinInput.placeholder = "https://...";
  cutinInput.value = skillData?.cutinUrl || "";

  const dialogueList = createSkillDialogueList(
    skillData?.dialogue
  );

  detailArea.appendChild(skillInfo);
  skillInfo.appendChild(skillRange);
  skillInfo.appendChild(skillDescription);
  detailArea.appendChild(document.createElement("br"));
  detailArea.appendChild(cutinLabel);
  detailArea.appendChild(cutinInput);
  detailArea.appendChild(document.createElement("br"));
  detailArea.appendChild(dialogueList);

  const updateSkillInfo = () => {
    const selectedSkill = skillHandlers[select.value];

    if (!selectedSkill) {
      skillRange.textContent = "";
      skillDescription.textContent = "";
      return;
    }

    skillRange.textContent =
      `範囲: ${selectedSkill.rangeText || "未設定"}`;

    skillDescription.textContent =
      `説明: ${selectedSkill.description || "未設定"}`;
  };

  const updateDetailVisibility = () => {
    if (select.value) {
      detailArea.style.display = "";
    } else {
      detailArea.style.display = "none";
    }

    updateSkillInfo();
  };

  select.addEventListener("change", updateDetailVisibility);

  wrapper.appendChild(select);
  wrapper.appendChild(detailArea);

  updateDetailVisibility();

  return wrapper;
}

function renderSkillArea(skills, visibleCount = skills.length) {
  skillArea.innerHTML = "";

  const visibleSkills = skills.slice(0, visibleCount);

  visibleSkills.forEach((skillData, index) => {
    const block = createSkillBlock(skillData, index);
    skillArea.appendChild(block);

    if (index < visibleSkills.length - 1) {
      skillArea.appendChild(document.createElement("br"));
    }
  });
}

function readSkillArea() {
  const blocks = skillArea.querySelectorAll(".skillBlock");

  return [...blocks].map(block => {
    const type =
      block.querySelector(".skillSelect")?.value ?? "";

    const cutinInput =
      block.querySelector(".cutinUrlInput");

    const cutinUrl =
      cutinInput?.value.trim() || "";

    const dialogueRows =
      block.querySelectorAll(".skillDialogueRow");

    const dialogue = [...dialogueRows]
      .map(row => {
        const button =
          row.querySelector(".commIconPickerButton");

        const nameInput =
          row.querySelector(".skillDialogueNameInput");

        const input =
          row.querySelector(".skillDialogueInput");

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

    if (!type) {
      return { type: "" };
    }

    const result = {
      type
    };

    if (cutinUrl !== "") {
      result.cutinUrl = cutinUrl;
    }

    if (dialogue.length > 0) {
      result.dialogue = dialogue;
    }

    return result;
  });
}

function refreshSkillAreaByTec() {
  saveCurrentPattern();
  loadPattern(currentSlot);
}

function buildSaveWarnings() {
  const warnings = [];

  const tecValue =
    Number(document.getElementById("statTEC")?.value) || 0;

  const visibleCount =
    getAvailableSkillSlotCount(tecValue);

  const publicPatterns =
    patterns
      .map((pattern, index) => ({ pattern, index }))
      .filter(item => item.pattern.public);

  if (publicPatterns.length === 0) {
    warnings.push("・公開されている設定がありません");
  }

  const publicButEmptyPatterns = publicPatterns
    .filter(({ pattern }) =>
      !(pattern.skills || []).some(skill => skill?.type)
    )
    .map(({ index }) => `設定${index + 1}`);

  if (publicButEmptyPatterns.length > 0) {
    warnings.push(
      `・スキルが1つも設定されていない公開設定があります（${publicButEmptyPatterns.join("、")}）`
    );
  }

  const overTecPatterns = patterns
    .map((pattern, index) => {
      const hasOverSkill = (pattern.skills || [])
        .slice(visibleCount)
        .some(skill => skill?.type);

      return hasOverSkill ? `設定${index + 1}` : null;
    })
    .filter(Boolean);

  if (overTecPatterns.length > 0) {
    warnings.push(
      `・現在のTECでは使用できない枠にスキルが設定されています（${overTecPatterns.join("、")}）`
    );
    warnings.push(
      "  超過分の設定は保存されますが、戦闘では使用されません"
    );
  }

  return warnings;
}

function loadPattern(slot) {
  const p = patterns[slot];

  document.getElementById("patternName").value = p.name;

  const publicCheck =
    document.getElementById("patternPublic");

  publicCheck.checked = p.public;
  publicCheck.disabled = false;

  const tecValue =
    Number(document.getElementById("statTEC")?.value) || 0;

  const visibleCount =
    getAvailableSkillSlotCount(tecValue);

  renderSkillArea(p.skills, visibleCount);
}

function saveCurrentPattern() {
  const p = patterns[currentSlot];

  p.name =
    document.getElementById("patternName").value;

  p.public =
    document.getElementById("patternPublic").checked;

  const tecValue =
    Number(document.getElementById("statTEC")?.value) || 0;

  const visibleCount =
    getAvailableSkillSlotCount(tecValue);

  const visibleSkills = readSkillArea();

  p.skills = Array.from({ length: MAX_SKILL_SLOTS }, (_, i) => {
    if (i < visibleCount) {
      return normalizeSkill(visibleSkills[i]);
    }

    return normalizeSkill(p.skills[i]);
  });
}

loadDuck();

function loadDuck() {
  const account = getCurrentAccount();

  if (!account?.eno) {
    alert("ログイン中のアカウント情報を確認できません");
    return;
  }

  const eno = account.eno;

  const unit = loadUnit(eno, 1);
  const character = loadCharacter(eno);

  const defaultCharacterNameInput =
    document.getElementById("defaultCharacterName");

  if (defaultCharacterNameInput) {
    defaultCharacterNameInput.value =
      character?.defaultName ?? "";

    defaultCharacterNameInput.addEventListener("input", () => {
      const rows = document.querySelectorAll(".skillDialogueRow");

      rows.forEach(row => {
        const button =
          row.querySelector(".commIconPickerButton");

        const nameInput =
          row.querySelector(".skillDialogueNameInput");

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
  }

  currentCommIcons =
    normalizeCommIcons(character?.commIcons);

if (unit?.patterns) {
  for (let i = 0; i < 3; i++) {
    patterns[i] = normalizePattern(unit.patterns[i]);
  }
}

  document.getElementById("unitType").value =
    unit?.type ?? "attack";

  document.getElementById("statAT").value =
    unit?.stats?.atk ?? 0;

  document.getElementById("statDF").value =
    unit?.stats?.def ?? 0;

  document.getElementById("statHEAL").value =
    unit?.stats?.heal ?? 0;

  document.getElementById("statSPEED").value =
    unit?.stats?.speed ?? 0;

  document.getElementById("statCRI").value =
    unit?.stats?.cri ?? 0;

  const statTecInput =
    document.getElementById("statTEC");

  statTecInput.value =
    unit?.stats?.tec ?? 0;

  statTecInput.addEventListener("input", () => {
    refreshSkillAreaByTec();
  });

  loadPattern(currentSlot);
}

const saveBtn =
  document.getElementById("saveUnit");

saveBtn.addEventListener("click", () => {
  const account = getCurrentAccount();

  if (!account?.eno) {
    alert("ログイン中のアカウント情報を確認できません");
    return;
  }

  const eno = account.eno;

  saveCurrentPattern();

  const warnings = buildSaveWarnings();

  if (warnings.length > 0) {
    const message = [
      "以下の内容を確認してください。",
      "",
      ...warnings,
      "",
      "このまま保存しますか？"
    ].join("\n");

    const shouldSave = confirm(message);

    if (!shouldSave) {
      return;
    }
  }

  const type =
    document.getElementById("unitType").value;

  const stats = {
    atk: Number(document.getElementById("statAT").value),
    def: Number(document.getElementById("statDF").value),
    heal: Number(document.getElementById("statHEAL").value),
    speed: Number(document.getElementById("statSPEED").value),
    cri: Number(document.getElementById("statCRI").value),
    tec: Number(document.getElementById("statTEC").value)
  };

  const oldUnit =
    loadUnit(eno, 1) || {};

  const unit = {
    ...oldUnit,
    eno,
    unitNo: oldUnit.unitNo ?? 1,
    id: oldUnit.id ?? "player_unit",
    name: oldUnit.name ?? "",
    type,
    stats,
    patterns
  };

  saveUnit(eno, 1, unit);

  alert("アヒル設定を保存しました");
});

loadPattern(currentSlot);
