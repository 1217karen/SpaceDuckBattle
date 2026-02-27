//test-data.js

export function createTestSnapshot() {

  return {
    units: [

      {
        id:"Eno01",
        name:"味方１",
        team:1,
        hp:30,
        atk:5,
        df: 2,
        speed:10,
        x:1,
        y:1,
        facing:"N",
        icon:"https://www.rabbithutch.site/usagoya/picture.php?user=1217karen&file=shima_icon_str_30.webp",
        skills:[
          { type:"heal_cross2" }
        ]
      },

      {
        id:"Eno02",
        name:"味方２",
        team:1,
        hp:10,
        atk:5,
        df: 2,
        speed:9,
        x:5,
        y:2,
        facing:"N",
        icon:"https://www.rabbithutch.site/usagoya/picture.php?user=1217karen&file=D13.webp",
        skills:[
  { type:"buff_self_if_alone" },
  { type:"attack_front1" }
]
      },

      {
        id:"Eno03",
        name:"敵１",
        team:2,
        hp:30,
        atk:5,
        df: 2,
        speed:8,
        x:3,
        y:5,
        facing:"W",
        icon:"https://www.rabbithutch.site/usagoya/picture.php?user=1217karen&file=shima_f_icon3_100.webp",
        skills:[
          { type:"attack_nearest" }
        ]
      }

    ]
  };
}
