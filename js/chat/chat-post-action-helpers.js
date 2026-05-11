//chat-post-action-helpers.js


import { deletePost, getAllPostsIncludingDeleted } from "../services/post-service.js";
import { showToast } from "../common/toast.js";

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
  const allPostsIncludingDeleted = getAllPostsIncludingDeleted();
  return allPostsIncludingDeleted.find(post => post.postId === postId) || null;
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
