//new-battle-effects.js
  
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
