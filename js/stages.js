//stages.js

export const STAGES = {

tutorial:{

board:{
width:4,
height:4
},

maxTurns:20,

enemies:[

{
id:"T1",
name:"チュートリアル敵A",
team:2,
role:"attack",
hp:80,
mhp:80,
atk:6,
def:2,
heal:0,
speed:6,
cri:5,
tec:3,
x:3,
y:1,
facing:"W",
icon:"https://www.rabbithutch.site/usagoya/picture.php?user=1217karen&file=D01.webp",
skills:[
{type:"attack_front1"}
]
},

]

},

normal:{

board:{
width:7,
height:5
},

maxTurns:20,

enemies:[

{
id:"N1",
name:"通常敵A",
team:2,
role:"attack",
hp:80,
mhp:80,
atk:6,
def:2,
heal:0,
speed:6,
cri:5,
tec:3,
x:6,
y:2,
facing:"W",
icon:"https://www.rabbithutch.site/usagoya/picture.php?user=1217karen&file=D01.webp",
skills:[
{type:"attack_front1"}
]
},

]

},

test_9x7:{

board:{
width:9,
height:7
},

maxTurns:20,

enemies:[

{
id:"T1",
name:"テスト敵A",
team:2,
role:"attack",
hp:80,
mhp:80,
atk:6,
def:2,
heal:0,
speed:6,
cri:5,
tec:3,
x:8,
y:3,
facing:"W",
icon:"https://www.rabbithutch.site/usagoya/picture.php?user=1217karen&file=D01.webp",
skills:[
{type:"attack_front1"}
]
},

]

}

};
