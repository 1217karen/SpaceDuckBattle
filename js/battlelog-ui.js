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

function updateEffectList(unitId, boardState) {

  const unit = boardState.units[unitId];
  if (!unit) return;

  const root = document.querySelector(
    `.unitStatus[data-unit="${unitId}"] .effectList`
  );

  if (!root) return;

  root.innerHTML = "";

  if (!unit.effects || unit.effects.length === 0) return;

  for (const e of unit.effects) {

    const span = document.createElement("span");

    const name =
      EFFECT_SHORT[e.type] || e.type;

    const value =
      e.stock ?? "";

    span.textContent = `${name}${value}`;

    root.appendChild(span);
  }
}

const EFFECT_SHORT = {
  corrosion: "侵",
  repair: "修",
  resonance: "共",
  interference: "妨",
  slow: "減",
  accel: "加",
  gravity: "重",
  float: "浮",
  diffuse: "拡",
  converge: "収",
  meteor: "流",
  satellite: "衛"
};

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

  const unit = boardState.units[event.target];

  if (unit) {
    unit.hp = event.hp;
  }

  const bar = document.querySelector(
    `.unitStatus[data-unit="${event.target}"] .hpFill`
  );

  if (bar) {

    const max = unit?.mhp || 1;
    const rate = Math.max(event.hp / max, 0);

    bar.style.width = (rate * 100) + "%";
  }

  const text = document.querySelector(
    `.unitStatus[data-unit="${event.target}"] .hpText`
  );

  if (text) {

    const max = unit?.mhp || event.hp;

    text.textContent = `HP ${event.hp}/${max}`;
  }

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

else if (event.type === "damage") {

  const unitState =
    boardState.units[event.target];

  if (unitState) {
    highlightCell(
      "board",
      unitState.x,
      unitState.y,
      "attackHighlight"
    );

    const img = document.querySelector(
      `[data-unit-id="${event.target}"] .unitImage`
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

if (event.damageType === "effect") {

  div.textContent =
    `${displayName(event.target, nameMap)} は 侵食 で ${event.amount} ダメージ`;

}
else {

  div.textContent =
    `${displayName(event.target, nameMap)} に ${event.amount} ダメージ`;

}
}

  else if (event.type === "heal") {

    const unitState =
      boardState.units[event.target];

    if (unitState) {
      highlightCell(
        "board",
        unitState.x,
        unitState.y,
        "healHighlight"
      );
    }
    
const img = document.querySelector(
  `[data-unit-id="${event.target}"] .unitImage`
);

if (img) {

  img.classList.remove("bounce");
  void img.offsetWidth;
  img.classList.add("bounce");

  img.addEventListener("animationend", () => {
    img.classList.remove("bounce");
  }, { once: true });

}
    
if (event.healType === "effect") {

  div.textContent =
    `${displayName(event.target, nameMap)} は 修復 でHPが ${event.amount} 回復`;

}
else {

  div.textContent =
    `${displayName(event.target, nameMap)} のHPが ${event.amount} 回復`;

}
  }
else if (event.type === "effectApplied") {

    // UI側effects更新
  const unit = boardState.units[event.target];
  if (unit) {

const e = event.effect;

if (e.type) {

  const existing =
    unit.effects.find(x => x.type === e.type);

  if (existing) {
    existing.stock = e.stock;
  }
  else {
    unit.effects.push({
      type: e.type,
      stock: e.stock
    });
  }

  updateEffectList(event.target, boardState);
}

    if (existing) {
      existing.stock = e.stock;
    }
    else {
      unit.effects.push({
        type: e.type,
        stock: e.stock
      });
    }

    updateEffectList(event.target, boardState);
  }
  
  const unitState = boardState.units[event.target];

  const effectNames = {
    corrosion: "侵食",
    repair: "修復",
    resonance: "共振",
    interference: "妨害",
    slow: "減速",
    accel: "加速",
    gravity: "重力",
    float: "浮力",
    diffuse: "拡散",
    converge: "収束",
    meteor: "流星",
    satellite: "衛星"
  };

  const name =
    effectNames[e.type] || e.type;

  let text = "";
  let isBuff = true;

  const STOCK_TYPES = new Set([
    "corrosion",
    "repair",
    "resonance",
    "interference"
  ]);

  const OVERWRITE_TYPES = new Set([
    "slow",
    "accel",
    "gravity",
    "float",
    "diffuse",
    "converge",
    "meteor",
    "satellite"
  ]);

  // ==========================
  // stock型
  // ==========================

  if (STOCK_TYPES.has(e.type)) {

    const n = e.stock ?? 1;

    isBuff =
      e.type === "repair" ||
      e.type === "resonance";

    text =
      `${displayName(event.target, nameMap)} に ${name} を ${n} 追加`;

  }

  // ==========================
  // 上書き型
  // ==========================

  else if (OVERWRITE_TYPES.has(e.type)) {

    const n = e.stock ?? 1;

    isBuff =
      e.type === "accel" ||
      e.type === "float" ||
      e.type === "converge" ||
      e.type === "satellite";

    text =
      `${displayName(event.target, nameMap)} の ${name} が ${n} に変化`;

  }

  // ==========================
  // stat系
  // ==========================

else {

  const amount = Math.abs(e.value);

  const word =
    e.value >= 0 ? "増加" : "減少";

  isBuff = e.value >= 0;

  text =
    `${displayName(event.target, nameMap)} の ${e.stat} が ${amount} ${word}`;
}

  div.textContent = text;

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
    `[data-unit-id="${event.target}"] .unitImage`
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

else if (event.type === "mobilityChange") {

  if (event.delta < 0) {
    div.textContent =
      `${displayName(event.unit, nameMap)} は 減速 で機動力低下`;
  }

  else if (event.delta > 0) {
    div.textContent =
      `${displayName(event.unit, nameMap)} は 加速 で機動力上昇`;
  }

}

  else if (event.type === "cooldownChange") {

  const text =
    event.delta > 0
      ? "クールタイムが 1 増加"
      : "クールタイムが 1 減少";

  div.textContent =
    `${displayName(event.unit, nameMap)} の ${event.skill} の ${text}`;
}

else if (event.type === "cooldownLimit") {

  div.textContent =
    `${displayName(event.unit, nameMap)} のクールタイムはこれ以上変化しない`;
}
    
else if (event.type === "wait") {

  div.textContent =
    `${displayName(event.unit, nameMap)} は様子をうかがっている……`;
}
  logArea.appendChild(div);
}

