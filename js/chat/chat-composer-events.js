//chat-composer-events.js

export function bindComposerDraftPreviewEvents(composerRefs, refreshDraftPreview) {
  if (!composerRefs || typeof refreshDraftPreview !== "function") {
    return;
  }

  composerRefs.textarea?.addEventListener("input", refreshDraftPreview);
  composerRefs.nameInput?.addEventListener("input", refreshDraftPreview);
  composerRefs.replyTargetInput?.addEventListener("input", refreshDraftPreview);
  composerRefs.iconButton?.addEventListener("iconchange", refreshDraftPreview);
  composerRefs.useCurrentPlaceCheckbox?.addEventListener("change", refreshDraftPreview);
  composerRefs.privateCheckbox?.addEventListener("change", refreshDraftPreview);
  composerRefs.additionalTargetSection?.addEventListener("toggle", refreshDraftPreview);
}
