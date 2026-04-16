//chat-thread-view.js


export function getThreadRootPostIdFromQuery() {
  const params = new URLSearchParams(window.location.search);
  const value = Number(params.get("threadRootPostId") || 0);

  if (!Number.isInteger(value) || value <= 0) {
    return null;
  }

  return value;
}

export function getThreadPosts(allPosts = [], threadRootPostId = null) {
  if (!threadRootPostId) {
    return [];
  }

  return allPosts
    .filter(post => {
      if (!post || post.isDeleted) {
        return false;
      }

      if (post.postId === threadRootPostId) {
        return true;
      }

      return post.threadRootPostId === threadRootPostId;
    })
    .sort((a, b) => a.postId - b.postId);
}

export function buildThreadViewLabel(rootPost) {
  if (!rootPost) {
    return "ツリー表示";
  }

  return `ツリー表示 / No.${rootPost.postId}`;
}
