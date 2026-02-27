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
      target:target.id
    });
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

  // 永続のみ扱う（flat前提）
  if (effectData.duration !== null) return;

  const stackKey = effectData.stat + "_flat";
  const DIMINISH = 0.75;

  const stackCount = (target.effects || []).filter(
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

  if (!target.effects) {
    target.effects = [];
  }

  target.effects.push(newEffect);

  ctx.log.push({
    type:"effectApplied",
    from:source.id,
    to:target.id,
    effect:newEffect
  });
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
  getEnemies,
  getAllies,
  getNearestEnemy,
  getUnitsInManhattanRange,
  getUnitsInSameRow,
  getUnitsInSameColumn,
  getEffectiveStat,
  applyDamage,
  applyHeal,
  applyEffect,
  getManhattanCells
};

  let turn = 1;
  const MAX_TURNS = 50;

  while (turn <= MAX_TURNS) {

    log.push({ type:"turnStart", turn });

    for (let unit of units) {

      if (unit.hp <= 0) continue;

      const enemies = getEnemies(units, unit.team);

      if (enemies.length === 0) {

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

if (usedSkill) continue;

      // ====================
      // fallback移動
      // ====================

      const target = getNearestEnemy(unit, units);

      if (!target) continue;

      const dx = target.x - unit.x;
      const dy = target.y - unit.y;

      if (Math.abs(dx) + Math.abs(dy) > 1) {

        let newX = unit.x;
        let newY = unit.y;
        let newFacing = unit.facing;

const absDx = Math.abs(dx);
const absDy = Math.abs(dy);

// 距離が大きい方向を優先
if (absDx >= absDy && dx !== 0) {

  newX += dx > 0 ? 1 : -1;
  newFacing = dx > 0 ? "E" : "W";

} else if (dy !== 0) {

  newY += dy > 0 ? 1 : -1;
  newFacing = dy > 0 ? "S" : "N";
}

        unit.x = newX;
        unit.y = newY;
        unit.facing = newFacing;

        log.push({ type:"move", unit:unit.id, x:newX, y:newY });
        log.push({ type:"faceChange", unit:unit.id, facing:newFacing });
      }
else {

  let newFacing = unit.facing;

  const absDx = Math.abs(dx);
  const absDy = Math.abs(dy);

  if (absDx >= absDy && dx !== 0) {
    newFacing = dx > 0 ? "E" : "W";
  } else if (dy !== 0) {
    newFacing = dy > 0 ? "S" : "N";
  }

  // 向きが変わる場合
  if (newFacing !== unit.facing) {
    unit.facing = newFacing;

    log.push({
      type:"faceChange",
      unit:unit.id,
      facing:newFacing
    });
  }
  // 本当に何もできない場合
  else {
    log.push({
      type:"wait",
      unit:unit.id
    });
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
