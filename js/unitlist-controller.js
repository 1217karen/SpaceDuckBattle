//unitlist-controller.js

export function initUnitList(options) {
  const {
    unitListDiv,
    entries
  } = options;

  function renderUnitList() {
    unitListDiv.innerHTML = "";

    if (!Array.isArray(entries) || entries.length === 0) {
      const empty = document.createElement("div");
      empty.className = "unitlist-empty";
      empty.textContent = "公開ユニットはありません";
      unitListDiv.appendChild(empty);
      return;
    }

    entries.forEach((entry) => {
      const row = document.createElement("div");
      row.className = "eno-unit-row";

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
        right.appendChild(item);
      });

      row.appendChild(left);
      row.appendChild(right);
      unitListDiv.appendChild(row);
    });
  }

  return {
    renderUnitList
  };
}
