//new-battle-engine.js

import { skillHandlers } from "./skills.js";
import { chooseStep, facingFromDelta, isOccupiedCell, getKnockbackCell, getPullCell } from "./new-movement.js";
import { applyEffect, processBeforeAction, processAfterAction } from "./new-battle-effects.js";
import { getEffectiveStat } from "./new-battle-stats.js";
import { EFFECTS } from "./effects-config.js";
import { getNearestEnemy, getLowestHpAlly, getIdleFacing, decideFallbackMove } from "./new-battle-ai.js";
import { applyDamage, applyHeal, applyMove } from "./new-battle-actions.js";
import {getSkillChainCount,getManhattanCells,getAliveUnits,getEnemies,getAllies,getDistance,getChebyshevDistance,getRandomEnemy,getRandomAlly,
        getRandomAny,getUnitsInManhattanRange,getUnitsInSameRow,getUnitsInSameColumn} from "./new-battle-utils.js";
import { createBattleContext } from "./new-battle-context.js";
import { tryUseSkill } from "./new-battle-skill.js";
import { runBattleTurns } from "./new-battle-turn.js";


// ==========================================================
// メイン
// ==========================================================

export function simulateBattle(snapshot) {

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

  const context = createBattleContext({
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
});

const log = context.log;

runBattleTurns({
  context,
  units,
  board,
  MAX_TURNS,
  getDistance,
  getEnemies,
  getNearestEnemy,
  getLowestHpAlly,
  getAllies
});

  return log;
}
