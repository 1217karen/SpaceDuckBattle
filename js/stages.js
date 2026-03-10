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
df:2,
heal:0,
speed:6,
cri:5,
int:3,
x:3,
y:1,
facing:"W",
icon:"https://www.rabbithutch.site/usagoya/picture.php?user=1217karen&file=D06.webp",
skills:[
{type:"attack_nearest"}
]
},

{
id:"T2",
name:"チュートリアル敵B",
team:2,
role:"defense",
hp:100,
mhp:100,
atk:5,
df:5,
heal:0,
speed:4,
cri:3,
int:3,
x:3,
y:2,
facing:"W",
icon:"https://www.rabbithutch.site/usagoya/picture.php?user=1217karen&file=D08.webp",
skills:[
{type:"attack_front1"}
]
}

]

}

};
