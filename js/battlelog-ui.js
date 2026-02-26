import {
  moveUnit,
  updateFacing,
  highlightCell,
  highlightCells
} from "./board.js";

export function playLogEvent(
  event,
  boardState,
  logArea
) {

  const div = document.createElement("div");

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

    div.textContent =
      `${event.unit} の向きが ${event.facing} に変わった`;
  }

  else if (event.type === "skillUse") {

    div.textContent =
      `${event.unit} が ${event.skill} を使用`;

    if (event.rangeCells) {

      let cls = "attackRange";

      if (event.rangeStyle === "heal") cls = "healRange";
      if (event.rangeStyle === "buff") cls = "buffRange";
      if (event.rangeStyle === "debuff") cls = "debuffRange";

      highlightCells(
        "board",
        event.rangeCells,
        cls
      );
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
      `${event.from} が ${event.to} を攻撃 (${event.amount})`;
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
      `${event.from} が ${event.to} を回復 (${event.amount})`;
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
    `${event.to} の ${e.stat} ${sign}${e.value}`;
}
  
  else if (event.type === "hpChange") {
    div.textContent =
      `${event.target} のHP → ${event.hp}`;
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
