//chat-view.js

import { renderRichText } from "../common/rich-text.js";

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
    getPlaceLabel
  } = options;

  const postBox = document.createElement("div");
  postBox.className = isPreview
    ? "chatPostCard chatPostCardPreview"
    : "chatPostCard";

  const left = document.createElement("div");
  left.className = "chatPostCardLeft";

  const right = document.createElement("div");
  right.className = "chatPostCardRight";

  if (!isPreview) {
    const iconBox = document.createElement("div");
    iconBox.className = "chatPostIcon";
    iconBox.textContent = "□";
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

  if (!isPreview) {
    const replyButton = document.createElement("button");
    replyButton.type = "button";
    replyButton.className = "chatPostActionButton";
    replyButton.textContent = "返信";

    const quoteButton = document.createElement("button");
    quoteButton.type = "button";
    quoteButton.className = "chatPostActionButton";
    quoteButton.textContent = "引用";

    actions.appendChild(replyButton);
    actions.appendChild(quoteButton);
  }

  const footer = document.createElement("div");
  footer.className = "chatPostFooter";
  footer.textContent = `${post.createdAt} / ${getPlaceLabel(post.placeId)}`;

  right.appendChild(header);
  right.appendChild(divider);
  right.appendChild(body);
  right.appendChild(actions);
  right.appendChild(footer);

  postBox.appendChild(left);
  postBox.appendChild(right);

  return postBox;
}
