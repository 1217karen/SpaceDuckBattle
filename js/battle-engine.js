//battle-engine.js

import { skillHandlers } from "./skills.js";
import { chooseStep, facingFromDelta, isOccupiedCell } from "./movement.js";

const BOARD_W = 10;
const BOARD_H = 6;

// ==========================
// 共通ユーティリティ
// ==========================
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

    const adjacentEnemies = getEnemies(units, unit.team).filter(e =>
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
  // 距離減衰（falloff:true の場合のみ）
  // =========================
  if (action.falloff) {

    const distance =
      ctx.getChebyshevDistance(source, target);

    if (distance > 1) {

      const FALLOFF_RATE = 0.2; // 1マスごと20%

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
    type:"attack",
    from:source.id,
    to:target.id,
    amount:finalDamage,
    damageType:type
  });

  ctx.log.push({
    type:"hpChange",
    target:target.id,
    hp:Math.max(target.hp,0)
  });

if (target.hp <= 0) {

  ctx.log.push({
    type:"death",
    unit:target.id
  });

  // ====================
  // 勝敗判定
  // ====================

  const aliveTeams = new Set(
    ctx.units
      .filter(u => u.hp > 0)
      .map(u => u.team)
  );

  if (aliveTeams.size === 1) {

    const winner = [...aliveTeams][0];

    ctx.log.push({
      type:"battleEnd",
      winner: winner
    });
  }
}
}

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

  target.hp += finalHeal;

  ctx.log.push({
    type:"heal",
    from:source.id,
    to:target.id,
    amount:finalHeal,
    healType:type
  });

  ctx.log.push({
    type:"hpChange",
    target:target.id,
    hp:target.hp
  });
}
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

    const stackCount = target.effects.filter(
      e => e.stackKey === stackKey
    ).length;

    const finalValue =
      effectData.value *
      Math.pow(DIMINISH, stackCount);

    const newEffect = {
      category:"permanent",
      stat: effectData.stat,
      mode:"flat",
      value: finalValue,
      duration:null,
      stackKey: stackKey
    };

    target.effects.push(newEffect);

    ctx.log.push({
      type:"effectApplied",
      from:source.id,
      to:target.id,
      effect:newEffect
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

  // 既存が無い → そのまま追加
  if (!existing) {

    const newEffect = {
      category:"timed",
      stat: stat,
      mode:"rate",
      value: newValue,
      duration: newDuration
    };

    target.effects.push(newEffect);

    ctx.log.push({
      type:"effectApplied",
      from:source.id,
      to:target.id,
      effect:newEffect
    });

    return;
  }

  const absCurrent = Math.abs(existing.value);
  const absNew = Math.abs(newValue);

  // =========================
  // ① 強い → 上書き
  // =========================
  if (absNew > absCurrent) {

    existing.value = newValue;
    existing.duration = newDuration;

    ctx.log.push({
      type:"effectApplied",
      from:source.id,
      to:target.id,
      effect:existing
    });

    return;
  }

  // =========================
  // ② 同値 → 延長
  // =========================
  if (newValue === existing.value) {

    existing.duration += newDuration;

    ctx.log.push({
      type:"effectApplied",
      from:source.id,
      to:target.id,
      effect:existing
    });

    return;
  }

  // =========================
  // ③ 弱い → 総量換算
  // =========================

  const addedTotal = absNew * newDuration;
  const convertTurn =
    Math.floor(addedTotal / absCurrent);

  if (convertTurn > 0) {
    existing.duration += convertTurn;

    ctx.log.push({
      type:"effectApplied",
      from:source.id,
      to:target.id,
      effect:existing
    });
  }

}
// ==========================
// メイン
// ==========================

export function simulateBattle(snapshot) {

  const log = [];

  // snapshotをコピー
const units = snapshot.units.map(u => ({

  ...u,

  effects: [],

  skills: (u.skills || []).map(s => ({
    ...s,
    _currentCooldown: 0
  }))

}));

  // 行動順固定
  units.sort((a,b)=>b.speed-a.speed);

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
  applyEffect,
  getManhattanCells,
  getRandomEnemy,
  getRandomAlly,
  getRandomAny
};

  let turn = 1;
  const MAX_TURNS = 50;

  while (turn <= MAX_TURNS) {

    log.push({ type:"turnStart", turn });

for (let unit of units) {

  if (unit.hp <= 0) continue;

  // ====================
  // 行動開始
  // ====================
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
    type:"battleEnd",
    winner: unit.team
  });

  return log;
}
// ====================
// スキル判定
// ====================

let usedSkill = false;

for (let skill of (unit.skills || [])) {

  // クールタイム中ならスキップ
  if (skill._currentCooldown > 0) continue;

  const handler = skillHandlers[skill.type];
  if (!handler) continue;

const result = handler.generateActions(unit, context);

if (!result) continue;

const actions = result.actions || [];

if (actions.length === 0) continue;

const rangeCells = result.preview ? result.preview.cells : null;
const rangeStyle = result.preview ? result.preview.style : null;

  // 「効果がある」Action が1つでもあるか。足すときここに追加する
const hasEffect = actions.some(a =>
  a.type === "damage" ||
  a.type === "heal" ||
  a.type === "applyEffect"
);

  // 効果がないなら「使えなかった扱い」にして次のスキルへ（移動に回せる）
  if (!hasEffect) continue;

  // 自動スキルログ（範囲を同時に出すため skillUse に載せる）
  log.push({
    type: "skillUse",
    unit: unit.id,
    skill: skill.type,
    rangeCells: rangeCells,
    rangeStyle: rangeStyle
  });

  // action実行（rangePreview は実行しない）
  for (let action of actions) {

if (
  action.type !== "damage" &&
  action.type !== "heal" &&
  action.type !== "applyEffect"
) continue;

    const source = units.find(u => u.id === action.source);
    const target = units.find(u => u.id === action.target);
    if (!source || !target) continue;

if (action.type === "damage") {
  context.applyDamage(source, target, action, context);
}
else if (action.type === "heal") {
  context.applyHeal(source, target, action, context);
}
else if (action.type === "applyEffect") {
  context.applyEffect(source, target, action, context);
}
  }
// 使用したスキルにCTをセット
if (handler.cooldown && handler.cooldown > 0) {
  skill._currentCooldown = handler.cooldown;
}
  usedSkill = true;
  break;
}

if (usedSkill) {

  log.push({
    type: "actionEnd",
    unit: unit.id
  });

  continue;
}

      // ====================
      // fallback移動（role別）
      // ====================

      const role = unit.role || "attack";

      let moveMode = "toward";
let targetUnit = null;
let stopDistance = 1;
let stopDistance = 1;

      if (role === "attack") {
        targetUnit = getNearestEnemy(unit, units);
        moveMode = "toward";
      }

else if (role === "defense") {
  targetUnit = getNearestEnemy(unit, units);
  moveMode = "toward";
}

  else if (role === "speed") {
  targetUnit = getNearestEnemy(unit, units);
  moveMode = "toward";
  moveCount = 2;
}

else if (role === "heal") {

  const nearestEnemy = getNearestEnemy(unit, units);
  const ally = getLowestHpAlly(unit, units);

  if (!nearestEnemy || !ally) {
    targetUnit = ally;
    moveMode = "toward";
  }

  else {

    const enemyDist =
      Math.abs(unit.x - nearestEnemy.x) +
      Math.abs(unit.y - nearestEnemy.y);

    const dx = unit.x - ally.x;
    const dy = unit.y - ally.y;

    const allyChebyshev =
      Math.max(Math.abs(dx), Math.abs(dy));

    const safe = enemyDist >= 3;
    const nearAlly = allyChebyshev <= 1;

    // ======================
    // 安全かつヒール位置 → 動かない
    // ======================
    if (safe && nearAlly) {

      log.push({
        type:"wait",
        unit:unit.id
      });

      log.push({
        type:"actionEnd",
        unit:unit.id
      });

      continue;
    }

    // ======================
    // 敵が近い → 逃げる
    // ======================
    if (enemyDist <= 2) {

      const safeCells = [];

      for (let y=0;y<BOARD_H;y++){
        for (let x=0;x<BOARD_W;x++){

          if (!isOccupiedCell(units,x,y,unit.id)
            && isSafeFromEnemies(x,y,unit,units)) {

            safeCells.push({x,y});
          }
        }
      }

      if (safeCells.length > 0) {

        const target =
          safeCells[Math.floor(Math.random()*safeCells.length)];

        const step =
          chooseStep(unit,units,target);

        if (step) {

          const moveDx = step.x - unit.x;
          const moveDy = step.y - unit.y;

          unit.x = step.x;
          unit.y = step.y;

          log.push({
            type:"move",
            unit:unit.id,
            x:step.x,
            y:step.y
          });

          const newFacing =
            facingFromDelta(moveDx,moveDy,unit.facing);

          if (newFacing !== unit.facing) {
            unit.facing = newFacing;
            log.push({
              type:"faceChange",
              unit:unit.id,
              facing:newFacing
            });
          }

          log.push({
            type:"actionEnd",
            unit:unit.id
          });

          continue;
        }
      }
    }

    // ======================
    // 味方へ近付く
    // ======================
    targetUnit = ally;
    moveMode = "toward";
  }
}

      // 目標がいないなら何もしない
      if (!targetUnit) {
        log.push({
          type:"wait",
          unit:unit.id
        });

        log.push({
          type: "actionEnd",
          unit: unit.id
        });

        continue;
      }
  const targetPos = targetUnit;

// ====================
// 「近すぎるなら移動せず向きだけ変える」処理
// （towardのときのみ。awayでは使わない）
// ====================
const dxToTarget = targetPos.x - unit.x;
const dyToTarget = targetPos.y - unit.y;
const distToTarget = Math.abs(dxToTarget) + Math.abs(dyToTarget);

if (moveMode === "toward" && stopDistance >= 0 && distToTarget <= stopDistance) {

  const newFacing = facingFromDelta(dxToTarget, dyToTarget, unit.facing);

  if (newFacing !== unit.facing) {
    unit.facing = newFacing;
    log.push({ type:"faceChange", unit:unit.id, facing:newFacing });
  } else {
    log.push({ type:"wait", unit:unit.id });
  }

  log.push({ type:"actionEnd", unit: unit.id });
  continue;
}

for (let i = 0; i < moveCount; i++) {

  const step = chooseStep(
    unit,
    units,
    targetPos
  );

  if (!step) break;

if (!step) {

  // 動けない場合：向きだけ整える（今の仕様に近い）
  // まずは「今回の目標方向」を向く
  const face = facingFromDelta(dxToTarget, dyToTarget, unit.facing);

  if (face !== unit.facing) {
    unit.facing = face;
    log.push({ type:"faceChange", unit:unit.id, facing:face });
  } else {
    // それも同じなら idleFacing（roleに応じた自然な向き）
    const idle = getIdleFacing(unit, units);
    if (idle !== unit.facing) {
      unit.facing = idle;
      log.push({ type:"faceChange", unit:unit.id, facing:idle });
    } else {
      log.push({ type:"wait", unit:unit.id });
    }
  }

  log.push({ type:"actionEnd", unit: unit.id });
  continue;
}

// ====================
// 実際に移動
// ====================
const moveDx = step.x - unit.x;
const moveDy = step.y - unit.y;

unit.x = step.x;
unit.y = step.y;

log.push({ type:"move", unit:unit.id, x:step.x, y:step.y });

const newFacing =
  facingFromDelta(moveDx, moveDy, unit.facing);

if (newFacing !== unit.facing) {
  unit.facing = newFacing;
  log.push({ type:"faceChange", unit:unit.id, facing:newFacing });
}
}

// ====================
// 行動終了
// ====================
log.push({ type:"actionEnd", unit: unit.id });
    }
    
// ====================
// ターン制effect減少
// ====================
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
    
// ターン終了時に全スキルのCT減少
for (let u of units) {
  for (let s of (u.skills || [])) {
    if (s._currentCooldown > 0) {
      s._currentCooldown--;
    }
  }
}
    turn++;
  }

  log.push({ type:"battleEnd", winner:null });

  return log;
}
