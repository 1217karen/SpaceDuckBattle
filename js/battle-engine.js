//battle-engine.js

import { skillHandlers } from "./skills.js";


// ==========================
// 共通ユーティリティ
// ==========================

function getAliveUnits(units) {
  return units.filter(u => u.hp > 0);
}

function getEnemies(units, team) {
  return units.filter(u => u.team !== team && u.hp > 0);
}

function getAllies(units, team, selfId) {
  return units.filter(u => u.team === team && u.id !== selfId && u.hp > 0);
}

function getDistance(a, b) {
  // 今はマンハッタン距離（将来トーラス化可能）
  return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
}

function getNearestEnemy(unit, units) {

  const enemies = getEnemies(units, unit.team);

  if (enemies.length === 0) return null;

  let nearest = enemies[0];
  let minDist = getDistance(unit, nearest);

  for (let e of enemies) {

    const d = getDistance(unit, e);

    if (d < minDist) {
      minDist = d;
      nearest = e;
    }
  }

  return nearest;
}
function getUnitsInManhattanRange(center, units, range) {

  return units.filter(u => {

    if (u.hp <= 0) return false;

    const dist =
      Math.abs(center.x - u.x) +
      Math.abs(center.y - u.y);

    return dist <= range;
  });
}

function getUnitsInSameRow(unit, units) {
  return units.filter(u =>
    u.hp > 0 &&
    u.y === unit.y
  );
}

function getUnitsInSameColumn(unit, units) {
  return units.filter(u =>
    u.hp > 0 &&
    u.x === unit.x
  );
}
function applyDamage(source, target, amount, ctx) {

  ctx.log.push({
    type:"attack",
    from:source.id,
    to:target.id,
    damage:amount
  });

  target.hp -= amount;

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

function applyHeal(source, target, amount, ctx) {

  target.hp += amount;

  ctx.log.push({
    type:"heal",
    from:source.id,
    target:target.id,
    hp:target.hp
  });
}
// ==========================
// メイン
// ==========================

export function simulateBattle(snapshot) {

  const log = [];

  // snapshotをコピー
  const units = snapshot.units.map(u => ({ ...u }));

  // 行動順固定
  units.sort((a,b)=>b.speed-a.speed);

const context = {
  units,
  log,
  getDistance,
  getEnemies,
  getAllies,
  getNearestEnemy,
  getUnitsInManhattanRange,
  getUnitsInSameRow,
  getUnitsInSameColumn,
  applyDamage,
  applyHeal
};

  let turn = 1;
  const MAX_TURNS = 50;

  while (turn <= MAX_TURNS) {

    log.push({ type:"turnStart", turn });

    for (let unit of units) {

      if (unit.hp <= 0) continue;

      const enemies = getEnemies(units, unit.team);

      if (enemies.length === 0) {

        log.push({
          type:"battleEnd",
          winner: unit.team
        });

        return log;
      }

      // ====================
      // スキル判定
      // ====================

      let usedSkill = false;

      for (let skill of (unit.skills || [])) {

        const handler = skillHandlers[skill.type];

        if (!handler) continue;

        if (handler.canUse(unit, context)) {

          handler.execute(unit, context);

          usedSkill = true;
          break;
        }
      }

      if (usedSkill) continue;

      // ====================
      // fallback移動
      // ====================

      const target = getNearestEnemy(unit, units);

      if (!target) continue;

      const dx = target.x - unit.x;
      const dy = target.y - unit.y;

      if (Math.abs(dx) + Math.abs(dy) > 1) {

        let newX = unit.x;
        let newY = unit.y;
        let newFacing = unit.facing;

        if (dx !== 0) {

          newX += dx > 0 ? 1 : -1;
          newFacing = dx > 0 ? "E" : "W";

        } else if (dy !== 0) {

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

  log.push({ type:"battleEnd", winner:null });

  return log;
}
