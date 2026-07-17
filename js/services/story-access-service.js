// story-access-service.js

import { STAGES } from "../data/stages.js";
import {
  getStageReleaseFlags,
  isStageUnlocked,
  loadStageProgress
} from "./stage-progress-service.js";

export function isStoryAccessConditionMet(condition, eno) {
  if (!condition || condition.type === "always") {
    return true;
  }

  if (!eno) {
    return false;
  }

  const stageProgress = loadStageProgress(eno);
  const flags = getStageReleaseFlags();

  if (condition.type === "stageUnlocked") {
    const stage = STAGES[condition.stageId];
    return !!stage && isStageUnlocked(stage, stageProgress, flags);
  }

  if (condition.type === "stageCleared") {
    return stageProgress.clearedStageIds.includes(condition.stageId);
  }

  if (condition.type === "all") {
    return (condition.conditions || []).every(child =>
      isStoryAccessConditionMet(child, eno)
    );
  }

  if (condition.type === "any") {
    return (condition.conditions || []).some(child =>
      isStoryAccessConditionMet(child, eno)
    );
  }

  return false;
}

export function canAccessStory(story, eno) {
  return !!story && !!eno &&
    isStoryAccessConditionMet(story.accessCondition, eno);
}
