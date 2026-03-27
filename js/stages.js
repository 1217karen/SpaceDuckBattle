//stages.js

import { ENEMIES } from "./enemies.js";

function makeEnemy(base, extra) {
  return {
    ...structuredClone(base),
    ...extra
  };
}

export const STAGES = {

tutorial: {

board: {
width: 4,
height: 4
},

maxTurns: 20,

enemies: [
makeEnemy(ENEMIES.tutorialEnemyA, {
id: "T1",
name: "チュートリアル敵A",
x: 3,
y: 1
})
]

},

normal: {

board: {
width: 7,
height: 5
},

maxTurns: 20,

enemies: [
makeEnemy(ENEMIES.normalEnemyA, {
id: "N1",
name: "通常敵A",
x: 6,
y: 2
})
]

},

test_9x7: {

board: {
width: 9,
height: 7
},

maxTurns: 20,

enemies: [
makeEnemy(ENEMIES.testEnemyA, {
id: "T1",
name: "テスト敵A",
x: 8,
y: 3
})
]

}

};
