import { skillHandlers } from "./skills.js";

function formatUnlock(unlock) {
  if (!unlock || typeof unlock !== "object") {
    return "なし";
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

  return parts.length > 0 ? parts.join(" / ") : "なし";
}

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

function createSkillGuideItem(skillId, skill) {
  const item = document.createElement("div");
  item.className = "skillGuideItem";

  const title = document.createElement("div");
  title.className = "skillGuideTitle";
  title.textContent = `${skill.name || skillId}`;

  const idRow = createRow("ID", skillId);
  const cooldownRow = createRow("CT", String(skill.cooldown ?? 0));
  const rangeRow = createRow("範囲", skill.rangeText || "未設定");
  const descRow = createRow("説明", skill.description || "未設定");
  const unlockRow = createRow("解放条件", formatUnlock(skill.unlock));

  item.appendChild(title);
  item.appendChild(idRow);
  item.appendChild(cooldownRow);
  item.appendChild(rangeRow);
  item.appendChild(descRow);
  item.appendChild(unlockRow);

  return item;
}

function renderSkillGuide() {
  const container = document.getElementById("skillGuide");
  if (!container) return;

  container.innerHTML = "";

  const entries = Object.entries(skillHandlers);

  entries.forEach(([skillId, skill]) => {
    container.appendChild(createSkillGuideItem(skillId, skill));
  });
}

renderSkillGuide();
