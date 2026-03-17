//battlelog-controller.js

// =====================
// import
// =====================

import { 
  createBoard, 
  placeUnit,
  updateFacing
} from "./board.js";

import {
  playLogEvent,
  updateUnitStatUI,
  updateUnitEffectUI
} from "./battlelog-ui.js";


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

function fitUnitName(el){

  let size = 13;

  while (el.scrollWidth > el.offsetWidth && size > 8){
    size--;
    el.style.fontSize = size + "px";
  }

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

boardState.units[u.id] = {
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
  rateEffects: []
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
  <div class="unitName">${u.name || u.id}</div>
  <div class="nameDivider"></div>
</div>

<div class="unitRow">

  <div class="unitMain">

<div class="unitTopRow">

  <img class="statusIcon" src="${u.icon || "https://placehold.co/60x60"}">

  <div class="statusInfoBlock">

    <div class="effectList">

      <div class="effectItem"><span class="effectIcon">浮</span><span class="effectCount">00</span></div>
      <div class="effectItem"><span class="effectIcon">加</span><span class="effectCount">00</span></div>
      <div class="effectItem"><span class="effectIcon">共</span><span class="effectCount">00</span></div>
      <div class="effectItem"><span class="effectIcon">修</span><span class="effectCount">00</span></div>
      <div class="effectItem"><span class="effectIcon">衛</span><span class="effectCount">00</span></div>

      <div class="effectItem"><span class="effectIcon">重</span><span class="effectCount">00</span></div>
      <div class="effectItem"><span class="effectIcon">減</span><span class="effectCount">00</span></div>
      <div class="effectItem"><span class="effectIcon">妨</span><span class="effectCount">00</span></div>
      <div class="effectItem"><span class="effectIcon">侵</span><span class="effectCount">00</span></div>
      <div class="effectItem"><span class="effectIcon">流</span><span class="effectCount">00</span></div>

    </div>

    <div class="statDivider"></div>

<div class="statRow">

  <div class="statItem" data-stat="atk">
    <span class="statLabel">AT</span>
    <span class="statValue">-</span>
    <span class="statRate"> </span>
  </div>

  <div class="statItem" data-stat="def">
    <span class="statLabel">DF</span>
    <span class="statValue">-</span>
    <span class="statRate"> </span>
  </div>

  <div class="statItem" data-stat="heal">
    <span class="statLabel">HL</span>
    <span class="statValue">-</span>
    <span class="statRate"> </span>
  </div>

  <div class="statItem" data-stat="speed">
    <span class="statLabel">SP</span>
    <span class="statValue">-</span>
    <span class="statRate"> </span>
  </div>

  <div class="statItem" data-stat="cri">
    <span class="statLabel">CR</span>
    <span class="statValue">-</span>
    <span class="statRate"> </span>
  </div>

  <div class="statItem" data-stat="tec">
    <span class="statLabel">TC</span>
    <span class="statValue">-</span>
    <span class="statRate"> </span>
  </div>

</div>

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

  </div>

  <div class="skillSlots">

<div class="skillSlot"></div>
<div class="skillSlot"></div>

<div class="skillSlot"></div>
<div class="skillSlot"></div>

<div class="skillSlot"></div>
<div class="skillSlot"></div>

  </div>

</div>
`;

    leftSide.appendChild(div);
    updateUnitStatUI(u.id, boardState);

const nameEl = div.querySelector(".unitName");
if (nameEl) {
  setTimeout(() => fitUnitName(nameEl), 0);
}

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

  // ======================
  // rate effect 減衰（UI側）
  // ======================

for (const [unitId, unit] of Object.entries(boardState.units)) {

  if (!unit.rateEffects) continue;

  for (let i = unit.rateEffects.length - 1; i >= 0; i--) {

    const e = unit.rateEffects[i];

    e.duration--;

    if (e.duration <= 0) {
      unit.rateEffects.splice(i,1);
    }

  }

  updateUnitEffectUI(unitId, boardState);
updateUnitStatUI(unitId, boardState);

}

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

    if (ev.type === "battleEnd") {

  if (turnDisplay) {
    turnDisplay.textContent = "BATTLE FINISHED";
  }

  logArea.innerHTML = "";

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

  logArea.appendChild(div);

  logIndex = battleLog.length;
  return;
}

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
  actionEvents[i + 1],
  boardState,
  logArea,
  nameMap
);
playLogEvent(
  actionEvents[i + 1],
  actionEvents[i + 2],
  boardState,
  logArea,
  nameMap
);

      i++;

    }

    else {

playLogEvent(
  ev,
  actionEvents[i + 1],
  boardState,
  logArea,
  nameMap
);

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


  actedSet.add(actingUnit);

  logIndex = end + 1;

  nextBtn.disabled = false;

  if (autoPlay) {
    setTimeout(playNextAction, UNIT_DELAY);
  }

}
