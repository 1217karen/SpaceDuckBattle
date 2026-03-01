//battlelog-controller.js
import { 
  createBoard, 
  placeUnit,
  updateFacing
} from "./board.js";
  
import { playLogEvent }
  from "./battlelog-ui.js";

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
function clearEffectHighlights() {
console.log("clear called");
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
const HEADER_DELAY = 1000;
const EVENT_DELAY = 500;
const turnDisplay = document.getElementById("turnDisplay");
// =====================
// ログ取得（最初にやる）
// =====================

const logArea = document.getElementById("logArea");
const nextBtn = document.getElementById("nextBtn");

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
  
// id → name 変換テーブル
const nameMap = {};

if (snapshot) {
  snapshot.units.forEach(u => {
    nameMap[u.id] = u.name || u.id;
  });
}

// =====================
// 盤面作成
// =====================

createBoard("board", 10, 6);

let boardState = { units:{} };

// snapshot から初期配置
if (snapshot) {
  snapshot.units.forEach(u => {

    boardState.units[u.id] = { x:u.x, y:u.y };

placeUnit("board", {
  id: u.id,
  x: u.x,
  y: u.y,
  team: u.team,
  icon: u.icon || "https://placehold.co/60x60"
});
}
}

let logIndex = 0;
// =====================
// UIターン管理
// =====================
let uiTurn = 0;
let requiredSet = new Set();
let actedSet = new Set();

if (turnDisplay) {
  turnDisplay.textContent = "BATTLE START";
}

// 初期の行動対象（生存ユニット）
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
// イベント再生
// =====================
nextBtn.addEventListener("click", async () => {

  // 再生中の連打防止
  nextBtn.disabled = true;

  // 前回のハイライトを消す
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
// battleEnd 単独処理
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
// actionStart を探す
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
// actionEnd を探す
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
  .slice(start + 1, end) // actionStart と actionEnd は除く
  .filter(ev => ev.type !== "hpChange");
  // ======================
// ターン進行判定
// ======================

const actingUnit = battleLog[start].unit;

// 初回行動時にTURN1へ
if (uiTurn === 0) {
  uiTurn = 1;
  if (turnDisplay) {
    turnDisplay.textContent = "TURN 1";
  }
}

// 全員が行動したら次ターンへ
// 行動重複対策でeveryを使う
else if (
  [...requiredSet].every(id => actedSet.has(id))
) {

  uiTurn++;

  if (turnDisplay) {
    turnDisplay.textContent = `TURN ${uiTurn}`;
  }

  actedSet.clear();
}
// 行動ヘッダを先に表示
const firstEvent = actionEvents[0];
  if (!firstEvent) {
  logIndex = end + 1;
  nextBtn.disabled = false;
  return;
}
const header = document.createElement("div");
const displayName = nameMap?.[firstEvent.unit] || firstEvent.unit;
header.textContent = `▶ ${displayName} の行動`;
header.classList.add("actionHeader");

logArea.innerHTML = "";
logArea.appendChild(header);

  await sleep(HEADER_DELAY);
  // 「最新の行動だけ」表示するため、ここでログを全消し

  // ======================
  // 0.5秒ずつ再生
  // ======================

for (let i = 0; i < actionEvents.length; i++) {

  const ev = actionEvents[i];
  
  //死んだら終わり
if (ev.type === "death") {
  requiredSet.delete(ev.target);
}
  
  // 毎イベント前にハイライトリセット
  document.querySelectorAll(".cell")
    .forEach(cell => {
cell.classList.remove(
  "attackRange",
  "healRange",
  "buffRange",
  "debuffRange"
);
    });

  // ==========================
  // move + faceChange 同時処理
  // ==========================

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

    i++; // faceChangeスキップ
  }
  else {
    playLogEvent(
      ev,
      boardState,
      logArea,
      nameMap
    );
  }

  // 最後だけ待たない
await sleep(EVENT_DELAY);
clearEffectHighlights();
}
  actedSet.add(actingUnit);
logIndex = end + 1;
  nextBtn.disabled = false;
});
