//enemies.js

export const ENEMIES = {

tutorialEnemyA: {
name: "チュートリアル敵A",
team: 2,
role: "attack",
hp: 80,
mhp: 80,
atk: 6,
def: 2,
heal: 0,
speed: 6,
cri: 5,
tec: 3,
facing: "W",
icon: "https://www.rabbithutch.site/usagoya/picture.php?user=1217karen&file=D01.webp",
commDialogues: {
battleStart: [
{ text: "（黒いアヒルが並んでいる……）" }
],
turnChangeNeutral: [
{ text: "「…………。」" }
],
turnChangeAdvantage: [
{ text: "「…………。」" }
],
turnChangeDisadvantage: [
{ text: "「…………。」" }
],
turnChangePinch: [
{ text: "「…………。」" }
],
critical: [
{ text: "" }
],
kill: [
{ text: "「…………。」" }
],
battleEndWin: [
{ text: "「…………。」" }
]
},

skills: [
{
type: "attack_front1",
dialogue: [
{ text: "（勢いよく突進してきた）" }
]
}
]
},

normalEnemyA: {
name: "通常敵A",
team: 2,
role: "attack",
hp: 80,
mhp: 80,
atk: 10,
def: 2,
heal: 0,
speed: 6,
cri: 5,
tec: 3,
facing: "W",
icon: "https://www.rabbithutch.site/usagoya/picture.php?user=1217karen&file=D01.webp",
skills: [
{ type: "attack_front1" }
]
},

testEnemyA: {
name: "ボス敵A",
team: 2,
role: "attack",
hp: 80,
mhp: 100,
atk: 30,
def: 15,
heal: 0,
speed: 20,
cri: 20,
tec: 15,
facing: "W",
icon: "https://www.rabbithutch.site/usagoya/picture.php?user=1217karen&file=D01.webp",
skills: [
{ type: "attack_front1" }
]
}

};
