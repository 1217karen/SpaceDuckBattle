// battle-npcs.js

export const NPCS = {
  npcHealer: {
    unitData: {
      name: "ヒールアヒル",
      type: "heal",

      icon: {
        default: "https://www.rabbithutch.site/usagoya/picture.php?user=1217karen&file=duck2_icon_1.webp",
        N: "",
        E: "",
        S: "",
        W: ""
      },

      stats: {
        atk: 2,
        def: 4,
        heal: 11,
        speed: 5,
        cri: 4,
        tec: 8
      },

      patterns: [
        {
          name: "基本",
          public: true,
          skills: [
            {
              type: "heal_cross2",
              dialogue: {
                text: "負傷者を確認、回復ラインを接続します。"
              }
            },
            {
              type: "repair_wave",
              dialogue: {
                text: "修復波を展開、隊列を維持してください。"
              }
            },
            {
              type: "buff_wave",
              dialogue: {
                text: "防護補助を付与、前線を支えます。"
              }
            },
            {
              type: "heal_cross2",
              dialogue: {
                text: "損耗拡大を防ぎます、立て直します。"
              }
            }
          ]
        }
      ]
    },

    characterData: {
      fullName: "防衛隊員・回復担当",
      defaultName: "防衛隊回復員",
      defaultIcon: "https://www.rabbithutch.site/usagoya/picture.php?user=1217karen&file=npc2_icon_0.webp",

      commIcons: [
        {
          name: "防衛隊回復員",
          url: "https://www.rabbithutch.site/usagoya/picture.php?user=1217karen&file=npc2_icon_0.webp"
        }
      ],

      commDialogues: {
        battleStart: [
          { text: "防衛隊回復担当、支援を開始します。" }
        ],
        turnChangeNeutral: [
          { text: "負傷状況を監視中、回復は維持できます。" }
        ],
        turnChangeAdvantage: [
          { text: "前線は安定しています、このまま維持します。" }
        ],
        turnChangeDisadvantage: [
          { text: "損耗が増えています、治療を優先します。" }
        ],
        turnChangePinch: [
          { text: "危険です、無理をせず回復範囲へ。" }
        ],
        critical: [
          { text: "効果増大、処置が通りました。" }
        ],
        kill: [
          { text: "対象の無力化を確認しました。" }
        ],
        battleEndWin: [
          { text: "戦闘終了、応急対応を継続します。" }
        ]
      }
    }
  },

  npcAttacker: {
    unitData: {
      name: "アタックアヒル",
      type: "attack",

      icon: {
        default: "https://www.rabbithutch.site/usagoya/picture.php?user=1217karen&file=duck2_icon_1.webp",
        N: "",
        E: "",
        S: "",
        W: ""
      },

      stats: {
        atk: 11,
        def: 4,
        heal: 1,
        speed: 6,
        cri: 6,
        tec: 4
      },

      patterns: [
        {
          name: "基本",
          public: true,
          skills: [
            {
              type: "attack_front1",
              dialogue: {
                text: "防衛隊戦闘員、正面目標を攻撃します。"
              }
            },
            {
              type: "attack_front_knockback",
              dialogue: {
                text: "前方を押し返します、距離を取ってください。"
              }
            },
            {
              type: "attack_around2_all",
              dialogue: {
                text: "周辺一帯を制圧、まとめて排除します。"
              }
            },
            {
              type: "attack_front1",
              dialogue: {
                text: "突破口を作ります、続いてください。"
              }
            }
          ]
        }
      ]
    },

    characterData: {
      fullName: "防衛隊員・戦闘担当",
      defaultName: "防衛隊戦闘員",
      defaultIcon: "https://www.rabbithutch.site/usagoya/picture.php?user=1217karen&file=duck2_icon_1.webp",

      commIcons: [
        {
          name: "防衛隊戦闘員",
          url: "https://www.rabbithutch.site/usagoya/picture.php?user=1217karen&file=duck2_icon_1.webp"
        }
      ],

      commDialogues: {
        battleStart: [
          { text: "防衛隊戦闘担当、これより迎撃します。" }
        ],
        turnChangeNeutral: [
          { text: "まだ拮抗中です、押し返します。" }
        ],
        turnChangeAdvantage: [
          { text: "敵が崩れています、このまま制圧します。" }
        ],
        turnChangeDisadvantage: [
          { text: "押されていますが、戦線は維持します。" }
        ],
        turnChangePinch: [
          { text: "劣勢です、ですがまだ下がれません。" }
        ],
        critical: [
          { text: "有効打を確認、続けます。" }
        ],
        kill: [
          { text: "一体排除、次の目標へ移ります。" }
        ],
        battleEndWin: [
          { text: "周辺の安全を確認、戦闘終了です。" }
        ]
      }
    }
  },

  npcSupporter: {
    unitData: {
      name: "サポートアヒル",
      type: "support",

      icon: {
        default: "https://www.rabbithutch.site/usagoya/picture.php?user=1217karen&file=duck2_icon_1.webp",
        N: "",
        E: "",
        S: "",
        W: ""
      },

      stats: {
        atk: 4,
        def: 4,
        heal: 3,
        speed: 9,
        cri: 3,
        tec: 10
      },

      patterns: [
        {
          name: "基本",
          public: true,
          skills: [
            {
              type: "debuff_wave",
              dialogue: {
                text: "妨害波を送信、敵の動きを鈍らせます。"
              }
            },
            {
              type: "buff_wave",
              dialogue: {
                text: "支援波を展開、各員の能力を補強します。"
              }
            },
            {
              type: "pull_farthest_enemy",
              dialogue: {
                text: "後方目標を引き寄せます、警戒してください。"
              }
            },
            {
              type: "debuff_wave",
              dialogue: {
                text: "敵編成を乱します、攻撃を合わせてください。"
              }
            }
          ]
        }
      ]
    },

    characterData: {
      fullName: "防衛隊員・支援担当",
      defaultName: "防衛隊支援員",
      defaultIcon: "https://www.rabbithutch.site/usagoya/picture.php?user=1217karen&file=npc2_icon_0.webp",

      commIcons: [
        {
          name: "防衛隊支援員",
          url: "https://www.rabbithutch.site/usagoya/picture.php?user=1217karen&file=npc2_icon_0.webp"
        }
      ],

      commDialogues: {
        battleStart: [
          { text: "防衛隊支援担当、補助を開始します。" }
        ],
        turnChangeNeutral: [
          { text: "戦況を観測中、支援は継続可能です。" }
        ],
        turnChangeAdvantage: [
          { text: "こちらが主導しています、支援を重ねます。" }
        ],
        turnChangeDisadvantage: [
          { text: "敵圧が強いです、妨害を優先します。" }
        ],
        turnChangePinch: [
          { text: "危険域です、制御支援を集中します。" }
        ],
        critical: [
          { text: "連携成功、効果が増しています。" }
        ],
        kill: [
          { text: "対象排除を確認、次へ回します。" }
        ],
        battleEndWin: [
          { text: "支援任務を終了、各員お疲れさまでした。" }
        ]
      }
    }
  }
};
