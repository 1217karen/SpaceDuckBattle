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
    1 + (resonanceStock * 0.0025)
      - (interferenceStock * 0.0025),
    0
  );
}
//========================================================== 
// ダメージ処理 
//==========================================================
export function applyDamage(source, target, action, ctx) {

  let finalDamage = 0;

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

const modifier =
  getResonanceModifier(source);

finalDamage =
  Math.floor(finalDamage * modifier);

}
  
  target.hp -= finalDamage;

ctx.log.push({
  type: "damage",
  source: source.id,
  target: target.id,
  amount: finalDamage,
  damageType: type
});

  ctx.log.push({
    type: "hpChange",
    target: target.id,
    hp: Math.max(target.hp, 0)
  });
  if (target.hp <= 0) {
  ctx.killUnit(target);
}
}

//========================================================== 
// 回復処理
//==========================================================
export function applyHeal(source, target, action, ctx) {

  let finalHeal = 0;

  const power = action.power || 0;
  const type = action.healType || "fixed";

if (type === "fixed") {
  finalHeal = power;
}

else if (type === "scale") {

  const healStat =
    ctx.getEffectiveStat(source, "heal");

  finalHeal =
    Math.floor(healStat * power);

  const modifier =
    getResonanceModifier(source);

  finalHeal =
    Math.floor(finalHeal * modifier);

}
  
  target.hp = Math.min(
    target.hp + finalHeal,
    target.mhp ?? target.hp
  );

ctx.log.push({
  type: "heal",
  source: source.id,
  target: target.id,
  amount: finalHeal,
  healType: type
});

  ctx.log.push({
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

  ctx.log.push({
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

    ctx.log.push({
      type: "faceChange",
      unit: unit.id,
      facing: newFacing
    });

  }
}
