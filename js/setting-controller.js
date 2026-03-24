//setting-controller.js

import { skillHandlers } from "./skills.js";

let currentSlot = 0;

const skillList = Object.keys(skillHandlers);
const skillArea = document.getElementById("skillArea");

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

function normalizeSkill(skill) {
  if (typeof skill === "string") {
    return { type: skill };
  }

  if (skill && typeof skill === "object") {
    return {
      type: skill.type ?? "",
      dialogue: skill.dialogue?.text
        ? { text: skill.dialogue.text }
        : undefined
    };
  }

  return { type: "" };
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

  const textInput = document.createElement("input");
  textInput.type = "text";
  textInput.className = "skillDialogueInput";
  textInput.placeholder = "スキル使用時セリフ";
  textInput.value = skillData?.dialogue?.text ?? "";

  wrapper.appendChild(select);
  wrapper.appendChild(document.createElement("br"));
  wrapper.appendChild(textInput);

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

    const text =
      block.querySelector(".skillDialogueInput")?.value.trim() ?? "";

    if (!type) {
      return { type: "" };
    }

    if (!text) {
      return { type };
    }

    return {
      type,
      dialogue: {
        text
      }
    };
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
