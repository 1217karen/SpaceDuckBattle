// ally-npcs.js

const DUCK_ICON = "https://www.rabbithutch.site/usagoya/picture.php?user=1217karen&file=duck2_icon_1.webp";

function makeIconSet(url) {
  return {
    default: url,
    N: "",
    E: "",
    S: "",
    W: ""
  };
}

function makeCommDialogues(name) {
  return {
    battleStart: [
      { text: `${name}、配置につきました。`, iconId: 1 }
    ],
    turnChangeNeutral: [
      { text: `${name}、状況を確認中です。`, iconId: 1 }
    ],
    turnChangeAdvantage: [
      { text: `${name}、優勢を確認しました。`, iconId: 1 }
    ],
    turnChangeDisadvantage: [
      { text: `${name}、劣勢です。`, iconId: 1 }
    ],
    turnChangePinch: [
      { text: `${name}、危険域です。`, iconId: 1 }
    ],
    critical: [],
    kill: [
      { text: `${name}、対象を無力化しました。`, iconId: 1 }
    ],
    battleEndWin: [
      { text: `${name}、戦闘終了を確認しました。`, iconId: 1 }
    ]
  };
}

function makeNpc({ id, name, description, type, stats, skills }) {
  return {
    id,
    side: "ally",
    name,
    description,
    unit: {
      type,
      behavior: "auto",
      icons: makeIconSet(DUCK_ICON),
      stats,
      patterns: [
        {
          id: "basic",
          name: "基本",
          public: true,
          skills
        }
      ]
    },
    character: {
      defaultIcon: DUCK_ICON,
      commIcons: [
        {
          id: 1,
          name,
          url: DUCK_ICON
        }
      ],
      commDialogues: makeCommDialogues(name)
    }
  };
}

export const ALLY_NPCS = {
  npc_healer: makeNpc({
    id: "npc_healer",
    name: "ヒールアヒル",
    description: "回復支援を行う味方NPCです。",
    type: "heal",
    stats: { atk: 2, def: 4, heal: 11, speed: 5, cri: 4, tec: 8 },
    skills: [
      { type: "HEAL_01", dialogue: { text: "修復波を展開します。", iconId: 1 } }
    ]
  }),

  npc_attacker: makeNpc({
    id: "npc_attacker",
    name: "アタックアヒル",
    description: "攻撃を担当する味方NPCです。",
    type: "attack",
    stats: { atk: 11, def: 4, heal: 1, speed: 6, cri: 6, tec: 4 },
    skills: [
      { type: "ATK_01", dialogue: { text: "正面目標を攻撃します。", iconId: 1 } }
    ]
  }),

  npc_supporter: makeNpc({
    id: "npc_supporter",
    name: "サポートアヒル",
    description: "妨害支援を行う味方NPCです。",
    type: "support",
    stats: { atk: 4, def: 4, heal: 3, speed: 9, cri: 3, tec: 10 },
    skills: [
      { type: "TEC_01", dialogue: { text: "妨害波を送信します。", iconId: 1 } }
    ]
  })
};
