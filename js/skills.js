// skills.js

export const skillHandlers = {

  attack_front1: {

    canUse(unit, ctx) {

      const target = getFrontTarget(unit, ctx);

      return !!target;
    },

    execute(unit, ctx) {

      const target = getFrontTarget(unit, ctx);

      if (!target) return;

      ctx.log.push({
        type:"attack",
        from:unit.id,
        to:target.id,
        damage:unit.atk
      });

      target.hp -= unit.atk;

      ctx.log.push({
        type:"damage",
        target:target.id,
        hp:Math.max(target.hp,0)
      });

      if (target.hp <= 0) {

        ctx.log.push({
          type:"death",
          target:target.id
        });
      }
    }
  },

  // ⭐ NEW
attack_nearest: {

  canUse(unit, ctx) {

    const target = ctx.getNearestEnemy(unit, ctx.units);

    if (!target) return false;

    const dist = ctx.getDistance(unit, target);

    return dist === 1;
  },

  execute(unit, ctx) {

    const target = ctx.getNearestEnemy(unit, ctx.units);

    if (!target) return;

    ctx.log.push({
      type:"attack",
      from:unit.id,
      to:target.id,
      damage:unit.atk
    });

    target.hp -= unit.atk;

    ctx.log.push({
      type:"damage",
      target:target.id,
      hp:Math.max(target.hp,0)
    });

    if (target.hp <= 0) {

      ctx.log.push({
        type:"death",
        target:target.id
      });
    }
  },
heal_cross2: {

  canUse(unit, ctx) {

    const allies =
      ctx.getUnitsInManhattanRange(
        unit,
        ctx.units,
        2
      ).filter(u =>
        u.team === unit.team &&
        u.id !== unit.id
      );

    return allies.length > 0;
  },

  execute(unit, ctx) {

    const allies =
      ctx.getUnitsInManhattanRange(
        unit,
        ctx.units,
        2
      ).filter(u =>
        u.team === unit.team &&
        u.id !== unit.id
      );

    for (let ally of allies) {

      ally.hp += 5;

      ctx.log.push({
        type:"heal",
        target:ally.id,
        hp:ally.hp
      });
    }
  }

},
};


// =======================
// front判定
// =======================

function getFrontTarget(unit, ctx) {

  const enemies = ctx.getEnemies(ctx.units, unit.team);

  for (let target of enemies) {

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
