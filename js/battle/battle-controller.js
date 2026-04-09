//battle-controller.js

import { simulateBattle } from "./new-battle-engine.js";
import { STAGES } from "../data/stages.js";
import { buildBattleUnit } from "./unit-builder.js";
import { NPCS } from "../data/battle-npcs.js";
import { requireLogin, getCurrentAccount, loadCharacter, loadUnit } from "../services/storage-service.js";
import { initUnitList } from "./unitlist-controller.js";
import { loadPublicBattleEntries } from "./public-unit-source.js";

requireLogin();

const units = structuredClone([
  NPCS.npcHealer.unitData,
  NPCS.npcAttacker.unitData,
  NPCS.npcSupporter.unitData
]);

const currentAccount = getCurrentAccount();
const currentEno = currentAccount?.eno ?? null;

const playerUnit =
  currentEno ? loadUnit(currentEno, 1) : null;

if (playerUnit) {
  units[0] = {
    ...units[0],
    ...playerUnit
  };
}

const playerCharacter =
  currentEno ? loadCharacter(currentEno) : null;

const unitListDiv = document.getElementById("unitList");
const boardDiv = document.getElementById("board");
const ptSlots = document.querySelectorAll(".pt-slot");
const startBtn = document.getElementById("startBtn");
const stageSelect = document.getElementById("stageSelect");

const selfPattern =
  Array.isArray(units[0].patterns) && units[0].patterns[0]
    ? units[0].patterns[0]
    : { skills: [] };

const selfPartyEntry = {
  eno: currentEno,
  characterData: playerCharacter,
  unitData: units[0],
  patternIndex: 0,
  pattern: selfPattern
};

const partySlots = [selfPartyEntry, null, null, null];
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

function clearPlacedSlot(slotIndex) {
  if (!placedSlots[slotIndex]) return;

  const p = placedSlots[slotIndex];
  const prevCell = document.querySelector(`.cell[data-x="${p.x}"][data-y="${p.y}"]`);
  if (prevCell) prevCell.innerHTML = "";

  delete placedSlots[slotIndex];
}

function renderParty() {
  ptSlots.forEach((slot, i) => {
    slot.innerHTML = "";

    const slotEntry = partySlots[i];
    if (slotEntry === null) return;

    const unitData = slotEntry.unitData;
    if (!unitData) return;

    const img = document.createElement("img");
    img.src = unitData.icon?.default || "";
    img.style.width = "64px";
    img.style.height = "64px";

    slot.appendChild(img);
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

        const slotEntry = partySlots[selectedSlot];
        const unitData = slotEntry?.unitData;
        if (!unitData) return;

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
        img.src = unitData.icon?.default || "";
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

const publicUnitEntries = loadPublicBattleEntries()
  .filter((entry) => entry.eno !== currentEno);

const unitListController = initUnitList({
  unitListDiv,
  entries: publicUnitEntries,
  onPatternConfirm: (selectedEntry) => {
    const alreadyInParty = partySlots.some((slotEntry) => {
      return (
        slotEntry &&
        slotEntry.eno === selectedEntry.eno &&
        slotEntry.patternIndex === selectedEntry.patternIndex
      );
    });

    if (alreadyInParty) {
      return;
    }

    for (let s = 1; s < 4; s++) {
      if (partySlots[s] === null) {
        partySlots[s] = selectedEntry;
        renderParty();
        return;
      }
    }
  }
});

const renderUnitList = unitListController.renderUnitList;

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

    const account = getCurrentAccount();

  if (!account?.eno) {
    alert("ログイン中のアカウント情報を確認できません");
    return;
  }
  
  /* 未配置PTチェック */
  for (let slot = 0; slot < 4; slot++) {
    const unitIndex = partySlots[slot];
    if (unitIndex === null) continue;

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
    units: []
  };

  (stage.npcs || []).forEach((entry, index) => {
    const pattern =
      entry.unitData?.patterns?.[0] || { skills: [] };

    const unit = buildBattleUnit(
      entry.unitData,
      entry.characterData,
      pattern,
      entry.team,
      entry.x,
      entry.y,
      entry.facing,
      1000 + index,
      entry.id
    );

    snapshot.units.push(unit);
  });

  (stage.enemies || []).forEach((entry, index) => {
    const pattern =
      entry.unitData?.patterns?.[0] || { skills: [] };

    const unit = buildBattleUnit(
      entry.unitData,
      entry.characterData,
      pattern,
      entry.team,
      entry.x,
      entry.y,
      entry.facing,
      2000 + index,
      entry.id
    );

    snapshot.units.push(unit);
  });

  /* プレイヤーユニット追加 */
  for (let slot = 0; slot < 4; slot++) {
    const slotEntry = partySlots[slot];
    if (slotEntry === null) continue;

    const placement = placedSlots[slot];
    if (!placement) continue;

    const unitData = slotEntry.unitData;
    const characterData = slotEntry.characterData;
    const pattern = slotEntry.pattern;

    if (!unitData || !pattern) {
      alert("ユニットの戦闘設定が保存されていません");
      return;
    }

    const unit = buildBattleUnit(
      unitData,
      characterData,
      pattern,
      1,
      placement.x,
      placement.y,
      "E",
      slot
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
    .filter((slotEntry) => slotEntry !== null)
    .map((slotEntry) => slotEntry.unitData);

  const party = {
    leaderName: partyMembers[0]?.name || "",
    memberNames: partyMembers.map((unit) => unit.name),
    memberIcons: partyMembers.map((unit) => unit.icon?.default || "")
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
renderUnitList();
