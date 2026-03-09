export function buildUnitFromDuck(duck, pattern, team, x, y, facing){

  const unit = {

    id: "duck_" + Date.now(),

    name: duck.name,

    team: team,

    role: duck.type,

    hp: duck.mhp,
    mhp: duck.mhp,

    atk: duck.stats.atk,
    df: duck.stats.df,
    heal: duck.stats.heal,
    speed: duck.stats.speed,

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
