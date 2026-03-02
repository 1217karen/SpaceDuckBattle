//battle-engine.js

import { skillHandlers } from "./skills.js";
import { chooseStep, facingFromDelta, isOccupiedCell } from "./movement.js";

const BOARD_W = 8;
const BOARD_H = 6;


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
// ターゲット探索
// ==========================================================

function getNearestEnemy(unit, units) {

  const enemies = getEnemies(units, unit.team);
  if (enemies.length === 0) return null;

  let nearest = enemies[0];
  let minDist = getDistance(unit, nearest);

  for (let e of enemies) {

    const d = getDistance(unit, e);

    if (d < minDist) {
      minDist = d;
      nearest = e;
    }

  }

  return nearest;
}


function getLowestHpAlly(unit, units) {

  const allies = getAllies(units, unit.team, unit.id);
  if (!allies || allies.length === 0) return null;

  // HPが低い順、同値なら近い順
  let best = allies[0];

  for (let a of allies) {

    if (a.hp < best.hp) {
      best = a;
      continue;
    }

    if (a.hp === best.hp) {

      const da = getDistance(unit, a);
      const db = getDistance(unit, best);

      if (da < db) best = a;

    }

  }

  return best;
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
// 向き決定
// ==========================================================

function getIdleFacing(unit, units) {

  const role = unit.role || "attack";

  // ====================
  // ATTACK
  // ====================

  if (role === "attack") {

    const enemy = getNearestEnemy(unit, units);
    if (!enemy) return unit.facing;

    const dx = enemy.x - unit.x;
    const dy = enemy.y - unit.y;

    if (Math.abs(dx) >= Math.abs(dy)) {
      return dx > 0 ? "E" : "W";
    } else {
      return dy > 0 ? "S" : "N";
    }

  }

  // ====================
  // HEAL
  // ====================

  if (role === "heal") {

    const allies = getAllies(units, unit.team, unit.id);
    if (!allies || allies.length === 0) return unit.facing;

    let best = allies[0];

    for (let a of allies) {

      const d1 = getDistance(unit, a);
      const d2 = getDistance(unit, best);

      if (d1 < d2) best = a;
      else if (d1 === d2 && a.hp < best.hp) best = a;

    }

    const dx = best.x - unit.x;
    const dy = best.y - unit.y;

    if (Math.abs(dx) >= Math.abs(dy)) {
      return dx > 0 ? "E" : "W";
    } else {
      return dy > 0 ? "S" : "N";
    }

  }

  // ====================
  // DEFENSE
  // ====================

  if (role === "defense") {

    const adjacentEnemies =
      getEnemies(units, unit.team).filter(e =>
        getDistance(unit, e) === 1
      );

    if (adjacentEnemies.length > 0) {

      const e = adjacentEnemies[0];

      const dx = e.x - unit.x;
      const dy = e.y - unit.y;

      if (Math.abs(dx) >= Math.abs(dy)) {
        return dx > 0 ? "E" : "W";
      } else {
        return dy > 0 ? "S" : "N";
      }

    }

    const ally = getLowestHpAlly(unit, units);
    if (!ally) return unit.facing;

    const dx = ally.x - unit.x;
    const dy = ally.y - unit.y;

    if (Math.abs(dx) >= Math.abs(dy)) {
      return dx > 0 ? "E" : "W";
    } else {
      return dy > 0 ? "S" : "N";
    }

  }

  return unit.facing;
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
// ステータス計算
// ==========================================================

function getEffectiveStat(unit, statName) {

  const base = unit[statName] || 0;

  if (!unit.effects || unit.effects.length === 0) {
    return base;
  }

  let flatBonus = 0;
  let rateBonus = 0;

  for (let effect of unit.effects) {

    if (effect.stat !== statName) continue;

    if (effect.mode === "flat") {
      flatBonus += effect.value;
    }

    if (effect.mode === "rate") {
      rateBonus += effect.value;
    }

  }

  const afterFlat = base + flatBonus;
  const finalValue = afterFlat * (1 + rateBonus);

  return finalValue;
}


// ==========================================================
// ダメージ処理
// ==========================================================

function applyDamage(source, target, action, ctx) {

  let finalDamage = 0;

  const power = action.power || 0;
  const type = action.damageType || "normal";

  if (type === "normal") {

    const atk = getEffectiveStat(source, "atk");
    const df = getEffectiveStat(target, "df");

    finalDamage = Math.max(atk + power - df, 0);

  }

  else if (type === "pierce") {

    const atk = getEffectiveStat(source, "atk");
    finalDamage = atk + power;

  }

  else if (type === "fixed") {
    finalDamage = power;
  }

  else if (type === "effect") {
    finalDamage = power;
  }


  // =========================
  // 距離減衰
  // =========================

  if (action.falloff) {

    const distance =
      ctx.getChebyshevDistance(source, target);

    if (distance > 1) {

      const FALLOFF_RATE = 0.2;

      const multiplier =
        1 - (distance - 1) * FALLOFF_RATE;

      const clamped =
        multiplier < 0 ? 0 : multiplier;

      finalDamage =
        Math.floor(finalDamage * clamped);

    }

  }


  target.hp -= finalDamage;

  ctx.log.push({
    type: "attack",
    from: source.id,
    to: target.id,
    amount: finalDamage,
    damageType: type
  });

  ctx.log.push({
    type: "hpChange",
    target: target.id,
    hp: Math.max(target.hp, 0)
  });


  if (target.hp <= 0) {

    ctx.log.push({
      type: "death",
      unit: target.id
    });

    const aliveTeams = new Set(
      ctx.units
        .filter(u => u.hp > 0)
        .map(u => u.team)
    );

    if (aliveTeams.size === 1) {

      const winner = [...aliveTeams][0];

      ctx.log.push({
        type: "battleEnd",
        winner: winner
      });

    }

  }

}
// ==========================================================
// 回復処理
// ==========================================================

function applyHeal(source, target, action, ctx) {

  let finalHeal = 0;

  const power = action.power || 0;
  const type = action.healType || "fixed";

  if (type === "fixed") {
    finalHeal = power;
  }

  else if (type === "scale") {
    const atk = source.atk || 0;
    finalHeal = atk + power;
  }

  target.hp = Math.min(
    target.hp + finalHeal,
    target.mhp ?? target.hp
  );

  ctx.log.push({
    type: "heal",
    from: source.id,
    to: target.id,
    amount: finalHeal,
    healType: type
  });

  ctx.log.push({
    type: "hpChange",
    target: target.id,
    hp: target.hp
  });

}


// ==========================================================
// 移動処理
// ==========================================================

function applyMove(action, ctx) {

  const unit =
    ctx.units.find(u => u.id === action.target);

  if (!unit) return;

  const fromX = unit.x;
  const fromY = unit.y;

  unit.x = action.x;
  unit.y = action.y;

  ctx.log.push({
    type: "move",
    unit: unit.id,
    x: action.x,
    y: action.y
  });

  const dx = action.x - fromX;
  const dy = action.y - fromY;

  const newFacing =
    facingFromDelta(dx, dy, unit.facing);

  if (newFacing !== unit.facing) {

    unit.facing = newFacing;

    ctx.log.push({
      type: "faceChange",
      unit: unit.id,
      facing: newFacing
    });

  }

}


// ==========================================================
// ノックバック
// ==========================================================

function getKnockbackCell(source, target, units) {

  const dx = target.x - source.x;
  const dy = target.y - source.y;

  let stepX = 0;
  let stepY = 0;

  if (Math.abs(dx) >= Math.abs(dy)) {
    stepX = dx > 0 ? 1 : -1;
  } else {
    stepY = dy > 0 ? 1 : -1;
  }

  const nx = target.x + stepX;
  const ny = target.y + stepY;

  if (nx < 0 || nx >= BOARD_W || ny < 0 || ny >= BOARD_H) {
    return null;
  }

  if (isOccupiedCell(units, nx, ny, target.id)) {
    return null;
  }

  return { x: nx, y: ny };

}


// ==========================================================
// 引き寄せ
// ==========================================================

function getPullCell(source, target, units) {

  const dx = source.x - target.x;
  const dy = source.y - target.y;

  let stepX = 0;
  let stepY = 0;

  if (Math.abs(dx) >= Math.abs(dy)) {
    stepX = dx > 0 ? 1 : -1;
  } else {
    stepY = dy > 0 ? 1 : -1;
  }

  const nx = target.x + stepX;
  const ny = target.y + stepY;

  if (nx < 0 || nx >= BOARD_W || ny < 0 || ny >= BOARD_H) {
    return null;
  }

  if (isOccupiedCell(units, nx, ny, target.id)) {
    return null;
  }

  return { x: nx, y: ny };

}


// ==========================================================
// エフェクト処理
// ==========================================================

function applyEffect(source, target, action, ctx) {

  const effectData = action.effect;
  if (!effectData) return;

  if (!target.effects) {
    target.effects = [];
  }


  // =========================
  // 永続 flat
  // =========================

  if (effectData.duration === null) {

    const stackKey = effectData.stat + "_flat";
    const DIMINISH = 0.75;

    const stackCount =
      target.effects.filter(
        e => e.stackKey === stackKey
      ).length;

    const finalValue =
      effectData.value *
      Math.pow(DIMINISH, stackCount);

    const newEffect = {
      category: "permanent",
      stat: effectData.stat,
      mode: "flat",
      value: finalValue,
      duration: null,
      stackKey: stackKey
    };

    target.effects.push(newEffect);

    ctx.log.push({
      type: "effectApplied",
      from: source.id,
      to: target.id,
      effect: newEffect
    });

    return;
  }


  // =========================
  // ターン制 rate
  // =========================

  const stat = effectData.stat;
  const newValue = effectData.value;
  const newDuration = effectData.duration;

  const existing = target.effects.find(
    e =>
      e.category === "timed" &&
      e.stat === stat &&
      e.mode === "rate"
  );


  // 既存が無い → 追加

  if (!existing) {

    const newEffect = {
      category: "timed",
      stat: stat,
      mode: "rate",
      value: newValue,
      duration: newDuration
    };

    target.effects.push(newEffect);

    ctx.log.push({
      type: "effectApplied",
      from: source.id,
      to: target.id,
      effect: newEffect
    });

    return;
  }


  const absCurrent = Math.abs(existing.value);
  const absNew = Math.abs(newValue);


  // =========================
  // 強い → 上書き
  // =========================

  if (absNew > absCurrent) {

    existing.value = newValue;
    existing.duration = newDuration;

    ctx.log.push({
      type: "effectApplied",
      from: source.id,
      to: target.id,
      effect: existing
    });

    return;
  }


  // =========================
  // 同値 → 延長
  // =========================

  if (newValue === existing.value) {

    existing.duration += newDuration;

    ctx.log.push({
      type: "effectApplied",
      from: source.id,
      to: target.id,
      effect: existing
    });

    return;
  }


  // =========================
  // 弱い → 総量換算
  // =========================

  const addedTotal = absNew * newDuration;

  const convertTurn =
    Math.floor(addedTotal / absCurrent);

  if (convertTurn > 0) {

    existing.duration += convertTurn;

    ctx.log.push({
      type: "effectApplied",
      from: source.id,
      to: target.id,
      effect: existing
    });

  }

}
// ==========================================================
// メイン
// ==========================================================

export function simulateBattle(snapshot) {

  const log = [];

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
    getNearestEnemy,
    getLowestHpAlly,

    getIdleFacing,

    getUnitsInManhattanRange,
    getUnitsInSameRow,
    getUnitsInSameColumn,

    getEffectiveStat,

    applyDamage,
    applyHeal,
    applyMove,

    getKnockbackCell,
    getPullCell,

    applyEffect,

    getManhattanCells,

    getRandomEnemy,
    getRandomAlly,
    getRandomAny
  };


  // ======================================================
  // ターンループ
  // ======================================================

  let turn = 1;
  const MAX_TURNS = 50;

  while (turn <= MAX_TURNS) {

    log.push({ type: "turnStart", turn });


    // ==================================================
    // ユニット行動
    // ==================================================

    for (let unit of units) {

      if (unit.hp <= 0) continue;


      // ----------------------------------------------
      // 行動開始
      // ----------------------------------------------

      log.push({
        type: "actionStart",
        unit: unit.id
      });


      const enemies = getEnemies(units, unit.team);

      if (enemies.length === 0) {

        log.push({
          type: "actionEnd",
          unit: unit.id
        });

        log.push({
          type: "battleEnd",
          winner: unit.team
        });

        return log;
      }


      // ==================================================
      // スキル処理
      // ==================================================

      let usedSkill = false;

      for (let skill of (unit.skills || [])) {

        // クールタイム中
        if (skill._currentCooldown > 0) continue;

        const handler = skillHandlers[skill.type];
        if (!handler) continue;

        const result = handler.generateActions(unit, context);
        if (!result) continue;

        const actions = result.actions || [];
        if (actions.length === 0) continue;

        const rangeCells =
          result.preview ? result.preview.cells : null;

        const rangeStyle =
          result.preview ? result.preview.style : null;


        // ----------------------------------------------
        // 効果判定
        // ----------------------------------------------

        const hasEffect = actions.some(a =>
          a.type === "damage" ||
          a.type === "heal" ||
          a.type === "applyEffect" ||
          a.type === "move"
        );

        if (!hasEffect) continue;


        // ----------------------------------------------
        // スキル使用ログ
        // ----------------------------------------------

        log.push({
          type: "skillUse",
          unit: unit.id,
          skill: skill.type,
          rangeCells: rangeCells,
          rangeStyle: rangeStyle
        });


        // ----------------------------------------------
        // Action実行
        // ----------------------------------------------

        for (let action of actions) {

          if (
            action.type !== "damage" &&
            action.type !== "heal" &&
            action.type !== "applyEffect" &&
            action.type !== "move"
          ) continue;


          if (action.type === "damage") {

            const source =
              units.find(u => u.id === action.source);

            const target =
              units.find(u => u.id === action.target);

            if (!source || !target) continue;

            context.applyDamage(source, target, action, context);
          }

          else if (action.type === "heal") {

            const source =
              units.find(u => u.id === action.source);

            const target =
              units.find(u => u.id === action.target);

            if (!source || !target) continue;

            context.applyHeal(source, target, action, context);
          }

          else if (action.type === "applyEffect") {

            const source =
              units.find(u => u.id === action.source);

            const target =
              units.find(u => u.id === action.target);

            if (!source || !target) continue;

            context.applyEffect(source, target, action, context);
          }

          else if (action.type === "move") {

            const target =
              units.find(u => u.id === action.target);

            if (!target) continue;

            context.applyMove(action, context);
          }

        }


        // ----------------------------------------------
        // クールタイム設定
        // ----------------------------------------------

        if (handler.cooldown && handler.cooldown > 0) {
          skill._currentCooldown = handler.cooldown;
        }

        usedSkill = true;
        break;

      }


      // ==================================================
      // スキル使用した場合
      // ==================================================

      if (usedSkill) {

        log.push({
          type: "actionEnd",
          unit: unit.id
        });

        continue;
      }


      // ==================================================
      // fallback移動
      // ==================================================

      const role = unit.role || "attack";

      let moveMode = "toward";
      let targetUnit = null;
      let stopDistance = 1;
      let moveCount = 1;


      // --------------------------------------------------
      // ATTACK
      // --------------------------------------------------

      if (role === "attack") {
        targetUnit = getNearestEnemy(unit, units);
        moveMode = "toward";
      }


      // --------------------------------------------------
      // SPEED
      // --------------------------------------------------

      else if (role === "speed") {
        targetUnit = getNearestEnemy(unit, units);
        moveMode = "toward";
        moveCount = 2;
      }


      // --------------------------------------------------
      // TECHNICAL
      // --------------------------------------------------

      else if (role === "technical") {

        targetUnit = getNearestEnemy(unit, units);

        if (targetUnit) {

          const dist =
            Math.abs(unit.x - targetUnit.x) +
            Math.abs(unit.y - targetUnit.y);

          if (dist > 2) {
            moveMode = "toward";
          }

          else if (dist < 2) {
            moveMode = "away";
          }

          else {
            stopDistance = 2;
          }

        }
      }


      // --------------------------------------------------
      // ターゲットなし
      // --------------------------------------------------

      if (!targetUnit) {

        log.push({
          type: "wait",
          unit: unit.id
        });

        log.push({
          type: "actionEnd",
          unit: unit.id
        });

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

        if (newFacing !== unit.facing) {

          unit.facing = newFacing;

          log.push({
            type: "faceChange",
            unit: unit.id,
            facing: newFacing
          });

        }

        else {

          log.push({
            type: "wait",
            unit: unit.id
          });

        }

        log.push({
          type: "actionEnd",
          unit: unit.id
        });

        continue;
      }


      // ==================================================
      // 移動処理
      // ==================================================

      for (let i = 0; i < moveCount; i++) {

        const step =
          chooseStep(unit, units, targetPos, moveMode);

        if (!step) break;

        context.applyMove({
          type: "move",
          target: unit.id,
          x: step.x,
          y: step.y,
          forced: false
        }, context);

      }


      log.push({
        type: "actionEnd",
        unit: unit.id
      });

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
