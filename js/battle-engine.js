// battle-engine.js

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

export function simulateBattle(snapshot) {

  const log = [];
  const units = snapshot.units.map(u => ({ ...u }));
  let turn = 1;
  const MAX_TURNS = 50;

  units.sort((a, b) => b.speed - a.speed);

  while (turn <= MAX_TURNS) {

    log.push({ type: "turnStart", turn });

    for (let unit of units) {

      if (unit.hp <= 0) continue;

      const enemies = units.filter(
        u => u.team !== unit.team && u.hp > 0
      );

      if (enemies.length === 0) {
        log.push({ type: "battleEnd", winner: unit.team });
        return log;
      }

      const target = enemies[0];

      const dx = target.x - unit.x;
      const dy = target.y - unit.y;

      // ⭐ 遠いなら接近
      if (Math.abs(dx) + Math.abs(dy) > 1) {

        let newX = unit.x;
        let newY = unit.y;
        let newFacing = unit.facing;

        if (dx !== 0) {
          newX += dx > 0 ? 1 : -1;
          newFacing = dx > 0 ? "E" : "W";
        }
        else if (dy !== 0) {
          newY += dy > 0 ? 1 : -1;
          newFacing = dy > 0 ? "S" : "N";
        }

        unit.x = newX;
        unit.y = newY;
        unit.facing = newFacing;

        log.push({ type:"move", unit:unit.id, x:newX, y:newY });
        log.push({ type:"faceChange", unit:unit.id, facing:newFacing });

        continue;
      }

      // ⭐ 前方1マススキル
      if (isFrontAdjacent(unit, target)) {

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

        continue;
      }

      // ⭐ それ以外（今は何もしない）
    }

    turn++;
  }

  log.push({ type: "battleEnd", winner: null });

  return log;
}
