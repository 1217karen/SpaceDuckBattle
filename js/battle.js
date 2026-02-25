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

// 初期状態
const initialState = {
  duck:{x:0,y:2,icon:"🐤"}
};

const battleLog = [
  {type:"move",dx:1,dy:0,text:"アヒルAは右に進んだ"},
  {type:"move",dx:1,dy:0,text:"アヒルAは右に進んだ"},
  {type:"move",dx:1,dy:0,text:"アヒルAは右に進んだ"}
];

let state;
let index=0;

function cloneState(src){
  return JSON.parse(JSON.stringify(src));
}

function render(){
  for(let y=0;y<H;y++){
    for(let x=0;x<W;x++){
      cells[y][x].textContent="";
    }
  }
  cells[state.duck.y][state.duck.x].textContent=state.duck.icon;
}

function addLog(text){
  const p=document.createElement("div");
  p.textContent=text;
  logDiv.appendChild(p);
  logDiv.scrollTop=logDiv.scrollHeight;
}

function applyEvent(ev){
  if(ev.type==="move"){
    const nx=state.duck.x+ev.dx;
    const ny=state.duck.y+ev.dy;

    if(nx>=0 && nx<W && ny>=0 && ny<H){
      state.duck.x=nx;
      state.duck.y=ny;
    }
    addLog(ev.text);
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
