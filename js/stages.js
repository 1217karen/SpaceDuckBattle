//stages.js

import { ENEMIES } from "./battle-enemies.js";
import { NPCS } from "./battle-npcs.js";

function makeStageUnit(base, extra) {
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

    npcs: [
      makeStageUnit(NPCS.npcHealer, {
        id: "P1",
        team: 1,
        x: 0,
        y: 1,
        facing: "E"
      })
    ],

    enemies: [
      makeStageUnit(ENEMIES.tutorialEnemyA, {
        id: "T1",
        team: 2,
        x: 4,
        y: 1,
        facing: "W"
      })
    ]
  },

  normal: {
    board: BOARDS.medium,

    placement: {
      allyStartColumns: 2
    },

    maxTurns: 20,

    npcs: [
      makeStageUnit(NPCS.npcHealer, {
        id: "P1",
        team: 1,
        x: 0,
        y: 1,
        facing: "E"
      }),
      makeStageUnit(NPCS.npcSupporter, {
        id: "P2",
        team: 1,
        x: 1,
        y: 3,
        facing: "E"
      })
    ],

    enemies: [
      makeStageUnit(ENEMIES.normalEnemyA, {
        id: "N1",
        team: 2,
        x: 6,
        y: 2,
        facing: "W"
      })
    ]
  },

  boss: {
    board: BOARDS.large,

    placement: {
      allyStartColumns: 3
    },

    maxTurns: 20,

    npcs: [
      makeStageUnit(NPCS.npcHealer, {
        id: "P1",
        team: 1,
        x: 0,
        y: 1,
        facing: "E"
      }),
      makeStageUnit(NPCS.npcAttacker, {
        id: "P2",
        team: 1,
        x: 1,
        y: 2,
        facing: "E"
      }),
      makeStageUnit(NPCS.npcSupporter, {
        id: "P3",
        team: 1,
        x: 0,
        y: 4,
        facing: "E"
      })
    ],

    enemies: [
      makeStageUnit(ENEMIES.testEnemyA, {
        id: "B1",
        team: 2,
        x: 7,
        y: 2,
        facing: "W"
      })
    ]
  }

};
