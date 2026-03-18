//new-battle-heal.js

import {runBeforeDamage} from "./new-battle-effects.js";
import { getEffectiveStat } from "./new-battle-stats.js";
import { rollCritical } from "./new-battle-utils.js";

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
  getEffectiveStat(source, "heal");

  finalHeal =
    Math.floor(healStat * power);

  
finalHeal = runBeforeDamage(ctx, {
  source,
  target,
  damage: finalHeal,
  type: "heal"
});

  
// ==========================================================
// クリティカル
// ==========================================================
  
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
  block: "skill"
});

  }

}

}
  
  target.hp = Math.min(
    target.hp + finalHeal,
    target.mhp ?? target.hp
  );

ctx.pushLog({
  type: "heal",
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
