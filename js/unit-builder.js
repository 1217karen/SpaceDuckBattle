//unit-builder.js

export function buildUnitFromDuck(duck, pattern, team, x, y, facing, duckIndex){

  const stats = duck.stats || {};

  const atk = stats.atk ?? 0;
  const def = stats.def ?? 0;
  const heal = stats.heal ?? 0;
  const tec = stats.tec ?? 0;
  const cri = stats.cri ?? 0;
  const speed = stats.speed ?? 0;

  const mhp =
    100 +
    def * 6 +
    atk * 4 +
    heal * 3 +
    tec * 2 +
    cri * 1 +
  　speed * 0;

  
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
