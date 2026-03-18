// battlelog-ui.js

import {
  moveUnit,
  updateFacing,
  highlightCell,
  highlightCells,
  removeUnit
} from "./board.js";
import { EFFECTS } from "./effects-config.js";
import { getEffectiveStat } from "./battle-effects.js";

function displayName(id, nameMap) {
  return nameMap?.[id] || id;
}

function spawnFloatingNumber(unitId, value, type) {
  const wrapper =
    document.querySelector(`[data-unit-id="${unitId}"]`);

  if (!wrapper) return;

  const board =
    document.getElementById("board");

  const rect =
    wrapper.getBoundingClientRect();

  const boardRect =
    board.getBoundingClientRect();

  const num = document.createElement("div");

  num.classList.add("floatingNumber");

  if (type === "skill") {
    num.classList.add("skillNumber");
  }

  if (type === "damage") {
    num.classList.add("damageNumber");
  }

  if (type === "heal") {
    num.classList.add("healNumber");
  }

  if (type === "statUp") {
    num.classList.add("statUpNumber");
  }

  if (type === "statDown") {
    num.classList.add("statDownNumber");
  }

  if (type === "critical") {
    num.classList.add("criticalNumber");
  }

  if (type === "effectTrigger") {
    num.classList.add("effectTriggerNumber");
  }

  if (type === "effectApply") {
    num.classList.add("effectApplyNumber");
  }

  if (type === "effectEnd") {
    num.classList.add("effectEndNumber");
  }

  num.textContent = value;

  num.style.position = "absolute";

  num.style.left =
    (rect.left - boardRect.left + rect.width / 2) + "px";

  num.style.top =
    (rect.top - boardRect.top + 5) + "px";

  board.appendChild(num);

  num.addEventListener("animationend", () => {
    num.remove();
  });
}

export function updateUnitEffectUI(unitId, boardState) {
  const unit = boardState.units[unitId];
  if (!unit) return;

  const container =
    document.querySelector(
      `.unitStatus[data-unit="${unitId}"]`
    );

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

  for (const e of unit.effects || []) {
    if (counts.hasOwnProperty(e.type)) {
      counts[e.type] = e.stock ?? 1;
    }
  }

  const mapping = [
    ["float", 0],
    ["accel", 1],
    ["resonance", 2],
    ["repair", 3],
    ["satellite", 4],
    ["gravity", 5],
    ["slow", 6],
    ["interference", 7],
    ["corrosion", 8],
    ["meteor", 9]
  ];

  const items =
    container.querySelectorAll(".effectItem");

  for (const [type, index] of mapping) {
    const item = items[index];
    const el =
      item?.querySelector(".effectCount");

    if (!el) continue;

    const v = counts[type] ?? 0;

    el.textContent =
      String(v).padStart(2, "0");

    if (v > 0) {
      item.classList.add("active");
    } else {
      item.classList.remove("active");
    }
  }
}

export function updateUnitStatUI(unitId, boardState) {
  const unit = boardState.units[unitId];
  if (!unit) return;

  const container =
    document.querySelector(
      `.unitStatus[data-unit="${unitId}"]`
    );

  if (!container) return;

  const statMap = {
    atk: "ATK",
    def: "DEF",
    heal: "HEAL",
    speed: "SPD",
    cri: "CRI",
    tec: "TEC"
  };

  for (const [key, label] of Object.entries(statMap)) {
    const item = container.querySelector(
      `.statItem[data-stat="${key}"]`
    );

    if (!item) continue;

    const valueEl =
      item.querySelector(".statValue");

    const rateEl =
      item.querySelector(".statRate");

    if (!valueEl) continue;

    let base = unit[key] ?? 0;

    const value = getEffectiveStat(unit, key);

    valueEl.textContent = value;

    // ======================
    // rate表示計算
    // ======================

    let rate = 0;
    let turn = 0;

    for (const e of unit.rateEffects || []) {
      if (e.stat === key) {
        rate = e.value;
        turn = e.duration ?? 0;
        break;
      }
    }

    if (rateEl) {
      if (rate !== 0) {
        const percent =
          Math.round(rate * 100);

        const sign =
          percent > 0 ? "+" : "";

        rateEl.textContent =
          `${sign}${percent}%(${turn})`;
      } else {
        rateEl.textContent = "";
      }
    }
  }
}

function updateSkillCooldownUI(unitId, boardState) {

  const unit = boardState.units[unitId];
  if (!unit) return;

  const container =
    document.querySelector(
      `.unitStatus[data-unit="${unitId}"]`
    );

  if (!container) return;

  const slots =
    container.querySelectorAll(".skillSlot");

  slots.forEach(slot => {

    const skill = slot.dataset.skill;
    if (!skill) return;

    const ct =
      unit.cooldowns?.[skill] ?? 0;

    if (ct > 0) {
      slot.classList.add("cooldown");
    } else {
      slot.classList.remove("cooldown");
    }

  });
}

export function playLogEvent(
  event,
  nextEvent,
  boardState,
  logArea,
  nameMap,
  depth
) {
  const div = document.createElement("div");

  div.style.marginLeft =
    (depth * 12) + "px";

  if (event.type === "turnStart") {
    return;
  }

    else if (event.type === "turnUnit") {

  const name =
    displayName(event.unit, nameMap);

  div.textContent = name;

}

  else if (event.type === "hpChange") {
    const unit =
      boardState.units[event.target];

    if (unit) {
      unit.hp = event.hp;
    }

    const bar = document.querySelector(
      `.unitStatus[data-unit="${event.target}"] .hpFill`
    );

    if (bar) {
      const max = unit?.mhp || 1;
      const rate =
        Math.max(event.hp / max, 0);

      bar.style.width =
        (rate * 100) + "%";
    }

    const text = document.querySelector(
      `.unitStatus[data-unit="${event.target}"] .hpText`
    );

    if (text) {
      const max = unit?.mhp || event.hp;
      text.textContent =
        `HP ${event.hp}/${max}`;
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

    div.classList.add("logEffect");

    const name =
      EFFECTS[event.effect]?.name ||
      event.effect;

    div.textContent =
      `${displayName(event.unit, nameMap)} の ${name}`;

      spawnFloatingNumber(
        event.unit,
        name,
        "effectTrigger"
      );
    }

  else if (event.type === "skillUse") {

    div.classList.add("logSkill");

    div.textContent =
      `${displayName(event.unit, nameMap)} の ${event.skill}`;

      spawnFloatingNumber(
        event.unit,
        "SKILL",
        "skill"
      );

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

  else if (event.type === "cooldownSet") {

    const unit = boardState.units[event.unit];
    if (!unit) return;

    unit.cooldowns = unit.cooldowns || {};

    unit.cooldowns[event.skill] = event.value;

    updateSkillCooldownUI(event.unit, boardState);

    return;
  }

else if (event.type === "cooldownChange") {

  const unit = boardState.units[event.unit];
  if (!unit) return;

  unit.cooldowns = unit.cooldowns || {};

  const current =
    unit.cooldowns[event.skill] ?? 0;

  unit.cooldowns[event.skill] =
    Math.max(current + event.delta, 0);

 updateSkillCooldownUI(event.unit, boardState);

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

        img.addEventListener(
          "animationend",
          () => {
            img.classList.remove("shake");
          },
          { once: true }
        );
      }
    }

    if (event.damageType === "effect") {
      div.innerHTML =
        `侵食 で <span class="logNumber">${event.amount}</span> ダメージ`;
    }

    else if (event.damageType === "meteor") {
      div.innerHTML =
        `${displayName(event.target, nameMap)} に <span class="logNumber">${event.amount}</span> ダメージを反射`;
    }

    else {
      div.innerHTML =
        `${displayName(event.target, nameMap)} に <span class="logNumber">${event.amount}</span> ダメージ`;
    }

    spawnFloatingNumber(
      event.target,
      event.amount,
      "damage"
    );
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

      img.addEventListener(
        "animationend",
        () => {
          img.classList.remove("bounce");
        },
        { once: true }
      );
    }

    if (event.healType === "effect") {
      div.innerHTML =
        `修復 の効果でHPが <span class="logNumber">${event.amount}</span> 回復`;
    }

    else {
      div.innerHTML =
        `${displayName(event.target, nameMap)} のHPが <span class="logNumber">${event.amount}</span> 回復`;
    }

    spawnFloatingNumber(
      event.target,
      event.amount,
      "heal"
    );
  }

  else if (event.type === "effectDecay") {
    const e = event.effect;

    if (boardState.units[event.unit]) {
      const unit =
        boardState.units[event.unit];

      const existing =
        unit.effects.find(x => x.type === e.type);

      if (existing) {
        existing.stock = e.stock;
      }

      updateUnitEffectUI(
        event.unit,
        boardState
      );
    }

    const name =
      EFFECTS[e.type]?.name || e.type;

    spawnFloatingNumber(
      event.unit,
      `${name}-1`,
      "effectEnd"
    );

    div.textContent =
      `${name} が 1 減少 (${e.stock})`;
  }

  else if (event.type === "effectExpired") {
    const e = event.effect;

    if (boardState.units[event.unit]) {
      const unit =
        boardState.units[event.unit];

      unit.effects =
        unit.effects.filter(
          x => x.type !== e.type
        );

      updateUnitEffectUI(
        event.unit,
        boardState
      );
    }

    const name =
      EFFECTS[e.type]?.name || e.type;

    return;
  }

  else if (event.type === "effectRemoved") {
    const e = event.effect;

    const unit =
      boardState.units[event.unit];

    const name =
      EFFECTS[e.type]?.name || e.type;

    // ==========================
    // clearEffect（全解除）
    // ==========================

    if (event.effect?.clear === true) {
      spawnFloatingNumber(
        event.unit,
        `${name}=0`,
        "effectRemove"
      );

      div.innerHTML =
        `${displayName(event.unit, nameMap)} の ${name} を全解除`;

      if (unit) {
        unit.effects =
          unit.effects.filter(
            x => x.type !== e.type
          );

        updateUnitEffectUI(
          event.unit,
          boardState
        );
      }

      logArea.appendChild(div);
      return;
    }

    let oldStock = 0;

    if (unit) {
      const existing =
        unit.effects.find(
          x => x.type === e.type
        );

      if (existing) {
        oldStock = existing.stock ?? 1;
      }
    }

    const stackType =
      EFFECTS[e.type]?.stack;

    // ==========================
    // stack型
    // ==========================

    if (stackType === "stock") {
      const amount =
        oldStock - (existing?.stock ?? 0);

      const current =
        existing?.stock ?? 0;

      spawnFloatingNumber(
        event.unit,
        `${name}-${amount}`,
        "effectRemove"
      );

      div.innerHTML =
        `${displayName(event.unit, nameMap)} の ${name} を <span class="logNumber">${amount}</span> 解除 (${current})`;
    }

    // ==========================
    // level型
    // ==========================

    else if (stackType === "level") {
      const current =
        existing?.stock ?? 0;

      const amount =
        oldStock - current;

      spawnFloatingNumber(
        event.unit,
        `${name}-${amount}`,
        "effectRemove"
      );

      div.innerHTML =
        `${displayName(event.unit, nameMap)} の ${name} が <span class="logNumber">${amount}</span> 段階下降 (${current})`;
    }

    // ==========================
    // 状態削除
    // ==========================

    if (unit) {
      unit.effects =
        unit.effects.filter(
          x => x.type !== e.type
        );

      updateUnitEffectUI(
        event.unit,
        boardState
      );
    }
  }

  else if (event.type === "effectApplied") {
    const e = event.effect;

    const unitState =
      boardState.units[event.target];

    const name =
      EFFECTS[e.type]?.name || e.type;

    let text = "";
    let isBuff = true;

    // ==========================
    // stock型
    // ==========================

    if (EFFECTS[e.type]?.stack === "stock") {
      const delta =
        event.effect.delta ?? 1;

      const n =
        e.stock ?? delta;

      spawnFloatingNumber(
        event.target,
        `${name}+${delta}`,
        "effectApply"
      );

      isBuff =
        EFFECTS[e.type]?.group?.startsWith("buff");

      text =
        `${displayName(event.target, nameMap)} に ${name} を <span class="logNumber">${delta}</span> 付与 (${n})`;
    }

    // ==========================
    // level型
    // ==========================

    else if (EFFECTS[e.type]?.stack === "level") {
      const delta =
        event.effect.delta ?? 1;

      const n =
        e.stock ?? delta;

      spawnFloatingNumber(
        event.target,
        `${name}+${delta}`,
        "effectApply"
      );

      isBuff =
        EFFECTS[e.type]?.group?.startsWith("buff");

      text =
        `${displayName(event.target, nameMap)} の ${name} が <span class="logNumber">${delta}</span> 段階上昇 (${n})`;
    }

    // ==========================
    // rate系
    // ==========================

    else if (e.mode === "rate") {
      const percent =
        Math.round(Math.abs(e.value) * 100);

      const stat =
        e.stat.toUpperCase();

      const turn =
        e.duration ?? 0;

      const result =
        e.result;

      const isUp = e.value >= 0;

      const word =
        isUp ? "強化" : "弱化";

      const floatType =
        isUp ? "statUp" : "statDown";

      const floatText =
        `${stat}${isUp ? "+" : "-"}${percent}%`;

      if (result === "apply" || result === "overwrite") {
        text =
          `${displayName(event.target, nameMap)} の ${stat} が ${turn}ターンの間 ${percent}% ${word}`;

        spawnFloatingNumber(
          event.target,
          floatText,
          floatType
        );
      }

      else if (result === "extend") {
        text =
          `${displayName(event.target, nameMap)} の ${stat} ${percent}% ${word}が ${turn}ターンに延長`;

        spawnFloatingNumber(
          event.target,
          `${stat}+T${turn}`,
          "effectApply"
        );
      }

      else if (result === "cancel") {
        text =
          `${displayName(event.target, nameMap)} の ${stat} ${percent}% ${word}が ${turn}ターンに短縮`;

        spawnFloatingNumber(
          event.target,
          `${stat}-T`,
          "effectApply"
        );
      }

        else if (result === "turnDecay") {

  text =
    `${stat}${isUp ? "+" : "-"}${percent}% が 残り${turn}ターンに減少`;

  spawnFloatingNumber(
    event.target,
    `${stat}-T`,
    "effectEnd"
  );
}

else if (result === "turnEnd") {

  text =
    `${stat}${isUp ? "+" : "-"}${percent}% が 終了`;

  spawnFloatingNumber(
    event.target,
    `${stat} END`,
    "effectEnd"
  );
}

      else if (result === "none") {
        text =
          `${displayName(event.target, nameMap)} の ${stat} への効果は変化しなかった`;
      }
    }

    // ==========================
    // flat系
    // ==========================

    else {
      const amount =
        Math.round(Math.abs(e.value));

      const stat =
        e.stat.toUpperCase();

      const word =
        e.value >= 0 ? "増加" : "減少";

      spawnFloatingNumber(
        event.target,
        `${stat}${e.value >= 0 ? "+" : "-"}${amount}`,
        e.value >= 0 ? "statUp" : "statDown"
      );

      isBuff =
        e.value >= 0;

      text =
        `${displayName(event.target, nameMap)} の ${stat} が ${amount} ${word}`;
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

      img.addEventListener(
        "animationend",
        () => {
          img.classList.remove(cls);
        },
        { once: true }
      );
    }

    if (boardState.units[event.target]) {
      const unit =
        boardState.units[event.target];

      unit.effects =
        unit.effects || [];

      // stock

      if (
        event.effect.type &&
        event.effect.stock !== undefined
      ) {
        let existing =
          unit.effects.find(
            e => e.type === event.effect.type
          );

        if (existing) {
          existing.stock =
            event.effect.stock;
        } else {
          unit.effects.push({
            type: event.effect.type,
            stock: event.effect.stock
          });
        }
      }

      // flat

      else if (event.effect.mode === "flat") {
        unit.effects.push({
          ...event.effect
        });
      }

      // rate

      else if (event.effect.mode === "rate") {
        unit.rateEffects =
          unit.rateEffects || [];

        const stat =
          event.effect.stat;

        let existing =
          unit.rateEffects.find(
            e => e.stat === stat
          );

        if (event.effect.result === "apply") {
          unit.rateEffects.push({
            stat: stat,
            value: event.effect.value,
            duration: event.effect.duration
          });
        }

        else if (event.effect.result === "overwrite") {
          if (existing) {
            existing.value =
              event.effect.value;

            existing.duration =
              event.effect.duration;
          }
        }

        else if (event.effect.result === "extend") {
          if (existing) {
            existing.duration =
              event.effect.duration;
          }
        }

        else if (event.effect.result === "cancel") {
          if (existing) {
            existing.duration =
              event.effect.duration;

            if (existing.duration <= 0) {
              unit.rateEffects =
                unit.rateEffects.filter(
                  e => e !== existing
                );
            }
          }
        }
      }

      updateUnitEffectUI(
        event.target,
        boardState
      );

      updateUnitStatUI(
        event.target,
        boardState
      );
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
    const amount =
      Math.abs(event.delta);

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

  else if (event.type === "cooldownLimit") {
    div.textContent =
      `CT はこれ以上変化しない`;
  }

  else if (event.type === "resonanceEffect") {
    div.textContent =
      `スキルの威力が +${event.percent}% 増加`;

    spawnFloatingNumber(
      event.unit,
      `+${event.percent}%`,
      "statUp"
    );
  }

  else if (event.type === "interferenceEffect") {
    div.textContent =
      `スキルの威力が -${event.percent}% 低下`;

    spawnFloatingNumber(
      event.unit,
      `-${event.percent}%`,
      "statDown"
    );
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
      "statUp"
    );
  }

　else if (event.type === "wait") {
　  div.textContent =
　    `${displayName(event.unit, nameMap)} は様子をうかがっている……`;

　  spawnFloatingNumber(
　    event.unit,
　    "STAY",
　    "skill"
　  );
　}

  logArea.appendChild(div);
}
