// skills.js
export const skillHandlers = {

attack_front1: {
  name: "フロントアタック",
  cooldown: 2,
  icon: "https://www.rabbithutch.site/usagoya/picture.php?user=1217karen&file=skill_chip_1.webp",

  generateActions(unit, ctx) {
    const target = getFrontTarget(unit, ctx);
    if (!target) return null;
    if (target.team === unit.team) return null;

    const frontCell = getFrontCell(unit);

    return {
      preview: {
        cells: [frontCell],
        style: "attack"
      },
      actions: [
        {
          type: "damage",
          source: unit.id,
          target: target.id,
          power: 5,
          damageType: "normal"
        }
      ]
    };
  }
},

  skill_001: {
  name: "グラビティ",
  cooldown: 5,
  icon: "https://www.rabbithutch.site/usagoya/picture.php?user=1217karen&file=skill_chip_6.webp",

  generateActions(unit, ctx) {
    const targets = ctx
      .getUnitsInManhattanRange(unit, ctx.units, 1)
      .filter((u) => u.team !== unit.team);

    if (targets.length === 0) return null;

    const actions = [];

    for (const t of targets) {
      actions.push({
        type: "applyEffect",
        source: unit.id,
        target: t.id,
        effect: {
          type: "gravity",
          stock: 2
        }
      });
    }

    return {
      preview: {
        cells: ctx.getManhattanCells(unit, 1),
        style: "debuff"
      },
      actions
    };
  }
},
  
  skill_002: {
  name: "サテライト",
  cooldown: 4,
  icon: "https://www.rabbithutch.site/usagoya/picture.php?user=1217karen&file=skill_chip_5.webp",

  generateActions(unit, ctx) {
    const targets = ctx.units.filter(
      (u) =>
        u.hp > 0 &&
        u.team === unit.team &&
        u.id !== unit.id &&
        ctx.getChebyshevDistance(unit, u) <= 2
    );

    if (targets.length === 0) return null;

    const actions = [];

    for (const t of targets) {
      actions.push({
        type: "applyEffect",
        source: unit.id,
        target: t.id,
        effect: {
          type: "satellite",
          stock: 3
        }
      });
    }

    return {
      preview: {
        cells: targets.map((t) => ({ x: t.x, y: t.y })),
        style: "buff"
      },
      actions
    };
  }
},
  
skill_003: {
  name: "アクセルライン",
  cooldown: 5,
  icon: "https://www.rabbithutch.site/usagoya/picture.php?user=1217karen&file=skill_chip_5.webp",

  generateActions(unit, ctx) {
    const targets = ctx
      .getUnitsInSameColumn(unit, ctx.units)
      .filter((u) => u.team === unit.team && u.id !== unit.id);

    if (targets.length === 0) return null;

    const actions = [];

    for (const t of targets) {
      actions.push({
        type: "applyEffect",
        source: unit.id,
        target: t.id,
        effect: {
          type: "accel",
          stock: 1
        }
      });
    }

    return {
      preview: {
        cells: targets.map((t) => ({ x: t.x, y: t.y })),
        style: "buff"
      },
      actions
    };
  }
},
  
  heal_cross2: {
  name: "リペアライト",
  cooldown: 4,
  icon: "https://www.rabbithutch.site/usagoya/picture.php?user=1217karen&file=skill_chip_4.webp",

  generateActions(unit, ctx) {
    const alliesInRange = ctx.units.filter(
      (u) =>
        u.hp > 0 &&
        u.team === unit.team &&
        ctx.getChebyshevDistance(unit, u) <= 2
    );

    const otherAllies = alliesInRange.filter(
      (u) => u.id !== unit.id
    );

    if (otherAllies.length === 0) return null;

    const actions = [];

    for (const t of alliesInRange) {
      actions.push({
        type: "heal",
        source: unit.id,
        target: t.id,
        power: 5,
        healType: "scale"
      });
    }

    return {
      preview: {
        cells: alliesInRange.map((t) => ({ x: t.x, y: t.y })),
        style: "heal"
      },
      actions
    };
  }
},


  skill_004: {
  name: "ヒールビーム",
  cooldown: 6,
  icon: "https://www.rabbithutch.site/usagoya/picture.php?user=1217karen&file=skill_chip_4.webp",

  generateActions(unit, ctx) {
    const allies = ctx.units.filter(
      (u) => u.hp > 0 && u.team === unit.team
    );

    if (allies.length === 0) return null;

    let minHp = allies[0].hp;

    for (const a of allies) {
      if (a.hp < minHp) {
        minHp = a.hp;
      }
    }

    const candidates = allies.filter(
      (u) =>
        u.hp === minHp &&
        ctx.getDistance(unit, u) <= 1
    );

    if (candidates.length === 0) return null;

    let target = candidates[0];
    let bestDist = ctx.getDistance(unit, target);

    for (const c of candidates) {
      const d = ctx.getDistance(unit, c);
      if (d < bestDist) {
        bestDist = d;
        target = c;
      }
    }

    return {
      preview: {
        cells: [{ x: target.x, y: target.y }],
        style: "heal"
      },
      actions: [
        {
          type: "heal",
          source: unit.id,
          target: target.id,
          power: 8,
          healType: "scale"
        }
      ]
    };
  }
},

  skill_005: {
  name: "オービットヒール",
  cooldown: 4,
  icon: "https://www.rabbithutch.site/usagoya/picture.php?user=1217karen&file=skill_chip_5.webp",

  generateActions(unit, ctx) {
    const targets = ctx.units.filter(
      (u) =>
        u.hp > 0 &&
        u.team === unit.team &&
        ctx.getChebyshevDistance(unit, u) <= 1
    );

    const otherAllies = targets.filter(
      (u) => u.id !== unit.id
    );

    if (otherAllies.length === 0) return null;

    const actions = [];

    for (const t of targets) {
      actions.push({
        type: "heal",
        source: unit.id,
        target: t.id,
        power: 2,
        healType: "scale"
      });

      actions.push({
        type: "applyEffect",
        source: unit.id,
        target: t.id,
        effect: {
          type: "satellite",
          stock: 3
        }
      });
    }

    return {
      preview: {
        cells: targets.map((t) => ({ x: t.x, y: t.y })),
        style: "buff"
      },
      actions
    };
  }
},

  buff_def50_self: {
  name: "ディフェンスフィールド",
  cooldown: 6,
  icon: "https://www.rabbithutch.site/usagoya/picture.php?user=1217karen&file=skill_chip_7.webp",

  generateActions(unit, ctx) {
    const nearbyEnemies = ctx.units.filter(
      (u) =>
        u.hp > 0 &&
        u.team !== unit.team &&
        ctx.getChebyshevDistance(unit, u) <= 1
    );

    if (nearbyEnemies.length < 2) return null;

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
            value: 0.5,
            duration: 3
          }
        }
      ]
    };
  }
},

  skill_006: {
  name: "ノヴァ",
  cooldown: 4,
  icon: "https://www.rabbithutch.site/usagoya/picture.php?user=1217karen&file=skill_chip_2.webp",

  generateActions(unit, ctx) {
    const targets = ctx.units.filter(
      (u) =>
        u.hp > 0 &&
        u.team !== unit.team &&
        ctx.getChebyshevDistance(unit, u) <= 3
    );

    if (targets.length === 0) return null;

    const actions = [];

    for (const t of targets) {
      actions.push({
        type: "damage",
        source: unit.id,
        target: t.id,
        power: 3,
        damageType: "normal"
      });
    }

    return {
      preview: {
        cells: targets.map((t) => ({ x: t.x, y: t.y })),
        style: "attack"
      },
      actions
    };
  }
},

  skill_007: {
  name: "フロートリンク",
  cooldown: 4,
  icon: "https://placehold.co/20x20",

  generateActions(unit, ctx) {
    const nearbyAllies = ctx
      .getUnitsInManhattanRange(unit, ctx.units, 1)
      .filter((u) => u.team === unit.team && u.id !== unit.id);

    const actions = [
      {
        type: "applyEffect",
        source: unit.id,
        target: unit.id,
        effect: {
          type: "float",
          stock: 1
        }
      }
    ];

    const cells = [{ x: unit.x, y: unit.y }];

    if (nearbyAllies.length > 0) {
      const ally = nearbyAllies[0];

      actions.push({
        type: "applyEffect",
        source: unit.id,
        target: ally.id,
        effect: {
          type: "float",
          stock: 1
        }
      });

      cells.push({ x: ally.x, y: ally.y });
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

  debuff_wave: {
  name: "ノイズウェーブ",
  cooldown: 5,
  icon: "https://placehold.co/20x20",

  generateActions(unit, ctx) {
    const enemies = ctx
      .getUnitsInManhattanRange(unit, ctx.units, 2)
      .filter((u) => u.team !== unit.team);

    if (enemies.length < 2) return null;

    const actions = [];

    for (const t of enemies) {
      actions.push({
        type: "applyEffect",
        source: unit.id,
        target: t.id,
        effect: {
          type: "interference",
          stock: 5
        }
      });
    }

    return {
      preview: {
        cells: ctx.getManhattanCells(unit, 2),
        style: "debuff"
      },
      actions
    };
  }
},

  attack_front_knockback: {
  name: "ノックバックアタック",
    cooldown: 3,
    icon: "https://placehold.co/20x20",

    generateActions(unit, ctx) {
      const target = getFrontTarget(unit, ctx);
      if (!target) return null;
      if (target.team === unit.team) return null;

      const cell = ctx.getKnockbackCell(unit, target, ctx.units);
      const actions = [];

      actions.push({
        type: "damage",
        source: unit.id,
        target: target.id,
        power: 2,
        damageType: "normal"
      });

      if (cell) {
        actions.push({
          type: "move",
          source: unit.id,
          target: target.id,
          x: cell.x,
          y: cell.y,
          forced: true
        });
      }

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
        actions
      };
    }
  },
  
  skill_008: {
  name: "ガードフィールド",
  cooldown: 4,
  icon: "https://placehold.co/20x20",

  generateActions(unit, ctx) {
    const inRangeUnits = ctx.getUnitsInManhattanRange(unit, ctx.units, 1);

    const allies = inRangeUnits.filter(
      (u) => u.team === unit.team
    );

    const otherAllies = allies.filter(
      (u) => u.id !== unit.id
    );

    const enemies = inRangeUnits.filter(
      (u) => u.team !== unit.team
    );

    if (otherAllies.length === 0) return null;
    if (enemies.length === 0) return null;

    const actions = [];

    for (const t of allies) {
      actions.push({
        type: "applyEffect",
        source: unit.id,
        target: t.id,
        effect: {
          stat: "def",
          mode: "rate",
          value: 0.3,
          duration: 2
        }
      });
    }

    return {
      preview: {
        cells: allies.map((t) => ({ x: t.x, y: t.y })),
        style: "buff"
      },
      actions
    };
  }
},
  
  skill_009: {
  name: "アタックフィールド",
  cooldown: 4,
  icon: "https://placehold.co/20x20",

  generateActions(unit, ctx) {
    const inRangeUnits = ctx.getUnitsInManhattanRange(unit, ctx.units, 1);

    const allies = inRangeUnits.filter(
      (u) => u.team === unit.team
    );

    const otherAllies = allies.filter(
      (u) => u.id !== unit.id
    );

    const enemies = inRangeUnits.filter(
      (u) => u.team !== unit.team
    );

    if (otherAllies.length === 0) return null;
    if (enemies.length === 0) return null;

    const actions = [];

    for (const t of allies) {
      actions.push({
        type: "applyEffect",
        source: unit.id,
        target: t.id,
        effect: {
          stat: "atk",
          mode: "rate",
          value: 0.3,
          duration: 2
        }
      });
    }

    return {
      preview: {
        cells: allies.map((t) => ({ x: t.x, y: t.y })),
        style: "buff"
      },
      actions
    };
  }
},
  // =========================
  // 前方1マス攻撃　５回
  // =========================
 attack_front1_5: {
  name: "ガトリング",
    cooldown: 2,
    icon: "https://www.rabbithutch.site/usagoya/picture.php?user=1217karen&file=skill_chip_2.webp",

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

      const actions = [];

      for (let i = 0; i < 5; i++) {
        actions.push({
          type: "damage",
          source: unit.id,
          target: target.id,
          power: 2,
          damageType: "normal"
        });
      }

      return {
        preview: {
          cells: [{ x, y }],
          style: "attack"
        },
        actions
      };
    }
  },
  
corrosion_wave: {
  name: "コロージョン",
    cooldown: 3,
    icon: "https://www.rabbithutch.site/usagoya/picture.php?user=1217karen&file=skill_chip_6.webp",

    generateActions(unit, ctx) {
      const enemies = ctx.units.filter(
        (u) =>
          u.hp > 0 &&
          u.team !== unit.team &&
          ctx.getChebyshevDistance(unit, u) <= 2
      );

      if (enemies.length === 0) return null;

      const cells = enemies.map((u) => ({ x: u.x, y: u.y }));

      return {
        preview: {
          cells,
          style: "debuff"
        },
        actions: enemies.map((target) => ({
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
}



function getFrontCell(unit) {
  let x = unit.x;
  let y = unit.y;

  if (unit.facing === "N") y -= 1;
  if (unit.facing === "S") y += 1;
  if (unit.facing === "E") x += 1;
  if (unit.facing === "W") x -= 1;

  return { x, y };
}
// =======================
// 前方ターゲット取得
// =======================
function getFrontTarget(unit, ctx) {
  const candidates = ctx.units.filter(
    (u) => u.hp > 0 && u.id !== unit.id
  );

  for (let target of candidates) {
    if (
      unit.facing === "N" &&
      target.x === unit.x &&
      target.y === unit.y - 1
    )
      return target;

    if (
      unit.facing === "S" &&
      target.x === unit.x &&
      target.y === unit.y + 1
    )
      return target;

    if (
      unit.facing === "E" &&
      target.x === unit.x + 1 &&
      target.y === unit.y
    )
      return target;

    if (
      unit.facing === "W" &&
      target.x === unit.x - 1 &&
      target.y === unit.y
    )
      return target;
  }

  return null;
}

export function getSkillDisplayName(skillType) {
  const handler = skillHandlers[skillType];
  if (!handler) return skillType || "";
  return handler.name || skillType || "";
}
