// chat-post-query-service.js

import { getAllPosts } from "./post-service.js";
import { getDisplayPosts } from "../chat/chat-display-rules.js";
import { places } from "../data/places-data.js";
import { isPrivateRoom } from "./room-service.js";
import { canViewPost, getHerePosts, getReplyPostsForEno, getSelfPostsForEno, sortPostsNewestFirst, withNormalDisplayType } from "../chat/chat-post-filter.js";

export function normalizeEno(eno) {
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

function isPrivateRoomPost(post) {
  const place = places.find(item => item.placeId === post?.placeId) || null;
  return isPrivateRoom(place);
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
    getReplyPostsForEno(getAllPosts(), viewerEno).filter(post => !isPrivateRoomPost(post))
  );
}

export function getSelfPostsForViewer({
  viewerEno = null
} = {}) {
  return excludeMessagePosts(
    getReplyPostsForEno(getAllPosts(), viewerEno).filter(post => !isPrivateRoomPost(post))
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

function isMessageBetweenViewerAndEno(post, viewerEno, filterEno) {
  const normalizedViewerEno = normalizeEno(viewerEno);
  const normalizedFilterEno = normalizeEno(filterEno);

  if (!normalizedViewerEno || !normalizedFilterEno) {
    return true;
  }

  const authorEno = normalizeEno(post?.authorEno);
  const visibleToEnoList = Array.isArray(post?.visibleToEnoList)
    ? post.visibleToEnoList.map(eno => normalizeEno(eno))
    : [];

  const fromFilterToViewer =
    authorEno === normalizedFilterEno &&
    visibleToEnoList.includes(normalizedViewerEno);

  const fromViewerToFilter =
    authorEno === normalizedViewerEno &&
    visibleToEnoList.includes(normalizedFilterEno);

  return fromFilterToViewer || fromViewerToFilter;
}

export function getMessagePostsForViewer({
  viewerEno = null,
  filterEno = null
} = {}) {
  return sortPostsNewestFirst(
    withNormalDisplayType(
      getAllPosts().filter(post =>
        post?.type === "message" &&
        !post.isDeleted &&
        canViewMessagePost(post, viewerEno) &&
        isMessageBetweenViewerAndEno(post, viewerEno, filterEno)
      )
    )
  );
}

export function getFavoritePostsForViewer({
  viewerEno = null,
  favoriteEnos = []
} = {}) {
  const normalizedViewerEno = normalizeEno(viewerEno);
  const favoriteEnoSet = new Set(
    (Array.isArray(favoriteEnos) ? favoriteEnos : [])
      .map(eno => normalizeEno(eno))
      .filter(eno => eno > 0 && eno !== normalizedViewerEno)
  );

  if (favoriteEnoSet.size === 0) {
    return [];
  }

  return sortPostsNewestFirst(
    withNormalDisplayType(
      getAllPosts().filter(post => {
        if (!post || post.isDeleted || post.type === "message") {
          return false;
        }

        if (post.visibility === "private" || isPrivateRoomPost(post)) {
          return false;
        }

        const authorEno = normalizeEno(post.authorEno);

        return favoriteEnoSet.has(authorEno);
      })
    )
  );
}

export function getAuthorPostsForViewer({
  targetEno = null,
  viewerEno = null
} = {}) {
  const normalizedTargetEno = normalizeEno(targetEno);

  if (!normalizedTargetEno) {
    return [];
  }

  return sortPostsNewestFirst(
    withNormalDisplayType(
      getAllPosts().filter(post =>
        post &&
        !post.isDeleted &&
        post.type !== "message" &&
        Number(post.authorEno) === normalizedTargetEno &&
        canViewPost(post, viewerEno) &&
        !isPrivateRoomPost(post)
      )
    )
  );
}

export function getChatPostsForViewMode({
  viewMode = "chat",
  currentPlace = null,
  places = [],
  viewerEno = null,
  favoriteEnos = [],
  targetEno = null,
  messageFilterEno = null
} = {}) {
  if (viewMode === "reply") {
    return getReplyPostsForViewer({
      viewerEno
    });
  }

  if (viewMode === "message") {
    return getMessagePostsForViewer({
      viewerEno,
      filterEno: messageFilterEno
    });
  }

  if (viewMode === "favorite") {
    return getFavoritePostsForViewer({
      viewerEno,
      favoriteEnos
    });
  }

  if (viewMode === "self") {
    return getSelfPostsForViewer({
      viewerEno
    });
  }

  if (viewMode === "eno") {
    return getAuthorPostsForViewer({
      targetEno,
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
