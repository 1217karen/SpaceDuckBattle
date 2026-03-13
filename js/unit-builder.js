//unit-builder.js

export function buildUnitFromDuck(duck, pattern, team, x, y, facing, duckIndex){

const stats = duck.stats || {};

const mhp =
  (stats.def ?? 0) * 6 +
  (stats.atk ?? 0) * 4 +
  (stats.heal ?? 0) * 3 +
  (stats.tec ?? 0) * 2 +
  (stats.cri ?? 0) * 1 +
  (stats.speed ?? 0) * 0;

  
  const unit = {

    id: "duck_" + duckIndex,

    name: duck.name,

    team: team,

    role: duck.type,

    hp: mhp,
    mhp: mhp,

    atk: duck.stats.atk,
    def: duck.stats.def,
    heal: duck.stats.heal,
    speed: duck.stats.speed,
    cri: duck.stats.cri,

    x: x,
    y: y,

    facing: facing,

    icon: duck.icon.main,

    skills: pattern.skills
      .filter(s => s !== "")
      .map(s => ({ type:s }))

  };

  return unit;

}
