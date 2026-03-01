//test-data.js

export function createTestSnapshot() {

  return {
    units: [

      {
        id:"Eno01",
        name:"味方１",
        team:1,
        role:"heal",
        hp:10,
        atk:5,
        df: 2,
        speed:10,
        x:3,
        y:3,
        facing:"N",
        icon:"https://www.rabbithutch.site/usagoya/picture.php?user=1217karen&file=shima_icon_str_30.webp",
        skills:[{type:"buff_df50_self"}]
      },

      {
        id:"Eno02",
        name:"味方２",
        team:1,
        role:"defense",
        hp:20,
        atk:5,
        df: 2,
        speed:9,
        x:3,
        y:4,
        facing:"N",
        icon:"https://www.rabbithutch.site/usagoya/picture.php?user=1217karen&file=D13.webp",
        skills:[]
      },

      {
        id:"Eno03",
        name:"敵１",
        team:2,
        role:"attack",
        hp:30,
        atk:5,
        df: 2,
        speed:8,
        x:3,
        y:1,
        facing:"W",
        icon:"https://www.rabbithutch.site/usagoya/picture.php?user=1217karen&file=shima_f_icon3_100.webp",
        skills:[{type:"buff_self_if_alone"}]
      }

    ]
  };
}
