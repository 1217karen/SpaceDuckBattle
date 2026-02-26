export function createTestSnapshot() {

  return {
    units: [

      {
        id:"味方１",
        team:1,
        hp:30,
        atk:5,
        speed:10,
        x:1,
        y:1,
        facing:"N",
        icon:"https://www.rabbithutch.site/usagoya/picture.php?user=1217karen&file=D01.webp",
        skills:[
          { type:"heal_cross2" }
        ]
      },

      {
        id:"味方２",
        team:1,
        hp:10,
        atk:5,
        speed:9,
        x:3,
        y:1,
        facing:"N",
        icon:"https://www.rabbithutch.site/usagoya/picture.php?user=1217karen&file=D01.webp",
        skills:[{type:"attack_front1"}]
      },

      {
        id:"敵１",
        team:2,
        hp:30,
        atk:5,
        speed:8,
        x:2,
        y:2,
        facing:"N",
        icon:"https://www.rabbithutch.site/usagoya/picture.php?user=1217karen&file=D01.webp",
        skills:[
          { type:"attack_nearest" }
        ]
      }

    ]
  };
}
