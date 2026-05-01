import { loadCharacter } from "../services/storage-service.js";
import { getNoImageUrl, normalizeCommIcons, setButtonPreview } from "../common/icon-picker.js";
import { bindSpeakerNameSync } from "../common/speaker-name-sync.js";
import { saveComposerDraft, readComposerDraftFromRefs, applyComposerDraftToRefs } from "./chat-composer-state.js";

function getInitialComposerIcon(character) {
  const commIcons = normalizeCommIcons(character?.commIcons);
  const defaultIconUrl =
    typeof character?.defaultIcon === "string"
      ? character.defaultIcon.trim()
      : "";

  if (defaultIconUrl !== "") {
    return {
      iconId: null,
      iconUrl: defaultIconUrl
    };
  }

  if (commIcons.length > 0) {
    return {
      iconId: commIcons[0].id,
      iconUrl: commIcons[0].url
    };
  }

  return {
    iconId: null,
    iconUrl: getNoImageUrl()
  };
}

export function setupComposerIconPicker({
  composerRefs,
  character,
  chatIconPicker
}) {
  if (!composerRefs?.iconButton || !chatIconPicker) {
    return;
  }

  const commIcons = normalizeCommIcons(character?.commIcons);
  const initialIcon = getInitialComposerIcon(character);

  setButtonPreview(
    composerRefs.iconButton,
    initialIcon.iconId,
    initialIcon.iconUrl
  );

  bindSpeakerNameSync({
    nameInput: composerRefs.nameInput,
    button: composerRefs.iconButton,
    getIcons: () => commIcons,
    getDefaultName: () =>
      typeof character?.defaultName === "string"
        ? character.defaultName.trim()
        : "",
    mode: "value"
  });

  composerRefs.iconButton.addEventListener("click", () => {
    chatIconPicker.open(composerRefs.iconButton, commIcons);
  });
}

export function setupComposerDraftPersistence(composerRefs) {
  if (!composerRefs) {
    return;
  }

  function persistDraft() {
    saveComposerDraft(
      readComposerDraftFromRefs(composerRefs)
    );
  }

  composerRefs.nameInput?.addEventListener("input", persistDraft);
  composerRefs.textarea?.addEventListener("input", persistDraft);
  composerRefs.replyTargetInput?.addEventListener("input", persistDraft);
  composerRefs.iconButton?.addEventListener("iconchange", persistDraft);
  composerRefs.useCurrentPlaceCheckbox?.addEventListener("change", persistDraft);
  composerRefs.additionalTargetSection?.addEventListener("toggle", persistDraft);
}

export function getFixedReplyTargetName(replySourcePost) {
  const replyTargetCharacter =
    replySourcePost?.authorEno
      ? loadCharacter(replySourcePost.authorEno)
      : null;

  if (
    typeof replyTargetCharacter?.defaultName === "string" &&
    replyTargetCharacter.defaultName.trim() !== ""
  ) {
    return replyTargetCharacter.defaultName.trim();
  }

  return typeof replySourcePost?.speakerName === "string"
    ? replySourcePost.speakerName
    : "";
}

export function applyComposerDraftIconPreview(composerRefs, composerDraft) {
  if (!composerRefs?.iconButton) {
    return;
  }

  if (composerDraft?.iconId || composerDraft?.iconUrl) {
    setButtonPreview(
      composerRefs.iconButton,
      composerDraft.iconId,
      composerDraft.iconUrl || getNoImageUrl()
    );
  }
}

export function setupRenderedComposer({
  composerRefs,
  composerDraft,
  character,
  chatIconPicker
}) {
  setupComposerIconPicker({
    composerRefs,
    character,
    chatIconPicker
  });

  setupComposerDraftPersistence(composerRefs);
  applyComposerDraftToRefs(composerRefs, composerDraft);
  applyComposerDraftIconPreview(composerRefs, composerDraft);
}
