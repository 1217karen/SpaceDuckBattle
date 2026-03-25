//new-battle-engine.js

import { skillHandlers } from "./skills.js";
import { facingFromDelta, getKnockbackCell, getPullCell } from "./new-movement.js";
import { applyEffect } from "./new-battle-effects.js";
import { getEffectiveStat } from "./new-battle-stats.js";
import { getNearestEnemy, getLowestHpAlly, getIdleFacing } from "./new-battle-ai.js";
import { applyHeal } from "./new-battle-heal.js";
import {getManhattanCells,getEnemies,getAllies,getDistance,getChebyshevDistance,getRandomEnemy,
  getRandomAlly,getRandomAny,getUnitsInManhattanRange,getUnitsInSameRow,getUnitsInSameColumn} from "./new-battle-utils.js";
import { createBattleContext } from "./new-battle-context.js";
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
    effects: [],
    rateEffects: [],
    skills: (u.skills || []).map(s => {
      if (typeof s === "string") {
        return {
          type: s,
          _currentCooldown: 0
        };
      }

      return {
        ...s,
        _currentCooldown: 0
      };
    })
  }));

  // ======================================================
  // 行動順固定
  // ======================================================

  units.sort((a, b) => b.speed - a.speed);

  // ======================================================
  // バトル状態
  // ======================================================

  const simState = { finished: false };
  // ======================================================
  // ランダム抽選
  // ======================================================

  function normalizeDialogueCandidates(dialogue) {
  if (!dialogue) return [];

  if (Array.isArray(dialogue)) {
    return dialogue.filter(item =>
      item && typeof item.text === "string"
    );
  }

  if (typeof dialogue.text === "string") {
    return [dialogue];
  }

  return [];
}

function pickRandomDialogue(dialogue) {
  const candidates =
    normalizeDialogueCandidates(dialogue);

  if (candidates.length === 0) return null;
  if (candidates.length === 1) return candidates[0];

  const index =
    Math.floor(Math.random() * candidates.length);

  return candidates[index];
}

function findUnitById(unitId) {
  return units.find(u => u.id === unitId) || null;
}

function buildCommPayload(unit, dialogue) {
  if (!unit || !dialogue?.text) return null;

  return {
    iconUrl:
      dialogue.iconUrl ||
      unit.defaultCommIconUrl ||
      unit.icon ||
      "https://placehold.co/60x60?text=NO+IMG",
    text: dialogue.text
  };
}

function getSkillDialogue(unit, skillType) {
  if (!unit || !skillType) return null;

  const patterns = unit.patterns || [];

  for (const pattern of patterns) {
    const skills = pattern.skills || [];

    for (const skill of skills) {
      if (skill.type !== skillType) continue;
      return pickRandomDialogue(skill.dialogue || null);
    }
  }

  return null;
}

function getFixedDialogue(unit, key) {
  if (!unit || !key) return null;

  const dialogues = unit.commDialogues || null;
  if (!dialogues) return null;

  return pickRandomDialogue(dialogues[key] || null);
}

function resolveCommPayloadForEvent(event) {
  if (!event) return null;

  if (event.type === "skillUse") {
    const unit = findUnitById(event.unit);
    const dialogue =
      getSkillDialogue(unit, event.skill);

    return buildCommPayload(unit, dialogue);
  }

  if (event.type === "turnUnit") {
    const unit = findUnitById(event.unit);
    if (!unit) return null;

    let dialogue = null;

    if (event.phase === "battleStart") {
      dialogue = getFixedDialogue(unit, "battleStart");
    } else if (event.phase === "turnChange") {
      dialogue = getFixedDialogue(unit, "turnChange");
    }

    if (!dialogue?.text) {
      return {
        iconUrl:
          unit.defaultCommIconUrl ||
          unit.icon ||
          "https://placehold.co/60x60?text=NO+IMG",
        text: ""
      };
    }

    return buildCommPayload(unit, dialogue);
  }

    if (event.type === "critical") {
    const unit = findUnitById(event.unit);
    const dialogue =
      getFixedDialogue(unit, "critical");

    return buildCommPayload(unit, dialogue);
  }

  if (event.type === "kill") {
    const unit = findUnitById(event.unit);
    const dialogue =
      getFixedDialogue(unit, "kill");

    return buildCommPayload(unit, dialogue);
  }

  if (event.type === "battleEnd") {
    if (event.winner == null) return null;

    const unit = findUnitById(event.unit);
    if (!unit) return null;
    if (unit.team !== event.winner) return null;

    const dialogue =
      getFixedDialogue(unit, "battleEndWin");

    return buildCommPayload(unit, dialogue);
  }

  return null;
}

function attachCommToEvent(event) {
  const comm =
    resolveCommPayloadForEvent(event);

  if (comm) {
    return {
      ...event,
      comm
    };
  }

  return event;
}

function pushCriticalLog(unit, block = "skill") {
  if (!unit?.id) return;

  context.pushLog(
    attachCommToEvent({
      type: "critical",
      block,
      unit: unit.id
    })
  );
}

function pushBattleLog(event) {
  context.pushLog(
    attachCommToEvent(event)
  );
}

  // ======================================================
  // kill処理
  // ======================================================

  function killUnit(unit, source = null) {
    if (unit._isDead) return;

    unit.hp = 0;
    unit._isDead = true;

    if (source && source.id !== unit.id) {
      pushBattleLog({
        type: "kill",
        unit: source.id,
        target: unit.id
      });
    }

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
      simState.finished = true;
      simState.winner = [...aliveTeams][0];
    }
  }

  // ======================================================
  // context生成
  // ======================================================

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
    killUnit,
    battleState: simState
  });

  context.attachCommToEvent = attachCommToEvent;
  context.pushBattleLog = pushBattleLog;
  context.pushCriticalLog = pushCriticalLog;

  const log = context.log;

  // ======================================================
  // 実行
  // ======================================================

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

  return {
    log,
    finished: simState.finished,
    winner: simState.winner ?? null
  };
}
