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

  name: duck.name || "",
  defaultCharacterName:
    duck.defaultCharacterName ?? duck.name ?? "",
  defaultUnitName:
    duck.defaultUnitName ?? duck.name ?? "",

  team: team,

  role: duck.type,

  hp: mhp,
  mhp: mhp,

  atk: atk,
  def: def,
  heal: heal,
  tec: tec,
  speed: speed,
  cri: cri,

  x: x,
  y: y,

  facing: facing,

  icon: duck.icon?.default ?? "",

  patterns: duck.patterns || [],
  commIcons: duck.commIcons || [],
  commDialogues: duck.commDialogues || {},

  skills: (pattern.skills || [])
    .filter(s => {
      if (typeof s === "string") {
        return s !== "";
      }

      if (s && typeof s === "object") {
        return s.type && s.type !== "";
      }

      return false;
    })
    .map(s => {
      if (typeof s === "string") {
        return { type: s };
      }

      return { ...s };
    })

};

  return unit;

}
