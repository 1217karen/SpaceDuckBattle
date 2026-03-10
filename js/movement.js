// movement.js

function inBounds(x, y, board) {
  return (
    x >= 0 &&
    x < board.width &&
    y >= 0 &&
    y < board.height
  );
}

export function isOccupiedCell(units, x, y, selfId){
  return units.some(u =>
    u.hp > 0 &&
    u.id !== selfId &&
    u.x === x &&
    u.y === y
  );
}

export function facingFromDelta(dx, dy, fallbackFacing) {

  const absDx = Math.abs(dx);
  const absDy = Math.abs(dy);

  if (absDx >= absDy && dx !== 0) return dx > 0 ? "E" : "W";
  if (dy !== 0) return dy > 0 ? "S" : "N";

  return fallbackFacing;
}

function getPreferredDirs(unit, targetPos) {

  const dx = targetPos.x - unit.x;
  const dy = targetPos.y - unit.y;

  const absDx = Math.abs(dx);
  const absDy = Math.abs(dy);

  const dirs = [];

  const horiz =
    dx > 0 ? { dx: 1, dy: 0 } : { dx: -1, dy: 0 };

  const vert =
    dy > 0 ? { dx: 0, dy: 1 } : { dx: 0, dy: -1 };

  const horizOpp =
    dx > 0 ? { dx: -1, dy: 0 } : { dx: 1, dy: 0 };

  const vertOpp =
    dy > 0 ? { dx: 0, dy: -1 } : { dx: 0, dy: 1 };

  if (absDx >= absDy) {
    dirs.push(horiz, vert, vertOpp, horizOpp);
  } else {
    dirs.push(vert, horiz, horizOpp, vertOpp);
  }

  return dirs;
}

const DIR4 = [
  { dx: 1, dy: 0 },
  { dx: -1, dy: 0 },
  { dx: 0, dy: 1 },
  { dx: 0, dy: -1 }
];

export function chooseStep(unit, units, targetPos, board, moveMode) {

const dirs =
  moveMode === "toward"
    ? getPreferredDirs(unit, targetPos)
    : DIR4;

  const currentDist =
    Math.abs(unit.x - targetPos.x) +
    Math.abs(unit.y - targetPos.y);

  let candidates = [];

  for (const d of dirs) {

    const nx = unit.x + d.dx;
    const ny = unit.y + d.dy;

// ヒールは敵チェビシェフ1を避ける
if (unit.role === "heal") {

  const danger = units.some(u =>
    u.hp > 0 &&
    u.team !== unit.team &&
    Math.max(Math.abs(u.x - nx), Math.abs(u.y - ny)) <= 1
  );

  if (danger) continue;
}

// サポートは敵マンハッタン1を避ける
if (unit.role === "support") {

  const danger = units.some(u =>
    u.hp > 0 &&
    u.team !== unit.team &&
    Math.abs(u.x - nx) + Math.abs(u.y - ny) <= 1
  );

  if (danger) continue;
}

    // 盤外
    if (nx < 0 || nx >= board.width ||
        ny < 0 || ny >= board.height) {
      continue;
    }

    // 占有
    if (isOccupiedCell(units, nx, ny, unit.id)) {
      continue;
    }

    const newDist =
      Math.abs(nx - targetPos.x) +
      Math.abs(ny - targetPos.y);

    candidates.push({ x: nx, y: ny, dist: newDist });
  }

  if (candidates.length === 0) return null;

  if (moveMode === "toward") {
    candidates.sort((a, b) => a.dist - b.dist);
  }

  else if (moveMode === "away") {
    candidates.sort((a, b) => b.dist - a.dist);
  }

  return {
    x: candidates[0].x,
    y: candidates[0].y
  };
}

export function getKnockbackCell(source, target, units, board) {

  const dx = target.x - source.x;
  const dy = target.y - source.y;

  let stepX = 0;
  let stepY = 0;

  if (Math.abs(dx) >= Math.abs(dy)) {
    stepX = dx > 0 ? 1 : -1;
  } else {
    stepY = dy > 0 ? 1 : -1;
  }

  const nx = target.x + stepX;
  const ny = target.y + stepY;

  if (!inBounds(nx, ny, board)) return null;

  if (isOccupiedCell(units, nx, ny, target.id)) {
    return null;
  }

  return { x: nx, y: ny };
}


export function getPullCell(source, target, units, board) {

  const dx = source.x - target.x;
  const dy = source.y - target.y;

  let stepX = 0;
  let stepY = 0;

  if (Math.abs(dx) >= Math.abs(dy)) {
    stepX = dx > 0 ? 1 : -1;
  } else {
    stepY = dy > 0 ? 1 : -1;
  }

  const nx = target.x + stepX;
  const ny = target.y + stepY;

  if (!inBounds(nx, ny, board)) return null;

  if (isOccupiedCell(units, nx, ny, target.id)) {
    return null;
  }

  return { x: nx, y: ny };
}
