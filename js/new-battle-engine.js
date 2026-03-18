//battle-engine.js

import { skillHandlers } from "./skills.js";
import { chooseStep, facingFromDelta, isOccupiedCell, getKnockbackCell, getPullCell } from "./movement.js";
import { getEffectiveStat, applyEffect, processBeforeAction, processAfterAction } from "./battle-effects.js";
import { EFFECTS } from "./effects-config.js";
import { getNearestEnemy, getLowestHpAlly, getIdleFacing, decideFallbackMove } from "./battle-ai.js";
import { applyDamage, applyHeal, applyMove } from "./battle-actions.js";
import {getSkillChainCount,getManhattanCells,getAliveUnits,getEnemies,getAllies,getDistance,getChebyshevDistance,getRandomEnemy,getRandomAlly,
        getRandomAny,getUnitsInManhattanRange,getUnitsInSameRow,getUnitsInSameColumn} from "./new-battle-utils.js";


// ==========================================================
// メイン
// ==========================================================

export function simulateBattle(snapshot) {

  const rootGroup = {
  type: "group",
  children: []
};

const log = rootGroup;
  let battleFinished = false;


  const board = snapshot.board ?? { width: 7, height: 5 };
  const MAX_TURNS = snapshot.maxTurns ?? 50;

  // ======================================================
  // snapshotコピー
  // ======================================================

const units = snapshot.units.map(u => ({
  ...u,
  effects: [],        // stack系
  rateEffects: [],    // rate専用
  skills: (u.skills || []).map(s => ({
    ...s,
    _currentCooldown: 0
  }))
}));

  // ======================================================
  // 行動順固定
  // ======================================================

  units.sort((a, b) => b.speed - a.speed);

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

  function endAction(unit) {

    // ==================================================
    // 加速 / 減速 消費
    // ==================================================

if (unit.effects) {

  for (let i = unit.effects.length - 1; i >= 0; i--) {

    const e = unit.effects[i];

if (e.type === "accel" || e.type === "slow") {

  e.stock = 0;

  context.pushLog({
    type: "effectExpired",
    block: "effect",
    unit: unit.id,
    effect: { type: e.type }
  });

  unit.effects.splice(i,1);

}

  }

}

    processAfterAction(unit, context);

    context.pushLog({
      type: "actionEnd",
      unit: unit.id
    });
  }

  function waitAction(unit) {
    context.pushLog({
      type: "wait",
      unit: unit.id
    });

    endAction(unit);
  }

  function tryUseSkill(unit) {

    for (let skill of (unit.skills || [])) {

      if (skill._currentCooldown > 0) continue;

      const handler = skillHandlers[skill.type];
      if (!handler) continue;

      const result = handler.generateActions(unit, context);
      if (!result) continue;

      const actions = result.actions || [];
      if (actions.length === 0) continue;

      const hasEffect = actions.some(a =>
        a.type === "damage" ||
        a.type === "heal" ||
        a.type === "applyEffect" ||
        a.type === "move"
      );

      if (!hasEffect) continue;

      beginGroup({
  type: "skillUse",
  block: "skill",
  unit: unit.id,
  skill: skill.type,
  rangeCells: result.preview?.cells ?? null,
  rangeStyle: result.preview?.style ?? null
});

      for (let action of actions) {

        const source = units.find(u => u.id === action.source);
        const target = units.find(u => u.id === action.target);

        if (action.type === "damage") {
          if (source && target)
            applyDamage(source, target, action, context);
        }

        else if (action.type === "heal") {
          if (source && target)
            applyHeal(source, target, action, context);
        }

        else if (action.type === "applyEffect") {
          if (source && target)
            context.applyEffect(source, target, action, context);
        }

          else if (action.type === "removeEffect") {

  if (!target) return;

  const effectType = action.effect?.type;
  const amount = action.effect?.amount ?? 1;

  const def = EFFECTS[effectType];

  if (!def) {
    throw new Error(`Unknown effect type: ${effectType}`);
  }

  const existing =
    target.effects?.find(e => e.type === effectType);

  if (!existing) return;

existing.stock -= amount;

if (existing.stock > 0) {

  context.pushLog({
    type: "effectDecay",
    block: "effect",
    unit: target.id,
    effect: {
      type: effectType,
      stock: existing.stock
    }
  });

}

else {

  existing.stock = 0;

  target.effects =
    target.effects.filter(e => e !== existing);

  context.pushLog({
    type: "effectRemoved",
    block: "effect",
    unit: target.id,
    effect: { type: effectType }
  });

}

}

            else if (action.type === "clearEffect") {

  if (!target) return;

  const effectType = action.effect?.type;

  if (!effectType) return;

  const existing =
    target.effects?.find(e => e.type === effectType);

  if (!existing) return;

  target.effects =
    target.effects.filter(e => e !== existing);

context.pushLog({
  type: "effectRemoved",
  block: "effect",
  unit: target.id,
  effect: {
    type: effectType,
    clear: true
  }
});

}

        else if (action.type === "move") {
          applyMove(action, context);
        }
      }

if (handler.cooldown && handler.cooldown > 0) {
  skill._currentCooldown = handler.cooldown;
  context.pushLog({
    type: "cooldownSet",
    unit: unit.id,
    skill: skill.type,
    value: handler.cooldown
  });
}

endGroup();

return true;
    }

    return false;
  }

  function killUnit(unit) {

    if (unit._isDead) return;

    unit.hp = 0;
    unit._isDead = true;

    context.pushLog({
      type: "death",
      unit: unit.id
    });

    const aliveTeams = new Set(
      units
        .filter(u => u.hp > 0)
        .map(u => u.team)
    );

    if (aliveTeams.size === 1) {

      context.pushLog({
        type: "battleEnd",
        winner: [...aliveTeams][0]
      });

      battleFinished = true;
    }
  }

  // ======================================================
  // ターンループ
  // ======================================================

  let turn = 1;

  while (turn <= MAX_TURNS) {

    if (battleFinished) return log;

    context.pushLog({ type: "turnStart", turn });

    // ==================================================
    // ユニット行動
    // ==================================================

    for (let unit of units) {

      if (battleFinished) return log;
      if (unit.hp <= 0) continue;

      context.pushLog({
        type: "actionStart",
        unit: unit.id
      });

      processBeforeAction(unit, context);

      if (unit.hp <= 0) {
        endAction(unit);
        continue;
      }

      const enemies = getEnemies(units, unit.team);

      if (enemies.length === 0) {
        endAction(unit);
        return log;
      }

const skillChain = getSkillChainCount(unit);

let usedSkill = false;

for (let i = 0; i < skillChain; i++) {

  const result = tryUseSkill(unit);

  if (!result) break;

  usedSkill = true;

}

if (usedSkill) {

  endAction(unit);
  continue;

}

      const {
        targetUnit,
        moveMode,
        stopDistance,
        moveCount
      } = decideFallbackMove(
        unit,
        units,
        getDistance,
        getEnemies,
        getNearestEnemy,
        getLowestHpAlly,
        getAllies,
        board
      );

      // ==================================================
      // 加速 / 減速補正
      // ==================================================

      let accel = 0;
      let slow = 0;

      if (unit.effects) {
        for (const e of unit.effects) {

if (e.type === "accel") {
  accel = Math.max(accel, e.stock ?? 0);
}

if (e.type === "slow") {
  slow = Math.max(slow, e.stock ?? 0);
}
        }
      }

      const finalMoveCount = moveCount + accel - slow;
      const mobilityDelta = accel - slow;

      // ==================================================
      // 加速 / 減速ログ
      // ==================================================

if (mobilityDelta !== 0) {

  const effectName =
    mobilityDelta > 0 ? "accel" : "slow";

context.beginGroup({
  type: "effectTrigger",
  block: "effect",
  unit: unit.id,
  effect: effectName
});

context.pushLog({
  type: "mobilityChange",
  block: "effect",
  unit: unit.id,
  delta: mobilityDelta
});

endGroup();

}

      if (!targetUnit) {
        waitAction(unit);
        continue;
      }

      const targetPos = targetUnit;

      if (finalMoveCount <= 0) {
        waitAction(unit);
        continue;
      }

      const dxToTarget = targetPos.x - unit.x;
      const dyToTarget = targetPos.y - unit.y;

      const distToTarget = getDistance(unit, targetPos);

      if (
        moveMode === "toward" &&
        stopDistance >= 0 &&
        distToTarget <= stopDistance
      ) {

// 隣接敵がいればその敵を向く
const adjacentEnemy =
  units.find(u =>
    u.hp > 0 &&
    u.team !== unit.team &&
    Math.abs(u.x - unit.x) + Math.abs(u.y - unit.y) === 1
  );

let newFacing;

if (adjacentEnemy) {

  const dx = adjacentEnemy.x - unit.x;
  const dy = adjacentEnemy.y - unit.y;

  newFacing =
    facingFromDelta(dx, dy, unit.facing);

}
else {

  newFacing =
    facingFromDelta(dxToTarget, dyToTarget, unit.facing);

}
        const facedChanged =
          newFacing !== unit.facing;

        if (facedChanged) {

          unit.facing = newFacing;

          context.pushLog({
            type: "faceChange",
            unit: unit.id,
            facing: newFacing
          });

          if (tryUseSkill(unit)) {
            endAction(unit);
            continue;
          }

          waitAction(unit);
        }

        else {
          waitAction(unit);
        }

        continue;
      }

      // ==================================================
      // 移動処理
      // ==================================================

      for (let i = 0; i < finalMoveCount; i++) {

        if (
          moveMode === "toward" &&
          stopDistance >= 0
        ) {

          const dist = getDistance(unit, targetPos);

          if (dist <= stopDistance) {
            break;
          }
        }

        const step =
          chooseStep(unit, units, targetPos, board, moveMode);

        if (!step) break;

applyMove({
  type: "move",
  source: null,
  target: unit.id,
  x: step.x,
  y: step.y,
  forced: false
}, context);
      }

      endAction(unit);
    }

// ==================================================
// turn change
// ==================================================
  context.pushLog({
  type: "actionStart",
  unit: "__turn__",
  turn: turn + 1
});

for (let u of units) {

  let hasLog = false;

  context.beginGroup({
    type: "turnUnit",
    unit: u.id
  });

  // ======================
  // rate effect 減衰
  // ======================

  if (u.rateEffects) {

    for (let i = u.rateEffects.length - 1; i >= 0; i--) {

      const e = u.rateEffects[i];

      const before = e.duration;

      e.duration--;

      const after = e.duration;

      if (after > 0) {

        context.pushLog({
          type: "effectApplied",
          block: "effect",
          source: null,
          target: u.id,
          effect: {
            stat: e.stat,
            mode: "rate",
            value: e.value,
            duration: after,
            result: "turnDecay"
          }
        });

      } else {

        context.pushLog({
          type: "effectApplied",
          block: "effect",
          source: null,
          target: u.id,
          effect: {
            stat: e.stat,
            mode: "rate",
            value: e.value,
            duration: 0,
            result: "turnEnd"
          }
        });

      }

      hasLog = true;

      if (e.duration <= 0) {
        u.rateEffects.splice(i, 1);
      }

    }

  }

  // ======================
  // クールタイム減少
  // ======================

  for (let s of (u.skills || [])) {

    if (s._currentCooldown > 0) {

      s._currentCooldown--;

      context.pushLog({
        type: "cooldownChange",
        unit: u.id,
        skill: s.type,
        delta: -1
      });

      if (s._currentCooldown === 0) {
        context.pushLog({
          type: "cooldownSet",
          unit: u.id,
          skill: s.type,
          value: 0
        });
      }

      hasLog = true;
    }
  }

  context.endGroup();

}

  context.pushLog({
  type: "actionEnd",
  unit: "__turn__"
});
    
    turn++;
  }


  // ======================================================
  // 引き分け
  // ======================================================

  context.pushLog({
    type: "battleEnd",
    winner: null
  });

  return log;
}
