// skills.js
export const skillHandlers = {

  // =========================
  // 前方1マス攻撃
  // =========================
  attack_front1: {
    cooldown: 1,
    
    generateActions(unit, ctx) {

      const target = getFrontTarget(unit, ctx);
      if (!target) return null;
      if (target.team === unit.team) return null;

      let x = unit.x;
      let y = unit.y;

      if (unit.facing === "N") y -= 1;
      if (unit.facing === "S") y += 1;
      if (unit.facing === "E") x += 1;
      if (unit.facing === "W") x -= 1;

      return {
        preview: {
          cells: [{ x, y }],
          style: "attack"
        },
        actions: [
          {
            type: "damage",
            source: unit.id,
            target: target.id,
            power: 2,
            damageType: "normal"
          }
        ]
      };
    }
  },

   // =========================
  // DF3
  // =========================
buff_def20: {
  cooldown: 3,

  generateActions(unit, ctx) {

    return {
      preview: {
  cells: [{ x: unit.x, y: unit.y }],
  style: "buff"
},

      actions: [
        {
          type: "applyEffect",
          source: unit.id,
          target: unit.id,

          effect: {
            stat: "def",
            mode: "rate",
            value: 0.2,
            duration: 2
          }
        }
      ]
    };

  }
},

    // =========================
  // DF
  // =========================
  
  buff_def10: {
  cooldown: 2,

  generateActions(unit, ctx) {

    return {
      preview: {
  cells: [{ x: unit.x, y: unit.y }],
  style: "buff"
},

      actions: [
        {
          type: "applyEffect",
          source: unit.id,
          target: unit.id,

          effect: {
            stat: "def",
            mode: "rate",
            value: 0.1,
            duration: 4
          }
        }
      ]
    };

  }
},

// =========================
// 衛星流星展開
// =========================
satellite_meteor_field: {

  cooldown: 3,

  generateActions(unit, ctx) {

    const allies =
      ctx.getAllies(ctx.units, unit.team, unit.id);

    const targets =
      allies.filter(a =>
        ctx.getChebyshevDistance(unit, a) <= 1
      );

    if (targets.length === 0) return null;

    const cells =
      targets.map(t => ({ x: t.x, y: t.y }));

    const actions = [];

    for (const t of targets) {

actions.push({
  type: "applyEffect",
  source: unit.id,
  target: t.id,
  effect: {
    type: "satellite",
    power: 3
  }
});

actions.push({
  type: "applyEffect",
  source: unit.id,
  target: t.id,
  effect: {
    type: "meteor",
    power: 3
  }
});

    }

    return {
      preview: {
        cells,
        style: "buff"
      },
      actions
    };

  }

},

  
// =========================
// 周囲デバフ波
// =========================
debuff_wave: {
  cooldown: 3,

  generateActions(unit, ctx) {

const enemies =
  ctx.getUnitsInManhattanRange(
    unit,
    ctx.units,
    1
  ).filter(u =>
    u.team !== unit.team
  );

    if (enemies.length === 0) return null;

    const actions = [];

    for (const t of enemies) {

      actions.push({
        type: "applyEffect",
        source: unit.id,
        target: t.id,
        effect: {
          type: "slow",
          stock: 1
        }
      });

      actions.push({
        type: "applyEffect",
        source: unit.id,
        target: t.id,
        effect: {
          type: "gravity",
          stock: 1
        }
      });

      actions.push({
        type: "applyEffect",
        source: unit.id,
        target: t.id,
        effect: {
          type: "interference",
          stock: 1
        }
      });

    }

    const cells =
      ctx.getManhattanCells(unit, 1);

    return {
      preview: {
        cells,
        style: "debuff"
      },
      actions
    };
  }
},

  // =========================
// 周囲バフ波
// =========================
buff_wave: {
  cooldown: 3,

  generateActions(unit, ctx) {

const allies =
  ctx.getUnitsInManhattanRange(
    unit,
    ctx.units,
    1
  ).filter(u =>
    u.team === unit.team
  );

    if (allies.length === 0) return null;

    const actions = [];

    for (const t of allies) {

      actions.push({
        type: "applyEffect",
        source: unit.id,
        target: t.id,
        effect: {
          type: "accel",
          stock: 1
        }
      });

      actions.push({
        type: "applyEffect",
        source: unit.id,
        target: t.id,
        effect: {
          type: "float",
          stock: 1
        }
      });

      actions.push({
        type: "applyEffect",
        source: unit.id,
        target: t.id,
        effect: {
          type: "resonance",
          stock: 1
        }
      });

    }

    const cells =
      ctx.getManhattanCells(unit, 1);

    return {
      preview: {
        cells,
        style: "buff"
      },
      actions
    };
  }
},
  // =========================
  // 最寄り敵攻撃
  // =========================
  attack_nearest: {
    cooldown: 3,

    generateActions(unit, ctx) {

      const target =
        ctx.getNearestEnemy(unit, ctx.units);

      if (!target) return null;

      const dist =
        ctx.getDistance(unit, target);

      if (dist !== 1) return null;

      return {
        preview: {
          cells: [{ x: target.x, y: target.y }],
          style: "attack"
        },
        actions: [
          {
            type: "damage",
            source: unit.id,
            target: target.id,
            power: 1,
            damageType: "normal"
          }
        ]
      };
    }
  },

  // =========================
  // 縦横2マス回復
  // =========================
  heal_cross2: {
    cooldown: 3,

    generateActions(unit, ctx) {

      // 実際に回復対象となるユニット
      const targets =
        ctx.getUnitsInManhattanRange(
          unit,
          ctx.units,
          2
        ).filter(u =>
          u.id !== unit.id &&
          u.team === unit.team
        );

      // 効果対象がいないなら不発
      if (targets.length === 0) return null;

      // 範囲表示（座標）
      const cells =
        ctx.getManhattanCells(unit, 2);

      const actions = [];

      for (let t of targets) {
        actions.push({
          type: "heal",
          source: unit.id,
          target: t.id,
          power: 2,
          healType: "scale"
        });
      }

      return {
        preview: {
          cells: cells,
          style: "heal"
        },
        actions: actions
      };
    }
  },
  
  // =========================
  // 周囲2マス 敵全体攻撃（減衰なし）
  // =========================

  attack_around2_all: {
    cooldown: 3,
    
    generateActions(unit, ctx) {

      const targets =
        ctx.getUnitsInManhattanRange(
          unit,
          ctx.units,
          2
        ).filter(u =>
          u.team !== unit.team
        );

      if (!targets || targets.length === 0)
        return null;

      const actions = [];

      for (let t of targets) {
        actions.push({
          type:"damage",
          source:unit.id,
          target:t.id,
          power:1,
          damageType:"normal"
          // falloffなし
        });
      }

      return {
        preview:{
          cells: ctx.getManhattanCells(unit, 2),
          style:"attack"
        },
        actions: actions
      };
    }
  },
  
  // =========================
  // 自分にバフ
  // =========================
buff_self_if_alone: {
  cooldown: 3,

  generateActions(unit, ctx) {

    return {
      preview: {
        cells: [{ x: unit.x, y: unit.y }],
        style: "buff"
      },
      actions: [
        {
          type: "applyEffect",
          source: unit.id,
          target: unit.id,
          effect: {
            stat: "atk",
            value: 5,
            duration: null
          }
        }
      ]
    };
  }
},
  // =========================
  // ランダム敵単体攻撃（減衰あり）
  // =========================

  attack_random_falloff: {
    cooldown: 3,
    
generateActions(unit, ctx) {

  const enemies =
    ctx.getEnemies(ctx.units, unit.team);

  if (!enemies || enemies.length === 0)
    return null;

  const target =
    ctx.getRandomEnemy(unit, ctx.units);

  if (!target) return null;

  return {
    preview:{
      cells: enemies.map(e => ({
        x: e.x,
        y: e.y
      })),
      style:"attack"
    },
    actions:[
      {
        type:"damage",
        source:unit.id,
        target:target.id,
        power:2,
        damageType:"normal",
        falloff:true
      }
    ]
  };
}
  },
  // =========================
// 前方攻撃＋ノックバック
// =========================
attack_front_knockback: {
  cooldown: 3,

  generateActions(unit, ctx) {

    const target = getFrontTarget(unit, ctx);
    if (!target) return null;
    if (target.team === unit.team) return null;

    const cell =
      ctx.getKnockbackCell(unit, target, ctx.units);

    const actions = [];

    actions.push({
      type:"damage",
      source:unit.id,
      target:target.id,
      power:2,
      damageType:"normal"
    });

    if (cell) {
actions.push({
  type:"move",
  source:unit.id,
  target:target.id,
  x:cell.x,
  y:cell.y,
  forced:true
});
    }

    let x = unit.x;
    let y = unit.y;

    if (unit.facing === "N") y -= 1;
    if (unit.facing === "S") y += 1;
    if (unit.facing === "E") x += 1;
    if (unit.facing === "W") x -= 1;

    return {
      preview:{
        cells:[{x,y}],
        style:"attack"
      },
      actions:actions
    };
  }
},
  // =========================
// 最遠敵引き寄せ
// =========================
pull_farthest_enemy: {
  cooldown: 3,

  generateActions(unit, ctx) {

    const enemies =
      ctx.getEnemies(ctx.units, unit.team);

    if (!enemies || enemies.length === 0)
      return null;

    let farthest = enemies[0];
    let maxDist =
      ctx.getDistance(unit, farthest);

    for (const e of enemies) {

      const d =
        ctx.getDistance(unit, e);

      if (d > maxDist) {
        maxDist = d;
        farthest = e;
      }
    }

    const cell =
      ctx.getPullCell(unit, farthest, ctx.units);

    if (!cell) return null;

    return {
      preview:{
        cells:[{x:farthest.x, y:farthest.y}],
        style:"attack"
      },
      actions:[
{
  type:"move",
  source:unit.id,
  target:farthest.id,
  x:cell.x,
  y:cell.y,
  forced:true
}
      ]
    };
  }
},
  // =========================
// 腐食波
// =========================
corrosion_wave: {
  cooldown: 3,

  generateActions(unit, ctx) {

    const enemies = ctx.units.filter(u =>
      u.hp > 0 &&
      u.team !== unit.team &&
      ctx.getChebyshevDistance(unit, u) <= 2
    );

    if (enemies.length === 0) return null;

    const cells = enemies.map(u => ({ x: u.x, y: u.y }));

    return {
      preview: {
        cells,
        style: "debuff"
      },
      actions: enemies.map(target => ({
        type: "applyEffect",
        source: unit.id,
        target: target.id,
        effect: {
          type: "corrosion",
          stock: 5,
          group: "debuff"
        }
      }))
    };
  }
},
  // =========================
// 修復の波
// =========================
repair_wave: {
  cooldown: 3,

  generateActions(unit, ctx) {

    // チェビシェフ1以内に敵がいるか
    const closeEnemy = ctx.units.some(u =>
      u.hp > 0 &&
      u.team !== unit.team &&
      ctx.getChebyshevDistance(unit, u) <= 1
    );

    if (closeEnemy) return null;

    // マンハッタン2以内の味方（自分含む）
    const allies = ctx.units.filter(u =>
      u.hp > 0 &&
      u.team === unit.team &&
      ctx.getDistance(unit, u) <= 2
    );

    if (allies.length === 0) return null;

    const cells = allies.map(u => ({ x: u.x, y: u.y }));

    return {
      preview: {
        cells,
        style: "buff"
      },
      actions: allies.map(target => ({
        type: "applyEffect",
        source: unit.id,
        target: target.id,
        effect: {
          type: "repair",
          stock: 5,
          group: "buff"
        }
      }))
    };
  }
},
  // =========================
  // 自分DF50%バフ（3T）
  // =========================
  buff_def50_self: {
    cooldown: 3,

    generateActions(unit, ctx) {

      return {
        preview: {
          cells: [{ x: unit.x, y: unit.y }],
          style: "buff"
        },
        actions: [
          {
            type: "applyEffect",
            source: unit.id,
            target: unit.id,
            effect: {
              stat: "def",
              value: 0.5, // 50%
              duration: 3
            }
          }
        ]
      };
    }
  }
};


// =======================
// 前方ターゲット取得
// =======================
function getFrontTarget(unit, ctx) {

  const candidates =
    ctx.units.filter(u =>
      u.hp > 0 &&
      u.id !== unit.id
    );

  for (let target of candidates) {

    if (
      unit.facing === "N" &&
      target.x === unit.x &&
      target.y === unit.y - 1
    ) return target;

    if (
      unit.facing === "S" &&
      target.x === unit.x &&
      target.y === unit.y + 1
    ) return target;

    if (
      unit.facing === "E" &&
      target.x === unit.x + 1 &&
      target.y === unit.y
    ) return target;

    if (
      unit.facing === "W" &&
      target.x === unit.x - 1 &&
      target.y === unit.y
    ) return target;
  }

  return null;
}
