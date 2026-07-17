// stages.js

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

const BASE_PLACEMENT = {
  allyStartColumns: 2
};

export const STAGES = {
  tutorial_00: {
    id: "tutorial_00",
    category: "tutorial",
    chapter: 0,
    step: 0,
    order: 10,
    name: "チュートリアル",
    description: "自動戦闘の基本的な流れを確認するチュートリアルです。",
    partyMode: "solo",
    unlockCondition: {
      type: "always"
    },
    clearCondition: {
      type: "win"
    },
    board: BOARDS.small,
    placement: {
      allyStartColumns: 1
    },
    maxTurns: 20,
    allyNpcPlacements: [],
    enemyPlacements: [
      {
        npcId: "training_decoy",
        x: 4,
        y: 1,
        facing: "W"
      }
    ],
    randomAllyGroups: [],
    randomEnemyGroups: []
  },

  tutorial_01: makeTutorialStage({
    id: "tutorial_01",
    order: 11,
    step: 1,
    name: "チュートリアル_アタック",
    description: "アタックタイプの動きを確認する訓練です。",
    trainerNpcId: "attack_trainer"
  }),

  tutorial_02: makeTutorialStage({
    id: "tutorial_02",
    order: 12,
    step: 2,
    name: "チュートリアル_ディフェンス",
    description: "ディフェンスタイプの動きを確認する訓練です。",
    trainerNpcId: "defense_trainer"
  }),

  tutorial_03: makeTutorialStage({
    id: "tutorial_03",
    order: 13,
    step: 3,
    name: "チュートリアル_ヒール",
    description: "ヒールタイプの動きを確認する訓練です。",
    trainerNpcId: "heal_trainer"
  }),

  tutorial_04: makeTutorialStage({
    id: "tutorial_04",
    order: 14,
    step: 4,
    name: "チュートリアル_スピード",
    description: "スピードタイプの動きを確認する訓練です。",
    trainerNpcId: "speed_trainer"
  }),

  tutorial_05: makeTutorialStage({
    id: "tutorial_05",
    order: 15,
    step: 5,
    name: "チュートリアル_テクニカル",
    description: "テクニカルタイプの動きを確認する訓練です。",
    trainerNpcId: "technical_trainer"
  }),

  tutorial_06: makeTutorialStage({
    id: "tutorial_06",
    order: 16,
    step: 6,
    name: "チュートリアル_サポート",
    description: "サポートタイプの動きを確認する訓練です。",
    trainerNpcId: "support_trainer"
  }),

  normal_1_1: makeNormalStage({
    id: "normal_1_1",
    order: 101,
    chapter: 1,
    step: 1,
    unlockCondition: {
      type: "any",
      conditions: [
        { type: "stageCleared", stageId: "tutorial_00" },
        { type: "releaseFlag", flagId: "debug_open_normal_1_1" }
      ]
    },
    enemyPlacements: [
      { npcId: "normal_soldier", x: 6, y: 1 },
      { npcId: "normal_guard", x: 5, y: 3 }
    ]
  }),

  normal_1_2: makeNormalStage({
    id: "normal_1_2",
    order: 102,
    chapter: 1,
    step: 2,
    unlockCondition: { type: "stageCleared", stageId: "normal_1_1" },
    enemyPlacements: [
      { npcId: "normal_soldier", x: 6, y: 1 },
      { npcId: "normal_soldier", x: 6, y: 3 },
      { npcId: "normal_medic", x: 5, y: 2 }
    ]
  }),

  normal_1_3: makeNormalStage({
    id: "normal_1_3",
    order: 103,
    chapter: 1,
    step: 3,
    unlockCondition: { type: "stageCleared", stageId: "normal_1_2" },
    enemyPlacements: [
      { npcId: "normal_guard", x: 6, y: 1 },
      { npcId: "normal_soldier", x: 6, y: 3 },
      { npcId: "technical_trainer", x: 5, y: 2 }
    ]
  }),

  normal_1_4: makeNormalStage({
    id: "normal_1_4",
    order: 104,
    chapter: 1,
    step: 4,
    unlockCondition: { type: "stageCleared", stageId: "normal_1_3" },
    enemyPlacements: [
      { npcId: "normal_guard", x: 6, y: 1 },
      { npcId: "normal_medic", x: 5, y: 2 },
      { npcId: "attack_trainer", x: 6, y: 3 }
    ]
  }),

  normal_2_1: makeNormalStage({
    id: "normal_2_1",
    order: 201,
    chapter: 2,
    step: 1,
    unlockCondition: { type: "releaseFlag", flagId: "release_normal_2" },
    enemyPlacements: [
      { npcId: "normal_soldier", x: 6, y: 1 },
      { npcId: "normal_guard", x: 6, y: 3 },
      { npcId: "normal_medic", x: 5, y: 2 }
    ]
  }),

  normal_random_1: makeNormalStage({
    id: "normal_random_1",
    order: 301,
    chapter: 1,
    step: 99,
    name: "ランダム演習",
    description: "複数の候補から敵がランダムに出現する演習です。",
    unlockCondition: { type: "stageCleared", stageId: "normal_1_1" },
    enemyPlacements: [],
    randomEnemyGroups: [
      {
        id: "main",
        npcPool: [
          "normal_soldier",
          "normal_guard",
          "normal_medic",
          "attack_trainer",
          "technical_trainer"
        ],
        count: 4,
        allowDuplicate: true,
        positions: [
          { x: 6, y: 0, facing: "W" },
          { x: 6, y: 1, facing: "W" },
          { x: 6, y: 2, facing: "W" },
          { x: 6, y: 3, facing: "W" }
        ]
      }
    ]
  }),

  boss_01: makeBossStage({
    id: "boss_01",
    order: 1001,
    chapter: 1,
    name: "ボス1",
    description: "大型目標との戦闘です。",
    preBattleStoryId: "boss_01_intro",
    unlockCondition: { type: "releaseFlag", flagId: "release_boss_01" },
    bossNpcId: "boss_01"
  }),

  boss_02: makeBossStage({
    id: "boss_02",
    order: 1002,
    chapter: 2,
    name: "ボス2",
    description: "次段階の大型目標との戦闘です。",
    unlockCondition: { type: "releaseFlag", flagId: "release_boss_02" },
    bossNpcId: "boss_02"
  })
};

function makeTutorialStage({
  id,
  order,
  step,
  name,
  description,
  trainerNpcId
}) {
  return {
    id,
    category: "tutorial",
    chapter: 0,
    step,
    order,
    name,
    description,
    partyMode: "free",
    unlockCondition: {
      type: "any",
      conditions: [
        { type: "stageCleared", stageId: "tutorial_00" },
        { type: "releaseFlag", flagId: "debug_open_tutorial_lessons" }
      ]
    },
    clearCondition: {
      type: "win"
    },
    board: BOARDS.medium,
    placement: BASE_PLACEMENT,
    maxTurns: 20,
    allyNpcPlacements: [],
    enemyPlacements: [
      {
        npcId: trainerNpcId,
        x: 6,
        y: 1,
        facing: "W"
      },
      {
        npcId: trainerNpcId,
        x: 6,
        y: 3,
        facing: "W"
      }
    ],
    randomAllyGroups: [],
    randomEnemyGroups: []
  };
}

function makeNormalStage({
  id,
  order,
  chapter,
  step,
  name = `ノーマル${chapter}-${step}`,
  description = `通常戦闘 ${chapter}-${step} です。`,
  unlockCondition,
  enemyPlacements,
  randomEnemyGroups = []
}) {
  return {
    id,
    category: "normal",
    chapter,
    step,
    order,
    name,
    description,
    partyMode: "free",
    unlockCondition,
    clearCondition: {
      type: "win"
    },
    board: BOARDS.medium,
    placement: BASE_PLACEMENT,
    maxTurns: 20,
    allyNpcPlacements: [],
    enemyPlacements: enemyPlacements.map(entry => ({
      ...entry,
      facing: entry.facing || "W"
    })),
    randomAllyGroups: [],
    randomEnemyGroups
  };
}

function makeBossStage({
  id,
  order,
  chapter,
  name,
  description,
  preBattleStoryId,
  unlockCondition,
  bossNpcId
}) {
  return {
    id,
    category: "boss",
    chapter,
    step: 1,
    order,
    name,
    description,
    preBattleStoryId,
    partyMode: "free",
    unlockCondition,
    clearCondition: {
      type: "win"
    },
    board: BOARDS.large,
    placement: {
      allyStartColumns: 3
    },
    maxTurns: 25,
    allyNpcPlacements: [],
    enemyPlacements: [
      {
        npcId: bossNpcId,
        x: 7,
        y: 2,
        facing: "W",
        displayName: name
      },
      {
        npcId: "training_decoy",
        x: 6,
        y: 1,
        facing: "W"
      },
      {
        npcId: "training_decoy",
        x: 6,
        y: 4,
        facing: "W"
      }
    ],
    randomAllyGroups: [],
    randomEnemyGroups: []
  };
}
