//chat-reply-state.js

export function createReplyStateFromPost(post) {
  if (!post || typeof post.postId !== "number") {
    return {
      fixedReplyTargetEno: null,
      additionalTargetEnoText: "",
      replySourcePostId: null,
      replyParentPostId: null,
      replyThreadRootPostId: null
    };
  }

  const threadRootPostId =
    typeof post.threadRootPostId === "number" && post.threadRootPostId > 0
      ? post.threadRootPostId
      : post.postId;

  const fixedReplyTargetEno =
    typeof post.authorEno === "number" && post.authorEno > 0
      ? post.authorEno
      : null;

  const targetEnoSet = new Set();

  if (fixedReplyTargetEno) {
    targetEnoSet.add(fixedReplyTargetEno);
  }

  if (Array.isArray(post.targetEnoList)) {
    post.targetEnoList.forEach(item => {
      const eno = Number(item);
      if (Number.isInteger(eno) && eno > 0) {
        targetEnoSet.add(eno);
      }
    });
  }

  if (fixedReplyTargetEno) {
    targetEnoSet.delete(fixedReplyTargetEno);
  }

  const additionalTargetEnoText = [...targetEnoSet].join(",");

  return {
    fixedReplyTargetEno,
    additionalTargetEnoText,
    replySourcePostId: post.postId,
    replyParentPostId: post.postId,
    replyThreadRootPostId: threadRootPostId
  };
}

export function clearReplyState(draft = {}) {
  return {
    ...draft,
    fixedReplyTargetEno: null,
    replySourcePostId: null,
    replyParentPostId: null,
    replyThreadRootPostId: null,
    useCurrentPlaceForReply: false
  };
}

export function applyReplyStateToDraft(draft = {}, replyState = {}) {
  return {
    ...draft,
    fixedReplyTargetEno:
      typeof replyState.fixedReplyTargetEno === "number"
        ? replyState.fixedReplyTargetEno
        : null,
    additionalTargetEnoText:
      typeof replyState.additionalTargetEnoText === "string"
        ? replyState.additionalTargetEnoText
        : "",
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
