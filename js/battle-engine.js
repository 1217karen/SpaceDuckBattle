// battle-engine.js

import { skillHandlers } from "./skills.js";

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

      // ⭐ スキル判定（最優先）
      let usedSkill = false;

      for (let skill of (unit.skills || [])) {

        const handler = skillHandlers[skill.type];

        if (!handler) continue;

        if (handler.canUse(unit, target)) {

          handler.execute(unit, target, log);

          usedSkill = true;
          break;
        }
      }

      if (usedSkill) continue;

      // ⭐ スキル使えなかったら移動
      const dx = target.x - unit.x;
      const dy = target.y - unit.y;

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
      }

    }

    turn++;
  }

  log.push({ type: "battleEnd", winner: null });

  return log;
}
