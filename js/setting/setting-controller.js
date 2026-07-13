//setting-controller.js

import { skillHandlers } from "../data/skills.js";
import { createIconPicker, normalizeCommIcons } from "../common/icon-picker.js";
import { createDialogueRow, readDialogueRow } from "../common/dialogue-row-view.js";
import { requireLogin, getCurrentAccount, loadCharacter, loadUnit, saveUnit } from "../services/storage-service.js";
import { getCurrentStats, isSkillUnlocked } from "./skill-unlock.js";

requireLogin();

let currentSlot = 0;

const MAX_SKILL_SLOTS = 8;
const BASE_SKILL_SLOTS = 3;
const TEC_PER_EXTRA_SLOT = 10;

const skillList = Object.keys(skillHandlers);
const skillArea = document.getElementById("skillArea");

const unitTypeDescriptions = {
  attack: "自分から一番近い敵に向かって進みます。",
  defense: "敵に一番近い味方の前に向かって進みます。",
  heal: "一番HPが低い味方に向かって進みます。",
  speed: "自陣から一番遠くにいる敵に向かって進みます。また、１度に最大２マス動けます。",
  technical: "自分から一番近い敵と１マス開けた場所を維持します。",
  support: "敵に一番近い味方の隣に向かって進みます。"
};

function updateUnitTypeDescription() {
  const select =
    document.getElementById("unitType");

  const description =
    document.getElementById("unitTypeDescription");

  if (!select || !description) return;

  description.textContent =
    unitTypeDescriptions[select.value] || "";
}

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
let currentDefaultSpeakerName = "";
let draggedSkillBlock = null;

function getDefaultSpeakerName() {
  return currentDefaultSpeakerName;
}

function getCommIconUrlById(iconId) {
  const safeIconId =
    Number(iconId || 0);

  if (!safeIconId) return "";

  const matchedIcon =
    currentCommIcons.find(icon => Number(icon?.id || 0) === safeIconId);

  return matchedIcon?.url || "";
}

const iconPicker = createIconPicker();

let oldUnit = {};

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
    updatePatternTabsActiveState();
  });
});

function updatePatternTabsActiveState() {
  tabs.forEach(tab => {
    const slot = Number(tab.dataset.slot);
    tab.classList.toggle("is-active", slot === currentSlot);
  });
}

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
          : null
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
          : null
    }];
  }

  return [{
    text: "",
    name: "",
    iconId: null
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
        iconId: null
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
      iconId: null
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
  return createDialogueRow({
    rowClassName: "skillDialogueRow imageInputRow",
    inputAreaClassName: "skillDialogueInputArea imageInputBody",
    nameInputClassName: "skillDialogueNameInput",
    textInputClassName: "skillDialogueInput",
    removeButtonClassName: "skillDialogueRemoveButton",
    textPlaceholder: "スキル使用時セリフ",
    iconAlt: "dialogue icon",
    rowData: {
      ...dialogueData,
      iconUrl: getCommIconUrlById(dialogueData.iconId) || ""
    },
    iconPicker,
    getIcons: () => currentCommIcons,
    getDefaultName: getDefaultSpeakerName,
    onRemove: row => {
      const list = row.parentElement;
      if (!list) return;

      row.remove();

      if (list.querySelectorAll(".skillDialogueRow").length === 0) {
        list.insertBefore(
          createSkillDialogueRow(),
          list.querySelector(".addSkillDialogueLine")
        );
      }
    }
  });
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
  addButton.className = "addSkillDialogueLine button-box";
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

function bindSkillBlockDrag(block, dragHandle) {
  dragHandle.draggable = true;
  dragHandle.title = "ドラッグで並べ替え";

  dragHandle.addEventListener("dragstart", (e) => {
    draggedSkillBlock = block;
    block.classList.add("is-dragging");

    if (e.dataTransfer) {
      e.dataTransfer.effectAllowed = "move";
      e.dataTransfer.setData("text/plain", block.dataset.index || "");
    }
  });

  dragHandle.addEventListener("dragend", () => {
    block.classList.remove("is-dragging");
    draggedSkillBlock = null;
  });

  block.addEventListener("dragover", (e) => {
    if (!draggedSkillBlock || draggedSkillBlock === block) return;

    e.preventDefault();

    const area =
      document.getElementById("skillArea");

    if (!area) return;

    const rect =
      block.getBoundingClientRect();

    const insertAfter =
      e.clientY > rect.top + rect.height / 2;

    if (insertAfter) {
      area.insertBefore(draggedSkillBlock, block.nextSibling);
    } else {
      area.insertBefore(draggedSkillBlock, block);
    }
  });
}

function createSkillBlock(skillData, index) {
const wrapper = document.createElement("div");
wrapper.className = "skillBlock subsection-card";
wrapper.dataset.index = String(index);

  const select = document.createElement("select");
  select.className = "skillSelect";

  const dragHandle = document.createElement("button");
  dragHandle.type = "button";
  dragHandle.className = "skillDragHandle button-icon";
  dragHandle.textContent = "☰";

  const skillBlockBody = document.createElement("div");
  skillBlockBody.className = "skillBlockBody";

  const skillHeader = document.createElement("div");
  skillHeader.className = "skillBlockHeader";

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

  const skillCooldown = document.createElement("div");
  skillCooldown.className = "skillInfoCooldown";

  const skillSummary = document.createElement("div");
  skillSummary.className = "skillInfoSummary";

const cutinRow = document.createElement("div");
cutinRow.className = "cutinImageRow imageInputRow";

const cutinInputArea = document.createElement("div");
cutinInputArea.className = "imageInputBody";

const cutinLabel = document.createElement("label");
cutinLabel.className = "imageInputLabel";
cutinLabel.textContent = "カットインURL";

const cutinInput = document.createElement("input");
cutinInput.type = "text";
cutinInput.className = "cutinUrlInput imageInputControl";
cutinInput.placeholder = "https://...";
cutinInput.value = skillData?.cutinUrl || "";

const cutinPreview = document.createElement("img");
cutinPreview.className = "cutinPreview imageInputPreview-cutin";
cutinPreview.alt = "カットインプレビュー";

function updateCutinPreview() {
  const url = cutinInput.value.trim();

  if (url === "") {
    cutinPreview.hidden = true;
    cutinPreview.removeAttribute("src");
    return;
  }

  cutinPreview.hidden = false;
  cutinPreview.src = url;
}

cutinInput.addEventListener("input", updateCutinPreview);

cutinInputArea.appendChild(cutinLabel);
cutinInputArea.appendChild(cutinInput);

cutinRow.appendChild(cutinInputArea);
cutinRow.appendChild(cutinPreview);

updateCutinPreview();

  const dialogueList = createSkillDialogueList(
    skillData?.dialogue
  );

  const performanceToggle = document.createElement("button");
  performanceToggle.type = "button";
  performanceToggle.className = "skillPerformanceToggle button-plain";
  performanceToggle.textContent = "▶ 演出設定";

  const performanceArea = document.createElement("div");
  performanceArea.className = "skillPerformanceArea";
  performanceArea.style.display = "none";

  performanceToggle.addEventListener("click", () => {
    const isOpen =
      performanceArea.style.display !== "none";

    performanceArea.style.display =
      isOpen ? "none" : "";

    performanceToggle.textContent =
      isOpen
        ? "▶ 演出設定"
        : "▼ 演出設定";
  });

  performanceArea.appendChild(cutinRow);
  performanceArea.appendChild(dialogueList);

  skillInfo.appendChild(skillCooldown);
  skillInfo.appendChild(skillSummary);

  detailArea.appendChild(performanceToggle);
  detailArea.appendChild(performanceArea);

  const updateSkillInfo = () => {
    const selectedSkill = skillHandlers[select.value];

    if (!selectedSkill) {
      skillInfo.style.display = "none";
      skillCooldown.textContent = "";
      skillSummary.textContent = "";
      return;
    }

    skillInfo.style.display = "";

    skillCooldown.textContent =
      `CT: ${selectedSkill.cooldown ?? 0}`;

    skillSummary.textContent =
      selectedSkill.summary || selectedSkill.description || "スキル説明が未設定です。";
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

  bindSkillBlockDrag(wrapper, dragHandle);

  skillHeader.appendChild(select);
  skillHeader.appendChild(skillInfo);

  skillBlockBody.appendChild(skillHeader);
  skillBlockBody.appendChild(detailArea);

  wrapper.appendChild(dragHandle);
  wrapper.appendChild(skillBlockBody);

  updateDetailVisibility();

  return wrapper;
}

function renderSkillArea(skills, visibleCount = skills.length) {
  skillArea.innerHTML = "";

  const visibleSkills = skills.slice(0, visibleCount);

  visibleSkills.forEach((skillData, index) => {
    const block = createSkillBlock(skillData, index);
    skillArea.appendChild(block);
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
      .map(row => readDialogueRow(row, { trimText: true }))
      .filter(item => item.text !== "");

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

function loadDuck() {
  const account = getCurrentAccount();

  if (!account?.eno) {
    alert("ログイン中のアカウント情報を確認できません");
    return;
  }

  const eno = account.eno;

  const unit = loadUnit(eno, 1);
  const character = loadCharacter(eno);

  oldUnit = unit || {};

  currentDefaultSpeakerName =
    String(character?.defaultName ?? "").trim();

  currentCommIcons =
    normalizeCommIcons(character?.commIcons);

if (unit?.patterns) {
  for (let i = 0; i < 3; i++) {
    patterns[i] = normalizePattern(unit.patterns[i]);
  }
}

  document.getElementById("unitType").value =
    unit?.type ?? "attack";
  
  updateUnitTypeDescription();

document.getElementById("unitType")
  .addEventListener("change", updateUnitTypeDescription);

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
  location.reload();
});

loadDuck();
updatePatternTabsActiveState();
