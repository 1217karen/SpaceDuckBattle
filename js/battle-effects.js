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


export function applyEffect(source, target, action, ctx) {

  const effectData = action.effect;
  
  if (!effectData) return;

  if (!target.effects) {
    target.effects = [];
  }

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


export function applyEffect(source, target, action, ctx) {

  const effectData = action.effect;

// ===============================
// 毎ターン発動系（腐食・修復）
// ===============================

if (effectData.effectType === "dot" ||
    effectData.effectType === "hot") {

  const newEffect = {
    category: "timed",
    effectType: effectData.effectType,
    value: effectData.value,
    duration: effectData.duration
  };

  target.effects.push(newEffect);

  ctx.log.push({
    type: "effectApplied",
    from: source.id,
    to: target.id,
    effect: newEffect
  });

  return;
}
  
  if (!effectData) return;

  if (!target.effects) {
    target.effects = [];
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
      from: source.id,
      to: target.id,
      effect: newEffect
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
      from: source.id,
      to: target.id,
      effect: newEffect
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
      from: source.id,
      to: target.id,
      effect: existing
    });

    return;
  }

  if (newValue === existing.value) {

    existing.duration += newDuration;

    ctx.log.push({
      type: "effectApplied",
      from: source.id,
      to: target.id,
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
      from: source.id,
      to: target.id,
      effect: existing
    });

  }
}
