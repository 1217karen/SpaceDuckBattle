//unit-builder.js

export function buildUnitFromDuck(duck, pattern, team, x, y, facing, duckIndex){

  const stats = duck.stats || {};

  const MHP =
  100 +
  DEF × 6 +
  ATK × 4 +
  HEAL × 3 +
  TEC × 2 +
  CRI × 1 +
  SPEED × 0
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
