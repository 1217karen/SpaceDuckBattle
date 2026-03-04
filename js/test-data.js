// test-data.js

const STAGES = {
  tutorial: {
    width: 4,
    height: 4,
    maxTurns: 20
  },
  normal: {
    width: 8,
    height: 6,
    maxTurns: 50
  }
};

export function createTestSnapshot(stageType = "normal") {

  const stage = STAGES[stageType] ?? STAGES.normal;

  return {
    board: {
      width: stage.width,
      height: stage.height
    },
    maxTurns: stage.maxTurns,

units: [

  {
    id:"Eno1",
    name:"左軍アタック",
    team:1,
    role:"attack",
    hp:120,
    mhp:120,
    atk:8,
    df:3,
    heal:2,
    speed:10,
    x:1,
    y:4,
    facing:"E",
    icon:"https://www.rabbithutch.site/usagoya/picture.php?user=1217karen&file=D06.webp",
    skills:[
      {type:"buff_self_if_alone"},
      {type:"attack_nearest"}
    ]
  },

  {
    id:"Eno2",
    name:"左軍ディフェンス",
    team:1,
    role:"defense",
    hp:150,
    mhp:150,
    atk:6,
    df:6,
    heal:5,
    speed:7,
    x:1,
    y:1,
    facing:"E",
    icon:"https://www.rabbithutch.site/usagoya/picture.php?user=1217karen&file=D08.webp",
    skills:[
      {type:"buff_df50_self"},
      {type:"attack_front_knockback"}
    ]
  },

  {
    id:"Eno3",
    name:"左軍ヒール",
    team:1,
    role:"heal",
    hp:90,
    mhp:90,
    atk:5,
    df:3,
    heal:9,
    speed:9,
    x:0,
    y:5,
    facing:"E",
    icon:"https://www.rabbithutch.site/usagoya/picture.php?user=1217karen&file=D13.webp",
    skills:[
      {type:"heal_cross2"},
      {type:"repair_wave"}
    ]
  },

  {
    id:"Eno4",
    name:"左軍スピード",
    team:1,
    role:"speed",
    hp:100,
    mhp:100,
    atk:7,
    df:2,
    heal:2,
    speed:12,
    x:1,
    y:3,
    facing:"E",
    icon:"https://www.rabbithutch.site/usagoya/picture.php?user=1217karen&file=D21.webp",
    skills:[
      {type:"buff_self_if_alone"},
      {type:"attack_front1"}
    ]
  },

  {
    id:"Eno5",
    name:"左軍テクニカル",
    team:1,
    role:"technical",
    hp:130,
    mhp:130,
    atk:7,
    df:4,
    heal:3,
    speed:8,
    x:1,
    y:0,
    facing:"E",
    icon:"https://www.rabbithutch.site/usagoya/picture.php?user=1217karen&file=D11.webp",
    skills:[
      {type:"attack_around2_all"},
      {type:"attack_random_falloff"}
    ]
  },

  {
    id:"Eno6",
    name:"左軍サポート",
    team:1,
    role:"support",
    hp:110,
    mhp:110,
    atk:7,
    df:4,
    heal:5,
    speed:8,
    x:0,
    y:2,
    facing:"E",
    icon:"https://www.rabbithutch.site/usagoya/picture.php?user=1217karen&file=D01.webp",
    skills:[
      {type:"pull_farthest_enemy"},
      {type:"corrosion_wave"}
    ]
  },

  {
    id:"Nno1",
    name:"右軍アタック",
    team:2,
    role:"attack",
    hp:120,
    mhp:120,
    atk:8,
    df:3,
    heal:2,
    speed:9,
    x:6,
    y:1,
    facing:"W",
    icon:"https://www.rabbithutch.site/usagoya/picture.php?user=1217karen&file=D07.webp",
    skills:[
      {type:"buff_self_if_alone"},
      {type:"attack_nearest"}
    ]
  },

  {
    id:"Nno2",
    name:"右軍ディフェンス",
    team:2,
    role:"defense",
    hp:42,
    mhp:42,
    atk:6,
    df:7,
    heal:5,
    speed:6,
    x:6,
    y:4,
    facing:"W",
    icon:"https://www.rabbithutch.site/usagoya/picture.php?user=1217karen&file=D10.webp",
    skills:[
      {type:"buff_df50_self"},
      {type:"attack_front_knockback"}
    ]
  },

  {
    id:"Nno3",
    name:"右軍ヒール",
    team:2,
    role:"heal",
    hp:26,
    mhp:26,
    atk:5,
    df:3,
    heal:9,
    speed:10,
    x:7,
    y:0,
    facing:"W",
    icon:"https://www.rabbithutch.site/usagoya/picture.php?user=1217karen&file=D05.webp",
    skills:[
      {type:"heal_cross2"},
      {type:"repair_wave"}
    ]
  },

  {
    id:"Nno4",
    name:"右軍スピード",
    team:2,
    role:"speed",
    hp:24,
    mhp:24,
    atk:7,
    df:2,
    heal:2,
    speed:12,
    x:6,
    y:5,
    facing:"W",
    icon:"https://www.rabbithutch.site/usagoya/picture.php?user=1217karen&file=D03.webp",
    skills:[
      {type:"buff_self_if_alone"},
      {type:"attack_front1"}
    ]
  },

  {
    id:"Nno5",
    name:"右軍テクニカル",
    team:2,
    role:"technical",
    hp:31,
    mhp:31,
    atk:7,
    df:4,
    heal:3,
    speed:8,
    x:7,
    y:2,
    facing:"W",
    icon:"https://www.rabbithutch.site/usagoya/picture.php?user=1217karen&file=D04.webp",
    skills:[
      {type:"attack_around2_all"},
      {type:"attack_random_falloff"}
    ]
  },

  {
    id:"Nno6",
    name:"右軍サポート",
    team:2,
    role:"support",
    hp:110,
    mhp:110,
    atk:7,
    df:4,
    heal:5,
    speed:8,
    x:7,
    y:3,
    facing:"W",
    icon:"https://www.rabbithutch.site/usagoya/picture.php?user=1217karen&file=D00.webp",
    skills:[
      {type:"pull_farthest_enemy"},
      {type:"corrosion_wave"}
    ]
  }

]

};
}
