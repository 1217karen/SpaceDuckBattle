//chat-reply-state.js

export function createReplyStateFromPost(post) {
  if (!post || typeof post.postId !== "number") {
    return {
      replySourcePostId: null,
      replyParentPostId: null,
      replyThreadRootPostId: null
    };
  }

  const threadRootPostId =
    typeof post.threadRootPostId === "number" && post.threadRootPostId > 0
      ? post.threadRootPostId
      : post.postId;

  return {
    replySourcePostId: post.postId,
    replyParentPostId: post.postId,
    replyThreadRootPostId: threadRootPostId
  };
}

export function clearReplyState(draft = {}) {
  return {
    ...draft,
    replySourcePostId: null,
    replyParentPostId: null,
    replyThreadRootPostId: null,
    useCurrentPlaceForReply: false
  };
}

export function applyReplyStateToDraft(draft = {}, replyState = {}) {
  return {
    ...draft,
    replySourcePostId:
      typeof replyState.replySourcePostId === "number"
        ? replyState.replySourcePostId
        : null,
    replyParentPostId:
      typeof replyState.replyParentPostId === "number"
        ? replyState.replyParentPostId
        : null,
    replyThreadRootPostId:
      typeof replyState.replyThreadRootPostId === "number"
        ? replyState.replyThreadRootPostId
        : null
  };
}

export function findReplySourcePost(allPosts = [], draft = {}) {
  const replySourcePostId =
    typeof draft.replySourcePostId === "number"
      ? draft.replySourcePostId
      : Number(draft.replySourcePostId || 0);

  if (!replySourcePostId) {
    return null;
  }

  return allPosts.find(post => post.postId === replySourcePostId) || null;
}

export function hasReplyState(draft = {}) {
  return Boolean(
    draft.replySourcePostId &&
    draft.replyParentPostId &&
    draft.replyThreadRootPostId
  );
}
