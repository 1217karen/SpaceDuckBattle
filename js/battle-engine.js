//battle-engine.js

import { skillHandlers 
       } from "./skills.js";
import {chooseStep,facingFromDelta,isOccupiedCell,getKnockbackCell,getPullCell
       } from "./movement.js";
import {getEffectiveStat,applyEffect,processBeforeAction,processAfterAction
       } from "./battle-effects.js";
import {getNearestEnemy,getLowestHpAlly,getIdleFacing,decideFallbackMove
       } from "./battle-ai.js";
import {applyDamage,applyHeal,applyMove
       } from "./battle-actions.js";

// ==========================================================
// 共通ユーティリティ
// ==========================================================

function getManhattanCells(center, range) {

  const cells = [];

  for (let dx = -range; dx <= range; dx++) {
    for (let dy = -range; dy <= range; dy++) {

      if (Math.abs(dx) + Math.abs(dy) <= range) {
        cells.push({
          x: center.x + dx,
          y: center.y + dy
        });
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
  return Math.max(
    Math.abs(a.x - b.x),
    Math.abs(a.y - b.y)
  );
}

// ==========================================================
// 安全判定
// ==========================================================

function isSafeFromEnemies(x, y, unit, units) {

  const enemies = getEnemies(units, unit.team);

  for (const e of enemies) {

    const d =
      Math.abs(x - e.x) +
      Math.abs(y - e.y);

    if (d <= 2) return false;

  }

  return true;
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

    const dist =
      Math.abs(center.x - u.x) +
      Math.abs(center.y - u.y);

    return dist <= range;

  });

}


function getUnitsInSameRow(unit, units) {
  return units.filter(u =>
    u.hp > 0 &&
    u.y === unit.y
  );
}

function getUnitsInSameColumn(unit, units) {
  return units.filter(u =>
    u.hp > 0 &&
    u.x === unit.x
  );
}

// ==========================================================
// メイン
// ==========================================================

export function simulateBattle(snapshot) {

  const log = [];
  let battleFinished = false;

  const board = snapshot.board ?? { width: 8, height: 6 };
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

  const context = {
    units,
    log,

    getDistance,
    getChebyshevDistance,

    getEnemies,
    getAllies,
         
    getNearestEnemy: (unit, units) =>
    getNearestEnemy(unit, units, getDistance, getEnemies),

    getLowestHpAlly: (unit, units) =>
    getLowestHpAlly(unit, units, getDistance, getAllies),

    getIdleFacing: (unit, units) =>
    getIdleFacing(unit,units,getDistance,getEnemies,getAllies,getNearestEnemy,getLowestHpAlly
  ),

    getUnitsInManhattanRange,
    getUnitsInSameRow,
    getUnitsInSameColumn,

    getEffectiveStat,

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
  processAfterAction(unit);
  log.push({
    type: "actionEnd",
    unit: unit.id
  });
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

    log.push({
      type: "skillUse",
      unit: unit.id,
      skill: skill.type,
      rangeCells: result.preview?.cells ?? null,
      rangeStyle: result.preview?.style ?? null
    });

    for (let action of actions) {

      if (action.type === "damage") {

        const source =
          units.find(u => u.id === action.source);
        const target =
          units.find(u => u.id === action.target);

        if (source && target)
          applyDamage(source, target, action, context);
      }

      else if (action.type === "heal") {

        const source =
          units.find(u => u.id === action.source);
        const target =
          units.find(u => u.id === action.target);

        if (source && target)
          applyHeal(source, target, action, context);
      }

      else if (action.type === "applyEffect") {

        const source =
          units.find(u => u.id === action.source);
        const target =
          units.find(u => u.id === action.target);

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


      // ----------------------------------------------
      // 行動開始
      // ----------------------------------------------

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
log.push({
  type: "debugMove",
  unit: unit.id,
  target: targetUnit?.id ?? null,
  moveMode,
  stopDistance
});
      // --------------------------------------------------
      // ターゲットなし
      // --------------------------------------------------

      if (!targetUnit) {

        log.push({
          type: "wait",
          unit: unit.id
        });

endAction(unit);

        continue;
      }


      const targetPos = targetUnit;


      // ==================================================
      // 距離チェック
      // ==================================================

      const dxToTarget = targetPos.x - unit.x;
      const dyToTarget = targetPos.y - unit.y;

      const distToTarget =
        Math.abs(dxToTarget) + Math.abs(dyToTarget);


if (
  moveMode === "toward" &&
  stopDistance >= 0 &&
  distToTarget <= stopDistance
) {

  const newFacing =
    facingFromDelta(dxToTarget, dyToTarget, unit.facing);

  const facedChanged =
    newFacing !== unit.facing;

  if (facedChanged) {

    unit.facing = newFacing;

    log.push({
      type: "faceChange",
      unit: unit.id,
      facing: newFacing
    });

    // 向き変更のみ → スキル再判定
    if (tryUseSkill(unit)) {
      endAction(unit);
      continue;
    }

    log.push({
      type: "wait",
      unit: unit.id
    });
  }

  else {

    log.push({
      type: "wait",
      unit: unit.id
    });
  }

  endAction(unit);
  continue;
}


      // ==================================================
      // 移動処理
      // ==================================================

      for (let i = 0; i < moveCount; i++) {

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
