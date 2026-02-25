const W = 5;
const H = 5;

const board = document.getElementById("board");
const logDiv = document.getElementById("log");

const cells = [];

// 盤面生成
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

// 初期状態（向きdirも入れておく）
const initialState = {
  units: {
    A:{ id:"A", x:0, y:2, hp:10, dir:"right", icon:"🐤" },
    B:{ id:"B", x:3, y:2, hp:10, dir:"left", icon:"🐥" }
  }
};

// ログ（仮：Aが突っ込む）
const battleLog = [
  {type:"move", unit:"A", dx:1, dy:0, text:"アヒルAは前進した"},
  {type:"move", unit:"A", dx:1, dy:0, text:"アヒルAは前進した"},
  {type:"move", unit:"A", dx:1, dy:0, text:"アヒルAは前進した"},
];

let state;
let index=0;

function cloneState(src){
  return JSON.parse(JSON.stringify(src));
}

function render(){

  // 全消し
  for(let y=0;y<H;y++){
    for(let x=0;x<W;x++){
      cells[y][x].textContent="";
    }
  }

  // 全ユニット描画
  for(const id in state.units){
    const u = state.units[id];
    if(u.hp <= 0) continue;
    cells[u.y][u.x].textContent = u.icon;
  }
}

function addLog(text){
  const p=document.createElement("div");
  p.textContent=text;
  logDiv.appendChild(p);
  logDiv.scrollTop=logDiv.scrollHeight;
}

function getUnitAt(x,y){
  for(const id in state.units){
    const u = state.units[id];
    if(u.hp>0 && u.x===x && u.y===y){
      return u;
    }
  }
  return null;
}

function applyEvent(ev){

  if(ev.type==="move"){

    const u = state.units[ev.unit];
    const nx = u.x + ev.dx;
    const ny = u.y + ev.dy;

    if(nx<0||nx>=W||ny<0||ny>=H){
      addLog("壁にぶつかった");
      return;
    }

    const target = getUnitAt(nx,ny);

    // ベイブレード式：ぶつかったら攻撃
    if(target){
      addLog(`${u.id}は${target.id}にぶつかった！`);
      applyEvent({
        type:"attack",
        attacker:u.id,
        defender:target.id
      });
      return;
    }

    u.x = nx;
    u.y = ny;
    addLog(ev.text);
  }

  if(ev.type==="attack"){
    addLog(`${ev.attacker}の攻撃！`);

    applyEvent({
      type:"damage",
      target:ev.defender,
      value:3
    });
  }

  if(ev.type==="damage"){
    const t = state.units[ev.target];
    t.hp -= ev.value;
    addLog(`${t.id}に${ev.value}ダメージ（HP:${t.hp}）`);

    if(t.hp<=0){
      applyEvent({
        type:"death",
        target:t.id
      });
    }
  }

  if(ev.type==="death"){
    addLog(`${ev.target}は倒れた`);
  }
}

function reset(){
  state=cloneState(initialState);
  index=0;
  logDiv.innerHTML="";
  render();
}

document.getElementById("stepBtn").onclick=()=>{
  if(index>=battleLog.length) return;
  applyEvent(battleLog[index]);
  index++;
  render();
};

document.getElementById("resetBtn").onclick=reset;

reset();
