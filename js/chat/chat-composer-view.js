//chat-composer-view.js

import { bindRichTextToolbar } from "../common/rich-text-toolbar.js";
import { createRichTextToolbarButtons } from "../common/rich-text-toolbar-ui.js";
import { createPostCard } from "./chat-post-view.js";

export function renderChatComposerSection(container, options = {}) {
  const {
    composerDraft = {},
    replySourcePost = null,
    getPlaceLabel = () => "",
    onClearReply = null,
    currentPlaceLabel = "",
    useCurrentPlaceForReply = false,
    fixedReplyTargetEno = null,
    fixedReplyTargetName = "",
    isAdditionalTargetOpen = false
  } = options;

  const section = document.createElement("section");
  section.className = "chatComposerSection";
  section.dataset.replySourcePostId =
    composerDraft.replySourcePostId ?? "";

  section.dataset.replyParentPostId =
    composerDraft.replyParentPostId ?? "";

  section.dataset.replyThreadRootPostId =
    composerDraft.replyThreadRootPostId ?? "";
  
  section.dataset.fixedReplyTargetEno =
    composerDraft.fixedReplyTargetEno ?? "";

  const inner = document.createElement("div");
  inner.className = "chatComposerInner";

  const card = document.createElement("div");
  card.className = "chatComposerCard";

  const left = document.createElement("div");
  left.className = "chatComposerLeft";

  const iconButton = document.createElement("button");
  iconButton.type = "button";
  iconButton.className = "chatComposerIconButton";

  const iconImg = document.createElement("img");
  iconImg.className = "chatComposerIconImage";
  iconImg.alt = "speaker icon";

  iconButton.appendChild(iconImg);
  left.appendChild(iconButton);

  const right = document.createElement("div");
  right.className = "chatComposerRight";

  let replyPreviewSection = null;

if (replySourcePost) {
  replyPreviewSection = document.createElement("div");
  replyPreviewSection.className = "chatComposerReplyPreview";

  const replyPreviewHeader = document.createElement("div");
  replyPreviewHeader.className = "chatComposerReplyPreviewHeader";

  const replyPreviewHeaderLabel = document.createElement("span");
  replyPreviewHeaderLabel.textContent = "返信元";

  replyPreviewHeader.appendChild(replyPreviewHeaderLabel);

  if (typeof onClearReply === "function") {
    const clearReplyButton = document.createElement("button");
    clearReplyButton.type = "button";
    clearReplyButton.className = "chatComposerReplyClearButton button-small";
    clearReplyButton.textContent = "×";
    clearReplyButton.title = "返信を解除";
    clearReplyButton.setAttribute("aria-label", "返信を解除");

    clearReplyButton.addEventListener("click", () => {
      onClearReply();
    });

    replyPreviewHeader.appendChild(clearReplyButton);
  }

    const replyPreviewCard = createPostCard(replySourcePost, {
      isPreview: false,
      getPlaceLabel,
      onMoveToPlace: null,
      onReply: null,
      currentEno: null,
      hideActions: true
    });
  replyPreviewCard.classList.add("chatComposerReplyPreviewCard");

  replyPreviewSection.appendChild(replyPreviewHeader);
  replyPreviewSection.appendChild(replyPreviewCard);
}

  const metaRow = document.createElement("div");
  metaRow.className = "chatComposerMetaRow";

  const nameInput = document.createElement("input");
  nameInput.type = "text";
  nameInput.className = "chatComposerNameInput";
  nameInput.value =
    typeof composerDraft.speakerName === "string"
      ? composerDraft.speakerName
      : "";
  nameInput.placeholder = "発言者名";

    let fixedReplyTargetInfo = null;

  if (replySourcePost) {
    fixedReplyTargetInfo = document.createElement("div");
    fixedReplyTargetInfo.className = "chatComposerFixedReplyTargetInfo";

    const fixedReplyTargetLabel = document.createElement("span");
    fixedReplyTargetLabel.className = "chatComposerFixedReplyTargetLabel";
    fixedReplyTargetLabel.textContent = "返信先：";

    const fixedReplyTargetValue = document.createElement("span");
    fixedReplyTargetValue.className = "chatComposerFixedReplyTargetValue";

    if (typeof fixedReplyTargetEno === "number" && fixedReplyTargetEno > 0) {
      const nameText =
        typeof fixedReplyTargetName === "string" && fixedReplyTargetName.trim() !== ""
          ? fixedReplyTargetName.trim()
          : "";

      fixedReplyTargetValue.textContent =
        nameText !== ""
          ? `${nameText}(Eno.${fixedReplyTargetEno})`
          : `Eno.${fixedReplyTargetEno}`;
    } else {
      fixedReplyTargetValue.textContent = "未設定";
    }

    fixedReplyTargetInfo.appendChild(fixedReplyTargetLabel);
    fixedReplyTargetInfo.appendChild(fixedReplyTargetValue);
  }

  const additionalTargetSection = document.createElement("details");
  additionalTargetSection.className = "chatComposerAdditionalTargetSection";
  additionalTargetSection.open = Boolean(isAdditionalTargetOpen);

  const additionalTargetSummary = document.createElement("summary");
  additionalTargetSummary.className = "chatComposerAdditionalTargetSummary";
  additionalTargetSummary.textContent = "追加返信先";

  const additionalTargetBody = document.createElement("div");
  additionalTargetBody.className = "chatComposerAdditionalTargetBody";

  const replyTargetInput = document.createElement("input");
  replyTargetInput.type = "text";
  replyTargetInput.className = "chatComposerReplyTargetInput";
  replyTargetInput.value =
    typeof composerDraft.additionalTargetEnoText === "string"
      ? composerDraft.additionalTargetEnoText
      : "";
  replyTargetInput.placeholder = "返信先Enoを入力　,区切りで複数指定可能";

  additionalTargetBody.appendChild(replyTargetInput);
  additionalTargetSection.appendChild(additionalTargetSummary);
  additionalTargetSection.appendChild(additionalTargetBody);

  metaRow.appendChild(nameInput);

  if (fixedReplyTargetInfo) {
    metaRow.appendChild(fixedReplyTargetInfo);
  }

  const textarea = document.createElement("textarea");
  textarea.className = "chatComposerTextarea";
  textarea.rows = 5;
  textarea.placeholder = "ここに発言を入力";

  const toolbar = document.createElement("div");
  toolbar.className = "chatComposerToolbar";

  const toolRow = document.createElement("div");
  toolRow.className = "chatComposerToolbarRow chatComposerToolbarRowTools";

  const actionRow = document.createElement("div");
  actionRow.className = "chatComposerToolbarRow chatComposerToolbarRowActions";

  const actionLeft = document.createElement("div");
  actionLeft.className = "chatComposerToolbarActionLeft";

  const actionRight = document.createElement("div");
  actionRight.className = "chatComposerToolbarActionRight";

  let useCurrentPlaceCheckbox = null;

  if (replySourcePost) {
    const useCurrentPlaceLabel = document.createElement("label");
    useCurrentPlaceLabel.className = "chatComposerPlaceToggleLabel";

    useCurrentPlaceCheckbox = document.createElement("input");
    useCurrentPlaceCheckbox.type = "checkbox";
    useCurrentPlaceCheckbox.className = "chatComposerPlaceToggleCheckbox";
    useCurrentPlaceCheckbox.checked = Boolean(useCurrentPlaceForReply);

    const useCurrentPlaceText = document.createElement("span");
    useCurrentPlaceText.textContent = "発言場所を現在地にする";

    useCurrentPlaceLabel.appendChild(useCurrentPlaceCheckbox);
    useCurrentPlaceLabel.appendChild(useCurrentPlaceText);

    actionLeft.appendChild(useCurrentPlaceLabel);
  }

  const postPlaceInfo = document.createElement("div");
  postPlaceInfo.className = "chatComposerPostPlaceInfo";
  postPlaceInfo.textContent = `現在地: ${currentPlaceLabel}`;

const submitButton = document.createElement("button");
submitButton.type = "button";
submitButton.className = "chatComposerSubmitButton button-primary";
submitButton.textContent = "投稿";

  const richTextButtons = createRichTextToolbarButtons();

  const bodyCount = document.createElement("span");
  bodyCount.className = "chatComposerBodyCount";
  bodyCount.textContent = "0 / 600";

  toolRow.appendChild(richTextButtons);
  toolRow.appendChild(bodyCount);
  
  actionLeft.appendChild(postPlaceInfo);
  actionRight.appendChild(submitButton);

  actionRow.appendChild(actionLeft);
  actionRow.appendChild(actionRight);

  toolbar.appendChild(toolRow);
  toolbar.appendChild(actionRow);

  right.appendChild(metaRow);
  right.appendChild(additionalTargetSection);
  right.appendChild(textarea);
  right.appendChild(toolbar);

  card.appendChild(left);
  card.appendChild(right);

  if (replyPreviewSection) {
    inner.appendChild(replyPreviewSection);
  }

  inner.appendChild(card);
  section.appendChild(inner);
  container.appendChild(section);

  bindRichTextToolbar(section, textarea);

  return {
    section,
    iconButton,
    iconImg,
    nameInput,
    additionalTargetSection,
    replyTargetInput,
    textarea,
    bodyCount,
    submitButton,
    useCurrentPlaceCheckbox,
    replySourcePost
  };
}
