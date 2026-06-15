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

function pickRandomText(texts = []) {
  const validTexts = Array.isArray(texts)
    ? texts.filter(text =>
        typeof text === "string" &&
        text.trim() !== ""
      )
    : [];

  if (validTexts.length === 0) {
    return "";
  }

  const index = Math.floor(Math.random() * validTexts.length);
  return validTexts[index];
}

function buildActionResultText(action, place) {
  if (
    action.actionId === "look-around" &&
    typeof place.lookAroundText === "string" &&
    place.lookAroundText.trim() !== ""
  ) {
    return place.lookAroundText;
  }

  const baseText =
    typeof action.resultBaseText === "string"
      ? action.resultBaseText.trim()
      : "";

  const suffixText = pickRandomText(action.resultSuffixTexts);

  if (baseText || suffixText) {
    return `${baseText}${suffixText}`;
  }

  const randomResultText = pickRandomText(action.resultTexts);

  if (randomResultText) {
    return randomResultText;
  }

  return action.resultText ?? "";
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

  const resultText = buildActionResultText(action, place);

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
