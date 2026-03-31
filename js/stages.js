//stages.js

import { ENEMIES } from "./battle-enemies.js";

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

placement: {
allyStartColumns: 2
},

maxTurns: 20,

enemies: [
makeEnemy(ENEMIES.tutorialEnemyA, {
id: "T1",
x: 4,
y: 1
})
]
},

normal: {
board: BOARDS.medium,

placement: {
allyStartColumns: 2
},

maxTurns: 20,

enemies: [
makeEnemy(ENEMIES.normalEnemyA, {
id: "N1",
x: 6,
y: 2
})
]
},

boss: {
board: BOARDS.large,

placement: {
allyStartColumns: 3
},

maxTurns: 20,

enemies: [
makeEnemy(ENEMIES.testEnemyA, {
id: "B1",
x: 7,
y: 2
})
]
}

};
