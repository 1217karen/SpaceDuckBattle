//chat-view.js

import { renderRichText } from "../common/rich-text.js";
import { bindRichTextToolbar } from "../common/rich-text-toolbar.js";
import { getNoImageUrl } from "../common/icon-picker.js";

function stripRichTextTags(text) {
  return String(text ?? "").replace(/<\/?(b|i|u|s|br|rb|rt|f1|f2|f3|f4|f5|f6|f7)>/g, "");
}

function getPreviewText(text) {
  const plainText = stripRichTextTags(text);
  const length = plainText.length;

  if (length <= 5) {
    return plainText;
  }

  if (length <= 24) {
    return plainText.slice(0, length - 5) + "……";
  }

  return plainText.slice(0, 20) + "……";
}

export function createPostCard(post, options = {}) {
  const {
    isPreview = false,
    getPlaceLabel,
    onMoveToPlace,
    onReply = null,
    currentEno = null,
    hideActions = false
  } = options;

  const postBox = document.createElement("div");

  const classNames = ["chatPostCard"];

  if (isPreview) {
    classNames.push("chatPostCardPreview");
  }

  if (post.isDraftPreview) {
    classNames.push("chatPostCardDraftPreview");
  }

  postBox.className = classNames.join(" ");

  const left = document.createElement("div");
  left.className = "chatPostCardLeft";

  const right = document.createElement("div");
  right.className = "chatPostCardRight";

  if (!isPreview) {
    const iconBox = document.createElement("div");
    iconBox.className = "chatPostIcon";

    const iconUrl =
      typeof post.iconUrl === "string"
        ? post.iconUrl.trim()
        : "";

    const iconImg = document.createElement("img");
    iconImg.className = "chatPostIconImage";
    iconImg.src = iconUrl || getNoImageUrl();
    iconImg.alt = "post icon";
    iconBox.appendChild(iconImg);

    left.appendChild(iconBox);
  }

  const header = document.createElement("div");
  header.className = "chatPostHeader";

  const headerLeft = document.createElement("div");
  headerLeft.className = "chatPostHeaderLeft";

  const headerRight = document.createElement("div");
  headerRight.className = "chatPostHeaderRight";

  if (!isPreview) {
    const name = document.createElement("div");
    name.className = "chatPostName";
    name.textContent = `${post.speakerName} / Eno:${post.authorEno}`;
    headerLeft.appendChild(name);
  }

  const postNo = document.createElement("div");
  postNo.className = "chatPostNo";
  postNo.textContent = `No.${post.postId}`;

  headerRight.appendChild(postNo);
  header.appendChild(headerLeft);
  header.appendChild(headerRight);

  const divider = document.createElement("div");
  divider.className = "chatPostDivider";

  const body = document.createElement("div");
  body.className = "chatPostBody";

  if (isPreview) {
    body.textContent = getPreviewText(post.body);
  } else {
    renderRichText(body, post.body, { preset: "message" });
  }

  const actions = document.createElement("div");
  actions.className = "chatPostActions";

  if (!isPreview && !post.isDraftPreview && !hideActions) {
    const isOwnPost =
      currentEno !== null &&
      currentEno !== undefined &&
      String(post.authorEno) === String(currentEno);

    const replyButton = document.createElement("button");
    replyButton.type = "button";
    replyButton.className = "chatPostActionButton chatPostActionButtonReply";
    replyButton.title = "返信";
    replyButton.setAttribute("aria-label", "返信");

    if (typeof onReply === "function") {
      replyButton.addEventListener("click", () => {
        onReply(post);
      });
    }

    const replyIcon = document.createElement("span");
    replyIcon.className = "chatPostActionIcon chatPostActionIconReply";
    replyButton.appendChild(replyIcon);

    const quoteButton = document.createElement("button");
    quoteButton.type = "button";
    quoteButton.className = "chatPostActionButton chatPostActionButtonQuote";
    quoteButton.title = "引用";
    quoteButton.setAttribute("aria-label", "引用");

    const quoteIcon = document.createElement("span");
    quoteIcon.className = "chatPostActionIcon chatPostActionIconQuote";
    quoteButton.appendChild(quoteIcon);

    const hideButton = document.createElement("button");
    hideButton.type = "button";
    hideButton.className = "chatPostActionButton chatPostActionButtonHide";
    hideButton.title = "非表示";
    hideButton.setAttribute("aria-label", "非表示");

    const hideIcon = document.createElement("span");
    hideIcon.className = "chatPostActionIcon chatPostActionIconHide";
    hideButton.appendChild(hideIcon);

    actions.appendChild(replyButton);
    actions.appendChild(quoteButton);

    if (isOwnPost) {
      const deleteButton = document.createElement("button");
      deleteButton.type = "button";
      deleteButton.className = "chatPostActionButton chatPostActionButtonDelete";
      deleteButton.title = "削除";
      deleteButton.setAttribute("aria-label", "削除");

      const deleteIcon = document.createElement("span");
      deleteIcon.className = "chatPostActionIcon chatPostActionIconDelete";
      deleteButton.appendChild(deleteIcon);

      actions.appendChild(deleteButton);
    }

    actions.appendChild(hideButton);
  }

  const footer = document.createElement("div");
  footer.className = "chatPostFooter";

  const createdAtText = document.createElement("span");
  createdAtText.textContent = `${post.createdAt} / `;

  const placeButton = document.createElement("button");
  placeButton.type = "button";
  placeButton.className = "chatPostPlaceButton";
  placeButton.textContent = getPlaceLabel(post.placeId);

  if (typeof onMoveToPlace === "function") {
    placeButton.addEventListener("click", () => {
      onMoveToPlace(post.placeId);
    });
  } else {
    placeButton.disabled = true;
  }

  footer.appendChild(createdAtText);
  footer.appendChild(placeButton);

  right.appendChild(header);
  right.appendChild(divider);
  right.appendChild(body);
  right.appendChild(actions);
  right.appendChild(footer);

  postBox.appendChild(left);
  postBox.appendChild(right);

  return postBox;
}

export function renderPostListSection(container, options = {}) {
  const {
    posts = [],
    getPlaceLabel,
    onMoveToPlace,
    onReply,
    currentEno = null
  } = options;

  const section = document.createElement("section");
  section.className = "chatPostListSection";

  const list = document.createElement("div");
  list.className = "chatPostList";
  section.appendChild(list);

  container.appendChild(section);

  renderPostListContent(list, {
    posts,
    getPlaceLabel,
    onMoveToPlace,
    onReply,
    currentEno
  });

  return {
    section,
    list
  };
}

export function renderPostListContent(listContainer, options = {}) {
  const {
    posts = [],
    getPlaceLabel,
    onMoveToPlace,
    onReply,
    currentEno = null
  } = options;

  if (!listContainer) {
    return;
  }

  listContainer.innerHTML = "";

  if (posts.length === 0) {
    const emptyPosts = document.createElement("p");
    emptyPosts.textContent = "発言はありません";
    listContainer.appendChild(emptyPosts);
    return;
  }

  posts.forEach(post => {
    listContainer.appendChild(
      createPostCard(post, {
        isPreview: post.displayType === "preview",
        getPlaceLabel,
        onMoveToPlace,
        onReply,
        currentEno
      })
    );
  });
}
export function renderPlaceSwitchSection(container, options = {}) {
  const {
    currentPlace,
    sameGroupPlaces = [],
    getLayerLabel,
    onMoveToPlace
  } = options;

  if (!currentPlace) {
    return;
  }

  if (currentPlace.kind === "room") {
    return;
  }

  const switchHeading = document.createElement("h2");
  switchHeading.textContent = "場所切替";
  container.appendChild(switchHeading);

  sameGroupPlaces.forEach(place => {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = `${getLayerLabel(place.layer)} : ${place.name}`;

    if (place.placeId === currentPlace.placeId) {
      button.disabled = true;
    } else {
      button.addEventListener("click", () => {
        onMoveToPlace(place.placeId);
      });
    }

    container.appendChild(button);
  });
}

export function renderPlaceInfoSection(container, options = {}) {
  const {
    place,
    aroundBasePlace,
    places = [],
    onMoveToPlace
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

titleGroup.appendChild(title);
topRow.appendChild(titleGroup);

if (!place) {
  inner.appendChild(topRow);
  section.appendChild(inner);
  container.appendChild(section);
  return;
}

const aroundToggle = document.createElement("button");
aroundToggle.type = "button";
aroundToggle.className = "chatHeaderLinkButton chatHeaderAroundToggle";
aroundToggle.textContent = "▼周辺を表示";

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
  detailToggle.className = "chatHeaderLinkButton chatHeaderDetailToggle";
  detailToggle.textContent = "▼詳細を表示";

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
      ? "▼周辺を表示"
      : "▲周辺を閉じる";
  });

  detailToggle.addEventListener("click", () => {
    const isOpen = !detailContent.hidden;
    detailContent.hidden = isOpen;
    detailToggle.textContent = isOpen
      ? "▼詳細を表示"
      : "▲詳細を閉じる";
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
}

export function renderPlaceTabsSection(container, options = {}) {
  const {
    tabs = []
  } = options;

  renderChatTabSection(container, {
    sectionClassName: "chatPlaceTabsSection",
    tabs
  });
}

export function renderViewTabsSection(container, options = {}) {
  const {
    tabs = []
  } = options;

  renderChatTabSection(container, {
    sectionClassName: "chatViewTabsSection",
    tabs
  });
}

export function renderChatComposerSection(container, options = {}) {
  const {
    composerDraft = {},
    replySourcePost = null,
    getPlaceLabel = () => ""
  } = options;

  const section = document.createElement("section");
  section.dataset.replySourcePostId =
    composerDraft.replySourcePostId ?? "";

  section.dataset.replyParentPostId =
    composerDraft.replyParentPostId ?? "";

  section.dataset.replyThreadRootPostId =
    composerDraft.replyThreadRootPostId ?? "";

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
  replyPreviewHeader.textContent = "返信元";

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

  const replyTargetInput = document.createElement("input");
  replyTargetInput.type = "text";
  replyTargetInput.className = "chatComposerReplyTargetInput";
    replyTargetInput.value =
    typeof composerDraft.additionalTargetEnoText === "string"
      ? composerDraft.additionalTargetEnoText
      : "";
  replyTargetInput.placeholder = "追加返信先Eno（,区切りで複数指定）";

  metaRow.appendChild(nameInput);
  metaRow.appendChild(replyTargetInput);

  const textarea = document.createElement("textarea");
  textarea.className = "chatComposerTextarea";
  textarea.rows = 5;
  textarea.placeholder = "ここに発言を入力";

  const toolbar = document.createElement("div");
  toolbar.className = "chatComposerToolbar";

  const boldButton = document.createElement("button");
  boldButton.type = "button";
  boldButton.className = "chatComposerToolButton richTextToolButtonIconLike richTextToolButtonBold";
  boldButton.textContent = "B";
  boldButton.dataset.insertOpenTag = "<b>";
  boldButton.dataset.insertCloseTag = "</b>";

  const italicButton = document.createElement("button");
  italicButton.type = "button";
  italicButton.className = "chatComposerToolButton richTextToolButtonIconLike richTextToolButtonItalic";
  italicButton.textContent = "I";
  italicButton.dataset.insertOpenTag = "<i>";
  italicButton.dataset.insertCloseTag = "</i>";

  const underlineButton = document.createElement("button");
  underlineButton.type = "button";
  underlineButton.className = "chatComposerToolButton richTextToolButtonIconLike richTextToolButtonUnderline";
  underlineButton.textContent = "U";
  underlineButton.dataset.insertOpenTag = "<u>";
  underlineButton.dataset.insertCloseTag = "</u>";

  const strikeButton = document.createElement("button");
  strikeButton.type = "button";
  strikeButton.className = "chatComposerToolButton richTextToolButtonIconLike richTextToolButtonStrike";
  strikeButton.textContent = "S";
  strikeButton.dataset.insertOpenTag = "<s>";
  strikeButton.dataset.insertCloseTag = "</s>";

  const rubyButton = document.createElement("button");
  rubyButton.type = "button";
  rubyButton.className = "chatComposerToolButton richTextToolButtonIconLike richTextToolButtonRuby";
  rubyButton.textContent = "rb";
  rubyButton.dataset.insertText = "<rb></rb><rt></rt>";
  rubyButton.dataset.caretOffset = "4";

  const f1Button = document.createElement("button");
  f1Button.type = "button";
  f1Button.className = "chatComposerToolButton richTextToolButtonIconLike richTextToolButtonFont";
  f1Button.textContent = "F1";
  f1Button.dataset.insertOpenTag = "<f1>";
  f1Button.dataset.insertCloseTag = "</f1>";

  const f2Button = document.createElement("button");
  f2Button.type = "button";
  f2Button.className = "chatComposerToolButton richTextToolButtonIconLike richTextToolButtonFont";
  f2Button.textContent = "F2";
  f2Button.dataset.insertOpenTag = "<f2>";
  f2Button.dataset.insertCloseTag = "</f2>";

  const f3Button = document.createElement("button");
  f3Button.type = "button";
  f3Button.className = "chatComposerToolButton richTextToolButtonIconLike richTextToolButtonFont";
  f3Button.textContent = "F3";
  f3Button.dataset.insertOpenTag = "<f3>";
  f3Button.dataset.insertCloseTag = "</f3>";

  const f4Button = document.createElement("button");
  f4Button.type = "button";
  f4Button.className = "chatComposerToolButton richTextToolButtonIconLike richTextToolButtonFont";
  f4Button.textContent = "F4";
  f4Button.dataset.insertOpenTag = "<f4>";
  f4Button.dataset.insertCloseTag = "</f4>";

  const f5Button = document.createElement("button");
  f5Button.type = "button";
  f5Button.className = "chatComposerToolButton richTextToolButtonIconLike richTextToolButtonFont";
  f5Button.textContent = "F5";
  f5Button.dataset.insertOpenTag = "<f5>";
  f5Button.dataset.insertCloseTag = "</f5>";

  const f6Button = document.createElement("button");
  f6Button.type = "button";
  f6Button.className = "chatComposerToolButton richTextToolButtonIconLike richTextToolButtonFont";
  f6Button.textContent = "F6";
  f6Button.dataset.insertOpenTag = "<f6>";
  f6Button.dataset.insertCloseTag = "</f6>";

  const f7Button = document.createElement("button");
  f7Button.type = "button";
  f7Button.className = "chatComposerToolButton richTextToolButtonIconLike richTextToolButtonFont";
  f7Button.textContent = "F7";
  f7Button.dataset.insertOpenTag = "<f7>";
  f7Button.dataset.insertCloseTag = "</f7>";

  const submitButton = document.createElement("button");
  submitButton.type = "button";
  submitButton.className = "chatComposerSubmitButton";
  submitButton.textContent = "投稿";

  toolbar.appendChild(boldButton);
  toolbar.appendChild(italicButton);
  toolbar.appendChild(underlineButton);
  toolbar.appendChild(strikeButton);
  toolbar.appendChild(rubyButton);
  toolbar.appendChild(f1Button);
  toolbar.appendChild(f2Button);
  toolbar.appendChild(f3Button);
  toolbar.appendChild(f4Button);
  toolbar.appendChild(f5Button);
  toolbar.appendChild(f6Button);
  toolbar.appendChild(f7Button);
  toolbar.appendChild(submitButton);
  
  right.appendChild(metaRow);
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
    replyTargetInput,
    textarea,
    submitButton,
    replySourcePost
  };
}

function renderChatTabSection(container, options = {}) {
  const {
    sectionClassName = "",
    tabs = []
  } = options;

  const section = document.createElement("section");
  section.className = `chatTabsSection ${sectionClassName}`.trim();

  const inner = document.createElement("div");
  inner.className = "chatTabsInner";

  const row = document.createElement("div");
  row.className = "chatTabRow";

  tabs.forEach(tab => {
    row.appendChild(createChatTabButton(tab));
  });

  inner.appendChild(row);
  section.appendChild(inner);
  container.appendChild(section);
}

function createChatTabButton(tab = {}) {
  const button = document.createElement("button");
  button.type = "button";

  const classNames = ["chatTabButton"];

  if (tab.isActive) {
    classNames.push("chatTabButtonActive");
  }

  if (tab.isDisabled) {
    classNames.push("chatTabButtonDisabled");
    button.disabled = true;
  }

  if (tab.isCurrent) {
    classNames.push("chatTabButtonCurrent");
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
