// skills.js
export const skillHandlers = {

  // =========================
  // 前方1マス攻撃
  // =========================
  attack_front1: {
    cooldown: 2,
    
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
        preview: {
          cells: [{ x, y }],
          style: "attack"
        },
        actions: [
          {
            type: "damage",
            source: unit.id,
            target: target.id,
            power: 0,
            damageType: "normal"
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
        preview: {
          cells: [{ x: target.x, y: target.y }],
          style: "attack"
        },
        actions: [
          {
            type: "damage",
            source: unit.id,
            target: target.id,
            power: 0,
            damageType: "normal"
          }
        ]
      };
    }
  },

  // =========================
  // 縦横2マス回復
  // =========================
  heal_cross2: {
    cooldown: 2,

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
          type: "heal",
          source: unit.id,
          target: t.id,
          power: 5,
          healType: "fixed"
        });
      }

      return {
        preview: {
          cells: cells,
          style: "heal"
        },
        actions: actions
      };
    }
  },
  
  // =========================
  // 周囲2マス 敵全体攻撃（減衰なし）
  // =========================

  attack_around2_all: {
    cooldown: 2,
    
    generateActions(unit, ctx) {

      const targets =
        ctx.getUnitsInManhattanRange(
          unit,
          ctx.units,
          2
        ).filter(u =>
          u.team !== unit.team
        );

      if (!targets || targets.length === 0)
        return null;

      const actions = [];

      for (let t of targets) {
        actions.push({
          type:"damage",
          source:unit.id,
          target:t.id,
          power:0,
          damageType:"normal"
          // falloffなし
        });
      }

      return {
        preview:{
          cells: ctx.getManhattanCells(unit, 2),
          style:"attack"
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
        preview: {
          cells: [{ x: unit.x, y: unit.y }],
          style: "buff"
        },
        actions: [
          {
            type: "applyEffect",
            source: unit.id,
            target: unit.id,
            effect: {
              stat: "atk",
              value: 5,
              duration: null
            }
          }
        ]
      };
    }
  },
  
  // =========================
  // ランダム敵単体攻撃（減衰あり）
  // =========================

  attack_random_falloff: {
    cooldown: 2,
    
generateActions(unit, ctx) {

  const enemies =
    ctx.getEnemies(ctx.units, unit.team);

  if (!enemies || enemies.length === 0)
    return null;

  const target =
    ctx.getRandomEnemy(unit, ctx.units);

  if (!target) return null;

  return {
    preview:{
      cells: enemies.map(e => ({
        x: e.x,
        y: e.y
      })),
      style:"attack"
    },
    actions:[
      {
        type:"damage",
        source:unit.id,
        target:target.id,
        power:0,
        damageType:"normal",
        falloff:true
      }
    ]
  };
}
  },
  // =========================
// 前方攻撃＋ノックバック
// =========================
attack_front_knockback: {
  cooldown: 2,

  generateActions(unit, ctx) {

    const target = getFrontTarget(unit, ctx);
    if (!target) return null;
    if (target.team === unit.team) return null;

    const cell =
      ctx.getKnockbackCell(unit, target, ctx.units);

    const actions = [];

    actions.push({
      type:"damage",
      source:unit.id,
      target:target.id,
      power:0,
      damageType:"normal"
    });

    if (cell) {
      actions.push({
        type:"move",
        target:target.id,
        x:cell.x,
        y:cell.y,
        forced:true
      });
    }

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
      actions:actions
    };
  }
},
  // =========================
// 最遠敵引き寄せ
// =========================
pull_farthest_enemy: {
  cooldown: 3,

  generateActions(unit, ctx) {

    const enemies =
      ctx.getEnemies(ctx.units, unit.team);

    if (!enemies || enemies.length === 0)
      return null;

    let farthest = enemies[0];
    let maxDist =
      ctx.getDistance(unit, farthest);

    for (const e of enemies) {

      const d =
        ctx.getDistance(unit, e);

      if (d > maxDist) {
        maxDist = d;
        farthest = e;
      }
    }

    const cell =
      ctx.getPullCell(unit, farthest, ctx.units);

    if (!cell) return null;

    return {
      preview:{
        cells:[{x:farthest.x, y:farthest.y}],
        style:"attack"
      },
      actions:[
        {
          type:"move",
          target:farthest.id,
          x:cell.x,
          y:cell.y,
          forced:true
        }
      ]
    };
  }
},
  // =========================
  // 自分DF50%バフ（3T）
  // =========================
  buff_df50_self: {
    cooldown: 4,

    generateActions(unit, ctx) {

      return {
        preview: {
          cells: [{ x: unit.x, y: unit.y }],
          style: "buff"
        },
        actions: [
          {
            type: "applyEffect",
            source: unit.id,
            target: unit.id,
            effect: {
              stat: "df",
              value: 0.5, // 50%
              duration: 3
            }
          }
        ]
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

    if (
      unit.facing === "N" &&
      target.x === unit.x &&
      target.y === unit.y - 1
    ) return target;

    if (
      unit.facing === "S" &&
      target.x === unit.x &&
      target.y === unit.y + 1
    ) return target;

    if (
      unit.facing === "E" &&
      target.x === unit.x + 1 &&
      target.y === unit.y
    ) return target;

    if (
      unit.facing === "W" &&
      target.x === unit.x - 1 &&
      target.y === unit.y
    ) return target;
  }

  return null;
}
