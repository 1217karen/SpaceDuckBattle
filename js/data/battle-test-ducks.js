//battle-test-ducks.js

export const testUnits = [
  {
    name:"アヒル未設定",
    type:"attack",

    icon:{
      default:"",
      N:"",
      E:"",
      S:"",
      W:""
    },

    mhp:1,

    stats:{
      atk:0,
      def:0,
      heal:0,
      speed:0,
      cri:0,
      tec:0
    },

    patterns:[
      {
        name:"",
        public:true,
        skills:[]
      }
    ]
  },

  {
    name: "テストヒーラー",
    type: "heal",

    icon: {
      default: "https://www.rabbithutch.site/usagoya/picture.php?user=1217karen&file=D06.webp",
      N: "",
      E: "",
      S: "",
      W: ""
    },
    defaultCommIconUrl: "https://www.rabbithutch.site/usagoya/picture.php?user=1217karen&file=D06.webp",

    stats:{
      atk:1,
      def:2,
      heal:10,
      speed:5,
      cri:8,
      tec:4
    },

    patterns: [
      {
        name: "基本",
        public: true,
        skills: [
          {
            type: "heal_cross2",
            dialogue: {
              iconUrl: "https://www.rabbithutch.site/usagoya/picture.php?user=1217karen&file=D06.webp",
              text: "回復ライン接続、まとめて立て直します。"
            }
          },
          {
            type: "repair_wave",
            dialogue: {
              iconUrl: "https://www.rabbithutch.site/usagoya/picture.php?user=1217karen&file=D06.webp",
              text: "修復波を展開します、持ちこたえてください。"
            }
          },
          {
            type: "satellite_meteor_field",
            dialogue: {
              iconUrl: "https://placehold.co/60x60?text=HEAL",
              text: "衛星管制リンク確立、迎撃フィールドを起動。"
            }
          }
        ]
      }
    ]
  },

  {
    name:"テストアタッカー",
    type:"attack",

    icon: {
      default: "https://www.rabbithutch.site/usagoya/picture.php?user=1217karen&file=D08.webp",
      N: "",
      E: "",
      S: "",
      W: ""
    },
    defaultCommIconUrl: "https://www.rabbithutch.site/usagoya/picture.php?user=1217karen&file=D08.webp",

    stats:{
      atk:10,
      def:3,
      heal:1,
      speed:6,
      cri:5,
      tec:5
    },

    patterns:[
      {
        name:"基本",
        public:true,
        skills:[
          "attack_front1",
          "attack_front_knockback",
          "attack_around2_all"
        ]
      }
    ]
  },

  {
    name:"テストサポーター",
    type:"support",

    icon: {
      default: "https://www.rabbithutch.site/usagoya/picture.php?user=1217karen&file=D13.webp",
      N: "",
      E: "",
      S: "",
      W: ""
    },
    defaultCommIconUrl: "https://www.rabbithutch.site/usagoya/picture.php?user=1217karen&file=D13.webp",

    stats:{
      atk:4,
      def:3,
      heal:2,
      speed:15,
      cri:4,
      tec:10
    },

    patterns:[
      {
        name:"基本",
        public:true,
        skills:[
          "debuff_wave",
          "buff_wave",
          "pull_farthest_enemy"
        ]
      }
    ]
  }
];
