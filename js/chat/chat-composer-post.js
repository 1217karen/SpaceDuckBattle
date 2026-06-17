//chat-composer-post.js

function normalizeSubmittedBody(text) {
  return String(text ?? "")
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .replace(/\n/g, "<br>");
}

const SPEAKER_NAME_MIN_LENGTH = 1;
const SPEAKER_NAME_MAX_LENGTH = 15;
const POST_BODY_MIN_LENGTH = 1;
const POST_BODY_MAX_LENGTH = 600;

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

function getSingleMessageTargetEno(draft = {}) {
  const targetEnoList = parseTargetEnoList(draft?.additionalTargetEnoText ?? "");

  return targetEnoList.length === 1
    ? targetEnoList[0]
    : null;
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

export function validateComposerDraftForPost(draft = {}, character = {}) {
  const speakerName = getSpeakerName(draft, character);
  const rawBody = String(draft?.body ?? "");

  if (
    speakerName.length < SPEAKER_NAME_MIN_LENGTH ||
    speakerName.length > SPEAKER_NAME_MAX_LENGTH
  ) {
    return `発言者名は${SPEAKER_NAME_MIN_LENGTH}〜${SPEAKER_NAME_MAX_LENGTH}文字にしてください`;
  }

  if (
    rawBody.length < POST_BODY_MIN_LENGTH ||
    rawBody.length > POST_BODY_MAX_LENGTH
  ) {
    return `本文は${POST_BODY_MIN_LENGTH}〜${POST_BODY_MAX_LENGTH}文字にしてください`;
  }

  return "";
}

export function validateComposerDraftForMessage(draft = {}, character = {}) {
  const baseError = validateComposerDraftForPost(draft, character);

  if (baseError) {
    return baseError;
  }

  const targetEnoList = parseTargetEnoList(draft?.additionalTargetEnoText ?? "");

  if (targetEnoList.length === 0) {
    return "送信先Enoを入力してください";
  }

  if (targetEnoList.length > 1) {
    return "MESSAGEの送信先は1人だけ指定してください";
  }

  if (!character?.eno) {
    return "送信するキャラクターが見つかりません";
  }

  return "";
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

function buildTargetEnoList(draft = {}) {
  const targetEnoSet = new Set();

  const isAdditionalTargetOpen =
    Boolean(draft?.isAdditionalTargetOpen);

  if (isAdditionalTargetOpen) {
    parseTargetEnoList(draft?.additionalTargetEnoText ?? "")
      .forEach(eno => {
        targetEnoSet.add(eno);
      });
  }

  const fixedReplyTargetEno =
    typeof draft?.fixedReplyTargetEno === "number" && draft.fixedReplyTargetEno > 0
      ? draft.fixedReplyTargetEno
      : null;

  if (fixedReplyTargetEno) {
    targetEnoSet.add(fixedReplyTargetEno);
  }

  return [...targetEnoSet];
}

function buildVisibleToEnoList(draft = {}, character = {}) {
  const visibleToEnoSet = new Set();

  const authorEno =
    typeof character?.eno === "number" && character.eno > 0
      ? character.eno
      : null;

  if (authorEno) {
    visibleToEnoSet.add(authorEno);
  }

  buildTargetEnoList(draft).forEach(eno => {
    visibleToEnoSet.add(eno);
  });

  return [...visibleToEnoSet];
}

export function buildComposerPostInput({
  place,
  character,
  draft,
  replySourcePost = null
}) {
  const rawBody = String(draft?.body ?? "");

  if (rawBody.length === 0) {
    return null;
  }

  const { iconId, iconUrl } = getIconData(draft);

  const targetEnoList = buildTargetEnoList(draft);
  const isPrivate = Boolean(draft?.isPrivate);
  const visibleToEnoList = isPrivate
    ? buildVisibleToEnoList(draft, character)
    : [];

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
    targetEnoList,
    visibility: isPrivate ? "private" : "public",
    visibleToEnoList,
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

export function buildComposerMessageInput({
  character,
  draft
}) {
  const rawBody = String(draft?.body ?? "");

  if (rawBody.length === 0) {
    return null;
  }

  const targetEno = getSingleMessageTargetEno(draft);

  if (!targetEno) {
    return null;
  }

  const authorEno = character?.eno ?? 0;
  const { iconId, iconUrl } = getIconData(draft);

  return {
    type: "message",
    placeId: "",
    speakerName: getSpeakerName(draft, character),
    iconId,
    iconUrl,
    body: normalizeSubmittedBody(rawBody),
    authorEno,
    targetEnoList: [targetEno],
    visibility: "private",
    visibleToEnoList: Array.from(new Set([authorEno, targetEno])).filter(eno =>
      Number.isInteger(eno) && eno > 0
    ),
    parentPostId: null,
    threadRootPostId: null
  };
}

export function buildDraftPreviewPost({
  place,
  character,
  draft,
  replySourcePost = null
}) {
  const rawBody = String(draft?.body ?? "");

  if (rawBody.length === 0) {
    return null;
  }

  const { iconId, iconUrl } = getIconData(draft);
  const isPrivate = Boolean(draft?.isPrivate);

  return {
    postId: "xxx",
    placeId: getPostPlaceId({
      place,
      draft,
      replySourcePost
    }),
    speakerName: getSpeakerName(draft, character),
    iconId,
    iconUrl,
    body: formatDraftBody(rawBody),
    createdAt: "----/--/-- --:--",
    authorEno: character?.eno ?? "---",
    visibility: isPrivate ? "private" : "public",
    visibleToEnoList: isPrivate
      ? buildVisibleToEnoList(draft, character)
      : [],
    isDraftPreview: true,
    displayType: "normal",
    parentPostId:
      typeof draft?.replyParentPostId === "number" && draft.replyParentPostId > 0
        ? draft.replyParentPostId
        : null
  };
}
