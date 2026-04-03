// skills.js


export const skillHandlers = {

  // =========================
  // ATK初期スキル
  // 前方1マスの敵1体に弱い通常攻撃
  // =========================
  ATK_01: {
    name: "ショートアタック",
    description: "前方1マスの敵1体に通常攻撃（威力4）",
    unlock: {
    atk: 5
    },
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
            power: 4,
            damageType: "normal"
          }
        ]
      };
    }
  },

  // =========================
  // DEF初期スキル
  // 自分の防御を少し上げる
  // =========================
  DEF_01: {
    name: "ガードアップ",
    description: "自分のDEFを20%上げる（2行動）",
    unlock: {
    def: 5
    },
    cooldown: 3,
    icon: "https://www.rabbithutch.site/usagoya/picture.php?user=1217karen&file=skill_chip_7.webp",

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
  // HEAL初期スキル
  // 周囲1マスの味方1体を少し回復
  // 自分以外がいなければ使えない
  // =========================
  HEAL_01: {
    name: "ミニヒール",
    description: "周囲1マスの味方1体を回復（威力4）",
    unlock: {
    heal: 5
    },
    cooldown: 3,
    icon: "https://www.rabbithutch.site/usagoya/picture.php?user=1217karen&file=skill_chip_4.webp",

    generateActions(unit, ctx) {
      const candidates = ctx.units.filter(
        (u) =>
          u.hp > 0 &&
          u.team === unit.team &&
          u.id !== unit.id &&
          ctx.getChebyshevDistance(unit, u) <= 1
      );

      if (candidates.length === 0) return null;

      let target = candidates[0];
      let lowestHp = target.hp;

      for (const c of candidates) {
        if (c.hp < lowestHp) {
          lowestHp = c.hp;
          target = c;
        }
      }

      return {
        preview: {
          cells: ctx.getChebyshevCells(unit, 1)
            .filter(cell => !(cell.x === unit.x && cell.y === unit.y)),
          style: "heal"
        },
        actions: [
          {
            type: "heal",
            source: unit.id,
            target: target.id,
            power: 4,
            healType: "scale"
          }
        ]
      };
    }
  },

  // =========================
  // SPD初期スキル
  // 自分に加速を1段階付与する
  // 次の行動を少し早めやすくする想定
  // =========================
  SPD_01: {
    name: "クイック",
    description: "自分に加速を1段階付与する",
    unlock: {
    speed: 5
    },
    cooldown: 3,
    icon: "https://www.rabbithutch.site/usagoya/picture.php?user=1217karen&file=skill_chip_5.webp",

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
              type: "accel",
              stock: 1
            }
          }
        ]
      };
    }
  },

  // =========================
  // CRI初期スキル
  // 自分のCRIを少し上げる
  // 単発の火力期待値を少し上げる想定
  // =========================
  CRI_01: {
    name: "フォーカス",
    description: "自分のCRIを20%上げる（2行動）",
    unlock: {
    cri: 5
    },
    cooldown: 3,
    icon: "https://www.rabbithutch.site/usagoya/picture.php?user=1217karen&file=skill_chip_2.webp",

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
              stat: "cri",
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
  // TEC初期スキル
  // 周囲1マスの敵1体に妨害を少し付与する
  // 軽い妨害の基本形
  // =========================
  TEC_01: {
    name: "ジャミング",
    description: "周囲1マスの敵1体に妨害を2付与する",
    unlock: {
    tec: 5
    },
    cooldown: 3,
    icon: "https://www.rabbithutch.site/usagoya/picture.php?user=1217karen&file=skill_chip_6.webp",

    generateActions(unit, ctx) {
      const candidates = ctx
        .getUnitsInManhattanRange(unit, ctx.units, 1)
        .filter((u) => u.team !== unit.team);

      if (candidates.length === 0) return null;

      const target = candidates[0];

      return {
        preview: {
          cells: ctx.getManhattanCells(unit, 1),
          style: "debuff"
        },
        actions: [
          {
            type: "applyEffect",
            source: unit.id,
            target: target.id,
            effect: {
              type: "interference",
              stock: 2
            }
          }
        ]
      };
    }
  }

};

function getFrontCell(unit) {
  let x = unit.x;
  let y = unit.y;

  if (unit.facing === "N") y -= 1;
  if (unit.facing === "S") y += 1;
  if (unit.facing === "E") x += 1;
  if (unit.facing === "W") x -= 1;

  return { x, y };
}

function getFrontTarget(unit, ctx) {
  const candidates = ctx.units.filter(
    (u) => u.hp > 0 && u.id !== unit.id
  );

  for (const target of candidates) {
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

export function getSkillDisplayName(skillType) {
  const handler = skillHandlers[skillType];
  if (!handler) return skillType || "";
  return handler.name || skillType || "";
}
