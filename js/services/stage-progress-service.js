// stage-progress-service.js

const STAGE_PROGRESS_KEY_PREFIX = "stageProgress:";

export const INITIAL_STAGE_RELEASE_FLAGS = {
  debug_open_normal_1_1: true,
  debug_open_tutorial_lessons: false,
  release_boss_01: true,
  release_normal_2: false,
  release_boss_02: false
};

let releaseFlags = { ...INITIAL_STAGE_RELEASE_FLAGS };

function makeStageProgressKey(eno) {
  return `${STAGE_PROGRESS_KEY_PREFIX}${eno}`;
}

function safeParse(json, fallback = null) {
  if (!json) return fallback;

  try {
    return JSON.parse(json);
  } catch {
    return fallback;
  }
}

function normalizeProgress(eno, progress) {
  const clearedStageIds = Array.isArray(progress?.clearedStageIds)
    ? progress.clearedStageIds.filter(stageId => typeof stageId === "string")
    : [];

  return {
    eno,
    clearedStageIds: [...new Set(clearedStageIds)]
  };
}

export function loadStageProgress(eno) {
  if (!eno) {
    return normalizeProgress(eno, null);
  }

  const progress = safeParse(
    localStorage.getItem(makeStageProgressKey(eno)),
    null
  );

  return normalizeProgress(eno, progress);
}

export function saveStageProgress(eno, progress) {
  if (!eno) return;

  localStorage.setItem(
    makeStageProgressKey(eno),
    JSON.stringify(normalizeProgress(eno, progress))
  );
}

export function markStageCleared(eno, stageId) {
  if (!eno || !stageId) return;

  const progress = loadStageProgress(eno);

  if (!progress.clearedStageIds.includes(stageId)) {
    progress.clearedStageIds.push(stageId);
    saveStageProgress(eno, progress);
  }
}

export function resetStageProgress(eno) {
  if (!eno) return;

  saveStageProgress(eno, {
    eno,
    clearedStageIds: []
  });

  releaseFlags = { ...INITIAL_STAGE_RELEASE_FLAGS };
}

export function getStageReleaseFlags() {
  return { ...releaseFlags };
}

export function resetStageReleaseFlags() {
  releaseFlags = { ...INITIAL_STAGE_RELEASE_FLAGS };
}

export function isStageCleared(progress, stageId) {
  return !!stageId && progress?.clearedStageIds?.includes(stageId);
}

export function isUnlockConditionMet(condition, progress, flags = releaseFlags) {
  if (!condition || condition.type === "always") {
    return true;
  }

  if (condition.type === "stageCleared") {
    return isStageCleared(progress, condition.stageId);
  }

  if (condition.type === "releaseFlag") {
    return !!flags?.[condition.flagId];
  }

  if (condition.type === "all") {
    return (condition.conditions || []).every(child =>
      isUnlockConditionMet(child, progress, flags)
    );
  }

  if (condition.type === "any") {
    return (condition.conditions || []).some(child =>
      isUnlockConditionMet(child, progress, flags)
    );
  }

  return false;
}

export function isStageUnlocked(stage, progress, flags = releaseFlags) {
  return isUnlockConditionMet(stage?.unlockCondition, progress, flags);
}
