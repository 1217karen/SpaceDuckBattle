//skills.js
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
cooldown: 2,
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
cooldown: 1,
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
  power:5,
  healType:"fixed"
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
},
  
  // =========================
  // 自分にバフ
  // =========================

buff_self_if_alone: {
cooldown: 3,
generateActions(unit, ctx) {

  // 周囲1マス以内の他ユニット取得
  const nearby =
    ctx.getUnitsInManhattanRange(
      unit,
      ctx.units,
      1
    ).filter(u => u.id !== unit.id);

  // 誰もいなければ発動
  if (nearby.length !== 0) return null;

  return {
    preview:{
      cells:[{x:unit.x, y:unit.y}],
      style:"buff"
    },
    actions:[
      {
        type:"applyEffect",
        source:unit.id,
        target:unit.id,
        effect:{
          stat:"atk",
          value:5,
          duration:null
        }
      }
    ]
  };
},
  // =========================
  // 自分DF50%バフ（3T）
  // =========================

  buff_df50_self: {
    cooldown: 4,

    generateActions(unit, ctx) {

      return {
        preview:{
          cells:[{ x:unit.x, y:unit.y }],
          style:"buff"
        },
        actions:[
          {
            type:"applyEffect",
            source:unit.id,
            target:unit.id,
            effect:{
              stat:"df",
              value:0.5,     // 50%
              duration:3
            }
          }
        ]
      };
    }
  },
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
