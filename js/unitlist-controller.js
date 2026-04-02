//unitlist-controller.js

export function initUnitList(options) {
  const {
    unitListDiv,
    units,
    partySlots,
    placedSlots,
    renderParty,
    clearPlacedSlot
  } = options;

  function renderUnitList() {
    unitListDiv.innerHTML = "";

    units.forEach((unitData, i) => {
      if (i === 0) return;

      const item = document.createElement("div");
      item.className = "duck-item";

      if (partySlots.includes(i)) {
        item.classList.add("selected");
      }

      const img = document.createElement("img");
      img.src = unitData.icon?.default || "";

      const name = document.createElement("span");
      name.textContent = unitData.name;

      item.appendChild(img);
      item.appendChild(name);

      item.addEventListener("click", () => {
        const existingSlot = partySlots.indexOf(i);

        /* すでにPTにいる → 解除 */
        if (existingSlot !== -1) {
          if (existingSlot === 0) return;

          if (placedSlots[existingSlot]) {
            clearPlacedSlot(existingSlot);
          }

          partySlots[existingSlot] = null;
          renderParty();
          renderUnitList();
          return;
        }

        /* 空きスロットを探す */
        for (let s = 1; s < 4; s++) {
          if (partySlots[s] === null) {
            partySlots[s] = i;
            renderParty();
            renderUnitList();
            break;
          }
        }
      });

      unitListDiv.appendChild(item);
    });
  }

  return {
    renderUnitList
  };
}
