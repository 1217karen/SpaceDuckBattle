//new-battle-effects.js

// 前半は旧部分

import { EFFECTS } from "./effects-config.js";
import { rollCritical } from "./battle-actions.js";

export function getEffectiveStat(unit, statName) {

  const base = (unit[statName] ?? 0) + 5;

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
// TECスケール計算
// ==========================================================
if (effectData.power !== undefined) {

  const tec = ctx.getEffectiveStat(source, "tec");

  const amount =
    Math.floor(tec * 0.2 * effectData.power);

  // stock型
  if (effectData.type && effectData.stock === undefined) {
    effectData.stock = amount;
  }

  // flat型
  if (effectData.stat && effectData.value === undefined) {
    effectData.value = amount;
  }

}

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

  // === level型 ===
  // ・stockを段階として加算 / 減算

  if (EFFECTS[effectData.type]?.stack === "level") {

    const delta = effectData.stock ?? 1;
    const MAX_LEVEL = 3;

    const existing =
      target.effects.find(e => e.type === effectData.type);

    if (existing) {

      const before = existing.stock ?? 0;

      const after =
        Math.max(
          0,
          Math.min(before + delta, MAX_LEVEL)
        );

      existing.stock = after;
      existing.group = effectData.group;

      ctx.pushLog({
        type: "effectApplied",
        block: "effect",
        source: source.id,
        target: target.id,
        effect: {
          ...existing,
          delta: delta
        }
      });

      return;
    }

    const level =
      Math.max(
        0,
        Math.min(delta, MAX_LEVEL)
      );

    if (level <= 0) return;

    const newEffect = {
      type: effectData.type,
      stock: level,
      group: effectData.group
    };

    target.effects.push(newEffect);

    ctx.pushLog({
      type: "effectApplied",
      block: "effect",
      source: source.id,
      target: target.id,
      effect: {
        ...newEffect,
        delta: level
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

export function removeRandomEffectByGroup(unit, group, ctx) {

  const list =
    getEffectsByGroup(unit, group);

  if (list.length === 0) return null;

  const index =
    Math.floor(Math.random() * list.length);

  const target = list[index];

  unit.effects =
    unit.effects.filter(e => e !== target);

  if (ctx) {
    ctx.pushLog({
      type: "effectRemoved",
      block: "effect",
      unit: unit.id,
      effect: {
        type: target.type
      }
    });
  }

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

if (net !== 0) {

  ctx.beginGroup({
    type: "effectTrigger",
    block: "effect",
    unit: unit.id,
    effect: net > 0 ? "gravity" : "float"
  });

  if (unit.skills && unit.skills.length > 0) {

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
        block: "effect",
        unit: unit.id,
        skill: s.type,
        delta: dir
      });
    }

  }

  ctx.endGroup();
}

if (gravityStock > 0 || floatStock > 0) {

  for (let i = unit.effects.length - 1; i >= 0; i--) {

    const e = unit.effects[i];

    if (e.type === "gravity" || e.type === "float") {

      e.stock = 0;

      ctx.pushLog({
        type: "effectExpired",
        block: "effect",
        unit: unit.id,
        effect: { type: e.type }
      });

      unit.effects.splice(i,1);

    }

  }

}

  // ========================================
  // corrosion / repair
  // ========================================
  
  const mhp = unit.mhp ?? unit.hp;
  
  for (let e of unit.effects) {

if (
  e.type !== "corrosion" &&
  e.type !== "repair"
)
  continue;

const stock =
  Math.min(e.stock ?? 0, MAX_STACK);

if (stock <= 0) continue;

ctx.beginGroup({
  type: "effectTrigger",
  block: "effect",
  unit: unit.id,
  effect: e.type
});

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
block: "effect",
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
block: "effect",
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

    ctx.endGroup();
  }
}

export function processAfterAction(unit, ctx) {

  if (!unit.effects) return;

  for (let i = unit.effects.length - 1; i >= 0; i--) {

    const e = unit.effects[i];

if (
  e.type !== "corrosion" &&
  e.type !== "repair" &&
  e.type !== "resonance" &&
  e.type !== "interference"
)
  continue;

    e.stock--;

    if (e.stock >= 0) {

ctx.pushLog({
  type: "effectDecay",
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


//ここからnew部分

export function runBeforeDamage(ctx, payload) {

  let { source, target, damage, type } = payload;

  // =========================
  // resonance / interference
  // =========================
  if (type === "normal" || type === "pierce") {

    let resonanceStock = 0;
    let interferenceStock = 0;

    if (source.effects) {
      for (const e of source.effects) {
        if (e.type === "resonance") resonanceStock += (e.stock ?? 0);
        if (e.type === "interference") interferenceStock += (e.stock ?? 0);
      }
    }

    const diff = resonanceStock - interferenceStock;

    if (diff !== 0) {

      ctx.beginGroup({
        type: "effectTrigger",
        block: "effect",
        unit: source.id,
        effect: diff > 0 ? "resonance" : "interference"
      });

      ctx.pushLog({
        type: diff > 0 ? "resonanceEffect" : "interferenceEffect",
        block: "effect",
        unit: source.id,
        percent: Math.abs(diff)
      });

      ctx.endGroup();
    }

    const modifier =
      Math.max(1 + (resonanceStock * 0.01) - (interferenceStock * 0.01), 0);

    damage = Math.floor(damage * modifier);
  }

  // =========================
  // satellite（軽減）
  // =========================
  if (damage > 0 && (type === "normal" || type === "pierce")) {

    const satellite =
      target.effects?.find(e => e.type === "satellite");

    if (satellite && satellite.stock > 0) {

      const df = ctx.getEffectiveStat(target, "def");
      const perStockRate = 0.01 + Math.floor(df / 10) * 0.01;

      const maxReduction = satellite.stock * perStockRate;
      const reductionRate = Math.min(maxReduction, 1);

      const reducedDamage =
        Math.max(Math.floor(damage * reductionRate), 1);

      damage = Math.max(damage - reducedDamage, 0);

      const usedStock =
        Math.min(
          Math.ceil(reductionRate / perStockRate),
          satellite.stock
        );

      satellite.stock -= usedStock;

      ctx.beginGroup({
        type: "effectTrigger",
        block: "effect",
        unit: target.id,
        effect: "satellite"
      });

      ctx.pushLog({
        type: "satelliteGuard",
        block: "effect",
        unit: target.id,
        percent: Math.round(reductionRate * 100)
      });

      ctx.endGroup();

      if (satellite.stock <= 0) {

        target.effects =
          target.effects.filter(e => e !== satellite);

        ctx.pushLog({
          type: "effectExpired",
          block: "effect",
          unit: target.id,
          effect: { type: "satellite" }
        });
      }
    }
  }

  return damage;
}


export function runAfterDamage(ctx, payload) {

  // =========================
  // meteor（反射）
  // =========================

  const { source, target, damage, type } = payload;

  if (damage <= 0) return;

  if (!(type === "normal" || type === "pierce")) return;

  const meteor =
    target.effects?.find(e => e.type === "meteor");

  if (!meteor || meteor.stock <= 0) return;

  const atk = ctx.getEffectiveStat(target, "atk");
  const reflectRate =
    Math.min(Math.max(atk, 1), 50) / 100;

  const reflectDamage =
    Math.max(Math.floor(damage * reflectRate), 1);

  meteor.stock--;

  ctx.beginGroup({
    type: "effectTrigger",
    block: "effect",
    unit: target.id,
    effect: "meteor"
  });

  if (source && source.hp > 0) {

    source.hp -= reflectDamage;

    ctx.pushLog({
      type: "damage",
      block: "effect",
      source: target.id,
      target: source.id,
      amount: reflectDamage,
      damageType: "meteor"
    });

    ctx.pushLog({
      type: "hpChange",
      target: source.id,
      hp: Math.max(source.hp, 0)
    });

    if (source.hp <= 0) {
      ctx.killUnit(source);
    }

  } else {

    ctx.pushLog({
      type: "meteorNoTarget",
      block: "effect",
      source: target.id
    });

  }

  ctx.endGroup();

  if (meteor.stock <= 0) {

    target.effects =
      target.effects.filter(e => e !== meteor);

    ctx.pushLog({
      type: "effectExpired",
      block: "effect",
      unit: target.id,
      effect: { type: "meteor" }
    });
  }
}
