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

export function decideFallbackMove(
  unit,
  units,
  getDistance,
  getEnemies,
  getNearestEnemy,
  getLowestHpAlly,
  getAllies,
  board
) {

  const role = unit.role || "attack";

  let moveMode = "toward";
  let targetUnit = null;
  let stopDistance = 1;
  let moveCount = 1;

  if (role === "attack") {
    targetUnit =
      getNearestEnemy(unit, units, getDistance, getEnemies);
  }

  else if (role === "speed") {
    targetUnit =
      getNearestEnemy(unit, units, getDistance, getEnemies);
    moveCount = 2;
  }

  else if (role === "technical") {

    targetUnit =
      getNearestEnemy(unit, units, getDistance, getEnemies);

    if (targetUnit) {

      const dist = getDistance(unit, targetUnit);

      if (dist > 2) moveMode = "toward";
      else if (dist < 2) moveMode = "away";
      else stopDistance = 2;

    }
  }

else if (role === "heal") {

  const enemy =
    getNearestEnemy(unit, units, getDistance, getEnemies);

  const ally =
    getLowestHpAlly(unit, units, getDistance, getAllies);

  if (!ally) {
    // ヒール対象がいない → 敵へ距離2で接近
    targetUnit = enemy;
    moveMode = "toward";
    stopDistance = 2;
  }

  else if (enemy) {

    const enemyDist =
      getDistance(unit, enemy);

    const allyDist =
      getDistance(unit, ally);

    // 敵が近い → 逃げる
    if (enemyDist <= 2) {
      targetUnit = enemy;
      moveMode = "away";
      stopDistance = -1;
    }

    // 理想位置 → 動かない
    else if (enemyDist >= 3 && allyDist <= 1) {
      targetUnit = null;
    }

    // 味方へ接近
    else {
      targetUnit = ally;
      moveMode = "toward";
      stopDistance = 1;
    }
  }
}

  else if (role === "defense") {

// すでに隣接している敵がいる場合は固定
const adjacentEnemy =
  getEnemies(units, unit.team)
    .find(e => getDistance(unit, e) === 1);

if (adjacentEnemy) {
  targetUnit = adjacentEnemy;
  moveMode = "toward";
  stopDistance = 1;
  return { targetUnit, moveMode, stopDistance, moveCount };
}
    
  const enemy =
    getNearestEnemy(unit, units, getDistance, getEnemies);

  if (!enemy) {
    targetUnit = null;
  }

  else {

    // 敵に最も近い味方を取得
    const allies = units.filter(u =>
  u.team === unit.team &&
  u.id !== unit.id &&
  u.hp > 0
);

    let frontAlly = null;
    let bestDist = Infinity;

    for (const a of allies) {
      const dist =
        getDistance(a, enemy);

      if (dist < bestDist) {
        bestDist = dist;
        frontAlly = a;
      }
    }

    if (!frontAlly) {
      // 単騎 → 敵へ
      targetUnit = enemy;
      moveMode = "toward";
      stopDistance = 1;
    }

    else {

      const allyDist =
        getDistance(unit, frontAlly);

      // 味方から離れすぎている場合
      if (allyDist > 2) {
        targetUnit = frontAlly;
        moveMode = "toward";
        stopDistance = 2;
      }

      else {
        // 条件を満たしているなら敵へ
        targetUnit = enemy;
        moveMode = "toward";
        stopDistance = 1;
      }

    }

  }
}
  else if (role === "support") {

  const enemy =
    getNearestEnemy(unit, units, getDistance, getEnemies);

  if (!enemy) {
    targetUnit = null;
  }

  else {

    // 敵に最も近い味方を取得
    const allies =
      units.filter(u =>
        u.team === unit.team &&
        u.id !== unit.id &&
        u.hp > 0
      );

    let frontAlly = null;
    let bestDist = Infinity;

    for (const a of allies) {
      const dist =
        getDistance(a, enemy);

      if (dist < bestDist) {
        bestDist = dist;
        frontAlly = a;
      }
    }

    if (!frontAlly) {
      targetUnit = enemy;
      moveMode = "toward";
      stopDistance = 2;
    }

    else {

      const enemyDist =
        getDistance(unit, enemy);

      if (enemyDist <= 2) {
        targetUnit = enemy;
        moveMode = "away";
        stopDistance = -1;
      }

      else {
        targetUnit = frontAlly;
        moveMode = "toward";
        stopDistance = 1;
      }

    }

  }
}
  return {
    targetUnit,
    moveMode,
    stopDistance,
    moveCount
  };
}
