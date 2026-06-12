//chat-action-post.js

export function buildTestActionLogPostInput({
  place,
  character
} = {}) {
  if (!place || !character) {
    return null;
  }

  const name =
    typeof character.name === "string" && character.name.trim()
      ? character.name.trim()
      : "name";

  return {
    type: "actionLog",
    placeId: place.placeId,
    authorEno: character.eno,
    speakerName: name,
    body: `${name}はアクションをした。`
  };
}
