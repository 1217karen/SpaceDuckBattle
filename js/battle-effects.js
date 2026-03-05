// battle-effects.js

export function getEffectiveStat(unit, statName) {

  const base = unit[statName] || 0;

  if (!unit.effects || unit.effects.length === 0) {
    return base;
  }

  let flatBonus = 0;
  let rateBonus = 0;

  for (let effect of unit.effects) {

    if (effect.stat !== statName) continue;

    if (effect.mode === "flat") {
      flatBonus += effect.value;
    }

    if (effect.mode === "rate") {
      rateBonus += effect.value;
    }

  }

  const afterFlat = base + flatBonus;
  const finalValue = afterFlat * (1 + rateBonus);

  return finalValue;
}

const CORROSION_RATE = 0.0025;
const MAX_STACK = 100;
const EFFECT_CAP = 25;

// ========================================
// 状態変化グループ
// ========================================

const BUFF_TYPES = new Set([
  "repair",
  "resonance",
  "accel",
  "float",
  "converge",
  "satellite"
]);

const DEBUFF_TYPES = new Set([
  "corrosion",
  "interference",
  "slow",
  "gravity",
  "diffuse",
  "meteor"
]);


export function applyEffect(source, target, action, ctx) {

  const effectData = action.effect;
  if (!effectData) return;

  // ========================================
// group自動設定
// ========================================

if (!effectData.group) {

  if (BUFF_TYPES.has(effectData.type)) {
    effectData.group = "buff";
  }

  else if (DEBUFF_TYPES.has(effectData.type)) {
    effectData.group = "debuff";
  }

}

  if (!target.effects) {
    target.effects = [];
  }

  // === corrosion / repair ===
  if (effectData.type === "corrosion" || effectData.type === "repair") {

    const existing =
      target.effects.find(e => e.type === effectData.type);

    if (existing) {

      existing.stock = Math.min(
        (existing.stock ?? 0) + (effectData.stock ?? 1),
        MAX_STACK
      );

      ctx.log.push({
        type: "effectApplied",
  source: source.id,
  target: target.id,
  effect: existing
      });

      return;
    }

    const newEffect = {
      type: effectData.type,
      stock: Math.min(effectData.stock ?? 1, MAX_STACK),
      group: effectData.group
    };

    target.effects.push(newEffect);

    ctx.log.push({
      type: "effectApplied",
  source: source.id,
  target: target.id,
  effect: existing
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

    ctx.log.push({
      type: "effectApplied",
  source: source.id,
  target: target.id,
  effect: existing
    });

    return;
  }

  // ターン制 rate
  const stat = effectData.stat;
  const newValue = effectData.value;
  const newDuration = effectData.duration;

  const existing = target.effects.find(
    e =>
      e.category === "timed" &&
      e.stat === stat &&
      e.mode === "rate"
  );

  if (!existing) {

    const newEffect = {
      category: "timed",
      stat: stat,
      mode: "rate",
      value: newValue,
      duration: newDuration
    };

    target.effects.push(newEffect);

    ctx.log.push({
      type: "effectApplied",
  source: source.id,
  target: target.id,
  effect: existing
    });

    return;
  }

  const absCurrent = Math.abs(existing.value);
  const absNew = Math.abs(newValue);

  if (absNew > absCurrent) {

    existing.value = newValue;
    existing.duration = newDuration;

    ctx.log.push({
      type: "effectApplied",
  source: source.id,
  target: target.id,
  effect: existing
    });

    return;
  }

  if (newValue === existing.value) {

    existing.duration += newDuration;

    ctx.log.push({
      type: "effectApplied",
  source: source.id,
  target: target.id,
  effect: existing
    });

    return;
  }

  const addedTotal = absNew * newDuration;
  const convertTurn =
    Math.floor(addedTotal / absCurrent);

  if (convertTurn > 0) {

    existing.duration += convertTurn;

    ctx.log.push({
      type: "effectApplied",
  source: source.id,
  target: target.id,
  effect: existing
    });

  }
}

export function getEffectsByGroup(unit, group) {
  if (!unit.effects) return [];
  return unit.effects.filter(e => e.group === group);
}

export function removeRandomEffectByGroup(unit, group) {

  const list = getEffectsByGroup(unit, group);
  if (list.length === 0) return null;

  const index = Math.floor(Math.random() * list.length);
  const target = list[index];

  unit.effects = unit.effects.filter(e => e !== target);

  return target;
}

export function processBeforeAction(unit, ctx) {

  if (!unit.effects || unit.effects.length === 0) return;
  if (unit.hp <= 0) return;

  const mhp = unit.mhp ?? unit.hp;

  for (let e of unit.effects) {

    if (e.type !== "corrosion" && e.type !== "repair") continue;

    const stock = Math.min(e.stock ?? 0, MAX_STACK);
    if (stock <= 0) continue;

const effectiveStock =
  Math.min(stock, EFFECT_CAP);

const rawAmount =
  Math.floor(mhp * CORROSION_RATE * effectiveStock);

const amount =
  Math.max(rawAmount, 1);

    if (e.type === "corrosion") {

      unit.hp -= amount;

      ctx.log.push({
        type: "attack",
        from: null,
        to: unit.id,
        amount: amount,
        damageType: "effect"
      });

if (unit.hp <= 0) {
  ctx.killUnit(unit);
  break;
}

    }

    else if (e.type === "repair") {

      unit.hp = Math.min(unit.hp + amount, mhp);

      ctx.log.push({
        type: "heal",
        from: null,
        to: unit.id,
        amount: amount,
        healType: "effect"
      });

    }

    ctx.log.push({
      type: "hpChange",
      target: unit.id,
      hp: unit.hp
    });

  }

}


export function processAfterAction(unit) {

  if (!unit.effects) return;

  for (let i = unit.effects.length - 1; i >= 0; i--) {

    const e = unit.effects[i];

    if (e.type !== "corrosion" && e.type !== "repair") continue;

    e.stock--;

    if (e.stock <= 0) {
      unit.effects.splice(i, 1);
    }

  }

}
