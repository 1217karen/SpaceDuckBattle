// new-battlelog-player.js

// =====================
// import
// =====================

import { battleState } from "./new-battlelog-state.js";
import { playLogEvent } from "./new-battlelog-ui.js";
import { applyEvent } from "./new-battlelog-state-updater.js";
import { resetCommPanel, updateCommByEvent, showUnitDefaultComm } from "./new-battlelog-comm.js";

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

function clearAllHighlights() {
  document.querySelectorAll(".cell").forEach(cell => {
    cell.classList.remove(
      "attackRange",
      "healRange",
      "buffRange",
      "debuffRange",
      "attackHighlight",
      "healHighlight",
      "buffHighlight",
      "debuffHighlight",
      "activeUnit"
    );
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

   if (battleState.isPlaying) return;
   battleState.isPlaying = true;

  battleState.nextBtn.disabled = true;
  battleState.skipBtn.disabled = true;

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

    const ev = battleState.battleLog[battleState.logIndex];

    if (ev) {

      battleState.logArea.innerHTML = "";

      playLogEvent(
        ev,
        null,
        battleState.boardState,
        battleState.logArea,
        battleState.nameMap,
        0
      );

      battleState.logIndex++;

      // 戦闘終了後は再生しない
      if (ev.type === "battleEnd") {
        battleState.nextBtn.disabled = true;
      }

    }

   battleState.nextBtn.disabled = false;
    battleState.isPlaying = false;
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

    resetCommPanel();

    if (actingUnit !== "__turn__") {
      showUnitDefaultComm(actingUnit, battleState.snapshot);
    }

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

  const headerText = document.createElement("span");
  headerText.classList.add("actionHeaderText");

  if (actingUnit === "__turn__") {

    const turnEvent =
      battleState.battleLog[start];

    const nextTurn =
      turnEvent.turn ?? "?";

    const prevTurn =
      typeof nextTurn === "number"
        ? nextTurn - 1
        : "?";

    headerText.textContent =
      `TURN ${prevTurn} → TURN ${nextTurn}`;

  } else {

    const displayName =
      battleState.nameMap?.[actingUnit] ||
      actingUnit;

    headerText.textContent =
      `▶ ${displayName} の行動`;
  }

  header.appendChild(headerText);

  header.classList.add("actionHeader");

  const unitState = battleState.boardState.units[actingUnit];

  if (unitState?.team === 1) {
    header.classList.add("team1Text");
  } else if (unitState?.team === 2) {
    header.classList.add("team2Text");
  }

  battleState.logArea.innerHTML = "";
  battleState.logArea.appendChild(header);

  scrollLogToBottom();

  await sleep(HEADER_DELAY);
  
  // ======================
  // イベント再生
  // ======================

  let depth = 0;
  let currentEffectGroup = null;

  for (let i = 0; i < actionEvents.length; i++) {
  clearAllHighlights();
  const ev = actionEvents[i];

if (ev.type === "__groupStart") {

  const isEffectGroup =
    ev.label?.type === "effectTrigger";

  if (isEffectGroup) {
    currentEffectGroup = document.createElement("div");
    currentEffectGroup.classList.add("effectGroup");
    battleState.logArea.appendChild(currentEffectGroup);
  }

  const target =
    currentEffectGroup || battleState.logArea;

  const spacer = document.createElement("div");
  spacer.style.height = "3px";
  target.appendChild(spacer);

  if (ev.label) {
    updateCommByEvent(
      ev.label,
      battleState.snapshot,
      actingUnit
    );

    playLogEvent(
      ev.label,
      null,
      battleState.boardState,
      target,
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

      const target =
        currentEffectGroup || battleState.logArea;

      const spacer = document.createElement("div");
      spacer.style.height = "3px";
      target.appendChild(spacer);

      await sleep(EFFECT_DELAY);

      // effectグループ終了時にリセット
      if (currentEffectGroup) {
        currentEffectGroup = null;
      }

      continue;}

    if (ev.type === "death") {
      battleState.requiredSet.delete(ev.unit);
    }

    updateCommByEvent(
      ev.type === "__groupStart" ? ev.label : ev,
      battleState.snapshot,
      actingUnit
    );

    if (
      ev.type === "move" &&
      i + 1 < actionEvents.length &&
      actionEvents[i + 1].type === "faceChange"
    ) {

      applyEvent(ev, battleState.boardState);
      playLogEvent(
        ev,
        actionEvents[i + 1],
        battleState.boardState,
        currentEffectGroup || battleState.logArea,
        battleState.nameMap,
        depth
      );

      scrollLogToBottom();

      applyEvent(actionEvents[i + 1], battleState.boardState);
      playLogEvent(
        actionEvents[i + 1],
        actionEvents[i + 2],
        battleState.boardState,
        currentEffectGroup || battleState.logArea,
        battleState.nameMap,
        depth
      );

      i++;

    } else {

      applyEvent(ev, battleState.boardState);
      playLogEvent(
        ev,
        actionEvents[i + 1],
        battleState.boardState,
        currentEffectGroup || battleState.logArea,
        battleState.nameMap,
        depth
      );

      scrollLogToBottom();
    }

    let wait = EFFECT_DELAY;

    if (ev.type === "skillUse") {
      wait = EVENT_DELAY;
    }

    if (
      ev.type !== "hpChange" &&
      ev.type !== "effectExpired"
    ) {
      await sleep(wait);
    }

  }

  battleState.actedSet.add(actingUnit);

  battleState.logIndex = end + 1;

  battleState.isPlaying = false;

  battleState.nextBtn.disabled = battleState.autoPlay;
  battleState.skipBtn.disabled = false;

  if (battleState.autoPlay) {
    setTimeout(playNextAction, UNIT_DELAY);
  }
}
