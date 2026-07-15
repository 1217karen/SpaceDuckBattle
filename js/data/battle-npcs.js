// battle-npcs.js

const DUCK_ICON = "https://www.rabbithutch.site/usagoya/picture.php?user=1217karen&file=duck2_icon_1.webp";
const ENEMY_ICON = "https://www.rabbithutch.site/usagoya/picture.php?user=1217karen&file=duck3_icon.webp";
const NPC_ICON = "https://www.rabbithutch.site/usagoya/picture.php?user=1217karen&file=npc2_icon_0.webp";

function makeIconSet(url) {
  return {
    default: url,
    N: "",
    E: "",
    S: "",
    W: ""
  };
}

function makeCharacterData(name, iconUrl, dialogues = {}) {
  return {
    fullName: name,
    defaultName: name,
    defaultIcon: iconUrl,
    commIcons: [
      {
        id: 1,
        name,
        url: iconUrl
      }
    ],
    commDialogues: {
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
      ],
      ...dialogues
    }
  };
}

function makeNpc({
  name,
  type,
  iconUrl = ENEMY_ICON,
  stats,
  skills = [],
  behavior = "auto",
  characterDialogues = {}
}) {
  return {
    unitData: {
      name,
      type,
      behavior,
      icon: makeIconSet(iconUrl),
      stats,
      patterns: [
        {
          name: "基本",
          public: true,
          skills
        }
      ]
    },
    characterData: makeCharacterData(name, iconUrl, characterDialogues)
  };
}

export const NPCS = {
  trainingDecoy: makeNpc({
    name: "訓練用デコイ",
    type: "decoy",
    behavior: "wait",
    iconUrl: ENEMY_ICON,
    stats: {
      atk: 0,
      def: 0,
      heal: 0,
      speed: 0,
      cri: 0,
      tec: 0
    },
    skills: [],
    characterDialogues: {
      battleStart: [
        { text: "訓練用デコイが立っている……。", iconId: 1 }
      ],

      turnChangeNeutral: []
    }
  }),

  attackTrainer: makeNpc({
    name: "アタック訓練兵",
    type: "attack",
    stats: {
      atk: 8,
      def: 2,
      heal: 0,
      speed: 5,
      cri: 4,
      tec: 2
    },
    skills: [
      { type: "ATK_01", dialogue: { text: "正面目標へ攻撃訓練を行います。", iconId: 1 } }
    ]
  }),

  defenseTrainer: makeNpc({
    name: "ディフェンス訓練兵",
    type: "defense",
    stats: {
      atk: 4,
      def: 9,
      heal: 0,
      speed: 3,
      cri: 2,
      tec: 4
    },
    skills: [
      { type: "DEF_01", dialogue: { text: "防御姿勢を確認します。", iconId: 1 } },
      { type: "ATK_01", dialogue: { text: "防御訓練から反撃します。", iconId: 1 } }
    ]
  }),

  healTrainer: makeNpc({
    name: "ヒール訓練兵",
    type: "heal",
    stats: {
      atk: 3,
      def: 3,
      heal: 9,
      speed: 4,
      cri: 2,
      tec: 5
    },
    skills: [
      { type: "HEAL_01", dialogue: { text: "回復訓練を実施します。", iconId: 1 } },
      { type: "ATK_01", dialogue: { text: "最低限の反撃を行います。", iconId: 1 } }
    ]
  }),

  speedTrainer: makeNpc({
    name: "スピード訓練兵",
    type: "attack",
    stats: {
      atk: 5,
      def: 2,
      heal: 0,
      speed: 10,
      cri: 3,
      tec: 4
    },
    skills: [
      { type: "SPD_01", dialogue: { text: "加速訓練を開始します。", iconId: 1 } },
      { type: "ATK_01", dialogue: { text: "速度を活かして接近攻撃します。", iconId: 1 } }
    ]
  }),
  
  technicalTrainer: makeNpc({
    name: "テクニカル訓練兵",
    type: "support",
    stats: {
      atk: 3,
      def: 3,
      heal: 0,
      speed: 5,
      cri: 3,
      tec: 10
    },
    skills: [
      { type: "TEC_01", dialogue: { text: "妨害訓練を実施します。", iconId: 1 } },
      { type: "ATK_01", dialogue: { text: "妨害後の接近行動を確認します。", iconId: 1 } }
    ]
  }),

  supportTrainer: makeNpc({
    name: "サポート訓練兵",
    type: "support",
    stats: {
      atk: 3,
      def: 4,
      heal: 4,
      speed: 6,
      cri: 3,
      tec: 8
    },
    skills: [
      { type: "CRI_01", dialogue: { text: "支援訓練として集中状態を作ります。", iconId: 1 } },
      { type: "TEC_01", dialogue: { text: "支援妨害を行います。", iconId: 1 } }
    ]
  }),

  normalSoldier: makeNpc({
    name: "一般兵",
    type: "attack",
    stats: {
      atk: 9,
      def: 4,
      heal: 0,
      speed: 5,
      cri: 4,
      tec: 3
    },
    skills: [
      { type: "ATK_01", dialogue: { text: "一般兵、攻撃します。", iconId: 1 } }
    ]
  }),

  normalGuard: makeNpc({
    name: "防衛兵",
    type: "defense",
    stats: {
      atk: 5,
      def: 10,
      heal: 0,
      speed: 3,
      cri: 2,
      tec: 4
    },
    skills: [
      { type: "DEF_01", dialogue: { text: "防衛兵、守りを固めます。", iconId: 1 } },
      { type: "ATK_01", dialogue: { text: "防衛兵、反撃します。", iconId: 1 } }
    ]
  }),

  normalMedic: makeNpc({
    name: "衛生兵",
    type: "heal",
    stats: {
      atk: 3,
      def: 4,
      heal: 10,
      speed: 4,
      cri: 2,
      tec: 6
    },
    skills: [
      { type: "HEAL_01", dialogue: { text: "衛生兵、回復します。", iconId: 1 } },
      { type: "ATK_01", dialogue: { text: "衛生兵、牽制します。", iconId: 1 } }
    ]
  }),

  boss01: makeNpc({
    name: "ボス1",
    type: "attack",
    iconUrl: ENEMY_ICON,
    stats: {
      atk: 16,
      def: 10,
      heal: 0,
      speed: 7,
      cri: 8,
      tec: 6
    },
    skills: [
      { type: "ATK_01", dialogue: { text: "大型目標、前方を攻撃します。", iconId: 1 } },
      { type: "CRI_01", dialogue: { text: "大型目標、狙いを定めています。", iconId: 1 } }
    ],
    characterDialogues: {
      battleStart: [
        { text: "大型反応を確認。戦闘を開始します。", iconId: 1 }
      ]
    }
  }),

  boss02: makeNpc({
    name: "ボス2",
    type: "attack",
    iconUrl: ENEMY_ICON,
    stats: {
      atk: 20,
      def: 12,
      heal: 0,
      speed: 8,
      cri: 10,
      tec: 8
    },
    skills: [
      { type: "ATK_01", dialogue: { text: "次段階大型目標、攻撃します。", iconId: 1 } },
      { type: "TEC_01", dialogue: { text: "次段階大型目標、妨害波を出します。", iconId: 1 } }
    ]
  }),

  npcHealer: makeNpc({
    name: "ヒールアヒル",
    type: "heal",
    iconUrl: DUCK_ICON,
    stats: {
      atk: 2,
      def: 4,
      heal: 11,
      speed: 5,
      cri: 4,
      tec: 8
    },
    skills: [
      { type: "HEAL_01", dialogue: { text: "修復波を展開します。", iconId: 1 } }
    ]
  }),
  
  npcAttacker: makeNpc({
    name: "アタックアヒル",
    type: "attack",
    iconUrl: DUCK_ICON,
    stats: {
      atk: 11,
      def: 4,
      heal: 1,
      speed: 6,
      cri: 6,
      tec: 4
    },
    skills: [
      { type: "ATK_01", dialogue: { text: "正面目標を攻撃します。", iconId: 1 } }
    ]
  }),

  npcSupporter: makeNpc({
    name: "サポートアヒル",
    type: "support",
    iconUrl: DUCK_ICON,
    stats: {
      atk: 4,
      def: 4,
      heal: 3,
      speed: 9,
      cri: 3,
      tec: 10
    },
    skills: [
      { type: "TEC_01", dialogue: { text: "妨害波を送信します。", iconId: 1 } }
    ]
  })
    }
  }
};
