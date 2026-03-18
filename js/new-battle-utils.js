//new-battle-utils.js

// ==========================================================
// 共通ユーティリティ
// ==========================================================

function getSkillChainCount(unit) {
const speed = unit.speed ?? 0;
const rate = Math.max(speed, 0) * 2; // %
  let count = 1;
  if (rate < 100) {
    if (Math.random() * 100 < rate) {
      count = 2;
    }
  }

  else if (rate < 200) {
    count = 2;
    const extra = rate - 100;
    if (Math.random() * 100 < extra) {
      count = 3;
    }
  }

  else {
    count = 3;
  }
  return count;
}

function getManhattanCells(center, range) {
  const cells = [];

  for (let dx = -range; dx <= range; dx++) {
    for (let dy = -range; dy <= range; dy++) {
      if (Math.abs(dx) + Math.abs(dy) <= range) {
        cells.push({ x: center.x + dx, y: center.y + dy });
      }
    }
  }

  return cells;
}

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

function getChebyshevDistance(a, b) {
  return Math.max(Math.abs(a.x - b.x), Math.abs(a.y - b.y));
}

// ==========================================================
// ランダム取得
// ==========================================================

function getRandomUnit(list) {
  if (!list || list.length === 0) return null;
  const index = Math.floor(Math.random() * list.length);
  return list[index];
}

function getRandomEnemy(unit, units) {
  const enemies = getEnemies(units, unit.team);
  return getRandomUnit(enemies);
}

function getRandomAlly(unit, units) {
  const allies = getAllies(units, unit.team, unit.id);
  return getRandomUnit(allies);
}

function getRandomAny(units) {
  const alive = getAliveUnits(units);
  return getRandomUnit(alive);
}

// ==========================================================
// 範囲取得
// ==========================================================

function getUnitsInManhattanRange(center, units, range) {
  return units.filter(u => {
    if (u.hp <= 0) return false;
    const dist = getDistance(center, u);
    return dist <= range;
  });
}

function getUnitsInSameRow(unit, units) {
  return units.filter(u => u.hp > 0 && u.y === unit.y);
}

function getUnitsInSameColumn(unit, units) {
  return units.filter(u => u.hp > 0 && u.x === unit.x);
}
