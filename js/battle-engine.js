// battle-engine.js

export function simulateBattle(snapshot) {
  const log = [];
  const units = snapshot.units.map(u => ({ ...u }));
  let turn = 1;
  const MAX_TURNS = 50;

  // speed順で固定（決定論）
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

      const target = enemies[0]; // 最初の敵を殴る（単純AI）

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

    turn++;
  }

  log.push({ type: "battleEnd", winner: null });
  return log;
}
