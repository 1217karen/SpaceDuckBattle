//battle-engine.js

import { skillHandlers } from "./skills.js";


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

function getDefenseTargetCell(unit, units) {

  const ally = getLowestHpAlly(unit, units);
  if (!ally) return null;

  const enemy = getNearestEnemy(unit, units);
  if (!enemy) return null;

  const candidates = [
    { x: ally.x, y: ally.y - 1 },
    { x: ally.x, y: ally.y + 1 },
    { x: ally.x - 1, y: ally.y },
    { x: ally.x + 1, y: ally.y }
  ];

  // 盤内 & 空きマスだけ残す
  const valid = candidates.filter(c => {

    // 盤外チェック（6x10想定）
    if (c.x < 0 || c.x >= 10) return false;
    if (c.y < 0 || c.y >= 6) return false;

    // ユニットがいるマスは不可
    const occupied = units.some(u =>
      u.hp > 0 &&
      u.x === c.x &&
      u.y === c.y
    );

    return !occupied;
  });

  if (valid.length === 0) return null;

  // 敵に一番近いマス
  let best = valid[0];
  let bestDist = getDistance(best, enemy);

  for (let c of valid) {

    const d = getDistance(c, enemy);

    if (d < bestDist) {
      best = c;
      bestDist = d;
    }
  }

  return best;
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

      let moveMode = "toward"; // "toward" or "away"
      let targetUnit = null;

      if (role === "attack") {
        targetUnit = getNearestEnemy(unit, units);
        moveMode = "toward";
      }

else if (role === "defense") {

  const cell = getDefenseTargetCell(unit, units);

  if (!cell) {
    targetUnit = getLowestHpAlly(unit, units);
    moveMode = "toward";
  } else {

    targetUnit = {
      x: cell.x,
      y: cell.y
    };

    moveMode = "toward";
  }
}

      else if (role === "heal") {
        const nearestEnemy = getNearestEnemy(unit, units);
        if (!nearestEnemy) {
          // 敵がいないのは上でbattleEndしている想定だが、念のため
          targetUnit = getLowestHpAlly(unit, units);
          moveMode = "toward";
        } else {
          const dist = getDistance(unit, nearestEnemy);

          if (dist < 3) {
            // 近い敵から離れる
            targetUnit = nearestEnemy;
            moveMode = "away";
          } else {
            // すでに距離3以上なら、最もHPの低い味方へ
            targetUnit = getLowestHpAlly(unit, units);
            moveMode = "toward";
          }
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

      // toward: target - unit
      // away  : unit - target
      let dx = 0;
      let dy = 0;

      if (moveMode === "toward") {
        dx = targetUnit.x - unit.x;
        dy = targetUnit.y - unit.y;
      } else {
        dx = unit.x - targetUnit.x;
        dy = unit.y - targetUnit.y;
      }

      const distManhattan = Math.abs(dx) + Math.abs(dy);

      // 「toward」の場合だけ、隣接なら移動せず向き変更（今の仕様を維持）
      if (moveMode === "toward" && distManhattan <= 1) {

        let newFacing = unit.facing;

        const absDx = Math.abs(dx);
        const absDy = Math.abs(dy);

        if (absDx >= absDy && dx !== 0) {
          newFacing = dx > 0 ? "E" : "W";
        } else if (dy !== 0) {
          newFacing = dy > 0 ? "S" : "N";
        }

        if (newFacing !== unit.facing) {
          unit.facing = newFacing;

          log.push({
            type:"faceChange",
            unit:unit.id,
            facing:newFacing
          });
        } else {
          log.push({
            type:"wait",
            unit:unit.id
          });
        }

        log.push({
          type: "actionEnd",
          unit: unit.id
        });

        continue;
      }

      // 1マス移動（現行の軸優先）
      let newX = unit.x;
      let newY = unit.y;
      let newFacing = unit.facing;

      const absDx = Math.abs(dx);
      const absDy = Math.abs(dy);

      if (absDx >= absDy && dx !== 0) {
        newX += dx > 0 ? 1 : -1;
        newFacing = dx > 0 ? "E" : "W";
      } else if (dy !== 0) {
        newY += dy > 0 ? 1 : -1;
        newFacing = dy > 0 ? "S" : "N";
      } else {
        // dx/dyどちらも0（実質起きない想定だが念のため）
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

// 移動先にユニットがいるかチェック
const occupied = units.some(u =>
  u.hp > 0 &&
  u.id !== unit.id &&
  u.x === newX &&
  u.y === newY
);

if (!occupied) {

  unit.x = newX;
  unit.y = newY;
  unit.facing = newFacing;

  log.push({ type:"move", unit:unit.id, x:newX, y:newY });
  log.push({ type:"faceChange", unit:unit.id, facing:newFacing });

} else {

  // 詰まった場合は向きだけ変える
  if (newFacing !== unit.facing) {

    unit.facing = newFacing;

    log.push({
      type:"faceChange",
      unit:unit.id,
      facing:newFacing
    });

  } else {

    log.push({
      type:"wait",
      unit:unit.id
    });
  }
}
  
// ====================
// 行動終了
// ====================
log.push({
  type: "actionEnd",
  unit: unit.id
});
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
