// movement.js

const BOARD_W = 10;
const BOARD_H = 6;

function inBounds(x, y) {
  return x >= 0 && x < BOARD_W && y >= 0 && y < BOARD_H;
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

export function chooseStep(unit, units, targetPos, mode="toward") {

  if (!targetPos) return null;

// ======================
// awayモード
// ======================
if (mode === "away") {

  const dirs = [
    {dx:1,dy:0},
    {dx:-1,dy:0},
    {dx:0,dy:1},
    {dx:0,dy:-1}
  ];

  let best = null;
  let bestDist = -1;

  for (const d of dirs) {

    const nx = unit.x + d.dx;
    const ny = unit.y + d.dy;

    if (!inBounds(nx,ny)) continue;
    if (isOccupiedCell(units,nx,ny,unit.id)) continue;

    const dist =
      Math.abs(nx-targetPos.x) +
      Math.abs(ny-targetPos.y);

    if (dist > bestDist) {
      bestDist = dist;
      best = {x:nx,y:ny};
    }
  }

  return best;
}
  
  const goalCells = [];

  for (const d of DIR4) {

    const gx = targetPos.x + d.dx;
    const gy = targetPos.y + d.dy;

    if (!inBounds(gx, gy)) continue;

    if (isOccupiedCell(units, gx, gy, unit.id)) continue;

    goalCells.push({ x: gx, y: gy });
  }

  if (goalCells.length === 0) return null;

  const goalSet = new Set(goalCells.map(c => `${c.x},${c.y}`));

  const startKey = `${unit.x},${unit.y}`;

  const preferredDirs = getPreferredDirs(unit, targetPos);

  const queue = [];
  const visited = new Set();
  const prev = new Map();

  queue.push({ x: unit.x, y: unit.y });
  visited.add(startKey);

  let foundGoalKey = null;

  while (queue.length > 0) {

    const cur = queue.shift();
    const curKey = `${cur.x},${cur.y}`;

    if (goalSet.has(curKey)) {
      foundGoalKey = curKey;
      break;
    }

    for (const d of preferredDirs) {

      const nx = cur.x + d.dx;
      const ny = cur.y + d.dy;

      if (!inBounds(nx, ny)) continue;

      if (isOccupiedCell(units, nx, ny, unit.id)) continue;

      const nKey = `${nx},${ny}`;

      if (visited.has(nKey)) continue;

      visited.add(nKey);
      prev.set(nKey, curKey);

      queue.push({ x: nx, y: ny });
    }
  }

  if (!foundGoalKey) return null;

  let stepKey = foundGoalKey;
  let p = prev.get(stepKey);

  while (p && p !== startKey) {
    stepKey = p;
    p = prev.get(stepKey);
  }

  if (!p) return null;

  const [sx, sy] = stepKey.split(",").map(Number);

  return { x: sx, y: sy };
}
