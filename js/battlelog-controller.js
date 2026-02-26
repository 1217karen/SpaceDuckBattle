import { 
  createBoard, 
  placeUnit,
  updateFacing
} from "./board.js";
  
import { playLogEvent }
  from "./battlelog-ui.js";

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
nextBtn.addEventListener("click", () => {

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

  if (logIndex >= battleLog.length) return;

  // ======================
  // 行動開始を探す
  // ======================

  let start = logIndex;

  while (
    start < battleLog.length &&
    battleLog[start].type !== "skillUse" &&
    battleLog[start].type !== "move"
  ) {
    start++;
  }

  if (start >= battleLog.length) {
    logIndex = battleLog.length;
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

  // ======================
  // まとめて再生
  // ======================

  const actionEvents = battleLog.slice(start, end);

  for (let ev of actionEvents) {
    playLogEvent(
      ev,
      boardState,
      logArea,
      nameMap
    );
  }

  logIndex = end;
});
