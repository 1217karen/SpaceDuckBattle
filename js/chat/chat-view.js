//chat-view.js

import { bindRichTextToolbar } from "../common/rich-text-toolbar.js";
import { createRichTextToolbarButtons } from "../common/rich-text-toolbar-ui.js";
import { createPostCard } from "./chat-post-view.js";


export function renderPlaceInfoSection(container, options = {}) {
  const {
    place,
    aroundBasePlace,
    places = [],
    onMoveToPlace,
    isFavorite = false,
    onToggleFavorite = null
  } = options;

  const section = document.createElement("section");
  section.className = "chatHeader";

  const inner = document.createElement("div");
  inner.className = "chatHeaderInner";

  const topRow = document.createElement("div");
  topRow.className = "chatHeaderTopRow";

  const titleGroup = document.createElement("div");
  titleGroup.className = "chatHeaderTitleGroup";

  const title = document.createElement("h1");
  title.className = "chatHeaderTitle";
  title.textContent = place?.name ?? "場所が見つかりません";

  let favoriteButton = null;

  titleGroup.appendChild(title);
  topRow.appendChild(titleGroup);

  if (place) {
    favoriteButton = document.createElement("button");
    favoriteButton.type = "button";
    favoriteButton.className = "chatHeaderFavoriteButton";
    favoriteButton.textContent = isFavorite ? "★" : "☆";
    favoriteButton.title = isFavorite ? "お気に入り解除" : "お気に入り登録";
    favoriteButton.setAttribute(
      "aria-label",
      isFavorite ? "お気に入り解除" : "お気に入り登録"
    );

    if (typeof onToggleFavorite === "function") {
      favoriteButton.addEventListener("click", () => {
        onToggleFavorite(place);
      });
    } else {
      favoriteButton.disabled = true;
    }

    topRow.appendChild(favoriteButton);
  }

  if (!place) {
    inner.appendChild(topRow);
    section.appendChild(inner);
    container.appendChild(section);
    return {
      section,
      favoriteButton
    };
  }

  const aroundToggle = document.createElement("button");
  aroundToggle.type = "button";
  aroundToggle.className = "chatHeaderLinkButton chatHeaderAroundToggle button-toggle";
  aroundToggle.textContent = "▶周辺を表示";

  titleGroup.appendChild(aroundToggle);

  const aroundPanel = document.createElement("div");
  aroundPanel.className = "chatAroundPanel";
  aroundPanel.hidden = true;

  const divider = document.createElement("div");
  divider.className = "chatHeaderDivider";

  renderAroundTree(aroundPanel, {
    place: aroundBasePlace ?? place,
    places,
    onMoveToPlace
  });

  const body = document.createElement("div");
  body.className = "chatHeaderBody";

  const shortDescription = document.createElement("p");
  shortDescription.className = "chatHeaderShortDescription";
  shortDescription.textContent =
    place.shortDescription ?? "説明文は未設定です。";

  const detailToggle = document.createElement("button");
  detailToggle.type = "button";
  detailToggle.className = "chatHeaderLinkButton chatHeaderDetailToggle button-toggle";
  detailToggle.textContent = "▶詳細を表示";

  const detailContent = document.createElement("div");
  detailContent.className = "chatHeaderDetailContent";
  detailContent.hidden = true;

  const longDescription =
    String(place.longDescription ?? "").trim();

  if (longDescription) {
    longDescription
      .split(/\n+/)
      .map(line => line.trim())
      .filter(line => line.length > 0)
      .forEach(line => {
        const paragraph = document.createElement("p");
        paragraph.className = "chatHeaderLongDescription";
        paragraph.textContent = line;
        detailContent.appendChild(paragraph);
      });
  } else {
    const emptyDetail = document.createElement("p");
    emptyDetail.className = "chatHeaderLongDescription";
    emptyDetail.textContent = "詳細説明は未設定です。";
    detailContent.appendChild(emptyDetail);
  }

  aroundToggle.addEventListener("click", () => {
    const isOpen = !aroundPanel.hidden;
    aroundPanel.hidden = isOpen;
    aroundToggle.textContent = isOpen
      ? "▶周辺を表示"
      : "▼周辺を閉じる";
  });

  detailToggle.addEventListener("click", () => {
    const isOpen = !detailContent.hidden;
    detailContent.hidden = isOpen;
    detailToggle.textContent = isOpen
      ? "▶詳細を表示"
      : "▼詳細を閉じる";
  });

  body.appendChild(shortDescription);
  body.appendChild(detailToggle);
  body.appendChild(detailContent);

  inner.appendChild(topRow);
  inner.appendChild(aroundPanel);
  inner.appendChild(divider);
  inner.appendChild(body);

  section.appendChild(inner);
  container.appendChild(section);

  return {
    section,
    favoriteButton
  };
}

export function renderThreadHeaderSection(container, options = {}) {
  const {
    memoText = "",
    isMemoOpen = false,
    onCloseThread = null
  } = options;

  const section = document.createElement("section");
  section.className = "chatHeader";

  const inner = document.createElement("div");
  inner.className = "chatHeaderInner";

const topRow = document.createElement("div");
topRow.className = "chatHeaderTopRow";

const titleGroup = document.createElement("div");
titleGroup.className = "chatHeaderTitleGroup";

const title = document.createElement("h1");
title.className = "chatHeaderTitle";
title.textContent = "返信ツリー";

titleGroup.appendChild(title);

let closeThreadButton = null;

if (typeof onCloseThread === "function") {
  closeThreadButton = document.createElement("button");
  closeThreadButton.type = "button";
  closeThreadButton.className = "chatHeaderLinkButton chatThreadCloseButton";
  closeThreadButton.textContent = "×チャット画面に戻る";

  closeThreadButton.addEventListener("click", () => {
    onCloseThread();
  });

  titleGroup.appendChild(closeThreadButton);
}

topRow.appendChild(titleGroup);

  const divider = document.createElement("div");
  divider.className = "chatHeaderDivider";

  const body = document.createElement("div");
  body.className = "chatHeaderBody";

  const memoToggle = document.createElement("button");
  memoToggle.type = "button";
  memoToggle.className = "chatHeaderLinkButton chatHeaderDetailToggle button-toggle";
  memoToggle.textContent = isMemoOpen
    ? "▼非公開メモを閉じる"
    : "▶非公開メモを表示";

  const memoContent = document.createElement("div");
  memoContent.className = "chatHeaderDetailContent";
  memoContent.hidden = !isMemoOpen;

  const memoTextarea = document.createElement("textarea");
  memoTextarea.className = "chatThreadPrivateNoteTextarea";
  memoTextarea.rows = 6;
  memoTextarea.placeholder = "この返信ツリー用の非公開メモ";
  memoTextarea.value =
    typeof memoText === "string"
      ? memoText
      : "";

  const memoSaveButton = document.createElement("button");
  memoSaveButton.type = "button";
  memoSaveButton.className = "chatThreadPrivateNoteSaveButton";
  memoSaveButton.textContent = "保存";

  memoToggle.addEventListener("click", () => {
    const isOpen = !memoContent.hidden;
    memoContent.hidden = isOpen;
    memoToggle.textContent = isOpen
      ? "▼非公開メモを表示"
      : "▲非公開メモを閉じる";
  });

  memoContent.appendChild(memoTextarea);
  memoContent.appendChild(memoSaveButton);

  body.appendChild(memoToggle);
  body.appendChild(memoContent);

  inner.appendChild(topRow);
  inner.appendChild(divider);
  inner.appendChild(body);

  section.appendChild(inner);
  container.appendChild(section);

  return {
    section,
    closeThreadButton,
    memoToggle,
    memoContent,
    memoTextarea,
    memoSaveButton
  };
}

export function renderPlaceTabsSection(container, options = {}) {
  const {
    tabs = []
  } = options;

  renderChatTabSection(container, {
    sectionClassName: "chatPlaceTabsSection",
    buttonClassName: "chatPlaceTabButton button-place-tab",
    tabs
  });
}

export function renderViewTabsSection(container, options = {}) {
  const {
    tabs = []
  } = options;

  renderChatTabSection(container, {
    sectionClassName: "chatViewTabsSection",
    buttonClassName: "chatViewTabButton button-tab",
    tabs
  });
}

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

  toolRow.appendChild(createRichTextToolbarButtons());
  
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
    submitButton,
    useCurrentPlaceCheckbox,
    replySourcePost
  };
}

function renderChatTabSection(container, options = {}) {
  const {
    sectionClassName = "",
    buttonClassName = "",
    tabs = []
  } = options;

  const section = document.createElement("section");
  section.className = `chatTabsSection ${sectionClassName}`.trim();

  const inner = document.createElement("div");
  inner.className = "chatTabsInner";

  const row = document.createElement("div");
  row.className = "chatTabRow";

  tabs.forEach(tab => {
    row.appendChild(createChatTabButton(tab, buttonClassName));
  });

  inner.appendChild(row);
  section.appendChild(inner);
  container.appendChild(section);
}

function createChatTabButton(tab = {}, buttonClassName = "") {
  const button = document.createElement("button");
  button.type = "button";

  const classNames = ["chatTabButton"];

if (buttonClassName) {
  classNames.push(...buttonClassName.split(" ").filter(Boolean));
}

if (tab.isActive) {
  classNames.push("chatTabButtonActive", "is-active");
}

  if (tab.isDisabled) {
    classNames.push("chatTabButtonDisabled");
    button.disabled = true;
  }

if (tab.isCurrent) {
  classNames.push("chatTabButtonCurrent", "is-current");
}

  button.className = classNames.join(" ");
  button.textContent = tab.label ?? "";

  if (!tab.isDisabled && typeof tab.onClick === "function") {
    button.addEventListener("click", tab.onClick);
  }

  return button;
}

function renderAroundTree(container, options = {}) {
  const {
    place,
    places = [],
    onMoveToPlace
  } = options;

  container.innerHTML = "";

  const lines = buildAroundTreeLines(place, places);

  lines.forEach(line => {
    const row = document.createElement("div");
    row.className = "chatAroundRow";

    if (line.depth > 0) {
      row.style.paddingLeft = `${line.depth * 1.5}em`;
    }

    const prefix = document.createElement("span");
    prefix.className = "chatAroundPrefix";
    prefix.textContent = line.prefix ?? "";

    row.appendChild(prefix);

    if (line.isCurrentPlace || !line.placeId) {
      const text = document.createElement("span");
      text.className = "chatAroundCurrent";
      text.textContent = line.label;
      row.appendChild(text);
    } else {
      const linkButton = document.createElement("button");
      linkButton.type = "button";
      linkButton.className = "chatAroundLinkButton";
      linkButton.textContent = line.label;
      linkButton.addEventListener("click", () => {
        onMoveToPlace(line.placeId);
      });
      row.appendChild(linkButton);
    }

    container.appendChild(row);
  });
}

function buildAroundTreeLines(place, places) {
  if (!place) {
    return [];
  }

  if (place.kind === "field") {
    const childMainAreas = places.filter(item =>
      item.kind === "area" &&
      item.layer === "main" &&
      item.parentId === place.placeId
    );

    return [
      {
        depth: 0,
        prefix: "",
        label: `${place.name}（現在地）`,
        placeId: place.placeId,
        isCurrentPlace: true
      },
      ...childMainAreas.map((child, index) => ({
        depth: 1,
        prefix: getTreeBranch(index, childMainAreas.length),
        label: child.name,
        placeId: child.placeId,
        isCurrentPlace: false
      }))
    ];
  }

  if (place.kind === "area") {
    const parentMainField = places.find(item =>
      item.kind === "field" &&
      item.layer === "main" &&
      item.placeId === place.parentId
    );

    const childRooms = places.filter(item =>
      item.kind === "room" &&
      item.parentId === place.placeId
    );

    const lines = [];

    if (parentMainField) {
      lines.push({
        depth: 0,
        prefix: "",
        label: parentMainField.name,
        placeId: parentMainField.placeId,
        isCurrentPlace: false
      });
    }

    lines.push({
      depth: 1,
      prefix: "└",
      label: `${place.name}（現在地）`,
      placeId: place.placeId,
      isCurrentPlace: true
    });

    childRooms.forEach((child, index) => {
      lines.push({
        depth: 2,
        prefix: getTreeBranch(index, childRooms.length),
        label: child.name,
        placeId: child.placeId,
        isCurrentPlace: false
      });
    });

    return lines;
  }

if (place.kind === "room") {
  const parentMainArea = places.find(item =>
    item.kind === "area" &&
    item.layer === "main" &&
    item.placeId === place.parentId
  );

  const parentMainField = parentMainArea
    ? places.find(item =>
        item.kind === "field" &&
        item.layer === "main" &&
        item.placeId === parentMainArea.parentId
      )
    : null;

  const lines = [];

  if (parentMainField) {
    lines.push({
      depth: 0,
      prefix: "",
      label: parentMainField.name,
      placeId: parentMainField.placeId,
      isCurrentPlace: false
    });
  }

  if (parentMainArea) {
    lines.push({
      depth: 1,
      prefix: "└",
      label: parentMainArea.name,
      placeId: parentMainArea.placeId,
      isCurrentPlace: false
    });
  }

  lines.push({
    depth: 2,
    prefix: "└",
    label: `${place.name}（現在地）`,
    placeId: place.placeId,
    isCurrentPlace: true
  });

  return lines;
}

  return [];
}

function getTreeBranch(index, length) {
  if (index === length - 1) {
    return "└";
  }

  return "├";
}
