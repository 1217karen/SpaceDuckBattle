// new-battlelog-controller.js

// =====================
// import
// =====================

import {createBoard,placeUnit,updateFacing,removeUnit} from "./board.js";
import {playLogEvent,updateUnitStatUI,updateUnitEffectUI} from "./new-battlelog-ui.js";
import { playNextAction } from "./new-battlelog-player.js";
import { battleState } from "./new-battlelog-state.js";
import { createLeftSideUI } from "./new-battlelog-ui-init.js";
import {applyHpChange,applyCooldownSet,applyCooldownChange,applyEffectDecay,applyEffectExpired,applyEffectRemoved,
        applyEffectApplied,applyMove,applyDeath,applyFacing} from "./new-battlelog-state-updater.js";

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


// ======================
// 全スキップ
// ======================
function skipToEnd() {

  if (battleState.isPlaying) return;

  battleState.isPlaying = true;

  // ======================
  // 初期化
  // ======================

  initializeBoardState(snapshot);

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

function initializeBoardState(snapshot) {

  // stateリセット
  battleState.boardState.units = {};

  if (!snapshot) return;

  snapshot.units.forEach(u => {

    const cooldowns = {};

    (u.skills || []).forEach(s => {
      cooldowns[s.type] = 0;
    });

    battleState.boardState.units[u.id] = {
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
initializeBoardState(snapshot);
rebuildBoardFromState();

createLeftSideUI(snapshot, battleState);

// =====================
// 初期ターンUI
// =====================

if (turnDisplay) {
  turnDisplay.textContent = "BATTLE START";
}

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
