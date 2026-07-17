// story-progress-service.js

const STORY_PROGRESS_KEY_PREFIX = "storyProgress:";

function makeStoryProgressKey(eno) {
  return `${STORY_PROGRESS_KEY_PREFIX}${eno}`;
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
  const readStoryIds = Array.isArray(progress?.readStoryIds)
    ? progress.readStoryIds.filter(storyId => typeof storyId === "string")
    : [];

  return {
    eno,
    readStoryIds: [...new Set(readStoryIds)]
  };
}

export function loadStoryProgress(eno) {
  if (!eno) {
    return normalizeProgress(eno, null);
  }

  const progress = safeParse(
    localStorage.getItem(makeStoryProgressKey(eno)),
    null
  );

  return normalizeProgress(eno, progress);
}

export function saveStoryProgress(eno, progress) {
  if (!eno) return;

  localStorage.setItem(
    makeStoryProgressKey(eno),
    JSON.stringify(normalizeProgress(eno, progress))
  );
}

export function isStoryRead(progress, storyId) {
  return !!storyId && progress?.readStoryIds?.includes(storyId);
}

export function markStoryRead(eno, storyId) {
  if (!eno || !storyId) return;

  const progress = loadStoryProgress(eno);

  if (!progress.readStoryIds.includes(storyId)) {
    progress.readStoryIds.push(storyId);
    saveStoryProgress(eno, progress);
  }
}
