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
                { text: "（勢いよく突進してきた）", iconId: 1 }
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

      commIcons: [
        {
          id: 1,
          name: "",
          url: "https://www.rabbithutch.site/usagoya/picture.php?user=1217karen&file=duck3_icon.webp"
        }
      ],

      commDialogues: {
        battleStart: [
          { text: "（黒いアヒルが並んでいる……）", iconId: 1 }
        ],
        turnChangeNeutral: [
          { text: "「…………。」", iconId: 1 }
        ],
        turnChangeAdvantage: [
          { text: "「…………。」", iconId: 1 }
        ],
        turnChangeDisadvantage: [
          { text: "「…………。」", iconId: 1 }
        ],
        turnChangePinch: [
          { text: "「…………。」", iconId: 1 }
        ],
        critical: [],
        kill: [
          { text: "「…………。」", iconId: 1 }
        ],
        battleEndWin: [
          { text: "「…………。」", iconId: 1 }
        ]
      }
    }
  },

  normalEnemyA: {
    unitData: {
      name: "突撃型宇宙アヒル",
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
                { text: "（一直線に突っ込んでくる）", iconId: 1 }
              ]
            },
            {
              type: "attack_front_knockback",
              dialogue: [
                { text: "（強引に押し込んできた）", iconId: 1 }
              ]
            },
            {
              type: "skill_006",
              dialogue: [
                { text: "（周囲を巻き込むように暴れた）", iconId: 1 }
              ]
            }
          ]
        }
      ]
    },

    characterData: {
      fullName: "突撃型宇宙アヒル",
      defaultName: "突撃型宇宙アヒル",
      defaultIcon: "https://www.rabbithutch.site/usagoya/picture.php?user=1217karen&file=duck3_icon.webp",

      commIcons: [
        {
          id: 1,
          name: "",
          url: "https://www.rabbithutch.site/usagoya/picture.php?user=1217karen&file=duck3_icon.webp"
        }
      ],

      commDialogues: {
        battleStart: [
          { text: "（黒いアヒルが並んでいる……）", iconId: 1 }
        ],
        turnChangeNeutral: [
          { text: "「…………。」", iconId: 1 }
        ],
        turnChangeAdvantage: [
          { text: "「…………。」", iconId: 1 }
        ],
        turnChangeDisadvantage: [
          { text: "「…………。」", iconId: 1 }
        ],
        turnChangePinch: [
          { text: "「…………。」", iconId: 1 }
        ],
        critical: [],
        kill: [
          { text: "「…………。」", iconId: 1 }
        ],
        battleEndWin: [
          { text: "「…………。」", iconId: 1 }
        ]
      }
    }
  },

  normalEnemyB: {
    unitData: {
      name: "防壁型宇宙アヒル",
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
              type: "skill_002",
              dialogue: [
                { text: "（どこからか衛星を呼び寄せた）", iconId: 1 }
              ]
            },
            {
              type: "attack_front_knockback",
              dialogue: [
                { text: "（体当たりで押し返してきた）", iconId: 1 }
              ]
            },
            {
              type: "skill_008",
              dialogue: [
                { text: "（周囲に防護めいた波を広げた）", iconId: 1 }
              ]
            }
          ]
        }
      ]
    },

    characterData: {
      fullName: "防壁型宇宙アヒル",
      defaultName: "防壁型宇宙アヒル",
      defaultIcon: "https://www.rabbithutch.site/usagoya/picture.php?user=1217karen&file=duck3_icon.webp",

      commIcons: [
        {
          id: 1,
          name: "",
          url: "https://www.rabbithutch.site/usagoya/picture.php?user=1217karen&file=duck3_icon.webp"
        }
      ],

      commDialogues: {
        battleStart: [
          { text: "（黒いアヒルが身構えている……）", iconId: 1 }
        ],
        turnChangeNeutral: [
          { text: "「…………。」", iconId: 1 }
        ],
        turnChangeAdvantage: [
          { text: "「…………。」", iconId: 1 }
        ],
        turnChangeDisadvantage: [
          { text: "「…………。」", iconId: 1 }
        ],
        turnChangePinch: [
          { text: "「…………。」", iconId: 1 }
        ],
        critical: [],
        kill: [
          { text: "「…………。」", iconId: 1 }
        ],
        battleEndWin: [
          { text: "「…………。」", iconId: 1 }
        ]
      }
    }
  },

  normalEnemyC: {
    unitData: {
      name: "支援型宇宙アヒル",
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

      commIcons: [
        {
          id: 1,
          name: "",
          url: "https://www.rabbithutch.site/usagoya/picture.php?user=1217karen&file=duck3_icon.webp"
        }
      ],

      patterns: [
        {
          name: "基本",
          public: true,
          skills: [
            {
              type: "debuff_wave",
              dialogue: [
                { text: "（嫌な音波を響かせている）", iconId: 1 }
              ]
            },
            {
              type: "skill_009",
              dialogue: [
                { text: "（周囲の個体を強化している）", iconId: 1 }
              ]
            },
            {
              type: "corrosion_wave",
              dialogue: [
                { text: "（濁った波動が広がった）", iconId: 1 }
              ]
            }
          ]
        }
      ]
    },

    characterData: {
      fullName: "支援型宇宙アヒル",
      defaultName: "支援型宇宙アヒル",
      defaultIcon: "https://www.rabbithutch.site/usagoya/picture.php?user=1217karen&file=duck3_icon.webp",

      commIcons: [
        {
          id: 1,
          name: "",
          url: "https://www.rabbithutch.site/usagoya/picture.php?user=1217karen&file=duck3_icon.webp"
        }
      ],

      commDialogues: {
        battleStart: [
          { text: "（黒いアヒルが佇んでいる……）", iconId: 1 }
        ],
        turnChangeNeutral: [
          { text: "「…………。」", iconId: 1 }
        ],
        turnChangeAdvantage: [
          { text: "「…………。」", iconId: 1 }
        ],
        turnChangeDisadvantage: [
          { text: "「…………。」", iconId: 1 }
        ],
        turnChangePinch: [
          { text: "「…………。」", iconId: 1 }
        ],
        critical: [],
        kill: [
          { text: "「…………。」", iconId: 1 }
        ],
        battleEndWin: [
          { text: "「…………。」", iconId: 1 }
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

      commIcons: [
        {
          id: 1,
          name: "",
          url: "https://www.rabbithutch.site/usagoya/picture.php?user=1217karen&file=duck3_icon.webp"
        }
      ],

      commDialogues: {
        battleStart: [
          { text: "「…………。」", iconId: 1 }
        ],
        turnChangeNeutral: [
          { text: "「…………。」", iconId: 1 }
        ],
        turnChangeAdvantage: [
          { text: "「…………。」", iconId: 1 }
        ],
        turnChangeDisadvantage: [
          { text: "「…………。」", iconId: 1 }
        ],
        turnChangePinch: [
          { text: "「…………。」", iconId: 1 }
        ],
        critical: [],
        kill: [
          { text: "「…………。」", iconId: 1 }
        ],
        battleEndWin: [
          { text: "「…………。」", iconId: 1 }
        ]
      }
    }
  }
};
