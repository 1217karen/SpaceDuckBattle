// battle-enemies.js

export const ENEMIES = {
  tutorialEnemyA: {
    unitData: {
      name: "チュートリアル敵A",
      type: "attack",

      icon: {
        default: "https://www.rabbithutch.site/usagoya/picture.php?user=1217karen&file=D01.webp",
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
      fullName: "チュートリアル敵A",
      defaultName: "チュートリアル敵A",
      defaultIcon: "https://www.rabbithutch.site/usagoya/picture.php?user=1217karen&file=D01.webp",

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
      name: "通常敵A",
      type: "attack",

      icon: {
        default: "https://www.rabbithutch.site/usagoya/picture.php?user=1217karen&file=D01.webp",
        N: "",
        E: "",
        S: "",
        W: ""
      },

      stats: {
        atk: 10,
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
              type: "attack_front1"
            }
          ]
        }
      ]
    },

    characterData: {
      fullName: "通常敵A",
      defaultName: "通常敵A",
      defaultIcon: "https://www.rabbithutch.site/usagoya/picture.php?user=1217karen&file=D01.webp",

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

  testEnemyA: {
    unitData: {
      name: "ボス敵A",
      type: "attack",

      icon: {
        default: "https://www.rabbithutch.site/usagoya/picture.php?user=1217karen&file=D01.webp",
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
      defaultIcon: "https://www.rabbithutch.site/usagoya/picture.php?user=1217karen&file=D01.webp",

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
  }
};
