export const skillHandlers = {

  // =========================
  // 前方1マス攻撃
  // =========================

  attack_front1: {

  generateActions(unit, ctx) {

    const target = getFrontTarget(unit, ctx);
    if (!target) return null;

    return [{
      type:"damage",
      source:unit.id,
      target:target.id,
      amount:unit.atk
    }];
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

    return [{
      type:"damage",
      source:unit.id,
      target:target.id,
      amount:unit.atk
    }];
  }
},


  // =========================
  // 縦横2マス回復
  // =========================

heal_cross2: {

  generateActions(unit, ctx) {

    const targets =
      ctx.getUnitsInManhattanRange(
        unit,
        ctx.units,
        2
      ).filter(u => u.id !== unit.id);

    if (targets.length === 0) return null;

    return targets.map(t => ({
      type:"heal",
      source:unit.id,
      target:t.id,
      amount:5
    }));
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
