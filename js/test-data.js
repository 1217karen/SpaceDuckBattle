export function createTestSnapshot() {

  const roles = ["attack","defense","heal","speed","technical"];

  const leftIcons = [
    "D06.webp",
    "D08.webp",
    "D13.webp",
    "D21.webp",
    "D11.webp"
  ];

  const rightIcons = [
    "D07.webp",
    "D10.webp",
    "D05.webp",
    "D03.webp",
    "D04.webp"
  ];

  function shuffle(array){
    const a = [...array];
    for(let i = a.length-1;i>0;i--){
      const j = Math.floor(Math.random()*(i+1));
      [a[i],a[j]]=[a[j],a[i]];
    }
    return a;
  }

  const leftY = [0,1,2,3,4];
  let rightY = shuffle(leftY);

  while(rightY.some((y,i)=>y===leftY[i])){
    rightY = shuffle(leftY);
  }

  const units = [];

  for(let i=0;i<5;i++){

    units.push({
      id:`Eno${i+1}`,
      name:`左軍${i+1}`,
      team:1,
      role:roles[i],
      hp:30,
      mhp:30,
      atk:7,
      df:3,
      speed:9,
      x:Math.floor(Math.random()*2), //0 or 1
      y:leftY[i],
      facing:"E",
      icon:`https://www.rabbithutch.site/usagoya/picture.php?user=1217karen&file=${leftIcons[i]}`,
      skills:[]
    });

    units.push({
      id:`Nno${i+1}`,
      name:`右軍${i+1}`,
      team:2,
      role:roles[i],
      hp:30,
      mhp:30,
      atk:7,
      df:3,
      speed:9,
      x:8 + Math.floor(Math.random()*2), //8 or 9
      y:rightY[i],
      facing:"W",
      icon:`https://www.rabbithutch.site/usagoya/picture.php?user=1217karen&file=${rightIcons[i]}`,
      skills:[]
    });

  }

  return { units };

}
