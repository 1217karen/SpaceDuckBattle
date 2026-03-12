//setting-controller.js

import { skillHandlers } from "./skills.js";


let currentSlot = 0;

const patterns = [
  { name:"", public:true, skills:["","","","","",""] },
  { name:"", public:false, skills:["","","","","",""] },
  { name:"", public:false, skills:["","","","","",""] }
];

const tabs = document.querySelectorAll(".patternTab");

tabs.forEach(tab => {

  tab.addEventListener("click", () => {

    saveCurrentPattern();

    currentSlot = Number(tab.dataset.slot);

    loadPattern(currentSlot);

  });

});

function loadPattern(slot){

  const p = patterns[slot];

  document.getElementById("patternName").value = p.name;

  const publicCheck =
    document.getElementById("patternPublic");

  publicCheck.checked = p.public;

  if(slot === 0){
    publicCheck.disabled = true;
  }else{
    publicCheck.disabled = false;
  }

  const selects =
    document.querySelectorAll(".skillSelect");

  selects.forEach((s,i)=>{
    s.value = p.skills[i] ?? "";
  });

}

function saveCurrentPattern(){

  const p = patterns[currentSlot];

  p.name =
    document.getElementById("patternName").value;

  p.public =
    document.getElementById("patternPublic").checked;

  const selects =
    document.querySelectorAll(".skillSelect");

  p.skills = [...selects].map(s => s.value);

}

const skillList = Object.keys(skillHandlers);

const selects =
  document.querySelectorAll(".skillSelect");

for (const select of selects) {

  for (const skillId of skillList) {

    const option =
      document.createElement("option");

    option.value = skillId;
    option.textContent = skillId;

    select.appendChild(option);
  }
}

loadDuck();

function loadDuck(){

  const data =
    localStorage.getItem("duck");

  if (!data) return;

  const duck =
    JSON.parse(data);

  if (duck.patterns) {

  for (let i = 0; i < 3; i++) {

    if (duck.patterns[i]) {
      patterns[i] = duck.patterns[i];
    }

  }

}

  document.getElementById("duckName").value =
    duck.name ?? "";

  document.getElementById("duckType").value =
    duck.type ?? "attack";

  document.getElementById("iconMain").value =
    duck.icon?.main ?? "";

  document.getElementById("iconN").value =
    duck.icon?.N ?? "";

  document.getElementById("iconE").value =
    duck.icon?.E ?? "";

  document.getElementById("iconS").value =
    duck.icon?.S ?? "";

  document.getElementById("iconW").value =
    duck.icon?.W ?? "";

  document.getElementById("statAT").value =
    duck.stats?.atk ?? 0;

  document.getElementById("statDF").value =
    duck.stats?.df ?? 0;

  document.getElementById("statHEAL").value =
    duck.stats?.heal ?? 0;

  document.getElementById("statSPEED").value =
    duck.stats?.speed ?? 0;

  document.getElementById("statCRI").value =
    duck.stats?.cri ?? 0;

  document.getElementById("statINT").value =
    duck.stats?.int ?? 0;
  
  loadPattern(currentSlot);
}



const saveBtn =
  document.getElementById("saveDuck");

saveBtn.addEventListener("click", () => {
  
saveCurrentPattern();
  
  const name =
    document.getElementById("duckName").value;

  const type =
    document.getElementById("duckType").value;

  const icon = {
    main: document.getElementById("iconMain").value,
    N: document.getElementById("iconN").value,
    E: document.getElementById("iconE").value,
    S: document.getElementById("iconS").value,
    W: document.getElementById("iconW").value
  };

  const stats = {
    atk: Number(document.getElementById("statAT").value),
    df: Number(document.getElementById("statDF").value),
    heal: Number(document.getElementById("statHEAL").value),
    speed: Number(document.getElementById("statSPEED").value),
    cri: Number(document.getElementById("statCRI").value),
    tec: Number(document.getElementById("statTEC").value)
  };

  const mhp =
    100 +
    stats.atk * 2 +
    stats.df * 3 +
    stats.heal * 2;



const duck = {

  id: "player_duck",

  name,
  type,

  icon,

  stats,

  mhp,

  patterns

};

  localStorage.setItem(
    "duck",
    JSON.stringify(duck)
  );
  
  alert("アヒル設定を保存しました");

});

loadPattern(currentSlot);
