//setting-skill-guide.js

import { skillHandlers } from "../data/skills.js";
import { getCurrentStats, isSkillUnlocked, formatUnlockText } from "./skill-unlock.js";

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

renderSkillGuide();
