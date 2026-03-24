// new-battle-turn.js

import { tryUseSkill } from "./new-battle-skill.js";
import { chooseStep, facingFromDelta } from "./new-movement.js";
import { applyMove } from "./new-battle-move.js";
import { processBeforeAction, processAfterAction } from "./new-battle-effects.js";
import { decideFallbackMove } from "./new-battle-ai.js";
import { createScoreFn, isDangerCell } from "./new-battle-ai.js";
import { getSkillChainCount } from "./new-battle-utils.js";

export function runBattleTurns({
  context,
  units,
  board,
  MAX_TURNS,
  getDistance,
  getEnemies,
  getNearestEnemy,
  getLowestHpAlly,
  getAllies
}) {

  function endAction(unit) {

    // accel / slow 消費
    if (unit.effects) {
      for (let i = unit.effects.length - 1; i >= 0; i--) {

        const e = unit.effects[i];

        if (
          (e.type === "accel" || e.type === "slow") &&
          e._usedThisAction
        ) {

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

    if (
      context.battleState.finished &&
      !context.battleState._battleEndLogged
    ) {
      context.pushLog({
        type: "battleEnd",
        winner: context.battleState.winner ?? null
      });

      context.battleState._battleEndLogged = true;
    }
      }

      function waitAction(unit) {
        context.pushLog({
          type: "wait",
          unit: unit.id
        });

        endAction(unit);

    if (context.battleState.finished) {
      return "END";
    }
  }

  
// ======================================================
// ターンループ
// ======================================================

  let turn = 1;

  while (turn <= MAX_TURNS) {

    context.pushLog({ type: "turnStart", turn });

    if (turn === 1) {
      context.pushLog({
        type: "actionStart",
        unit: "__turn__",
        turn: 1
      });

      for (const unit of units) {
        if (unit.hp <= 0) continue;

        context.beginGroup({
          type: "turnUnit",
          unit: unit.id,
          phase: "battleStart",
          actionLabel: "スタンバイ"
        });

        context.endGroup();
      }

      context.pushLog({
        type: "actionEnd",
        unit: "__turn__"
      });
    }

    // ==================================================
    // ユニット行動
    // ==================================================

    for (let unit of units) {

      if (unit.hp <= 0) continue;

      context.pushLog({
        type: "actionStart",
        unit: unit.id
      });

      // effect使用フラグをリセット
      if (unit.effects) {
        for (const e of unit.effects) {
          e._usedThisAction = false;
        }
      }

      processBeforeAction(unit, context);

      if (unit.hp <= 0) {
        endAction(unit);
        continue;
      }

      const enemies = getEnemies(units, unit.team);

      if (enemies.length === 0) {
  endAction(unit);
  break;
}

const skillChain = getSkillChainCount(unit);

let usedSkill = false;

for (let i = 0; i < skillChain; i++) {

  const result = tryUseSkill(unit, context);

  if (!result) break;

  usedSkill = true;

}

if (usedSkill) {

  endAction(unit);

  if (context.battleState.finished) break;

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
  const val = e.stock ?? 0;
  if (val > accel) {
    accel = val;
    e._usedThisAction = true;
  }
}

if (e.type === "slow") {
  const val = e.stock ?? 0;
  if (val > slow) {
    slow = val;
    e._usedThisAction = true;
  }
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

context.endGroup();

}

      if (!targetUnit) {
        if (waitAction(unit) === "END") break;
        continue;
      }

      const targetPos = targetUnit;

      if (finalMoveCount <= 0) {
        if (waitAction(unit) === "END") break;
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

          if (tryUseSkill(unit, context)) {
            endAction(unit);
            continue;
          }

          if (waitAction(unit) === "END") break;
        }

        else {
          if (waitAction(unit) === "END") break;
        }

        continue;
      }


      let moved = false;
      
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
  chooseStep(unit, units, targetPos, board, {
    moveMode,
    scoreFn: createScoreFn(unit),
    isDanger: (x, y) => isDangerCell(unit, units, x, y)
  });

        if (!step) break;

applyMove({
  type: "move",
  source: null,
  target: unit.id,
  x: step.x,
  y: step.y,
  forced: false
}, context);

moved = true;
      }

      if (!moved) {
  if (waitAction(unit) === "END") break;
  continue;
}

      endAction(unit);
if (context.battleState.finished) break;
}

if (context.battleState.finished) break;

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
    unit: u.id,
    phase: "turnChange"
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

  if (!context.battleState._battleEndLogged) {
    context.pushLog({
      type: "battleEnd",
      winner: null
    });
  }
}
