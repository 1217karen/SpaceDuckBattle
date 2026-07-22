// skill-pattern-panel.js

import { skillHandlers } from "../data/skills.js";

const DEFAULT_PATTERN_COUNT = 3;

function normalizePatterns(patterns, patternCount = DEFAULT_PATTERN_COUNT) {
  const source = Array.isArray(patterns) ? patterns : [];

  return Array.from({ length: patternCount }, (_, index) =>
    source[index] || null
  );
}

function isPatternPublic(pattern) {
  return pattern?.public === true;
}

function getPatternButtonLabel(pattern, index, showPatternName) {
  const baseLabel = `設定${index + 1}`;
  const patternName = String(pattern?.name ?? "").trim();

  if (!showPatternName || !patternName) {
    return baseLabel;
  }

  return `${baseLabel}：${patternName}`;
}

function getSkillDisplayData(skill) {
  const skillType = String(skill?.type ?? "").trim();

  if (!skillType) {
    return null;
  }

  const handler = skillHandlers[skillType];

  return {
    skill,
    type: skillType,
    name: handler?.name || skillType,
    icon: handler?.icon || "",
    cooldown: handler?.cooldown ?? 0,
    summary:
      handler?.summary ||
      handler?.description ||
      "スキル説明が未設定です。"
  };
}

function getPatternSkillItems(pattern) {
  const skills = Array.isArray(pattern?.skills)
    ? pattern.skills
    : [];

  return skills
    .map(getSkillDisplayData)
    .filter(Boolean);
}

function createEmptyText(text, className) {
  const empty = document.createElement("p");
  empty.className = className;
  empty.textContent = text;

  return empty;
}

export function createSkillPatternPanel(options = {}) {
  const {
    patterns,
    patternCount = DEFAULT_PATTERN_COUNT,
    selectedPatternIndex = null,
    showPatternNameInButton = false,
    disablePrivatePatterns = false,
    showDetailsWhenClosed = false,
    toggleOnSamePatternClick = false,
    showSlot = true,
    showIcon = true,
    showCooldown = true,
    showSummary = true,
    skillButton = false,
    onPatternClick,
    onSkillClick,
    emptySkillText = "スキルは設定されていません",
    noSelectedPatternText = "公開されている設定がありません",
    rootClassName = "",
    buttonListClassName = "",
    detailClassName = ""
  } = options;

  const normalizedPatterns = normalizePatterns(patterns, patternCount);
  let currentSelectedIndex =
    typeof selectedPatternIndex === "number"
      ? selectedPatternIndex
      : null;

  const root = document.createElement("div");
  root.className = ["skillPatternPanel", rootClassName]
    .filter(Boolean)
    .join(" ");

  const buttonList = document.createElement("div");
  buttonList.className = ["skillPatternButtonList", buttonListClassName]
    .filter(Boolean)
    .join(" ");

  const detail = document.createElement("div");
  detail.className = ["skillPatternDetail", detailClassName]
    .filter(Boolean)
    .join(" ");

  function renderButtons() {
    buttonList.innerHTML = "";

    normalizedPatterns.forEach((pattern, index) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "skillPatternButton button-pill";
      button.textContent = getPatternButtonLabel(
        pattern,
        index,
        showPatternNameInButton
      );

      const isDisabled =
        disablePrivatePatterns && !isPatternPublic(pattern);
      const isActive = currentSelectedIndex === index;

      button.classList.toggle("is-active", isActive);
      button.classList.toggle("is-disabled", isDisabled);
      button.disabled = isDisabled;

      button.addEventListener("click", (event) => {
        event.stopPropagation();

        if (isDisabled) {
          return;
        }

        const nextSelectedIndex =
          toggleOnSamePatternClick && currentSelectedIndex === index
            ? null
            : index;

        if (typeof onPatternClick === "function") {
          onPatternClick({
            index,
            pattern,
            currentSelectedIndex,
            nextSelectedIndex
          });
          return;
        }

        currentSelectedIndex = nextSelectedIndex;
        render();
      });

      buttonList.appendChild(button);
    });
  }

  function renderSkillRow(skillItem, index) {
    const item = document.createElement("li");
    item.className = "skillPatternSkillItem";

    if (showSlot) {
      const slotLabel = document.createElement("span");
      slotLabel.className = "skillPatternSkillSlot";
      slotLabel.textContent = `SLOT ${index + 1}`;
      item.appendChild(slotLabel);
    }

    if (showIcon && skillItem.icon) {
      const img = document.createElement("img");
      img.className = "skillPatternSkillIcon";
      img.src = skillItem.icon;
      img.alt = "";
      item.appendChild(img);
    }

    const text = document.createElement("div");
    text.className = "skillPatternSkillText";

    const nameElement = skillButton
      ? document.createElement("button")
      : document.createElement("div");

    nameElement.className = skillButton
      ? "skillPatternSkillName skillPatternSkillButton button-plain"
      : "skillPatternSkillName";

    if (skillButton) {
      nameElement.type = "button";
      nameElement.addEventListener("click", (event) => {
        event.stopPropagation();

        if (typeof onSkillClick === "function") {
          onSkillClick(skillItem.skill, nameElement);
        }
      });
    }

    nameElement.textContent = skillItem.name;
    text.appendChild(nameElement);

    if (showCooldown || showSummary) {
      const meta = document.createElement("div");
      meta.className = "skillPatternSkillMeta";

      const metaTexts = [];

      if (showCooldown) {
        metaTexts.push(`CT: ${skillItem.cooldown}`);
      }

      if (showSummary) {
        metaTexts.push(skillItem.summary);
      }

      meta.textContent = metaTexts.join("　");
      text.appendChild(meta);
    }

    item.appendChild(text);

    return item;
  }

  function renderDetail() {
    detail.innerHTML = "";

    if (currentSelectedIndex === null && !showDetailsWhenClosed) {
      return;
    }

    const selectedPattern =
      currentSelectedIndex !== null
        ? normalizedPatterns[currentSelectedIndex]
        : null;

    if (!selectedPattern) {
      detail.appendChild(
        createEmptyText(
          noSelectedPatternText,
          "skillPatternEmpty commonEmptyText"
        )
      );
      return;
    }

    const skillItems = getPatternSkillItems(selectedPattern);

    if (skillItems.length === 0) {
      detail.appendChild(
        createEmptyText(
          emptySkillText,
          "skillPatternEmpty commonEmptyText"
        )
      );
      return;
    }

    const list = document.createElement("ul");
    list.className = "skillPatternSkillList";

    skillItems.forEach((skillItem, index) => {
      list.appendChild(renderSkillRow(skillItem, index));
    });

    detail.appendChild(list);
  }

  function render() {
    renderButtons();
    renderDetail();
  }

  render();

  root.appendChild(buttonList);
  root.appendChild(detail);

  return root;
}

export function getFirstPublicPatternIndex(patterns, patternCount = DEFAULT_PATTERN_COUNT) {
  const normalizedPatterns = normalizePatterns(patterns, patternCount);
  const index = normalizedPatterns.findIndex(isPatternPublic);

  return index >= 0 ? index : null;
}
