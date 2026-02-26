import {
  moveUnit,
  updateFacing,
  highlightCell,
  highlightCells
} from "./board.js";

function displayName(id, nameMap) {
  return nameMap?.[id] || id;
}
export function playLogEvent(
  event,
  boardState,
  logArea,
  nameMap
) {

  const div = document.createElement("div");
  
// 行動開始表示（skillUse または move のとき）
if (event.type === "skillUse" || event.type === "move") {
  const header = document.createElement("div");
  const displayName = nameMap?.[event.unit] || event.unit;
  header.textContent = `▶ ${displayName} の行動`;
  header.classList.add("actionHeader");
  logArea.appendChild(header);
}
  if (event.type === "turnStart") {
    div.textContent =
      `--- ターン ${event.turn} ---`;
  }

else if (event.type === "faceChange") {

  updateFacing(
    "board",
    event.unit,
    event.facing
  );

  return; // ログ表示しない
}
  else if (event.type === "skillUse") {

    div.textContent =
      `${displayName(event.unit, nameMap)} が ${event.skill} を使用`;

    if (event.rangeCells) {

let cls = null;

if (event.rangeStyle === "attack") cls = "attackRange";
if (event.rangeStyle === "heal") cls = "healRange";
if (event.rangeStyle === "buff") cls = "buffRange";
if (event.rangeStyle === "debuff") cls = "debuffRange";

if (cls) {
  highlightCells(
    "board",
    event.rangeCells,
    cls
  );
}
    }
  }

  else if (event.type === "attack") {

    const unitState =
      boardState.units[event.to];

    if (unitState) {
      highlightCell(
        "board",
        unitState.x,
        unitState.y,
        "attackHighlight"
      );
    }

    div.textContent =
      `${displayName(event.from, nameMap)} が ${displayName(event.to, nameMap)} を攻撃`
  }

  else if (event.type === "heal") {

    const unitState =
      boardState.units[event.to];

    if (unitState) {
      highlightCell(
        "board",
        unitState.x,
        unitState.y,
        "healHighlight"
      );
    }

    div.textContent =
      `${displayName(event.from, nameMap)} が ${displayName(event.to, nameMap)} を回復`
  }
else if (event.type === "effectApplied") {

  const e = event.effect;

  const unitState =
    boardState.units[event.to];

  if (unitState) {

    const cls =
      e.value >= 0
        ? "buffHighlight"
        : "debuffHighlight";

    highlightCell(
      "board",
      unitState.x,
      unitState.y,
      cls
    );
  }

  const sign =
    e.value >= 0 ? "+" : "";

  div.textContent =
    `${displayName(event.to, nameMap)} の ${e.stat} ${sign}${e.value}`
}
  
  else if (event.type === "death") {
    div.textContent =
      `${event.target} が倒れた`;
  }

  else if (event.type === "battleEnd") {
    div.textContent =
      `戦闘終了 勝者: ${event.winner}`;
  }

  else if (event.type === "move") {

    moveUnit(
      "board",
      event.unit,
      event.x,
      event.y
    );

    boardState.units[event.unit].x =
      event.x;

    boardState.units[event.unit].y =
      event.y;

    div.textContent =
      `${event.unit} が (${event.x},${event.y}) に移動`;
  }

  logArea.appendChild(div);
}
