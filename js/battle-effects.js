// battle-effects.js

import { EFFECTS } from "./effects-config.js";
import { rollCritical } from "./battle-actions.js";

export function getEffectiveStat(unit, statName) {

  const base = unit[statName] || 0;

  let flatBonus = 0;
  let rateBonus = 0;

  // flat は effects から取得
  if (unit.effects) {

    for (let effect of unit.effects) {

      if (effect.stat !== statName) continue;

      if (effect.mode === "flat") {
        flatBonus += effect.value;
      }

    }

  }

  // rate は rateEffects から取得
  if (unit.rateEffects) {

    for (let effect of unit.rateEffects) {

      if (effect.stat !== statName) continue;

      rateBonus += effect.value;

    }

  }

  const afterFlat = base + flatBonus;
  const finalValue = afterFlat * (1 + rateBonus);

  return Math.round(finalValue);
}

const CORROSION_RATE = 0.0025;
const MAX_STACK = 99;
const EFFECT_CAP = 25;

export function applyEffect(source, target, action, ctx) {

  const effectData = action.effect;
  if (!effectData) return;

// ==========================================================
// クリティカル
// ==========================================================

if (rollCritical(source)) {

ctx.pushLog({
  type: "critical",
  groupLevel: ctx.groupLevel,
  subLevel: 1,
  block: "skill"
});

  if (effectData.stock !== undefined) {
    effectData.stock =
      Math.ceil(effectData.stock * 1.5);
  }

  if (effectData.value !== undefined) {
    effectData.value =
      effectData.value * 1.5;
  }

}

  // ========================================
  // group自動設定
  // ========================================

  if (!effectData.group) {

    const def = EFFECTS[effectData.type];

    if (def?.group) {
      effectData.group = def.group;
    }
  }

  if (!target.effects) {
    target.effects = [];
  }

  // === stock型===
  // ・stockは加算（上限あり）

  if (EFFECTS[effectData.type]?.stack === "stock") {

    const existing =
      target.effects.find(e => e.type === effectData.type);

    if (existing) {

      const addAmount = effectData.stock ?? 1;

      existing.stock = Math.min(
        (existing.stock ?? 0) + addAmount,
        MAX_STACK
      );

      existing.group = effectData.group;

ctx.pushLog({
  type: "effectApplied",
  groupLevel: ctx.groupLevel + 1,
  subLevel: 1,
  block: "effect",
  source: source.id,
  target: target.id,
  effect: {
          ...existing,
          delta: addAmount
        }
      });

      return;
    }

    const newEffect = {
      type: effectData.type,
      stock: Math.min(effectData.stock ?? 1, MAX_STACK),
      group: effectData.group
    };

    target.effects.push(newEffect);

ctx.pushLog({
  type: "effectApplied",
  groupLevel: ctx.groupLevel + 1,
  subLevel: 1,
  block: "effect",
  source: source.id,
  target: target.id,
  effect: {
        ...newEffect,
        delta: newEffect.stock
      }
    });

    return;
  }

  // === 上書き型===
  // ・stockは加算しない（強い方に上書き）

  if (EFFECTS[effectData.type]?.stack === "overwrite") {

    const incomingStock =
      Math.min(effectData.stock ?? 1, MAX_STACK);

    const existing =
      target.effects.find(e => e.type === effectData.type);

    if (existing) {

      const currentStock = existing.stock ?? 0;

      // 強い方に上書き（同値以下は変更なし）
      if (incomingStock > currentStock) {
        existing.stock = incomingStock;
      }

      existing.group = effectData.group;

ctx.pushLog({
  type: "effectApplied",
  groupLevel: ctx.groupLevel + 1,
  subLevel: 1,
  block: "effect",
  source: source.id,
  target: target.id,
  effect: {
          ...existing,
          delta: incomingStock
        }
      });

      return;
    }

    const newEffect = {
      type: effectData.type,
      stock: incomingStock,
      group: effectData.group
    };

    target.effects.push(newEffect);

ctx.pushLog({
  type: "effectApplied",
  groupLevel: ctx.groupLevel + 1,
  subLevel: 1,
  block: "effect",
  source: source.id,
  target: target.id,
  effect: {
        ...newEffect,
        delta: newEffect.stock
      }
    });

    return;
  }

  // 永続 flat

  if (effectData.duration === null) {

    const stackKey = effectData.stat + "_flat";
    const DIMINISH = 0.75;

    const stackCount =
      target.effects.filter(
        e => e.stackKey === stackKey
      ).length;

    const finalValue =
      effectData.value *
      Math.pow(DIMINISH, stackCount);

    const newEffect = {
      category: "permanent",
      stat: effectData.stat,
      mode: "flat",
      value: finalValue,
      duration: null,
      stackKey: stackKey
    };

    target.effects.push(newEffect);

ctx.pushLog({
  type: "effectApplied",
  groupLevel: ctx.groupLevel + 1,
  subLevel: 1,
  block: "effect",
  source: source.id,
  target: target.id,
  effect: { ...newEffect }
    });

    return;
  }

// ==========================================================
// rate effect（専用システム）
// ==========================================================

if (effectData.duration !== undefined) {

  if (!target.rateEffects) {
    target.rateEffects = [];
  }

  const stat = effectData.stat;
  const value = effectData.value;
  const duration = effectData.duration;

  const existing =
    target.rateEffects.find(e => e.stat === stat);

  if (existing) {

    const A = existing.value;
    const T = existing.duration;

    const B = value;
    const U = duration;

    let result = "apply";

    const absA = Math.abs(A);
    const absB = Math.abs(B);

    if (absB > absA) {

      existing.value = B;
      existing.duration = U;

      result = "overwrite";

    }

    else if (B === A) {

      existing.duration += U;

      result = "extend";

    }

    else {

      const added =
        Math.floor(absB * U / absA);

      if (added === 0) {

        ctx.pushLog({
          type: "effectApplied",
          groupLevel: ctx.groupLevel + 1,
          subLevel: 1,
          block: "effect",
          source: source.id,
          target: target.id,
          effect: {
            stat: stat,
            mode: "rate",
            value: B,
            duration: existing.duration,
            result: "none"
          }
        });

        return;
      }

      if (Math.sign(A) === Math.sign(B)) {

        existing.duration += added;

        if (added > 0) result = "extend";

      }

      else {

        existing.duration -= added;

        if (added > 0) result = "cancel";

      }

      if (existing.duration <= 0) {

        target.rateEffects =
          target.rateEffects.filter(e => e !== existing);

        return;
      }

    }

    ctx.pushLog({
      type: "effectApplied",
      groupLevel: ctx.groupLevel + 1,
      subLevel: 1,
      block: "effect",
      source: source.id,
      target: target.id,
      effect: { ...existing, result }
    });

    return;
  }

  const newEffect = {
    stat: stat,
    mode: "rate",
    value: value,
    duration: duration
  };

  target.rateEffects.push(newEffect);

  ctx.pushLog({
    type: "effectApplied",
    groupLevel: ctx.groupLevel + 1,
    subLevel: 1,
    block: "effect",
    source: source.id,
    target: target.id,
    effect: { ...newEffect, result: "apply" }
  });

  return;
}
}

export function getEffectsByGroup(unit, group) {

  if (!unit.effects) return [];

  return unit.effects.filter(
    e => e.group === group
  );
}

export function removeRandomEffectByGroup(unit, group) {

  const list =
    getEffectsByGroup(unit, group);

  if (list.length === 0) return null;

  const index =
    Math.floor(Math.random() * list.length);

  const target = list[index];

  unit.effects =
    unit.effects.filter(e => e !== target);

  return target;
}

export function processBeforeAction(unit, ctx) {

  if (!unit.effects || unit.effects.length === 0) return;
  if (unit.hp <= 0) return;

  // ========================================
  // gravity / float（行動開始時にCTをランダム増減）
  // ========================================

  let gravityStock = 0;
  let floatStock = 0;

  for (const e of unit.effects) {

    if (e.type === "gravity")
      gravityStock = Math.max(gravityStock, e.stock ?? 0);

    if (e.type === "float")
      floatStock = Math.max(floatStock, e.stock ?? 0);
  }

  const net = gravityStock - floatStock;

if (net > 0) {

ctx.pushLog({
  type: "effectTrigger",
  groupLevel: ctx.groupLevel + 1,
  subLevel: 0,
  block: "effect",
  unit: unit.id,
  effect: "gravity"
});

}

else if (net < 0) {

ctx.pushLog({
  type: "effectTrigger",
  groupLevel: ctx.groupLevel + 1,
  subLevel: 0,
  block: "effect",
  unit: unit.id,
  effect: "float"
});

}

  if (net !== 0 && unit.skills && unit.skills.length > 0) {

    const steps = Math.abs(net);
    const dir = net > 0 ? +1 : -1;

    for (let i = 0; i < steps; i++) {

      const eligible = [];

      for (const s of unit.skills) {

        const maxCt =
          ctx.getSkillMaxCooldown?.(s.type) ?? 0;

        const cur =
          s._currentCooldown ?? 0;

        if (dir > 0) {

          if (maxCt > 0 && cur < maxCt)
            eligible.push({ s, maxCt, cur });

        } else {

          if (cur > 0)
            eligible.push({ s, maxCt, cur });

        }
      }

      if (eligible.length === 0) {

ctx.pushLog({
  type: "cooldownLimit",
  groupLevel: ctx.groupLevel + 1,
  subLevel: 1,
  block: "effect",
  unit: unit.id
});

        break;
      }

      const pick =
        eligible[Math.floor(Math.random() * eligible.length)];

      const s = pick.s;

      const maxCt = pick.maxCt ?? 0;
      const cur = s._currentCooldown ?? 0;

      let newCt;

      if (dir > 0) {
        newCt = Math.min(cur + 1, maxCt);
      } else {
        newCt = Math.max(cur - 1, 0);
      }

      s._currentCooldown = newCt;

ctx.pushLog({
  type: "cooldownChange",
  groupLevel: ctx.groupLevel + 1,
  subLevel: 1,
  block: "effect",
  unit: unit.id,
  skill: s.type,
  delta: dir
});
    }
  }

  if (gravityStock > 0 || floatStock > 0) {

    unit.effects =
      unit.effects.filter(
        e => e.type !== "gravity" && e.type !== "float"
      );
  }

  const mhp = unit.mhp ?? unit.hp;

  for (let e of unit.effects) {

if (e.type !== "corrosion" && e.type !== "repair")
  continue;

ctx.pushLog({
  type: "effectTrigger",
  groupLevel: ctx.groupLevel + 1,
  subLevel: 0,
  block: "effect",
  unit: unit.id,
  effect: e.type
});

const stock =
  Math.min(e.stock ?? 0, MAX_STACK);

    if (stock <= 0) continue;

    const effectiveStock =
      Math.min(stock, EFFECT_CAP);

    const rawAmount =
      Math.floor(mhp * CORROSION_RATE * effectiveStock);

    const amount =
      Math.max(rawAmount, 1);

    if (e.type === "corrosion") {

      unit.hp -= amount;

ctx.pushLog({
  type: "damage",
  groupLevel: ctx.groupLevel + 1,
  subLevel: 1,
  from: null,
  target: unit.id,
  amount: amount,
  damageType: "effect"
});

      if (unit.hp <= 0) {

        ctx.killUnit(unit);
        break;
      }
    }

    else if (e.type === "repair") {

      unit.hp =
        Math.min(unit.hp + amount, mhp);

ctx.pushLog({
  type: "heal",
  groupLevel: ctx.groupLevel + 1,
  subLevel: 1,
  from: null,
  target: unit.id,
  amount: amount,
  healType: "effect"
});
    }

    ctx.pushLog({
      type: "hpChange",
      target: unit.id,
      hp: unit.hp
    });
  }
}

export function processAfterAction(unit, ctx) {

  if (!unit.effects) return;

  for (let i = unit.effects.length - 1; i >= 0; i--) {

    const e = unit.effects[i];

    if (e.type !== "corrosion" && e.type !== "repair")
      continue;

    e.stock--;

    if (e.stock > 0) {

ctx.pushLog({
  type: "effectDecay",
  groupLevel: ctx.groupLevel + 1,
  subLevel: 1,
  block: "effect",
        unit: unit.id,
        effect: {
          type: e.type,
          stock: e.stock
        }
      });
    }

    if (e.stock <= 0) {

ctx.pushLog({
  type: "effectExpired",
  groupLevel: ctx.groupLevel + 1,
  subLevel: 1,
  block: "effect",
        unit: unit.id,
        effect: {
          type: e.type
        }
      });

      unit.effects.splice(i, 1);
    }
  }
}
