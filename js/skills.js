export const skillHandlers = {

  // =========================
  // 前方1マス攻撃
  // =========================

attack_front1: {

  canUse(unit, ctx) {
    const target = getFrontTarget(unit, ctx);
    return !!target;
  },

  execute(unit, ctx) {

    ctx.log.push({
      type: "skillUse",
      unit: unit.id,
      skill: "attack_front1"
    });

    const target = getFrontTarget(unit, ctx);
    if (!target) return;

    ctx.applyDamage(
      unit,
      target,
      unit.atk,
      ctx
    );
  }
},


// =========================
// 最寄り敵攻撃
// =========================

attack_nearest: {

  canUse(unit, ctx) {

    const target =
      ctx.getNearestEnemy(unit, ctx.units);

    if (!target) return false;

    const dist =
      ctx.getDistance(unit, target);

    return dist === 1;
  },

  execute(unit, ctx) {

    ctx.log.push({
      type:"skillUse",
      unit:unit.id,
      skill:"attack_nearest"
    });

    const target =
      ctx.getNearestEnemy(unit, ctx.units);

    if (!target) return;

    ctx.applyDamage(
      unit,
      target,
      unit.atk,
      ctx
    );
  }
},


// =========================
// 縦横2マス回復
// =========================

heal_cross2: {

  canUse(unit, ctx) {

    const targets =
      ctx.getUnitsInManhattanRange(
        unit,
        ctx.units,
        2
      ).filter(u =>
        u.id !== unit.id
      );

    return targets.length > 0;
  },

  execute(unit, ctx) {

    ctx.log.push({
      type:"skillUse",
      unit:unit.id,
      skill:"heal_cross2"
    });

    const targets =
      ctx.getUnitsInManhattanRange(
        unit,
        ctx.units,
        2
      ).filter(u =>
        u.id !== unit.id
      );

    for (let t of targets) {

      ctx.applyHeal(
        unit,
        t,
        5,
        ctx
      );
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
