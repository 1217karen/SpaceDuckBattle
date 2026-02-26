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

    const cells =
      ctx.getUnitsInManhattanRange(
        unit,
        ctx.units,
        2
      );

    if (cells.length === 0) return null;

    const actions = [];

    // ⭐ 範囲表示用
    actions.push({
      type:"rangePreview",
      cells: cells.map(c=>({
        x:c.x,
        y:c.y
      })),
      style:"heal"
    });

    // 回復処理
    for (let t of cells) {

      if (t.id === unit.id) continue;

      actions.push({
        type:"heal",
        source:unit.id,
        target:t.id,
        amount:5
      });
    }

    return actions;
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
