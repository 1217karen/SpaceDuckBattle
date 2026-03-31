// battle-enemies.js

export const ENEMIES = {
  tutorialEnemyA: {
    unitData: {
      name: "訓練用侵攻体",
      type: "attack",

      icon: {
        default: "https://www.rabbithutch.site/usagoya/picture.php?user=1217karen&file=duck3_icon.webp",
        N: "",
        E: "",
        S: "",
        W: ""
      },

      stats: {
        atk: 6,
        def: 2,
        heal: 0,
        speed: 6,
        cri: 5,
        tec: 3
      },

      patterns: [
        {
          name: "基本",
          public: true,
          skills: [
            {
              type: "attack_front1",
              dialogue: [
                { text: "（勢いよく突進してきた）" }
              ]
            }
          ]
        }
      ]
    },

    characterData: {
      fullName: "訓練用侵攻体",
      defaultName: "訓練用侵攻体",
      defaultIcon: "https://www.rabbithutch.site/usagoya/picture.php?user=1217karen&file=duck3_icon.webp",

      commIcons: [],

      commDialogues: {
        battleStart: [
          { text: "（黒いアヒルが並んでいる……）" }
        ],
        turnChangeNeutral: [
          { text: "「…………。」" }
        ],
        turnChangeAdvantage: [
          { text: "「…………。」" }
        ],
        turnChangeDisadvantage: [
          { text: "「…………。」" }
        ],
        turnChangePinch: [
          { text: "「…………。」" }
        ],
        critical: [
          { text: "" }
        ],
        kill: [
          { text: "「…………。」" }
        ],
        battleEndWin: [
          { text: "「…………。」" }
        ]
      }
    }
  },

  normalEnemyA: {
    unitData: {
      name: "侵攻体・突撃型",
      type: "attack",

      icon: {
        default: "https://www.rabbithutch.site/usagoya/picture.php?user=1217karen&file=duck3_icon.webp",
        N: "",
        E: "",
        S: "",
        W: ""
      },

      stats: {
        atk: 11,
        def: 3,
        heal: 0,
        speed: 7,
        cri: 6,
        tec: 3
      },

      patterns: [
        {
          name: "基本",
          public: true,
          skills: [
            {
              type: "attack_front1",
              dialogue: [
                { text: "（一直線に突っ込んでくる）" }
              ]
            },
            {
              type: "attack_front_knockback",
              dialogue: [
                { text: "（強引に押し込んできた）" }
              ]
            },
            {
              type: "attack_around2_all",
              dialogue: [
                { text: "（周囲を巻き込むように暴れた）" }
              ]
            }
          ]
        }
      ]
    },

    characterData: {
      fullName: "侵攻体・突撃型",
      defaultName: "突撃型",
      defaultIcon: "https://www.rabbithutch.site/usagoya/picture.php?user=1217karen&file=duck3_icon.webp",

      commIcons: [],

      commDialogues: {
        battleStart: [
          { text: "（黒いアヒルが並んでいる……）" }
        ],
        turnChangeNeutral: [
          { text: "「…………。」" }
        ],
        turnChangeAdvantage: [
          { text: "「…………。」" }
        ],
        turnChangeDisadvantage: [
          { text: "「…………。」" }
        ],
        turnChangePinch: [
          { text: "「…………。」" }
        ],
        critical: [
          { text: "「…………。」" }
        ],
        kill: [
          { text: "「…………。」" }
        ],
        battleEndWin: [
          { text: "「…………。」" }
        ]
      }
    }
  },

  normalEnemyB: {
    unitData: {
      name: "侵攻体・防壁型",
      type: "defense",

      icon: {
        default: "https://www.rabbithutch.site/usagoya/picture.php?user=1217karen&file=duck3_icon.webp",
        N: "",
        E: "",
        S: "",
        W: ""
      },

      stats: {
        atk: 6,
        def: 10,
        heal: 0,
        speed: 4,
        cri: 3,
        tec: 5
      },

      patterns: [
        {
          name: "基本",
          public: true,
          skills: [
            {
              type: "attack_front1",
              dialogue: [
                { text: "（重い一撃を振り下ろしてきた）" }
              ]
            },
            {
              type: "attack_front_knockback",
              dialogue: [
                { text: "（体当たりで押し返してきた）" }
              ]
            },
            {
              type: "buff_wave",
              dialogue: [
                { text: "（周囲に防護めいた波を広げた）" }
              ]
            }
          ]
        }
      ]
    },

    characterData: {
      fullName: "侵攻体・防壁型",
      defaultName: "防壁型",
      defaultIcon: "https://www.rabbithutch.site/usagoya/picture.php?user=1217karen&file=duck3_icon.webp",

      commIcons: [],

      commDialogues: {
        battleStart: [
          { text: "（黒いアヒルが身構えている……）" }
        ],
        turnChangeNeutral: [
          { text: "「…………。」" }
        ],
        turnChangeAdvantage: [
          { text: "「…………。」" }
        ],
        turnChangeDisadvantage: [
          { text: "「…………。」" }
        ],
        turnChangePinch: [
          { text: "「…………。」" }
        ],
        critical: [
          { text: "「…………。」" }
        ],
        kill: [
          { text: "「…………。」" }
        ],
        battleEndWin: [
          { text: "「…………。」" }
        ]
      }
    }
  },

  normalEnemyC: {
    unitData: {
      name: "侵攻体・支援型",
      type: "support",

      icon: {
        default: "https://www.rabbithutch.site/usagoya/picture.php?user=1217karen&file=duck3_icon.webp",
        N: "",
        E: "",
        S: "",
        W: ""
      },

      stats: {
        atk: 4,
        def: 4,
        heal: 0,
        speed: 8,
        cri: 3,
        tec: 9
      },

      patterns: [
        {
          name: "基本",
          public: true,
          skills: [
            {
              type: "debuff_wave",
              dialogue: [
                { text: "（濁った波動が広がった）" }
              ]
            },
            {
              type: "buff_wave",
              dialogue: [
                { text: "（周囲の個体を強化しているようだ）" }
              ]
            },
            {
              type: "pull_farthest_enemy",
              dialogue: [
                { text: "（後方の対象を無理やり引き寄せた）" }
              ]
            }
          ]
        }
      ]
    },

    characterData: {
      fullName: "侵攻体・支援型",
      defaultName: "支援型",
      defaultIcon: "https://www.rabbithutch.site/usagoya/picture.php?user=1217karen&file=duck3_icon.webp",

      commIcons: [],

      commDialogues: {
        battleStart: [
          { text: "（黒いアヒルが佇んでいる……）" }
        ],
        turnChangeNeutral: [
          { text: "「…………。」" }
        ],
        turnChangeAdvantage: [
          { text: "「…………。」" }
        ],
        turnChangeDisadvantage: [
          { text: "「…………。」" }
        ],
        turnChangePinch: [
          { text: "「…………。」" }
        ],
        critical: [
          { text: "「…………。」 }
        ],
        kill: [
          { text: "「…………。」" }
        ],
        battleEndWin: [
          { text: "「…………。」" }
        ]
      }
    }
  },

  testEnemyA: {
    unitData: {
      name: "ボス敵A",
      type: "attack",

      icon: {
        default: "https://www.rabbithutch.site/usagoya/picture.php?user=1217karen&file=duck3_icon.webp",
        N: "",
        E: "",
        S: "",
        W: ""
      },

      stats: {
        atk: 30,
        def: 15,
        heal: 0,
        speed: 20,
        cri: 20,
        tec: 15
      },

      patterns: [
        {
          name: "基本",
          public: true,
          skills: [
            {
              type: "attack_front1"
            }
          ]
        }
      ]
    },

    characterData: {
      fullName: "ボス敵A",
      defaultName: "ボス敵A",
      defaultIcon: "https://www.rabbithutch.site/usagoya/picture.php?user=1217karen&file=duck3_icon.webp",

      commIcons: [],

      commDialogues: {
        battleStart: [
          { text: "「…………。」" }
        ],
        turnChangeNeutral: [
          { text: "「…………。」" }
        ],
        turnChangeAdvantage: [
          { text: "「…………。」" }
        ],
        turnChangeDisadvantage: [
          { text: "「…………。」" }
        ],
        turnChangePinch: [
          { text: "「…………。」" }
        ],
        critical: [
          { text: "「…………。」" }
        ],
        kill: [
          { text: "「…………。」" }
        ],
        battleEndWin: [
          { text: "「…………。」" }
        ]
      }
    }
  }
};
