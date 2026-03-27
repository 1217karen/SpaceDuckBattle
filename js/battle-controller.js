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

function isPlaceableCell(stage, x, y) {
  const placement = stage.placement;
  if (!placement) return true;

  if (typeof placement.allyStartColumns === "number") {
    if (x >= placement.allyStartColumns) {
      return false;
    }
  }

  if (Array.isArray(placement.blockedCells)) {
    const blocked = placement.blockedCells.some((cell) => {
      return cell.x === x && cell.y === y;
    });

    if (blocked) {
      return false;
    }
  }

  return true;
}

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

function createBoard(stage) {
  const width = stage.board.width;
  const height = stage.board.height;

  boardDiv.innerHTML = "";
  boardDiv.style.gridTemplateColumns = `repeat(${width}, 50px)`;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const cell = document.createElement("div");
      cell.className = "cell";

      cell.dataset.x = x;
      cell.dataset.y = y;

      const placeable = isPlaceableCell(stage, x, y);

      if (!placeable) {
        cell.classList.add("disabled-cell");
      }

      cell.addEventListener("click", () => {
        if (!placeable) return;
        if (selectedSlot === null) return;

        const duckIndex = partySlots[selectedSlot];
        const duck = ducks[duckIndex];
        if (!duck) return;

        if (placedSlots[selectedSlot]) {
          const prev = placedSlots[selectedSlot];
          const prevCell = document.querySelector(`.cell[data-x="${prev.x}"][data-y="${prev.y}"]`);
          if (prevCell) prevCell.innerHTML = "";
        }

        Object.keys(placedSlots).forEach((slot) => {
          const p = placedSlots[slot];

          if (p.x == x && p.y == y) {
            const prevCell = document.querySelector(`.cell[data-x="${p.x}"][data-y="${p.y}"]`);
            if (prevCell) prevCell.innerHTML = "";

            delete placedSlots[slot];
          }
        });

        cell.innerHTML = "";

        const img = document.createElement("img");
        img.src = duck.icon?.default || "";
        img.style.width = "40px";
        img.style.height = "40px";

        cell.appendChild(img);

        placedSlots[selectedSlot] = { x, y };

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
  const result = winner === 1 ? "win" : "lose";

  const createdAt = Date.now();
  const randomSuffix = Math.random().toString(36).slice(2, 6).toUpperCase();
  const battleID = `battle_${createdAt}_${randomSuffix}`;

  const stageNameMap = {
    tutorial: "チュートリアル",
    normal: "通常戦",
    boss: "ボス戦"
  };

  const partyMembers = partySlots
    .filter((duckIndex) => duckIndex !== null)
    .map((duckIndex) => ducks[duckIndex]);

  const party = {
    leaderName: partyMembers[0]?.name || "",
    memberNames: partyMembers.map((duck) => duck.name),
    memberIcons: partyMembers.map((duck) => duck.icon?.default || "")
  };

  const battleRecord = {
    battleId: battleID,
    mode: "pve",
    createdAt: createdAt,
    stage: {
      id: stageType,
      name: stageNameMap[stageType] || stageType
    },
    result: result,
    party: party,
    snapshot: snapshot,
    log: log
  };

  const MAX_BATTLE_HISTORY = 50;

  const battleKeys = Object.keys(localStorage)
    .filter((key) => key.startsWith("battle_"))
    .sort((a, b) => {
      const aTime = Number(JSON.parse(localStorage.getItem(a))?.createdAt || 0);
      const bTime = Number(JSON.parse(localStorage.getItem(b))?.createdAt || 0);
      return aTime - bTime;
    });

  while (battleKeys.length >= MAX_BATTLE_HISTORY) {
    const oldestKey = battleKeys.shift();
    if (!oldestKey) break;
    localStorage.removeItem(oldestKey);
  }

  localStorage.setItem(
    battleID,
    JSON.stringify(battleRecord)
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
createBoard(stage);
resetPlacement();
});

renderParty();
renderDuckList();
