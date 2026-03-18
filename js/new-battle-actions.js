// new-battle-actions.js


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

  finalHeal =
    Math.floor(healStat * power);

  
getResonanceLog(source, ctx);

const modifier =
  getResonanceModifier(source);

finalHeal =
  Math.floor(finalHeal * modifier);

  
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
  block: action.source ? "skill" : "system",
  source: action.source ?? null,
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
