//stages.js

import { ENEMIES } from "./enemies.js";

function makeEnemy(base, extra) {
  return {
    ...structuredClone(base),
    ...extra
  };
}

const BOARDS = {
small: {
width: 5,
height: 4
},
medium: {
width: 7,
height: 5
},
large: {
width: 8,
height: 6
}
};

export const STAGES = {

tutorial: {
board: BOARDS.small,
maxTurns: 20,
enemies: [
makeEnemy(ENEMIES.tutorialEnemyA, {
id: "T1",
name: "チュートリアル敵A",
x: 4,
y: 1
})
]
},

normal: {
board: BOARDS.medium,
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

boss: {
board: BOARDS.large,
maxTurns: 20,
enemies: [
makeEnemy(ENEMIES.testEnemyA, {
id: "B1",
name: "ボス敵A",
x: 7,
y: 2
})
]
}

};
