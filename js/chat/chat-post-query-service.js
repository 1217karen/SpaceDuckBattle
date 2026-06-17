// chat-post-query-service.js

import { getAllPosts } from "./post-service.js";
import { getDisplayPosts } from "../chat/chat-display-rules.js";
import { getHerePosts, getReplyPostsForEno, getSelfPostsForEno } from "../chat/chat-post-filter.js";

export function getChatTimelinePosts({
  currentPlace = null,
  places = [],
  viewerEno = null
} = {}) {
  return getDisplayPosts({
    currentPlace,
    allPosts: getAllPosts(),
    places,
    viewerEno
  });
}

export function getReplyPostsForViewer({
  viewerEno = null
} = {}) {
  return getReplyPostsForEno(getAllPosts(), viewerEno);
}

export function getSelfPostsForViewer({
  viewerEno = null
} = {}) {
  return getSelfPostsForEno(getAllPosts(), viewerEno);
}

export function getHerePostsForPlace({
  currentPlace = null,
  viewerEno = null
} = {}) {
  return getHerePosts(currentPlace, getAllPosts(), viewerEno);
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
