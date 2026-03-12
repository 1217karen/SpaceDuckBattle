//battlelog-ui.js
import { moveUnit, updateFacing, highlightCell, highlightCells, removeUnit } from "./board.js";
import { EFFECTS } from "./effects-config.js";

function displayName(id, nameMap) {
  return nameMap?.[id] || id;
}

function spawnFloatingNumber(unitId, value, type){

const wrapper =
document.querySelector(`[data-unit-id="${unitId}"]`);

if(!wrapper) return;

const num = document.createElement("div");

num.classList.add("floatingNumber");

if(type === "damage"){
num.classList.add("damageNumber");
}

if(type === "heal"){
num.classList.add("healNumber");
}

  if(type === "statUp"){
num.classList.add("statUpNumber");
}

if(type === "statDown"){
num.classList.add("statDownNumber");
}

  if(type === "critical"){
num.classList.add("criticalNumber");
}

  if(type === "effectTrigger"){
num.classList.add("effectTriggerNumber");
}

num.textContent = value;

wrapper.appendChild(num);

num.addEventListener("animationend",()=>{
num.remove();
});

}

function updateUnitEffectUI(unitId, boardState) {

  const unit = boardState.units[unitId];
  if (!unit) return;

  const container =
    document.querySelector(`.unitStatus[data-unit="${unitId}"]`);

  if (!container) return;

  const counts = {
    gravity: 0,
    float: 0,
    accel: 0,
    slow: 0,
    resonance: 0,
    interference: 0,
    repair: 0,
    corrosion: 0,
    satellite: 0,
    meteor: 0
  };

  for (const e of (unit.effects || [])) {
    if (counts.hasOwnProperty(e.type)) {
      counts[e.type] = e.stock ?? 1;
    }
  }

const mapping = [
  ["float",0],
  ["accel",1],
  ["resonance",2],
  ["repair",3],
  ["satellite",4],
  ["gravity",5],
  ["slow",6],
  ["interference",7],
  ["corrosion",8],
  ["meteor",9]
];

  const items =
    container.querySelectorAll(".effectItem");

  for (const [type, index] of mapping) {

    const el =
      items[index]?.querySelector(".effectCount");

    if (!el) continue;

    const v = counts[type] ?? 0;

    el.textContent =
      String(v).padStart(2, "0");
  }
}

export function playLogEvent(
  event,
  nextEvent,
  boardState,
  logArea,
  nameMap
) {

const div = document.createElement("div");

const block = event.block ?? "system";
const nextBlock = nextEvent?.block ?? null;

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

else if (event.type === "effectTrigger") {

  const name =
    EFFECTS[event.effect]?.name || event.effect;

div.textContent =
`${displayName(event.unit, nameMap)} の ${name}`;

spawnFloatingNumber(event.unit, name, "effectTrigger");

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

else if (event.type === "critical") {

  div.textContent = "CRITICAL!";

spawnFloatingNumber(
  nextEvent?.target ?? nextEvent?.unit,
  "CRITICAL!",
  "critical"
);

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
        `侵食 で ${event.amount} ダメージ`;

    }

    else {

div.innerHTML =
`${displayName(event.target, nameMap)} に <span class="logNumber">${event.amount}</span> ダメージ`;

    }

    spawnFloatingNumber(event.target, event.amount, "damage");
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
        `修復 の効果でHPが ${event.amount} 回復`;

    }

    else {

div.innerHTML =
`${displayName(event.target, nameMap)} のHPが <span class="logNumber">${event.amount}</span> 回復`;

    }
    
    spawnFloatingNumber(event.target, event.amount, "heal");
  }

  else if (event.type === "effectDecay") {

    const e = event.effect;

    if (boardState.units[event.unit]) {

      const unit = boardState.units[event.unit];

      const existing =
        unit.effects.find(x => x.type === e.type);

      if (existing) {
        existing.stock = e.stock;
      }

      updateUnitEffectUI(event.unit, boardState);
    }

    const name =
      EFFECTS[e.type]?.name || e.type;

    div.textContent =
      `${name} が 1 減衰 (${e.stock})`;
  }

      else if (event.type === "effectExpired") {

    const e = event.effect;

    if (boardState.units[event.unit]) {

      const unit = boardState.units[event.unit];

      unit.effects =
        unit.effects.filter(x => x.type !== e.type);

      updateUnitEffectUI(event.unit, boardState);
    }

    return;
  }

  else if (event.type === "effectRemoved") {

    const e = event.effect;

    if (boardState.units[event.unit]) {

      const unit = boardState.units[event.unit];

      unit.effects =
        unit.effects.filter(x => x.type !== e.type);

      updateUnitEffectUI(event.unit, boardState);
    }

    const name =
      EFFECTS[e.type]?.name || e.type;

    div.textContent =
      `${displayName(event.unit, nameMap)} の ${name} が解除`;
  }

  else if (event.type === "effectApplied") {

    const e = event.effect;

    const unitState = boardState.units[event.target];

    const name =
      EFFECTS[e.type]?.name || e.type;

    let text = "";
    let isBuff = true;

    // ==========================
    // stock型
    // ==========================

    if (EFFECTS[e.type]?.stack === "stock") {

      const delta = event.effect.delta ?? 1;

spawnFloatingNumber(
  event.target,
  `${name}+${delta}`,
  "statUp"
);

      const n = e.stock ?? 1;

      isBuff = EFFECTS[e.type]?.group === "buff";

      text =
        `${displayName(event.target, nameMap)} に ${name} を <span class="logNumber">${event.effect.delta ?? n}</span> 付与 (${n})`;
    }

    // ==========================
    // 上書き型
    // ==========================

else if (EFFECTS[e.type]?.stack === "overwrite") {

      const n = e.stock ?? 1;

      spawnFloatingNumber(
        event.target,
        `${name}=${n}`,
        "statUp"
      );

      isBuff = EFFECTS[e.type]?.group === "buff";

      text =
        `${displayName(event.target, nameMap)} の ${name} が <span class="logNumber">${n}</span> に変化`;
    }

    // ==========================
    // stat系
    // ==========================

    else {

      const amount = Math.round(Math.abs(e.value));

      const sign = e.value >= 0 ? "+" : "-";

spawnFloatingNumber(
  event.target,
  `${e.stat.toUpperCase()}${sign}${amount}`,
  e.value >= 0 ? "statUp" : "statDown"
);

      const word =
        e.value >= 0 ? "増加" : "減少";

      isBuff = e.value >= 0;

      text =
        `${displayName(event.target, nameMap)} の ${e.stat} が <span class="logNumber">${amount}</span> ${word}`;
    }

   div.innerHTML = text;

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

    if (boardState.units[event.target]) {

      const unit = boardState.units[event.target];

      unit.effects = unit.effects || [];

      const existing =
        unit.effects.find(e => e.type === event.effect.type);

      if (existing) {

        existing.stock =
          event.effect.stock ?? existing.stock ?? 1;

      }

      else {

        unit.effects.push({
          type: event.effect.type,
          stock: event.effect.stock ?? 1
        });

      }

      updateUnitEffectUI(event.target, boardState);
    }
  }

  else if (event.type === "death") {

    removeUnit("board", event.unit);

    delete boardState.units[event.unit];

    div.textContent =
      `${displayName(event.unit, nameMap)} は戦線を離脱`;
  }

  else if (event.type === "move") {

    const unitState =
      boardState.units[event.unit];

    if (!unitState) {
      return;
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

  const amount = Math.abs(event.delta);

  if (event.delta < 0) {

    div.textContent =
      `移動可能数 が ${amount} 減少`;

spawnFloatingNumber(
  event.unit,
  `MOVE-${amount}`,
  "statDown"
);

  }

  else if (event.delta > 0) {

    div.textContent =
      `移動可能数 が ${amount} 増加`;

spawnFloatingNumber(
  event.unit,
  `MOVE+${amount}`,
  "statUp"
);

  }
}

else if (event.type === "cooldownChange") {

  const text =
    event.delta > 0
      ? "CT が 1 増加"
      : "CT が 1 減少";

  div.textContent =
    `${event.skill} の ${text}`;

spawnFloatingNumber(
  event.unit,
  event.delta > 0 ? "CT+1" : "CT-1",
  event.delta > 0 ? "statDown" : "statUp"
);

}

  else if (event.type === "cooldownLimit") {

    div.textContent =
      `CT はこれ以上変化しない`;
  }

else if (event.type === "resonanceEffect") {

  div.textContent =
    `スキルの威力が +${event.percent}% 増加`;

spawnFloatingNumber(
  nextEvent?.target ?? nextEvent?.unit,
  `+${event.percent}%`,
  "statUp"
);

}

else if (event.type === "interferenceEffect") {

  div.textContent =
    `スキルの威力が -${event.percent}% 低下`;

spawnFloatingNumber(
  nextEvent?.target ?? nextEvent?.unit,
  `-${event.percent}%`,
  "statDown"
);

}

  else if (event.type === "meteorReflect") {

    div.textContent =
      `${displayName(event.target, nameMap)} に ${event.amount} ダメージを反射`;
  }

  else if (event.type === "meteorNoTarget") {

    div.textContent =
      `流星 を反射する相手がいなかった`;
  }

else if (event.type === "satelliteGuard") {

  div.textContent =
    `衛星 がダメージを ${event.percent}% 軽減した`;

spawnFloatingNumber(
  event.unit,
  `-${event.percent}%`,
  "statDown"
);

}

  else if (event.type === "wait") {

    div.textContent =
      `${displayName(event.unit, nameMap)} は様子をうかがっている……`;
  }

logArea.appendChild(div);
}
