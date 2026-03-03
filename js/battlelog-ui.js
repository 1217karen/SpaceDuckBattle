//battlelog-ui.js
import {
  moveUnit,
  updateFacing,
  highlightCell,
  highlightCells,
  removeUnit
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

if (event.type === "turnStart") {
  return;
}

else if (event.type === "faceChange") {

  updateFacing(
    "board",
    event.unit,
    event.facing
  );

  div.textContent =
    `${displayName(event.unit, nameMap)} は ${event.facing} を向いた`;
}
else if (event.type === "skillUse") {
div.textContent =
  `${displayName(event.unit, nameMap)} の ${event.skill}`;

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

    const img = document.querySelector(
      `[data-unit-id="${event.to}"] .unitImage`
    );

    if (img) {

      img.classList.remove("shake");
      void img.offsetWidth;
      img.classList.add("shake");

      img.addEventListener("animationend", () => {
        img.classList.remove("shake");
      }, { once: true });

    }
  }

  div.textContent =
    `${displayName(event.to, nameMap)} に ${event.amount} のダメージ`;
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
    
const img = document.querySelector(
  `[data-unit-id="${event.to}"] .unitImage`
);

if (img) {

  img.classList.remove("bounce");
  void img.offsetWidth;
  img.classList.add("bounce");

  img.addEventListener("animationend", () => {
    img.classList.remove("bounce");
  }, { once: true });

}
    
div.textContent =
  `${displayName(event.to, nameMap)} のHPが ${event.amount} 回復`;
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
const img = document.querySelector(
  `[data-unit-id="${event.to}"] .unitImage`
);

if (img) {

  const isBuff = event.effect.value >= 0;

  const cls = isBuff ? "buffFloat" : "debuffSink";

  img.classList.remove(cls);
  void img.offsetWidth;
  img.classList.add(cls);

  img.addEventListener("animationend", () => {
    img.classList.remove(cls);
  }, { once: true });

}
  const sign =
    e.value >= 0 ? "+" : "";

  div.textContent =
    `${displayName(event.to, nameMap)} の ${e.stat} ${sign}${e.value}`
}
  
else if (event.type === "death") {

  removeUnit("board", event.unit);

  delete boardState.units[event.unit];

  div.textContent =
    `${displayName(event.unit, nameMap)} が倒れた`;
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
      `${displayName(event.unit, nameMap)} が (${event.x},${event.y}) に移動`;
  }
    
else if (event.type === "wait") {

  div.textContent =
    `${displayName(event.unit, nameMap)} は様子をうかがっている……`;
}
  logArea.appendChild(div);
}
