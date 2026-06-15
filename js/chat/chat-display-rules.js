// chat-post-filter.js

export function withNormalDisplayType(posts = []) {
  return posts.map(post => ({
    ...post,
    displayType: "normal"
  }));
}

export function filterHiddenPosts(posts = [], hiddenPostIds) {
  if (!hiddenPostIds) {
    return posts;
  }

  return posts.filter(post =>
    !hiddenPostIds.has(post.postId)
  );
}

function normalizeEno(eno) {
  const normalizedEno =
    typeof eno === "number"
      ? eno
      : Number(eno || 0);

  return Number.isInteger(normalizedEno) && normalizedEno > 0
    ? normalizedEno
    : 0;
}

export function canViewPost(post, viewerEno) {
  if (!post) {
    return false;
  }

  if (post.visibility !== "private") {
    return true;
  }

  const normalizedViewerEno = normalizeEno(viewerEno);

  if (!normalizedViewerEno) {
    return false;
  }

  if (!Array.isArray(post.visibleToEnoList)) {
    return false;
  }

  return post.visibleToEnoList.some(eno =>
    Number(eno) === normalizedViewerEno
  );
}

export function filterVisiblePosts(posts = [], viewerEno) {
  return posts.filter(post =>
    canViewPost(post, viewerEno)
  );
}

export function sortPostsNewestFirst(posts = []) {
  return posts.slice().sort((a, b) => b.postId - a.postId);
}

export function getHerePosts(currentPlace, allPosts = [], viewerEno = null) {
  if (!currentPlace?.placeId) {
    return [];
  }

  return sortPostsNewestFirst(
    withNormalDisplayType(
      filterVisiblePosts(
        allPosts.filter(post =>
          post.placeId === currentPlace.placeId &&
          !post.isDeleted
        ),
        viewerEno
      )
    )
  );
}

export function getReplyPostsForEno(allPosts = [], eno) {
  const normalizedEno = normalizeEno(eno);

  if (!normalizedEno) {
    return [];
  }

  return sortPostsNewestFirst(
    withNormalDisplayType(
      filterVisiblePosts(
        allPosts.filter(post => {
          if (post?.isDeleted) {
            return false;
          }

          if (!Array.isArray(post?.targetEnoList)) {
            return false;
          }

          return post.targetEnoList.some(item =>
            Number(item) === normalizedEno
          );
        }),
        normalizedEno
      )
    )
  );
}

export function getSelfPostsForEno(allPosts = [], eno) {
  const normalizedEno = normalizeEno(eno);

  if (!normalizedEno) {
    return [];
  }

  return sortPostsNewestFirst(
    withNormalDisplayType(
      filterVisiblePosts(
        allPosts.filter(post =>
          !post.isDeleted &&
          Number(post.authorEno) === normalizedEno
        ),
        normalizedEno
      )
    )
  );
}

export function getThreadDisplayPosts(
  threadPosts = [],
  hiddenPostIds = null,
  viewerEno = null
) {
  return filterHiddenPosts(
    withNormalDisplayType(
      filterVisiblePosts(threadPosts, viewerEno)
    ),
    hiddenPostIds
  );
}
