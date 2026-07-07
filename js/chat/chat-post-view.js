//chat-post-view.js

import { renderRichText } from "../common/rich-text.js";
import { getNoImageUrl } from "../common/icon-picker.js";
import { renderPostBodyWithQuoteAnchors } from "./chat-quote-view.js";
import { navigateToChatPlace } from "./chat-navigation.js";


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

function formatReplyTargetLabel(target = {}) {
  const eno =
    typeof target?.eno === "number" && target.eno > 0
      ? target.eno
      : null;

  const name =
    typeof target?.name === "string"
      ? target.name.trim()
      : "";

  if (name && eno) {
    return `${name}(Eno.${eno})`;
  }

  if (name) {
    return name;
  }

  if (eno) {
    return `Eno.${eno}`;
  }

  return "不明";
}

function hasReplyTarget(post = {}) {
  if (
    typeof post?.parentPostId === "number" &&
    post.parentPostId > 0
  ) {
    return true;
  }

  return Array.isArray(post?.targetEnoList) &&
    post.targetEnoList.some(item => {
      const eno = Number(item);
      return Number.isInteger(eno) && eno > 0;
    });
}

export function createPostCard(post, options = {}) {
  const {
    isPreview = false,
    getPlaceLabel,
    onMoveToPlace,
    postActions = {},
    currentEno = null,
    hideActions = false,
    getReplyTargetLabels = null,
    getQuotePreviewPostById = null,
    quotePreviewRootArea = null,
    onAuthorIconClick = null
  } = options;

  const {
    onReply = null,
    onDelete = null,
    onOpenThread = null,
    onQuote = null,
    onHide = null
  } = postActions;

  const postBox = document.createElement("div");

  const classNames = ["common-card-framed", "common-card-gradient", "chatPostCard"];

  if (post.type === "actionLog") {
    classNames.push("chatPostCardActionLog");
  }

  if (post.type === "message") {
    classNames.push("chatPostCardMessage");
  }

  if (post.visibility === "private") {
    classNames.push("chatPostCardPrivate");
  }

  if (hasReplyTarget(post)) {
    classNames.push("chatPostCardReply");
  }

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

const shouldShowIcon =
  !isPreview &&
  post.type !== "actionLog";

if (shouldShowIcon) {
  const iconBox = document.createElement("div");
  iconBox.className = "chatPostIcon";

  const iconUrl =
    typeof post.iconUrl === "string"
      ? post.iconUrl.trim()
      : "";

  const iconImg = document.createElement("img");
  iconImg.className = "commonIcon60 chatPostIconImage";
  iconImg.src = iconUrl || getNoImageUrl();
  iconImg.alt = "post icon";

  if (
    typeof onAuthorIconClick === "function" &&
    typeof post?.authorEno === "number" &&
    post.authorEno > 0 &&
    post.type !== "message"
  ) {
    const iconButton = document.createElement("button");
    iconButton.type = "button";
    iconButton.className = "chatPostIconButton button-plain";
    iconButton.title = "発言一覧を見る";
    iconButton.setAttribute("aria-label", "発言一覧を見る");
    iconButton.appendChild(iconImg);
    iconButton.addEventListener("click", () => {
      onAuthorIconClick({
        authorEno: post.authorEno,
        post
      });
    });

    iconBox.appendChild(iconButton);
  } else {
    iconBox.appendChild(iconImg);
  }


  left.appendChild(iconBox);
}

  const header = document.createElement("div");
  header.className = "chatPostHeader";

  const headerLeft = document.createElement("div");
  headerLeft.className = "chatPostHeaderLeft";

  const headerRight = document.createElement("div");
  headerRight.className = "chatPostHeaderRight";

  if (!isPreview) {

    const nameRow = document.createElement("div");
    nameRow.className = "chatPostNameRow";

    const name = document.createElement("span");
    name.className =
      post.type === "actionLog"
        ? "chatPostName chatPostLogLabel"
        : post.type === "message"
          ? "chatPostName chatPostMessageName"
          : "chatPostName";

    name.textContent =
      post.type === "actionLog"
        ? "ACTION LOG"
        : typeof post.speakerName === "string"
          ? post.speakerName
          : "";

    const enoSeparator = document.createElement("span");
    enoSeparator.className = "chatPostEnoSeparator";
    enoSeparator.textContent = " / ";

    const enoLink = document.createElement("button");
    enoLink.type = "button";
    enoLink.className = "chatPostEnoLink button-plain";
    enoLink.textContent =
      typeof post?.authorEno === "number" && post.authorEno > 0
        ? `Eno.${post.authorEno}`
        : "Eno.?";

    if (
      typeof post?.authorEno === "number" &&
      post.authorEno > 0
    ) {
      enoLink.addEventListener("click", () => {
        window.location.href =
          `./profile.html?eno=${encodeURIComponent(post.authorEno)}`;
      });
    } else {
      enoLink.disabled = true;
    }

    nameRow.appendChild(name);
    nameRow.appendChild(enoSeparator);
    nameRow.appendChild(enoLink);
    headerLeft.appendChild(nameRow);
  }

const postMetaTop = document.createElement("div");
postMetaTop.className = "chatPostMetaTop";

const createdAtTopText = document.createElement("span");
createdAtTopText.className = "chatPostCreatedAt";
createdAtTopText.textContent = post.createdAt ?? "";

const postNo = document.createElement("span");
postNo.className = "chatPostNo";

const postNoText = document.createElement("span");
postNoText.textContent = `No.${post.postId}`;

postNo.appendChild(postNoText);

if (post.type === "message") {
  const messageIcon = document.createElement("span");
  messageIcon.className = "chatPostPrivateIcon chatPostMessageIcon";
  messageIcon.textContent = "✉";
  messageIcon.title = "MESSAGE";
  messageIcon.setAttribute("aria-label", "MESSAGE");

  postNo.appendChild(messageIcon);
} else if (post.visibility === "private") {
  const privateIcon = document.createElement("span");
  privateIcon.className = "chatPostPrivateIcon";
  privateIcon.textContent = "🔒";
  privateIcon.title = "秘話";
  privateIcon.setAttribute("aria-label", "秘話");

  postNo.appendChild(privateIcon);
}

postMetaTop.appendChild(createdAtTopText);
postMetaTop.appendChild(postNo);

headerRight.appendChild(postMetaTop);
  header.appendChild(headerLeft);
  header.appendChild(headerRight);

  const divider = document.createElement("div");
  divider.className = "chatPostDivider";

  const body = document.createElement("div");
  body.className = "chatPostBody";

  if (isPreview) {
    body.textContent = getPreviewText(post.body);
  } else {
    renderPostBodyWithQuoteAnchors(body, post, {
      renderRichText,
      getQuotePreviewPostById,
      getPlaceLabel,
      rootPreviewArea: quotePreviewRootArea
    });
  }

  const actions = document.createElement("div");
  actions.className = "chatPostActions";

  if (!isPreview && !post.isDraftPreview && !hideActions && post.type !== "message") {
    const isOwnPost =
      currentEno !== null &&
      currentEno !== undefined &&
      String(post.authorEno) === String(currentEno);

    const replyButton = document.createElement("button");
    replyButton.type = "button";
    replyButton.className = "chatPostActionButton chatPostActionButtonReply button-icon";
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

    let quoteButton = null;

    if (post.visibility !== "private") {
      quoteButton = document.createElement("button");
      quoteButton.type = "button";
      quoteButton.className = "chatPostActionButton chatPostActionButtonQuote button-icon";
      quoteButton.title = "引用";
      quoteButton.setAttribute("aria-label", "引用");

      const quoteIcon = document.createElement("span");
      quoteIcon.className = "chatPostActionIcon chatPostActionIconQuote";
      quoteButton.appendChild(quoteIcon);

      if (typeof onQuote === "function") {
        quoteButton.addEventListener("click", () => {
          onQuote(post);
        });
      }
    }

    const hideButton = document.createElement("button");
    hideButton.type = "button";
    hideButton.className = "chatPostActionButton chatPostActionButtonHide button-icon";
    hideButton.title = "非表示";
    hideButton.setAttribute("aria-label", "非表示");

    const hideIcon = document.createElement("span");
    hideIcon.className = "chatPostActionIcon chatPostActionIconHide";
    hideButton.appendChild(hideIcon);

    if (typeof onHide === "function") {
      hideButton.addEventListener("click", () => {
        onHide(post);
      });
    }

    actions.appendChild(replyButton);

    if (quoteButton) {
      actions.appendChild(quoteButton);
    }

    if (isOwnPost) {
      const deleteButton = document.createElement("button");
      deleteButton.type = "button";
      deleteButton.className = "chatPostActionButton chatPostActionButtonDelete button-icon";
      deleteButton.title = "削除";
      deleteButton.setAttribute("aria-label", "削除");

      const deleteIcon = document.createElement("span");
      deleteIcon.className = "chatPostActionIcon chatPostActionIconDelete";
      deleteButton.appendChild(deleteIcon);
      if (typeof onDelete === "function") {
        deleteButton.addEventListener("click", () => {
          onDelete(post);
        });
      }

      actions.appendChild(deleteButton);
    }

    actions.appendChild(hideButton);
  }
  
  if (!isPreview && !post.isDraftPreview && !hideActions && post.type === "message") {
    const isOwnMessage =
      currentEno !== null &&
      currentEno !== undefined &&
      String(post.authorEno) === String(currentEno);

    if (isOwnMessage) {
      const deleteButton = document.createElement("button");
      deleteButton.type = "button";
      deleteButton.className = "chatPostActionButton chatPostActionButtonDelete button-icon";
      deleteButton.title = "削除";
      deleteButton.setAttribute("aria-label", "削除");

      const deleteIcon = document.createElement("span");
      deleteIcon.className = "chatPostActionIcon chatPostActionIconDelete";
      deleteButton.appendChild(deleteIcon);

      if (typeof onDelete === "function") {
        deleteButton.addEventListener("click", () => {
          onDelete(post);
        });
      }

      actions.appendChild(deleteButton);
    }
  }

const footer = document.createElement("div");
footer.className = "chatPostFooter";

const placeButton = document.createElement("button");
placeButton.type = "button";
placeButton.className = "chatPostPlaceButton button-plain";
placeButton.textContent = getPlaceLabel(post.placeId);

const moveToPlace =
  typeof onMoveToPlace === "function"
    ? onMoveToPlace
    : navigateToChatPlace;

if (post.isDraftPreview) {
  placeButton.disabled = true;
} else if (post.placeId) {
  placeButton.addEventListener("click", () => {
    moveToPlace(post.placeId);
  });
} else {
  placeButton.disabled = true;
}

footer.appendChild(placeButton);

const bottomRow = document.createElement("div");
bottomRow.className = "chatPostBottomRow";

bottomRow.appendChild(footer);
bottomRow.appendChild(actions);

right.appendChild(header);
right.appendChild(divider);
right.appendChild(body);
right.appendChild(bottomRow);

  const contentRow = document.createElement("div");
  contentRow.className = "chatPostCardContentRow";

  if (shouldShowIcon) {
    contentRow.appendChild(left);
  }

contentRow.appendChild(right);

  if (
    !isPreview &&
    typeof getReplyTargetLabels === "function" &&
    hasReplyTarget(post)
  ) {
    const replyTargets = getReplyTargetLabels(post);

    if (Array.isArray(replyTargets) && replyTargets.length > 0) {
      const replyLabelRow = document.createElement("div");
      replyLabelRow.className = "chatPostReplyLabelRow";

      const replyLabelButton = document.createElement("button");
      replyLabelButton.type = "button";
      replyLabelButton.className = "chatPostReplyLabelButton button-link";

      const replyLabel = document.createElement("div");
      replyLabel.className = "chatPostReplyLabel";
      replyLabel.textContent =
        `${replyTargets.map(formatReplyTargetLabel).join("＆")}>>`;

      replyLabelButton.appendChild(replyLabel);

      if (!post.isDraftPreview && typeof onOpenThread === "function") {
        replyLabelButton.addEventListener("click", () => {
          onOpenThread(post);
        });
      } else {
        replyLabelButton.disabled = true;
      }

      replyLabelRow.appendChild(replyLabelButton);
      postBox.appendChild(replyLabelRow);
    }
  }

  postBox.appendChild(contentRow);

  return postBox;
}

export function renderPostListSection(container, options = {}) {
  const {
    posts = [],
    getPlaceLabel,
    onMoveToPlace,
    postActions = {},
    currentEno = null,
    getReplyTargetLabels = null,
    getQuotePreviewPostById = null,
    onAuthorIconClick = null
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
    postActions,
    currentEno,
    getReplyTargetLabels,
    getQuotePreviewPostById,
    onAuthorIconClick
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
    postActions = {},
    currentEno = null,
    getReplyTargetLabels = null,
    getQuotePreviewPostById = null,
    onAuthorIconClick = null
  } = options;

  if (!listContainer) {
    return;
  }

  listContainer.innerHTML = "";

  if (posts.length === 0) {
    const emptyPosts = document.createElement("p");
    emptyPosts.textContent = "表示する投稿がありません";
    listContainer.appendChild(emptyPosts);
    return;
  }

  posts.forEach(post => {
    listContainer.appendChild(
      createPostCard(post, {
        isPreview: post.displayType === "preview",
        getPlaceLabel,
        onMoveToPlace,
        postActions,
        currentEno,
        getReplyTargetLabels,
        getQuotePreviewPostById,
        onAuthorIconClick
      })
    );
  });
}
