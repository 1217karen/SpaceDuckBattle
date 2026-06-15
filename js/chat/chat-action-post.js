// chat-action-post.js

import { getPlaceLabel } from "./chat-place-utils.js";

function applyActionTemplate(template, values = {}) {
  return String(template ?? "").replace(/\{(\w+)\}/g, (match, key) => {
    return values[key] ?? match;
  });
}

export function buildActionLogPostInput({
  action,
  place,
  character
} = {}) {
  if (!action || !place || !character) {
    return null;
  }

  const name =
    typeof character.name === "string" && character.name.trim()
      ? character.name.trim()
      : "name";

  const placeName = getPlaceLabel(place.placeId);

  const body = applyActionTemplate(action.resultText, {
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
