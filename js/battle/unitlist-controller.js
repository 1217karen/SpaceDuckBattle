//unitlist-controller.js

export function initUnitList(options) {
  const {
    unitListDiv,
    entries,
    sections,
    onPatternConfirm
  } = options;

  let selectedEno = null;
  let selectedUnitNo = null;
  let selectedPatternIndex = null;

  function isSelected(eno, unitNo, patternIndex) {
    return selectedEno === eno &&
      selectedUnitNo === unitNo &&
      selectedPatternIndex === patternIndex;
  }

  function renderUnitList() {
    unitListDiv.innerHTML = "";

    const unitSections = Array.isArray(sections)
      ? sections
      : [{
          title: "",
          entries: Array.isArray(entries) ? entries : []
        }];

    const hasEntries = unitSections.some(section =>
      Array.isArray(section?.entries) && section.entries.length > 0
    );

    if (!hasEntries) {
      const empty = document.createElement("div");
      empty.className = "unitlist-empty";
      empty.textContent = "公開ユニットはありません";
      unitListDiv.appendChild(empty);
      return;
    }

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
        const unitNo = entry.unitNo ?? 1;
        const row = document.createElement("div");
        row.className = "eno-unit-row";

        if (entry.isFavoriteUnit) {
          row.classList.add("is-favorite-unit");
        }

        const left = document.createElement("div");
        left.className = "eno-character-area";

        const charImg = document.createElement("img");
        charImg.className = "eno-character-icon";
        charImg.src = entry.characterData?.defaultIcon || "";
        charImg.alt = `Eno.${entry.eno}`;

        const charName = document.createElement("div");
        charName.className = "eno-character-name";
        charName.textContent =
          entry.characterData?.defaultName ||
          entry.characterData?.fullName ||
          `Eno.${entry.eno}`;

        left.appendChild(charImg);
        left.appendChild(charName);

        const right = document.createElement("div");
        right.className = "eno-pattern-list";

        entry.publicPatterns.forEach((patternEntry) => {
          const item = document.createElement("div");
          item.className = "eno-pattern-item";

          if (isSelected(entry.eno, unitNo, patternEntry.patternIndex)) {
            item.classList.add("selected");
          }

          const unitImg = document.createElement("img");
          unitImg.className = "eno-pattern-icon";
          unitImg.src = entry.unitData?.icon?.default || "";
          unitImg.alt = entry.unitData?.name || "unit";

          const label = document.createElement("div");
          label.className = "eno-pattern-name";
          label.textContent =
            patternEntry.pattern?.name?.trim() ||
            `パターン${patternEntry.patternIndex + 1}`;

          item.appendChild(unitImg);
          item.appendChild(label);

          item.addEventListener("click", () => {
            const alreadySelected =
              isSelected(entry.eno, unitNo, patternEntry.patternIndex);

            if (!alreadySelected) {
              selectedEno = entry.eno;
              selectedUnitNo = unitNo;
              selectedPatternIndex = patternEntry.patternIndex;
              renderUnitList();
              return;
            }

            if (typeof onPatternConfirm === "function") {
              onPatternConfirm({
                eno: entry.eno,
                unitNo: entry.unitNo ?? 1,
                characterData: entry.characterData,
                unitData: entry.unitData,
                patternIndex: patternEntry.patternIndex,
                pattern: patternEntry.pattern
              });
            }

            selectedEno = null;
            selectedUnitNo = null;
            selectedPatternIndex = null;
            renderUnitList();
          });

          right.appendChild(item);
        });

        row.appendChild(left);
        row.appendChild(right);
        sectionEl.appendChild(row);
      });

      unitListDiv.appendChild(sectionEl);
    });
  }

  return {
    renderUnitList
  };
}
