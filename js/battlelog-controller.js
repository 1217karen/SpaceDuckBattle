//battlelog-controller.js

// =====================
// import
// =====================

import { 
  createBoard, 
  placeUnit,
  updateFacing
} from "./board.js";

import { playLogEvent }
  from "./battlelog-ui.js";


// =====================
// 設定値
// =====================

const HEADER_DELAY = 1000;
const EVENT_DELAY = 500;
const EFFECT_DELAY = 250;
const UNIT_DELAY = 1000;


// =====================
// 状態変数
// =====================

let speed = 1;
let autoPlay = false;
let logIndex = 0;

let boardState = { units:{} };

let uiTurn = 0;
let requiredSet = new Set();
let actedSet = new Set();


// =====================
// DOM取得
// =====================

const turnDisplay = document.getElementById("turnDisplay");
const logArea = document.getElementById("logArea");
const nextBtn = document.getElementById("nextBtn");
const autoBtn = document.getElementById("autoBtn");
const speedBtn = document.getElementById("speedBtn");


// =====================
// ユーティリティ
// =====================

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms / speed));
}

function clearEffectHighlights() {
  document.querySelectorAll(".cell")
    .forEach(cell => {
      cell.classList.remove(
        "attackHighlight",
        "healHighlight",
        "buffHighlight",
        "debuffHighlight"
      );
    });
}

function clearActiveUnit() {
  document.querySelectorAll(".cell")
    .forEach(cell => {
      cell.classList.remove("activeUnit");
    });
}


// =====================
// UIイベント
// =====================

speedBtn.addEventListener("click", () => {

  if (speed === 1) {
    speed = 2;
    speedBtn.textContent = "x2";
  } else {
    speed = 1;
    speedBtn.textContent = "x1";
  }

  document.documentElement.style.setProperty(
    "--ui-speed",
    speed
  );

});

autoBtn.addEventListener("click", () => {

  autoPlay = !autoPlay;

  autoBtn.textContent = autoPlay ? "Stop" : "Auto";

  nextBtn.disabled = autoPlay;

  if (autoPlay) {
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
const battleLog = battleData ? battleData.log : [];


// =====================
// 名前マップ作成
// =====================

const nameMap = {};

if (snapshot) {
  snapshot.units.forEach(u => {
    nameMap[u.id] = u.name || u.id;
  });
}


// =====================
// 盤面作成
// =====================

const boardWidth = snapshot?.board?.width ?? 8;
const boardHeight = snapshot?.board?.height ?? 6;

createBoard("board", boardWidth, boardHeight);


// =====================
// 初期配置
// =====================

if (snapshot) {

  snapshot.units.forEach(u => {

boardState.units[u.id] = {
  x: u.x,
  y: u.y,
  hp: u.hp,
  mhp: u.mhp ?? u.hp,
  effects: []
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

const leftSide = document.getElementById("leftSide");

if (snapshot) {

  const team1 = snapshot.units.filter(u => u.team === 1);

  team1.forEach(u => {

    const div = document.createElement("div");
    div.className = "unitStatus";
    div.dataset.unit = u.id;

    div.innerHTML = `
<div class="unitHeader">
  <img class="statusIcon" src="${u.icon || "https://placehold.co/60x60"}">

  <div class="nameBlock">
    <div class="unitName">${u.name || u.id}</div>
    <div class="nameDivider"></div>
    <div class="effectList"></div>
  </div>

</div>
<div class="hpRow">

  <div class="hpText">
    HP ${(u.hp ?? u.mhp ?? 0)}/${u.mhp ?? u.hp ?? 0}
  </div>

  <div class="hpBar">
    <div class="hpFill" style="width:100%"></div>
  </div>

</div>
    `;

    leftSide.appendChild(div);

  });

}

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
    .sort((a,b)=>b.speed-a.speed);

  sorted.forEach(u=>{
    if (u.hp > 0) {
      requiredSet.add(u.id);
    }
  });

}


// =====================
// メイン再生
// =====================

async function playNextAction() {

  nextBtn.disabled = true;

  document.querySelectorAll(".cell")
    .forEach(cell => {
      cell.classList.remove(
        "attackRange",
        "healRange",
        "buffRange",
        "debuffRange"
      );
    });

  if (logIndex >= battleLog.length) {
    nextBtn.disabled = false;
    return;
  }


  // ======================
  // battleEnd
  // ======================

  if (battleLog[logIndex]?.type === "battleEnd") {

    logArea.innerHTML = "";

    const div = document.createElement("div");
    div.classList.add("battleEndBlock");

    div.innerHTML = `
      <div style="font-size:20px;font-weight:bold;">
        BATTLE FINISHED
      </div>
      <div style="margin-top:8px;">
        TEAM ${battleLog[logIndex].winner} 勝利
      </div>
    `;

    logArea.appendChild(div);

    logIndex++;
    nextBtn.disabled = false;
    return;
  }


  // ======================
  // actionStart 探索
  // ======================

  let start = logIndex;

  while (
    start < battleLog.length &&
    battleLog[start].type !== "actionStart"
  ) {
    start++;
  }

  if (start >= battleLog.length) {
    logIndex = battleLog.length;
    nextBtn.disabled = false;
    return;
  }


  // ======================
  // actionEnd 探索
  // ======================

  let end = start + 1;

  while (
    end < battleLog.length &&
    battleLog[end].type !== "actionEnd"
  ) {
    end++;
  }

  if (end >= battleLog.length) {
    nextBtn.disabled = false;
    return;
  }


const actionEvents = battleLog
  .slice(start + 1, end);


  // ======================
  // 行動ユニット
  // ======================

  const actingUnit = battleLog[start].unit;

  clearActiveUnit();

  const pos = boardState.units[actingUnit];

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

  if (uiTurn === 0) {

    uiTurn = 1;

    if (turnDisplay) {
      turnDisplay.textContent = "TURN 1";
    }

  }

  else if (
    [...requiredSet].every(id => actedSet.has(id))
  ) {

    uiTurn++;

    if (turnDisplay) {
      turnDisplay.textContent = `TURN ${uiTurn}`;
    }

    actedSet.clear();

  }


  // ======================
  // 行動ヘッダー
  // ======================



  const header = document.createElement("div");

const displayName =
  nameMap?.[actingUnit] || actingUnit;

  header.textContent = `▶ ${displayName} の行動`;
  header.classList.add("actionHeader");

  logArea.innerHTML = "";
  logArea.appendChild(header);


  await sleep(HEADER_DELAY);

  clearActiveUnit();


  // ======================
  // イベント再生
  // ======================

  for (let i = 0; i < actionEvents.length; i++) {

    const ev = actionEvents[i];

    if (ev.type === "death") {
      requiredSet.delete(ev.unit);
    }

    document.querySelectorAll(".cell")
      .forEach(cell => {
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
        boardState,
        logArea,
        nameMap
      );

      playLogEvent(
        actionEvents[i + 1],
        boardState,
        logArea,
        nameMap
      );

      i++;

    }

    else {

      playLogEvent(
        ev,
        boardState,
        logArea,
        nameMap
      );

    }


let wait = EVENT_DELAY;

if (ev.type === "attack") {

  if (ev.damageType === "effect") {
    wait = EVENT_DELAY;
  } else {
    wait = EFFECT_DELAY;
  }

}

else if (ev.type === "heal") {

  if (ev.healType === "effect") {
    wait = EVENT_DELAY;
  } else {
    wait = EFFECT_DELAY;
  }

}

else if (ev.type === "effectApplied") {

  wait = EFFECT_DELAY;

}

if (ev.type !== "hpChange") {
  await sleep(wait);
}

    clearEffectHighlights();

  }


  actedSet.add(actingUnit);

  logIndex = end + 1;

  nextBtn.disabled = false;

  if (autoPlay) {
    setTimeout(playNextAction, UNIT_DELAY);
  }

}
