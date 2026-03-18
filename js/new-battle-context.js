// new-battle-context.js

export function createBattleContext({
  units,
  board,
  skillHandlers,
  getDistance,
  getChebyshevDistance,
  getEnemies,
  getAllies,
  getNearestEnemy,
  getLowestHpAlly,
  getIdleFacing,
  getUnitsInManhattanRange,
  getUnitsInSameRow,
  getUnitsInSameColumn,
  getEffectiveStat,
  facingFromDelta,
  getKnockbackCell,
  getPullCell,
  applyEffect,
  getManhattanCells,
  getRandomEnemy,
  getRandomAlly,
  getRandomAny,
  killUnit
}) {

  const rootGroup = {
    type: "group",
    children: []
  };

  // ======================================================
  // context
  // ======================================================
function pushLog(event){

  const current =
    context.groupStack[context.groupStack.length - 1];

  current.children.push({
    type: "event",
    data: event
  });

}

function beginGroup(labelEvent = null){

  const group = {
    type: "group",
    label: labelEvent,
    children: []
  };

  const parent =
    context.groupStack[context.groupStack.length - 1];

  parent.children.push(group);

  context.groupStack.push(group);
}

  function endGroup(){
  context.groupStack.pop();
}

  
const context = {
    groupStack: [rootGroup],
    get depth(){
        return this.groupStack.length;
    },

    beginGroup,
    endGroup,
  
    units,
    log,
    getRateEffects: (unit) => unit.rateEffects || [],

    pushLog,

    getDistance,
    getChebyshevDistance,

    getEnemies,
    getAllies,

    getNearestEnemy: (unit, units) =>
      getNearestEnemy(unit, units, getDistance, getEnemies),

    getLowestHpAlly: (unit, units) =>
      getLowestHpAlly(unit, units, getDistance, getAllies),

    getIdleFacing: (unit, units) =>
      getIdleFacing(unit, units, getDistance, getEnemies, getAllies, getNearestEnemy, getLowestHpAlly),

    getUnitsInManhattanRange,
    getUnitsInSameRow,
    getUnitsInSameColumn,

    getEffectiveStat,

    getSkillMaxCooldown: (skillType) =>
      skillHandlers[skillType]?.cooldown ?? 0,

    facingFromDelta,

    getKnockbackCell: (source, target, units) =>
      getKnockbackCell(source, target, units, board),

    getPullCell: (source, target, units) =>
      getPullCell(source, target, units, board),

    applyEffect,

    getManhattanCells,

    getRandomEnemy,
    getRandomAlly,
    getRandomAny,

    killUnit
  };

  return context;
}
