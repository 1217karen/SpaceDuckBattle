// battle-npcs.js

export const battleNpcs = [
  {
    id: "npc_healer",

    unitData: {
      name: "テストヒーラー",
      type: "heal",

      icon: {
        default: "https://www.rabbithutch.site/usagoya/picture.php?user=1217karen&file=D06.webp",
        N: "",
        E: "",
        S: "",
        W: ""
      },

      stats: {
        atk: 1,
        def: 2,
        heal: 10,
        speed: 5,
        cri: 8,
        tec: 4
      },

      patterns: [
        {
          name: "基本",
          public: true,
          skills: [
            {
              type: "heal_cross2",
              dialogue: {
                text: "回復ライン接続、まとめて立て直します。"
              }
            },
            {
              type: "repair_wave",
              dialogue: {
                text: "修復波を展開します、持ちこたえてください。"
              }
            },
            {
              type: "satellite_meteor_field",
              dialogue: {
                iconUrl: "https://placehold.co/60x60?text=HEAL",
                name: "管制支援",
                text: "衛星管制リンク確立、迎撃フィールドを起動。"
              }
            }
          ]
        }
      ]
    },

    characterData: {
      fullName: "テストヒーラー・オペレーター",
      defaultName: "ヒーラー",
      defaultIcon: "https://www.rabbithutch.site/usagoya/picture.php?user=1217karen&file=D06.webp",

      commIcons: [
        {
          name: "ヒーラー",
          url: "https://www.rabbithutch.site/usagoya/picture.php?user=1217karen&file=D06.webp"
        },
        {
          name: "管制支援",
          url: "https://placehold.co/60x60?text=HEAL"
        }
      ],

      commDialogues: {
        battleStart: [
          { text: "戦闘支援を開始します。" }
        ],
        turnChangeNeutral: [
          { text: "回復ライン、維持します。" }
        ],
        turnChangeAdvantage: [
          { text: "押し切れます、このまま前進を。" }
        ],
        turnChangeDisadvantage: [
          { text: "損耗が大きいです、立て直します。" }
        ],
        turnChangePinch: [
          { text: "危険です、回復を優先してください。" }
        ],
        critical: [
          { text: "急所確認、効果上昇。" }
        ],
        kill: [
          { text: "対象の無力化を確認しました。" }
        ],
        battleEndWin: [
          { text: "任務完了です。" }
        ]
      }
    }
  },

  {
    id: "npc_attacker",

    unitData: {
      name: "テストアタッカー",
      type: "attack",

      icon: {
        default: "https://www.rabbithutch.site/usagoya/picture.php?user=1217karen&file=D08.webp",
        N: "",
        E: "",
        S: "",
        W: ""
      },

      stats: {
        atk: 10,
        def: 3,
        heal: 1,
        speed: 6,
        cri: 5,
        tec: 5
      },

      patterns: [
        {
          name: "基本",
          public: true,
          skills: [
            {
              type: "attack_front1",
              dialogue: {
                text: "正面を突破します。"
              }
            },
            {
              type: "attack_front_knockback",
              dialogue: {
                text: "吹き飛ばします、下がってください。"
              }
            },
            {
              type: "attack_around2_all",
              dialogue: {
                iconUrl: "https://placehold.co/60x60?text=ATK",
                name: "突撃形態",
                text: "周辺制圧、まとめて片づける。"
              }
            }
          ]
        }
      ]
    },

    characterData: {
      fullName: "テストアタッカー・ヴァンガード",
      defaultName: "アタッカー",
      defaultIcon: "https://www.rabbithutch.site/usagoya/picture.php?user=1217karen&file=D08.webp",

      commIcons: [
        {
          name: "アタッカー",
          url: "https://www.rabbithutch.site/usagoya/picture.php?user=1217karen&file=D08.webp"
        },
        {
          name: "突撃形態",
          url: "https://placehold.co/60x60?text=ATK"
        }
      ],

      commDialogues: {
        battleStart: [
          { text: "先陣は任せて。" }
        ],
        turnChangeNeutral: [
          { text: "まだ互角、ここから崩す。" }
        ],
        turnChangeAdvantage: [
          { text: "いい流れ、このまま押し込む。" }
        ],
        turnChangeDisadvantage: [
          { text: "押されてるけど、まだやれる。" }
        ],
        turnChangePinch: [
          { text: "苦しいね……でも止まれない。" }
        ],
        critical: [
          { text: "入った、急所だ。" }
        ],
        kill: [
          { text: "一体撃破。" }
        ],
        battleEndWin: [
          { text: "勝ち切ったね。" }
        ]
      }
    }
  },

  {
    id: "npc_supporter",

    unitData: {
      name: "テストサポーター",
      type: "support",

      icon: {
        default: "https://www.rabbithutch.site/usagoya/picture.php?user=1217karen&file=D13.webp",
        N: "",
        E: "",
        S: "",
        W: ""
      },

      stats: {
        atk: 4,
        def: 3,
        heal: 2,
        speed: 15,
        cri: 4,
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
                text: "妨害波を流します。"
              }
            },
            {
              type: "buff_wave",
              dialogue: {
                text: "強化波を送る、合わせて。"
              }
            },
            {
              type: "pull_farthest_enemy",
              dialogue: {
                iconUrl: "https://placehold.co/60x60?text=SUP",
                name: "制御補助",
                text: "距離制御、対象を引き寄せます。"
              }
            }
          ]
        }
      ]
    },

    characterData: {
      fullName: "テストサポーター・リンク",
      defaultName: "サポーター",
      defaultIcon: "https://www.rabbithutch.site/usagoya/picture.php?user=1217karen&file=D13.webp",

      commIcons: [
        {
          name: "サポーター",
          url: "https://www.rabbithutch.site/usagoya/picture.php?user=1217karen&file=D13.webp"
        },
        {
          name: "制御補助",
          url: "https://placehold.co/60x60?text=SUP"
        }
      ],

      commDialogues: {
        battleStart: [
          { text: "補助リンク接続、いつでもどうぞ。" }
        ],
        turnChangeNeutral: [
          { text: "状況を観測中、支援を継続します。" }
        ],
        turnChangeAdvantage: [
          { text: "主導権はこちら、崩しに行けます。" }
        ],
        turnChangeDisadvantage: [
          { text: "敵の圧が強い、補助を厚くします。" }
        ],
        turnChangePinch: [
          { text: "危険域です、制御を優先します。" }
        ],
        critical: [
          { text: "良い連携です。" }
        ],
        kill: [
          { text: "排除確認、次に移ります。" }
        ],
        battleEndWin: [
          { text: "戦闘終了、支援を解除します。" }
        ]
      }
    }
  }
];
