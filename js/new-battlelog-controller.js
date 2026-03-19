// new-battlelog-controller.js

// =====================
// import
// =====================

import {createBoard,placeUnit,updateFacing} from "./board.js";
import {playLogEvent,updateUnitStatUI,updateUnitEffectUI} from "./battlelog-ui.js";
import { skillHandlers } from "./skills.js";
import { playNextAction } from "./new-battlelog-player.js";
import { battleState } from "./new-battlelog-state.js";
import { createLeftSideUI } from "./new-battlelog-ui-init.js";

// =====================
// DOM取得
// =====================

const turnDisplay = document.getElementById("turnDisplay");
const logArea = document.getElementById("logArea");
const nextBtn = document.getElementById("nextBtn");
const autoBtn = document.getElementById("autoBtn");
const speedBtn = document.getElementById("speedBtn");

battleState.turnDisplay = turnDisplay;
battleState.logArea = logArea;
battleState.nextBtn = nextBtn;

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

createBoard("board", boardWidth, boardHeight);

// =====================
// 初期配置
// =====================

if (snapshot) {
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
  effects: [],
  rateEffects: [],
  cooldowns
};

    placeUnit("board", {
      id: u.id,
      x: u.x,
      y: u.y,
      team: u.team,
      icon: u.icon || "https://placehold.co/60x60"
    });

    updateFacing("board", u.id, u.facing);
  });
}

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

