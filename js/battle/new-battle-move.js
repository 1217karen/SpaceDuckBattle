//new-battle-move.js

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
