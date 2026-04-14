//chat-composer-post.js

function normalizeSubmittedBody(text) {
  return String(text ?? "")
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .replace(/\n/g, "<br>");
}

function formatDraftBody(text) {
  return String(text ?? "").replace(/\n/g, "<br>");
}

function parseTargetEnoList(value) {
  if (typeof value !== "string") {
    return [];
  }

  const uniqueEnos = new Set();

  value
    .split(",")
    .map(item => item.trim())
    .filter(item => item !== "")
    .forEach(item => {
      if (!/^\d+$/.test(item)) {
        return;
      }

      uniqueEnos.add(Number(item));
    });

  return [...uniqueEnos];
}

function getSpeakerName(draft = {}, character = {}) {
  const draftName =
    typeof draft.speakerName === "string"
      ? draft.speakerName.trim()
      : "";

  if (draftName) {
    return draftName;
  }

  const defaultName =
    typeof character?.defaultName === "string"
      ? character.defaultName.trim()
      : "";

  if (defaultName) {
    return defaultName;
  }

  return "名前未設定";
}

function getIconData(draft = {}) {
  const iconId =
    typeof draft.iconId === "number" && draft.iconId > 0
      ? draft.iconId
      : null;

  const iconUrl =
    typeof draft.iconUrl === "string"
      ? draft.iconUrl.trim()
      : "";

  return {
    iconId,
    iconUrl
  };
}

function getPostPlaceId({ place, draft, replySourcePost }) {
  const currentPlaceId =
    typeof place?.placeId === "string"
      ? place.placeId
      : "";

  if (!draft?.replyParentPostId) {
    return currentPlaceId;
  }

  if (draft.useCurrentPlaceForReply) {
    return currentPlaceId;
  }

  const replyPlaceId =
    typeof replySourcePost?.placeId === "string"
      ? replySourcePost.placeId
      : "";

  return replyPlaceId || currentPlaceId;
}

export function buildComposerPostInput({
  place,
  character,
  draft,
  replySourcePost = null
}) {
  const rawBody = draft?.body ?? "";
  const trimmedBody = rawBody.trim();

  if (!trimmedBody) {
    return null;
  }

  const { iconId, iconUrl } = getIconData(draft);

  return {
    placeId: getPostPlaceId({
      place,
      draft,
      replySourcePost
    }),
    speakerName: getSpeakerName(draft, character),
    iconId,
    iconUrl,
    body: normalizeSubmittedBody(rawBody),
    authorEno: character?.eno ?? 0,
    targetEnoList: parseTargetEnoList(draft?.additionalTargetEnoText ?? ""),
    parentPostId:
      typeof draft?.replyParentPostId === "number"
        ? draft.replyParentPostId
        : null,
    threadRootPostId:
      typeof draft?.replyThreadRootPostId === "number"
        ? draft.replyThreadRootPostId
        : null
  };
}

export function buildDraftPreviewPost({ place, character, draft }) {
  const rawBody = draft?.body ?? "";
  const trimmedBody = rawBody.trim();

  if (!trimmedBody) {
    return null;
  }

  const { iconId, iconUrl } = getIconData(draft);

  return {
    postId: "xxx",
    placeId: place.placeId,
    speakerName: getSpeakerName(draft, character),
    iconId,
    iconUrl,
    body: formatDraftBody(rawBody),
    createdAt: "----/--/-- --:--",
    authorEno: character?.eno ?? "---",
    isDraftPreview: true,
    displayType: "normal"
  };
}
