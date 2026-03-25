//battle-controller.js

import { simulateBattle } from "./new-battle-engine.js";
import { STAGES } from "./stages.js";
import { buildUnitFromDuck } from "./unit-builder.js";
import { testDucks } from "./battle-test-ducks.js";

const ducks = structuredClone(testDucks);

/* settingで作成した自分アヒルを読み込む */
const savedDuck = localStorage.getItem("duck");
if (savedDuck) {
  const playerDuck = JSON.parse(savedDuck);
  ducks[0] = playerDuck;
}

const duckListDiv = document.getElementById("duckList");
const boardDiv = document.getElementById("board");
const ptSlots = document.querySelectorAll(".pt-slot");
const startBtn = document.getElementById("startBtn");
const stageSelect = document.getElementById("stageSelect");

const partySlots = [0, null, null, null];
const placedSlots = {};

let selectedSlot = null;
let selectedCell = null;

function renderParty() {
  ptSlots.forEach((slot, i) => {
    slot.innerHTML = "";

    const duckIndex = partySlots[i];
    if (duckIndex === null) return;

    const duck = ducks[duckIndex];

    const img = document.createElement("img");
    img.src = duck.icon?.default || "";
    img.style.width = "64px";
    img.style.height = "64px";

    slot.appendChild(img);
  });
}

function renderDuckList() {
  duckListDiv.innerHTML = "";

  ducks.forEach((duck, i) => {
    if (i === 0) return;

    const item = document.createElement("div");
    item.className = "duck-item";

    if (partySlots.includes(i)) {
      item.classList.add("selected");
    }

    const img = document.createElement("img");
    img.src = duck.icon?.default || "";

    const name = document.createElement("span");
    name.textContent = duck.name;

    item.appendChild(img);
    item.appendChild(name);

    item.addEventListener("click", () => {
      const existingSlot = partySlots.indexOf(i);

      /* すでにPTにいる → 解除 */
      if (existingSlot !== -1) {
        if (existingSlot === 0) return;

        /* 盤面配置を削除 */
        if (placedSlots[existingSlot]) {
          const p = placedSlots[existingSlot];
          const prevCell = document.querySelector(`.cell[data-x="${p.x}"][data-y="${p.y}"]`);
          if (prevCell) prevCell.innerHTML = "";

          delete placedSlots[existingSlot];
        }

        partySlots[existingSlot] = null;
        renderParty();
        renderDuckList();
        return;
      }

      /* 空きスロットを探す */
      for (let s = 1; s < 4; s++) {
        if (partySlots[s] === null) {
          partySlots[s] = i;
          renderParty();
          renderDuckList();
          break;
        }
      }
    });

    duckListDiv.appendChild(item);
  });
}

function createBoard(width, height) {
  boardDiv.innerHTML = "";
  boardDiv.style.gridTemplateColumns = `repeat(${width}, 50px)`;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const cell = document.createElement("div");
      cell.className = "cell";

      cell.dataset.x = x;
      cell.dataset.y = y;

      cell.addEventListener("click", () => {
        if (selectedSlot === null) return;

        const duckIndex = partySlots[selectedSlot];
        const duck = ducks[duckIndex];
        if (!duck) return;

        /* ① 同じPTがすでに配置されていたら消す */
        if (placedSlots[selectedSlot]) {
          const prev = placedSlots[selectedSlot];
          const prevCell = document.querySelector(`.cell[data-x="${prev.x}"][data-y="${prev.y}"]`);
          if (prevCell) prevCell.innerHTML = "";
        }

        /* ② このセルに別PTがいたら消す */
        Object.keys(placedSlots).forEach((slot) => {
          const p = placedSlots[slot];

          if (p.x == x && p.y == y) {
            const prevCell = document.querySelector(`.cell[data-x="${p.x}"][data-y="${p.y}"]`);
            if (prevCell) prevCell.innerHTML = "";

            delete placedSlots[slot];
          }
        });

        /* ③ 新しく配置 */
        cell.innerHTML = "";

        const img = document.createElement("img");
        img.src = duck.icon?.default || "";
        img.style.width = "40px";
        img.style.height = "40px";

        cell.appendChild(img);

        placedSlots[selectedSlot] = { x, y };

        /* ④ 選択解除 */
        selectedSlot = null;
        ptSlots.forEach((s) => s.classList.remove("selected"));
      });

      boardDiv.appendChild(cell);
    }
  }
}

function resetPlacement() {
  selectedCell = null;
}

ptSlots.forEach((slot) => {
  slot.addEventListener("click", () => {
    const slotIndex = parseInt(slot.dataset.slot, 10);

    /* アヒルがいないスロットは選択不可 */
    if (partySlots[slotIndex] === null) return;

    ptSlots.forEach((s) => s.classList.remove("selected"));
    slot.classList.add("selected");
    selectedSlot = slotIndex;
  });
});

startBtn.addEventListener("click", () => {
  /* 未配置PTチェック */
  for (let slot = 0; slot < 4; slot++) {
    const duckIndex = partySlots[slot];
    if (duckIndex === null) continue;

    if (!placedSlots[slot]) {
      alert("PTに編成されているアヒルがまだ配置されていません");
      return;
    }
  }

  const stageType = stageSelect.value;
  if (!stageType) return;

  const stage = STAGES[stageType];

  const snapshot = {
    board: stage.board,
    maxTurns: stage.maxTurns,
    units: [...stage.enemies]
  };

  /* プレイヤーユニット追加 */
  for (let slot = 0; slot < 4; slot++) {
    const duckIndex = partySlots[slot];
    if (duckIndex === null) continue;

    const placement = placedSlots[slot];
    if (!placement) continue;

    const duck = ducks[duckIndex];
    const pattern = duck.patterns[0];

    const unit = buildUnitFromDuck(
      duck,
      pattern,
      1,
      placement.x,
      placement.y,
      "E",
      duckIndex
    );

    snapshot.units.push(unit);
  }

  const battleResult = simulateBattle(snapshot);
  const log = battleResult.log;
  const winner = battleResult.winner;
  const battleID = "battle_" + Date.now();

  Object.keys(localStorage).forEach((k) => {
    if (k.startsWith("battle_")) {
      localStorage.removeItem(k);
    }
  });

  localStorage.setItem(
    battleID,
    JSON.stringify({
      snapshot: snapshot,
      log: log
    })
  );

  window.location.href = `battlelog.html?id=${battleID}`;
});

stageSelect.addEventListener("change", () => {
  if (!stageSelect.value) {
    boardDiv.innerHTML = "";
    resetPlacement();
    return;
  }

  const stage = STAGES[stageSelect.value];
  createBoard(stage.board.width, stage.board.height);
  resetPlacement();
});

renderParty();
renderDuckList();
