const W = 5;
const H = 5;

/*
========================
戦闘開始状態（snapshot）
========================
*/

const snapshot = {
  units: [
    {id:"A", team:"player", x:0, y:2, hp:10, speed:10},
    {id:"B", team:"enemy", x:3, y:2, hp:10, speed:8}
  ]
};


/*
========================
戦闘エンジン
========================
*/

function simulate(snapshot){

  // 深いコピー（元データを壊さない）
  const state = JSON.parse(JSON.stringify(snapshot));

  const log = [];

  // 行動順（speed順）
  const order = [...state.units].sort((a,b)=>b.speed-a.speed);

  function distance(a,b){
    return Math.abs(a.x-b.x) + Math.abs(a.y-b.y);
  }

  function getEnemy(unit){
    return state.units.find(u=>u.team!==unit.team && u.hp>0);
  }

  function isAdjacent(a,b){
    return distance(a,b)===1;
  }

  function moveToward(a,b){

    if(a.x < b.x) a.x++;
    else if(a.x > b.x) a.x--;
    else if(a.y < b.y) a.y++;
    else if(a.y > b.y) a.y--;

    log.push({
      type:"move",
      unit:a.id,
      x:a.x,
      y:a.y
    });
  }

  function attack(a,b){

    log.push({
      type:"attack",
      attacker:a.id,
      target:b.id
    });

    b.hp -= 3;

    log.push({
      type:"damage",
      target:b.id,
      value:3,
      hp:b.hp
    });

    if(b.hp<=0){
      log.push({
        type:"death",
        target:b.id
      });
    }
  }

  // 最大5ターン
  for(let turn=0; turn<5; turn++){

    for(const unit of order){

      if(unit.hp<=0) continue;

      const enemy = getEnemy(unit);

      if(!enemy) return log;

      if(isAdjacent(unit,enemy)){
        attack(unit,enemy);
      }else{
        moveToward(unit,enemy);
      }
    }
  }

  return log;
}


/*
========================
ここで戦闘実行
========================
*/

const battleLog = simulate(snapshot);

console.log(battleLog);
/*
========================
UI再生部分（表示）
========================
*/

const board = document.getElementById("board");
const logDiv = document.getElementById("log");

const cells = [];
const units = {};

// 盤面作成
for(let y=0;y<H;y++){
  const row=[];
  for(let x=0;x<W;x++){
    const c=document.createElement("div");
    c.className="cell";
    board.appendChild(c);
    row.push(c);
  }
  cells.push(row);
}

// 初期ユニット配置（snapshotから）
for(const u of snapshot.units){
  units[u.id] = { ...u };
}

function render(){

  for(let y=0;y<H;y++){
    for(let x=0;x<W;x++){
      cells[y][x].textContent="";
    }
  }

  for(const id in units){
    const u = units[id];
    if(u.hp<=0) continue;
    cells[u.y][u.x].textContent = "🐤";
  }
}

function addLog(text){
  const p=document.createElement("div");
  p.textContent=text;
  logDiv.appendChild(p);
}

let playIndex = 0;

function playStep(){

  if(playIndex >= battleLog.length) return;

  const ev = battleLog[playIndex];
  playIndex++;

  if(ev.type==="move"){
    units[ev.unit].x = ev.x;
    units[ev.unit].y = ev.y;
    addLog(`${ev.unit} が移動`);
  }

  if(ev.type==="attack"){
    addLog(`${ev.attacker} の攻撃`);
  }

  if(ev.type==="damage"){
    units[ev.target].hp = ev.hp;
    addLog(`${ev.target} に ${ev.value} ダメージ`);
  }

  if(ev.type==="death"){
    addLog(`${ev.target} が倒れた`);
  }

  render();
}

document.getElementById("stepBtn").onclick = playStep;

render();
