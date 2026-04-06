//setting-skill-guide.js


import { skillHandlers } from "./skills.js";
import {
  getCurrentStats,
  isSkillUnlocked,
  formatUnlockText
} from "./skill-unlock.js";

function createRow(labelText, valueText) {
  const row = document.createElement("div");
  row.className = "skillGuideRow";

  const label = document.createElement("span");
  label.className = "skillGuideLabel";
  label.textContent = labelText;

  const value = document.createElement("span");
  value.className = "skillGuideValue";
  value.textContent = valueText;

  row.appendChild(label);
  row.appendChild(value);

  return row;
}

function createSkillGuideItem(skillId, skill, unlocked) {
  const item = document.createElement("div");
  item.className = "skillGuideItem";

  const title = document.createElement("div");
  title.className = "skillGuideTitle";
  title.textContent = `${skill.name || skillId}`;

  const cooldownRow = createRow("CT", String(skill.cooldown ?? 0));
  const rangeRow = createRow("範囲", skill.rangeText || "未設定");
  const descRow = createRow("説明", skill.description || "未設定");
  const unlockRow = createRow(
    "解放条件",
    formatUnlockText(skill.unlock)
  );

  item.appendChild(title);
  item.appendChild(statusRow);
  item.appendChild(cooldownRow);
  item.appendChild(rangeRow);
  item.appendChild(descRow);
  item.appendChild(unlockRow);

  if (!unlocked) {
    item.classList.add("is-locked");
  }

  return item;
}

function renderSkillGuide() {
  const container = document.getElementById("skillGuide");
  if (!container) return;

  const stats = getCurrentStats();

  container.innerHTML = "";

  const entries = Object.entries(skillHandlers);

  entries.forEach(([skillId, skill]) => {
    const unlocked = isSkillUnlocked(skill, stats);

    if (!unlocked) {
      return;
    }

    container.appendChild(createSkillGuideItem(skillId, skill, true));
  });
}

function bindSkillGuideEvents() {
  const statIds = [
    "statAT",
    "statDF",
    "statHEAL",
    "statSPEED",
    "statCRI",
    "statTEC"
  ];

  statIds.forEach(id => {
    const input = document.getElementById(id);
    if (!input) return;

    input.addEventListener("input", renderSkillGuide);
  });
}

bindSkillGuideEvents();
renderSkillGuide();
