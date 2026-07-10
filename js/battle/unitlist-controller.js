// unitlist-controller.js

import { skillHandlers } from "../data/skills.js";
import { getNoImageUrl } from "../common/icon-picker.js";
import { createSkillPatternPanel, getFirstPublicPatternIndex } from "../common/skill-pattern-panel.js";

const UNIT_TYPE_LABELS = {
  attack: "アタック",
  defense: "ディフェンス",
  heal: "ヒール",
  speed: "スピード",
  technical: "テクニカル",
  support: "サポート"
};

const PATTERN_COUNT = 3;

function getUnitTypeLabel(type) {
  const key = String(type ?? "").trim();

  if (!key) {
    return "未設定";
  }

  return UNIT_TYPE_LABELS[key] || key;
}

function getUnitKey(eno, unitNo = 1) {
  return `${eno}:${unitNo}`;
}

function getUnitPatterns(entry) {
  const patterns = Array.isArray(entry?.unitData?.patterns)
    ? entry.unitData.patterns
    : [];

  return Array.from({ length: PATTERN_COUNT }, (_, index) =>
    patterns[index] || null
  );
}

export function initUnitList(options) {
  const {
    unitListDiv,
    entries,
    sections,
    onPatternConfirm
  } = options;

  let openedUnitKey = null;
  let selectedPatternIndex = null;
  let skillTooltip = null;
  let skillTooltipAnchor = null;

  unitListDiv.addEventListener("click", (event) => {
    event.stopPropagation();
  });

  function closeSkillTooltip() {
    if (!skillTooltip) {
      return;
    }

    skillTooltip.remove();
    skillTooltip = null;
    skillTooltipAnchor = null;
  }

  function getSkillTooltipData(skill) {
    const skillType = String(skill?.type ?? "").trim();

    if (!skillType) {
      return null;
    }

    const handler = skillHandlers[skillType];

    return {
      cooldown: handler?.cooldown ?? 0,
      summary:
        handler?.summary ||
        handler?.description ||
        "スキル説明が未設定です。"
    };
  }

function showSkillTooltip(skill, anchorElement) {
  if (skillTooltip && skillTooltipAnchor === anchorElement) {
    closeSkillTooltip();
    return;
  }

  const data = getSkillTooltipData(skill);

  if (!data || !anchorElement) {
    closeSkillTooltip();
    return;
  }

  closeSkillTooltip();

  const tooltip = document.createElement("div");
  tooltip.className = "unitSkillTooltip";
  tooltip.innerHTML = `
    <div class="unitSkillTooltipCooldown">CT: ${data.cooldown}</div>
    <div class="unitSkillTooltipSummary"></div>
  `;

  tooltip.querySelector(".unitSkillTooltipSummary").textContent =
    data.summary;

  document.body.appendChild(tooltip);

  const rect = anchorElement.getBoundingClientRect();
  const tooltipRect = tooltip.getBoundingClientRect();

  let left = rect.left;
  let top = rect.bottom + 8;

  const margin = 8;

  if (left + tooltipRect.width > window.innerWidth - margin) {
    left = window.innerWidth - tooltipRect.width - margin;
  }

  if (left < margin) {
    left = margin;
  }

  if (top + tooltipRect.height > window.innerHeight - margin) {
    top = rect.top - tooltipRect.height - 8;
  }

  if (top < margin) {
    top = margin;
  }

  tooltip.style.left = `${left}px`;
  tooltip.style.top = `${top}px`;

  skillTooltip = tooltip;
  skillTooltipAnchor = anchorElement;
}

  document.addEventListener("click", (event) => {
    const target = event.target;

    if (
      target instanceof Element &&
      (
        target.closest(".skillPatternSkillButton") ||
        target.closest(".unitSkillTooltip")
      )
    ) {
      return;
    }

    closeSkillTooltip();
  });

  function renderGuide() {
    const guide = document.createElement("p");
    guide.className = "unitlist-guide";
    guide.textContent =
      "選択中の設定ボタンを再クリックすると編成できます。";

    unitListDiv.appendChild(guide);
  }

  function renderPatternPanel(entry, unitNo) {
    return createSkillPatternPanel({
      patterns: getUnitPatterns(entry),
      selectedPatternIndex,
      rootClassName: "is-compact",
      showPatternNameInButton: false,
      disablePrivatePatterns: true,
      showDetailsWhenClosed: true,
      showSlot: false,
      showIcon: true,
      showCooldown: false,
      showSummary: false,
      skillButton: true,
      onSkillClick: showSkillTooltip,
      noSelectedPatternText: "公開されている設定がありません",
      onPatternClick: ({ index, pattern, currentSelectedIndex }) => {
        closeSkillTooltip();

        if (currentSelectedIndex === index) {
          if (typeof onPatternConfirm === "function") {
            onPatternConfirm({
              eno: entry.eno,
              unitNo,
              characterData: entry.characterData,
              unitData: entry.unitData,
              patternIndex: index,
              pattern
            });
          }

          openedUnitKey = null;
          selectedPatternIndex = null;
          renderUnitList();
          return;
        }

        selectedPatternIndex = index;
        renderUnitList();
      }
    });
  }

  function renderUnitCard(entry, section = {}) {
    const unitNo = entry.unitNo ?? 1;
    const unitKey = getUnitKey(entry.eno, unitNo);
    const isOpen = openedUnitKey === unitKey;

    const card = document.createElement("article");
    card.className =
      "unitCard common-card-framed common-card-rounded-lg common-card-profile";

    if (section?.isFavoriteSection || entry.isFavoriteUnit) {
      card.classList.add("is-favorite-unit");
    }

    if (isOpen) {
      card.classList.add("is-open");
    }

    const summary = document.createElement("button");
    summary.type = "button";
    summary.className = "unitCardSummary button-plain";

    const icon = document.createElement("img");
    icon.className = "unitCardIcon";
    icon.src = entry.unitData?.icon?.default || getNoImageUrl();
    icon.alt = entry.unitData?.name || "unit";

    const textArea = document.createElement("div");
    textArea.className = "unitCardText";

    const meta = document.createElement("div");
    meta.className = "unitCardMeta";
    meta.textContent =
      `Eno.${entry.eno} / ${getUnitTypeLabel(entry.unitData?.type)}`;

    const name = document.createElement("div");
    name.className = "unitCardName";
    name.textContent =
      entry.unitData?.name?.trim() || "名称未設定";

    textArea.appendChild(meta);
    textArea.appendChild(name);

    summary.appendChild(icon);
    summary.appendChild(textArea);

    summary.addEventListener("click", (event) => {
      event.stopPropagation();
      closeSkillTooltip();

      if (isOpen) {
        openedUnitKey = null;
        selectedPatternIndex = null;
        renderUnitList();
        return;
      }

      openedUnitKey = unitKey;
      selectedPatternIndex = getFirstPublicPatternIndex(getUnitPatterns(entry));
      renderUnitList();
    });

    card.appendChild(summary);

    if (isOpen) {
      const detail = document.createElement("div");
      detail.className = "unitCardDetail";

      detail.appendChild(
        renderPatternPanel(entry, unitNo)
      );

      card.appendChild(detail);
    }

    return card;
  }

  function renderUnitList() {
    closeSkillTooltip();

    unitListDiv.innerHTML = "";

    const unitSections = Array.isArray(sections)
      ? sections
      : [{
          title: "",
          entries: Array.isArray(entries) ? entries : []
        }];

    const hasEntries = unitSections.some(section =>
      Array.isArray(section?.entries) &&
      section.entries.length > 0
    );

    if (!hasEntries) {
      const empty = document.createElement("div");
      empty.className = "unitlist-empty";
      empty.textContent = "公開ユニットはありません";

      unitListDiv.appendChild(empty);
      return;
    }

    renderGuide();

    unitSections.forEach((section) => {
      const sectionEntries = Array.isArray(section?.entries)
        ? section.entries
        : [];

      if (sectionEntries.length === 0) {
        return;
      }

      const sectionEl = document.createElement("section");
      sectionEl.className = "unitlist-section";

      if (section?.isFavoriteSection) {
        sectionEl.classList.add("unitlist-section-favorite");
      }

      if (section?.title) {
        const heading = document.createElement("h3");
        heading.className = "unitlist-section-heading";
        heading.textContent = section.title;

        sectionEl.appendChild(heading);
      }

      sectionEntries.forEach((entry) => {
        sectionEl.appendChild(
          renderUnitCard(entry, section)
        );
      });

      unitListDiv.appendChild(sectionEl);
    });
  }

  return {
    renderUnitList
  };
}
