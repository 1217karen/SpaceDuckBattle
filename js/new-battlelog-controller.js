// new-battlelog-controller.js

// =====================
// import
// =====================

import {createBoard,placeUnit,updateFacing,removeUnit} from "./board.js";
import {playLogEvent,setSuppressBoardEffects,refreshLeftSideUI} from "./new-battlelog-ui.js";
import { playNextAction } from "./new-battlelog-player.js";
import { battleState } from "./new-battlelog-state.js";
import { createLeftSideUI } from "./new-battlelog-ui-init.js";
import {applyHpChange,applyCooldownSet,applyCooldownChange,applyEffectDecay,applyEffectExpired,applyEffectRemoved,
        applyEffectApplied,applyMove,applyDeath,applyFacing,applyEvent} from "./new-battlelog-state-updater.js";
import { resetCommPanel } from "./new-battlelog-comm.js";




// =====================
// DOM取得
// =====================

const turnDisplay = document.getElementById("turnDisplay");
const logArea = document.getElementById("logArea");
const nextBtn = document.getElementById("nextBtn");
const autoBtn = document.getElementById("autoBtn");
const speedBtn = document.getElementById("speedBtn");
const skipBtn = document.getElementById("skipBtn");
const logBtn = document.getElementById("logBtn");
const backlogOverlay = document.getElementById("backlogOverlay");
const backlogClose = document.getElementById("backlogClose");
const backlogContent = document.getElementById("backlogContent");

battleState.turnDisplay = turnDisplay;
battleState.logArea = logArea;
battleState.nextBtn = nextBtn;
battleState.skipBtn = skipBtn;


// =====================
// ユーティリティ
// =====================

function flattenLogTree(root) {
  const result = [];

  function walk(node) {
    if (node.type === "group") {
      result.push({
        type: "__groupStart",
        label: node.label ?? null
      });

      for (const child of node.children) {
        walk(child);
      }

      result.push({ type: "__groupEnd" });
    } else if (node.type === "event") {
      result.push(node.data);
    }
  }

  walk(root);

  return result;
}

// ======================
// 盤面再生成
// ======================

function rebuildBoardFromState() {

  const board = document.getElementById("board");

  // ======================
  // 全消し
  // ======================

  board.innerHTML = "";

  // ======================
  // マス再生成
  // ======================

  const width = battleState.boardState.width;
  const height = battleState.boardState.height;

  createBoard("board", width, height);

  // ======================
  // ユニット再配置
  // ======================

  const units = battleState.boardState.units;

  for (const id in units) {

    const u = units[id];

    placeUnit("board", {
      id: id,
      x: u.x,
      y: u.y,
      team: u.team,
      icon: u.icon
    });

    updateFacing("board", id, u.facing);
  }

}

function rebuildTurnDisplayFromLogIndex() {
  let lastTurn = 0;

  for (let i = 0; i < battleState.logIndex; i++) {
    const ev = battleState.battleLog[i];

    if (ev?.type === "actionStart" && ev.unit === "__turn__") {
      if (typeof ev.turn === "number") {
        lastTurn = ev.turn;
      }
    }
  }

  battleState.uiTurn = lastTurn;

  if (!battleState.turnDisplay) return;

  if (lastTurn > 0) {
    battleState.turnDisplay.textContent = `TURN ${lastTurn}`;
  } else {
    battleState.turnDisplay.textContent = "BATTLE START";
  }
}

function rebuildPlaybackStateFromLogIndex() {
  battleState.requiredSet.clear();
  battleState.actedSet.clear();

  // 現在生存しているユニットを requiredSet に入れる
  for (const unitId in battleState.boardState.units) {
    battleState.requiredSet.add(unitId);
  }

  // 現在ターンを決める
  let currentTurn = 0;
  let lastTurnStartIndex = -1;

  for (let i = 0; i < battleState.logIndex; i++) {
    const ev = battleState.battleLog[i];

    if (ev?.type === "actionStart" && ev.unit === "__turn__") {
      if (typeof ev.turn === "number") {
        currentTurn = ev.turn;
      }
      lastTurnStartIndex = i;
    }
  }

  battleState.uiTurn = currentTurn;

  // そのターン開始以後、すでに行動済みのユニットを actedSet に入れる
  for (let i = lastTurnStartIndex + 1; i < battleState.logIndex; i++) {
    const ev = battleState.battleLog[i];

    if (ev?.type === "actionStart" && ev.unit && ev.unit !== "__turn__") {
      if (battleState.requiredSet.has(ev.unit)) {
        battleState.actedSet.add(ev.unit);
      }
    }
  }
}

// ======================
// バックログ
// ======================


function renderBacklog() {

  backlogContent.innerHTML = "";

  if (!snapshot) return;

  // ======================
  // 一時stateを作る
  // ======================

    const tempState = {
    width: battleState.boardState.width,
    height: battleState.boardState.height,
    units: {}
  };

  initializeBoardState(tempState, snapshot);

  let depth = 0;
  setSuppressBoardEffects(true);

  const logs = battleState.battleLog.slice(0, battleState.logIndex);

  for (let i = 0; i < logs.length; i++) {
          
    const ev = logs[i];

// ======================
// actionStart（ヘッダー）
// ======================
if (ev.type === "actionStart") {

  if (backlogContent.children.length > 0) {
    const divider = document.createElement("div");
    divider.classList.add("backlogActionDivider");
    backlogContent.appendChild(divider);
  }

  const div = document.createElement("div");
  div.classList.add("actionHeader");

  const headerText = document.createElement("span");
  headerText.classList.add("actionHeaderText");

  let jumpText = null;

  if (ev.unit === "__turn__") {

    const nextTurn = ev.turn ?? "?";
    const prevTurn =
      typeof nextTurn === "number"
        ? nextTurn - 1
        : "?";

    headerText.textContent =
      `TURN ${prevTurn} → TURN ${nextTurn}`;

    jumpText = document.createElement("span");
    jumpText.classList.add("backlogJumpText");
    jumpText.textContent = " [JUMP]";
    jumpText.dataset.jumpIndex = String(i);

  } else {

    const name =
      battleState.nameMap?.[ev.unit] || ev.unit;

    const unit =
      tempState.units[ev.unit];

    if (unit?.team === 1) {
      div.classList.add("team1Text");
    } else if (unit?.team === 2) {
      div.classList.add("team2Text");
    }

    headerText.textContent =
      `▶ ${name} の行動`;
  }

  div.appendChild(headerText);

  if (jumpText) {
    div.appendChild(jumpText);
  }

  backlogContent.appendChild(div);

  const spacer = document.createElement("div");
  spacer.style.height = "3px";
  backlogContent.appendChild(spacer);

  continue;
}


    // ======================
    // group start
    // ======================

    if (ev.type === "__groupStart") {

      if (ev.label) {

        if (backlogContent.children.length > 0) {
          const spacer = document.createElement("div");
          spacer.style.height = "6px";
          backlogContent.appendChild(spacer);
        }

        playLogEvent(
          ev.label,
          null,
          tempState,
          backlogContent,
          battleState.nameMap,
          depth
        );

        const spacer = document.createElement("div");
        spacer.style.height = "3px";
        backlogContent.appendChild(spacer);
      }

      depth++;
      continue;
    }

    // ======================
    // group end
    // ======================

    if (ev.type === "__groupEnd") {
      depth--;
      continue;
    }

    // ======================
    // 通常イベント
    // ======================

    applyEvent(ev, tempState);

    playLogEvent(
      ev,
      logs[i + 1],
      tempState,
      backlogContent,
      battleState.nameMap,
      depth
    );
  }
setSuppressBoardEffects(false);
}

function jumpToLogIndex(targetIndex) {

  battleState.autoPlay = false;
  battleState.isPlaying = false;

  autoBtn.textContent = "Auto";
  nextBtn.disabled = false;
  skipBtn.disabled = false;

  initializeBoardState(battleState.boardState, snapshot);

  for (let i = 0; i < targetIndex; i++) {
    applyEvent(battleState.battleLog[i], battleState.boardState);
  }

  battleState.logIndex = targetIndex;

  rebuildPlaybackStateFromLogIndex();

  rebuildBoardFromState();
  refreshLeftSideUI(battleState.boardState, snapshot);
  rebuildTurnDisplayFromLogIndex();

  battleState.logArea.innerHTML = "";
}

// ======================
// 全スキップ
// ======================
function skipToEnd() {

  if (battleState.isPlaying) return;

  battleState.isPlaying = true;

  // ======================
  // 初期化
  // ======================

  initializeBoardState(battleState.boardState, snapshot);

  // ======================
  // 全ログ適用
  // ======================

  for (const ev of battleState.battleLog) {

    switch (ev.type) {

      case "hpChange":
        applyHpChange(ev, battleState.boardState);
        break;

      case "cooldownSet":
        applyCooldownSet(ev, battleState.boardState);
        break;

      case "cooldownChange":
        applyCooldownChange(ev, battleState.boardState);
        break;

      case "effectDecay":
        applyEffectDecay(ev, battleState.boardState);
        break;

      case "effectExpired":
        applyEffectExpired(ev, battleState.boardState);
        break;

      case "effectRemoved":
        applyEffectRemoved(ev, battleState.boardState);
        break;

      case "effectApplied":
        applyEffectApplied(ev, battleState.boardState);
        break;

      case "move":
        applyMove(ev, battleState.boardState);
        break;

      case "death":
        applyDeath(ev, battleState.boardState);
        break;

      case "faceChange":
        applyFacing(ev, battleState.boardState);
        break;
    }
  }

  // ======================
  // 盤面再構築
  // ======================

  rebuildBoardFromState();

  // ======================
  // 最後のログ表示
  // ======================

  const last = [...battleState.battleLog]
    .reverse()
    .find(e => e.type === "battleEnd");

  if (last) {
    battleState.logArea.innerHTML = "";
    playLogEvent(
      last,
      null,
      battleState.boardState,
      battleState.logArea,
      battleState.nameMap,
      0
    );
  }

  // ======================
  // 状態更新
  // ======================
  battleState.logIndex = battleState.battleLog.length;

  refreshLeftSideUI(battleState.boardState, snapshot);
  rebuildTurnDisplayFromLogIndex();

  battleState.isPlaying = false;
}

function fitUnitName(el) {
  let size = 13;

  while (el.scrollWidth > el.offsetWidth && size > 8) {
    size--;
    el.style.fontSize = size + "px";
  }
}

function displayName(id, nameMap) {
  return nameMap?.[id] || id;
}

// =====================
// UIイベント
// =====================

speedBtn.addEventListener("click", () => {
  if (battleState.speed === 1) {
    battleState.speed = 2;
    speedBtn.textContent = "x2";
  } else {
    battleState.speed = 1;
    speedBtn.textContent = "x1";
  }

  document.documentElement.style.setProperty(
    "--ui-speed",
    battleState.speed
  );
});

autoBtn.addEventListener("click", () => {
  battleState.autoPlay = !battleState.autoPlay;

  autoBtn.textContent = battleState.autoPlay ? "Stop" : "Auto";

  nextBtn.disabled = battleState.autoPlay;

  if (battleState.autoPlay) {
    playNextAction();
  }
});

nextBtn.addEventListener("click", playNextAction);
skipBtn.addEventListener("click", skipToEnd);

logBtn.addEventListener("click", () => {
  renderBacklog();
  backlogOverlay.classList.remove("hidden");
});

backlogClose.addEventListener("click", () => {
  backlogOverlay.classList.add("hidden");
});

backlogOverlay.addEventListener("click", (e) => {
  if (e.target === backlogOverlay) {
    backlogOverlay.classList.add("hidden");
  }
});

backlogContent.addEventListener("click", (e) => {
  const jumpEl = e.target.closest(".backlogJumpText");
  if (!jumpEl) return;

  const jumpIndex = Number(jumpEl.dataset.jumpIndex);

  jumpToLogIndex(jumpIndex);
  backlogOverlay.classList.add("hidden");
});

// =====================
// ログ取得
// =====================

const params = new URLSearchParams(window.location.search);
const battleID = params.get("id");

const stored = localStorage.getItem(battleID);

if (!stored) {
  logArea.textContent = "ログが見つかりません";
  nextBtn.disabled = true;
}

const battleData = stored ? JSON.parse(stored) : null;
const snapshot = battleData ? battleData.snapshot : null;
const rawLog = battleData ? battleData.log : null;

const battleLog = rawLog
  ? flattenLogTree(rawLog)
  : [];

console.log("battleLog", battleLog);

// =====================
// 名前マップ作成
// =====================

const nameMap = {};

if (snapshot) {
  snapshot.units.forEach(u => {
    nameMap[u.id] = u.name || u.id;
  });
}

battleState.battleLog = battleLog;
battleState.nameMap = nameMap;
battleState.snapshot = snapshot;

// =====================
// 盤面作成
// =====================

const boardWidth = snapshot?.board?.width ?? 7;
const boardHeight = snapshot?.board?.height ?? 5;

battleState.boardState.width = boardWidth;
battleState.boardState.height = boardHeight;

createBoard("board", boardWidth, boardHeight);

// =====================
// 初期配置
// =====================
function initializeBoardState(targetBoardState, snapshot) {

  targetBoardState.units = {};

  if (!snapshot) return;

  snapshot.units.forEach(u => {

    const cooldowns = {};

    (u.skills || []).forEach(s => {
      cooldowns[s.type] = 0;
    });

    targetBoardState.units[u.id] = {
      x: u.x,
      y: u.y,
      hp: u.hp,
      mhp: u.mhp ?? u.hp,
      atk: u.atk ?? 0,
      def: u.def ?? 0,
      heal: u.heal ?? 0,
      speed: u.speed ?? 0,
      cri: u.cri ?? 0,
      tec: u.tec ?? 0,

      team: u.team,
      icon: u.icon || "https://placehold.co/60x60",
      facing: u.facing,

      effects: [],
      rateEffects: [],
      cooldowns
    };

  });
}
initializeBoardState(battleState.boardState, snapshot);
rebuildBoardFromState();

createLeftSideUI(snapshot, battleState);

// =====================
// 初期ターンUI
// =====================

if (turnDisplay) {
  turnDisplay.textContent = "BATTLE START";
}

resetCommPanel();

// =====================
// 初期行動順
// =====================

if (snapshot) {
  const sorted = [...snapshot.units]
    .sort((a, b) => b.speed - a.speed);

  sorted.forEach(u => {
    if (u.hp > 0) {
      battleState.requiredSet.add(u.id);
    }
  });
}

window.rebuildBoardFromState = rebuildBoardFromState;
window.skipToEnd = skipToEnd;
