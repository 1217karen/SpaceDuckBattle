// new-battlelog-player.js

// =====================
// import
// =====================

import { battleState } from "./new-battlelog-state.js";
import { playLogEvent } from "./new-battlelog-ui.js";

// =====================
// 設定値
// =====================

const HEADER_DELAY = 1000;
const EVENT_DELAY = 500;
const EFFECT_DELAY = 250;
const UNIT_DELAY = 1000;

// =====================
// ユーティリティ
// =====================
function sleep(ms) {
  return new Promise(resolve =>
    setTimeout(resolve, ms / battleState.speed)
  );
}

function clearEffectHighlights() {
  document.querySelectorAll(".cell").forEach(cell => {
    cell.classList.remove(
      "attackHighlight",
      "healHighlight",
      "buffHighlight",
      "debuffHighlight"
    );
  });
}

function clearActiveUnit() {
  document.querySelectorAll(".cell").forEach(cell => {
    cell.classList.remove("activeUnit");
  });
}

function scrollLogToBottom() {
  battleState.logArea.scrollTop =
    battleState.logArea.scrollHeight;
}

// =====================
// メイン再生
// =====================
export async function playNextAction() {
  
  battleState.nextBtn.disabled = true;

  document.querySelectorAll(".cell").forEach(cell => {
    cell.classList.remove(
      "attackRange",
      "healRange",
      "buffRange",
      "debuffRange"
    );
  });

  if (battleState.logIndex >= battleState.battleLog.length) {
    battleState.nextBtn.disabled = false;
    return;
  }

  // ======================
  // actionStart 探索
  // ======================

  let start = battleState.logIndex;

  while (
    start < battleState.battleLog.length &&
    battleState.battleLog[start].type !== "actionStart"
  ) {
    start++;
  }

  if (start >= battleState.battleLog.length) {
    battleState.logIndex = battleState.battleLog.length;
    battleState.nextBtn.disabled = false;
    return;
  }

  // ======================
  // actionEnd 探索
  // ======================

  let end = start + 1;

  while (
    end < battleState.battleLog.length &&
    battleState.battleLog[end].type !== "actionEnd"
  ) {
    end++;
  }

  const actionEvents =
    battleState.battleLog.slice(start + 1, end);
  
  // ======================
  // 行動ユニット
  // ======================

  const actingUnit =
    battleState.battleLog[start].unit;

  clearActiveUnit();

  const pos =
    battleState.boardState.units[actingUnit];

  if (pos) {
    const cell = document.querySelector(
      `.cell[data-x="${pos.x}"][data-y="${pos.y}"]`
    );

    if (cell) {
      cell.classList.add("activeUnit");
    }
  }

  // ======================
  // ターン表示
  // ======================

  if (battleState.uiTurn === 0) {
    battleState.uiTurn = 1;

    if (battleState.turnDisplay) {
      battleState.turnDisplay.textContent = "TURN 1";
    }

  } else if (
    [...battleState.requiredSet].every(id =>
      battleState.actedSet.has(id)
    )
  ) {
    battleState.uiTurn++;

    if (battleState.turnDisplay) {
      battleState.turnDisplay.textContent =
        `TURN ${battleState.uiTurn}`;
    }

    battleState.actedSet.clear();
  }

  // ======================
  // 行動ヘッダー
  // ======================

  const header = document.createElement("div");

  if (actingUnit === "__turn__") {

    const turnEvent =
      battleState.battleLog[start];

    const nextTurn =
      turnEvent.turn ?? "?";

    const prevTurn =
      typeof nextTurn === "number"
        ? nextTurn - 1
        : "?";

    header.textContent =
      `TURN ${prevTurn} → TURN ${nextTurn}`;

  } else {

    const displayName =
      battleState.nameMap?.[actingUnit] ||
      actingUnit;

    header.textContent =
      `▶ ${displayName} の行動`;
  }

  header.classList.add("actionHeader");

  battleState.logArea.innerHTML = "";
  battleState.logArea.appendChild(header);

  scrollLogToBottom();

  await sleep(HEADER_DELAY);

  clearActiveUnit();

  // ======================
  // イベント再生
  // ======================

  let depth = 0;

  for (let i = 0; i < actionEvents.length; i++) {
    const ev = actionEvents[i];

    if (ev.type === "__groupStart") {

      const spacer = document.createElement("div");
      spacer.style.height = "3px";

      battleState.logArea.appendChild(spacer);
      scrollLogToBottom();

      if (ev.label) {
        playLogEvent(
          ev.label,
          null,
          battleState.boardState,
          battleState.logArea,
          battleState.nameMap,
          depth
        );

        const delay =
          ev.label.type === "effectTrigger"
            ? EFFECT_DELAY
            : EVENT_DELAY;

        await sleep(delay);
      }

      depth++;
      continue;
    }

    if (ev.type === "__groupEnd") {

      depth--;

      const spacer = document.createElement("div");
      spacer.style.height = "3px";

      battleState.logArea.appendChild(spacer);

      await sleep(EFFECT_DELAY);
      continue;
    }

    if (ev.type === "battleEnd") {

      if (battleState.turnDisplay) {
        battleState.turnDisplay.textContent =
          "BATTLE FINISHED";
      }

      battleState.logArea.innerHTML = "";

      const div = document.createElement("div");
      div.classList.add("battleEndBlock");

      const text =
        ev.winner === 1
          ? "LEFT TEAM WIN"
          : ev.winner === 2
          ? "RIGHT TEAM WIN"
          : "DRAW";

      div.innerHTML = `
        <div style="font-size:20px;font-weight:bold;">
          ${text}
        </div>
      `;

      battleState.logArea.appendChild(div);

      battleState.logIndex =
        battleState.battleLog.length;

      return;
    }

    if (ev.type === "death") {
      battleState.requiredSet.delete(ev.unit);
    }

    document.querySelectorAll(".cell").forEach(cell => {
      cell.classList.remove(
        "attackRange",
        "healRange",
        "buffRange",
        "debuffRange"
      );
    });

    if (
      ev.type === "move" &&
      i + 1 < actionEvents.length &&
      actionEvents[i + 1].type === "faceChange"
    ) {

      playLogEvent(
        ev,
        actionEvents[i + 1],
        battleState.boardState,
        battleState.logArea,
        battleState.nameMap,
        depth
      );

      scrollLogToBottom();

      playLogEvent(
        actionEvents[i + 1],
        actionEvents[i + 2],
        battleState.boardState,
        battleState.logArea,
        battleState.nameMap,
        depth
      );

      i++;

    } else {

      playLogEvent(
        ev,
        actionEvents[i + 1],
        battleState.boardState,
        battleState.logArea,
        battleState.nameMap,
        depth
      );

      scrollLogToBottom();
    }

    let wait = EFFECT_DELAY;

    if (
      ev.type === "skillUse" ||
      ev.type === "move" ||
      ev.type === "wait"
    ) {
      wait = EVENT_DELAY;
    }

    if (
      ev.type !== "hpChange" &&
      ev.type !== "effectExpired"
    ) {
      await sleep(wait);
    }

    clearEffectHighlights();
  }

  battleState.actedSet.add(actingUnit);

  battleState.logIndex = end + 1;

  battleState.nextBtn.disabled = false;

  if (battleState.autoPlay) {
    setTimeout(playNextAction, UNIT_DELAY);
  }
}
