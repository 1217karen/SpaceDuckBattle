//setting-skill-guide.js

import { skillHandlers } from "../data/skills.js";
import { getCurrentStats, isSkillUnlocked, formatUnlockText } from "./skill-unlock.js";

const filterState = {
  ctSort: "",
  targetMatchMode: "any",
  effectMatchMode: "any",
  targets: [],
  targetCounts: [],
  effects: []
};

const filterOptions = {
  targets: [
    { value: "self", label: "自分" },
    { value: "ally", label: "味方" },
    { value: "enemy", label: "敵" },
    { value: "all", label: "全体" }
  ],
  targetCounts: [
    { value: "single", label: "単体" },
    { value: "multi", label: "複数" }
  ],
  effects: [
    { value: "attack", label: "攻撃" },
    { value: "heal", label: "回復" },
    { value: "buff", label: "強化" },
    { value: "debuff", label: "弱化" },
    { value: "move", label: "移動" }
  ]
};

function createFilterCheckboxGroup(titleText, stateKey, options, matchModeKey = null) {
  const group = document.createElement("div");
  group.className = "skillGuideFilterGroup";

  const header = document.createElement("div");
  header.className = "skillGuideFilterHeader";

  const title = document.createElement("div");
  title.className = "skillGuideFilterTitle";
  title.textContent = titleText;

  header.appendChild(title);

  if (matchModeKey) {
    const modeButton = document.createElement("button");
    modeButton.type = "button";
    modeButton.className = "skillGuideMatchModeButton";
    modeButton.textContent =
      filterState[matchModeKey] === "all"
        ? "すべてを含む"
        : "どれかを含む";

    modeButton.addEventListener("click", () => {
      filterState[matchModeKey] =
        filterState[matchModeKey] === "all"
          ? "any"
          : "all";

      modeButton.textContent =
        filterState[matchModeKey] === "all"
          ? "すべてを含む"
          : "どれかを含む";

      renderSkillGuideItems();
    });

    header.appendChild(modeButton);
  }

  group.appendChild(header);

  const items = document.createElement("div");
  items.className = "skillGuideFilterItems";

  options.forEach(option => {
    const label = document.createElement("label");
    label.className = "skillGuideFilterLabel";

    const input = document.createElement("input");
    input.type = "checkbox";
    input.value = option.value;

    input.addEventListener("change", () => {
      filterState[stateKey] =
        [...items.querySelectorAll("input:checked")]
          .map(checkedInput => checkedInput.value);

      renderSkillGuideItems();
    });

    const text = document.createElement("span");
    text.textContent = option.label;

    label.appendChild(input);
    label.appendChild(text);
    items.appendChild(label);
  });

  group.appendChild(items);

  return group;
}

function createSkillGuideControls() {
  const controls = document.createElement("div");
  controls.id = "skillGuideControls";
  controls.className = "skillGuideControls";

  const ctGroup = document.createElement("div");
  ctGroup.className = "skillGuideFilterGroup";

  const ctTitle = document.createElement("div");
  ctTitle.className = "skillGuideFilterTitle";
  ctTitle.textContent = "CT";

  const ctItems = document.createElement("div");
  ctItems.className = "skillGuideFilterItems";

  [
    { value: "asc", label: "昇順" },
    { value: "desc", label: "降順" }
  ].forEach(option => {
    const label = document.createElement("label");
    label.className = "skillGuideFilterLabel";

    const input = document.createElement("input");
    input.type = "radio";
    input.name = "skillGuideCtSort";
    input.value = option.value;

    input.addEventListener("change", () => {
      filterState.ctSort = input.checked ? input.value : "";
      renderSkillGuideItems();
    });

    const text = document.createElement("span");
    text.textContent = option.label;

    label.appendChild(input);
    label.appendChild(text);
    ctItems.appendChild(label);
  });

  ctGroup.appendChild(ctTitle);
  ctGroup.appendChild(ctItems);

  controls.appendChild(ctGroup);
controls.appendChild(
  createFilterCheckboxGroup(
    "対象",
    "targets",
    filterOptions.targets,
    "targetMatchMode"
  )
);
controls.appendChild(
  createFilterCheckboxGroup(
    "単複",
    "targetCounts",
    filterOptions.targetCounts
  )
);
controls.appendChild(
  createFilterCheckboxGroup(
    "効果",
    "effects",
    filterOptions.effects,
    "effectMatchMode"
  )
);

  const resetButton = document.createElement("button");
  resetButton.type = "button";
  resetButton.className = "skillGuideResetButton";
  resetButton.textContent = "リセット";

resetButton.addEventListener("click", () => {
  filterState.ctSort = "";
  filterState.targetMatchMode = "any";
  filterState.effectMatchMode = "any";
  filterState.targets = [];
  filterState.targetCounts = [];
  filterState.effects = [];

  controls
    .querySelectorAll("input")
    .forEach(input => {
      input.checked = false;
    });

  controls
    .querySelectorAll(".skillGuideMatchModeButton")
    .forEach(button => {
      button.textContent = "どれかを含む";
    });

  renderSkillGuideItems();
});

  controls.appendChild(resetButton);

  return controls;
}

function createSkillGuideItem(skillId, skill, unlocked) {
  const item = document.createElement("div");
  item.className = "skillGuideItem";

  const title = document.createElement("div");
  title.className = "skillGuideTitle";

  if (skill.icon) {
    const icon = document.createElement("img");
    icon.className = "skillGuideIcon";
    icon.src = skill.icon;
    icon.alt = skill.name || skillId;
    title.appendChild(icon);
  }

  const name = document.createElement("span");
  name.textContent = skill.name || skillId;
  title.appendChild(name);

  const cooldown = document.createElement("div");
  cooldown.className = "skillGuideCooldown";
  cooldown.textContent = `CT: ${skill.cooldown ?? 0}`;

  const summary = document.createElement("div");
  summary.className = "skillGuideSummary";
  summary.textContent =
    skill.summary || skill.description || "説明未設定";

  const unlock = document.createElement("div");
  unlock.className = "skillGuideUnlock";
  unlock.textContent =
    `解放条件：${formatUnlockText(skill.unlock)}`;

  item.appendChild(title);
  item.appendChild(cooldown);
  item.appendChild(summary);
  item.appendChild(unlock);

  if (!unlocked) {
    item.classList.add("is-locked");
  }

  return item;
}

function matchesValues(values, selectedValues, matchMode = "any") {
  if (selectedValues.length === 0) return true;
  if (!Array.isArray(values)) return false;

  if (matchMode === "all") {
    return selectedValues.every(value =>
      values.includes(value)
    );
  }

  return selectedValues.some(value =>
    values.includes(value)
  );
}

function matchesSkillFilter(skill) {
  const meta = skill.meta || {};

  if (
    !matchesValues(
      meta.targets,
      filterState.targets,
      filterState.targetMatchMode
    )
  ) {
    return false;
  }

  if (
    filterState.targetCounts.length > 0 &&
    !filterState.targetCounts.includes(meta.targetCount)
  ) {
    return false;
  }

  if (
    !matchesValues(
      meta.effects,
      filterState.effects,
      filterState.effectMatchMode
    )
  ) {
    return false;
  }

  return true;
}

function getFilteredSkillEntries() {
  const stats = getCurrentStats();

  let entries =
    Object.entries(skillHandlers)
      .filter(([, skill]) =>
        isSkillUnlocked(skill, stats)
      )
      .filter(([, skill]) =>
        matchesSkillFilter(skill)
      );

  if (filterState.ctSort === "asc") {
    entries = entries.sort((a, b) =>
      (a[1].cooldown ?? 0) - (b[1].cooldown ?? 0)
    );
  }

  if (filterState.ctSort === "desc") {
    entries = entries.sort((a, b) =>
      (b[1].cooldown ?? 0) - (a[1].cooldown ?? 0)
    );
  }

  return entries;
}

function renderSkillGuideItems() {
  const list = document.getElementById("skillGuideList");
  if (!list) return;

  const stats = getCurrentStats();

  list.innerHTML = "";

  const entries = getFilteredSkillEntries();

  if (entries.length === 0) {
    const empty = document.createElement("div");
    empty.className = "skillGuideEmpty";
    empty.textContent = "条件に合うスキルがありません";
    list.appendChild(empty);
    return;
  }

  entries.forEach(([skillId, skill]) => {
    const unlocked = isSkillUnlocked(skill, stats);
    list.appendChild(createSkillGuideItem(skillId, skill, unlocked));
  });
}

function renderSkillGuide() {
  const container = document.getElementById("skillGuide");
  if (!container) return;

  container.innerHTML = "";

  const controls = createSkillGuideControls();

  const list = document.createElement("div");
  list.id = "skillGuideList";
  list.className = "skillGuideList";

  container.appendChild(controls);
  container.appendChild(list);

  renderSkillGuideItems();
}

renderSkillGuide();
