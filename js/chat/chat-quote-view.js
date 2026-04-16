//chat-quote-view.js

import { createPostCard } from "./chat-view.js";

function parseQuotePostIds(text) {
  const source = String(text ?? "");
  const matches = [...source.matchAll(/>>(\d+)/g)];

  return matches.map(match => Number(match[1])).filter(id =>
    Number.isInteger(id) && id > 0
  );
}

function buildQuotePreviewPlaceholder(message) {
  const box = document.createElement("div");
  box.className = "chatQuotePreviewPlaceholder";
  box.textContent = message;
  return box;
}

function buildQuotePreviewCard(post, options = {}) {
  const {
    getPlaceLabel
  } = options;

  const wrapper = document.createElement("div");
  wrapper.className = "chatQuotePreviewCardWrap";

  const card = createPostCard(post, {
    isPreview: false,
    getPlaceLabel,
    onMoveToPlace: null,
    postActions: {},
    currentEno: null,
    hideActions: true,
    getReplyTargetLabels: null
  });

  card.classList.add("chatQuotePreviewCard");
  wrapper.appendChild(card);

  return wrapper;
}

export function renderPostBodyWithQuoteAnchors(bodyElement, post, options = {}) {
  const {
    renderRichText,
    getQuotePreviewPostById,
    getPlaceLabel
  } = options;

  if (!bodyElement) {
    return;
  }

  bodyElement.innerHTML = "";

  const text = String(post?.body ?? "");
  const quoteIds = parseQuotePostIds(text);

  if (quoteIds.length === 0 || typeof renderRichText !== "function") {
    renderRichText(bodyElement, text, { preset: "message" });
    return;
  }

  const previewArea = document.createElement("div");
  previewArea.className = "chatQuotePreviewArea";
  previewArea.hidden = true;

  const parts = text.split(/(>>\d+)/g).filter(part => part !== "");

  parts.forEach(part => {
    const matched = part.match(/^>>(\d+)$/);

    if (!matched) {
      const span = document.createElement("span");
      renderRichText(span, part, { preset: "message" });
      while (span.firstChild) {
        bodyElement.appendChild(span.firstChild);
      }
      return;
    }

    const quotePostId = Number(matched[1]);

    const button = document.createElement("button");
    button.type = "button";
    button.className = "chatQuoteAnchor";
    button.textContent = part;

    button.addEventListener("click", () => {
      if (typeof getQuotePreviewPostById !== "function") {
        return;
      }

      const quotePost = getQuotePreviewPostById(quotePostId);

      if (!quotePost) {
        previewArea.appendChild(
          buildQuotePreviewPlaceholder("引用元の発言が見つかりません。")
        );
      } else if (quotePost.isDeleted) {
        previewArea.appendChild(
          buildQuotePreviewPlaceholder("引用元の発言は削除されています。")
        );
      } else {
        previewArea.appendChild(
          buildQuotePreviewCard(quotePost, {
            getPlaceLabel
          })
        );
      }

      previewArea.hidden = false;
    });

    bodyElement.appendChild(button);
  });

  bodyElement.appendChild(previewArea);
}
