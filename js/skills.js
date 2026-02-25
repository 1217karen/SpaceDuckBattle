// skills.js

function isFrontAdjacent(unit, target) {

  if (unit.facing === "N")
    return target.x === unit.x && target.y === unit.y - 1;

  if (unit.facing === "S")
    return target.x === unit.x && target.y === unit.y + 1;

  if (unit.facing === "E")
    return target.x === unit.x + 1 && target.y === unit.y;

  if (unit.facing === "W")
    return target.x === unit.x - 1 && target.y === unit.y;

  return false;
}

export const skillHandlers = {

  attack_front1: {

    canUse(unit, target) {
      return isFrontAdjacent(unit, target);
    },

    execute(unit, target, log) {

      log.push({
        type: "attack",
        from: unit.id,
        to: target.id,
        damage: unit.atk
      });

      target.hp -= unit.atk;

      log.push({
        type: "damage",
        target: target.id,
        hp: Math.max(target.hp, 0)
      });

      if (target.hp <= 0) {
        log.push({ type: "death", target: target.id });
      }
    }

  }

};
