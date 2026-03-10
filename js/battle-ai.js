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

function canReduceDistanceOneStepToward(target) {

  if (!target || !board) return false;

  const currentDist = getDistance(unit, target);

  const dirs = [
    { dx: 1, dy: 0 },
    { dx: -1, dy: 0 },
    { dx: 0, dy: 1 },
    { dx: 0, dy: -1 }
  ];

  for (const d of dirs) {

    const nx = unit.x + d.dx;
    const ny = unit.y + d.dy;

    // 盤外
    if (nx < 0 || nx >= board.width || ny < 0 || ny >= board.height) {
      continue;
    }

    // 占有（生存ユニットのみ）
    const occupied = units.some(u =>
      u.hp > 0 &&
      u.id !== unit.id &&
      u.x === nx &&
      u.y === ny
    );
    if (occupied) continue;

const newDist =
  getDistance({ x: nx, y: ny }, target);

    // 1歩で距離を縮められるならOK
    if (newDist < currentDist) return true;
  }

  return false;
}
  
if (role === "attack") {

  const enemies = getEnemies(units, unit.team);

  const adjacent =
    enemies.find(e => getDistance(unit, e) === 1);

  if (adjacent) {
    targetUnit = adjacent;
  }

  else {

    enemies.sort(
      (a, b) => getDistance(unit, a) - getDistance(unit, b)
    );

    targetUnit =
      enemies.find(e => canReduceDistanceOneStepToward(e))
      ?? enemies[0]
      ?? null;
  }
}

else if (role === "speed") {

  const enemies = getEnemies(units, unit.team);

  const adjacent =
    enemies.find(e => getDistance(unit, e) === 1);

  if (adjacent) {
    targetUnit = adjacent;
  }

  else {

    enemies.sort(
      (a, b) => getDistance(unit, a) - getDistance(unit, b)
    );

    targetUnit =
      enemies.find(e => canReduceDistanceOneStepToward(e))
      ?? enemies[0]
      ?? null;
  }

  moveCount = 2;
}

else if (role === "technical") {

  targetUnit =
    getNearestEnemy(unit, units, getDistance, getEnemies);

  if (targetUnit) {

    const dist = getDistance(unit, targetUnit);

    if (dist > 2) {
      moveMode = "toward";
      stopDistance = 2;
    }

    else if (dist < 2) {
      moveMode = "away";
      stopDistance = -1;
    }

    else {
      targetUnit = null;
    }

  }
}

else if (role === "heal") {

  const enemy =
    getNearestEnemy(unit, units, getDistance, getEnemies);

  const ally =
    getLowestHpAlly(unit, units, getDistance, getAllies);

  if (!ally) {
    targetUnit = enemy;
    moveMode = "toward";
    stopDistance = 2;
  }

  else {

    const allyDist =
      getDistance(unit, ally);

    const enemyDist =
      enemy ? getDistance(unit, enemy) : Infinity;

    const enemyCheb =
      enemy
        ? Math.max(
            Math.abs(enemy.x - unit.x),
            Math.abs(enemy.y - unit.y)
          )
        : Infinity;

    // 両方満たす → 停止
    if (allyDist <= 2 && enemyCheb > 1) {
      targetUnit = null;
    }

    // 敵がチェビシェフ1 → 逃げる
    else if (enemyCheb <= 1) {
      targetUnit = enemy;
      moveMode = "away";
      stopDistance = -1;
    }

    // 味方へ接近
    else {
      targetUnit = ally;
      moveMode = "toward";
      stopDistance = 2;
    }
  }
}

else if (role === "defense") {

  const enemy =
    getNearestEnemy(unit, units, getDistance, getEnemies);

  if (!enemy) {
    targetUnit = null;
  }

  else {

    const allies =
      getAllies(units, unit.team, unit.id);

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
      stopDistance = 1;
    }

    else {

      const allyCheb =
        Math.max(
          Math.abs(frontAlly.x - unit.x),
          Math.abs(frontAlly.y - unit.y)
        );

      const enemyDist =
        getDistance(unit, enemy);

      if (allyCheb <= 1 && enemyDist <= 1) {
        targetUnit = null;
      }

      else if (allyCheb > 1) {
        targetUnit = frontAlly;
        moveMode = "toward";
        stopDistance = 1;
      }

      else {
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

  const allies =
    getAllies(units, unit.team, unit.id);

  if (!allies || allies.length === 0) {
    targetUnit = enemy;
    moveMode = "toward";
    stopDistance = 2;
  }

  else {

    const ally =
      allies.reduce((a, b) =>
        getDistance(unit, a) <= getDistance(unit, b) ? a : b
      );

    const allyCheb =
      Math.max(
        Math.abs(ally.x - unit.x),
        Math.abs(ally.y - unit.y)
      );

    const enemyDist =
      enemy ? getDistance(unit, enemy) : Infinity;

    if (allyCheb <= 1 && enemyDist > 1) {
      targetUnit = null;
    }

    else if (enemyDist <= 1) {
      targetUnit = enemy;
      moveMode = "away";
      stopDistance = -1;
    }

    else {
      targetUnit = ally;
      moveMode = "toward";
      stopDistance = 1;
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
