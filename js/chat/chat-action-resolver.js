// chat-action-resolver.js

import { places } from "../data/places-data.js";
import { chatActionDefinitions } from "./chat-action-data.js";

function getActionIdsFromPlace(place) {
  return Array.isArray(place?.actionIds)
    ? place.actionIds.filter(actionId =>
        typeof actionId === "string" &&
        actionId.trim() !== ""
      )
    : [];
}

function getMainPlaceInSameGroup(place) {
  if (!place?.groupId || !place?.kind) {
    return null;
  }

  return places.find(item =>
    item.groupId === place.groupId &&
    item.kind === place.kind &&
    item.layer === "main"
  ) || null;
}

function hasRequiredEnvironmentTags(action, place) {
  const requiredTags = Array.isArray(action?.requiredEnvironmentTags)
    ? action.requiredEnvironmentTags
    : [];
  const environmentTags = new Set(
    Array.isArray(place?.environmentTags) ? place.environmentTags : []
  );

  return requiredTags.every(tagId => environmentTags.has(tagId));
}

export function getAvailableChatActions({
  place,
  character
} = {}) {
  if (!place || !character) {
    return [];
  }

  const mainPlace = getMainPlaceInSameGroup(place);

  const actionIdSet = new Set([
    ...getActionIdsFromPlace(mainPlace),
    ...getActionIdsFromPlace(place)
  ]);

  return chatActionDefinitions.filter(action => {
    if (action.type === "common") {
      return true;
    }

    if (action.type === "environment") {
      return hasRequiredEnvironmentTags(action, place);
    }

    return actionIdSet.has(action.actionId);
  });
}
