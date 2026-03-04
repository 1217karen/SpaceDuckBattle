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

else if (event.type === "hpChange") {

  const bar = document.querySelector(
    `.unitStatus[data-unit="${event.target}"] .hpFill`
  );

  if (bar) {

    const unit = boardState.units[event.target];

    const max = unit?.mhp || 1;
    const rate = Math.max(event.hp / max, 0);

    bar.style.width = (rate * 100) + "%";
  }

  const text = document.querySelector(
    `.unitStatus[data-unit="${event.target}"] .hpText`
  );

  if (text) {

    const unit = boardState.units[event.target];
    const max = unit?.mhp || event.hp;

    text.textContent = `HP ${event.hp}/${max}`;
  }

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

  let isBuff = true;
  let text = "";

  // ==========================
  // corrosion / repair
  // ==========================
  if (e.type === "corrosion" || e.type === "repair") {

    isBuff = (e.type === "repair");

    text =
      e.type === "corrosion"
        ? "侵食"
        : "修復";

    div.textContent =
      `${displayName(event.to, nameMap)} に ${text} が付与された`;
  }

  // ==========================
  // stat系
  // ==========================
  else {

    isBuff = e.value >= 0;

    const sign =
      e.value >= 0 ? "+" : "";

    div.textContent =
      `${displayName(event.to, nameMap)} の ${e.stat} ${sign}${e.value}`;
  }

  if (unitState) {

    const cls =
      isBuff ? "buffHighlight" : "debuffHighlight";

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

    const cls =
      isBuff ? "buffFloat" : "debuffSink";

    img.classList.remove(cls);
    void img.offsetWidth;
    img.classList.add(cls);

    img.addEventListener("animationend", () => {
      img.classList.remove(cls);
    }, { once: true });

  }
}
  
else if (event.type === "death") {

  removeUnit("board", event.unit);

  delete boardState.units[event.unit];

  div.textContent =
    `${displayName(event.unit, nameMap)} が倒れた`;
}

else if (event.type === "move") {

  const unitState =
    boardState.units[event.unit];

  if (!unitState) {
    return; // 既に死亡している場合は無視
  }

  moveUnit(
    "board",
    event.unit,
    event.x,
    event.y
  );

  unitState.x = event.x;
  unitState.y = event.y;

  div.textContent =
    `${displayName(event.unit, nameMap)} が (${event.x},${event.y}) に移動`;
}
    
else if (event.type === "wait") {

  div.textContent =
    `${displayName(event.unit, nameMap)} は様子をうかがっている……`;
}
  logArea.appendChild(div);
}
