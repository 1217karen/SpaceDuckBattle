// chat-action-post.js

import { getPlaceLabel } from "./chat-place-utils.js";

function applyActionTemplate(template, values = {}) {
  return String(template ?? "").replace(/\{(\w+)\}/g, (match, key) => {
    return values[key] ?? match;
  });
}

function getCharacterActionName(character = {}) {
  const fullName =
    typeof character.fullName === "string"
      ? character.fullName.trim()
      : "";

  const defaultName =
    typeof character.defaultName === "string"
      ? character.defaultName.trim()
      : "";

  return fullName || defaultName || "誰か";
}

export function buildActionLogPostInput({
  action,
  place,
  character
} = {}) {
  if (!action || !place || !character) {
    return null;
  }

  const name = getCharacterActionName(character);
  const placeName = getPlaceLabel(place.placeId);

  const resultText =
    action.actionId === "look-around" &&
    typeof place.lookAroundText === "string" &&
    place.lookAroundText.trim() !== ""
      ? place.lookAroundText
      : action.resultText;

  const body = applyActionTemplate(resultText, {
   name,
    placeName
  });

  return {
    type: "actionLog",
    placeId: place.placeId,
    authorEno: character.eno,
    speakerName: name,
    body
  };
}
