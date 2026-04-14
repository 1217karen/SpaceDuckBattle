//chat-composer-state.js

const COMPOSER_DRAFT_STORAGE_KEY = "chatComposerDraft";

function safeParse(json, fallback = null) {
  if (!json) return fallback;

  try {
    return JSON.parse(json);
  } catch {
    return fallback;
  }
}

function normalizeDraft(raw = {}) {
  return {
    speakerName:
      typeof raw.speakerName === "string"
        ? raw.speakerName
        : "",
    body:
      typeof raw.body === "string"
        ? raw.body
        : "",
    iconId:
      typeof raw.iconId === "number" && raw.iconId > 0
        ? raw.iconId
        : null,
    iconUrl:
      typeof raw.iconUrl === "string"
        ? raw.iconUrl
        : "",
    additionalTargetEnoText:
      typeof raw.additionalTargetEnoText === "string"
        ? raw.additionalTargetEnoText
        : "",
    isAdditionalTargetOpen:
      typeof raw.isAdditionalTargetOpen === "boolean"
        ? raw.isAdditionalTargetOpen
        : Boolean(
            typeof raw.additionalTargetEnoText === "string" &&
            raw.additionalTargetEnoText.trim() !== ""
          ),
    fixedReplyTargetEno:
      typeof raw.fixedReplyTargetEno === "number" && raw.fixedReplyTargetEno > 0
        ? raw.fixedReplyTargetEno
        : null,
    replySourcePostId:
      typeof raw.replySourcePostId === "number" && raw.replySourcePostId > 0
        ? raw.replySourcePostId
        : null,
    replyParentPostId:
      typeof raw.replyParentPostId === "number" && raw.replyParentPostId > 0
        ? raw.replyParentPostId
        : null,
    replyThreadRootPostId:
      typeof raw.replyThreadRootPostId === "number" && raw.replyThreadRootPostId > 0
        ? raw.replyThreadRootPostId
        : null,
    useCurrentPlaceForReply: Boolean(raw.useCurrentPlaceForReply)
  };
}

export function loadComposerDraft() {
  const parsed = safeParse(
    localStorage.getItem(COMPOSER_DRAFT_STORAGE_KEY),
    null
  );

  return normalizeDraft(parsed || {});
}

export function saveComposerDraft(draft = {}) {
  const normalized = normalizeDraft(draft);

  localStorage.setItem(
    COMPOSER_DRAFT_STORAGE_KEY,
    JSON.stringify(normalized)
  );

  return normalized;
}

export function clearComposerDraft() {
  localStorage.removeItem(COMPOSER_DRAFT_STORAGE_KEY);
}

export function createEmptyComposerDraft() {
  return normalizeDraft({});
}

export function readComposerDraftFromRefs(composerRefs) {
  return normalizeDraft({
    speakerName: composerRefs?.nameInput?.value ?? "",
    body: composerRefs?.textarea?.value ?? "",
    iconId: Number(composerRefs?.iconButton?.dataset.selectedId || 0) || null,
    iconUrl: String(composerRefs?.iconButton?.dataset.selectedUrl || "").trim(),
    additionalTargetEnoText: composerRefs?.replyTargetInput?.value ?? "",
    isAdditionalTargetOpen:
      composerRefs?.additionalTargetSection?.open ?? false,
    fixedReplyTargetEno:
      Number(composerRefs?.section?.dataset.fixedReplyTargetEno || 0) || null,
    replySourcePostId: Number(composerRefs?.section?.dataset.replySourcePostId || 0) || null,
    replyParentPostId: Number(composerRefs?.section?.dataset.replyParentPostId || 0) || null,
    replyThreadRootPostId: Number(composerRefs?.section?.dataset.replyThreadRootPostId || 0) || null,
    useCurrentPlaceForReply: Boolean(composerRefs?.useCurrentPlaceCheckbox?.checked)
  });
}

export function applyComposerDraftToRefs(composerRefs, draft = {}) {
  const normalized = normalizeDraft(draft);

  if (composerRefs?.nameInput) {
    composerRefs.nameInput.value = normalized.speakerName;
  }

  if (composerRefs?.textarea) {
    composerRefs.textarea.value = normalized.body;
  }

  if (composerRefs?.replyTargetInput) {
    composerRefs.replyTargetInput.value = normalized.additionalTargetEnoText;
  }

  if (composerRefs?.additionalTargetSection) {
    composerRefs.additionalTargetSection.open =
      Boolean(normalized.isAdditionalTargetOpen);
  }
  
  if (composerRefs?.useCurrentPlaceCheckbox) {
    composerRefs.useCurrentPlaceCheckbox.checked =
      Boolean(normalized.useCurrentPlaceForReply);
  }

  if (composerRefs?.section) {
    composerRefs.section.dataset.replySourcePostId =
      normalized.replySourcePostId ?? "";

    composerRefs.section.dataset.replyParentPostId =
      normalized.replyParentPostId ?? "";

    composerRefs.section.dataset.replyThreadRootPostId =
      normalized.replyThreadRootPostId ?? "";

    composerRefs.section.dataset.fixedReplyTargetEno =
      normalized.fixedReplyTargetEno ?? "";
  }

  return normalized;
}
