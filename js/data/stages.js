// stages.js

import { NPCS } from "./battle-npcs.js";

function makeStageNpc(npcKey, extra) {
  return {
    npcKey,
    ...structuredClone(NPCS[npcKey]),
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

const BASE_PLACEMENT = {
  allyStartColumns: 2
};

function fixedNpcPlacements(placements) {
  return placements.map(({ npcKey, ...extra }) =>
    makeStageNpc(npcKey, extra)
  );
}

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

    npcs: [],
    enemies: fixedNpcPlacements([
      {
        npcKey: "trainingDecoy",
        id: "T0D1",
        team: 2,
        x: 4,
        y: 1,
        facing: "W",
        displayName: "訓練用デコイ"
      }
    ]),
    randomNpcPlacements: []
  },

  tutorial_01: makeTutorialStage({
    id: "tutorial_01",
    order: 11,
    step: 1,
    name: "チュートリアル_アタック",
    description: "アタックタイプの動きを確認する訓練です。",
    trainerNpcKey: "attackTrainer",
    trainerName: "アタック訓練兵"
  }),

  tutorial_02: makeTutorialStage({
    id: "tutorial_02",
    order: 12,
    step: 2,
    name: "チュートリアル_ディフェンス",
    description: "ディフェンスタイプの動きを確認する訓練です。",
    trainerNpcKey: "defenseTrainer",
    trainerName: "ディフェンス訓練兵"
  }),

  tutorial_03: makeTutorialStage({
    id: "tutorial_03",
    order: 13,
    step: 3,
    name: "チュートリアル_ヒール",
    description: "ヒールタイプの動きを確認する訓練です。",
    trainerNpcKey: "healTrainer",
    trainerName: "ヒール訓練兵"
  }),

  tutorial_04: makeTutorialStage({
    id: "tutorial_04",
    order: 14,
    step: 4,
    name: "チュートリアル_スピード",
    description: "スピードタイプの動きを確認する訓練です。",
    trainerNpcKey: "speedTrainer",
    trainerName: "スピード訓練兵"
  }),

  tutorial_05: makeTutorialStage({
    id: "tutorial_05",
    order: 15,
    step: 5,
    name: "チュートリアル_テクニカル",
    description: "テクニカルタイプの動きを確認する訓練です。",
    trainerNpcKey: "technicalTrainer",
    trainerName: "テクニカル訓練兵"
  }),

  tutorial_06: makeTutorialStage({
    id: "tutorial_06",
    order: 16,
    step: 6,
    name: "チュートリアル_サポート",
    description: "サポートタイプの動きを確認する訓練です。",
    trainerNpcKey: "supportTrainer",
    trainerName: "サポート訓練兵"
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
    enemies: [
      { npcKey: "normalSoldier", id: "N111", x: 6, y: 1, displayName: "一般兵A" },
      { npcKey: "normalGuard", id: "N112", x: 5, y: 3, displayName: "防衛兵A" }
    ]
  }),

  normal_1_2: makeNormalStage({
    id: "normal_1_2",
    order: 102,
    chapter: 1,
    step: 2,
    unlockCondition: { type: "stageCleared", stageId: "normal_1_1" },
    enemies: [
      { npcKey: "normalSoldier", id: "N121", x: 6, y: 1, displayName: "一般兵A" },
      { npcKey: "normalSoldier", id: "N122", x: 6, y: 3, displayName: "一般兵B" },
      { npcKey: "normalMedic", id: "N123", x: 5, y: 2, displayName: "衛生兵A" }
    ]
  }),

  normal_1_3: makeNormalStage({
    id: "normal_1_3",
    order: 103,
    chapter: 1,
    step: 3,
    unlockCondition: { type: "stageCleared", stageId: "normal_1_2" },
    enemies: [
      { npcKey: "normalGuard", id: "N131", x: 6, y: 1, displayName: "防衛兵A" },
      { npcKey: "normalSoldier", id: "N132", x: 6, y: 3, displayName: "一般兵A" },
      { npcKey: "technicalTrainer", id: "N133", x: 5, y: 2, displayName: "テクニカル訓練兵A" }
    ]
  }),

  normal_1_4: makeNormalStage({
    id: "normal_1_4",
    order: 104,
    chapter: 1,
    step: 4,
    unlockCondition: { type: "stageCleared", stageId: "normal_1_3" },
    enemies: [
      { npcKey: "normalGuard", id: "N141", x: 6, y: 1, displayName: "防衛兵A" },
      { npcKey: "normalMedic", id: "N142", x: 5, y: 2, displayName: "衛生兵A" },
      { npcKey: "attackTrainer", id: "N143", x: 6, y: 3, displayName: "アタック訓練兵A" }
    ]
  }),

  normal_2_1: makeNormalStage({
    id: "normal_2_1",
    order: 201,
    chapter: 2,
    step: 1,
    unlockCondition: { type: "releaseFlag", flagId: "release_normal_2" },
    enemies: [
      { npcKey: "normalSoldier", id: "N211", x: 6, y: 1, displayName: "一般兵A" },
      { npcKey: "normalGuard", id: "N212", x: 6, y: 3, displayName: "防衛兵A" },
      { npcKey: "normalMedic", id: "N213", x: 5, y: 2, displayName: "衛生兵A" }
    ]
  }),

  boss_01: makeBossStage({
    id: "boss_01",
    order: 1001,
    chapter: 1,
    name: "ボス1",
    description: "大型目標との戦闘です。",
    unlockCondition: { type: "releaseFlag", flagId: "release_boss_01" },
    bossNpcKey: "boss01",
    bossId: "B101"
  }),

  boss_02: makeBossStage({
    id: "boss_02",
    order: 1002,
    chapter: 2,
    name: "ボス2",
    description: "次段階の大型目標との戦闘です。",
    unlockCondition: { type: "releaseFlag", flagId: "release_boss_02" },
    bossNpcKey: "boss02",
    bossId: "B201"
  })
};

function makeTutorialStage({
  id,
  order,
  step,
  name,
  description,
  trainerNpcKey,
  trainerName
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
    npcs: [],
    enemies: fixedNpcPlacements([
      {
        npcKey: trainerNpcKey,
        id: `${id}_TRAINER`,
        team: 2,
        x: 6,
        y: 1,
        facing: "W",
        displayName: trainerName
      },
      {
        npcKey: "trainingDecoy",
        id: `${id}_DECOY`,
        team: 2,
        x: 6,
        y: 3,
        facing: "W",
        displayName: "訓練用デコイ"
      }
    ]),
    randomNpcPlacements: []
  };
}

function makeNormalStage({ id, order, chapter, step, unlockCondition, enemies }) {
  return {
    id,
    category: "normal",
    chapter,
    step,
    order,
    name: `ノーマル${chapter}-${step}`,
    description: `通常戦闘 ${chapter}-${step} です。`,
    partyMode: "free",
    unlockCondition,
    clearCondition: {
      type: "win"
    },
    board: BOARDS.medium,
    placement: BASE_PLACEMENT,
    maxTurns: 20,
    npcs: [],
    enemies: fixedNpcPlacements(
      enemies.map(enemy => ({
        ...enemy,
        team: 2,
        facing: "W"
      }))
    ),
    randomNpcPlacements: []
  };
}

function makeBossStage({
  id,
  order,
  chapter,
  name,
  description,
  unlockCondition,
  bossNpcKey,
  bossId
}) {
  return {
    id,
    category: "boss",
    chapter,
    step: 1,
    order,
    name,
    description,
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
    npcs: [],
    enemies: fixedNpcPlacements([
      {
        npcKey: bossNpcKey,
        id: bossId,
        team: 2,
        x: 7,
        y: 2,
        facing: "W",
        displayName: name
      },
      {
        npcKey: "trainingDecoy",
        id: `${id}_DECOY_A`,
        team: 2,
        x: 6,
        y: 1,
        facing: "W",
        displayName: "訓練用デコイA"
      },
      {
        npcKey: "trainingDecoy",
        id: `${id}_DECOY_B`,
        team: 2,
        x: 6,
        y: 4,
        facing: "W",
        displayName: "訓練用デコイB"
      }
    ]),
    randomNpcPlacements: []
  };
}
