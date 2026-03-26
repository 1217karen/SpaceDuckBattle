//setting-controller.js

import { skillHandlers } from "./skills.js";
import {createIconPicker,getNoImageUrl,normalizeCommIcons} from "./icon-picker.js";

let currentSlot = 0;

const skillList = Object.keys(skillHandlers);
const skillArea = document.getElementById("skillArea");

let currentCommIcons = [];
let nextDialogueRowId = 1;

const iconPicker = createIconPicker();

const patterns = [
  {
    name: "",
    public: true,
    skills: [{ type: "" }, { type: "" }, { type: "" }, { type: "" }, { type: "" }, { type: "" }]
  },
  {
    name: "",
    public: false,
    skills: [{ type: "" }, { type: "" }, { type: "" }, { type: "" }, { type: "" }, { type: "" }]
  },
  {
    name: "",
    public: false,
    skills: [{ type: "" }, { type: "" }, { type: "" }, { type: "" }, { type: "" }, { type: "" }]
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

function normalizeSkill(skill) {
  if (typeof skill === "string") {
    return {
      type: skill,
      cutinId: null,
      cutinUrl: "",
      dialogue: [{
        text: "",
        iconId: null,
        iconUrl: ""
      }]
    };
  }

  if (skill && typeof skill === "object") {
    return {
      type: skill.type ?? "",
      cutinId:
        typeof skill.cutinId === "number" && skill.cutinId > 0
          ? skill.cutinId
          : null,
      cutinUrl:
        typeof skill.cutinUrl === "string"
          ? skill.cutinUrl
          : "",
      dialogue: normalizeDialogueList(skill.dialogue)
    };
  }

  return {
    type: "",
    cutinId: null,
    cutinUrl: "",
    dialogue: [{
      text: "",
      iconId: null,
      iconUrl: ""
    }]
  };
}

function normalizePattern(pattern, isFirstSlot = false) {
  const normalizedSkills = Array.from({ length: 6 }, (_, i) =>
    normalizeSkill(pattern?.skills?.[i])
  );

  return {
    name: pattern?.name ?? "",
    public: isFirstSlot ? true : !!pattern?.public,
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

  const input = document.createElement("input");
  input.type = "text";
  input.className = "skillDialogueInput";
  input.placeholder = "スキル使用時セリフ";
  input.value = dialogueData.text || "";

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
  row.appendChild(input);
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

  for (const skillId of skillList) {
    const option = document.createElement("option");
    option.value = skillId;
    option.textContent = skillId;
    select.appendChild(option);
  }

  select.value = skillData?.type ?? "";

  const cutinLabel = document.createElement("div");
  cutinLabel.textContent = "カットイン";

  const cutinButton = document.createElement("button");
  cutinButton.type = "button";
  cutinButton.className = "cutinPickerButton";
  cutinButton.dataset.selectedId =
    skillData?.cutinId ? String(skillData.cutinId) : "";
  cutinButton.dataset.selectedUrl =
    skillData?.cutinUrl || "";

  const cutinImg = document.createElement("img");
  cutinImg.src = skillData?.cutinUrl || getNoImageUrl();
  cutinImg.alt = "cutin image";

  cutinButton.appendChild(cutinImg);

  cutinButton.addEventListener("click", () => {
    iconPicker.open(cutinButton, currentCommIcons);
  });

  const dialogueList = createSkillDialogueList(
    skillData?.dialogue
  );

  wrapper.appendChild(select);
  wrapper.appendChild(document.createElement("br"));
  wrapper.appendChild(cutinLabel);
  wrapper.appendChild(cutinButton);
  wrapper.appendChild(document.createElement("br"));
  wrapper.appendChild(dialogueList);

  return wrapper;
}

function renderSkillArea(skills) {
  skillArea.innerHTML = "";

  skills.forEach((skillData, index) => {
    const block = createSkillBlock(skillData, index);
    skillArea.appendChild(block);

    if (index < skills.length - 1) {
      skillArea.appendChild(document.createElement("br"));
    }
  });
}

function readSkillArea() {
  const blocks = skillArea.querySelectorAll(".skillBlock");

  return [...blocks].map(block => {
    const type =
      block.querySelector(".skillSelect")?.value ?? "";

    const cutinButton =
      block.querySelector(".cutinPickerButton");

    const cutinId =
      Number(cutinButton?.dataset.selectedId || 0);

    const cutinUrl =
      cutinButton?.dataset.selectedUrl || "";

    const dialogueRows =
      block.querySelectorAll(".skillDialogueRow");

    const dialogue = [...dialogueRows]
      .map(row => {
        const button =
          row.querySelector(".commIconPickerButton");

        const input =
          row.querySelector(".skillDialogueInput");

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

    if (!type) {
      return { type: "" };
    }

    const result = {
      type
    };

    if (cutinUrl !== "") {
      result.cutinId = cutinId || null;
      result.cutinUrl = cutinUrl;
    }

    if (dialogue.length > 0) {
      result.dialogue = dialogue;
    }

    return result;
  });
}

function loadPattern(slot) {
  const p = patterns[slot];

  document.getElementById("patternName").value = p.name;

  const publicCheck =
    document.getElementById("patternPublic");

  publicCheck.checked = p.public;

  if (slot === 0) {
    publicCheck.disabled = true;
  } else {
    publicCheck.disabled = false;
  }

  renderSkillArea(p.skills);
}

function saveCurrentPattern() {
  const p = patterns[currentSlot];

  p.name =
    document.getElementById("patternName").value;

  p.public =
    currentSlot === 0
      ? true
      : document.getElementById("patternPublic").checked;

  p.skills = readSkillArea();
}

loadDuck();

function loadDuck() {
  const data =
    localStorage.getItem("duck");

  if (!data) {
    loadPattern(currentSlot);
    return;
  }

  const duck =
    JSON.parse(data);

  currentCommIcons =
    normalizeCommIcons(duck.commIcons);

  if (duck.patterns) {
    for (let i = 0; i < 3; i++) {
      patterns[i] = normalizePattern(duck.patterns[i], i === 0);
    }
  }

  document.getElementById("duckType").value =
    duck.type ?? "attack";

  document.getElementById("statAT").value =
    duck.stats?.atk ?? 0;

  document.getElementById("statDF").value =
    duck.stats?.def ?? 0;

  document.getElementById("statHEAL").value =
    duck.stats?.heal ?? 0;

  document.getElementById("statSPEED").value =
    duck.stats?.speed ?? 0;

  document.getElementById("statCRI").value =
    duck.stats?.cri ?? 0;

  document.getElementById("statTEC").value =
    duck.stats?.tec ?? 0;

  loadPattern(currentSlot);
}

const saveBtn =
  document.getElementById("saveDuck");

saveBtn.addEventListener("click", () => {
  saveCurrentPattern();

  const type =
    document.getElementById("duckType").value;

  const stats = {
    atk: Number(document.getElementById("statAT").value),
    def: Number(document.getElementById("statDF").value),
    heal: Number(document.getElementById("statHEAL").value),
    speed: Number(document.getElementById("statSPEED").value),
    cri: Number(document.getElementById("statCRI").value),
    tec: Number(document.getElementById("statTEC").value)
  };

  const oldData =
    localStorage.getItem("duck");

  const oldDuck =
    oldData ? JSON.parse(oldData) : {};

  const duck = {
    ...oldDuck,
    id: oldDuck.id ?? "player_duck",
    type,
    stats,
    patterns
  };

  localStorage.setItem(
    "duck",
    JSON.stringify(duck)
  );

  alert("アヒル設定を保存しました");
});

loadPattern(currentSlot);
