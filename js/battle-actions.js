// battle-actions.js

//==========================================================
// 妨害 / 共振倍率
//==========================================================

function getResonanceModifier(unit) {

  let resonanceStock = 0;
  let interferenceStock = 0;

  if (unit.effects) {

    for (const e of unit.effects) {

      if (e.type === "resonance") {
        resonanceStock += (e.stock ?? 0);
      }

      if (e.type === "interference") {
        interferenceStock += (e.stock ?? 0);
      }

    }

  }

  return Math.max(
    1 + (resonanceStock * 0.01)
      - (interferenceStock * 0.01),
    0
  );
}

function getResonanceLog(unit, ctx){

  let resonanceStock = 0;
  let interferenceStock = 0;

  if (unit.effects) {

    for (const e of unit.effects) {

      if (e.type === "resonance") {
        resonanceStock += (e.stock ?? 0);
      }

      if (e.type === "interference") {
        interferenceStock += (e.stock ?? 0);
      }

    }

  }

  const diff = resonanceStock - interferenceStock;

  if (diff === 0) return;

  const percent = Math.abs(diff) * 1;

  if (diff > 0) {

    ctx.pushLog({
      type: "effectTrigger",
      groupLevel: ctx.groupLevel + 1,
      subLevel: 0,
      block: "effect",
      unit: unit.id,
      effect: "resonance"
    });

    ctx.pushLog({
      type: "resonanceEffect",
      groupLevel: ctx.groupLevel + 1,
      subLevel: 1,
      block: "effect",
      percent: percent
    });

  }

  else {

    ctx.pushLog({
      type: "effectTrigger",
      groupLevel: ctx.groupLevel + 1,
      subLevel: 0,
      block: "effect",
      unit: unit.id,
      effect: "interference"
    });

    ctx.pushLog({
      type: "interferenceEffect",
      groupLevel: ctx.groupLevel + 1,
      subLevel: 1,
      block: "effect",
      percent: percent
    });

  }

}

//==========================================================
// クリティカル判定
//==========================================================

export function rollCritical(unit) {
  const cri = unit.cri ?? 0;

  const chance =
    Math.min(Math.max(cri, 1), 90); // 1%保証 / 90%上限

  return Math.random() * 100 < chance;
}

//========================================================== 
// ダメージ処理 
//==========================================================
export function applyDamage(source, target, action, ctx) {

  let finalDamage = 0;
  let isCritical = false;

  const power = action.power || 0;
  const type = action.damageType || "normal";

if (type === "normal") {
  const atk = ctx.getEffectiveStat(source, "atk");
  const df = ctx.getEffectiveStat(target, "df");

  const base = atk * power;
  const reduced = df * 0.5;

  finalDamage = Math.max(
    Math.floor(base - reduced),
    0
  );
  
}

else if (type === "pierce") {
  const atk = ctx.getEffectiveStat(source, "atk");

  finalDamage =
    Math.floor(atk * power);
}

  else if (type === "fixed" || type === "effect") {
    finalDamage = power;
  }

  // ==========================================================
// クリティカル
// ==========================================================

if (
  finalDamage > 0 &&
  (type === "normal" || type === "pierce")
) {

  if (rollCritical(source)) {

    isCritical = true;

    finalDamage =
      Math.floor(finalDamage * 1.5);

ctx.pushLog({
  type: "critical",
  groupLevel: ctx.groupLevel,
  subLevel: 1,
  block: "skill"
});
  }

}
  
//========================================================== 
// 距離減衰
//==========================================================
  if (action.falloff) {

    const distance =
      ctx.getChebyshevDistance(source, target);

    if (distance > 1) {

      const FALLOFF_RATE = 0.2;

      const multiplier =
        1 - (distance - 1) * FALLOFF_RATE;

      finalDamage =
        Math.floor(finalDamage * Math.max(multiplier, 0));

    }
  }

// ================================
// 妨害 / 共振（normal / pierceのみ）
// ================================

if (type === "normal" || type === "pierce") {

getResonanceLog(source, ctx);

const modifier =
  getResonanceModifier(source);

finalDamage =
  Math.floor(finalDamage * modifier);

}

  // ==========================================================
// 衛星（satellite）ダメージ軽減
// ==========================================================

if (
  finalDamage > 0 &&
  (type === "normal" || type === "pierce")
) {

  const satellite =
    target.effects?.find(e => e.type === "satellite");

  if (satellite && satellite.stock > 0) {

    const maxReduction =
      satellite.stock * 0.05;

    const reductionRate =
      Math.min(maxReduction, 1);

const reducedDamage =
  Math.max(
    Math.floor(finalDamage * reductionRate),
    1
  );

    finalDamage =
      Math.max(finalDamage - reducedDamage, 0);

    const usedStock =
      Math.min(
        Math.ceil(reductionRate / 0.05),
        satellite.stock
      );

    satellite.stock -= usedStock;

ctx.pushLog({
  type: "effectTrigger",
  groupLevel: ctx.groupLevel + 1,
  subLevel: 0,
  block: "effect",
  unit: target.id,
  effect: "satellite"
});

ctx.pushLog({
  type: "satelliteGuard",
  groupLevel: ctx.groupLevel + 1,
  subLevel: 1,
  block: "effect",
  unit: target.id
});

    if (satellite.stock <= 0) {

      target.effects =
        target.effects.filter(e => e !== satellite);

ctx.pushLog({
  type: "effectExpired",
  groupLevel: ctx.groupLevel + 1,
  subLevel: 1,
  block: "effect",
  unit: target.id,
  effect: { type: "satellite" }
});

    }

  }

}
  
  target.hp -= finalDamage;

  
ctx.pushLog({
  type: "damage",
  groupLevel: ctx.groupLevel,
  subLevel: 1,
  block: "skill",
  source: source.id,
  target: target.id,
  amount: finalDamage,
  damageType: type
});

  ctx.pushLog({
    type: "hpChange",
    target: target.id,
    hp: Math.max(target.hp, 0)
  });
  if (target.hp <= 0) {
  ctx.killUnit(target);
}

// ==========================================================
// 流星（meteor）反射
// ==========================================================

if (
  finalDamage > 0 &&
  (type === "normal" || type === "pierce")
) {

  const meteor = target.effects?.find(
    e => e.type === "meteor"
  );

  if (meteor && meteor.stock > 0) {

    const reflectDamage =
      Math.max(
        Math.floor(finalDamage * 0.2),
        1
      );

    meteor.stock--;

    if (reflectDamage > 0) {

      if (source && source.hp > 0) {

        source.hp -= reflectDamage;

ctx.pushLog({
  type: "effectTrigger",
  groupLevel: ctx.groupLevel + 1,
  subLevel: 0,
  block: "effect",
  unit: target.id,
  effect: "meteor"
});
        
ctx.pushLog({
  type: "meteorReflect",
  groupLevel: ctx.groupLevel + 1,
  subLevel: 1,
  block: "effect",
  source: target.id,
  target: source.id,
  amount: reflectDamage
});

        ctx.pushLog({
          type: "hpChange",
          target: source.id,
          hp: Math.max(source.hp, 0)
        });

        if (source.hp <= 0) {
          ctx.killUnit(source);
        }

      }

      else {

ctx.pushLog({
  type: "effectTrigger",
  groupLevel: ctx.groupLevel + 1,
  subLevel: 0,
  block: "effect",
  unit: target.id,
  effect: "meteor"
});
        
ctx.pushLog({
  type: "meteorNoTarget",
  groupLevel: ctx.groupLevel + 1,
  subLevel: 1,
  block: "effect",
  source: target.id
});

      }

    }

    if (meteor.stock <= 0) {

      target.effects =
        target.effects.filter(
          e => e !== meteor
        );

      ctx.pushLog({
        type: "effectExpired",
        groupLevel: ctx.groupLevel + 1,
        subLevel: 1,
        block: "effect",
        unit: target.id,
        effect: { type: "meteor" }
      });

    }

  }

}
}

//========================================================== 
// 回復処理
//==========================================================
export function applyHeal(source, target, action, ctx) {

  let finalHeal = 0;
  let isCritical = false;

  const power = action.power || 0;
  const type = action.healType || "fixed";

if (type === "fixed") {
  finalHeal = power;
}

else if (type === "scale") {

  const healStat =
    ctx.getEffectiveStat(source, "heal");

// ==========================================================
// クリティカル
// ==========================================================
  finalHeal =
    Math.floor(healStat * power);

if (
  finalHeal > 0 &&
  type === "scale"
) {

  if (rollCritical(source)) {

    isCritical = true;

    finalHeal =
      Math.floor(finalHeal * 1.5);

ctx.pushLog({
  type: "critical",
  groupLevel: ctx.groupLevel,
  subLevel: 1,
  block: "skill"
});

  }

}
  
getResonanceLog(source, ctx);

const modifier =
  getResonanceModifier(source);

finalHeal =
  Math.floor(finalHeal * modifier);

}
  
  target.hp = Math.min(
    target.hp + finalHeal,
    target.mhp ?? target.hp
  );

ctx.pushLog({
  type: "heal",
  groupLevel: ctx.groupLevel,
  subLevel: 1,
  block: "skill",
  source: source.id,
  target: target.id,
  amount: finalHeal,
  healType: type
});

  ctx.pushLog({
    type: "hpChange",
    target: target.id,
    hp: target.hp
  });
}

//========================================================== 
// 移動処理
//==========================================================
export function applyMove(action, ctx) {

  const unit =
    ctx.units.find(u => u.id === action.target);

  if (!unit) return;

  const fromX = unit.x;
  const fromY = unit.y;

  unit.x = action.x;
  unit.y = action.y;

  ctx.pushLog({
    type: "move",
    unit: unit.id,
    x: action.x,
    y: action.y
  });

  const dx = action.x - fromX;
  const dy = action.y - fromY;

  const newFacing =
    ctx.facingFromDelta(dx, dy, unit.facing);

  if (newFacing !== unit.facing) {

    unit.facing = newFacing;

    ctx.pushLog({
      type: "faceChange",
      unit: unit.id,
      facing: newFacing
    });

  }
}
