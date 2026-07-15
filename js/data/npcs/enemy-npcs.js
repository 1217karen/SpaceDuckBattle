// enemy-npcs.js

const ENEMY_ICON = "https://www.rabbithutch.site/usagoya/picture.php?user=1217karen&file=duck3_icon.webp";

function makeIconSet(url) {
  return {
    default: url,
    N: "",
    E: "",
    S: "",
    W: ""
  };
}

function makeCommIcons(name, iconUrl) {
  return [
    {
      id: 1,
      name,
      url: iconUrl
    }
  ];
}

function makeCommDialogues(name, overrides = {}) {
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
    ],
    ...overrides
  };
}

function makeNpc({
  id,
  name,
  description = "",
  type,
  iconUrl = ENEMY_ICON,
  stats,
  skills = [],
  behavior = "auto",
  commDialogues = {}
}) {
  return {
    id,
    side: "enemy",
    name,
    description,
    unit: {
      type,
      behavior,
      icons: makeIconSet(iconUrl),
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
      defaultIcon: iconUrl,
      commIcons: makeCommIcons(name, iconUrl),
      commDialogues: makeCommDialogues(name, commDialogues)
    }
  };
}

export const ENEMY_NPCS = {
  training_decoy: makeNpc({
    id: "training_decoy",
    name: "訓練用デコイ",
    description: "自動戦闘の確認に使う訓練用の標的です。",
    type: "decoy",
    behavior: "wait",
    iconUrl: ENEMY_ICON,
    stats: { atk: 0, def: 0, heal: 0, speed: 0, cri: 0, tec: 0 },
    skills: [],
    commDialogues: {
      battleStart: [
        { text: "訓練用デコイが立っている……。", iconId: 1 }
      ],
      turnChangeNeutral: []
    }
  }),

  attack_trainer: makeNpc({
    id: "attack_trainer",
    name: "アタック訓練兵",
    description: "攻撃行動の確認に使う訓練兵です。",
    type: "attack",
    stats: { atk: 8, def: 2, heal: 0, speed: 5, cri: 4, tec: 2 },
    skills: [
      { type: "ATK_01", dialogue: { text: "正面目標へ攻撃訓練を行います。", iconId: 1 } }
    ]
  }),

  defense_trainer: makeNpc({
    id: "defense_trainer",
    name: "ディフェンス訓練兵",
    description: "防御行動の確認に使う訓練兵です。",
    type: "defense",
    stats: { atk: 4, def: 9, heal: 0, speed: 3, cri: 2, tec: 4 },
    skills: [
      { type: "DEF_01", dialogue: { text: "防御姿勢を確認します。", iconId: 1 } },
      { type: "ATK_01", dialogue: { text: "防御訓練から反撃します。", iconId: 1 } }
    ]
  }),

  heal_trainer: makeNpc({
    id: "heal_trainer",
    name: "ヒール訓練兵",
    description: "回復行動の確認に使う訓練兵です。",
    type: "heal",
    stats: { atk: 3, def: 3, heal: 9, speed: 4, cri: 2, tec: 5 },
    skills: [
      { type: "HEAL_01", dialogue: { text: "回復訓練を実施します。", iconId: 1 } },
      { type: "ATK_01", dialogue: { text: "最低限の反撃を行います。", iconId: 1 } }
    ]
  }),

  speed_trainer: makeNpc({
    id: "speed_trainer",
    name: "スピード訓練兵",
    description: "速度行動の確認に使う訓練兵です。",
    type: "attack",
    stats: { atk: 5, def: 2, heal: 0, speed: 10, cri: 3, tec: 4 },
    skills: [
      { type: "SPD_01", dialogue: { text: "加速訓練を開始します。", iconId: 1 } },
      { type: "ATK_01", dialogue: { text: "速度を活かして接近攻撃します。", iconId: 1 } }
    ]
  }),

  technical_trainer: makeNpc({
    id: "technical_trainer",
    name: "テクニカル訓練兵",
    description: "妨害行動の確認に使う訓練兵です。",
    type: "support",
    stats: { atk: 3, def: 3, heal: 0, speed: 5, cri: 3, tec: 10 },
    skills: [
      { type: "TEC_01", dialogue: { text: "妨害訓練を実施します。", iconId: 1 } },
      { type: "ATK_01", dialogue: { text: "妨害後の接近行動を確認します。", iconId: 1 } }
    ]
  }),

  support_trainer: makeNpc({
    id: "support_trainer",
    name: "サポート訓練兵",
    description: "支援行動の確認に使う訓練兵です。",
    type: "support",
    stats: { atk: 3, def: 4, heal: 4, speed: 6, cri: 3, tec: 8 },
    skills: [
      { type: "CRI_01", dialogue: { text: "支援訓練として集中状態を作ります。", iconId: 1 } },
      { type: "TEC_01", dialogue: { text: "支援妨害を行います。", iconId: 1 } }
    ]
  }),

  normal_soldier: makeNpc({
    id: "normal_soldier",
    name: "一般兵",
    description: "標準的な攻撃型の敵兵です。",
    type: "attack",
    stats: { atk: 9, def: 4, heal: 0, speed: 5, cri: 4, tec: 3 },
    skills: [
      { type: "ATK_01", dialogue: { text: "一般兵、攻撃します。", iconId: 1 } }
    ]
  }),

  normal_guard: makeNpc({
    id: "normal_guard",
    name: "防衛兵",
    description: "防御を得意とする敵兵です。",
    type: "defense",
    stats: { atk: 5, def: 10, heal: 0, speed: 3, cri: 2, tec: 4 },
    skills: [
      { type: "DEF_01", dialogue: { text: "防衛兵、守りを固めます。", iconId: 1 } },
      { type: "ATK_01", dialogue: { text: "防衛兵、反撃します。", iconId: 1 } }
    ]
  }),

  normal_medic: makeNpc({
    id: "normal_medic",
    name: "衛生兵",
    description: "回復を得意とする敵兵です。",
    type: "heal",
    stats: { atk: 3, def: 4, heal: 10, speed: 4, cri: 2, tec: 6 },
    skills: [
      { type: "HEAL_01", dialogue: { text: "衛生兵、回復します。", iconId: 1 } },
      { type: "ATK_01", dialogue: { text: "衛生兵、牽制します。", iconId: 1 } }
    ]
  }),

  boss_01: makeNpc({
    id: "boss_01",
    name: "ボス1",
    description: "大型の攻撃型目標です。",
    type: "attack",
    iconUrl: ENEMY_ICON,
    stats: { atk: 16, def: 10, heal: 0, speed: 7, cri: 8, tec: 6 },
    skills: [
      { type: "ATK_01", dialogue: { text: "大型目標、前方を攻撃します。", iconId: 1 } },
      { type: "CRI_01", dialogue: { text: "大型目標、狙いを定めています。", iconId: 1 } }
    ],
    commDialogues: {
      battleStart: [
        { text: "大型反応を確認。戦闘を開始します。", iconId: 1 }
      ]
    }
  }),

  boss_02: makeNpc({
    id: "boss_02",
    name: "ボス2",
    description: "次段階の大型攻撃目標です。",
    type: "attack",
    iconUrl: ENEMY_ICON,
    stats: { atk: 20, def: 12, heal: 0, speed: 8, cri: 10, tec: 8 },
    skills: [
      { type: "ATK_01", dialogue: { text: "次段階大型目標、攻撃します。", iconId: 1 } },
      { type: "TEC_01", dialogue: { text: "次段階大型目標、妨害波を出します。", iconId: 1 } }
    ]
  })
};
