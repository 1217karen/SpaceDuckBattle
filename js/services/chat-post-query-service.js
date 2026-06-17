// chat-post-query-service.js

import { getAllPosts } from "./post-service.js";
import { getDisplayPosts } from "../chat/chat-display-rules.js";
import { getHerePosts, getReplyPostsForEno, getSelfPostsForEno, sortPostsNewestFirst, withNormalDisplayType } from "../chat/chat-post-filter.js";

function normalizeEno(eno) {
  const normalizedEno =
    typeof eno === "number"
      ? eno
      : Number(eno || 0);

  return Number.isInteger(normalizedEno) && normalizedEno > 0
    ? normalizedEno
    : 0;
}

function canViewMessagePost(post, viewerEno) {
  const normalizedViewerEno = normalizeEno(viewerEno);

  if (!post || !normalizedViewerEno) {
    return false;
  }

  if (Number(post.authorEno) === normalizedViewerEno) {
    return true;
  }

  if (!Array.isArray(post.visibleToEnoList)) {
    return false;
  }

  return post.visibleToEnoList.some(eno =>
    Number(eno) === normalizedViewerEno
  );
}

function excludeMessagePosts(posts = []) {
  return posts.filter(post => post?.type !== "message");
}

export function getChatTimelinePosts({
  currentPlace = null,
  places = [],
  viewerEno = null
} = {}) {
  return excludeMessagePosts(
    getDisplayPosts({
      currentPlace,
      allPosts: getAllPosts(),
      places,
      viewerEno
    })
  );
}

export function getReplyPostsForViewer({
  viewerEno = null
} = {}) {
  return excludeMessagePosts(
    getReplyPostsForEno(getAllPosts(), viewerEno)
  );
}

export function getSelfPostsForViewer({
  viewerEno = null
} = {}) {
  return excludeMessagePosts(
    getSelfPostsForEno(getAllPosts(), viewerEno)
  );
}

export function getHerePostsForPlace({
  currentPlace = null,
  viewerEno = null
} = {}) {
  return excludeMessagePosts(
    getHerePosts(currentPlace, getAllPosts(), viewerEno)
  );
}

export function getMessagePostsForViewer({
  viewerEno = null
} = {}) {
  return sortPostsNewestFirst(
    withNormalDisplayType(
      getAllPosts().filter(post =>
        post?.type === "message" &&
        !post.isDeleted &&
        canViewMessagePost(post, viewerEno)
      )
    )
  );
}

export function getChatPostsForViewMode({
  viewMode = "chat",
  currentPlace = null,
  places = [],
  viewerEno = null
} = {}) {
  if (viewMode === "reply") {
    return getReplyPostsForViewer({
      viewerEno
    });
  }

  if (viewMode === "message") {
    return getMessagePostsForViewer({
      viewerEno
    });
  }

  if (viewMode === "self") {
    return getSelfPostsForViewer({
      viewerEno
    });
  }

  if (viewMode === "here") {
    return getHerePostsForPlace({
      currentPlace,
      viewerEno
    });
  }

  return getChatTimelinePosts({
    currentPlace,
    places,
    viewerEno
  });
}
