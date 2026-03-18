//new-battle-damage.js


import {runBeforeDamage,runAfterDamage} from "./new-battle-effects.js";
import { getEffectiveStat } from "./new-battle-stats.js";



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
  const df = ctx.getEffectiveStat(target, "def");

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

finalDamage = runBeforeDamage(ctx, {
  source,
  target,
  damage: finalDamage,
  type
});

  
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
  block: "skill"
});
  }

}


  target.hp -= finalDamage;

  
ctx.pushLog({
  type: "damage",
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

runAfterDamage(ctx, {
  source,
  target,
  damage: finalDamage,
  type
});
}

