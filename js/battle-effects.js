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
export function processOverTimeEffects(units, ctx) {

  for (let unit of units) {

    if (!unit.effects) continue;
    if (unit.hp <= 0) continue;

    for (let i = unit.effects.length - 1; i >= 0; i--) {

      const e = unit.effects[i];

      if (e.kind !== "overTime") continue;

      const baseHp = unit.mhp ?? unit.hp;

      const amount =
        Math.floor(baseHp * e.value * e.stock);

      if (amount <= 0) continue;

      if (e.subType === "damage") {

        unit.hp -= amount;

        ctx.log.push({
          type: "attack",
          from: null,
          to: unit.id,
          amount: amount,
          damageType: "effect"
        });

      }
      else if (e.subType === "heal") {

        unit.hp = Math.min(
          unit.hp + amount,
          unit.mhp ?? unit.hp
        );

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

      // ストック減衰
      e.stock--;

      if (e.stock <= 0) {
        unit.effects.splice(i, 1);
      }
    }
  }
}
