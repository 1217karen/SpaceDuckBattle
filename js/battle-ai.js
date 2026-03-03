// battle-ai.js

// ==============================
// ターゲット探索
// ==============================

export function getNearestEnemy(unit, units, getDistance, getEnemies) {

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


export function getLowestHpAlly(unit, units, getDistance, getAllies) {

  const allies = getAllies(units, unit.team, unit.id);
  if (!allies || allies.length === 0) return null;

  let best = allies[0];

  for (let a of allies) {

    if (a.hp < best.hp) {
      best = a;
      continue;
    }

    if (a.hp === best.hp) {

      const da = getDistance(unit, a);
      const db = getDistance(unit, best);

      if (da < db) best = a;

    }

  }

  return best;
}


// ==============================
// 向き決定
// ==============================

export function getIdleFacing(
  unit,
  units,
  getDistance,
  getEnemies,
  getAllies,
  getNearestEnemy,
  getLowestHpAlly
) {

  const role = unit.role || "attack";

  if (role === "attack") {

    const enemy =
      getNearestEnemy(unit, units, getDistance, getEnemies);

    if (!enemy) return unit.facing;

    const dx = enemy.x - unit.x;
    const dy = enemy.y - unit.y;

    if (Math.abs(dx) >= Math.abs(dy)) {
      return dx > 0 ? "E" : "W";
    } else {
      return dy > 0 ? "S" : "N";
    }

  }

  if (role === "heal") {

    const allies =
      getAllies(units, unit.team, unit.id);

    if (!allies || allies.length === 0) return unit.facing;

    let best = allies[0];

    for (let a of allies) {

      const d1 = getDistance(unit, a);
      const d2 = getDistance(unit, best);

      if (d1 < d2) best = a;
      else if (d1 === d2 && a.hp < best.hp) best = a;

    }

    const dx = best.x - unit.x;
    const dy = best.y - unit.y;

    if (Math.abs(dx) >= Math.abs(dy)) {
      return dx > 0 ? "E" : "W";
    } else {
      return dy > 0 ? "S" : "N";
    }

  }

  if (role === "defense") {

    const adjacentEnemies =
      getEnemies(units, unit.team)
        .filter(e => getDistance(unit, e) === 1);

    if (adjacentEnemies.length > 0) {

      const e = adjacentEnemies[0];

      const dx = e.x - unit.x;
      const dy = e.y - unit.y;

      if (Math.abs(dx) >= Math.abs(dy)) {
        return dx > 0 ? "E" : "W";
      } else {
        return dy > 0 ? "S" : "N";
      }

    }

    const ally =
      getLowestHpAlly(unit, units, getDistance, getAllies);

    if (!ally) return unit.facing;

    const dx = ally.x - unit.x;
    const dy = ally.y - unit.y;

    if (Math.abs(dx) >= Math.abs(dy)) {
      return dx > 0 ? "E" : "W";
    } else {
      return dy > 0 ? "S" : "N";
    }

  }

  return unit.facing;
}


// ==============================
// fallback移動判断
// ==============================

export function decideFallbackMove(unit, units, getDistance, getNearestEnemy) {

  const role = unit.role || "attack";

  let moveMode = "toward";
  let targetUnit = null;
  let stopDistance = 1;
  let moveCount = 1;

  if (role === "attack") {
    targetUnit =
      getNearestEnemy(unit, units, getDistance, (u,t)=>u);
  }

  else if (role === "speed") {
    targetUnit =
      getNearestEnemy(unit, units, getDistance, (u,t)=>u);
    moveCount = 2;
  }

  else if (role === "technical") {

    targetUnit =
      getNearestEnemy(unit, units, getDistance, (u,t)=>u);

    if (targetUnit) {

      const dist = getDistance(unit, targetUnit);

      if (dist > 2) moveMode = "toward";
      else if (dist < 2) moveMode = "away";
      else stopDistance = 2;

    }
  }

  return {
    targetUnit,
    moveMode,
    stopDistance,
    moveCount
  };
}
