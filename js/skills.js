export const skillHandlers = {

  // =========================
  // 前方1マス攻撃
  // =========================

  attack_front1: {

generateActions(unit, ctx) {

  const target = getFrontTarget(unit, ctx);
  if (!target) return null;
if (target.team === unit.team) return null;
  let x = unit.x;
  let y = unit.y;

  if (unit.facing === "N") y -= 1;
  if (unit.facing === "S") y += 1;
  if (unit.facing === "E") x += 1;
  if (unit.facing === "W") x -= 1;

  return {
    preview:{
      cells:[{x,y}],
      style:"attack"
    },
    actions:[
{
  type:"damage",
  source:unit.id,
  target:target.id,
  power:0,
  damageType:"normal"
}
    ]
  };
}
},


  // =========================
  // 最寄り敵攻撃
  // =========================

  attack_nearest: {

generateActions(unit, ctx) {

  const target =
    ctx.getNearestEnemy(unit, ctx.units);

  if (!target) return null;

  const dist =
    ctx.getDistance(unit, target);

  if (dist !== 1) return null;

  return {
    preview:{
      cells:[{ x:target.x, y:target.y }],
      style:"attack"
    },
    actions:[
{
  type:"damage",
  source:unit.id,
  target:target.id,
  power:0,
  damageType:"normal"
}
    ]
  };
}
},


  // =========================
  // 縦横2マス回復
  // =========================

heal_cross2: {

generateActions(unit, ctx) {

  // 実際に回復対象となるユニット
const targets =
  ctx.getUnitsInManhattanRange(
    unit,
    ctx.units,
    2
  ).filter(u =>
    u.id !== unit.id &&
    u.team === unit.team
  );

  // 効果対象がいないなら不発
  if (targets.length === 0) return null;

  // 範囲表示（座標）
  const cells =
    ctx.getManhattanCells(unit, 2);

  const actions = [];

  for (let t of targets) {

    actions.push({
      type:"heal",
      source:unit.id,
      target:t.id,
      amount:5
    });
  }

  return {
    preview:{
      cells: cells,
      style:"heal"
    },
    actions: actions
  };
}
}

};
// =======================
// 前方ターゲット取得
// =======================

function getFrontTarget(unit, ctx) {

  const candidates =
    ctx.units.filter(u =>
      u.hp > 0 &&
      u.id !== unit.id
    );

  for (let target of candidates) {

    if (unit.facing === "N" &&
      target.x === unit.x &&
      target.y === unit.y - 1) return target;

    if (unit.facing === "S" &&
      target.x === unit.x &&
      target.y === unit.y + 1) return target;

    if (unit.facing === "E" &&
      target.x === unit.x + 1 &&
      target.y === unit.y) return target;

    if (unit.facing === "W" &&
      target.x === unit.x - 1 &&
      target.y === unit.y) return target;
  }

  return null;
}
