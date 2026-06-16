//chat-post-action-helpers.js


import { deletePost, getPostForQuotePreviewById } from "../services/post-service.js";
import { showToast } from "../common/toast.js";
import { loadCharacter } from "../services/storage-service.js";


export function createDeleteHandler({ currentEno, rerender }) {
  return function handleDelete(post) {
    if (!post || typeof post.postId !== "number") {
      return;
    }

    const ok = window.confirm("この発言を削除しますか？");
    if (!ok) {
      return;
    }

    deletePost(post.postId, currentEno);

    if (typeof rerender === "function") {
      rerender();
    }

    showToast("発言を削除しました", { type: "success" });
  };
}

export function createHideHandler({ hiddenPostIds, rerender }) {
  return function handleHide(post) {
    if (!post || typeof post.postId !== "number") {
      return;
    }

    hiddenPostIds.add(post.postId);

    if (typeof rerender === "function") {
      rerender();
    }

    showToast("発言を非表示にしました", { type: "info" });
  };
}

export function getQuotePreviewPostById(postId) {
  return getPostForQuotePreviewById(postId);
}

export function createQuoteHandler({ composerRefs }) {
  return function handleQuote(post) {
    if (!post || !composerRefs?.textarea) {
      return;
    }

    const quoteText = `>>${post.postId}`;

    const textarea = composerRefs.textarea;
    const start = textarea.selectionStart ?? textarea.value.length;
    const end = textarea.selectionEnd ?? textarea.value.length;
    const before = textarea.value.slice(0, start);
    const after = textarea.value.slice(end);

    const needsLeadingSpace =
      before.length > 0 &&
      !before.endsWith("\n") &&
      !before.endsWith(" ");

    const needsTrailingSpace =
      after.length > 0 &&
      !after.startsWith("\n") &&
      !after.startsWith(" ");

    const insertText =
      `${needsLeadingSpace ? " " : ""}${quoteText}${needsTrailingSpace ? " " : ""}`;

    textarea.value = `${before}${insertText}${after}`;

    const nextCaretPosition = before.length + insertText.length;
    textarea.focus();
    textarea.setSelectionRange(nextCaretPosition, nextCaretPosition);

    textarea.dispatchEvent(new Event("input", { bubbles: true }));
  };
}

export function createPostActions(actions = {}) {
  return {
    onReply:
      typeof actions.onReply === "function"
        ? actions.onReply
        : null,
    onDelete:
      typeof actions.onDelete === "function"
        ? actions.onDelete
        : null,
    onOpenThread:
      typeof actions.onOpenThread === "function"
        ? actions.onOpenThread
        : null,
    onQuote:
      typeof actions.onQuote === "function"
        ? actions.onQuote
        : null,
    onHide:
      typeof actions.onHide === "function"
        ? actions.onHide
        : null
  };
}

export function openThreadFromPost(post, fallbackPlaceId = "F1-1") {
  if (!post) {
    return;
  }

  const threadRootPostId =
    typeof post.threadRootPostId === "number" && post.threadRootPostId > 0
      ? post.threadRootPostId
      : post.postId;

  const placeId =
    typeof post.placeId === "string" && post.placeId.trim() !== ""
      ? post.placeId
      : fallbackPlaceId;

  window.location.href =
    `./chat-thread.html?placeId=${encodeURIComponent(placeId)}&threadRootPostId=${encodeURIComponent(threadRootPostId)}`;
}

export function getReplyTargetLabels(post) {
  if (!post) {
    return [];
  }

  const targetEnoSet = new Set();

  if (Array.isArray(post.targetEnoList)) {
    post.targetEnoList.forEach(item => {
      const eno = Number(item);
      if (Number.isInteger(eno) && eno > 0) {
        targetEnoSet.add(eno);
      }
    });
  }

  if (
    targetEnoSet.size === 0 &&
    typeof post.authorEno === "number" &&
    post.authorEno > 0
  ) {
    targetEnoSet.add(post.authorEno);
  }

  return [...targetEnoSet].map(eno => {
    const character = loadCharacter(eno);
    const defaultName =
      typeof character?.defaultName === "string" && character.defaultName.trim() !== ""
        ? character.defaultName.trim()
        : "";

    return {
      eno,
      name: defaultName
    };
  });
}
