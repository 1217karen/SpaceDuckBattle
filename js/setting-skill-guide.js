//setting-skill-guide.js

import { skillHandlers } from "./skills.js";

function formatUnlock(unlock) {
  if (!unlock || typeof unlock !== "object") {
    return "条件なし";
  }

  const parts = [];

  if (unlock.atk !== undefined) {
    parts.push(`ATK ${unlock.atk}以上`);
  }

  if (unlock.def !== undefined) {
    parts.push(`DEF ${unlock.def}以上`);
  }

  if (unlock.heal !== undefined) {
    parts.push(`HEAL ${unlock.heal}以上`);
  }

  if (unlock.speed !== undefined) {
    parts.push(`SPEED ${unlock.speed}以上`);
  }

  if (unlock.cri !== undefined) {
    parts.push(`CRI ${unlock.cri}以上`);
  }

  if (unlock.tec !== undefined) {
    parts.push(`TEC ${unlock.tec}以上`);
  }

  if (parts.length === 0) {
    return "条件なし";
  }

  return parts.join(" / ");
}

function createSkillGuideItem(skillId, skill) {
  const item = document.createElement("div");
  item.className = "skillGuideItem";

  const title = document.createElement("div");
  title.className = "skillGuideTitle";
  title.textContent = `${skill.name || skillId} [${skillId}]`;

  const description = document.createElement("div");
  description.className = "skillGuideDescription";
  description.textContent =
    skill.description || "説明文なし";

  const cooldown = document.createElement("div");
  cooldown.className = "skillGuideCooldown";
  cooldown.textContent =
    `CT: ${skill.cooldown ?? 0}`;

  const unlock = document.createElement("div");
  unlock.className = "skillGuideUnlock";
  unlock.textContent =
    `解放条件: ${formatUnlock(skill.unlock)}`;

  item.appendChild(title);
  item.appendChild(description);
  item.appendChild(cooldown);
  item.appendChild(unlock);

  return item;
}

function renderSkillGuide() {
  const container = document.getElementById("skillGuide");
  if (!container) return;

  container.innerHTML = "";

  const skillIds = Object.keys(skillHandlers);

  skillIds.forEach(skillId => {
    const skill = skillHandlers[skillId];
    container.appendChild(createSkillGuideItem(skillId, skill));
  });
}

renderSkillGuide();
