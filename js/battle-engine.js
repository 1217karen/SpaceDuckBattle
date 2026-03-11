//battle-engine.js

import { skillHandlers } from "./skills.js";
import { chooseStep, facingFromDelta, isOccupiedCell, getKnockbackCell, getPullCell } from "./movement.js";
import { getEffectiveStat, applyEffect, processBeforeAction, processAfterAction } from "./battle-effects.js";
import { getNearestEnemy, getLowestHpAlly, getIdleFacing, decideFallbackMove } from "./battle-ai.js";
import { applyDamage, applyHeal, applyMove } from "./battle-actions.js";

// ==========================================================
// 共通ユーティリティ
// ==========================================================

function getManhattanCells(center, range) {
  const cells = [];

  for (let dx = -range; dx <= range; dx++) {
    for (let dy = -range; dy <= range; dy++) {
      if (Math.abs(dx) + Math.abs(dy) <= range) {
        cells.push({ x: center.x + dx, y: center.y + dy });
      }
    }
  }

  return cells;
}

function getAliveUnits(units) {
  return units.filter(u => u.hp > 0);
}

function getEnemies(units, team) {
  return units.filter(u => u.team !== team && u.hp > 0);
}

function getAllies(units, team, selfId) {
  return units.filter(u => u.team === team && u.id !== selfId && u.hp > 0);
}

function getDistance(a, b) {
  // 今はマンハッタン距離（将来トーラス化可能）
  return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
}

function getChebyshevDistance(a, b) {
  return Math.max(Math.abs(a.x - b.x), Math.abs(a.y - b.y));
}

// ==========================================================
// ランダム取得
// ==========================================================

function getRandomUnit(list) {
  if (!list || list.length === 0) return null;
  const index = Math.floor(Math.random() * list.length);
  return list[index];
}

function getRandomEnemy(unit, units) {
  const enemies = getEnemies(units, unit.team);
  return getRandomUnit(enemies);
}

function getRandomAlly(unit, units) {
  const allies = getAllies(units, unit.team, unit.id);
  return getRandomUnit(allies);
}

function getRandomAny(units) {
  const alive = getAliveUnits(units);
  return getRandomUnit(alive);
}

// ==========================================================
// 範囲取得
// ==========================================================

function getUnitsInManhattanRange(center, units, range) {
  return units.filter(u => {
    if (u.hp <= 0) return false;
    const dist = getDistance(center, u);
    return dist <= range;
  });
}

function getUnitsInSameRow(unit, units) {
  return units.filter(u => u.hp > 0 && u.y === unit.y);
}

function getUnitsInSameColumn(unit, units) {
  return units.filter(u => u.hp > 0 && u.x === unit.x);
}

// ==========================================================
// メイン
// ==========================================================

export function simulateBattle(snapshot) {

  const log = [];
  let battleFinished = false;

  let logGroup = 0;
  let groupLevel = 0;

  const board = snapshot.board ?? { width: 7, height: 5 };
  const MAX_TURNS = snapshot.maxTurns ?? 50;

  // ======================================================
  // snapshotコピー
  // ======================================================

  const units = snapshot.units.map(u => ({
    ...u,
    effects: [],
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

  if(context.currentGroup !== null){
    event.group = context.currentGroup;
  }

  if(event.groupLevel === undefined){
    event.groupLevel = context.groupLevel;
  }

  if(event.subLevel === undefined){
    event.subLevel = 0;
  }

  log.push(event);
}
  
  const context = {
    currentGroup: null,
    groupLevel: 0,
    
    units,
    log,

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
      unit.effects = unit.effects.filter(
        e => e.type !== "accel" && e.type !== "slow"
      );
    }

    processAfterAction(unit, context);

    log.push({
      type: "actionEnd",
      unit: unit.id
    });

context.currentGroup = null;
    context.groupLevel = 0;
    
  }

  function waitAction(unit) {
    log.push({
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

context.currentGroup = ++logGroup;
      context.groupLevel = 1;
      
      context.pushLog({
  type: "skillUse",
  level: 0,
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

        else if (action.type === "move") {
          applyMove(action, context);
        }
      }

      if (handler.cooldown && handler.cooldown > 0) {
        skill._currentCooldown = handler.cooldown;
      }

      return true;
    }

    return false;
  }

  function killUnit(unit) {

    if (unit._isDead) return;

    unit.hp = 0;
    unit._isDead = true;

    log.push({
      type: "death",
      unit: unit.id
    });

    const aliveTeams = new Set(
      units
        .filter(u => u.hp > 0)
        .map(u => u.team)
    );

    if (aliveTeams.size === 1) {

      log.push({
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

    log.push({ type: "turnStart", turn });

    // ==================================================
    // ユニット行動
    // ==================================================

    for (let unit of units) {

      if (battleFinished) return log;
      if (unit.hp <= 0) continue;

      log.push({
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

      if (tryUseSkill(unit)) {
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
            accel = Math.max(accel, e.value ?? 1);
          }

          if (e.type === "slow") {
            slow = Math.max(slow, e.value ?? 1);
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

context.pushLog({
  type: "skillUse",
  groupLevel: context.groupLevel,
  subLevel: 0,
  unit: unit.id,
  skill: skill.type,
})

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

          log.push({
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
          target: unit.id,
          x: step.x,
          y: step.y,
          forced: false
        }, context);
      }

      endAction(unit);
    }

    // ==================================================
    // ターン制effect減少
    // ==================================================

    for (let u of units) {

      if (!u.effects) continue;

      for (let i = u.effects.length - 1; i >= 0; i--) {

        const e = u.effects[i];

        if (e.category === "timed" && e.duration !== null) {

          e.duration--;

          if (e.duration <= 0) {
            u.effects.splice(i, 1);
          }
        }
      }
    }

    // ==================================================
    // クールタイム減少
    // ==================================================

    for (let u of units) {
      for (let s of (u.skills || [])) {

        if (s._currentCooldown > 0) {
          s._currentCooldown--;
        }
      }
    }

    turn++;
  }

  // ======================================================
  // 引き分け
  // ======================================================

  log.push({
    type: "battleEnd",
    winner: null
  });

  return log;
}
