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

createBoard("board", 6, 6);

let boardState = { units:{} };

// snapshot から初期配置
if (snapshot) {
  snapshot.units.forEach(u => {

    boardState.units[u.id] = { x:u.x, y:u.y };

    placeUnit("board", {
      id: u.id,
      x: u.x,
      y: u.y,
      icon: u.icon || "https://placehold.co/60x60"
    });

    updateFacing("board", u.id, u.facing);
  });
}

let logIndex = 0;

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
        "debuffRange",
        "attackHighlight",
        "healHighlight",
        "buffHighlight",
        "debuffHighlight"
      );
    });

  if (logIndex >= battleLog.length) {
    nextBtn.disabled = false;
    return;
  }

  // ======================
  // 行動開始を探す
  // ======================

let start = logIndex;

// turnStart は先に処理してしまう
while (start < battleLog.length) {

  const ev = battleLog[start];

if (ev.type === "turnStart") {

  if (turnDisplay) {
    turnDisplay.textContent = `TURN ${ev.turn}`;
  }

  start++;
  logIndex = start; // ← これ追加（超重要）

  continue;
}

  if (ev.type === "skillUse" || ev.type === "move") {
    break;
  }

  start++;
}

  if (start >= battleLog.length) {
    logIndex = battleLog.length;
    nextBtn.disabled = false;
    return;
  }

  // ======================
  // 行動終了を探す
  // ======================

  let end = start + 1;

  while (
    end < battleLog.length &&
    battleLog[end].type !== "skillUse" &&
    battleLog[end].type !== "move"
  ) {
    end++;
  }

  const actionEvents = battleLog.slice(start, end);
  
// 行動ヘッダを先に表示
const firstEvent = actionEvents[0];
const header = document.createElement("div");
const displayName = nameMap?.[firstEvent.unit] || firstEvent.unit;
header.textContent = `▶ ${displayName} の行動`;
header.classList.add("actionHeader");

logArea.innerHTML = "";
logArea.appendChild(header);

await sleep(500);
  // 「最新の行動だけ」表示するため、ここでログを全消し

  // ======================
  // 0.5秒ずつ再生
  // ======================

for (let i = 0; i < actionEvents.length; i++) {

  const ev = actionEvents[i];

  // hpChange は演出対象にしない
  if (ev.type === "hpChange") {
    continue;
  }

  // 毎イベント前にハイライトリセット
  document.querySelectorAll(".cell")
    .forEach(cell => {
      cell.classList.remove(
        "attackRange",
        "healRange",
        "buffRange",
        "debuffRange",
        "attackHighlight",
        "healHighlight",
        "buffHighlight",
        "debuffHighlight"
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
  if (i !== actionEvents.length - 1) {
    await sleep(500);
  }
}
  logIndex = end;
  nextBtn.disabled = false;
});
