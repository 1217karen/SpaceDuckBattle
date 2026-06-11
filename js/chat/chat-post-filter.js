//chat-post-filter.js

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

export function sortPostsNewestFirst(posts = []) {
  return posts.slice().sort((a, b) => b.postId - a.postId);
}

export function getHerePosts(currentPlace, allPosts = []) {
  if (!currentPlace?.placeId) {
    return [];
  }

  return sortPostsNewestFirst(
    withNormalDisplayType(
      allPosts.filter(post =>
        post.placeId === currentPlace.placeId &&
        !post.isDeleted
      )
    )
  );
}

export function getReplyPostsForEno(allPosts = [], eno) {
  const normalizedEno =
    typeof eno === "number"
      ? eno
      : Number(eno || 0);

  if (!normalizedEno) {
    return [];
  }

  return sortPostsNewestFirst(
    withNormalDisplayType(
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
      })
    )
  );
}

export function getSelfPostsForEno(allPosts = [], eno) {
  const normalizedEno =
    typeof eno === "number"
      ? eno
      : Number(eno || 0);

  if (!normalizedEno) {
    return [];
  }

  return sortPostsNewestFirst(
    withNormalDisplayType(
      allPosts.filter(post =>
        !post.isDeleted &&
        Number(post.authorEno) === normalizedEno
      )
    )
  );
}

export function getThreadDisplayPosts(threadPosts = [], hiddenPostIds = null) {
  return filterHiddenPosts(
    withNormalDisplayType(threadPosts),
    hiddenPostIds
  );
}
